'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export default function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1 text-xs font-medium text-neutral-900 hover:underline"
    >
      {copied ? <Check className="h-3 w-3" strokeWidth={2} /> : <Copy className="h-3 w-3" strokeWidth={2} />}
      {copied ? 'Copied' : 'Copy link'}
    </button>
  );
}
