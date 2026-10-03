import React, { useState, useEffect } from 'react';
import { Mail, MessageSquare, Phone, MapPin, Calendar, Check, Trash2, Reply, RefreshCw } from 'lucide-react';
import type { CustomerMessage } from '../../types/index.js';

interface AdminMessagesTabProps {
  token: string | null;
}

export const AdminMessagesTab: React.FC<AdminMessagesTabProps> = ({ token }) => {
  const [messages, setMessages] = useState<CustomerMessage[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read' | 'replied'>('all');
  const [isLoading, setIsLoading] = useState(false);

  const fetchMessages = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/messages', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [token]);

  const handleUpdateStatus = async (id: string, status: CustomerMessage['status']) => {
    try {
      const res = await fetch(`/api/admin/messages/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setMessages((prev) =>
          prev.map((m) => (m.id === id ? { ...m, status } : m))
        );
      }
    } catch (err) {
      console.error('Failed to update message status:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/messages/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete message:', err);
    }
  };

  const filtered = messages.filter((m) => (filter === 'all' ? true : m.status === filter));
  const unreadCount = messages.filter((m) => m.status === 'unread').length;

  return (
    <div className="space-y-6 text-zinc-900">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-[#7c3aed] text-xs font-mono mb-1 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#7c3aed]" />
            <span>Admin-Only Atelier Inbox</span>
          </div>
          <h2 className="text-xl font-bold font-display uppercase tracking-tight text-zinc-950 flex items-center gap-2">
            <span>Customer Messages & Inquiries</span>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold">
                {unreadCount} UNREAD
              </span>
            )}
          </h2>
          <p className="text-xs text-zinc-500">
            Confidential inquiries sent through the "Stay Connected" atelier portal. Visible strictly to verified administrators.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Status Filter Buttons */}
          <div className="flex items-center bg-zinc-100 border border-zinc-200 rounded-lg p-1 text-xs">
            {(['all', 'unread', 'read', 'replied'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 py-1 rounded-md uppercase font-mono tracking-wider text-[11px] transition-all ${
                  filter === tab ? 'bg-white text-zinc-950 font-bold shadow-xs' : 'text-zinc-500 hover:text-zinc-950'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <button
            onClick={fetchMessages}
            disabled={isLoading}
            className="p-2 bg-white border border-zinc-200 hover:bg-zinc-100 text-zinc-700 hover:text-zinc-950 rounded-lg transition-all shadow-xs"
            title="Refresh messages"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Messages List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white border border-zinc-200 text-zinc-500 space-y-2 shadow-xs">
            <MessageSquare className="w-8 h-8 mx-auto text-zinc-400 mb-2" />
            <p className="text-sm font-semibold text-zinc-800">No atelier messages in this category.</p>
            <p className="text-xs text-zinc-500">When visitors submit messages via the Stay Connected page, they appear securely here.</p>
          </div>
        ) : (
          filtered.map((msg) => {
            const cleanPhone = msg.phone.replace(/\D/g, '');
            return (
              <div
                key={msg.id}
                className={`p-6 rounded-2xl border transition-all space-y-4 shadow-xs ${
                  msg.status === 'unread'
                    ? 'bg-purple-50/40 border-purple-200'
                    : 'bg-white border-zinc-200'
                }`}
              >
                {/* Top Row: Sender Info & Status Badges */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-200">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="text-base font-bold text-zinc-950">{msg.name}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                          msg.status === 'unread'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : msg.status === 'replied'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
                        }`}
                      >
                        {msg.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-zinc-500">
                      {msg.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5 text-zinc-400" />
                          <span>{msg.email}</span>
                        </span>
                      )}
                      {msg.phone && (
                        <span className="flex items-center gap-1 text-[#7c3aed] font-semibold">
                          <Phone className="w-3.5 h-3.5 text-[#7c3aed]" />
                          <span>{msg.phone}</span>
                        </span>
                      )}
                      {msg.location && (
                        <span className="flex items-center gap-1 text-zinc-700">
                          <MapPin className="w-3.5 h-3.5 text-[#7c3aed]" />
                          <span>{msg.location}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto font-mono text-xs text-zinc-400">
                    <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{new Date(msg.createdAt).toLocaleDateString('en-IN')} · {new Date(msg.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                {/* Subject & Body */}
                <div className="space-y-2">
                  <div className="text-xs uppercase font-mono tracking-wider text-[#7c3aed] font-bold">
                    Subject: {msg.subject}
                  </div>
                  <p className="text-sm text-zinc-800 leading-relaxed whitespace-pre-line bg-zinc-50 p-4 rounded-xl border border-zinc-200">
                    {msg.message}
                  </p>
                </div>

                {/* Action Controls */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-2">
                    {msg.email && (
                      <a
                        href={`mailto:${msg.email}?subject=ZIPROO Atelier: Re: ${encodeURIComponent(msg.subject)}`}
                        onClick={() => handleUpdateStatus(msg.id, 'replied')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-zinc-200 hover:bg-zinc-100 text-xs font-semibold text-zinc-800 transition-colors shadow-xs"
                      >
                        <Reply className="w-3.5 h-3.5 text-[#7c3aed]" />
                        <span>Reply Email</span>
                      </a>
                    )}

                    {msg.phone && (
                      <a
                        href={`https://wa.me/${cleanPhone}?text=Hi%20${encodeURIComponent(msg.name)},%20thank%20you%20for%20reaching%20out%20to%20ZIPROO%20Atelier.`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => handleUpdateStatus(msg.id, 'replied')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-xs font-semibold text-emerald-800 transition-colors shadow-xs"
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        <span>WhatsApp Reply</span>
                      </a>
                    )}

                    {msg.status !== 'read' && (
                      <button
                        onClick={() => handleUpdateStatus(msg.id, 'read')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-zinc-200 hover:bg-zinc-100 text-xs font-semibold text-zinc-700 hover:text-zinc-950 transition-colors shadow-xs"
                      >
                        <Check className="w-3.5 h-3.5 text-zinc-500" />
                        <span>Mark as Read</span>
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => handleDelete(msg.id)}
                    className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete message permanently"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
