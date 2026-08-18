'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { LogOut } from 'lucide-react';

export default function SignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    setLoading(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  return (
    <button
      onClick={handleSignOut}
      disabled={loading}
      className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 transition-colors disabled:opacity-50"
    >
      <LogOut className="h-3.5 w-3.5" strokeWidth={2} />
      Sign out
    </button>
  );
}
