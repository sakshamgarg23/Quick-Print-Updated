// src/app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/lib/db';
import { attemptDelivery } from '@/lib/delivery';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
});

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const { jobId } = paymentIntent.metadata;

    try {
      await db.printOrder.update({
        where: { id: jobId },
        data: {
          paymentStatus: 'paid',
          status: 'processing',
          paidAt: new Date(),
          paymentIntentId: paymentIntent.id,
        },
      });
    } catch (error) {
      console.error('Failed to mark order paid:', error);
      // Tell Stripe to retry the webhook itself — we couldn't even record the payment.
      return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 });
    }

    // Delivery (email to printer + customer) has its own retry system
    // (deliveryAttempts/nextRetryAt, polled by /api/internal/retry-failed-jobs),
    // so a delivery failure here is not a webhook failure — always ack Stripe.
    const result = await attemptDelivery(jobId);
    if (!result.success) {
      console.error(`Delivery failed for ${jobId}, will retry: ${result.error}`);
    }

    return NextResponse.json({ received: true, jobId, delivered: result.success });
  }

  return NextResponse.json({ received: true });
}
