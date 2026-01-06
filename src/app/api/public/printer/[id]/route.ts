import { NextRequest, NextResponse } from 'next/server';
import { db, isConnectionError, getDatabaseErrorMessage } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: printerId } = await params;

    if (!printerId) {
      return NextResponse.json(
        { error: 'Printer ID is required' },
        { status: 400 }
      );
    }

    const printer = await db.printer.findUnique({
      where: { id: printerId },
    });

    if (!printer) {
      return NextResponse.json(
        { error: 'Printer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(printer);
  } catch (error) {
    console.error('Error fetching printer:', error);
    
    // Handle database connection errors specifically
    if (isConnectionError(error)) {
      return NextResponse.json(
        { 
          error: 'Database connection failed',
          message: getDatabaseErrorMessage(error),
          details: process.env.NODE_ENV === 'development' 
            ? (error instanceof Error ? error.message : 'Unknown error')
            : undefined
        },
        { status: 503 } // Service Unavailable
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}