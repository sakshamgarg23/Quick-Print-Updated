// src/app/api/public/print-job/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/lib/db';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-12-15.clover', // ← Matching your version
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const file = formData.get('file') as File;
    const printerId = formData.get('printerId') as string;
    const customerName = formData.get('customerName') as string;
    const customerEmail = formData.get('customerEmail') as string;
    const customerPhone = formData.get('customerPhone') as string;
    const copies = parseInt(formData.get('copies') as string);
    const colorType = formData.get('colorType') as string;
    const doubleSided = formData.get('doubleSided') === 'true';
    const pageSize = formData.get('pageSize') as string;

    console.log('📝 Received print job:', { 
      printerId, 
      customerName, 
      customerEmail,
      fileName: file?.name,
      copies,
      colorType 
    });

    if (!file || !printerId || !customerName || !customerEmail) {
      console.error('❌ Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Fetch printer from database
    const printer = await db.printer.findUnique({
      where: { id: printerId }
    });
    
    if (!printer) {
      console.error('❌ Printer not found:', printerId);
      return NextResponse.json(
        { error: 'Printer not found' },
        { status: 404 }
      );
    }

    console.log('✅ Found printer:', printer.printerName);

    if (printer.status.toLowerCase() !== 'active') {
      console.error('❌ Printer is offline');
      return NextResponse.json(
        { error: 'Printer is currently offline' },
        { status: 400 }
      );
    }

    // Calculate price
    const pricePerPage = colorType === 'bw'
      ? (doubleSided ? Number(printer.priceBwDouble) : Number(printer.priceBwSingle))
      : (doubleSided ? Number(printer.priceColorDouble) : Number(printer.priceColorSingle));
    const estimatedCost = pricePerPage * copies;

    console.log('💰 Cost calculation:', { pricePerPage, copies, estimatedCost });

    // Generate unique job ID and order number
    const jobId = `JOB-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const orderNumber = `PRT-${Date.now()}`;
    const orderId = jobId;

    // Calculate order details
    const estimatedPages = 1; // TODO: Extract actual page count from PDF
    const totalPagesCharged = estimatedPages * copies;
    const subtotal = pricePerPage * totalPagesCharged;
    const platformFee = 0.50;
    const totalAmount = subtotal + platformFee;

    // Save print job to database (status: pending)
    const printJob = await db.printOrder.create({
      data: {
        id: orderId,
        orderNumber,
        printerId,
        userEmail: customerEmail,
        userPhone: customerPhone || null,
        fileUrl: '', // Will be updated after file upload
        fileName: file.name,
        fileType: file.type,
        fileSizeBytes: BigInt(file.size),
        totalPages: estimatedPages,
        colorMode: colorType,
        isDoubleSided: doubleSided,
        numCopies: copies,
        pageSize: pageSize || 'A4',
        orientation: 'portrait',
        pricePerPage,
        totalPagesCharged,
        subtotal,
        platformFee,
        totalAmount,
        currency: 'INR',
        status: 'pending',
        paymentStatus: 'pending',
      },
    });

    console.log('✅ Print job saved with status: PENDING_PAYMENT');

    // Create Stripe Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(estimatedCost * 100), // Convert to paise
      currency: 'inr',
      metadata: {
        jobId,
        printerId,
        customerName,
        customerEmail,
        fileName: file.name,
        copies: copies.toString(),
        colorType,
        doubleSided: doubleSided.toString(),
      },
      description: `Print Job: ${file.name} (${copies} copies)`,
    });

    console.log('✅ Stripe payment intent created:', paymentIntent.id);

    // Return payment intent client secret
    return NextResponse.json({
      success: true,
      jobId,
      estimatedCost: estimatedCost.toFixed(2),
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      message: 'Print job created. Please complete payment.',
    });

  } catch (error) {
    console.error('❌ Error creating print job:', error);
    return NextResponse.json(
      { error: 'Failed to create print job: ' + (error as Error).message },
      { status: 500 }
    );
  }
}