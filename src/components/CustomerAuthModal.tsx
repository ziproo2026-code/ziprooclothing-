import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Edit3,
  ShoppingBag,
  Package,
  Calendar,
  Copy,
  Check,
  Truck,
  ArrowRight,
  RefreshCw,
  Lock,
  Clock,
  Eye,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { Customer, Order } from '../types/index.js';

interface CustomerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCustomer: Customer | null;
  customerToken?: string | null;
  onCustomerLogin: (customer: Customer, token?: string) => void;
  onCustomerLogout: () => void;
  initialTab?: 'profile' | 'orders';
  onTrackOrder?: (orderNumber: string) => void;
  onNavigateToShop?: () => void;
}

const TIMELINE_STEPS = [
  { id: 'confirmed', label: 'Order Confirmed', icon: CheckCircle2 },
  { id: 'processing', label: 'Processing', icon: Package },
  { id: 'shipped', label: 'Shipped', icon: Truck },
  { id: 'out_for_delivery', label: 'Out for Delivery', icon: MapPin },
  { id: 'delivered', label: 'Delivered', icon: Check },
];

export const CustomerAuthModal: React.FC<CustomerAuthModalProps> = ({
  isOpen,
  onClose,
  currentCustomer,
  customerToken,
  onCustomerLogin,
  onCustomerLogout,
  initialTab = 'profile',
  onTrackOrder,
  onNavigateToShop,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'orders'>('profile');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Login form fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [location, setLocation] = useState('');
  const [isEditingAddress, setIsEditingAddress] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Orders State
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  useEffect(() => {
    if (currentCustomer) {
      setName(currentCustomer.name || '');
      setPhone(currentCustomer.phone || '');
      setEmail(currentCustomer.email && !currentCustomer.email.includes('@ziproo-customer.com') ? currentCustomer.email : '');
      setAddress(currentCustomer.address || '');
      setCity(currentCustomer.city || '');
      setState(currentCustomer.state || '');
      setPinCode(currentCustomer.pinCode || '');
      setLocation(currentCustomer.location || '');
      setIsEditingAddress(false);
    } else {
      setIsEditingAddress(true);
      if (initialTab === 'orders') {
        setActiveTab('orders');
        setAuthMode('login');
      }
    }
  }, [currentCustomer, isOpen, initialTab]);

  // Fetch orders for customer using secure Bearer authentication
  const fetchCustomerOrders = async () => {
    if (!currentCustomer) {
      setOrders([]);
      return;
    }
    setIsLoadingOrders(true);
    try {
      const token = customerToken || localStorage.getItem('ziproo_customer_token');
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/customers/orders', { headers });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      } else if (res.status === 401 || res.status === 403) {
        setOrders([]);
      }
    } catch (err) {
      console.error('Failed to fetch customer orders:', err);
      setOrders([]);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (isOpen && currentCustomer && activeTab === 'orders') {
      fetchCustomerOrders();
    } else if (!currentCustomer) {
      setOrders([]);
    }
  }, [isOpen, currentCustomer, activeTab]);

  if (!isOpen) return null;

  const handleLogoutClick = () => {
    onCustomerLogout();
    setOrders([]);
    try {
      localStorage.removeItem('ziproo_customer_token');
      localStorage.removeItem('ziproo_customer');
    } catch {
      // Storage fallback
    }
    setSuccessMsg('You have successfully logged out.');
    setActiveTab('orders');
    setAuthMode('login');
    setTimeout(() => {
      setSuccessMsg('');
    }, 1500);
  };

  const handleCopyOrderId = (orderId: string) => {
    navigator.clipboard.writeText(orderId);
    setCopiedOrderId(orderId);
    setTimeout(() => setCopiedOrderId(null), 2000);
  };

  // Secure Email Login for Customer
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!loginEmail.trim()) {
      setError('Please enter your email address to access your orders.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/customers/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginEmail.trim(),
          password: loginPassword.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to authenticate');
      }

      onCustomerLogin(data.customer, data.token);
      setSuccessMsg(data.message || `Welcome back, ${data.customer.name}!`);
      setActiveTab('orders');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify your email or register.');
    } finally {
      setIsLoading(false);
    }
  };

  // Registration or Address Save
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!name.trim() || !phone.trim() || !address.trim() || !location.trim()) {
      setError('Please provide Name, Phone Number, Delivery Address, and Location.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/customers/login-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          address: address.trim(),
          city: city.trim() || 'Bengaluru',
          state: state.trim() || 'Karnataka',
          pinCode: pinCode.trim() || '560001',
          location: location.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save customer particulars');
      }

      onCustomerLogin(data.customer);
      setSuccessMsg(currentCustomer ? 'Delivery particulars updated successfully!' : 'Welcome to ZIPROO! Profile & address registered.');
      setIsEditingAddress(false);
    } catch (err: any) {
      setError(err.message || 'Network error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: Order['orderStatus']) => {
    const s = (status || '').toLowerCase();
    if (s.includes('delivered')) return 'bg-emerald-50 border-emerald-200 text-emerald-700';
    if (s.includes('out for delivery') || s.includes('out_for_delivery')) return 'bg-amber-50 border-amber-200 text-amber-700';
    if (s.includes('shipped')) return 'bg-cyan-50 border-cyan-200 text-cyan-700';
    if (s.includes('confirmed') || s.includes('processing')) return 'bg-purple-50 border-purple-200 text-purple-700';
    if (s.includes('cancelled')) return 'bg-red-50 border-red-200 text-red-700';
    return 'bg-zinc-100 border-zinc-200 text-zinc-700';
  };

  const getTimelineStepIndex = (status: Order['orderStatus']) => {
    const s = (status || '').toLowerCase();
    if (s.includes('delivered')) return 4;
    if (s.includes('out for delivery') || s.includes('out_for_delivery')) return 3;
    if (s.includes('shipped')) return 2;
    if (s.includes('processing')) return 1;
    if (s.includes('confirmed')) return 0;
    return 0;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white border border-zinc-200 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto text-zinc-900">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-[#7c3aed] shrink-0">
              {activeTab === 'orders' ? <Package className="w-5 h-5" /> : <User className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold font-display uppercase tracking-wide text-zinc-950">
                  {currentCustomer ? (activeTab === 'orders' ? 'My Orders Portal' : 'Customer Account') : 'Customer Orders & Login'}
                </h2>
                {currentCustomer && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-mono font-bold">
                    Active Session
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500">
                {currentCustomer
                  ? `Authenticated as ${currentCustomer.name} (${currentCustomer.email || currentCustomer.phone})`
                  : 'Log in with your email to view purchased products and track live order progress'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-900 rounded-lg hover:bg-zinc-100 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs for Logged-In Customers */}
        {currentCustomer ? (
          <div className="flex items-center gap-2 p-1 rounded-xl bg-zinc-100 border border-zinc-200">
            <button
              onClick={() => {
                setActiveTab('orders');
                setIsEditingAddress(false);
              }}
              className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                activeTab === 'orders'
                  ? 'bg-[#7c3aed] text-white shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-950'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>My Orders Portal</span>
              {orders.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-mono">
                  {orders.length}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                setActiveTab('profile');
                setIsEditingAddress(false);
              }}
              className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                activeTab === 'profile'
                  ? 'bg-white text-zinc-950 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-950'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Profile & Address</span>
            </button>
          </div>
        ) : (
          /* Sub-tabs for Unauthenticated Customer */
          <div className="flex items-center gap-2 p-1 rounded-xl bg-zinc-100 border border-zinc-200">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setError('');
              }}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                authMode === 'login'
                  ? 'bg-[#7c3aed] text-white shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-950'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Log In With Email (My Orders)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('register');
                setError('');
              }}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                authMode === 'register'
                  ? 'bg-white text-zinc-950 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-950'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>New Customer Registration</span>
            </button>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* ================= UNAUTHENTICATED: EMAIL LOGIN ================= */}
        {!currentCustomer && authMode === 'login' && (
          <div className="space-y-4 py-2">
            <div className="p-5 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-2 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 text-purple-900 font-bold text-sm">
                <Package className="w-4 h-4 text-[#7c3aed]" />
                <span>Please sign in to view your orders.</span>
              </div>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Sign in with your registered customer email to securely view your order history, delivery status, and payment tracking.
              </p>
            </div>

            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <label className="block text-xs uppercase font-mono text-zinc-600 mb-1">
                  Customer Email Address *
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="e.g. rohithsharmak2528@gmail.com"
                    className="w-full pl-9 pr-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 placeholder:text-zinc-400 text-xs sm:text-sm focus:outline-none focus:bg-white focus:border-[#7c3aed]"
                  />
                  <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase font-mono text-zinc-600 mb-1">
                  Password <span className="text-zinc-400 font-normal">(Optional if not set)</span>
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter password (optional)"
                    className="w-full pl-9 pr-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 placeholder:text-zinc-400 text-xs sm:text-sm focus:outline-none focus:bg-white focus:border-[#7c3aed]"
                  />
                  <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setAuthMode('register')}
                  className="text-xs text-purple-700 hover:text-purple-900 font-semibold"
                >
                  Need to register delivery address?
                </button>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="py-3 px-6 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 shadow-md flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <span>Access My Orders</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ================= UNAUTHENTICATED: REGISTER PARTICULARS ================= */}
        {!currentCustomer && authMode === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-600">
              Register your shipping particulars for express 1-click checkout and seamless order synchronization.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs uppercase font-mono text-zinc-600 mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rohith Sharma"
                    className="w-full pl-9 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 text-xs sm:text-sm focus:outline-none focus:bg-white focus:border-[#7c3aed]"
                  />
                  <User className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase font-mono text-zinc-600 mb-1">
                  Mobile Number *
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-9 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 text-xs sm:text-sm focus:outline-none focus:bg-white focus:border-[#7c3aed]"
                  />
                  <Phone className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5 pointer-events-none" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase font-mono text-zinc-600 mb-1">
                Email Address *
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="customer@gmail.com"
                  className="w-full pl-9 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 text-xs sm:text-sm focus:outline-none focus:bg-white focus:border-[#7c3aed]"
                />
                <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase font-mono text-zinc-600 mb-1">
                Complete Delivery Address *
              </label>
              <textarea
                required
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="House / Flat No., Apartment / Building Name, Street / Road..."
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 text-xs sm:text-sm focus:outline-none focus:bg-white focus:border-[#7c3aed]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs uppercase font-mono text-zinc-600 mb-1">
                  City *
                </label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Bengaluru"
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 text-xs sm:text-sm focus:outline-none focus:bg-white focus:border-[#7c3aed]"
                />
              </div>

              <div>
                <label className="block text-xs uppercase font-mono text-zinc-600 mb-1">
                  PIN Code *
                </label>
                <input
                  type="text"
                  required
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value)}
                  placeholder="e.g. 560001"
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 text-xs sm:text-sm focus:outline-none focus:bg-white focus:border-[#7c3aed]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs uppercase font-mono text-zinc-600 mb-1">
                  State *
                </label>
                <input
                  type="text"
                  required
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="e.g. Karnataka"
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 text-xs sm:text-sm focus:outline-none focus:bg-white focus:border-[#7c3aed]"
                />
              </div>

              <div>
                <label className="block text-xs uppercase font-mono text-zinc-600 mb-1">
                  Location / Area Landmark *
                </label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Indiranagar 100ft Rd"
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 text-xs sm:text-sm focus:outline-none focus:bg-white focus:border-[#7c3aed]"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className="text-xs text-purple-700 hover:text-purple-900 font-semibold"
              >
                Already have an account? Sign in
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="py-2.5 px-6 rounded-xl bg-black hover:bg-zinc-800 text-white text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 shadow-md ml-auto"
              >
                {isLoading ? 'Registering...' : 'Register Profile & Continue'}
              </button>
            </div>
          </form>
        )}

        {/* ================= AUTHENTICATED: MY ORDERS PORTAL ================= */}
        {currentCustomer && activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-200">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-[#7c3aed]" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-950">
                  Your Orders History ({orders.length})
                </h3>
              </div>
              <button
                onClick={fetchCustomerOrders}
                disabled={isLoadingOrders}
                className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors flex items-center gap-1 text-xs"
                title="Refresh orders from database"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingOrders ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline text-xs font-mono">Sync</span>
              </button>
            </div>

            {isLoadingOrders ? (
              <div className="py-12 text-center text-zinc-500 text-xs font-mono space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#7c3aed]" />
                <p>Loading your orders...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="py-12 px-4 rounded-2xl bg-zinc-50 border border-zinc-200 text-center space-y-3">
                <Package className="w-10 h-10 mx-auto text-zinc-400" />
                <h4 className="text-sm font-bold text-zinc-950 uppercase tracking-wide">
                  You haven't placed any orders yet.
                </h4>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                  When you place an order, your order history, delivery status, and items will appear here.
                </p>
                {onNavigateToShop && (
                  <button
                    onClick={() => {
                      onClose();
                      onNavigateToShop();
                    }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-black text-white font-bold text-xs uppercase tracking-wider hover:bg-zinc-800 transition-all mt-2 shadow-sm"
                  >
                    <span>Explore Catalog</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4 max-h-[62vh] overflow-y-auto pr-1">
                {orders.map((order) => {
                  const orderDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  const displayId = order.orderNumber || order.id;
                  const stepIdx = getTimelineStepIndex(order.orderStatus);
                  const isCancelled = order.orderStatus === 'Cancelled';
                  const isExpanded = expandedOrderId === order.id;

                  return (
                    <div
                      key={order.id}
                      className="p-4 sm:p-5 rounded-2xl bg-zinc-50 border border-zinc-200 hover:border-zinc-300 transition-all space-y-4 text-zinc-900"
                    >
                      {/* Order Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-200">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono uppercase text-zinc-500">Order ID:</span>
                            <span className="text-xs font-bold font-mono text-zinc-950 tracking-wider">
                              #{displayId}
                            </span>
                            <button
                              onClick={() => handleCopyOrderId(displayId)}
                              className="p-1 hover:bg-zinc-200 rounded text-zinc-500 hover:text-zinc-900 transition-colors"
                              title="Copy Order ID"
                            >
                              {copiedOrderId === displayId ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-zinc-500 font-mono">
                            <Calendar className="w-3 h-3 text-zinc-400" />
                            <span>{orderDate}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border ${getStatusBadge(
                              order.orderStatus
                            )}`}
                          >
                            ● {order.orderStatus}
                          </span>
                          {onTrackOrder && (
                            <button
                              onClick={() => {
                                onClose();
                                onTrackOrder(displayId);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-white hover:bg-zinc-100 text-zinc-800 border border-zinc-200 text-[10px] font-mono font-bold uppercase tracking-wider transition-colors flex items-center gap-1 shadow-xs"
                            >
                              <Truck className="w-3 h-3 text-[#7c3aed]" />
                              <span>Track Live</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* VISUAL ORDER-TRACKING TIMELINE */}
                      {isCancelled ? (
                        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                          <span>This order was cancelled. If you have questions, contact ziproo2026@gmail.com</span>
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl bg-white border border-zinc-200 space-y-3 shadow-xs">
                          <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 flex items-center justify-between">
                            <span>Order Progress Tracking</span>
                            <span className="text-[#7c3aed] font-bold">Stage: {order.orderStatus}</span>
                          </div>

                          {/* Stepper bar */}
                          <div className="relative flex items-center justify-between pt-2 pb-1">
                            {/* Line connecting steps */}
                            <div className="absolute top-4 left-4 right-4 h-0.5 bg-zinc-200 -z-0" />
                            <div
                              className="absolute top-4 left-4 h-0.5 bg-[#7c3aed] transition-all duration-500 -z-0"
                              style={{ width: `${(stepIdx / (TIMELINE_STEPS.length - 1)) * 92}%` }}
                            />

                            {TIMELINE_STEPS.map((step, idx) => {
                              const isCompleted = idx <= stepIdx;
                              const isCurrent = idx === stepIdx;
                              const StepIcon = step.icon;

                              return (
                                <div key={step.id} className="relative z-10 flex flex-col items-center">
                                  <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                                      isCurrent
                                        ? 'bg-[#7c3aed] text-white ring-4 ring-purple-100 shadow-md scale-110'
                                        : isCompleted
                                        ? 'bg-[#7c3aed] text-white'
                                        : 'bg-white text-zinc-400 border border-zinc-300'
                                    }`}
                                  >
                                    <StepIcon className="w-3.5 h-3.5" />
                                  </div>
                                  <span
                                    className={`text-[9px] sm:text-[10px] font-mono mt-1 text-center whitespace-nowrap ${
                                      isCurrent
                                        ? 'font-bold text-zinc-950'
                                        : isCompleted
                                        ? 'font-medium text-zinc-700'
                                        : 'text-zinc-400'
                                    }`}
                                  >
                                    {step.label}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Items Ordered List */}
                      <div className="space-y-2">
                        {order.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-white border border-zinc-200 text-xs"
                          >
                            <div className="flex items-center gap-3">
                              <img
                                src={item.image}
                                alt={item.productName}
                                className="w-12 h-12 rounded-lg object-cover bg-zinc-100 border border-zinc-200"
                              />
                              <div>
                                <span className="font-semibold text-zinc-900 block">{item.productName}</span>
                                <div className="text-[11px] text-zinc-500 font-mono space-x-2 mt-0.5">
                                  <span>Size: <strong className="text-zinc-900">{item.size}</strong></span>
                                  <span>·</span>
                                  <span>Colour: <strong className="text-[#7c3aed]">{item.color || 'Deep Onyx Black'}</strong></span>
                                  <span>·</span>
                                  <span>Qty: <strong className="text-zinc-900">{item.quantity}</strong></span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="font-mono text-zinc-950 font-bold block">
                                ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                              </span>
                              <span className="text-[10px] text-zinc-400 font-mono">
                                ₹{item.price.toLocaleString('en-IN')} each
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Summary & Shipping Details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] pt-1 border-t border-zinc-200">
                        <div className="space-y-1">
                          <span className="text-[10px] font-mono uppercase text-zinc-500 block">
                            Shipping Destination:
                          </span>
                          <p className="text-zinc-900 font-medium">
                            {order.customerName}
                          </p>
                          <p className="text-zinc-500 line-clamp-2">
                            {order.completeAddress}, {order.city}, {order.state} - {order.pinCode}
                          </p>
                          <p className="text-zinc-500 font-mono">
                            Mobile: {order.mobileNumber}
                          </p>
                        </div>

                        <div className="space-y-1 sm:text-right">
                          <span className="text-[10px] font-mono uppercase text-zinc-500 block">
                            Payment & Total:
                          </span>
                          <p className="text-zinc-700 font-mono">
                            {order.paymentMethod === 'cod'
                              ? 'Cash on Delivery'
                              : order.paymentMethod === 'online_portal'
                              ? 'UPI Portal Payment'
                              : 'Razorpay Online'}
                            {' '}(<strong className="text-[#7c3aed]">{order.paymentStatus}</strong>)
                          </p>
                          <div className="text-sm font-bold text-zinc-950 font-mono pt-1">
                            Grand Total: ₹{order.totalAmount.toLocaleString('en-IN')}
                          </div>
                          <button
                            type="button"
                            onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                            className="inline-flex items-center gap-1 text-[10px] text-purple-700 hover:text-purple-900 font-mono font-semibold mt-1"
                          >
                            <span>{isExpanded ? 'Hide Specs' : 'View Full Particulars'}</span>
                            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>

                      {/* Expanded Order Specifications */}
                      {isExpanded && (
                        <div className="p-3.5 rounded-xl bg-white border border-zinc-200 text-xs space-y-2 text-zinc-700 animate-in fade-in">
                          <div className="font-bold text-zinc-950 font-mono uppercase text-[11px] pb-1 border-b border-zinc-100">
                            Full Order Specifications & Audit
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                            <div>Customer Email: <strong className="text-zinc-900">{order.email}</strong></div>
                            <div>Subtotal: <strong className="text-zinc-900">₹{order.subtotal}</strong></div>
                            <div>Shipping: <strong className="text-zinc-900">{order.shipping === 0 ? 'FREE' : `₹${order.shipping}`}</strong></div>
                            <div>Order Date: <strong className="text-zinc-900">{orderDate}</strong></div>
                            {order.transactionReference && (
                              <div className="col-span-2">Payment UTR / Ref: <strong className="text-emerald-700">{order.transactionReference}</strong></div>
                            )}
                            {order.trackingInfo?.trackingNumber && (
                              <div className="col-span-2">Carrier Waybill: <strong className="text-purple-700">{order.trackingInfo.carrier || 'Express'} - {order.trackingInfo.trackingNumber}</strong></div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================= AUTHENTICATED: PROFILE TAB ================= */}
        {currentCustomer && activeTab === 'profile' && !isEditingAddress && (
          <div className="space-y-5">
            <div className="p-5 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#7c3aed] text-white flex items-center justify-center font-bold text-base shadow-sm font-mono">
                    {currentCustomer.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-zinc-950">{currentCustomer.name}</h3>
                    <p className="text-xs font-mono text-[#7c3aed] font-semibold">{currentCustomer.phone}</p>
                    <p className="text-xs text-zinc-500 font-mono">{currentCustomer.email}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLogoutClick}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-mono font-bold transition-all shadow-xs"
                >
                  <LogOut className="w-3.5 h-3.5 text-red-600" />
                  <span>Log Out</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-white border border-zinc-200 shadow-xs">
                  <span className="text-[10px] font-mono uppercase text-zinc-500 block mb-0.5">
                    Delivery Address:
                  </span>
                  <p className="text-zinc-900 font-medium line-clamp-2 leading-relaxed">
                    {currentCustomer.address || '—'}
                  </p>
                  <p className="text-zinc-500 text-[11px] font-mono mt-1">
                    {currentCustomer.city}, {currentCustomer.state} {currentCustomer.pinCode ? `· ${currentCustomer.pinCode}` : ''}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white border border-zinc-200 shadow-xs">
                  <span className="text-[10px] font-mono uppercase text-zinc-500 block mb-0.5">
                    Location & Landmark:
                  </span>
                  <div className="flex items-center gap-1 text-[#7c3aed] font-mono font-medium mb-1">
                    <MapPin className="w-3 h-3 text-[#7c3aed]" />
                    <span>{currentCustomer.location || currentCustomer.city || '—'}</span>
                  </div>
                  <p className="text-zinc-500 text-[11px] font-mono truncate">
                    Member since {new Date(currentCustomer.registeredAt).toLocaleDateString('en-IN')}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsEditingAddress(true)}
                className="flex-1 py-3 px-4 rounded-xl bg-white hover:bg-zinc-100 border border-zinc-200 text-xs font-semibold text-zinc-900 flex items-center justify-center gap-2 transition-all shadow-xs"
              >
                <Edit3 className="w-3.5 h-3.5 text-[#7c3aed]" />
                <span>Edit Address Particulars</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('orders')}
                className="py-3 px-5 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] text-xs font-bold text-white flex items-center justify-center gap-1.5 transition-all font-mono shadow-sm"
              >
                <Package className="w-3.5 h-3.5" />
                <span>View Orders ({orders.length})</span>
              </button>
            </div>
          </div>
        )}

        {/* ================= AUTHENTICATED: EDIT ADDRESS ================= */}
        {currentCustomer && activeTab === 'profile' && isEditingAddress && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-200">
              <span className="text-xs font-mono text-[#7c3aed] font-bold uppercase">
                Editing Delivery Particulars
              </span>
              <button
                type="button"
                onClick={() => setIsEditingAddress(false)}
                className="text-xs text-zinc-500 hover:text-zinc-900"
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs uppercase font-mono text-zinc-600 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 text-xs sm:text-sm focus:outline-none focus:bg-white focus:border-[#7c3aed]"
                />
              </div>

              <div>
                <label className="block text-xs uppercase font-mono text-zinc-600 mb-1">
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 text-xs sm:text-sm focus:outline-none focus:bg-white focus:border-[#7c3aed]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase font-mono text-zinc-600 mb-1">
                Complete Delivery Address *
              </label>
              <textarea
                required
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 text-xs sm:text-sm focus:outline-none focus:bg-white focus:border-[#7c3aed]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs uppercase font-mono text-zinc-600 mb-1">
                  City *
                </label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 text-xs sm:text-sm focus:outline-none focus:bg-white focus:border-[#7c3aed]"
                />
              </div>

              <div>
                <label className="block text-xs uppercase font-mono text-zinc-600 mb-1">
                  PIN Code *
                </label>
                <input
                  type="text"
                  required
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 text-xs sm:text-sm focus:outline-none focus:bg-white focus:border-[#7c3aed]"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setIsEditingAddress(false)}
                className="text-xs text-zinc-500 hover:text-zinc-900"
              >
                Back
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="py-2.5 px-6 rounded-xl bg-black hover:bg-zinc-800 text-white text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 shadow-md ml-auto"
              >
                {isLoading ? 'Saving...' : 'Save Updated Address'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
