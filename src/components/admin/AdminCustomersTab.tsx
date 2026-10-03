import React, { useState, useEffect } from 'react';
import { Users, Search, Phone, Mail, MapPin, Calendar, ShoppingBag, ExternalLink, RefreshCw } from 'lucide-react';
import type { Customer } from '../../types/index.js';

interface AdminCustomersTabProps {
  token: string | null;
}

export const AdminCustomersTab: React.FC<AdminCustomersTabProps> = ({ token }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/customers', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setCustomers(data);
      }
    } catch (err) {
      console.error('Failed to fetch customers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [token]);

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 text-zinc-900">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-[#7c3aed] text-xs font-mono mb-1 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#7c3aed]" />
            <span>Admin-Only Restricted Roster</span>
          </div>
          <h2 className="text-xl font-bold font-display uppercase tracking-tight text-zinc-950 flex items-center gap-2">
            <span>Registered Customer Particulars</span>
            <span className="text-xs font-mono text-zinc-500 font-normal">
              ({customers.length} registered profiles)
            </span>
          </h2>
          <p className="text-xs text-zinc-500">
            Confidential customer ledger with addresses, verified locations, phone numbers, and lifetime order counts.
          </p>
        </div>

        <button
          onClick={fetchCustomers}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 hover:bg-zinc-100 text-zinc-700 hover:text-zinc-950 rounded-lg text-xs font-semibold transition-all shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Roster</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white border border-zinc-200 shadow-xs">
          <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 block">
            Total Customers
          </span>
          <span className="text-2xl font-black text-zinc-950 font-display mt-1 block">
            {customers.length}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-zinc-200 shadow-xs">
          <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 block">
            Delivery Addresses Logged
          </span>
          <span className="text-2xl font-black text-[#7c3aed] font-display mt-1 block">
            {customers.filter((c) => c.address).length}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-zinc-200 shadow-xs">
          <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 block">
            Active Indian Metros
          </span>
          <span className="text-2xl font-black text-emerald-700 font-display mt-1 block">
            {new Set(customers.map((c) => c.city).filter(Boolean)).size || 1}
          </span>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filter by customer name, phone, email, city, or location..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-zinc-900 placeholder:text-zinc-400 text-xs sm:text-sm focus:outline-none focus:border-[#7c3aed] shadow-xs"
        />
        <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3 pointer-events-none" />
      </div>

      {/* Customers Table */}
      <div className="rounded-2xl bg-white border border-zinc-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 text-zinc-600 uppercase font-mono text-[10px] tracking-wider border-b border-zinc-200">
              <tr>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Mobile & Direct Contacts</th>
                <th className="py-3 px-4">Delivery Address & PIN</th>
                <th className="py-3 px-4">Location / Landmark</th>
                <th className="py-3 px-4">Orders</th>
                <th className="py-3 px-4">Registered On</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-zinc-500">
                    No customers found matching the search criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((customer) => {
                  const cleanPhone = customer.phone.replace(/\D/g, '');
                  return (
                    <tr key={customer.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-zinc-950 text-sm">{customer.name}</div>
                        <div className="text-zinc-500 text-[11px] font-mono">{customer.email}</div>
                      </td>

                      <td className="py-3.5 px-4 font-mono">
                        <div className="font-semibold text-[#7c3aed]">{customer.phone}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <a
                            href={`tel:${customer.phone}`}
                            className="text-[10px] text-zinc-500 hover:text-zinc-950 underline flex items-center gap-0.5"
                          >
                            <Phone className="w-2.5 h-2.5" /> Call
                          </a>
                          <span className="text-zinc-300">·</span>
                          <a
                            href={`https://wa.me/${cleanPhone}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] text-emerald-700 hover:text-emerald-800 underline font-medium"
                          >
                            WhatsApp
                          </a>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="text-zinc-800 line-clamp-2 leading-relaxed">
                          {customer.address || '—'}
                        </p>
                        <div className="text-[11px] font-mono text-zinc-500 mt-0.5">
                          {customer.city}{customer.state ? `, ${customer.state}` : ''} {customer.pinCode ? `· ${customer.pinCode}` : ''}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-zinc-700 font-mono text-[11px]">
                          <MapPin className="w-3.5 h-3.5 text-[#7c3aed] shrink-0" />
                          <span>{customer.location || '—'}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-50 border border-purple-200 text-[#7c3aed] font-bold text-[11px]">
                          <ShoppingBag className="w-3 h-3 text-[#7c3aed]" />
                          <span>{customer.totalOrders ?? 0}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-zinc-500 font-mono text-[11px]">
                        <div>{new Date(customer.registeredAt).toLocaleDateString('en-IN')}</div>
                        <div className="text-[10px] text-zinc-400">
                          {new Date(customer.registeredAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
