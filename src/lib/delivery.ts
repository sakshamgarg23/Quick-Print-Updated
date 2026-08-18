import { db } from './db';
import { sendPrinterJobEmail, sendCustomerConfirmationEmail } from './mailer';

export const MAX_DELIVERY_ATTEMPTS = 5;

/** Exponential backoff in minutes, capped at 30: 2, 4, 8, 16, 30... */
export function computeNextRetryDelayMs(attemptNumber: number): number {
  const minutes = Math.min(30, 2 ** attemptNumber);
  return minutes * 60 * 1000;
}

/**
 * Fetches the uploaded file, emails it to the printer, and confirms with the
 * customer. Throws on any failure so callers can record/retry it. Skips
 * re-sending the printer email if it already went out (emailSentAt set) so a
 * retry after a partial failure can't trigger a duplicate physical print.
 */
export async function deliverPrintOrder(orderId: string): Promise<void> {
  const order = await db.printOrder.findUniqueOrThrow({ where: { id: orderId } });
  const printer = await db.printer.findUniqueOrThrow({ where: { id: order.printerId } });

  if (!order.emailSentAt) {
    const fileResponse = await fetch(order.fileUrl);
    if (!fileResponse.ok) {
      throw new Error(`Failed to fetch file: ${fileResponse.statusText}`);
    }
    const fileBuffer = Buffer.from(await fileResponse.arrayBuffer());

    await sendPrinterJobEmail(printer, order, fileBuffer);
    await db.printOrder.update({ where: { id: order.id }, data: { emailSentAt: new Date() } });
  }

  await sendCustomerConfirmationEmail(printer, order);

  await db.printOrder.update({
    where: { id: order.id },
    data: { status: 'completed', completedAt: new Date(), lastDeliveryError: null },
  });
}

export type DeliveryResult =
  | { success: true }
  | { success: false; error: string; exhausted: boolean };

/** Runs deliverPrintOrder and records the outcome (success, or a scheduled/exhausted retry) on the order. */
export async function attemptDelivery(orderId: string): Promise<DeliveryResult> {
  try {
    await deliverPrintOrder(orderId);
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown delivery error';
    const order = await db.printOrder.findUnique({ where: { id: orderId } });
    const attempts = (order?.deliveryAttempts ?? 0) + 1;
    const exhausted = attempts >= MAX_DELIVERY_ATTEMPTS;

    await db.printOrder.update({
      where: { id: orderId },
      data: {
        deliveryAttempts: attempts,
        lastDeliveryError: message,
        status: exhausted ? 'failed' : 'processing',
        nextRetryAt: exhausted ? null : new Date(Date.now() + computeNextRetryDelayMs(attempts)),
      },
    });

    return { success: false, error: message, exhausted };
  }
}
