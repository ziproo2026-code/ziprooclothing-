import React, { useState } from 'react';
import {
  ShoppingBag,
  Search,
  Filter,
  CreditCard,
  Truck,
  CheckCircle2,
  Clock,
  Navigation,
  Package,
  AlertCircle,
  Copy,
  Check,
  Send,
  RefreshCw,
  Eye,
  User,
  MapPin,
  Calendar,
  X,
  Phone,
  Mail,
  ShieldCheck,
  ExternalLink,
  RotateCcw,
  Smartphone,
} from 'lucide-react';
import type { Order, OrderStatus } from '../../types/index.js';

interface AdminOrdersManagerProps {
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, status: OrderStatus, note?: string) => Promise<void> | void;
  token: string | null;
  onRefreshOrders?: () => void;
}

export const AdminOrdersManager: React.FC<AdminOrdersManagerProps> = ({
  orders,
  onUpdateOrderStatus,
  token,
  onRefreshOrders,
}) => {
  // Main Order Section: 'all' | 'paid' | 'cod'
  const [sectionTab, setSectionTab] = useState<'all' | 'paid' | 'cod'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Action Loading States
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [isTestingBrevo, setIsTestingBrevo] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Tracking details modal
  const [trackingModalOrder, setTrackingModalOrder] = useState<Order | null>(null);
  const [carrierInput, setCarrierInput] = useState('');
  const [trackingNumInput, setTrackingNumInput] = useState('');
  const [etaInput, setEtaInput] = useState('');
  const [locationInput, setLocationInput] = useState('');

  const handleCopy = (text: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const handleTestBrevoEmail = async () => {
    setIsTestingBrevo(true);
    try {
      const res = await fetch('/api/admin/test-brevo-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ toEmail: 'ziproo2026@gmail.com' }),
      });
      const data = await res.json();
      if (data.success) {
        showFeedback('success', `Brevo test email sent to ziproo2026@gmail.com! (MsgId: ${data.messageId || 'OK'})`);
      } else {
        showFeedback('error', data.error || data.message || 'Brevo email test failed');
      }
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed connecting to Brevo test endpoint');
    } finally {
      setIsTestingBrevo(false);
    }
  };

  const [isTestingSms, setIsTestingSms] = useState(false);
  const [testSmsMobile, setTestSmsMobile] = useState('');
  const [showSmsModal, setShowSmsModal] = useState(false);

  const handleTestSms = async (targetPhone?: string) => {
    setIsTestingSms(true);
    const phoneToSend = (targetPhone || testSmsMobile || '9876543210').trim();
    try {
      const res = await fetch('/api/admin/test-sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ mobileNumber: phoneToSend }),
      });
      const data = await res.json();
      if (data.success) {
        showFeedback('success', `${data.provider || 'SMS'} test message sent successfully to ${phoneToSend}!`);
        setShowSmsModal(false);
      } else {
        showFeedback('error', data.error || data.message || 'SMS test reported an issue');
      }
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed connecting to SMS test endpoint');
    } finally {
      setIsTestingSms(false);
    }
  };

  // 1. Verify Prepaid Payment
  const handleVerifyPayment = async (orderId: string) => {
    setActionLoadingId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}/verify-payment`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to verify payment');
      showFeedback('success', 'Prepaid payment verified & customer notified via email!');
      if (onRefreshOrders) onRefreshOrders();
    } catch (err: any) {
      showFeedback('error', err.message || 'Payment verification failed');
    } finally {
      setActionLoadingId(null);
    }
  };

  // 2. Mark COD as Collected
  const handleCollectCod = async (orderId: string) => {
    setActionLoadingId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}/collect-cod`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to record cash collection');
      showFeedback('success', 'Cash payment marked as Collected & Paid!');
      if (onRefreshOrders) onRefreshOrders();
    } catch (err: any) {
      showFeedback('error', err.message || 'Action failed');
    } finally {
      setActionLoadingId(null);
    }
  };

  // 3. Retry / Resend Customer Email
  const handleResendEmail = async (orderId: string, event?: string) => {
    setActionLoadingId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}/resend-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ event }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || data.message || 'Failed to resend email');
      }
      showFeedback('success', data.message || 'Email successfully dispatched to customer!');
      if (onRefreshOrders) onRefreshOrders();
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to dispatch email');
    } finally {
      setActionLoadingId(null);
    }
  };

  // 4. Update Tracking Waybill
  const handleSaveTracking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingModalOrder) return;

    setActionLoadingId(trackingModalOrder.id);
    try {
      const res = await fetch(`/api/orders/${trackingModalOrder.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          trackingInfo: {
            carrier: carrierInput.trim() || 'Express Roadway Logistics',
            trackingNumber: trackingNumInput.trim(),
            estimatedDelivery: etaInput.trim(),
            currentLocation: locationInput.trim(),
          },
        }),
      });
      if (!res.ok) throw new Error('Failed to update tracking');
      showFeedback('success', 'Tracking waybill updated successfully!');
      setTrackingModalOrder(null);
      if (onRefreshOrders) onRefreshOrders();
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to update tracking');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filter orders according to Section (Paid / COD), Status, and Search
  const filteredOrders = orders.filter((order) => {
    const isPrepaid = order.paymentMethod === 'online_portal' || order.paymentMethod === 'razorpay' || order.paymentStatus === 'Paid';
    const isCod = order.paymentMethod === 'cod';

    // Section Filter
    if (sectionTab === 'paid' && !isPrepaid) return false;
    if (sectionTab === 'cod' && !isCod) return false;

    // Status Filter
    if (statusFilter !== 'all') {
      const orderSt = String(order.orderStatus).toLowerCase();
      if (statusFilter === 'paid' && order.paymentStatus !== 'Paid') return false;
      if (statusFilter === 'cod' && order.paymentMethod !== 'cod') return false;
      if (statusFilter === 'confirmed' && !orderSt.includes('confirmed')) return false;
      if (statusFilter === 'processing' && !orderSt.includes('processing')) return false;
      if (statusFilter === 'shipped' && !orderSt.includes('shipped')) return false;
      if (statusFilter === 'out_for_delivery' && !orderSt.includes('out for delivery') && !orderSt.includes('out_for_delivery')) return false;
      if (statusFilter === 'delivered' && !orderSt.includes('delivered')) return false;
      if (statusFilter === 'cancelled' && !orderSt.includes('cancelled')) return false;
    }

    // Search Query (Order ID, Customer Name, Email)
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const matchId = order.orderNumber.toLowerCase().includes(q) || order.id.toLowerCase().includes(q);
      const matchName = order.customerName.toLowerCase().includes(q);
      const matchEmail = order.email.toLowerCase().includes(q);
      const matchPhone = order.mobileNumber.includes(q);
      return matchId || matchName || matchEmail || matchPhone;
    }

    return true;
  });

  const paidCount = orders.filter(
    (o) => o.paymentMethod === 'online_portal' || o.paymentMethod === 'razorpay' || o.paymentStatus === 'Paid'
  ).length;
  const codCount = orders.filter((o) => o.paymentMethod === 'cod').length;

  return (
    <div className="space-y-6 text-zinc-900">
      {/* Toast Alert Feedback */}
      {feedbackMsg && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-2.5 shadow-sm animate-in fade-in ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          {feedbackMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span className="font-semibold">{feedbackMsg.text}</span>
        </div>
      )}

      {/* Header and Section Switcher */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-[#7c3aed] text-xs font-mono mb-1 font-bold">
            <Package className="w-3.5 h-3.5" />
            <span>Atelier Order Management & Fulfillment</span>
          </div>
          <h2 className="text-2xl font-bold font-display uppercase tracking-tight text-zinc-950">
            Customer Orders Dossier
          </h2>
          <p className="text-xs text-zinc-600">
            Manage online prepaid orders, collect COD receivables, verify bank transactions, update tracking, and dispatch automatic notifications.
          </p>
        </div>

        {/* Section Tabs (Paid vs COD vs All) */}
        <div className="flex items-center p-1 rounded-xl bg-zinc-100 border border-zinc-200 self-start md:self-auto">
          <button
            onClick={() => setSectionTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all flex items-center gap-1.5 ${
              sectionTab === 'all'
                ? 'bg-white text-zinc-950 shadow-xs'
                : 'text-zinc-600 hover:text-zinc-950'
            }`}
          >
            <span>All Orders</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-200 text-zinc-800 font-mono">
              {orders.length}
            </span>
          </button>

          <button
            onClick={() => setSectionTab('paid')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all flex items-center gap-1.5 ${
              sectionTab === 'paid'
                ? 'bg-[#7c3aed] text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-950'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Paid / Prepaid</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-mono">
              {paidCount}
            </span>
          </button>

          <button
            onClick={() => setSectionTab('cod')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all flex items-center gap-1.5 ${
              sectionTab === 'cod'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-950'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>COD Orders</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-mono">
              {codCount}
            </span>
          </button>
        </div>
      </div>

      {/* Brevo Transactional Email Live Status & Test Banner */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-purple-50/80 border border-purple-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#7c3aed] text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0 font-mono">
            ✉
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-zinc-950 font-mono uppercase tracking-wide text-xs">
                Brevo Transactional Email Integration
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-[10px] font-mono font-bold">
                Active & Monitored
              </span>
            </div>
            <p className="text-[11px] text-zinc-600 mt-0.5">
              Customer confirmations and real-time order alerts sent automatically to <strong>ziproo2026@gmail.com</strong> via Brevo API.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleTestBrevoEmail}
            disabled={isTestingBrevo}
            className="px-3.5 py-2 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-[11px] font-mono font-bold uppercase transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
          >
            {isTestingBrevo ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            <span>Test Email</span>
          </button>

          <button
            type="button"
            onClick={() => setShowSmsModal(true)}
            disabled={isTestingSms}
            className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-[11px] font-mono font-bold uppercase transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
          >
            {isTestingSms ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Smartphone className="w-3.5 h-3.5 text-purple-400" />}
            <span>Test SMS Gateway</span>
          </button>
        </div>
      </div>

      {/* SMS Gateway Test Modal */}
      {showSmsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-zinc-200 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-[#7c3aed] flex items-center justify-center">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-zinc-950 font-display uppercase tracking-wide">
                    Test SMS Gateway
                  </h3>
                  <p className="text-[11px] text-zinc-500">
                    Sends a live order notification test message
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSmsModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-mono uppercase text-zinc-600 font-bold mb-1">
                  Recipient Mobile Number
                </label>
                <input
                  type="tel"
                  value={testSmsMobile}
                  onChange={(e) => setTestSmsMobile(e.target.value)}
                  placeholder="e.g. 9876543210 (10-digit mobile number)"
                  className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-zinc-900 text-xs font-mono focus:outline-none focus:border-[#7c3aed] focus:bg-white"
                />
                <p className="text-[10px] text-zinc-500 mt-1">
                  Leave blank to test with default atelier test number (9876543210).
                </p>
              </div>

              <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-200 text-purple-900 text-[11px] space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#7c3aed]" />
                  <span>Configured via Server Environment Secret:</span>
                </div>
                <p className="text-zinc-600 font-mono text-[10px]">
                  Loaded from secret <code className="text-[#7c3aed] bg-purple-100 px-1 rounded">zipsms</code> (Textbee API Gateway)
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowSmsModal(false)}
                className="px-4 py-2 text-xs text-zinc-600 hover:text-zinc-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleTestSms()}
                disabled={isTestingSms}
                className="px-4 py-2 bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-xl text-xs font-bold uppercase font-mono flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                {isTestingSms ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>{isTestingSms ? 'Sending Test SMS...' : 'Send Test SMS'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-zinc-200 space-y-3 shadow-xs">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Search by Order ID, Name, Email */}
          <div className="relative flex-1 max-w-lg">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Order ID (ZIP-...), Customer Name, Email, or Phone..."
              className="w-full pl-9 pr-8 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:border-[#7c3aed] focus:bg-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-zinc-800 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          <div className="text-xs font-mono text-zinc-500 self-center">
            Showing <strong className="text-zinc-950">{filteredOrders.length}</strong> matching records
          </div>
        </div>

        {/* Status Filter Badges */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <span className="text-[11px] font-mono text-zinc-500 uppercase flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3" />
            <span>Filters:</span>
          </span>
          {[
            { id: 'all', label: 'All' },
            { id: 'paid', label: 'Paid' },
            { id: 'cod', label: 'COD' },
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
              className={`px-3 py-1 rounded-lg font-mono text-[11px] uppercase transition-all whitespace-nowrap ${
                statusFilter === tab.id
                  ? 'bg-zinc-900 text-white font-bold shadow-xs'
                  : 'bg-zinc-100 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List Feed */}
      {filteredOrders.length === 0 ? (
        <div className="p-16 text-center rounded-2xl bg-white border border-zinc-200 text-zinc-500 space-y-2 shadow-sm">
          <ShoppingBag className="w-10 h-10 opacity-30 mx-auto text-zinc-400" />
          <p className="font-semibold text-zinc-700">No orders match the selected filters.</p>
          <p className="text-xs">Adjust your search query or reset the filter tags above.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const isCod = order.paymentMethod === 'cod';
            const isPrepaid = order.paymentMethod === 'online_portal' || order.paymentMethod === 'razorpay' || order.paymentStatus === 'Paid';
            const orderDate = new Date(order.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

            return (
              <div
                key={order.id}
                className="p-5 sm:p-6 rounded-2xl bg-white border border-zinc-200 hover:border-purple-300 transition-all space-y-5 shadow-sm"
              >
                {/* Header Line */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 border-b border-zinc-100 gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono uppercase text-[#7c3aed] tracking-wider font-bold">
                        #{order.orderNumber}
                      </span>
                      <button
                        onClick={(e) => handleCopy(order.orderNumber, e)}
                        className="p-1 text-zinc-400 hover:text-zinc-900 rounded hover:bg-zinc-100"
                        title="Copy Order ID"
                      >
                        {copiedId === order.orderNumber ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                      <span className="text-zinc-300">·</span>
                      <span className="text-[11px] text-zinc-500 font-mono">{orderDate}</span>
                    </div>

                    <h3 className="text-base font-bold text-zinc-950 mt-1 flex items-center gap-2">
                      <span>{order.customerName}</span>
                      {isCod ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          Cash on Delivery
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-50 text-purple-700 border border-purple-200">
                          {order.paymentMethod === 'online_portal' ? 'Online UPI Portal' : 'Razorpay'}
                        </span>
                      )}
                    </h3>

                    <div className="text-xs text-zinc-600 font-mono flex flex-wrap items-center gap-3 mt-1">
                      <span>Email: <strong className="text-zinc-950">{order.email}</strong></span>
                      <span>·</span>
                      <span>Mobile: <strong className="text-purple-700">{order.mobileNumber}</strong></span>
                    </div>
                  </div>

                  {/* Order Status Selector & Total Charged */}
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="text-left sm:text-right">
                      <label className="text-[10px] uppercase font-mono text-zinc-500 block font-bold">
                        Update Order Status:
                      </label>
                      <select
                        value={order.orderStatus}
                        onChange={(e) => onUpdateOrderStatus(order.id, e.target.value as OrderStatus)}
                        className="bg-zinc-50 border border-zinc-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-zinc-900 focus:outline-none focus:border-[#7c3aed] mt-1 cursor-pointer"
                      >
                        <option value="Order Confirmed">Order Confirmed</option>
                        <option value="Processing">Processing</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Out for Delivery">Out for Delivery</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] uppercase font-mono text-zinc-500 block font-bold">
                        {isCod && order.paymentStatus !== 'Paid' ? 'To Collect (COD)' : 'Total Amount'}
                      </span>
                      <span className="text-lg font-bold font-mono text-purple-700 tabular-nums">
                        ₹{order.totalAmount.toLocaleString('en-IN')}
                      </span>
                      <span className={`text-[10px] font-mono font-bold block ${order.paymentStatus === 'Paid' ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {order.paymentStatus === 'Paid' ? '● PAID' : '● PENDING'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 text-xs">
                  {/* Left Column: Delivery Address & Payment Verification */}
                  <div className="md:col-span-6 space-y-3">
                    <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1">
                      <span className="text-zinc-500 font-mono uppercase text-[10px] block font-bold">
                        Full Delivery Address:
                      </span>
                      <p className="text-zinc-950 font-medium">{order.completeAddress}</p>
                      <p className="text-zinc-600 font-mono">
                        {order.city}, {order.state} — PIN: <strong className="text-zinc-950">{order.pinCode}</strong>
                      </p>
                    </div>

                    {/* Payment Verification Box */}
                    <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2 text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500 font-mono uppercase text-[10px] font-bold">
                          Payment Verification:
                        </span>
                        <span className={`font-mono font-bold px-2 py-0.5 rounded text-[10px] ${
                          order.paymentStatus === 'Paid'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {order.paymentStatus}
                        </span>
                      </div>

                      <div className="flex justify-between text-zinc-700">
                        <span>Payment Method:</span>
                        <strong className="text-zinc-950 uppercase">{order.paymentMethod}</strong>
                      </div>

                      {order.transactionReference && (
                        <div className="flex justify-between font-mono bg-white p-2 rounded border border-zinc-200">
                          <span className="text-zinc-500">Customer UTR Ref:</span>
                          <strong className="text-emerald-700">{order.transactionReference}</strong>
                        </div>
                      )}

                      {/* Payment Action Buttons */}
                      <div className="pt-1 flex flex-wrap gap-2">
                        {isPrepaid && order.paymentStatus !== 'Paid' && (
                          <button
                            type="button"
                            disabled={actionLoadingId === order.id}
                            onClick={() => handleVerifyPayment(order.id)}
                            className="flex-1 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-xs flex items-center justify-center gap-1.5"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Verify Prepaid Payment</span>
                          </button>
                        )}

                        {isCod && order.paymentStatus !== 'Paid' && (
                          <button
                            type="button"
                            disabled={actionLoadingId === order.id}
                            onClick={() => handleCollectCod(order.id)}
                            className="flex-1 py-2 px-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-xs flex items-center justify-center gap-1.5"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Mark COD Cash Collected</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Ordered Items & Notifications */}
                  <div className="md:col-span-6 space-y-3">
                    <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2">
                      <span className="text-zinc-500 font-mono uppercase text-[10px] block font-bold">
                        Ordered Garments ({order.items.reduce((s, it) => s + it.quantity, 0)} items):
                      </span>
                      <ul className="space-y-2 divide-y divide-zinc-200">
                        {order.items.map((it, idx) => (
                          <li key={idx} className="pt-2 first:pt-0 flex items-center justify-between text-zinc-700">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={it.image}
                                alt={it.productName}
                                className="w-10 h-12 object-cover rounded-lg bg-zinc-100 border border-zinc-200 shrink-0"
                              />
                              <div>
                                <span className="font-bold text-zinc-950 block">{it.productName}</span>
                                <span className="font-mono text-purple-700 text-[11px]">
                                  [{it.size}] · {it.color || 'Onyx Black'} · x{it.quantity}
                                </span>
                              </div>
                            </div>
                            <span className="font-mono text-zinc-950 font-bold">
                              ₹{(it.price * it.quantity).toLocaleString('en-IN')}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Email and SMS Delivery Status Audit Log */}
                    <div className="p-3 rounded-xl bg-purple-50/50 border border-purple-200/60 text-[11px] font-mono space-y-1.5">
                      <div className="flex items-center justify-between text-emerald-800">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Admin Notification: Transmitted to ziproo2026@gmail.com</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-purple-900">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-[#7c3aed]" />
                          <span>Customer Email: {order.notificationLog?.customerEmailSent ? 'Delivered' : 'Pending / Logged'} ({order.email})</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleResendEmail(order.id)}
                          disabled={actionLoadingId === order.id}
                          className="text-[10px] text-[#7c3aed] hover:text-purple-900 underline font-bold"
                        >
                          Retry / Resend Email
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          {order.notificationLog?.customerSmsSent ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          ) : order.notificationLog?.customerSmsError ? (
                            <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          ) : (
                            <Smartphone className="w-3.5 h-3.5 text-zinc-500" />
                          )}
                          <span className={order.notificationLog?.customerSmsError ? 'text-amber-800 font-medium' : 'text-zinc-700'}>
                            Customer SMS: {order.notificationLog?.customerSmsSent
                              ? 'Delivered'
                              : order.notificationLog?.customerSmsError
                              ? `Alert: ${order.notificationLog.customerSmsError}`
                              : 'Pending / Logged'} ({order.mobileNumber})
                          </span>
                        </div>
                      </div>

                      {order.trackingInfo?.trackingNumber && (
                        <div className="text-[10px] text-zinc-600 pt-1 border-t border-purple-200">
                          Tracking: <strong>{order.trackingInfo.carrier}</strong> - #{order.trackingInfo.trackingNumber}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Controls Bar */}
                <div className="flex flex-wrap items-center justify-between pt-3 border-t border-zinc-100 gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setTrackingModalOrder(order);
                        setCarrierInput(order.trackingInfo?.carrier || 'Express Roadway Logistics');
                        setTrackingNumInput(order.trackingInfo?.trackingNumber || '');
                        setEtaInput(order.trackingInfo?.estimatedDelivery || '');
                        setLocationInput(order.trackingInfo?.currentLocation || '');
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-800 font-mono text-xs font-semibold transition-colors shadow-xs"
                    >
                      <Truck className="w-3.5 h-3.5 text-[#7c3aed]" />
                      <span>{order.trackingInfo?.trackingNumber ? 'Edit Tracking Info' : '+ Add Tracking Waybill'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleResendEmail(order.id)}
                      disabled={actionLoadingId === order.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-900 font-mono text-xs font-semibold transition-colors shadow-xs"
                      title="Send automatic update email to customer"
                    >
                      <Send className="w-3.5 h-3.5 text-[#7c3aed]" />
                      <span>Resend Email</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedOrder(order)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-black hover:bg-zinc-800 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-xs"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Full Order Details</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================= FULL ORDER DETAILS MODAL ================= */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-2xl bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto text-zinc-900">
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-950 rounded-xl hover:bg-zinc-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-zinc-200 pb-3">
              <span className="text-[10px] font-mono uppercase text-[#7c3aed] font-bold tracking-widest block">
                Administrator Order Dossier
              </span>
              <h3 className="text-xl font-bold font-display uppercase tracking-tight text-zinc-950">
                Order #{selectedOrder.orderNumber}
              </h3>
              <p className="text-xs text-zinc-500 font-mono mt-0.5">
                Internal ID: {selectedOrder.id} · Recorded on {new Date(selectedOrder.createdAt).toLocaleString('en-IN')}
              </p>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold uppercase bg-purple-50 text-purple-700 border border-purple-200">
                Status: {selectedOrder.orderStatus}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase ${
                selectedOrder.paymentStatus === 'Paid'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                Payment: {selectedOrder.paymentStatus}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-mono uppercase bg-zinc-100 text-zinc-700 border border-zinc-200">
                Method: {selectedOrder.paymentMethod.toUpperCase()}
              </span>
            </div>

            {/* Customer Details */}
            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-xs space-y-2">
              <div className="text-[10px] font-mono uppercase text-zinc-400 font-bold">Customer Particulars:</div>
              <div className="grid grid-cols-2 gap-2 text-zinc-800">
                <div>Name: <strong className="text-zinc-950">{selectedOrder.customerName}</strong></div>
                <div>Phone: <strong className="text-purple-700">{selectedOrder.mobileNumber}</strong></div>
                <div>Email: <strong className="text-zinc-950">{selectedOrder.email}</strong></div>
                <div>City / State: {selectedOrder.city}, {selectedOrder.state}</div>
              </div>
              <div className="pt-1 border-t border-zinc-200 text-zinc-700">
                Address: {selectedOrder.completeAddress} — PIN: {selectedOrder.pinCode}
              </div>
            </div>

            {/* Items */}
            <div className="space-y-2">
              <div className="text-[10px] font-mono uppercase text-zinc-500 font-bold">Ordered Items:</div>
              {selectedOrder.items.map((it, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <img src={it.image} alt={it.productName} className="w-12 h-14 object-cover rounded-lg bg-zinc-100 border border-zinc-200" />
                    <div>
                      <span className="font-bold text-zinc-950 block">{it.productName}</span>
                      <span className="font-mono text-purple-700 text-[11px]">
                        Size: [{it.size}] · Colour: {it.color || 'Deep Onyx Black'} · Qty: {it.quantity}
                      </span>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-zinc-950">
                    ₹{(it.price * it.quantity).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>

            {/* Financial Summary */}
            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-xs font-mono space-y-1.5">
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

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={() => handleResendEmail(selectedOrder.id)}
                className="px-4 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 text-xs font-mono font-bold"
              >
                Resend Confirmation Email
              </button>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-5 py-2.5 rounded-xl bg-black text-white font-bold text-xs uppercase tracking-wider"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= EDIT TRACKING MODAL ================= */}
      {trackingModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md bg-white border border-zinc-200 rounded-3xl p-6 shadow-2xl space-y-4 text-zinc-900">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
              <h3 className="text-base font-bold uppercase font-display text-zinc-950">
                Tracking Waybill: #{trackingModalOrder.orderNumber}
              </h3>
              <button
                onClick={() => setTrackingModalOrder(null)}
                className="text-zinc-400 hover:text-zinc-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTracking} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-mono uppercase text-zinc-600 mb-1 font-bold">
                  Courier Partner Name
                </label>
                <input
                  type="text"
                  required
                  value={carrierInput}
                  onChange={(e) => setCarrierInput(e.target.value)}
                  placeholder="e.g. BlueDart / Delhivery / DTDC / Express"
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-zinc-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-zinc-600 mb-1 font-bold">
                  Waybill / Tracking Number *
                </label>
                <input
                  type="text"
                  required
                  value={trackingNumInput}
                  onChange={(e) => setTrackingNumInput(e.target.value)}
                  placeholder="e.g. 78291048291"
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-mono text-zinc-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-zinc-600 mb-1 font-bold">
                  Estimated Delivery Date
                </label>
                <input
                  type="text"
                  value={etaInput}
                  onChange={(e) => setEtaInput(e.target.value)}
                  placeholder="e.g. In 2 Business Days (Friday)"
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-zinc-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-zinc-600 mb-1 font-bold">
                  Current Hub / Dispatch Location
                </label>
                <input
                  type="text"
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  placeholder="e.g. Bengaluru Central Sorting Hub"
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-zinc-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setTrackingModalOrder(null)}
                  className="px-4 py-2 text-xs text-zinc-600 hover:text-black font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-black text-white font-bold text-xs uppercase tracking-wider hover:bg-zinc-800"
                >
                  Save Waybill & Notify Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
