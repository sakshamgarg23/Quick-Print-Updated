import Link from 'next/link';
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
          className="rounded-md bg-neutral-900 text-white text-sm font-medium px-4 py-2 hover:bg-neutral-800 transition-colors"
        >
          New printer
        </Link>
      </div>

      {printers.length === 0 ? (
        <div className="border border-dashed border-neutral-300 rounded-lg py-16 text-center">
          <p className="text-sm text-neutral-500">No printers yet.</p>
          <Link
            href="/dashboard/printers/new"
            className="mt-3 inline-block text-sm font-medium text-neutral-900 hover:underline"
          >
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
                      className={`text-xs px-1.5 py-0.5 rounded ${
                        isActive ? 'bg-green-50 text-green-700' : 'bg-neutral-100 text-neutral-500'
                      }`}
                    >
                      {isActive ? 'Active' : 'Offline'}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {printer.location || 'No location set'} &middot; {printer._count.orders} orders
                  </p>
                </div>
                <span className="text-neutral-400 text-sm">View &rarr;</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
