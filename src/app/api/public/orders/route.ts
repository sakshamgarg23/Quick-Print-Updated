import { NextRequest, NextResponse } from 'next/server';
import { db, isConnectionError, getDatabaseErrorMessage } from '@/lib/db';
import Stripe from 'stripe';
import { v4 as uuidv4 } from 'uuid';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-12-15.clover' });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { printerId, fileId, settings, userEmail, userPhone } = body;

    const printer = await db.printer.findUnique({ where: { id: printerId } });
    if (!printer) {
      return NextResponse.json({ success: false, error: 'Printer not found' }, { status: 404 });
    }

    const pricePerPage = settings.colorMode === 'color' 
      ? (settings.isDoubleSided ? Number(printer.priceColorDouble) : Number(printer.priceColorSingle))
      : (settings.isDoubleSided ? Number(printer.priceBwDouble) : Number(printer.priceBwSingle));
    
    const totalPages = 5;
    const totalPagesCharged = totalPages * settings.numCopies;
    const subtotal = pricePerPage * totalPagesCharged;
    const platformFee = 0.50;
    const total = subtotal + platformFee;

    const orderId = uuidv4();
    const orderNumber = `PRT-${Date.now()}`;

    const order = await db.printOrder.create({
      data: {
        id: orderId,
        orderNumber,
        printerId,
        userEmail,
        userPhone,
        fileUrl: `https://example.com/file-${fileId}`,
        fileName: 'document.pdf',
        fileType: 'pdf',
        fileSizeBytes: BigInt(1024),
        totalPages,
        colorMode: settings.colorMode,
        isDoubleSided: settings.isDoubleSided,
        numCopies: settings.numCopies,
        pageSize: settings.pageSize,
        orientation: settings.orientation,
        pricePerPage,
        totalPagesCharged,
        subtotal,
        platformFee,
        totalAmount: total,
      },
    });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100),
      currency: 'usd',
      metadata: { orderId, orderNumber, customerEmail: userEmail || '' },
      automatic_payment_methods: { enabled: true },
    });

    await db.printOrder.update({
      where: { id: orderId },
      data: { paymentIntentId: paymentIntent.id },
    });

    return NextResponse.json({
      success: true,
      order: { id: orderId, orderNumber, totalAmount: total, currency: 'USD' },
      payment: { clientSecret: paymentIntent.client_secret },
    });
  } catch (error) {
    console.error('Order creation error:', error);
    
    // Handle database connection errors specifically
    if (isConnectionError(error)) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Database connection failed',
          message: getDatabaseErrorMessage(error),
        },
        { status: 503 } // Service Unavailable
      );
    }

    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}