import { notFound } from 'next/navigation';
import PrintPageClient from './PrintPageClient';

interface PrintPageProps {
  params: Promise<{
    printerId: string;
  }>;
}

async function getPrinter(printerId: string) {
  try {
    // Ensure you have this environment variable set in .env.local
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/public/printer/${printerId}`, {
      cache: 'no-store',
    });

    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error('Error fetching printer:', error);
    return null;
  }
}

export default async function PrintPage({ params }: PrintPageProps) {
  // Await params for Next.js 15 compatibility
  const { printerId } = await params;
  const printer = await getPrinter(printerId);

  if (!printer) {
    notFound();
  }

  // Pass the fetched printer data to the interactive Client Component
  return <PrintPageClient printer={printer} />;
}