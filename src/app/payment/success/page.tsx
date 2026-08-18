import Link from 'next/link';

interface PaymentSuccessPageProps {
  searchParams: Promise<{ jobId?: string }>;
}

export default async function PaymentSuccessPage({ searchParams }: PaymentSuccessPageProps) {
  const { jobId } = await searchParams;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 max-w-lg w-full p-8 text-center">
        <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-6">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-2">Payment Successful</h1>
        <p className="text-slate-600 mb-6">
          Your document has been sent for printing. You&apos;ll receive a confirmation email shortly.
        </p>

        {jobId && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 mb-6 text-sm">
            <span className="text-slate-500">Job ID: </span>
            <span className="font-mono font-semibold text-slate-900">{jobId}</span>
          </div>
        )}

        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all"
        >
          Done
        </Link>
      </div>
    </div>
  );
}
