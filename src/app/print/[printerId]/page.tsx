// src/app/print/[printerId]/page.tsx
import { notFound } from 'next/navigation';
import PrintPageClient from './PrintPageClient';
import { db } from '@/lib/db';

interface PrintPageProps {
  params: Promise<{
    printerId: string;
  }>;
}

export default async function PrintPage({ params }: PrintPageProps) {
  const { printerId } = await params;
  
  const printer = await db.printer.findUnique({
    where: { id: printerId },
  });

  if (!printer) {
    notFound();
  }

  // Convert Prisma types to match PrintPageClient expectations
  const printerData = {
    id: printer.id,
    printerName: printer.printerName,
    status: printer.status,
    location: printer.location ?? undefined,
    printerEmail: printer.printerEmail,
    description: printer.description ?? undefined,
    priceBwSingle: Number(printer.priceBwSingle),
    priceBwDouble: Number(printer.priceBwDouble),
    supportsColor: printer.supportsColor,
    priceColorSingle: printer.priceColorSingle ? Number(printer.priceColorSingle) : undefined,
    priceColorDouble: printer.priceColorDouble ? Number(printer.priceColorDouble) : undefined,
    supportsDoubleSided: printer.supportsDoubleSided,
    supportedPageSizes: printer.supportedPageSizes ?? undefined,
  };

  return <PrintPageClient printer={printerData} />;
}