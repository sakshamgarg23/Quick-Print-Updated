'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

const inputClass =
  'w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900';
const labelClass = 'block text-sm font-medium text-neutral-700 mb-1.5';
const PAGE_SIZES = ['A4', 'LETTER', 'LEGAL'];

export interface PrinterFormValues {
  printerName: string;
  printerEmail: string;
  location: string;
  description: string;
  status: string;
  priceBwSingle: number;
  priceBwDouble: number;
  priceColorSingle: number;
  priceColorDouble: number;
  supportsColor: boolean;
  supportsDoubleSided: boolean;
  supportedPageSizes: string[];
}

const emptyValues: PrinterFormValues = {
  printerName: '',
  printerEmail: '',
  location: '',
  description: '',
  status: 'active',
  priceBwSingle: 2,
  priceBwDouble: 3,
  priceColorSingle: 5,
  priceColorDouble: 8,
  supportsColor: true,
  supportsDoubleSided: true,
  supportedPageSizes: ['A4'],
};

export default function PrinterForm({
  mode,
  printerId,
  initialValues,
}: {
  mode: 'create' | 'edit';
  printerId?: string;
  initialValues?: Partial<PrinterFormValues>;
}) {
  const router = useRouter();
  const [values, setValues] = useState<PrinterFormValues>({ ...emptyValues, ...initialValues });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const set = <K extends keyof PrinterFormValues>(key: K, value: PrinterFormValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  const togglePageSize = (size: string) => {
    setValues((v) => ({
      ...v,
      supportedPageSizes: v.supportedPageSizes.includes(size)
        ? v.supportedPageSizes.filter((s) => s !== size)
        : [...v.supportedPageSizes, size],
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (values.supportedPageSizes.length === 0) {
      setError('Select at least one page size');
      return;
    }

    setIsSubmitting(true);
    try {
      const url = mode === 'create' ? '/api/dashboard/printers' : `/api/dashboard/printers/${printerId}`;
      const method = mode === 'create' ? 'POST' : 'PATCH';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to save printer');
        setIsSubmitting(false);
        return;
      }

      if (mode === 'create') {
        router.push(`/dashboard/printers/${data.printer.id}`);
      }
      router.refresh();
    } catch {
      setError('Something went wrong. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="printerName">Printer name</label>
          <input
            id="printerName"
            required
            value={values.printerName}
            onChange={(e) => set('printerName', e.target.value)}
            className={inputClass}
            placeholder="Sharma Xerox & Print"
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="location">Location</label>
          <input
            id="location"
            value={values.location}
            onChange={(e) => set('location', e.target.value)}
            className={inputClass}
            placeholder="Shop 4, Main Market"
          />
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="printerEmail">
          ePrint email address
        </label>
        <input
          id="printerEmail"
          type="email"
          required
          value={values.printerEmail}
          onChange={(e) => set('printerEmail', e.target.value)}
          className={inputClass}
          placeholder="xxxxxxx@hpeprint.com"
        />
        <p className="mt-1.5 text-xs text-neutral-500">
          The printer&apos;s email-to-print address. Paid jobs are emailed here as an attachment.
        </p>
      </div>

      <div>
        <label className={labelClass} htmlFor="description">Description</label>
        <textarea
          id="description"
          value={values.description}
          onChange={(e) => set('description', e.target.value)}
          className={inputClass}
          rows={2}
          placeholder="Optional note shown to customers"
        />
      </div>

      {mode === 'edit' && (
        <div>
          <label className={labelClass} htmlFor="status">Status</label>
          <select
            id="status"
            value={values.status}
            onChange={(e) => set('status', e.target.value)}
            className={inputClass}
          >
            <option value="active">Active</option>
            <option value="offline">Offline</option>
          </select>
        </div>
      )}

      <div>
        <p className={labelClass}>Pricing (₹ per page)</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs text-neutral-500 mb-1" htmlFor="priceBwSingle">B&amp;W single</label>
            <input
              id="priceBwSingle"
              type="number"
              step="0.5"
              min="0"
              required
              value={values.priceBwSingle}
              onChange={(e) => set('priceBwSingle', Number(e.target.value))}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-500 mb-1" htmlFor="priceBwDouble">B&amp;W double</label>
            <input
              id="priceBwDouble"
              type="number"
              step="0.5"
              min="0"
              required
              value={values.priceBwDouble}
              onChange={(e) => set('priceBwDouble', Number(e.target.value))}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-500 mb-1" htmlFor="priceColorSingle">Color single</label>
            <input
              id="priceColorSingle"
              type="number"
              step="0.5"
              min="0"
              required
              value={values.priceColorSingle}
              onChange={(e) => set('priceColorSingle', Number(e.target.value))}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-500 mb-1" htmlFor="priceColorDouble">Color double</label>
            <input
              id="priceColorDouble"
              type="number"
              step="0.5"
              min="0"
              required
              value={values.priceColorDouble}
              onChange={(e) => set('priceColorDouble', Number(e.target.value))}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm text-neutral-700">
          <input
            type="checkbox"
            checked={values.supportsColor}
            onChange={(e) => set('supportsColor', e.target.checked)}
            className="rounded border-neutral-300"
          />
          Supports color
        </label>
        <label className="flex items-center gap-2 text-sm text-neutral-700">
          <input
            type="checkbox"
            checked={values.supportsDoubleSided}
            onChange={(e) => set('supportsDoubleSided', e.target.checked)}
            className="rounded border-neutral-300"
          />
          Supports double-sided
        </label>
      </div>

      <div>
        <p className={labelClass}>Page sizes</p>
        <div className="flex gap-4">
          {PAGE_SIZES.map((size) => (
            <label key={size} className="flex items-center gap-2 text-sm text-neutral-700">
              <input
                type="checkbox"
                checked={values.supportedPageSizes.includes(size)}
                onChange={() => togglePageSize(size)}
                className="rounded border-neutral-300"
              />
              {size}
            </label>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex items-center gap-2 rounded-md bg-neutral-900 text-white text-sm font-medium px-5 py-2.5 hover:bg-neutral-800 transition-colors disabled:opacity-50"
      >
        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />}
        {isSubmitting ? 'Saving…' : mode === 'create' ? 'Create printer' : 'Save changes'}
      </button>
    </form>
  );
}
