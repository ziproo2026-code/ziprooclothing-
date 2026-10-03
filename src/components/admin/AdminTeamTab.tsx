import React, { useState, useEffect } from 'react';
import { Shield, ShieldAlert, UserPlus, Trash2, CheckCircle2, AlertCircle, Lock, Crown, UserCheck } from 'lucide-react';
import type { AdminUser } from '../../types/index.js';

interface AdminTeamTabProps {
  currentAdmin: AdminUser | null;
  token: string | null;
}

interface SafeAdmin {
  id: string;
  username: string;
  name: string;
  role: string;
  lastLogin?: string;
  isAdmin1?: boolean;
}

export const AdminTeamTab: React.FC<AdminTeamTabProps> = ({ currentAdmin, token }) => {
  const [admins, setAdmins] = useState<SafeAdmin[]>([]);
  const [newUsername, setNewUsername] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('Operations & Atelier Lead');
  const [newPassword, setNewPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const isAdmin1 = currentAdmin?.username === 'rohithsharma' || currentAdmin?.id === 'usr_admin_1';

  const fetchAdmins = async () => {
    try {
      const res = await fetch('/api/admin/admins', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setAdmins(data);
      }
    } catch (err) {
      console.error('Failed to fetch admin list:', err);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, [token]);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!isAdmin1) {
      setErrorMsg('Unauthorized: Only Admin 1 (Rohith Sharma) can create new administrators.');
      return;
    }

    if (!newUsername.trim() || !newName.trim() || !newPassword.trim()) {
      setErrorMsg('Please fill in Username, Full Name, and Password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/create-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          username: newUsername.trim(),
          name: newName.trim(),
          role: newRole.trim(),
          password: newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create administrator');
      }

      setSuccessMsg(`Administrator account '${data.admin.username}' created successfully.`);
      setNewUsername('');
      setNewName('');
      setNewPassword('');
      fetchAdmins();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error creating administrator');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAdmin = async (id: string, name: string) => {
    if (!isAdmin1) return;
    try {
      const res = await fetch(`/api/admin/admins/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(`Administrator '${name}' removed successfully.`);
        fetchAdmins();
      } else {
        setErrorMsg(data.error || 'Failed to remove administrator');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error deleting administrator');
    }
  };

  return (
    <div className="space-y-8 text-zinc-900">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-mono mb-1">
          <Shield className="w-3.5 h-3.5 text-purple-600" />
          <span>Atelier Governance & Access Control</span>
        </div>
        <h2 className="text-xl font-bold font-display uppercase tracking-tight text-zinc-950 flex items-center gap-2">
          <span>Website Administrator Management</span>
        </h2>
        <p className="text-xs text-zinc-600">
          Strict policy: New administrators can be authorized and provisioned by <strong>Admin 1 (Rohith Sharma)</strong> only.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Admin 1 Privilege Status Card */}
      <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
        isAdmin1
          ? 'bg-purple-50/60 border-purple-200 shadow-sm'
          : 'bg-white border-zinc-200 shadow-sm'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            isAdmin1 ? 'bg-[#7c3aed] text-white shadow-sm' : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
          }`}>
            {isAdmin1 ? <Crown className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
          </div>
          <div>
            <span className="text-xs uppercase font-mono tracking-wider text-purple-700 font-bold block">
              Current Session: {currentAdmin?.username}
            </span>
            <p className="text-sm font-bold text-zinc-950">
              {isAdmin1 ? 'Admin 1 Authority Verified (Full Creation Access)' : 'Standard Administrator Role (Read-Only Privilege)'}
            </p>
          </div>
        </div>

        {!isAdmin1 && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-mono">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>Creation Locked to Admin 1</span>
          </div>
        )}
      </div>

      {/* Provision New Admin Form (ADMIN 1 ONLY) */}
      {isAdmin1 ? (
        <div className="p-6 rounded-2xl bg-white border border-zinc-200 space-y-5 shadow-sm">
          <div className="flex items-center gap-2 pb-3 border-b border-zinc-100">
            <UserPlus className="w-5 h-5 text-purple-600" />
            <h3 className="text-base font-bold font-display uppercase tracking-wide text-zinc-950">
              Provision New Administrator (Admin 1 Only)
            </h3>
          </div>

          <form onSubmit={handleCreateAdmin} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase font-mono text-zinc-600 mb-1">
                  New Admin User ID / Username *
                </label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="e.g. manager_ravi"
                  className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-300 rounded-lg text-zinc-900 text-sm focus:outline-none focus:border-[#7c3aed] focus:bg-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs uppercase font-mono text-zinc-600 mb-1">
                  Full Name & Title *
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Ravi Patel (Logistics Lead)"
                  className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-300 rounded-lg text-zinc-900 text-sm focus:outline-none focus:border-[#7c3aed] focus:bg-white transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase font-mono text-zinc-600 mb-1">
                  Role Title
                </label>
                <input
                  type="text"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  placeholder="Operations & Atelier Lead"
                  className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-300 rounded-lg text-zinc-900 text-sm focus:outline-none focus:border-[#7c3aed] focus:bg-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs uppercase font-mono text-zinc-600 mb-1">
                  Secure Password *
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Set initial administrator password"
                  className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-300 rounded-lg text-zinc-900 text-sm focus:outline-none focus:border-[#7c3aed] focus:bg-white transition-colors"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-6 py-3 text-xs font-bold uppercase tracking-widest text-white bg-zinc-900 hover:bg-black rounded-xl transition-all shadow-md active:scale-98 disabled:opacity-50"
              >
                <UserCheck className="w-4 h-4" />
                <span>{isSubmitting ? 'Creating Administrator...' : 'Authorize & Create New Admin'}</span>
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="p-6 rounded-2xl bg-white border border-zinc-200 text-center space-y-2 shadow-sm">
          <Lock className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
          <p className="text-sm font-bold text-zinc-900">Administrator Provisioning Restricted</p>
          <p className="text-xs text-zinc-500 max-w-md mx-auto">
            You are logged in as {currentAdmin?.name}. Only Admin 1 (Rohith Sharma) has cryptographic authorization to add or remove website administrators.
          </p>
        </div>
      )}

      {/* Roster of Active Administrators */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase font-mono tracking-wider text-zinc-600">
          Current Atelier Administrators ({admins.length})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {admins.map((adm) => {
            const isSelf = adm.username === currentAdmin?.username;
            const isPrim = adm.isAdmin1 || adm.username === 'rohithsharma';
            const isAdmin2 = adm.username === 'ranjithkumar';

            return (
              <div
                key={adm.id}
                className={`p-5 rounded-2xl border transition-all space-y-3 ${
                  isPrim
                    ? 'bg-purple-50/50 border-purple-200 shadow-sm'
                    : isAdmin2
                    ? 'bg-white border-purple-200 shadow-sm'
                    : 'bg-white border-zinc-200 shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-zinc-950">{adm.name}</span>
                      {isPrim && (
                        <span className="px-2 py-0.5 rounded-full bg-[#7c3aed] text-white text-[10px] font-mono font-bold uppercase tracking-wider">
                          Admin 1
                        </span>
                      )}
                      {isAdmin2 && (
                        <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-mono font-bold uppercase tracking-wider border border-purple-200">
                          Admin 2
                        </span>
                      )}
                      {isSelf && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-mono">
                          You
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-mono text-purple-700">@{adm.username}</div>
                    <div className="text-xs text-zinc-500 font-mono">{adm.role}</div>
                  </div>

                  {isAdmin1 && !isPrim && (
                    <button
                      onClick={() => handleDeleteAdmin(adm.id, adm.name)}
                      className="p-2 text-zinc-400 hover:text-red-600 hover:bg-zinc-100 rounded-lg transition-colors"
                      title="Remove administrator"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-[11px] font-mono text-zinc-500">
                  <span>Administrator ID: {adm.id}</span>
                  {adm.lastLogin && (
                    <span>Last Login: {new Date(adm.lastLogin).toLocaleDateString('en-IN')}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
