'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

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
      className="text-xs font-medium text-neutral-900 hover:underline disabled:opacity-50"
    >
      {loading ? 'Retrying…' : 'Retry now'}
    </button>
  );
}
