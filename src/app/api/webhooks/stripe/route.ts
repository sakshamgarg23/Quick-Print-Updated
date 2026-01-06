// src/app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import nodemailer from 'nodemailer';
import { db }  from '@/lib/db';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover', // ← Matching your version
});

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
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
    console.error('❌ Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  console.log('📨 Received Stripe webhook event:', event.type);

  // Handle successful payment
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    
    console.log('✅ Payment succeeded for:', paymentIntent.id);
    console.log('📋 Metadata:', paymentIntent.metadata);

    try {
      const { 
        jobId, 
        printerId, 
        customerName, 
        customerEmail, 
        fileName,
        copies,
        colorType,
        doubleSided 
      } = paymentIntent.metadata;

      // Update print order status to paid
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

      // Fetch printer details
      const printer = await db.printer.findUnique({
        where: { id: printerId }
      });

      if (!printer) {
        console.error('❌ Printer not found');
        return NextResponse.json({ error: 'Printer not found' }, { status: 404 });
      }

      const amount = (paymentIntent.amount / 100).toFixed(2);

      // ========================================
      // EMAIL 1: Send to PRINTER
      // ========================================
      const printerEmailSubject = `🖨️ NEW PAID PRINT JOB - ${jobId}`;
      const printerEmailBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
    .job-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e9ecef; }
    .label { font-weight: bold; color: #495057; }
    .value { color: #212529; }
    .print-settings { background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107; }
    .customer-info { background: #d1ecf1; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #17a2b8; }
    .alert { background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 8px; margin: 20px 0; }
    .paid-badge { background: #10b981; color: white; padding: 8px 20px; border-radius: 20px; font-weight: bold; display: inline-block; margin-top: 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 28px;">✅ PAID PRINT REQUEST</h1>
      <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">Job ID: ${jobId}</p>
      <span class="paid-badge">PAYMENT RECEIVED ₹${amount}</span>
    </div>
    
    <div class="content">
      <div class="alert">
        <strong>⚡ URGENT - PRINT NOW:</strong> Payment has been received. Please print this document immediately.
      </div>

      <div class="print-settings">
        <h2 style="margin-top: 0; color: #856404;">🖨️ Print Settings</h2>
        <div class="detail-row">
          <span class="label">Color Mode:</span>
          <span class="value"><strong>${colorType === 'bw' ? 'Black & White' : 'Color'}</strong></span>
        </div>
        <div class="detail-row">
          <span class="label">Print Sides:</span>
          <span class="value"><strong>${doubleSided === 'true' ? 'Double-Sided (Duplex)' : 'Single-Sided'}</strong></span>
        </div>
        <div class="detail-row">
          <span class="label">Number of Copies:</span>
          <span class="value"><strong>${copies}</strong></span>
        </div>
        <div class="detail-row" style="border-bottom: none;">
          <span class="label">Document Name:</span>
          <span class="value"><strong>${fileName}</strong></span>
        </div>
      </div>

      <div class="customer-info">
        <h2 style="margin-top: 0; color: #0c5460;">👤 Customer Information</h2>
        <div class="detail-row">
          <span class="label">Name:</span>
          <span class="value">${customerName}</span>
        </div>
        <div class="detail-row" style="border-bottom: none;">
          <span class="label">Email:</span>
          <span class="value">${customerEmail}</span>
        </div>
      </div>

      <div class="job-details">
        <h2 style="margin-top: 0; color: #10b981;">💰 Payment Confirmed</h2>
        <div class="detail-row">
          <span class="label">Amount Paid:</span>
          <span class="value" style="font-size: 24px; color: #10b981;"><strong>₹${amount}</strong></span>
        </div>
        <div class="detail-row" style="border-bottom: none;">
          <span class="label">Payment ID:</span>
          <span class="value" style="font-family: monospace; font-size: 11px;">${paymentIntent.id}</span>
        </div>
      </div>

      <div style="background: #e7f3ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #004085;">📋 Instructions:</h3>
        <ol style="margin: 10px 0; padding-left: 20px; color: #004085;">
          <li>Check attached document below</li>
          <li>Configure printer with settings above</li>
          <li>Print ${copies} cop${parseInt(copies) > 1 ? 'ies' : 'y'}</li>
          <li>Notify customer: ${customerEmail}</li>
        </ol>
      </div>

      <p style="text-align: center; color: #6c757d; margin-top: 30px; font-size: 12px;">
        <strong>Printer:</strong> ${printer.printerName} | <strong>Location:</strong> ${printer.location}
      </p>
    </div>
  </div>
</body>
</html>
      `;

      console.log('📧 Sending email to PRINTER:', printer.printerEmail);

      await transporter.sendMail({
        from: `"Printqr Service" <${process.env.EMAIL_USER}>`,
        to: printer.printerEmail,
        subject: printerEmailSubject,
        html: printerEmailBody,
        // TODO: Add file attachment here when you implement file storage
      });

      console.log('✅ Email sent to PRINTER successfully');

      // ========================================
      // EMAIL 2: Send CONFIRMATION to CUSTOMER
      // ========================================
      const customerEmailSubject = `✅ Payment Successful - Print Job ${jobId}`;
      const customerEmailBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
    .success-icon { font-size: 48px; margin: 20px 0; }
    .details-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e9ecef; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="success-icon">✅</div>
      <h1 style="margin: 0; font-size: 28px;">Payment Successful!</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">Your document is being printed</p>
    </div>
    
    <div class="content">
      <p>Hi <strong>${customerName}</strong>,</p>
      <p>Thank you for your payment! Your document is now being printed at <strong>${printer.printerName}</strong>.</p>
      
      <div class="details-box">
        <h3 style="margin-top: 0; color: #667eea;">📄 Job Details</h3>
        <div class="detail-row">
          <span>Job ID:</span>
          <strong>${jobId}</strong>
        </div>
        <div class="detail-row">
          <span>Document:</span>
          <strong>${fileName}</strong>
        </div>
        <div class="detail-row">
          <span>Copies:</span>
          <strong>${copies}</strong>
        </div>
        <div class="detail-row">
          <span>Amount Paid:</span>
          <strong style="color: #10b981;">₹${amount}</strong>
        </div>
        <div class="detail-row" style="border-bottom: none;">
          <span>Status:</span>
          <strong style="color: #10b981;">PAID & PRINTING</strong>
        </div>
      </div>

      <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107;">
        <h4 style="margin-top: 0; color: #856404;">📍 Pickup Location</h4>
        <p style="margin: 5px 0;"><strong>${printer.printerName}</strong></p>
        <p style="margin: 5px 0;">${printer.location}</p>
      </div>

      <div style="background: #d1ecf1; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #17a2b8;">
        <p style="margin: 0;"><strong>ℹ️ What's Next?</strong></p>
        <p style="margin: 5px 0;">Your document is being printed now. It will be ready for pickup shortly!</p>
      </div>

      <p style="text-align: center; color: #6c757d; margin-top: 30px; font-size: 12px;">
        Questions? Reply to this email<br>
        Payment ID: ${paymentIntent.id}
      </p>
    </div>
  </div>
</body>
</html>
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