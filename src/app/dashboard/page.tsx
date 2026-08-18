import Link from 'next/link';
import { Plus, ChevronRight, Printer as PrinterIcon } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null; // layout already redirects

  const printers = await db.printer.findMany({
    where: { ownerId: user.id },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { orders: true } } },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Printers</h1>
          <p className="text-sm text-neutral-500 mt-1">Shops registered to your account.</p>
        </div>
        <Link
          href="/dashboard/printers/new"
          className="flex items-center gap-1.5 rounded-md bg-neutral-900 text-white text-sm font-medium px-4 py-2 hover:bg-neutral-800 transition-colors"
        >
          <Plus className="h-4 w-4" strokeWidth={2} />
          New printer
        </Link>
      </div>

      {printers.length === 0 ? (
        <div className="border border-dashed border-neutral-300 rounded-lg py-16 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100">
            <PrinterIcon className="h-5 w-5 text-neutral-400" strokeWidth={1.75} />
          </div>
          <p className="mt-3 text-sm text-neutral-500">No printers yet.</p>
          <Link
            href="/dashboard/printers/new"
            className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-neutral-900 hover:underline"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2} />
            Register your first printer
          </Link>
        </div>
      ) : (
        <div className="border border-neutral-200 rounded-lg bg-white divide-y divide-neutral-200">
          {printers.map((printer) => {
            const isActive = printer.status.toLowerCase() === 'active';
            return (
              <Link
                key={printer.id}
                href={`/dashboard/printers/${printer.id}`}
                className="flex items-center justify-between px-5 py-4 hover:bg-neutral-50 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-neutral-900">{printer.printerName}</span>
                    <span
                      className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded ${
                        isActive ? 'bg-green-50 text-green-700' : 'bg-neutral-100 text-neutral-500'
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-green-500' : 'bg-neutral-400'}`} />
                      {isActive ? 'Active' : 'Offline'}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {printer.location || 'No location set'} &middot; {printer._count.orders} orders
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-neutral-400" strokeWidth={2} />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
