import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { z } from 'zod';
import { db } from '@/lib/db';
import { completePaidOrder } from '@/lib/paymentCompletion';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
});

const requestSchema = z.object({ jobId: z.string().min(1) });

/** Browser fallback when Stripe's webhook is delayed or misconfigured. */
export async function POST(request: NextRequest) {
  const parsed = requestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'A valid job ID is required' }, { status: 400 });
  }

  const order = await db.printOrder.findUnique({
    where: { id: parsed.data.jobId },
    select: { id: true, paymentIntentId: true, status: true },
  });

  if (!order?.paymentIntentId) {
    return NextResponse.json({ error: 'Print job not found' }, { status: 404 });
  }

  const paymentIntent = await stripe.paymentIntents.retrieve(order.paymentIntentId);
  if (paymentIntent.status !== 'succeeded' || paymentIntent.metadata.jobId !== order.id) {
    return NextResponse.json({ error: 'Payment has not been confirmed' }, { status: 409 });
  }

  const result = await completePaidOrder(order.id, paymentIntent.id);
  if (!result.claimed) {
    return NextResponse.json({ success: true, alreadyProcessed: true, status: order.status });
  }

  if (!result.delivery.success) {
    return NextResponse.json(
      { success: false, paymentConfirmed: true, error: 'Payment succeeded, but sending the document failed. The job is queued for retry.' },
      { status: 202 },
    );
  }

  return NextResponse.json({ success: true, delivered: true });
}
