import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Printer } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import SignOutButton from './SignOutButton';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-neutral-900">
              <Printer className="h-3.5 w-3.5 text-white" strokeWidth={2} />
            </span>
            <span className="text-sm font-semibold tracking-tight text-neutral-900">QuickPrint</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-neutral-500">{user.fullName}</span>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">{children}</main>
    </div>
  );
}
