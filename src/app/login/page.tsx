import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import LoginForm from './LoginForm';

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect('/dashboard');

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="text-sm font-semibold tracking-tight text-neutral-900">
            QuickPrint
          </Link>
          <h1 className="mt-4 text-xl font-semibold text-neutral-900">Sign in</h1>
          <p className="mt-1 text-sm text-neutral-500">Manage your printers and orders.</p>
        </div>

        <div className="border border-neutral-200 rounded-lg bg-white p-6">
          <LoginForm />
        </div>

        <p className="mt-6 text-center text-sm text-neutral-500">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-neutral-900 font-medium hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
