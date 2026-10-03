import React, { useState } from 'react';
import { X, Search, PackageCheck, CheckCircle2, Clock, Truck, ShieldCheck, AlertCircle, ShoppingBag } from 'lucide-react';

interface TrackOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialOrderNumber?: string;
}

interface TrackingData {
  orderNumber: string;
  customerName: string;
  orderStatus: 'Confirmed' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  paymentStatus: string;
  paymentMethod: string;
  createdAt: string;
  city: string;
  state: string;
  items: {
    productName: string;
    category: string;
    size: string;
    quantity: number;
    price: number;
    image: string;
  }[];
  subtotal: number;
  shipping: number;
  totalAmount: number;
  steps: {
    key: string;
    label: string;
    completed: boolean;
    timestamp?: string;
  }[];
  statusHistory?: {
    status: string;
    timestamp: string;
    note?: string;
  }[];
}

export const TrackOrderModal: React.FC<TrackOrderModalProps> = ({
  isOpen,
  onClose,
  initialOrderNumber = '',
}) => {
  const [orderNumberInput, setOrderNumberInput] = useState(initialOrderNumber);
  const [verificationInput, setVerificationInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);

  if (!isOpen) return null;

  const handleTrackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setTrackingData(null);

    if (!orderNumberInput.trim() || !verificationInput.trim()) {
      setErrorMsg('Please enter both Order ID (e.g. ZIP-2026-8901) and your registered Mobile or Email.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/orders/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: orderNumberInput.trim(),
          verification: verificationInput.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to retrieve tracking information');
      }

      setTrackingData(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error tracking order. Please verify your details.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: TrackingData['orderStatus']) => {
    switch (status) {
      case 'Delivered':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Shipped':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Processing':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Cancelled':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-zinc-100 text-zinc-700 border-zinc-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto text-zinc-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-[#7c3aed]">
              <PackageCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-display uppercase tracking-wide text-zinc-950">
                Live Order Tracking
              </h2>
              <p className="text-xs text-zinc-500">
                Enter your Order Reference ID & registered mobile number or email.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-900 rounded-lg hover:bg-zinc-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input Form */}
        <form onSubmit={handleTrackSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs uppercase font-mono text-zinc-600 mb-1">
                Order ID *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. ZIP-2026-8901"
                value={orderNumberInput}
                onChange={(e) => setOrderNumberInput(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 placeholder:text-zinc-400 text-xs font-mono focus:outline-none focus:bg-white focus:border-[#7c3aed]"
              />
            </div>

            <div>
              <label className="block text-xs uppercase font-mono text-zinc-600 mb-1">
                Registered Mobile or Email *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 9876543210 or your email"
                value={verificationInput}
                onChange={(e) => setVerificationInput(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 placeholder:text-zinc-400 text-xs font-mono focus:outline-none focus:bg-white focus:border-[#7c3aed]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl bg-black hover:bg-zinc-800 text-white font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-md"
          >
            <Search className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Verifying & Tracking...' : 'Track Real-Time Status'}</span>
          </button>
        </form>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Tracking Details Result */}
        {trackingData && (
          <div className="space-y-6 pt-2 border-t border-zinc-200 animate-in fade-in duration-300">
            {/* Top Overview */}
            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-mono uppercase text-zinc-500 block">
                  Order Reference
                </span>
                <span className="text-base font-bold font-mono text-zinc-950">
                  #{trackingData.orderNumber}
                </span>
                <span className="text-xs text-zinc-500 block mt-0.5">
                  Placed on {new Date(trackingData.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                </span>
              </div>

              <div className="sm:text-right">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase font-mono border ${getStatusBadge(trackingData.orderStatus)}`}>
                  {trackingData.orderStatus}
                </span>
                <span className="text-xs font-mono text-[#7c3aed] font-semibold block mt-1">
                  Total: ₹{trackingData.totalAmount.toLocaleString('en-IN')} ({trackingData.paymentStatus})
                </span>
              </div>
            </div>

            {/* Visual Step Progress Tracker */}
            <div className="p-5 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-zinc-500">
                Fulfillment Journey
              </h3>

              <div className="space-y-3">
                {trackingData.steps.map((step, idx) => {
                  const isCurrent = step.completed && (idx === trackingData.steps.length - 1 || !trackingData.steps[idx + 1].completed);
                  return (
                    <div key={step.key} className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                          step.completed
                            ? 'bg-[#7c3aed] text-white shadow-sm'
                            : 'bg-zinc-200 border border-zinc-300 text-zinc-500'
                        }`}
                      >
                        {step.completed ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-xs font-semibold ${
                              isCurrent
                                ? 'text-zinc-950 font-bold'
                                : step.completed
                                ? 'text-zinc-800'
                                : 'text-zinc-400'
                            }`}
                          >
                            {step.label}
                          </span>
                          {step.completed && (
                            <span className="text-[10px] font-mono text-emerald-700 font-bold uppercase">
                              Completed
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Ordered Garments */}
            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-3">
              <h4 className="text-xs font-mono uppercase text-zinc-500">
                Package Contents ({trackingData.items.reduce((s, it) => s + it.quantity, 0)} garments)
              </h4>
              <div className="space-y-2">
                {trackingData.items.map((it, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-xs text-zinc-700">
                    <img
                      src={it.image}
                      alt={it.productName}
                      className="w-10 h-12 object-cover rounded bg-zinc-100 border border-zinc-200 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-zinc-900 truncate">{it.productName}</p>
                      <p className="text-[11px] font-mono text-zinc-500">
                        Size: <strong className="text-zinc-900">[{it.size}]</strong> · Qty: {it.quantity}
                      </p>
                    </div>
                    <span className="font-mono font-bold text-zinc-950">
                      ₹{(it.price * it.quantity).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Destination Note */}
            <div className="text-center text-[11px] font-mono text-zinc-500">
              Dispatched to recipient in {trackingData.city}, {trackingData.state}. Verified via ZIPROO Atelier Systems.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
