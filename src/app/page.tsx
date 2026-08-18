import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';

export default async function Home() {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <header className="border-b border-neutral-200 bg-white">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="text-sm font-semibold tracking-tight text-neutral-900">QuickPrint</span>
          <nav className="flex items-center gap-4 text-sm">
            {user ? (
              <Link href="/dashboard" className="text-neutral-900 font-medium hover:underline">
                Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-neutral-600 hover:text-neutral-900">
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="rounded-md bg-neutral-900 text-white px-3 py-1.5 font-medium hover:bg-neutral-800 transition-colors"
                >
                  Register a printer
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1 flex items-center">
        <div className="max-w-5xl mx-auto px-6 py-20 w-full">
          <div className="max-w-xl">
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-neutral-900">
              Scan, upload, print. No counter needed.
            </h1>
            <p className="mt-4 text-neutral-600 leading-relaxed">
              QuickPrint turns any shop printer into a self-service kiosk. Customers scan a QR code,
              upload their document, pay online, and the file is sent straight to the printer &mdash;
              no handing over a USB drive, no waiting in line.
            </p>
            <div className="mt-8 flex gap-3">
              <Link
                href="/signup"
                className="rounded-md bg-neutral-900 text-white px-5 py-2.5 text-sm font-medium hover:bg-neutral-800 transition-colors"
              >
                Register your printer
              </Link>
              <Link
                href="/login"
                className="rounded-md border border-neutral-300 px-5 py-2.5 text-sm font-medium text-neutral-700 hover:bg-white transition-colors"
              >
                Sign in
              </Link>
            </div>
          </div>

          <div className="mt-16 grid sm:grid-cols-3 gap-6 max-w-3xl">
            <div>
              <div className="text-xs font-medium text-neutral-400">01</div>
              <p className="mt-1 text-sm font-medium text-neutral-900">Scan the QR</p>
              <p className="mt-1 text-sm text-neutral-500">Printed at the shop counter, no app needed.</p>
            </div>
            <div>
              <div className="text-xs font-medium text-neutral-400">02</div>
              <p className="mt-1 text-sm font-medium text-neutral-900">Upload &amp; pay</p>
              <p className="mt-1 text-sm text-neutral-500">Choose copies, color, and sides, then pay online.</p>
            </div>
            <div>
              <div className="text-xs font-medium text-neutral-400">03</div>
              <p className="mt-1 text-sm font-medium text-neutral-900">Pick it up</p>
              <p className="mt-1 text-sm text-neutral-500">The file is sent to the printer automatically.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
