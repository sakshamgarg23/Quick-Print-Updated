// src/app/api/public/print-job/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/lib/db';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-12-15.clover',
});

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

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

    // === UPLOAD FILE TO SUPABASE STORAGE ===
    const timestamp = Date.now();
    const safeFileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = `uploads/${safeFileName}`;
    console.log('📤 Attempting upload to Supabase...');
console.log('📦 Bucket: print-files');
console.log('📁 Path:', filePath);

    // Convert file to buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    
    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('print-files')
      .upload(filePath, fileBuffer, {
        contentType: file.type || 'application/pdf',
        upsert: false
      });

    if (uploadError) {
      console.error('❌ Supabase upload error:', uploadError);
  console.error('❌ Error details:', JSON.stringify(uploadError, null, 2));

      console.error('❌ Supabase upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload file: ' + uploadError.message },
        { status: 500 }
      );
    }

    // Get public URL for the uploaded file
    const { data: { publicUrl } } = supabase.storage
      .from('print-files')
      .getPublicUrl(filePath);

    console.log('✅ File uploaded to Supabase:', publicUrl);
    // === END FILE UPLOAD ===

    // Calculate order details
    const estimatedPages = 1; // TODO: Extract actual page count from PDF
    const totalPagesCharged = estimatedPages * copies;
    const subtotal = pricePerPage * totalPagesCharged;
    const platformFee = 0.50;
    const totalAmount = subtotal + platformFee;

    // Save print job to database with Supabase URL
    const printJob = await db.printOrder.create({
      data: {
        id: orderId,
        orderNumber,
        printerId,
        userEmail: customerEmail,
        userPhone: customerPhone || null,
        fileUrl: publicUrl, // ← Supabase public URL
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