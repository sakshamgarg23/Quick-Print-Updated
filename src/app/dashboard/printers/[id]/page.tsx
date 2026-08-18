import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Settings, QrCode, Download, FileText, ClipboardList } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { getBaseUrl } from '@/lib/url';
import { generateQrDataUrl } from '@/lib/qrcode';
import PrinterForm from '../PrinterForm';
import CopyLinkButton from './CopyLinkButton';
import RetryOrderButton from './RetryOrderButton';

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-neutral-100 text-neutral-600',
  processing: 'bg-amber-50 text-amber-700',
  completed: 'bg-green-50 text-green-700',
  failed: 'bg-red-50 text-red-700',
};

export default async function PrinterDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return null; // layout already redirects

  const printer = await db.printer.findUnique({ where: { id } });
  if (!printer || printer.ownerId !== user.id) {
    notFound();
  }

  const orders = await db.printOrder.findMany({
    where: { printerId: id },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  const baseUrl = await getBaseUrl();
  const printUrl = `${baseUrl}/print/${printer.id}`;
  const qrDataUrl = await generateQrDataUrl(printUrl);

  return (
    <div>
      <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900">
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
        Printers
      </Link>
      <h1 className="text-xl font-semibold text-neutral-900 mt-3 mb-6">{printer.printerName}</h1>

      <div className="grid lg:grid-cols-3 gap-6 mb-10">
        <div className="lg:col-span-2 border border-neutral-200 rounded-lg bg-white p-6">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-neutral-900 mb-4">
            <Settings className="h-4 w-4 text-neutral-400" strokeWidth={2} />
            Settings
          </h2>
          <PrinterForm
            key={printer.updatedAt.getTime()}
            mode="edit"
            printerId={printer.id}
            initialValues={{
              printerName: printer.printerName,
              printerEmail: printer.printerEmail,
              location: printer.location ?? '',
              description: printer.description ?? '',
              status: printer.status.toLowerCase(),
              priceBwSingle: Number(printer.priceBwSingle),
              priceBwDouble: Number(printer.priceBwDouble),
              priceColorSingle: Number(printer.priceColorSingle),
              priceColorDouble: Number(printer.priceColorDouble),
              supportsColor: printer.supportsColor,
              supportsDoubleSided: printer.supportsDoubleSided,
              supportedPageSizes: printer.supportedPageSizes,
            }}
          />
        </div>

        <div className="border border-neutral-200 rounded-lg bg-white p-6">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-neutral-900 mb-4">
            <QrCode className="h-4 w-4 text-neutral-400" strokeWidth={2} />
            QR code
          </h2>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrDataUrl} alt="Printer QR code" className="w-full aspect-square border border-neutral-200 rounded-md" />
          <p className="mt-3 text-xs text-neutral-500 break-all">{printUrl}</p>
          <div className="mt-3 flex items-center gap-4">
            <a
              href={qrDataUrl}
              download={`quickprint-${printer.id}.png`}
              className="inline-flex items-center gap-1 text-xs font-medium text-neutral-900 hover:underline"
            >
              <Download className="h-3 w-3" strokeWidth={2} />
              Download PNG
            </a>
            <CopyLinkButton url={printUrl} />
          </div>
        </div>
      </div>

      <h2 className="flex items-center gap-2 text-sm font-semibold text-neutral-900 mb-4">
        <ClipboardList className="h-4 w-4 text-neutral-400" strokeWidth={2} />
        Recent orders
      </h2>
      {orders.length === 0 ? (
        <p className="text-sm text-neutral-500">No orders yet.</p>
      ) : (
        <div className="border border-neutral-200 rounded-lg bg-white overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-xs text-neutral-500">
                <th className="px-4 py-2.5 font-medium">Order</th>
                <th className="px-4 py-2.5 font-medium">File</th>
                <th className="px-4 py-2.5 font-medium">Copies</th>
                <th className="px-4 py-2.5 font-medium">Amount</th>
                <th className="px-4 py-2.5 font-medium">Payment</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium">Date</th>
                <th className="px-4 py-2.5 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="px-4 py-3 font-mono text-xs text-neutral-700">{order.orderNumber}</td>
                  <td className="px-4 py-3 text-neutral-700 max-w-40 truncate">
                    <span className="inline-flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 shrink-0 text-neutral-400" strokeWidth={2} />
                      <span className="truncate">{order.fileName}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-neutral-700">{order.numCopies}</td>
                  <td className="px-4 py-3 text-neutral-700">₹{Number(order.totalAmount).toFixed(2)}</td>
                  <td className="px-4 py-3 text-neutral-700">{order.paymentStatus}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-1.5 py-0.5 rounded ${STATUS_STYLES[order.status] ?? 'bg-neutral-100 text-neutral-600'}`}>
                      {order.status}
                    </span>
                    {order.lastDeliveryError && (
                      <p className="text-xs text-red-500 mt-1 max-w-55 truncate" title={order.lastDeliveryError}>
                        {order.lastDeliveryError}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-neutral-500 text-xs whitespace-nowrap">
                    {order.createdAt.toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    {order.paymentStatus === 'paid' && (order.status === 'processing' || order.status === 'failed') && (
                      <RetryOrderButton orderId={order.id} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
