import React, { useState, useEffect } from 'react';
import {
  Store,
  Search,
  Plus,
  Edit2,
  Trash2,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  Building,
  CreditCard,
  KeyRound,
  Eye,
  X,
  DollarSign,
  Package,
  ShoppingBag,
} from 'lucide-react';
import type { Seller } from '../../types/index.js';

interface AdminSellersTabProps {
  token: string | null;
  onViewSellerProducts?: (sellerId: string) => void;
}

interface SellerWithStats extends Seller {
  stats?: {
    totalProducts: number;
    approvedProducts: number;
    pendingProducts: number;
    totalOrders: number;
    totalRevenue: number;
  };
}

export const AdminSellersTab: React.FC<AdminSellersTabProps> = ({
  token,
  onViewSellerProducts,
}) => {
  const [sellers, setSellers] = useState<SellerWithStats[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PENDING' | 'SUSPENDED'>('ALL');
  const [isLoading, setIsLoading] = useState(false);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingSeller, setEditingSeller] = useState<SellerWithStats | null>(null);
  const [viewingSeller, setViewingSeller] = useState<SellerWithStats | null>(null);
  const [suspendingSeller, setSuspendingSeller] = useState<SellerWithStats | null>(null);
  const [suspensionReasonInput, setSuspensionReasonInput] = useState('');
  const [resettingPasswordSeller, setResettingPasswordSeller] = useState<SellerWithStats | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');

  // Create Form State
  const [createBusinessName, setCreateBusinessName] = useState('');
  const [createName, setCreateName] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createPhone, setCreatePhone] = useState('');
  const [createPassword, setCreatePassword] = useState('seller123');
  const [createStatus, setCreateStatus] = useState<'ACTIVE' | 'PENDING'>('ACTIVE');
  const [createCommission, setCreateCommission] = useState('10');
  const [createGst, setCreateGst] = useState('');
  const [createCity, setCreateCity] = useState('');
  const [createState, setCreateState] = useState('');
  const [createAddress, setCreateAddress] = useState('');
  const [createPinCode, setCreatePinCode] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [formError, setFormError] = useState('');

  const fetchSellers = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/sellers', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSellers(data);
      }
    } catch (err) {
      console.error('Failed to fetch sellers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSellers();
  }, [token]);

  // Create Seller
  const handleCreateSeller = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setFormError('');

    try {
      const res = await fetch('/api/admin/sellers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          businessName: createBusinessName,
          name: createName,
          email: createEmail,
          phone: createPhone,
          password: createPassword,
          status: createStatus,
          commissionPercentage: Number(createCommission),
          gstNumber: createGst,
          city: createCity,
          state: createState,
          address: createAddress,
          pinCode: createPinCode,
          description: createDescription,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create seller');
      }

      setIsCreateModalOpen(false);
      // Reset form
      setCreateBusinessName('');
      setCreateName('');
      setCreateEmail('');
      setCreatePhone('');
      setCreateCity('');
      setCreateState('');
      fetchSellers();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create seller');
    }
  };

  // Quick Status Toggle (Approve / Activate)
  const handleUpdateStatus = async (sellerId: string, status: 'ACTIVE' | 'PENDING' | 'SUSPENDED', reason?: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/sellers/${sellerId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status, suspendedReason: reason }),
      });
      if (res.ok) {
        fetchSellers();
        if (suspendingSeller) setSuspendingSeller(null);
      }
    } catch (err) {
      console.error('Failed to update seller status:', err);
    }
  };

  // Edit Seller Save
  const handleSaveSellerEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !editingSeller) return;
    try {
      const res = await fetch(`/api/admin/sellers/${editingSeller.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editingSeller),
      });
      if (res.ok) {
        setEditingSeller(null);
        fetchSellers();
      }
    } catch (err) {
      console.error('Failed to save seller edit:', err);
    }
  };

  // Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !resettingPasswordSeller) return;
    try {
      const res = await fetch(`/api/admin/sellers/${resettingPasswordSeller.id}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newPassword: newPasswordInput }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Password reset successfully');
        setResettingPasswordSeller(null);
        setNewPasswordInput('');
      } else {
        alert(data.error || 'Failed to reset password');
      }
    } catch (err) {
      alert('Failed to reset password');
    }
  };

  // Delete Seller
  const handleDeleteSeller = async (sellerId: string, businessName: string) => {
    if (!token) return;
    if (!confirm(`Are you sure you want to delete seller "${businessName}"? This will also unlist their products.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/sellers/${sellerId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchSellers();
      }
    } catch (err) {
      console.error('Failed to delete seller:', err);
    }
  };

  const filteredSellers = sellers.filter((s) => {
    if (statusFilter === 'ACTIVE' && s.status !== 'ACTIVE') return false;
    if (statusFilter === 'PENDING' && s.status !== 'PENDING') return false;
    if (statusFilter === 'SUSPENDED' && s.status !== 'SUSPENDED') return false;

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        s.businessName.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.city.toLowerCase().includes(q) ||
        (s.gstNumber && s.gstNumber.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const activeCount = sellers.filter((s) => s.status === 'ACTIVE').length;
  const pendingCount = sellers.filter((s) => s.status === 'PENDING').length;
  const suspendedCount = sellers.filter((s) => s.status === 'SUSPENDED').length;
  const totalSellerSales = sellers.reduce((acc, s) => acc + (s.stats?.totalRevenue || 0), 0);

  return (
    <div className="space-y-6 text-zinc-900">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-[#7c3aed] text-xs font-mono mb-1 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#7c3aed]" />
            <span>Multi-Seller Commerce Infrastructure (PART 8)</span>
          </div>
          <h2 className="text-xl font-bold font-display uppercase tracking-tight text-zinc-950 flex items-center gap-2">
            <span>Seller Management</span>
            <span className="text-xs font-mono text-zinc-500 font-normal">
              ({sellers.length} registered sellers)
            </span>
          </h2>
          <p className="text-xs text-zinc-500">
            Onboard sellers, approve applications, monitor sales performance, and manage access restrictions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchSellers}
            className="p-2 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-600 transition-colors shadow-xs"
            title="Refresh Sellers"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#7c3aed]' : ''}`} />
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs font-mono uppercase font-bold tracking-wider transition-all shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Seller</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-xs">
          <div className="text-zinc-500 text-[11px] font-mono uppercase tracking-wider">Total Sellers</div>
          <div className="text-2xl font-black text-zinc-900 mt-1">{sellers.length}</div>
          <div className="text-[10px] font-mono text-zinc-400 mt-0.5">Platform registered</div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-xs">
          <div className="text-zinc-500 text-[11px] font-mono uppercase tracking-wider">Active Sellers</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">{activeCount}</div>
          <div className="text-[10px] font-mono text-emerald-700/80 mt-0.5">Approved & selling</div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-xs">
          <div className="text-zinc-500 text-[11px] font-mono uppercase tracking-wider">Pending Review</div>
          <div className="text-2xl font-black text-amber-600 mt-1">{pendingCount}</div>
          <div className="text-[10px] font-mono text-amber-700/80 mt-0.5">Action required</div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-xs">
          <div className="text-zinc-500 text-[11px] font-mono uppercase tracking-wider">Total Seller Sales</div>
          <div className="text-2xl font-black text-[#7c3aed] mt-1">₹{totalSellerSales.toLocaleString('en-IN')}</div>
          <div className="text-[10px] font-mono text-zinc-400 mt-0.5">Dispatched volume</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by brand name, contact person, email, city, or GSTIN..."
            className="w-full bg-white border border-zinc-200 rounded-lg pl-9 pr-4 py-2 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#7c3aed] font-mono"
          />
        </div>

        <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-zinc-200 w-full sm:w-auto shadow-xs">
          {(['ALL', 'ACTIVE', 'PENDING', 'SUSPENDED'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1.5 rounded text-[11px] font-mono uppercase transition-colors ${
                statusFilter === filter
                  ? 'bg-black text-white font-bold'
                  : 'text-zinc-600 hover:text-black'
              }`}
            >
              {filter === 'ALL' ? `All (${sellers.length})` : filter === 'ACTIVE' ? `Active (${activeCount})` : filter === 'PENDING' ? `Pending (${pendingCount})` : `Suspended (${suspendedCount})`}
            </button>
          ))}
        </div>
      </div>

      {/* Sellers Table */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-xs">
        {filteredSellers.length === 0 ? (
          <div className="py-16 text-center text-zinc-500 font-mono text-xs">
            No sellers found matching the current filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/80 text-zinc-500 uppercase">
                  <th className="py-3 px-4">Seller Brand & Owner</th>
                  <th className="py-3 px-4">Contact Details</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Products</th>
                  <th className="py-3 px-4">Sales (₹)</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredSellers.map((seller) => {
                  const isActive = seller.status === 'ACTIVE';
                  const isPending = seller.status === 'PENDING';
                  const isSuspended = seller.status === 'SUSPENDED';

                  return (
                    <tr key={seller.id} className="hover:bg-zinc-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-zinc-950 uppercase">{seller.businessName}</div>
                        <div className="text-zinc-500 text-[11px]">Owner: {seller.name}</div>
                        <code className="text-[10px] text-purple-700 bg-purple-50 px-1 rounded">{seller.id}</code>
                      </td>

                      <td className="py-3 px-4 space-y-0.5">
                        <div className="text-zinc-700 flex items-center gap-1.5">
                          <Mail className="w-3 h-3 text-zinc-400" />
                          <span>{seller.email}</span>
                        </div>
                        <div className="text-zinc-500 flex items-center gap-1.5 text-[11px]">
                          <Phone className="w-3 h-3 text-zinc-400" />
                          <span>{seller.phone}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-zinc-600">
                        {seller.city ? `${seller.city}, ${seller.state}` : 'Unspecified'}
                        {seller.gstNumber && (
                          <div className="text-[10px] text-zinc-400 font-mono">GST: {seller.gstNumber}</div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            isActive
                              ? 'bg-emerald-100 text-emerald-800'
                              : isPending
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {seller.status}
                        </span>
                        {seller.suspendedReason && isSuspended && (
                          <div className="text-[10px] text-red-600 max-w-xs truncate" title={seller.suspendedReason}>
                            {seller.suspendedReason}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-zinc-900">
                          {seller.stats?.totalProducts ?? 0} items
                        </div>
                        <div className="text-[10px] text-zinc-500">
                          {seller.stats?.approvedProducts ?? 0} approved
                        </div>
                      </td>

                      <td className="py-3 px-4 font-bold text-purple-700">
                        ₹{(seller.stats?.totalRevenue ?? 0).toLocaleString('en-IN')}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Approve / Activate */}
                          {!isActive && (
                            <button
                              onClick={() => handleUpdateStatus(seller.id, 'ACTIVE')}
                              className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold uppercase transition-colors"
                              title="Approve / Activate Seller"
                            >
                              Approve
                            </button>
                          )}

                          {/* Suspend */}
                          {isActive && (
                            <button
                              onClick={() => {
                                setSuspendingSeller(seller);
                                setSuspensionReasonInput('');
                              }}
                              className="px-2 py-1 rounded bg-red-100 hover:bg-red-200 text-red-800 text-[10px] font-bold uppercase transition-colors"
                              title="Suspend Seller"
                            >
                              Suspend
                            </button>
                          )}

                          {/* View Profile */}
                          <button
                            onClick={() => setViewingSeller(seller)}
                            className="p-1.5 rounded hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900"
                            title="View Full Profile & Bank Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => setEditingSeller({ ...seller })}
                            className="p-1.5 rounded hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900"
                            title="Edit Details"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Reset Password */}
                          <button
                            onClick={() => {
                              setResettingPasswordSeller(seller);
                              setNewPasswordInput('');
                            }}
                            className="p-1.5 rounded hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900"
                            title="Reset Password"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteSeller(seller.id, seller.businessName)}
                            className="p-1.5 rounded hover:bg-red-50 text-zinc-400 hover:text-red-600"
                            title="Delete Seller"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* MODAL 1: CREATE NEW SELLER */}
      {/* ======================================================== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
              <div>
                <span className="text-[10px] font-mono text-[#7c3aed] uppercase tracking-widest font-bold">
                  ADMIN ACTION · CREATE SELLER
                </span>
                <h3 className="text-base font-bold text-zinc-900 uppercase">
                  Register New Seller Atelier
                </h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-red-50 text-red-700 text-xs font-mono">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateSeller} className="space-y-3.5 text-xs font-mono">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-600 mb-1">Brand Name *</label>
                  <input
                    type="text"
                    value={createBusinessName}
                    onChange={(e) => setCreateBusinessName(e.target.value)}
                    required
                    placeholder="e.g. VORTEX ATELIER"
                    className="w-full bg-zinc-50 border border-zinc-200 rounded px-3 py-2 text-zinc-900"
                  />
                </div>
                <div>
                  <label className="block text-zinc-600 mb-1">Owner Contact Name *</label>
                  <input
                    type="text"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    required
                    placeholder="e.g. Karan Singhania"
                    className="w-full bg-zinc-50 border border-zinc-200 rounded px-3 py-2 text-zinc-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-600 mb-1">Login Email *</label>
                  <input
                    type="email"
                    value={createEmail}
                    onChange={(e) => setCreateEmail(e.target.value)}
                    required
                    placeholder="seller@brand.com"
                    className="w-full bg-zinc-50 border border-zinc-200 rounded px-3 py-2 text-zinc-900"
                  />
                </div>
                <div>
                  <label className="block text-zinc-600 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    value={createPhone}
                    onChange={(e) => setCreatePhone(e.target.value)}
                    required
                    placeholder="+91 98200 12345"
                    className="w-full bg-zinc-50 border border-zinc-200 rounded px-3 py-2 text-zinc-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-zinc-600 mb-1">Initial Status</label>
                  <select
                    value={createStatus}
                    onChange={(e) => setCreateStatus(e.target.value as any)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded px-2.5 py-2 text-zinc-900 font-bold"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="PENDING">PENDING</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-600 mb-1">Commission %</label>
                  <input
                    type="number"
                    value={createCommission}
                    onChange={(e) => setCreateCommission(e.target.value)}
                    placeholder="10"
                    className="w-full bg-zinc-50 border border-zinc-200 rounded px-3 py-2 text-zinc-900"
                  />
                </div>
                <div>
                  <label className="block text-zinc-600 mb-1">Initial Password</label>
                  <input
                    type="text"
                    value={createPassword}
                    onChange={(e) => setCreatePassword(e.target.value)}
                    required
                    className="w-full bg-zinc-50 border border-zinc-200 rounded px-3 py-2 text-zinc-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-zinc-600 mb-1">City</label>
                  <input
                    type="text"
                    value={createCity}
                    onChange={(e) => setCreateCity(e.target.value)}
                    placeholder="Mumbai"
                    className="w-full bg-zinc-50 border border-zinc-200 rounded px-3 py-2 text-zinc-900"
                  />
                </div>
                <div>
                  <label className="block text-zinc-600 mb-1">State</label>
                  <input
                    type="text"
                    value={createState}
                    onChange={(e) => setCreateState(e.target.value)}
                    placeholder="Maharashtra"
                    className="w-full bg-zinc-50 border border-zinc-200 rounded px-3 py-2 text-zinc-900"
                  />
                </div>
                <div>
                  <label className="block text-zinc-600 mb-1">GSTIN (Optional)</label>
                  <input
                    type="text"
                    value={createGst}
                    onChange={(e) => setCreateGst(e.target.value)}
                    placeholder="27AABC..."
                    className="w-full bg-zinc-50 border border-zinc-200 rounded px-3 py-2 text-zinc-900"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold uppercase"
                >
                  Create Seller Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: SUSPEND SELLER MODAL (WITH REASON) */}
      {/* ======================================================== */}
      {suspendingSeller && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-red-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-bold uppercase">
                Suspend Seller Account
              </h3>
            </div>
            <p className="text-xs text-zinc-600 font-mono">
              Suspending <strong>{suspendingSeller.businessName}</strong> will immediately disable their products from appearing on the public storefront and restrict their access.
            </p>

            <div>
              <label className="block text-xs font-mono text-zinc-600 mb-1">
                Reason for Suspension (Sent to seller):
              </label>
              <textarea
                rows={3}
                value={suspensionReasonInput}
                onChange={(e) => setSuspensionReasonInput(e.target.value)}
                placeholder="e.g. Catalog compliance violation, dispatch SLA failure..."
                className="w-full bg-zinc-50 border border-zinc-200 rounded p-2.5 text-xs text-zinc-900 font-mono focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSuspendingSeller(null)}
                className="px-4 py-2 rounded bg-zinc-100 text-zinc-700 text-xs font-mono"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() =>
                  handleUpdateStatus(suspendingSeller.id, 'SUSPENDED', suspensionReasonInput)
                }
                className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white text-xs font-mono font-bold uppercase"
              >
                Confirm Suspension
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: VIEW SELLER DETAILS & BANK INFO */}
      {/* ======================================================== */}
      {viewingSeller && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
              <div>
                <span className="text-[10px] font-mono text-[#7c3aed] uppercase tracking-widest font-bold">
                  SELLER DOSSIER
                </span>
                <h3 className="text-base font-bold text-zinc-900 uppercase">
                  {viewingSeller.businessName}
                </h3>
              </div>
              <button
                onClick={() => setViewingSeller(null)}
                className="p-1 text-zinc-400 hover:text-zinc-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="grid grid-cols-2 gap-2 p-3 rounded-lg bg-zinc-50">
                <div>
                  <span className="text-zinc-400 text-[10px] uppercase">Seller ID</span>
                  <div className="font-bold text-zinc-900">{viewingSeller.id}</div>
                </div>
                <div>
                  <span className="text-zinc-400 text-[10px] uppercase">Account Status</span>
                  <div className="font-bold text-zinc-900">{viewingSeller.status}</div>
                </div>
                <div>
                  <span className="text-zinc-400 text-[10px] uppercase">Contact Person</span>
                  <div className="font-bold text-zinc-900">{viewingSeller.name}</div>
                </div>
                <div>
                  <span className="text-zinc-400 text-[10px] uppercase">Registered Phone</span>
                  <div className="font-bold text-zinc-900">{viewingSeller.phone}</div>
                </div>
              </div>

              {/* Bank & Payouts */}
              <div className="p-3.5 rounded-lg border border-purple-100 bg-purple-50/50 space-y-2">
                <div className="text-[11px] font-bold text-[#7c3aed] uppercase flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Sales Payout & Banking Details</span>
                </div>
                {viewingSeller.bankDetails ? (
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-zinc-500">Account Holder:</span>
                      <div className="font-bold text-zinc-900">{viewingSeller.bankDetails.accountHolder || 'N/A'}</div>
                    </div>
                    <div>
                      <span className="text-zinc-500">Bank Name:</span>
                      <div className="font-bold text-zinc-900">{viewingSeller.bankDetails.bankName || 'N/A'}</div>
                    </div>
                    <div>
                      <span className="text-zinc-500">Account Number:</span>
                      <div className="font-bold text-zinc-900">{viewingSeller.bankDetails.accountNumber || 'N/A'}</div>
                    </div>
                    <div>
                      <span className="text-zinc-500">IFSC Code:</span>
                      <div className="font-bold text-zinc-900">{viewingSeller.bankDetails.ifsc || 'N/A'}</div>
                    </div>
                    {viewingSeller.bankDetails.upiId && (
                      <div className="col-span-2">
                        <span className="text-zinc-500">UPI ID:</span>
                        <div className="font-bold text-[#7c3aed]">{viewingSeller.bankDetails.upiId}</div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-zinc-500 italic">No bank details added yet by seller.</div>
                )}
              </div>

              {/* Performance */}
              <div className="grid grid-cols-3 gap-2 text-center p-3 rounded-lg bg-zinc-50">
                <div>
                  <span className="text-zinc-400 text-[10px] uppercase">Total Items</span>
                  <div className="font-black text-sm text-zinc-900">{viewingSeller.stats?.totalProducts ?? 0}</div>
                </div>
                <div>
                  <span className="text-zinc-400 text-[10px] uppercase">Orders</span>
                  <div className="font-black text-sm text-zinc-900">{viewingSeller.stats?.totalOrders ?? 0}</div>
                </div>
                <div>
                  <span className="text-zinc-400 text-[10px] uppercase">Gross Revenue</span>
                  <div className="font-black text-sm text-[#7c3aed]">₹{(viewingSeller.stats?.totalRevenue ?? 0).toLocaleString('en-IN')}</div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setViewingSeller(null)}
                className="px-4 py-2 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-mono font-bold"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: RESET SELLER PASSWORD */}
      {/* ======================================================== */}
      {resettingPasswordSeller && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-zinc-900">
              <KeyRound className="w-5 h-5 text-[#7c3aed]" />
              <h3 className="text-sm font-bold uppercase">
                Reset Seller Password
              </h3>
            </div>
            <p className="text-xs text-zinc-600 font-mono">
              Set a new temporary password for <strong>{resettingPasswordSeller.businessName}</strong> ({resettingPasswordSeller.email}).
            </p>

            <form onSubmit={handleResetPassword} className="space-y-3">
              <div>
                <label className="block text-xs font-mono text-zinc-600 mb-1">New Password (Min 6 chars)</label>
                <input
                  type="text"
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  required
                  placeholder="e.g. ziproo2026"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded px-3 py-2 text-xs font-mono text-zinc-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResettingPasswordSeller(null)}
                  className="px-3 py-1.5 rounded bg-zinc-100 text-zinc-700 text-xs font-mono"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-[#7c3aed] text-white text-xs font-mono font-bold uppercase"
                >
                  Save Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 5: EDIT SELLER PARTICULARS */}
      {/* ======================================================== */}
      {editingSeller && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
              <div>
                <span className="text-[10px] font-mono text-[#7c3aed] uppercase tracking-widest font-bold">
                  EDIT SELLER
                </span>
                <h3 className="text-base font-bold text-zinc-900 uppercase">
                  {editingSeller.businessName}
                </h3>
              </div>
              <button
                onClick={() => setEditingSeller(null)}
                className="p-1 text-zinc-400 hover:text-zinc-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSellerEdit} className="space-y-3 text-xs font-mono">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-600 mb-1">Brand Name</label>
                  <input
                    type="text"
                    value={editingSeller.businessName}
                    onChange={(e) => setEditingSeller({ ...editingSeller, businessName: e.target.value })}
                    required
                    className="w-full bg-zinc-50 border border-zinc-200 rounded px-3 py-2 text-zinc-900"
                  />
                </div>
                <div>
                  <label className="block text-zinc-600 mb-1">Contact Name</label>
                  <input
                    type="text"
                    value={editingSeller.name}
                    onChange={(e) => setEditingSeller({ ...editingSeller, name: e.target.value })}
                    required
                    className="w-full bg-zinc-50 border border-zinc-200 rounded px-3 py-2 text-zinc-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-600 mb-1">Email</label>
                  <input
                    type="email"
                    value={editingSeller.email}
                    onChange={(e) => setEditingSeller({ ...editingSeller, email: e.target.value })}
                    required
                    className="w-full bg-zinc-50 border border-zinc-200 rounded px-3 py-2 text-zinc-900"
                  />
                </div>
                <div>
                  <label className="block text-zinc-600 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={editingSeller.phone}
                    onChange={(e) => setEditingSeller({ ...editingSeller, phone: e.target.value })}
                    required
                    className="w-full bg-zinc-50 border border-zinc-200 rounded px-3 py-2 text-zinc-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-600 mb-1">Commission %</label>
                  <input
                    type="number"
                    value={editingSeller.commissionPercentage ?? 10}
                    onChange={(e) => setEditingSeller({ ...editingSeller, commissionPercentage: Number(e.target.value) })}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded px-3 py-2 text-zinc-900"
                  />
                </div>
                <div>
                  <label className="block text-zinc-600 mb-1">Status</label>
                  <select
                    value={editingSeller.status}
                    onChange={(e) => setEditingSeller({ ...editingSeller, status: e.target.value as any })}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded px-3 py-2 text-zinc-900 font-bold"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="PENDING">PENDING</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setEditingSeller(null)}
                  className="px-4 py-2 rounded bg-zinc-100 text-zinc-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded bg-[#7c3aed] text-white font-bold uppercase"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
