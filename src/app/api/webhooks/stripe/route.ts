import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { completePaidOrder } from '@/lib/paymentCompletion';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
});

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing Stripe signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
  }

  if (event.type !== 'payment_intent.succeeded') {
    return NextResponse.json({ received: true });
  }

  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  const { jobId } = paymentIntent.metadata;
  if (!jobId) {
    return NextResponse.json({ error: 'Payment is missing a job ID' }, { status: 400 });
  }

  let completion;
  try {
    completion = await completePaidOrder(jobId, paymentIntent.id);
  } catch (error) {
    console.error('Failed to complete paid order:', error);
    return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 });
  }

  if (!completion.claimed) {
    return NextResponse.json({ received: true, jobId, alreadyProcessed: true });
  }

  if (!completion.delivery.success) {
    console.error(`Delivery failed for ${jobId}, will retry: ${completion.delivery.error}`);
  }

  return NextResponse.json({ received: true, jobId, delivered: completion.delivery.success });
}
