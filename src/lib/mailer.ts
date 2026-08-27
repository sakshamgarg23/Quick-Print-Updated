import nodemailer from 'nodemailer';
import type { Printer, PrintOrder } from '@prisma/client';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

export async function sendPrinterJobEmail(printer: Printer, order: PrintOrder, fileBuffer: Buffer) {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: printer.printerEmail,
    subject: `Print Job ${order.id}`,
    text: `Please print this document.

Job: ${order.id}
Color: ${order.colorMode === 'bw' ? 'Black and White' : 'Color'}
Sides: ${order.isDoubleSided ? 'Double-Sided' : 'Single-Sided'}
Copies: ${order.numCopies}

Customer: ${order.userEmail ?? 'unknown'}`,
    attachments: [
      {
        filename: order.fileName,
        content: fileBuffer,
        contentType: order.fileType,
      },
    ],
  });
}

export async function sendCustomerConfirmationEmail(printer: Printer, order: PrintOrder) {
  if (!order.userEmail) return;

  const amount = Number(order.totalAmount).toFixed(2);

  await transporter.sendMail({
    from: `"QuickPrint" <${process.env.EMAIL_USER}>`,
    to: order.userEmail,
    subject: `Payment Successful - Print Job ${order.id}`,
    html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #16a34a;">Payment successful</h2>
  <p>Your document is being printed.</p>

  <h3>Job details</h3>
  <p><strong>Job ID:</strong> ${order.id}</p>
  <p><strong>Document:</strong> ${order.fileName}</p>
  <p><strong>Copies:</strong> ${order.numCopies}</p>
  <p><strong>Amount paid:</strong> ₹${amount}</p>

  <h3>Pickup location</h3>
  <p>${printer.printerName}<br>${printer.location ?? ''}</p>

  <p>Your document is being printed now. It will be ready for pickup shortly.</p>

  <p style="color: #666; font-size: 12px;">Payment ID: ${order.paymentIntentId ?? ''}</p>
</div>
    `,
  });
}
