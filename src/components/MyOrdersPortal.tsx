import React, { useState, useEffect } from 'react';
import {
  X,
  Package,
  Calendar,
  CreditCard,
  Truck,
  CheckCircle2,
  Clock,
  Navigation,
  AlertCircle,
  Copy,
  Check,
  Search,
  RefreshCw,
  LogOut,
  User,
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  MapPin,
  ExternalLink,
  Phone,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import type { Customer, Order, OrderStatus } from '../types/index.js';

interface MyOrdersPortalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCustomer: Customer | null;
  onCustomerLogin: (customer: Customer, token?: string) => void;
  onCustomerLogout: () => void;
  onNavigateToShop?: () => void;
  initialSelectedOrderId?: string;
}

const TIMELINE_STEPS: { key: string; label: string; sublabel: string; icon: any }[] = [
  { key: 'confirmed', label: 'Order Confirmed', sublabel: 'Order verified & recorded in atelier ledger', icon: CheckCircle2 },
  { key: 'processing', label: 'Processing', sublabel: 'Heavyweight fabric cut & QC tailoring', icon: Clock },
  { key: 'shipped', label: 'Shipped', sublabel: 'Handed over to express courier', icon: Truck },
  { key: 'out_for_delivery', label: 'Out for Delivery', sublabel: 'Courier is delivering package today', icon: Navigation },
  { key: 'delivered', label: 'Delivered', sublabel: 'Package received by recipient', icon: Package },
];

