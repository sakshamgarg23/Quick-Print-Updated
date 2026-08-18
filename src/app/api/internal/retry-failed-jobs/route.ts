import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { attemptDelivery, MAX_DELIVERY_ATTEMPTS } from '@/lib/delivery';

/**
 * Polled by a scheduler (Vercel Cron, see vercel.json) instead of a
 * long-running queue worker, since this app runs on Vercel serverless where
 * nothing can stay resident to consume a live queue.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers.get('authorization');

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const dueOrders = await db.printOrder.findMany({
    where: {
      status: 'processing',
      paymentStatus: 'paid',
      deliveryAttempts: { lt: MAX_DELIVERY_ATTEMPTS },
      OR: [{ nextRetryAt: null }, { nextRetryAt: { lte: new Date() } }],
    },
    orderBy: { createdAt: 'asc' },
    take: 25,
  });

  const results = [];
  for (const order of dueOrders) {
    const result = await attemptDelivery(order.id);
    results.push({ orderId: order.id, ...result });
  }

  return NextResponse.json({ checked: dueOrders.length, results });
}
