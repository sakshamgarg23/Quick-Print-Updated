import { db } from './db';
import { attemptDelivery, type DeliveryResult } from './delivery';

export type PaymentCompletionResult =
  | { claimed: true; delivery: DeliveryResult }
  | { claimed: false; delivery: null };

/** Records payment and lets exactly one competing callback start delivery. */
export async function completePaidOrder(
  orderId: string,
  paymentIntentId: string,
): Promise<PaymentCompletionResult> {
  const claimed = await db.printOrder.updateMany({
    where: { id: orderId, paymentStatus: { not: 'paid' } },
    data: {
      paymentStatus: 'paid',
      status: 'processing',
      paidAt: new Date(),
      paymentIntentId,
    },
  });

  if (claimed.count === 0) return { claimed: false, delivery: null };
  return { claimed: true, delivery: await attemptDelivery(orderId) };
}