export const MyOrdersPortal: React.FC<MyOrdersPortalProps> = ({
  isOpen,
  onClose,
  currentCustomer,
  onCustomerLogin,
  onCustomerLogout,
  onNavigateToShop,
  initialSelectedOrderId,
}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Customer Login Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regCity, setRegCity] = useState('');
  const [regState, setRegState] = useState('Karnataka');
  const [regPinCode, setRegPinCode] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // Fetch orders for customer
  const fetchOrders = async (emailParam?: string, phoneParam?: string) => {
    const emailToUse = emailParam || currentCustomer?.email;
    const phoneToUse = phoneParam || currentCustomer?.phone;
    if (!emailToUse && !phoneToUse) return;

    setIsLoadingOrders(true);
    try {
      const qEmail = encodeURIComponent(emailToUse || '');
      const qPhone = encodeURIComponent(phoneToUse || '');
      const token = localStorage.getItem('ziproo_customer_token');

      const res = await fetch(`/api/customers/orders?email=${qEmail}&phone=${qPhone}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        const data = await res.json();
        const loadedOrders = data.orders || [];
        setOrders(loadedOrders);

        if (initialSelectedOrderId) {
          const match = loadedOrders.find(
            (o: Order) => o.id === initialSelectedOrderId || o.orderNumber === initialSelectedOrderId
          );
          if (match) setSelectedOrder(match);
        }
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (isOpen && currentCustomer) {
      fetchOrders();
    }
  }, [isOpen, currentCustomer]);

  if (!isOpen) return null;

  const handleCopy = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedOrderId(id);
    setTimeout(() => setCopiedOrderId(null), 2200);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!loginEmail.trim()) {
      setAuthError('Please enter your email address');
      return;
    }

    setIsAuthLoading(true);
    try {
      const res = await fetch('/api/customers/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginEmail.trim(),
          password: loginPassword || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to authenticate');
      }

      if (data.token) {
        localStorage.setItem('ziproo_customer_token', data.token);
      }
      onCustomerLogin(data.customer, data.token);
      fetchOrders(data.customer.email, data.customer.phone);
    } catch (err: any) {
      setAuthError(err.message || 'Authentication error. Please check your credentials.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!regName.trim() || !loginEmail.trim() || !regPhone.trim()) {
      setAuthError('Name, Email, and Phone number are required.');
      return;
    }

    setIsAuthLoading(true);
    try {
      const res = await fetch('/api/customers/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName.trim(),
          email: loginEmail.trim(),
          phone: regPhone.trim(),
          address: regAddress.trim(),
          city: regCity.trim(),
          state: regState.trim(),
          pinCode: regPinCode.trim(),
          password: loginPassword || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      if (data.token) {
        localStorage.setItem('ziproo_customer_token', data.token);
      }
      onCustomerLogin(data.customer, data.token);
      fetchOrders(data.customer.email, data.customer.phone);
    } catch (err: any) {
      setAuthError(err.message || 'Error creating account.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Status mapping for timeline progress
  const getProgressIndex = (status: OrderStatus): number => {
    const s = String(status).toLowerCase();
    if (s.includes('delivered')) return 4;
    if (s.includes('out for delivery') || s.includes('out_for_delivery')) return 3;
    if (s.includes('shipped')) return 2;
    if (s.includes('processing')) return 1;
    if (s.includes('confirmed')) return 0;
    return 0;
  };

  const getStatusBadge = (status: OrderStatus) => {
    const s = String(status).toLowerCase();
    if (s.includes('delivered')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (s.includes('out for delivery') || s.includes('out_for_delivery')) {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    if (s.includes('shipped')) {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    if (s.includes('processing')) {
      return 'bg-purple-50 text-purple-700 border-purple-200';
    }
    if (s.includes('cancelled')) {
      return 'bg-red-50 text-red-700 border-red-200';
    }
    return 'bg-zinc-100 text-zinc-800 border-zinc-200';
  };

  const filteredOrders = orders.filter((order) => {
    if (statusFilter !== 'all') {
      const orderSt = String(order.orderStatus).toLowerCase();
      if (statusFilter === 'confirmed' && !orderSt.includes('confirmed')) return false;
      if (statusFilter === 'processing' && !orderSt.includes('processing')) return false;
      if (statusFilter === 'shipped' && !orderSt.includes('shipped')) return false;
      if (statusFilter === 'out_for_delivery' && !orderSt.includes('out for delivery') && !orderSt.includes('out_for_delivery')) return false;
      if (statusFilter === 'delivered' && !orderSt.includes('delivered')) return false;
      if (statusFilter === 'cancelled' && !orderSt.includes('cancelled')) return false;
      if (statusFilter === 'paid' && order.paymentStatus !== 'Paid') return false;
      if (statusFilter === 'cod' && order.paymentMethod !== 'cod') return false;
    }

    if (searchFilter.trim()) {
      const q = searchFilter.trim().toLowerCase();
      const matchId = order.orderNumber.toLowerCase().includes(q) || order.id.toLowerCase().includes(q);
      const matchItem = order.items.some((it) => it.productName.toLowerCase().includes(q));
      return matchId || matchItem;
    }

    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white border border-zinc-200 rounded-3xl shadow-2xl text-zinc-900 my-auto max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* ================= HEADER BAR ================= */}
        <div className="p-5 sm:p-6 border-b border-zinc-200 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-purple-50 border border-purple-200 text-[#7c3aed] flex items-center justify-center shadow-xs">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#7c3aed] font-bold">
                  ZIPROO Customer Portal
                </span>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#7c3aed]" />
                <span className="text-[10px] font-mono text-zinc-400">Est. 2026</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black font-display uppercase tracking-tight text-zinc-950">
                My Orders & Tracking
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentCustomer && (
              <button
                onClick={() => {
                  localStorage.removeItem('ziproo_customer_token');
                  onCustomerLogout();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-semibold text-zinc-600 hover:text-red-600 rounded-lg hover:bg-zinc-100 transition-colors"
                title="Log out of customer account"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-zinc-950 rounded-xl hover:bg-zinc-100 transition-colors"
              aria-label="Close portal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ================= BODY ================= */}
        {!currentCustomer ? (
          /* ================= GUEST / AUTHENTICATION REQUIRED VIEW ================= */
          <div className="p-6 sm:p-10 overflow-y-auto flex-1 max-w-lg mx-auto w-full space-y-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-purple-50 text-[#7c3aed] mx-auto flex items-center justify-center border border-purple-200 shadow-sm">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold uppercase font-display text-zinc-950">
                {isRegisterMode ? 'Create Customer Account' : 'Log In to View My Orders'}
              </h3>
              <p className="text-xs text-zinc-600 max-w-sm mx-auto leading-relaxed">
                {isRegisterMode
                  ? 'Enter your particulars to register your verified ZIPROO customer profile.'
                  : 'Enter your registered email address to securely access your order history, purchased apparel, and live shipping status.'}
              </p>
            </div>

            {authError && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{authError}</span>
              </div>
            )}

            {!isRegisterMode ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-zinc-700 mb-1 font-semibold">
                    Customer Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="e.g. arjun@domain.com"
                      className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 text-sm focus:outline-none focus:border-[#7c3aed] focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-mono uppercase text-zinc-700 font-semibold">
                      Account Password (Optional)
                    </label>
                    <span className="text-[10px] text-zinc-400 font-mono">Leave blank for 1-click email login</span>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3.5" />
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Enter password if created"
                      className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 text-sm focus:outline-none focus:border-[#7c3aed] focus:bg-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isAuthLoading}
                  className="w-full py-3.5 px-4 text-xs font-bold uppercase tracking-widest text-white bg-black hover:bg-zinc-800 rounded-xl transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Package className="w-4 h-4" />
                  <span>{isAuthLoading ? 'Authenticating...' : 'Access My Orders Portal'}</span>
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthError('');
                      setIsRegisterMode(true);
                    }}
                    className="text-xs text-[#7c3aed] hover:text-purple-900 font-semibold underline"
                  >
                    Don't have a profile yet? Register here
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-zinc-700 mb-1 font-semibold">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Arjun Kapoor"
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 text-xs focus:outline-none focus:border-[#7c3aed]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-zinc-700 mb-1 font-semibold">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="arjun@domain.com"
                      className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 text-xs focus:outline-none focus:border-[#7c3aed]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono uppercase text-zinc-700 mb-1 font-semibold">
                      Mobile Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 text-xs font-mono focus:outline-none focus:border-[#7c3aed]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-zinc-700 mb-1 font-semibold">
                    Street Address (Default Delivery Destination)
                  </label>
                  <input
                    type="text"
                    value={regAddress}
                    onChange={(e) => setRegAddress(e.target.value)}
                    placeholder="Flat 402, Highline Atelier, 10th Cross"
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 text-xs focus:outline-none focus:border-[#7c3aed]"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-zinc-700 mb-1">City</label>
                    <input
                      type="text"
                      value={regCity}
                      onChange={(e) => setRegCity(e.target.value)}
                      placeholder="Bengaluru"
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-zinc-700 mb-1">State</label>
                    <input
                      type="text"
                      value={regState}
                      onChange={(e) => setRegState(e.target.value)}
                      placeholder="Karnataka"
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-zinc-700 mb-1">PIN Code</label>
                    <input
                      type="text"
                      value={regPinCode}
                      onChange={(e) => setRegPinCode(e.target.value)}
                      placeholder="560038"
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-zinc-700 mb-1 font-semibold">
                    Password (Optional)
                  </label>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Create a password (min 6 characters)"
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 text-xs focus:outline-none focus:border-[#7c3aed]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isAuthLoading}
                  className="w-full py-3.5 px-4 text-xs font-bold uppercase tracking-widest text-white bg-black hover:bg-zinc-800 rounded-xl transition-all shadow-md active:scale-98 disabled:opacity-50 mt-2"
                >
                  {isAuthLoading ? 'Creating Profile...' : 'Register & Access Orders'}
                </button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthError('');
                      setIsRegisterMode(false);
                    }}
                    className="text-xs text-zinc-600 hover:text-black font-semibold underline"
                  >
                    Already have an account? Sign in here
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          /* ================= AUTHENTICATED CUSTOMER ORDERS PORTAL ================= */
          <div className="flex-1 overflow-y-auto flex flex-col p-5 sm:p-6 space-y-6">
            
            {/* Customer Profile Banner */}
            <div className="p-4 sm:p-5 rounded-2xl bg-zinc-50 border border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-black text-white flex items-center justify-center font-bold text-base font-mono shadow-sm">
                  {currentCustomer.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-zinc-950">{currentCustomer.name}</h3>
                    <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-mono font-bold">
                      Verified Customer
                    </span>
                  </div>
                  <p className="text-xs text-zinc-600 font-mono mt-0.5">
                    {currentCustomer.email} · {currentCustomer.phone}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  onClick={() => fetchOrders()}
                  disabled={isLoadingOrders}
                  className="p-2 rounded-xl bg-white border border-zinc-200 text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 transition-colors shadow-xs"
                  title="Refresh order statuses"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingOrders ? 'animate-spin text-[#7c3aed]' : ''}`} />
                </button>
                <div className="text-xs font-mono text-zinc-500 bg-white border border-zinc-200 px-3 py-2 rounded-xl">
                  Total Orders: <strong className="text-zinc-950 font-bold">{orders.length}</strong>
                </div>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Filter by Order ID or Product name..."
                  className="w-full pl-9 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:border-[#7c3aed] focus:bg-white"
                />
                {searchFilter && (
                  <button
                    onClick={() => setSearchFilter('')}
                    className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-700 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Status Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none text-xs">
                {[
                  { id: 'all', label: 'All Orders' },
                  { id: 'confirmed', label: 'Confirmed' },
                  { id: 'processing', label: 'Processing' },
                  { id: 'shipped', label: 'Shipped' },
                  { id: 'out_for_delivery', label: 'Out for Delivery' },
                  { id: 'delivered', label: 'Delivered' },
                  { id: 'cancelled', label: 'Cancelled' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setStatusFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-lg font-mono text-[11px] whitespace-nowrap transition-all uppercase tracking-wider ${
                      statusFilter === tab.id
                        ? 'bg-black text-white font-bold shadow-xs'
                        : 'bg-zinc-100 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Orders Feed */}
            {isLoadingOrders ? (
              <div className="py-20 text-center text-zinc-500 font-mono text-xs space-y-3">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#7c3aed]" />
                <p>Retrieving your ZIPROO atelier orders & tracking data...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="py-16 px-4 text-center rounded-2xl bg-zinc-50 border border-zinc-200 space-y-3">
                <Package className="w-12 h-12 mx-auto text-zinc-400" />
                <h4 className="text-base font-bold text-zinc-950 uppercase font-display">No Orders Found</h4>
                <p className="text-xs text-zinc-600 max-w-md mx-auto">
                  {orders.length === 0
                    ? `No orders have been recorded under ${currentCustomer.email}. Check out our limited drops and create your identity.`
                    : 'No orders match your filter criteria.'}
                </p>
                {onNavigateToShop && orders.length === 0 && (
                  <button
                    onClick={() => {
                      onClose();
                      onNavigateToShop();
                    }}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-black text-white font-bold text-xs uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-md mt-2"
                  >
                    <span>Shop Latest Capsule</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {filteredOrders.map((order) => {
                  const progressIdx = getProgressIndex(order.orderStatus);
                  const isCancelled = order.orderStatus === 'Cancelled';
                  const orderDate = new Date(order.createdAt).toLocaleString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div
                      key={order.id}
                      className="p-5 sm:p-6 rounded-2xl bg-white border border-zinc-200 hover:border-purple-300 shadow-sm transition-all space-y-5"
                    >
                      {/* Top Bar: Order ID, Date, Status */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100">
                        <div>
                          <div className="flex items-center gap-2.5">
                            <span className="text-[10px] font-mono uppercase text-zinc-400 font-bold">Order ID:</span>
                            <span className="text-sm font-mono font-bold text-zinc-950">
                              #{order.orderNumber}
                            </span>
                            <button
                              onClick={(e) => handleCopy(order.orderNumber, e)}
                              className="p-1 text-zinc-400 hover:text-zinc-900 rounded hover:bg-zinc-100 transition-colors"
                              title="Copy Order ID"
                            >
                              {copiedOrderId === order.orderNumber ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                          <div className="flex items-center gap-2 text-xs font-mono text-zinc-500 mt-1">
                            <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                            <span>Placed on {orderDate}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider border ${getStatusBadge(
                              order.orderStatus
                            )}`}
                          >
                            ● {order.orderStatus}
                          </span>
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider border ${
                              order.paymentStatus === 'Paid'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            {order.paymentStatus}
                          </span>
                        </div>
                      </div>

                      {/* Visual Order Tracking Timeline Stepper */}
                      {!isCancelled ? (
                        <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-[11px] font-mono uppercase font-bold text-purple-900 tracking-wider flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-[#7c3aed]" />
                              <span>Live Order Progress Timeline</span>
                            </span>
                            <span className="text-[10px] font-mono text-zinc-500">
                              Step {progressIdx + 1} of 5
                            </span>
                          </div>

                          {/* Stepper Track */}
                          <div className="grid grid-cols-5 gap-1.5 sm:gap-2 relative">
                            {TIMELINE_STEPS.map((step, idx) => {
                              const isCompleted = idx <= progressIdx;
                              const isCurrent = idx === progressIdx;
                              const IconComponent = step.icon;

                              return (
                                <div key={step.key} className="flex flex-col items-center text-center space-y-1.5">
                                  {/* Step Circle */}
                                  <div
                                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all ${
                                      isCurrent
                                        ? 'bg-[#7c3aed] text-white shadow-md ring-4 ring-purple-100 scale-105'
                                        : isCompleted
                                        ? 'bg-emerald-600 text-white shadow-xs'
                                        : 'bg-zinc-200 text-zinc-400'
                                    }`}
                                  >
                                    <IconComponent className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                  </div>

                                  {/* Step Label */}
                                  <div className="space-y-0.5">
                                    <div
                                      className={`text-[10px] sm:text-[11px] font-bold uppercase leading-tight line-clamp-1 ${
                                        isCurrent
                                          ? 'text-[#7c3aed]'
                                          : isCompleted
                                          ? 'text-zinc-900'
                                          : 'text-zinc-400'
                                      }`}
                                    >
                                      {step.label}
                                    </div>
                                    <div className="text-[9px] text-zinc-500 hidden md:block line-clamp-1 font-mono">
                                      {step.sublabel}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Tracking Details if In-Transit */}
                          {order.trackingInfo?.trackingNumber && (
                            <div className="mt-3 pt-3 border-t border-zinc-200/80 flex flex-wrap items-center justify-between text-xs font-mono text-zinc-700">
                              <div>
                                <span>Courier: <strong>{order.trackingInfo.carrier || 'Express Roadway'}</strong></span>
                                <span className="mx-2">·</span>
                                <span>Waybill: <strong className="text-[#7c3aed]">#{order.trackingInfo.trackingNumber}</strong></span>
                              </div>
                              {order.trackingInfo.estimatedDelivery && (
                                <span className="text-emerald-700 font-semibold">
                                  ETA: {order.trackingInfo.estimatedDelivery}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                          <span>This order was cancelled. Any authorized refund has been credited.</span>
                        </div>
                      )}

                      {/* Purchased Apparel Items List (With Name, Image, Size, Colour, Qty, Price) */}
                      <div className="space-y-3">
                        <div className="text-[11px] font-mono uppercase text-zinc-500 font-bold tracking-wider">
                          Purchased Products ({order.items.reduce((s, it) => s + it.quantity, 0)} Items):
                        </div>

                        <div className="divide-y divide-zinc-100 border border-zinc-200 rounded-xl overflow-hidden bg-white">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="p-3 sm:p-4 flex items-center justify-between gap-4">
                              <div className="flex items-center gap-3.5">
                                <img
                                  src={item.image}
                                  alt={item.productName}
                                  className="w-14 h-16 sm:w-16 sm:h-20 object-cover rounded-xl bg-zinc-100 border border-zinc-200 shrink-0"
                                />
                                <div>
                                  <h5 className="text-xs sm:text-sm font-bold uppercase text-zinc-950 line-clamp-1">
                                    {item.productName}
                                  </h5>
                                  <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-zinc-600 mt-1">
                                    <span className="text-purple-700 font-bold">Size: [{item.size}]</span>
                                    <span>·</span>
                                    <span>Colour: <strong className="text-zinc-900">{item.color || 'Deep Onyx Black'}</strong></span>
                                    <span>·</span>
                                    <span>Qty: {item.quantity}</span>
                                  </div>
                                  <div className="text-[11px] font-mono text-zinc-500 mt-0.5">
                                    Individual Price: ₹{item.price.toLocaleString('en-IN')}
                                  </div>
                                </div>
                              </div>

                              <div className="text-right">
                                <span className="text-sm sm:text-base font-bold font-mono text-zinc-950">
                                  ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Footer Summary & Shipping Destination */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-zinc-100 text-xs">
                        <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1">
                          <span className="text-[10px] font-mono uppercase text-zinc-400 font-bold block">
                            Shipping Destination:
                          </span>
                          <div className="font-bold text-zinc-900">{order.customerName}</div>
                          <div className="text-zinc-600 leading-relaxed text-[11px]">
                            {order.completeAddress}, {order.city}, {order.state} - {order.pinCode}
                          </div>
                          <div className="text-[11px] text-zinc-500 font-mono">
                            Contact Phone: {order.mobileNumber}
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 flex flex-col justify-between space-y-1">
                          <div>
                            <span className="text-[10px] font-mono uppercase text-zinc-400 font-bold block">
                              Payment Summary:
                            </span>
                            <div className="flex justify-between text-zinc-600 mt-1">
                              <span>Payment Method:</span>
                              <strong className="text-zinc-900 uppercase">
                                {order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod === 'online_portal' ? 'UPI Portal' : 'Razorpay'}
                              </strong>
                            </div>
                            <div className="flex justify-between text-zinc-600">
                              <span>Delivery Fee:</span>
                              <span className="font-mono text-zinc-900">{order.shipping === 0 ? 'FREE' : `₹${order.shipping}`}</span>
                            </div>
                          </div>

                          <div className="flex justify-between items-baseline pt-2 border-t border-zinc-200 font-bold">
                            <span className="text-zinc-950 text-xs uppercase tracking-wider">Total Charged:</span>
                            <span className="text-base font-mono text-[#7c3aed]">
                              ₹{order.totalAmount.toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* View Single Order Full Details Button */}
                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={() => setSelectedOrder(order)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-bold text-xs uppercase tracking-wider transition-colors shadow-xs"
                        >
                          <span>View Full Order Details</span>
                          <ChevronRight className="w-3.5 h-3.5 text-[#7c3aed]" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================= INDIVIDUAL ORDER DETAILS MODAL ================= */}
        {selectedOrder && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="relative w-full max-w-2xl bg-white border border-zinc-200 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto text-zinc-900">
              <button
                onClick={() => setSelectedOrder(null)}
                className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-zinc-950 rounded-lg hover:bg-zinc-100"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="border-b border-zinc-200 pb-3">
                <span className="text-[10px] font-mono uppercase text-[#7c3aed] font-bold tracking-widest block">
                  Individual Order Dossier
                </span>
                <h3 className="text-xl font-bold font-display uppercase tracking-tight text-zinc-950">
                  Order #{selectedOrder.orderNumber}
                </h3>
                <p className="text-xs text-zinc-500 font-mono mt-0.5">
                  Placed on {new Date(selectedOrder.createdAt).toLocaleString('en-IN')}
                </p>
              </div>

              {/* Status and Payment Badges */}
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase border ${getStatusBadge(selectedOrder.orderStatus)}`}>
                  ● {selectedOrder.orderStatus}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase border ${selectedOrder.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                  Payment: {selectedOrder.paymentStatus}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-mono uppercase bg-zinc-100 text-zinc-700 border border-zinc-200">
                  Method: {selectedOrder.paymentMethod.toUpperCase()}
                </span>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                <h4 className="text-xs uppercase font-mono font-bold text-zinc-800 tracking-wider">
                  Purchased Garments:
                </h4>
                <div className="space-y-2">
                  {selectedOrder.items.map((it, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3">
                        <img src={it.image} alt={it.productName} className="w-12 h-14 object-cover rounded-lg bg-zinc-100 border border-zinc-200" />
                        <div>
                          <span className="font-bold text-zinc-950 uppercase block">{it.productName}</span>
                          <span className="text-purple-700 font-mono text-[11px] block">
                            Size: [{it.size}] · Colour: {it.color || 'Deep Onyx Black'} · Qty: {it.quantity}
                          </span>
                        </div>
                      </div>
                      <div className="font-mono font-bold text-zinc-950">
                        ₹{(it.price * it.quantity).toLocaleString('en-IN')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Address & Carrier */}
              <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-xs space-y-1">
                <span className="text-[10px] font-mono uppercase text-zinc-500 font-bold block">Delivery Address:</span>
                <div className="font-bold text-zinc-900">{selectedOrder.customerName}</div>
                <div className="text-zinc-600">{selectedOrder.completeAddress}</div>
                <div className="text-zinc-600">{selectedOrder.city}, {selectedOrder.state} - {selectedOrder.pinCode}</div>
                <div className="text-zinc-500 font-mono mt-1">Phone: {selectedOrder.mobileNumber} · Email: {selectedOrder.email}</div>
              </div>

              {/* Price Breakdown */}
              <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-xs space-y-1.5 font-mono">
                <div className="flex justify-between text-zinc-600">
                  <span>Subtotal:</span>
                  <span>₹{selectedOrder.subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>Shipping:</span>
                  <span>{selectedOrder.shipping === 0 ? 'FREE' : `₹${selectedOrder.shipping}`}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-zinc-950 pt-2 border-t border-zinc-200">
                  <span>Total Amount:</span>
                  <span className="text-[#7c3aed]">₹{selectedOrder.totalAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="px-5 py-2.5 rounded-xl bg-black text-white font-bold text-xs uppercase tracking-wider hover:bg-zinc-800 transition-colors shadow-sm"
                >
                  Close Dossier
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
