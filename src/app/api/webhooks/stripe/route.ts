// src/app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import nodemailer from 'nodemailer';
import { db } from '@/lib/db';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
});

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

export async function POST(request: NextRequest) {
  console.log('🔴 WEBHOOK ENDPOINT HIT!');

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
    console.error('❌ Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  console.log('📨 Received Stripe webhook event:', event.type);

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;

    console.log('✅ Payment succeeded for:', paymentIntent.id);
    console.log('📋 Metadata:', paymentIntent.metadata);

    try {
      const { jobId, printerId, customerName, customerEmail, fileName, copies, colorType, doubleSided } = paymentIntent.metadata;

      const printOrder = await db.printOrder.update({
        where: { id: jobId },
        data: {
          paymentStatus: 'paid',
          status: 'processing',
          paidAt: new Date(),
          paymentIntentId: paymentIntent.id,
        },
      });

      console.log('✅ Updated print order status to paid');

      const printer = await db.printer.findUnique({
        where: { id: printerId }
      });

      if (!printer) {
        console.error('❌ Printer not found');
        return NextResponse.json({ error: 'Printer not found' }, { status: 404 });
      }

      const amount = (paymentIntent.amount / 100).toFixed(2);

      // === FETCH FILE FROM SUPABASE STORAGE URL ===
      console.log('📥 Fetching file from:', printOrder.fileUrl);
      
      const fileResponse = await fetch(printOrder.fileUrl);
      if (!fileResponse.ok) {
        throw new Error(`Failed to fetch file: ${fileResponse.statusText}`);
      }
      
      const fileBuffer = Buffer.from(await fileResponse.arrayBuffer());
      console.log('✅ File fetched from Supabase');
      console.log('📎 File size:', fileBuffer.length, 'bytes');
      // === END FILE FETCH ===

      // ======================================== 
      // EMAIL 1: Send to PRINTER - SIMPLIFIED
      // ========================================
      const printerEmailSubject = `Print Job ${jobId}`;
      const printerEmailBody = `Please print this document.

Job: ${jobId}
Color: ${colorType === 'bw' ? 'Black and White' : 'Color'}
Sides: ${doubleSided === 'true' ? 'Double-Sided' : 'Single-Sided'}
Copies: ${copies}

Customer: ${customerName}`;

      console.log('📧 Sending email to PRINTER:', printer.printerEmail);

      const printerEmailResult = await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: printer.printerEmail,
        subject: printerEmailSubject,
        text: printerEmailBody,
        attachments: [
          {
            filename: fileName,
            content: fileBuffer,
            contentType: 'application/pdf',
          }
        ]
      });

      console.log('✅ Email sent to PRINTER:', printerEmailResult.messageId);

      // ======================================== 
      // EMAIL 2: Send CONFIRMATION to CUSTOMER
      // ========================================
      const customerEmailSubject = `✅ Payment Successful - Print Job ${jobId}`;
      const customerEmailBody = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #10b981;">✅ Payment Successful!</h2>
  <p>Your document is being printed</p>
  
  <h3>📄 Job Details</h3>
  <p><strong>Job ID:</strong> ${jobId}</p>
  <p><strong>Document:</strong> ${fileName}</p>
  <p><strong>Copies:</strong> ${copies}</p>
  <p><strong>Amount Paid:</strong> ₹${amount}</p>
  <p><strong>Status:</strong> PAID & PRINTING</p>
  
  <h3>📍 Pickup Location</h3>
  <p>${printer.printerName}<br>${printer.location}</p>
  
  <h3>ℹ️ What's Next?</h3>
  <p>Your document is being printed now. It will be ready for pickup shortly!</p>
  
  <p style="color: #666; font-size: 12px;">Payment ID: ${paymentIntent.id}</p>
</div>
      `;

      console.log('📧 Sending confirmation email to CUSTOMER:', customerEmail);

      await transporter.sendMail({
        from: `"Printqr Service" <${process.env.EMAIL_USER}>`,
        to: customerEmail,
        subject: customerEmailSubject,
        html: customerEmailBody,
      });

      console.log('✅ Confirmation email sent to CUSTOMER successfully');

      return NextResponse.json({
        received: true,
        jobId,
        status: 'Both emails sent successfully'
      });

    } catch (error) {
      console.error('❌ Error processing webhook:', error);
      return NextResponse.json(
        { error: 'Webhook processing failed' },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ received: true });
}