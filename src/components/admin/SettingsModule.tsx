import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { gatewayFetch } from '../../services/apiClient';
import {
  Settings,
  User,
  Lock,
  Save,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
} from 'lucide-react';

export const SettingsModule: React.FC = () => {
  const { currentUser, updateOwnProfile, pushToast } = useApp();

  const [activeTab, setActiveTab] = useState<'profile' | 'system' | 'security'>('profile');
  const [name, setName] = useState(currentUser.name);
  const [phone, setPhone] = useState(currentUser.phone);
  const [address, setAddress] = useState(currentUser.address);
  const [community, setCommunity] = useState(currentUser.community);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSaved, setProfileSaved] = useState(false);

  // Password change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [isChangingPw, setIsChangingPw] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState<string | null>(null);

  useEffect(() => {
    setName(currentUser.name);
    setPhone(currentUser.phone);
    setAddress(currentUser.address);
    setCommunity(currentUser.community);
  }, [currentUser]);

  const hasMinLen = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const isNewPwValid = hasMinLen && hasUpper && hasLower && hasNumber && passwordsMatch;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSaved(false);
    setIsSavingProfile(true);
    try {
      await updateOwnProfile({
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        community: community.trim(),
      });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    } catch (err: any) {
      setProfileError(err?.message || 'Unable to update profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(null);
    if (!isNewPwValid) {
      setPwError('New password must meet all complexity requirements and match confirmation.');
      return;
    }

    setIsChangingPw(true);
    try {
      const res = await gatewayFetch<{ message: string }>('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword: currentPassword || 'google-oauth',
          newPassword,
        }),
      });
      setPwSuccess(res.message || 'Password updated securely.');
      pushToast('success', 'Password updated securely.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPwError(err?.message || 'Failed to update password.');
    } finally {
      setIsChangingPw(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      <div className="border-b border-[#C9A227]/30 pb-4">
        <span className="text-xs uppercase font-bold tracking-widest text-[#8C6B0F]">
          Platform Preferences & Security
        </span>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#3B2418] mt-0.5">
          System & Account Settings
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#C9A227]/25 gap-6 text-xs font-semibold">
        {[
          { id: 'profile', label: 'Profile Settings', icon: User },
          { id: 'system', label: 'Community & Fair-Trade Split', icon: Settings },
          { id: 'security', label: 'Password & JWT Security', icon: Lock },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 flex items-center gap-1.5 transition-colors border-b-2 ${
                isActive
                  ? 'border-[#C9A227] text-[#3B2418] font-bold'
                  : 'border-transparent text-[#5A3825]/70 hover:text-[#3B2418]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="bg-[#FAF6ED] p-6 sm:p-8 rounded-xl border border-[#C9A227]/30 shadow-xs">
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs max-w-xl">
            <h2 className="font-serif font-bold text-base text-[#3B2418]">
              Personal Information
            </h2>

            {profileError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{profileError}</span>
              </div>
            )}

            {profileSaved && (
              <div className="p-3 bg-emerald-100 border border-emerald-300 rounded text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Profile saved to database!</span>
              </div>
            )}

            <div>
              <label className="block font-semibold text-[#3B2418] mb-1">Full Name *</label>
              <input
                type="text"
                required
                minLength={2}
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2 rounded border border-[#C9A227]/40 bg-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-[#3B2418] mb-1">Email Address</label>
                <input
                  type="email"
                  disabled
                  value={currentUser.email}
                  className="w-full px-3 py-2 rounded border border-stone-200 bg-stone-100 text-stone-600 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#3B2418] mb-1">Contact Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-[#C9A227]/40 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#3B2418] mb-1">Community / Chapter</label>
              <input
                type="text"
                value={community}
                onChange={e => setCommunity(e.target.value)}
                className="w-full px-3 py-2 rounded border border-[#C9A227]/40 bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#3B2418] mb-1">Official Address / Station</label>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                className="w-full px-3 py-2 rounded border border-[#C9A227]/40 bg-white"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSavingProfile}
                className="px-5 py-2.5 bg-[#3B2418] text-[#E5C76B] hover:bg-[#5A3825] rounded font-semibold uppercase tracking-wider shadow-xs flex items-center gap-1.5 disabled:opacity-60"
              >
                {isSavingProfile ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[#C9A227]" />
                ) : (
                  <Save className="w-4 h-4 text-[#C9A227]" />
                )}
                <span>{isSavingProfile ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </form>
        )}

        {activeTab === 'system' && (
          <div className="space-y-4 text-xs max-w-xl">
            <h2 className="font-serif font-bold text-base text-[#3B2418]">
              Community Parameters & Fair-Trade Split
            </h2>
            <div className="p-4 bg-white rounded-lg border border-[#C9A227]/25 space-y-2.5">
              <div className="flex justify-between">
                <span>Association Fair Trade Artisan Share:</span>
                <span className="font-mono font-bold text-emerald-800">82.0%</span>
              </div>
              <div className="flex justify-between">
                <span>Ancestral Domain Heritage Trust Fund:</span>
                <span className="font-mono font-bold text-[#8C6B0F]">18.0%</span>
              </div>
              <div className="flex justify-between">
                <span>Registered Ancestral Domain:</span>
                <span className="font-semibold text-[#3B2418]">Binugao, Toril District, Davao City</span>
              </div>
              <div className="flex justify-between">
                <span>Role & Verification:</span>
                <span className="font-semibold text-[#3B2418]">
                  {currentUser.roleTitle} ({currentUser.verified ? 'Verified' : 'Pending'})
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <form onSubmit={handleChangePassword} className="space-y-4 text-xs max-w-xl">
            <h2 className="font-serif font-bold text-base text-[#3B2418]">
              Update Account Password
            </h2>

            <div className="p-3.5 bg-white rounded-lg border border-[#C9A227]/25 flex items-center justify-between">
              <div>
                <span className="text-stone-500 text-[10px] uppercase font-semibold block">Active Session</span>
                <span className="font-bold text-[#3B2418]">{currentUser.roleTitle}</span>
              </div>
              <span className="px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 font-mono text-[10px] font-bold">
                JWT Verified ({currentUser.authProvider || 'local'})
              </span>
            </div>

            {pwError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{pwError}</span>
              </div>
            )}

            {pwSuccess && (
              <div className="p-3 bg-emerald-100 border border-emerald-300 rounded text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{pwSuccess}</span>
              </div>
            )}

            <div>
              <label className="block font-semibold text-[#3B2418] mb-1">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrentPw ? 'text' : 'password'}
                  required={currentUser.authProvider !== 'google'}
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder={currentUser.authProvider === 'google' ? 'Optional for Google accounts' : 'Enter current password'}
                  className="w-full pl-3 pr-10 py-2 rounded border border-[#C9A227]/40 bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPw(v => !v)}
                  className="absolute right-2.5 top-2 text-[#5A3825]"
                  aria-label="Toggle current password visibility"
                >
                  {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#3B2418] mb-1">New Password *</label>
              <div className="relative">
                <input
                  type={showNewPw ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Min 8 chars, uppercase, lowercase, number"
                  className="w-full pl-3 pr-10 py-2 rounded border border-[#C9A227]/40 bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPw(v => !v)}
                  className="absolute right-2.5 top-2 text-[#5A3825]"
                  aria-label="Toggle new password visibility"
                >
                  {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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

            <div>
              <label className="block font-semibold text-[#3B2418] mb-1">Confirm New Password *</label>
              <div className="relative">
                <input
                  type={showConfirmPw ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full pl-3 pr-10 py-2 rounded border border-[#C9A227]/40 bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPw(v => !v)}
                  className="absolute right-2.5 top-2 text-[#5A3825]"
                  aria-label="Toggle confirm password visibility"
                >
                  {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPassword && !passwordsMatch && (
                <p className="text-[10px] text-rose-700 mt-1">Passwords do not match.</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isChangingPw}
              className="px-5 py-2.5 bg-[#3B2418] text-[#E5C76B] hover:bg-[#5A3825] rounded font-semibold uppercase tracking-wider flex items-center gap-1.5 disabled:opacity-60"
            >
              {isChangingPw ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              <span>{isChangingPw ? 'Updating Password...' : 'Update Password'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
