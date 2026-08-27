'use client';

import { useState, useRef, ChangeEvent } from 'react';
import StripePaymentModal from '@/components/StripePaymentModal';

interface PrinterData {
  id: string;
  printerName: string;
  status: string;
  location?: string;
  printerEmail: string;
  description?: string;
  priceBwSingle: number;
  priceBwDouble: number;
  supportsColor: boolean;
  priceColorSingle?: number;
  priceColorDouble?: number;
  supportsDoubleSided: boolean;
  supportedPageSizes?: string[];
}

interface PrintPageClientProps {
  printer: PrinterData;
}

export default function PrintPageClient({ printer }: PrintPageClientProps) {
  // --- State Declarations Moved Inside Component ---
  const [showPayment, setShowPayment] = useState(false);
  const [paymentData, setPaymentData] = useState<{
    clientSecret: string;
    jobId: string;
    amount: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [copies, setCopies] = useState(1);
  const [colorType, setColorType] = useState<'bw' | 'color'>('bw');
  const [doubleSided, setDoubleSided] = useState(false);
  const [pageSize, setPageSize] = useState('A4');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Functions ---
  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const PLATFORM_FEE = 0.50;

  // Best-effort estimate only: the real page count of the uploaded file is
  // determined server-side after upload, so the final charge (shown in the
  // payment modal) is the authoritative amount.
  const calculatePrice = () => {
    const pricePerPage = colorType === 'bw'
      ? (doubleSided ? Number(printer.priceBwDouble) : Number(printer.priceBwSingle))
      : (doubleSided ? Number(printer.priceColorDouble || 0) : Number(printer.priceColorSingle || 0));

    return (pricePerPage * copies + PLATFORM_FEE).toFixed(2);
  };
  const handleSubmit = async () => {
    if (!selectedFile) {
      alert('Please select a file to print');
      return;
    }
  
    if (!customerEmail || !customerName) {
      alert('Please fill in your contact information');
      return;
    }
  
    // --- ADDED MINIMUM CHECK ---
    const totalPrice = parseFloat(calculatePrice());
    if (totalPrice < 50) {
      alert(`Stripe requires a minimum payment of ₹50.00. Current total is ₹${totalPrice.toFixed(2)}. Please increase the number of copies or settings to proceed.`);
      return;
    }
    // ---------------------------
  
    setIsSubmitting(true);
  
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('printerId', printer.id);
    formData.append('customerName', customerName);
    formData.append('customerEmail', customerEmail);
    formData.append('customerPhone', customerPhone);
    formData.append('copies', copies.toString());
    formData.append('colorType', colorType);
    formData.append('doubleSided', doubleSided.toString());
    formData.append('pageSize', pageSize);
  
    try {
      const response = await fetch('/api/public/print-job', {
        method: 'POST',
        body: formData,
      });
  
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Print job created:', result);
        
        setPaymentData({
          clientSecret: result.clientSecret,
          jobId: result.jobId,
          amount: result.estimatedCost
        });
        setShowPayment(true);
        setIsSubmitting(false);
      } else {
        const error = await response.json();
        alert('Error: ' + (error.error || 'Failed to create print job'));
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Error creating print job:', error);
      alert('Failed to create print job. Please try again.');
      setIsSubmitting(false);
    }
  };
  const isActive = printer.status.toLowerCase() === 'active';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        
        {/* Header Section */}
        <header className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-2">
                    {printer.printerName}
                  </h1>
                  {printer.description && (
                    <p className="text-slate-600 text-base lg:text-lg">{printer.description}</p>
                  )}
                </div>
              </div>
              
              <div className="flex flex-wrap gap-4 mt-6">
                <div className="flex items-center gap-3 bg-slate-50 rounded-lg px-4 py-3 border border-slate-200">
                  <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div>
                    <div className="text-xs text-slate-500 font-medium uppercase tracking-wide">Location</div>
                    <div className="text-sm text-slate-900 font-semibold">{printer.location || 'Not specified'}</div>
                  </div>
                </div>
                
                <div className={`flex items-center gap-3 rounded-lg px-4 py-3 border ${isActive ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                  <div>
                    <div className="text-xs text-slate-500 font-medium uppercase tracking-wide">Status</div>
                    <div className={`text-sm font-semibold ${isActive ? 'text-green-700' : 'text-red-700'}`}>
                      {isActive ? 'Online' : 'Offline'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-mono font-semibold border border-slate-300">
                #{printer.id}
              </span>
            </div>
          </div>
        </header>

        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Main Content - Left Column */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* File Upload */}
            <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-8 py-5 border-b border-slate-200">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Upload Document
                </h2>
              </div>
              
              <div className="p-8">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden"
                  accept="image/png,image/jpeg,application/pdf"
                />

                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="relative border-2 border-dashed border-slate-300 rounded-xl p-12 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 transition-all duration-300 group"
                >
                  {selectedFile ? (
                    <div className="space-y-4">
                      <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-base font-semibold text-slate-900">{selectedFile.name}</p>
                        <p className="text-sm text-slate-500 mt-1">{(selectedFile.size / 1024).toFixed(2)} KB</p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile();
                        }}
                        className="inline-flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-700 hover:underline"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Remove file
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="w-16 h-16 mx-auto bg-slate-100 rounded-full flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                        <svg className="w-8 h-8 text-slate-400 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-base font-semibold text-slate-900">Click to upload or drag and drop</p>
                        <p className="text-sm text-slate-500 mt-1">PDF, PNG, JPG up to 10MB</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Customer Information */}
            <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-8 py-5 border-b border-slate-200">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Contact Information
                </h2>
              </div>
              
              <div className="p-8 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow text-slate-900"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow text-slate-900"
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow text-slate-900"
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar - Right Column */}
          <div className="space-y-8">
            
            {/* Print Settings */}
            <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-8 py-5 border-b border-slate-200">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                  Print Options
                </h2>
              </div>
              
              <div className="p-8 space-y-6">
                
                {/* Copies */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">Number of Copies</label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setCopies(Math.max(1, copies - 1))}
                      className="w-11 h-11 flex items-center justify-center border-2 border-slate-300 rounded-xl hover:bg-slate-50 hover:border-slate-400 transition-colors"
                    >
                      <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
                      </svg>
                    </button>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={copies}
                      onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value) || 1))}
                      className="flex-1 px-4 py-3 border-2 border-slate-300 rounded-xl text-center font-semibold text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900"
                    />
                    <button
                      type="button"
                      onClick={() => setCopies(Math.min(100, copies + 1))}
                      className="w-11 h-11 flex items-center justify-center border-2 border-slate-300 rounded-xl hover:bg-slate-50 hover:border-slate-400 transition-colors"
                    >
                      <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Color Type */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">Color Mode</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setColorType('bw')}
                      className={`relative py-4 px-4 rounded-xl border-2 transition-all ${
                        colorType === 'bw'
                          ? 'border-blue-500 bg-blue-50 shadow-sm'
                          : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
                      }`}
                    >
                      {colorType === 'bw' && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                      <div className="text-sm font-bold text-slate-900">Black & White</div>
                      <div className="text-xs text-slate-600 mt-1 font-semibold">₹{printer.priceBwSingle}/page</div>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setColorType('color')}
                      disabled={!printer.supportsColor}
                      className={`relative py-4 px-4 rounded-xl border-2 transition-all ${
                        colorType === 'color'
                          ? 'border-blue-500 bg-blue-50 shadow-sm'
                          : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
                      } ${!printer.supportsColor ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {colorType === 'color' && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                      <div className="text-sm font-bold text-slate-900">Color</div>
                      <div className="text-xs text-slate-600 mt-1 font-semibold">₹{printer.priceColorSingle || 0}/page</div>
                    </button>
                  </div>
                </div>

                {/* Double Sided */}
                {printer.supportsDoubleSided && (
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <label className="flex items-center justify-between cursor-pointer">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">Double-Sided Printing</div>
                        <div className="text-xs text-slate-600 mt-0.5">Save paper, print on both sides</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setDoubleSided(!doubleSided)}
                        className={`relative w-14 h-8 rounded-full transition-colors ${
                          doubleSided ? 'bg-blue-600' : 'bg-slate-300'
                        }`}
                      >
                        <div
                          className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${
                            doubleSided ? 'translate-x-6' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </label>
                  </div>
                )}

                {/* Page Size */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">Page Size</label>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 font-medium"
                  >
                    {(printer.supportedPageSizes || ['A4', 'LETTER']).map((size) => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            {/* Price Summary */}
            <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-xl overflow-hidden">
              <div className="p-8">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  Cost Breakdown
                </h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-slate-700">
                    <span className="text-slate-400 text-sm">Print Mode</span>
                    <span className="text-white font-semibold">{colorType === 'bw' ? 'Black & White' : 'Color'}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-3 border-b border-slate-700">
                    <span className="text-slate-400 text-sm">Printing Sides</span>
                    <span className="text-white font-semibold">{doubleSided ? 'Double-Sided' : 'Single-Sided'}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-3 border-b border-slate-700">
                    <span className="text-slate-400 text-sm">Number of Copies</span>
                    <span className="text-white font-semibold">{copies}x</span>
                  </div>
                  
                  <div className="pt-4 mt-2">
                    <div className="flex justify-between items-baseline">
                      <span className="text-slate-300 font-semibold">Estimated Total</span>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-white">₹{calculatePrice()}</div>
                        <div className="text-xs text-slate-400 mt-1">Estimate for a 1-page file &middot; final price is based on actual page count</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Submit Button */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!selectedFile || isSubmitting || !isActive}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg hover:shadow-xl disabled:hover:shadow-lg"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Submit Print Job
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPayment && paymentData && (
        <StripePaymentModal
          clientSecret={paymentData.clientSecret}
          jobId={paymentData.jobId}
          amount={paymentData.amount}
          onSuccess={() => {
            setShowPayment(false);
            alert('✅ Payment successful! Your document is being printed. Check your email for confirmation.');
            setSelectedFile(null);
            setCustomerName('');
            setCustomerEmail('');
            setCustomerPhone('');
            setCopies(1);
            if (fileInputRef.current) fileInputRef.current.value = '';
          }}
          onCancel={() => {
            setShowPayment(false);
            setIsSubmitting(false);
          }}
        />
      )}
    </div>
  );
}