import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import {
  Plus,
  Search,
  ShieldCheck,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  Ban,
} from 'lucide-react';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';

export const UserManagement: React.FC = () => {
  const { users, addUser, verifyUserAccount } = useApp();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);

  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('+63 917 000 0000');
  const [address, setAddress] = useState('Binugao, Toril District, Davao City');
  const [role, setRole] = useState<Exclude<UserRole, 'guest'>>('artisan_weaver');
  const [community, setCommunity] = useState('Binugao Ancestral Domain');
  const [isSaving, setIsSaving] = useState(false);
  const [actionUserId, setActionUserId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const hasMinLen = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const passwordValid = hasMinLen && hasUpper && hasLower && hasNumber;

  const filteredUsers = users.filter(u => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.roleTitle.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'All' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!passwordValid) {
      setFormError('Password must be at least 8 characters with uppercase, lowercase, and a number.');
      return;
    }

    setIsSaving(true);
    try {
      await addUser({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
        phone: phone.trim(),
        address: address.trim(),
        role,
        community: community.trim(),
      });
      setIsAddUserModalOpen(false);
      setFirstName('');
      setLastName('');
      setEmail('');
      setPassword('');
    } catch (err: any) {
      setFormError(err?.message || 'Unable to enroll user.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleVerifyAction = async (userId: string, verified: boolean, status: 'Active' | 'Pending' | 'Suspended') => {
    setActionUserId(userId);
    try {
      await verifyUserAccount(userId, verified, status);
    } finally {
      setActionUserId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#C9A227]/30 pb-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-[#8C6B0F]">
            Data Flow Process 10.0 · Role-Based Access Control
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#3B2418] mt-0.5">
            User & Artisan Governance
          </h1>
          <p className="text-xs sm:text-sm text-[#5A3825]/80">
            Manage association leadership, verify incoming artisan weaver registrations, and enforce account governance
          </p>
        </div>

        <button
          onClick={() => {
            setFormError(null);
            setIsAddUserModalOpen(true);
          }}
          className="px-5 py-2.5 bg-[#3B2418] text-[#E5C76B] hover:bg-[#5A3825] font-semibold text-xs tracking-wider uppercase rounded-lg flex items-center gap-2 transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-[#C9A227]" />
          <span>Add User / Artisan</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-[#FAF6ED] p-4 rounded-xl border border-[#C9A227]/30 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Search by name, email, or role..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-[#C9A227]/40 bg-white text-[#24150F] placeholder-[#5A3825]/60 focus:border-[#C9A227]"
          />
          <Search className="w-4 h-4 text-[#5A3825]/60 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[#5A3825] font-medium">Role:</span>
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded border border-[#C9A227]/40 bg-white text-[#3B2418] font-medium"
          >
            <option value="All">All Roles</option>
            <option value="artisan_weaver">Artisan Weaver</option>
            <option value="admin">Administrator</option>
            <option value="creative_director">Creative Director</option>
            <option value="ncip_secretary">NCIP Secretary</option>
            <option value="fashion_designer">Fashion Designer</option>
            <option value="customer">Customer</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[#FAF6ED] rounded-xl border border-[#C9A227]/30 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#3B2418] text-[#E5C76B] font-serif uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">User / Artisan</th>
                <th className="py-3 px-4">Assigned Role</th>
                <th className="py-3 px-4">Community Domain</th>
                <th className="py-3 px-4">Status & Verification</th>
                <th className="py-3 px-4">Last Activity</th>
                <th className="py-3 px-4 text-center">Governance Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#C9A227]/15">
              {filteredUsers.map(u => {
                const isBusy = actionUserId === u.id;
                return (
                  <tr key={u.id} className="hover:bg-white/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-[#3B2418] text-[#E5C76B] font-serif font-bold text-sm flex items-center justify-center shrink-0 border border-[#C9A227]/40">
                          {u.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-serif font-bold text-sm text-[#3B2418] truncate">{u.name}</div>
                          <div className="text-[10px] text-[#5A3825]/75 truncate">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-[#3B2418] block">{u.roleTitle}</span>
                      <span className="text-[10px] text-[#8C6B0F] uppercase font-mono">{u.role}</span>
                    </td>
                    <td className="py-3.5 px-4 text-[#5A3825]">{u.community}</td>
                    <td className="py-3.5 px-4 whitespace-nowrap space-y-1">
                      <div>
                        <Badge
                          variant={
                            u.status === 'Active'
                              ? 'green'
                              : u.status === 'Suspended'
                              ? 'crimson'
                              : 'amber'
                          }
                        >
                          {u.status}
                        </Badge>
                      </div>
                      <div className="text-[10px] font-medium text-[#5A3825]">
                        {u.verified ? '✓ Elder Verified' : 'Unverified Registration'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-[#5A3825] whitespace-nowrap font-mono text-[11px]">
                      {u.lastLogin || 'Never'}
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap space-x-1.5">
                      {!u.verified && (
                        <button
                          disabled={isBusy}
                          onClick={() => handleVerifyAction(u.id, true, 'Active')}
                          className="px-2.5 py-1 bg-emerald-800 text-white hover:bg-emerald-900 rounded font-semibold text-[11px] inline-flex items-center gap-1 disabled:opacity-50"
                        >
                          {isBusy ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <ShieldCheck className="w-3 h-3" />
                          )}
                          <span>Verify Artisan</span>
                        </button>
                      )}
                      {u.status !== 'Active' && (
                        <button
                          disabled={isBusy}
                          onClick={() => handleVerifyAction(u.id, true, 'Active')}
                          className="px-2.5 py-1 bg-[#3B2418] text-[#E5C76B] hover:bg-[#5A3825] rounded font-semibold text-[11px] inline-flex items-center gap-1 disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Activate</span>
                        </button>
                      )}
                      {u.status === 'Active' && u.role !== 'admin' && (
                        <button
                          disabled={isBusy}
                          onClick={() => handleVerifyAction(u.id, !!u.verified, 'Suspended')}
                          className="px-2.5 py-1 bg-white border border-rose-300 text-rose-700 hover:bg-rose-50 rounded font-semibold text-[11px] inline-flex items-center gap-1 disabled:opacity-50"
                        >
                          <Ban className="w-3 h-3" />
                          <span>Suspend</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      <Modal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        title="Enroll User or Master Artisan"
        subtitle="Provision secure password-protected credentials into HandiLink"
        maxWidth="lg"
      >
        <form onSubmit={handleSaveUser} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#3B2418] mb-1">First Name *</label>
              <input
                type="text"
                required
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                className="w-full px-3 py-2 rounded border border-[#C9A227]/40 bg-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#3B2418] mb-1">Last Name *</label>
              <input
                type="text"
                required
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                className="w-full px-3 py-2 rounded border border-[#C9A227]/40 bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#3B2418] mb-1">Email Address *</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded border border-[#C9A227]/40 bg-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#3B2418] mb-1">Initial Password *</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min 8 chars, upper, lower, number"
                className="w-full pl-3 pr-10 py-2 rounded border border-[#C9A227]/40 bg-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-2.5 top-2 text-[#5A3825] hover:text-[#3B2418]"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1 mt-1.5 text-[10px]">
              <span className={hasMinLen ? 'text-emerald-700 font-semibold' : 'text-stone-500'}>
                {hasMinLen ? '✓' : '○'} 8+ characters
              </span>
              <span className={hasUpper ? 'text-emerald-700 font-semibold' : 'text-stone-500'}>
                {hasUpper ? '✓' : '○'} Uppercase letter
              </span>
              <span className={hasLower ? 'text-emerald-700 font-semibold' : 'text-stone-500'}>
                {hasLower ? '✓' : '○'} Lowercase letter
              </span>
              <span className={hasNumber ? 'text-emerald-700 font-semibold' : 'text-stone-500'}>
                {hasNumber ? '✓' : '○'} Number (0-9)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#3B2418] mb-1">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full px-3 py-2 rounded border border-[#C9A227]/40 bg-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#3B2418] mb-1">Assigned Role *</label>
              <select
                value={role}
                onChange={e => setRole(e.target.value as Exclude<UserRole, 'guest'>)}
                className="w-full px-3 py-2 rounded border border-[#C9A227]/40 bg-white"
              >
                <option value="artisan_weaver">Artisan Weaver</option>
                <option value="admin">Administrator</option>
                <option value="creative_director">Creative Director</option>
                <option value="ncip_secretary">NCIP Secretary</option>
                <option value="fashion_designer">Fashion Designer</option>
                <option value="customer">Customer</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#3B2418] mb-1">Ancestral Community</label>
              <input
                type="text"
                value={community}
                onChange={e => setCommunity(e.target.value)}
                className="w-full px-3 py-2 rounded border border-[#C9A227]/40 bg-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#3B2418] mb-1">Address</label>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                className="w-full px-3 py-2 rounded border border-[#C9A227]/40 bg-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-[#C9A227]/30">
            <button
              type="button"
              disabled={isSaving}
              onClick={() => setIsAddUserModalOpen(false)}
              className="px-4 py-2 border border-stone-300 rounded text-stone-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 bg-[#3B2418] text-[#E5C76B] hover:bg-[#5A3825] rounded font-semibold uppercase tracking-wider flex items-center gap-1.5 disabled:opacity-60"
            >
              {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isSaving ? 'Enrolling...' : 'Enroll User'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
