import React, { useState, useEffect } from 'react';
import type { CartItem, Order, StoreSettings, Customer } from '../types/index.js';
import {
  X,
  CheckCircle2,
  ShieldCheck,
  CreditCard,
  Truck,
  AlertCircle,
  QrCode,
  Smartphone,
  Mail,
  MapPin,
  Lock,
  User,
  Edit3,
  RotateCcw,
  Clock,
} from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  settings?: StoreSettings;
  onOrderCompleted: (order: Order) => void;
  currentCustomer?: Customer | null;
  customerToken?: string | null;
  onOpenCustomerLogin?: () => void;
}

const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Delhi NCR',
  'Chandigarh',
];

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  items,
  settings,
  onOrderCompleted,
  currentCustomer,
  customerToken,
  onOpenCustomerLogin,
}) => {
  // Required customer details form states
  const [customerName, setCustomerName] = useState(currentCustomer?.name || '');
  const [mobileNumber, setMobileNumber] = useState(currentCustomer?.phone || '');
  const [email, setEmail] = useState(
    currentCustomer?.email && !currentCustomer.email.includes('@ziproo-customer.com')
      ? currentCustomer.email
      : ''
  );
  const [completeAddress, setCompleteAddress] = useState(currentCustomer?.address || '');
  const [city, setCity] = useState(currentCustomer?.city || '');
  const [state, setState] = useState(currentCustomer?.state || 'Karnataka');
  const [pinCode, setPinCode] = useState(currentCustomer?.pinCode || '');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'online_portal' | 'razorpay'>('cod');
  const [transactionReference, setTransactionReference] = useState('');
  
  // Custom Address Editing Option for Every Order
  const [saveAddressToProfile, setSaveAddressToProfile] = useState(true);
  const [isEditingParticulars, setIsEditingParticulars] = useState(false);

  const handleResetToProfile = () => {
    if (currentCustomer) {
      setCustomerName(currentCustomer.name || '');
      setMobileNumber(currentCustomer.phone || '');
      setEmail(
        currentCustomer.email && !currentCustomer.email.includes('@ziproo-customer.com')
          ? currentCustomer.email
          : ''
      );
      setCompleteAddress(currentCustomer.address || '');
      setCity(currentCustomer.city || '');
      setState(currentCustomer.state || 'Karnataka');
      setPinCode(currentCustomer.pinCode || '');
      setIsEditingParticulars(false);
    }
  };
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  // Auto-fill from customer profile whenever modal opens or customer changes
  useEffect(() => {
    if (currentCustomer) {
      if (currentCustomer.name) setCustomerName(currentCustomer.name);
      if (currentCustomer.phone) setMobileNumber(currentCustomer.phone);
      if (currentCustomer.email && !currentCustomer.email.includes('@ziproo-customer.com')) {
        setEmail(currentCustomer.email);
      }
      if (currentCustomer.address) setCompleteAddress(currentCustomer.address);
      if (currentCustomer.city) setCity(currentCustomer.city);
      if (currentCustomer.state) setState(currentCustomer.state);
      if (currentCustomer.pinCode) setPinCode(currentCustomer.pinCode);
    }
  }, [currentCustomer, isOpen]);

  if (!isOpen) return null;

  // Stock status check: identify any out-of-stock items in cart
  const outOfStockItems = items.filter(
    (it) => !it.product.inStock || (it.product.piecesAvailable !== undefined && it.product.piecesAvailable <= 0)
  );
  const hasOutOfStockItems = outOfStockItems.length > 0;

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const freeThreshold = settings?.freeShippingThreshold || 1999;
  const shipping = subtotal >= freeThreshold ? 0 : 99; // ₹99 nominal delivery
  const total = subtotal + shipping;

  // Calculate GST & Tax amounts
  const estimatedTaxDetails = items.reduce(
    (acc, it) => {
      const prod = it.product;
      const rate = prod.gstApplicable !== false ? (prod.gstRate !== undefined ? Number(prod.gstRate) : (prod.price >= 1000 ? 12 : 5)) : 0;
      const itemTotal = prod.price * it.quantity;
      const isInclusive = prod.taxInclusive !== false;
      let base = itemTotal;
      let tax = 0;
      if (rate > 0) {
        if (isInclusive) {
          base = Math.round((itemTotal / (1 + rate / 100)) * 100) / 100;
          tax = Math.round((itemTotal - base) * 100) / 100;
        } else {
          tax = Math.round((itemTotal * (rate / 100)) * 100) / 100;
        }
      }
      acc.taxableAmount += base;
      acc.totalTax += tax;
      return acc;
    },
    { taxableAmount: 0, totalTax: 0 }
  );

  const portalSettings = settings?.onlineReceivingPortal || {
    enabled: true,
    upiId: 'ziproo@upi',
    merchantName: 'ZIPROO APPAREL ATELIER',
    instructions: 'Transfer to UPI ID: ziproo@upi or scan QR code via Google Pay / PhonePe / Paytm. Enter the 12-digit UTR reference below.',
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Block checkout if cart has out-of-stock items
    if (hasOutOfStockItems) {
      setErrorMsg(
        `Cannot complete checkout: "${outOfStockItems.map((it) => it.product.name).join(', ')}" is currently OUT OF STOCK. Please remove it from your cart to proceed.`
      );
      return;
    }

    // Strict validation of customer details
    if (!customerName.trim() || !mobileNumber.trim() || !email.trim() || !completeAddress.trim() || !city.trim() || !state.trim() || !pinCode.trim()) {
      setErrorMsg('Please complete all required customer information: Full Name, Mobile Number, Email, Delivery Address, City, State, and PIN code.');
      return;
    }

    if (items.length === 0) {
      setErrorMsg('Your bag is empty. Please add at least one garment.');
      return;
    }

    if (paymentMethod === 'online_portal' && !transactionReference.trim()) {
      setErrorMsg('Please enter your 12-digit UPI Transaction Reference / UTR Number for online payment verification.');
      return;
    }

    setIsProcessing(true);

    try {
      const orderPayload = {
        customerName: customerName.trim(),
        mobileNumber: mobileNumber.trim(),
        email: email.trim(),
        completeAddress: completeAddress.trim(),
        city: city.trim(),
        state: state.trim(),
        pinCode: pinCode.trim(),
        paymentMethod,
        transactionReference: transactionReference.trim() || undefined,
        items: items.map((it) => ({
          productId: it.product.id,
          productName: it.product.name,
          category: it.product.category,
          size: it.size,
          quantity: it.quantity,
          price: it.product.price,
          image: it.product.image,
        })),
      };

      const token = customerToken || localStorage.getItem('ziproo_customer_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers,
        body: JSON.stringify(orderPayload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Server error: Failed to save order. Please check your network and try again.');
      }

      // Order saved successfully in backend database
      setCompletedOrder(data.order);
      onOrderCompleted(data.order);

      // Register or update customer particulars in admin database
      if (!currentCustomer || saveAddressToProfile) {
        try {
          await fetch('/api/customers/login-register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: customerName.trim(),
              phone: mobileNumber.trim(),
              email: email.trim(),
              address: completeAddress.trim(),
              city: city.trim(),
              state: state.trim(),
              pinCode: pinCode.trim(),
              location: `${city.trim()}, ${state.trim()}`,
            }),
          });
        } catch (custErr) {
          console.warn('Customer record sync note:', custErr);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error processing order. Order was not saved.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl my-8 max-h-[92vh] overflow-y-auto text-zinc-900">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-zinc-400 hover:text-zinc-900 p-1.5 rounded-lg hover:bg-zinc-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {completedOrder ? (
          /* ================= ORDER CONFIRMATION RECEIPT ================= */
          <div className="text-center space-y-6 py-4 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 mx-auto flex items-center justify-center shadow-md">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-mono uppercase tracking-[0.25em] text-[#7c3aed] font-semibold">
                Order Confirmed · ZIPROO Atelier
              </span>
              <h2 className="text-2xl sm:text-3xl font-black font-display uppercase tracking-tight text-zinc-950">
                Order Received Successfully!
              </h2>
              <p className="text-sm font-mono text-zinc-600">
                Order Reference: <strong className="text-zinc-950 font-bold">#{completedOrder.orderNumber}</strong>
              </p>
            </div>

            {/* Notification dispatch badges confirming real email to admin and customer updates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
              {/* Admin Email Badge */}
              <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-900">
                  <Mail className="w-4 h-4 text-[#7c3aed]" />
                  <span>Admin Email Notification</span>
                </div>
                <p className="text-[11px] text-zinc-600">
                  Dispatched to: <strong className="text-zinc-900 font-mono">{settings?.adminNotificationEmail || 'ziprooclothing@gmail.com'}</strong>
                </p>
                <div className="text-[10px] text-emerald-600 flex items-center gap-1 font-mono font-medium">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Complete order & customer details transmitted via Email</span>
                </div>
              </div>

              {/* Customer SMS Badge */}
              <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-900">
                  <Smartphone className="w-4 h-4 text-[#7c3aed]" />
                  <span>Customer SMS Notification</span>
                </div>
                <p className="text-[11px] text-zinc-600">
                  Registered Mobile: <strong className="text-zinc-900 font-mono">{completedOrder.mobileNumber}</strong>
                </p>
                <div className="text-[10px] text-zinc-500 flex items-center gap-1 font-mono">
                  <Clock className="w-3 h-3 text-[#7c3aed]" />
                  <span>Email confirmation active; SMS pending MSG91 key</span>
                </div>
              </div>
            </div>

            {/* Receipt Summary Card */}
            <div className="p-5 rounded-2xl bg-zinc-50 border border-zinc-200 text-left text-xs space-y-3">
              <div className="flex justify-between border-b border-zinc-200 pb-2">
                <span className="text-zinc-500">Customer:</span>
                <span className="text-zinc-900 font-semibold">{completedOrder.customerName}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-200 pb-2">
                <span className="text-zinc-500">Registered Mobile:</span>
                <span className="text-[#7c3aed] font-mono font-bold">{completedOrder.mobileNumber}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-200 pb-2">
                <span className="text-zinc-500">Delivery Address:</span>
                <span className="text-zinc-900 text-right max-w-xs font-medium">
                  {completedOrder.completeAddress}, {completedOrder.city}, {completedOrder.state} — {completedOrder.pinCode}
                </span>
              </div>
              <div className="flex justify-between border-b border-zinc-200 pb-2">
                <span className="text-zinc-500">Payment Selection:</span>
                <span className="text-zinc-900 uppercase font-bold">
                  {completedOrder.paymentMethod === 'cod'
                    ? 'Cash on Delivery (Pay on Arrival)'
                    : completedOrder.paymentMethod === 'online_portal'
                    ? 'Admin Online Portal (UPI / QR)'
                    : 'Razorpay Online Gateway'}
                </span>
              </div>
              {completedOrder.transactionReference && (
                <div className="flex justify-between border-b border-zinc-200 pb-2 font-mono">
                  <span className="text-zinc-500">UTR Reference:</span>
                  <span className="text-emerald-700 font-bold">{completedOrder.transactionReference}</span>
                </div>
              )}

              {/* Tax & GST Information stored with order */}
              {completedOrder.taxSummary && (
                <div className="pt-2 border-t border-zinc-200 space-y-1 font-mono text-[11px] text-zinc-600">
                  <div className="flex justify-between">
                    <span>Taxable Base (Pre-Tax):</span>
                    <span className="text-zinc-900">₹{completedOrder.taxSummary.taxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Central GST (CGST):</span>
                    <span className="text-zinc-900">₹{completedOrder.taxSummary.cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>State GST (SGST):</span>
                    <span className="text-zinc-900">₹{completedOrder.taxSummary.sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-purple-700">
                    <span>Total Applicable GST:</span>
                    <span>₹{completedOrder.taxSummary.totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-1 text-sm font-bold border-t border-zinc-200">
                <span className="text-zinc-700">Final Total Amount:</span>
                <span className="font-mono text-zinc-950 text-base">₹{completedOrder.totalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-4 text-xs font-bold uppercase tracking-widest text-white bg-black hover:bg-zinc-800 rounded-xl transition-all shadow-md"
            >
              Continue Browsing ZIPROO
            </button>
          </div>
        ) : (
          /* ================= CHECKOUT DETAILS FORM ================= */
          <div className="space-y-6">
            <div>
              <span className="text-xs uppercase font-mono text-[#7c3aed] tracking-widest font-semibold block mb-1">
                Secure Delivery & Verification
              </span>
              <h2 className="text-2xl font-black font-display uppercase tracking-tight text-zinc-950">
                Customer Checkout
              </h2>
              <p className="text-xs text-zinc-500 mt-1">
                Please enter your registered contact details and complete delivery address.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Customer Status & Address Auto-fill Banner with Edit Controls */}
            {currentCustomer ? (
              <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-[#7c3aed] shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-zinc-900 block">Signed in as {currentCustomer.name}</span>
                    <span className="text-[11px] text-purple-800 font-mono">
                      Modify recipient particulars & delivery address below for this specific order.
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsEditingParticulars(true)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-purple-100 hover:bg-purple-200 border border-purple-300 text-purple-900 text-[11px] font-mono font-semibold transition-colors"
                  >
                    <Edit3 className="w-3 h-3 text-[#7c3aed]" />
                    <span>Change Address</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleResetToProfile}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-700 hover:text-zinc-950 text-[11px] font-mono transition-colors shadow-xs"
                    title="Reset to saved profile address"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-zinc-500" />
                  <span className="text-zinc-700">Have a ZIPROO customer profile?</span>
                </div>
                {onOpenCustomerLogin && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenCustomerLogin();
                    }}
                    className="text-[#7c3aed] hover:text-purple-800 font-mono font-bold text-xs underline"
                  >
                    Sign In for 1-Click Autofill
                  </button>
                )}
              </div>
            )}

            <form onSubmit={handleSubmitOrder} className="space-y-6">
              {/* SECTION 1: Customer Contact Details */}
              <div className="space-y-3.5">
                <h3 className="text-xs uppercase font-mono tracking-wider text-zinc-900 font-bold flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-purple-100 text-[#7c3aed] inline-flex items-center justify-center text-[10px] font-bold">
                    1
                  </span>
                  <span>Customer Contact Details</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[11px] uppercase font-mono text-zinc-600 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Arjun Kapoor"
                      className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 placeholder:text-zinc-400 text-xs focus:outline-none focus:bg-white focus:border-[#7c3aed]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase font-mono text-zinc-600 mb-1">
                      Mobile Number (for SMS Tracking) *
                    </label>
                    <input
                      type="tel"
                      required
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 placeholder:text-zinc-400 text-xs font-mono focus:outline-none focus:bg-white focus:border-[#7c3aed]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] uppercase font-mono text-zinc-600 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="arjun@domain.com"
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 placeholder:text-zinc-400 text-xs focus:outline-none focus:bg-white focus:border-[#7c3aed]"
                  />
                </div>
              </div>

              {/* SECTION 2: Complete Delivery Address */}
              <div className="space-y-3.5 pt-2 border-t border-zinc-200">
                <h3 className="text-xs uppercase font-mono tracking-wider text-zinc-900 font-bold flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-purple-100 text-[#7c3aed] inline-flex items-center justify-center text-[10px] font-bold">
                    2
                  </span>
                  <span>Complete Delivery Address</span>
                </h3>

                <div>
                  <label className="block text-[11px] uppercase font-mono text-zinc-600 mb-1">
                    Flat, House No., Building, Street Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={completeAddress}
                    onChange={(e) => setCompleteAddress(e.target.value)}
                    placeholder="e.g. 402, Highline Atelier, 10th Cross, Indiranagar"
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 placeholder:text-zinc-400 text-xs focus:outline-none focus:bg-white focus:border-[#7c3aed]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] uppercase font-mono text-zinc-600 mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Bengaluru"
                      className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 placeholder:text-zinc-400 text-xs focus:outline-none focus:bg-white focus:border-[#7c3aed]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase font-mono text-zinc-600 mb-1">
                      State *
                    </label>
                    <select
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 text-xs focus:outline-none focus:bg-white focus:border-[#7c3aed]"
                    >
                      {INDIAN_STATES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase font-mono text-zinc-600 mb-1">
                      PIN Code *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={pinCode}
                      onChange={(e) => setPinCode(e.target.value)}
                      placeholder="560038"
                      className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 placeholder:text-zinc-400 text-xs font-mono focus:outline-none focus:bg-white focus:border-[#7c3aed]"
                    />
                  </div>
                </div>

                {/* Edit address option notification & profile sync */}
                {currentCustomer && (
                  <label className="flex items-center gap-2.5 p-3 rounded-xl bg-purple-50/60 border border-purple-200 cursor-pointer text-xs text-zinc-700 select-none hover:bg-purple-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={saveAddressToProfile}
                      onChange={(e) => setSaveAddressToProfile(e.target.checked)}
                      className="w-4 h-4 rounded accent-[#7c3aed] cursor-pointer"
                    />
                    <span>
                      Save any changed address & contact particulars to my permanent account profile
                    </span>
                  </label>
                )}
              </div>

              {/* SECTION 3: Payment Method with Online Amount Receiving Portal */}
              <div className="space-y-3.5 pt-2 border-t border-zinc-200">
                <h3 className="text-xs uppercase font-mono tracking-wider text-zinc-900 font-bold flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-purple-100 text-[#7c3aed] inline-flex items-center justify-center text-[10px] font-bold">
                    3
                  </span>
                  <span>Payment Selection</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* COD */}
                  <label
                    onClick={() => setPaymentMethod('cod')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                      paymentMethod === 'cod'
                        ? 'bg-purple-50/50 border-[#7c3aed] ring-1 ring-[#7c3aed]'
                        : 'bg-zinc-50 border-zinc-200 hover:border-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-xs text-zinc-900">
                      <Truck className="w-4 h-4 text-[#7c3aed]" />
                      <span>Cash on Delivery</span>
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-2">
                      Pay cash or UPI upon delivery.
                    </p>
                  </label>

                  {/* Online Amount Receiving Portal */}
                  <label
                    onClick={() => setPaymentMethod('online_portal')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                      paymentMethod === 'online_portal'
                        ? 'bg-purple-50/50 border-[#7c3aed] ring-1 ring-[#7c3aed]'
                        : 'bg-zinc-50 border-zinc-200 hover:border-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-xs text-zinc-900">
                      <QrCode className="w-4 h-4 text-[#7c3aed]" />
                      <span>Online Portal (UPI)</span>
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-2">
                      Scan QR or pay via official UPI ID.
                    </p>
                  </label>

                  {/* Razorpay Gateway */}
                  <label
                    onClick={() => setPaymentMethod('razorpay')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                      paymentMethod === 'razorpay'
                        ? 'bg-purple-50/50 border-[#7c3aed] ring-1 ring-[#7c3aed]'
                        : 'bg-zinc-50 border-zinc-200 hover:border-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-xs text-zinc-900">
                      <CreditCard className="w-4 h-4 text-[#7c3aed]" />
                      <span>Razorpay Online</span>
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-2">
                      Cards, NetBanking, UPI.
                    </p>
                  </label>
                </div>

                {/* Online Portal Details Box */}
                {paymentMethod === 'online_portal' && (
                  <div className="p-4 rounded-2xl bg-purple-50/40 border border-purple-200 space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono uppercase tracking-wider text-purple-900 font-bold">
                        Official Atelier Payment Portal
                      </span>
                      <span className="text-[10px] bg-purple-100 text-purple-900 border border-purple-300 px-2 py-0.5 rounded font-mono font-semibold">
                        Verified
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-white border border-purple-100 space-y-1 text-xs shadow-xs">
                      <div className="text-zinc-500">Official UPI ID:</div>
                      <div className="font-mono font-bold text-base text-zinc-950 tracking-wider">
                        {portalSettings.upiId}
                      </div>
                      <div className="text-[11px] text-zinc-600">
                        Merchant: <strong className="text-zinc-900">{portalSettings.merchantName}</strong>
                      </div>
                    </div>

                    <p className="text-xs text-zinc-700 leading-relaxed">
                      {portalSettings.instructions}
                    </p>

                    <div>
                      <label className="block text-[11px] uppercase font-mono text-zinc-700 font-semibold mb-1">
                        12-Digit UPI UTR / Transaction Reference ID *
                      </label>
                      <input
                        type="text"
                        required
                        value={transactionReference}
                        onChange={(e) => setTransactionReference(e.target.value)}
                        placeholder="e.g. 426819284019"
                        className="w-full px-3.5 py-2.5 bg-white border border-zinc-300 rounded-xl text-zinc-900 text-xs font-mono focus:outline-none focus:border-[#7c3aed]"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Order Items & Totals Breakdown */}
              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2.5 text-xs">
                <div className="text-zinc-600 font-mono uppercase text-[10px] tracking-wider pb-1 border-b border-zinc-200">
                  Cart Order Summary ({items.reduce((s, it) => s + it.quantity, 0)} Items):
                </div>

                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {items.map((it, idx) => {
                    const isItemOutOfStock = !it.product.inStock || (it.product.piecesAvailable !== undefined && it.product.piecesAvailable <= 0);
                    return (
                      <div key={idx} className="flex justify-between items-center text-zinc-700">
                        <div className="flex items-center gap-1.5 truncate pr-2">
                          <span className="truncate">{it.product.name}</span>
                          <strong className="text-[#7c3aed]">[{it.size}]</strong>
                          <span>x{it.quantity}</span>
                          {isItemOutOfStock && (
                            <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-700 text-[9px] font-mono font-bold uppercase shrink-0">
                              OUT OF STOCK
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-zinc-950 font-semibold shrink-0">₹{(it.product.price * it.quantity).toLocaleString('en-IN')}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Out of Stock Warning Banner */}
                {hasOutOfStockItems && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                      <span>OUT OF STOCK ITEMS IN BAG:</span>
                    </div>
                    <ul className="list-disc list-inside text-[11px] pl-1 space-y-0.5 text-red-800">
                      {outOfStockItems.map((it, idx) => (
                        <li key={idx}>
                          <strong>{it.product.name}</strong> [{it.size}] is currently OUT OF STOCK.
                        </li>
                      ))}
                    </ul>
                    <p className="text-[10px] text-red-600 pt-0.5">
                      Please remove out of stock items from your cart before confirming your order.
                    </p>
                  </div>
                )}

                <div className="pt-2 border-t border-zinc-200 space-y-1">
                  <div className="flex justify-between text-zinc-600">
                    <span>Taxable Base (Pre-Tax):</span>
                    <span className="font-mono text-zinc-900">₹{estimatedTaxDetails.taxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-zinc-600">
                    <span>Applicable GST (CGST + SGST):</span>
                    <span className="font-mono text-purple-700 font-semibold">₹{estimatedTaxDetails.totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-zinc-600">
                    <span>All-India Express Delivery:</span>
                    <span className="font-mono text-zinc-900">
                      {shipping === 0 ? <strong className="text-emerald-700">FREE</strong> : `₹${shipping}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-zinc-950 pt-2 border-t border-zinc-200">
                    <span>Final Total Customer Price:</span>
                    <span className="font-mono text-[#7c3aed] text-base">₹{total.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Security reassurance */}
              <div className="flex items-center gap-2 text-[11px] text-zinc-500 font-mono">
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Customer data encrypted. Real-time email notification to ziprooclothing@gmail.com</span>
              </div>

              <button
                type="submit"
                disabled={isProcessing || hasOutOfStockItems}
                className={`w-full py-4 text-xs font-bold uppercase tracking-widest text-white rounded-xl transition-all shadow-md active:scale-98 disabled:opacity-50 ${
                  hasOutOfStockItems
                    ? 'bg-red-600 hover:bg-red-700 cursor-not-allowed'
                    : 'bg-black hover:bg-zinc-800'
                }`}
              >
                {hasOutOfStockItems
                  ? 'Cannot Checkout · Remove Out of Stock Items'
                  : isProcessing
                  ? 'Processing Order & Dispatching Notifications...'
                  : `Confirm Order · ₹${total.toLocaleString('en-IN')}`}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
