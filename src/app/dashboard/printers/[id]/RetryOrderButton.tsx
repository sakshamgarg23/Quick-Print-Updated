'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';

export default function RetryOrderButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleRetry = async () => {
    setLoading(true);
    await fetch(`/api/dashboard/orders/${orderId}/retry`, { method: 'POST' });
    setLoading(false);
    router.refresh();
  };

  return (
    <button
      onClick={handleRetry}
      disabled={loading}
      className="inline-flex items-center gap-1 text-xs font-medium text-neutral-900 hover:underline disabled:opacity-50"
    >
      <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} strokeWidth={2} />
      {loading ? 'Retrying…' : 'Retry now'}
    </button>
  );
}
