import Link from 'next/link';
import PrinterForm from '../PrinterForm';

export default function NewPrinterPage() {
  return (
    <div className="max-w-2xl">
      <Link href="/dashboard" className="text-sm text-neutral-500 hover:text-neutral-900">
        &larr; Printers
      </Link>
      <h1 className="text-xl font-semibold text-neutral-900 mt-3 mb-6">New printer</h1>

      <div className="border border-neutral-200 rounded-lg bg-white p-6">
        <PrinterForm mode="create" />
      </div>
    </div>
  );
}
