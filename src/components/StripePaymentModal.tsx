// src/components/StripePaymentModal.tsx
'use client';

import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function CheckoutForm({ 
  jobId, 
  amount, 
  onSuccess 
}: { 
  jobId: string; 
  amount: string;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async () => {
    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment/success?jobId=${jobId}`,
        },
        redirect: 'if_required',
      });

      if (error) {
        setErrorMessage(error.message || 'Payment failed');
        setIsProcessing(false);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        console.log('✅ Payment succeeded!');
        onSuccess();
      }
    } catch (err) {
      setErrorMessage('An unexpected error occurred');
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border-2 border-slate-200">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-slate-900 mb-2">Payment Details</h3>
          <p className="text-sm text-slate-600">
            Complete your payment to print your document
          </p>
        </div>

        <PaymentElement />
      </div>

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-700 text-sm font-medium">{errorMessage}</p>
        </div>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!stripe || isProcessing}
        className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
      >
        {isProcessing ? (
          <>
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing Payment...
          </>
        ) : (
          <>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Pay ₹{amount} & Print
          </>
        )}
      </button>

      <p className="text-center text-xs text-slate-500">
        🔒 Secure payment powered by Stripe
      </p>
    </div>
  );
}

export default function StripePaymentModal({
  clientSecret,
  jobId,
  amount,
  onSuccess,
  onCancel
}: {
  clientSecret: string;
  jobId: string;
  amount: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#667eea',
      },
    },
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Complete Payment</h2>
              <p className="text-blue-100 text-sm mt-1">Job ID: {jobId}</p>
            </div>
            <button
              onClick={onCancel}
              className="text-white/80 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 bg-white border-b-2 border-slate-200">
          <div className="flex justify-between items-center">
            <span className="text-slate-600 font-medium">Total Amount</span>
            <span className="text-3xl font-bold text-slate-900">₹{amount}</span>
          </div>
        </div>

        <div className="p-6">
          <Elements stripe={stripePromise} options={options}>
            <CheckoutForm jobId={jobId} amount={amount} onSuccess={onSuccess} />
          </Elements>
        </div>
      </div>
    </div>
  );
}

