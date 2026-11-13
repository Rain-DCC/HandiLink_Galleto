import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { gatewayFetch } from '../../services/apiClient';
import { HANDILINK_LOGO } from '../../utils/assets';
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  ArrowRight,
  User as UserIcon,
  Phone,
  MapPin,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
} from 'lucide-react';

interface LoginPageProps {
  initialMode?: 'login' | 'register';
}

export const LoginPage: React.FC<LoginPageProps> = ({ initialMode = 'login' }) => {
  const { loginWithEmail, registerAccount, completeGoogleAuth, currentView, setCurrentView } = useApp();

  const [mode, setMode] = useState<'login' | 'register'>(
    currentView === 'register' ? 'register' : initialMode
  );

  useEffect(() => {
    if (currentView === 'register') setMode('register');
    else if (currentView === 'login') setMode('login');
  }, [currentView]);

  // Login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [community, setCommunity] = useState('Binugao, Toril, Davao City');
  const [regRole, setRegRole] = useState<'customer' | 'fashion_designer' | 'artisan_weaver'>('customer');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Password policy validation (>=8 chars, uppercase, lowercase, number)
  const passwordChecks = {
    minLength: regPassword.length >= 8,
    hasUpper: /[A-Z]/.test(regPassword),
    hasLower: /[a-z]/.test(regPassword),
    hasNumber: /[0-9]/.test(regPassword),
    matches: regPassword.length > 0 && regPassword === confirmPassword,
  };
  const isPasswordStrong =
    passwordChecks.minLength &&
    passwordChecks.hasUpper &&
    passwordChecks.hasLower &&
    passwordChecks.hasNumber &&
    passwordChecks.matches;

  // Listen for Google OAuth popup callback postMessage
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'HANDILINK_GOOGLE_AUTH_SUCCESS' && event.data?.token && event.data?.user) {
        await completeGoogleAuth(event.data.token, event.data.user);
        setIsGoogleLoading(false);
      } else if (event.data?.type === 'HANDILINK_GOOGLE_AUTH_ERROR') {
        setErrorMsg(event.data.error || 'Google Sign-In failed.');
        setIsGoogleLoading(false);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [completeGoogleAuth]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);
    try {
      await loginWithEmail(email.trim(), password);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Sign in failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!isPasswordStrong) {
      setErrorMsg('Please satisfy all password security requirements (8+ chars, uppercase, lowercase, number, and confirmation).');
      return;
    }
    setIsSubmitting(true);
    try {
      await registerAccount({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: regEmail.trim(),
        password: regPassword,
        phone: phone.trim(),
        address: address.trim(),
        community: community.trim(),
        role: regRole,
      });
    } catch (err: any) {
      setErrorMsg(err?.message || 'Registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleOAuth = async () => {
    setErrorMsg('');
    setIsGoogleLoading(true);
    try {
      const res = await gatewayFetch<{ url: string }>('/auth/google/url');
      const popup = window.open(
        res.url,
        'handilink_google_oauth',
        'width=520,height=640,scrollbars=yes,resizable=yes'
      );
      if (!popup) {
        setErrorMsg('Pop-up blocked by browser. Please allow pop-ups for Google Sign-In.');
        setIsGoogleLoading(false);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Google OAuth is not configured on this server.');
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-5.75rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-5xl bg-[#FAF6ED] rounded-2xl border border-[#C9A227]/30 shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12 items-stretch">
        {/* Left Side: Cultural Visual & Logo Branding */}
        <div className="md:col-span-5 bg-[#3B2418] text-[#F8F3E7] p-8 sm:p-10 flex flex-col justify-between gap-8 relative overflow-hidden bg-woven-pattern">
          <div className="relative z-10 space-y-5">
            <div className="bg-white/95 rounded-2xl p-3 inline-flex items-center justify-center shadow-lg border border-[#C9A227]/60">
              <img
                src={HANDILINK_LOGO}
                alt="HandiLink Official Logo"
                className="h-20 w-auto object-contain"
              />
            </div>

            <div>
              <h2 className="font-serif font-bold text-2xl sm:text-3xl text-[#F8F3E7]">
                HANDILINK
              </h2>
              <p className="font-serif italic text-sm text-[#E5C76B] mt-1">
                "Preserving Heritage. Empowering Artisans."
              </p>
            </div>

            <p className="text-xs text-[#F8F3E7]/85 leading-relaxed">
              The official cultural commerce, NCIP compliance, and production platform of the Binugao Bagobo-Tagabawa Women Weavers Association (BIBATAWA).
            </p>
          </div>

          <div className="relative z-10 pt-8 border-t border-[#5A3825] space-y-3">
            <div className="flex items-center gap-2 text-xs text-[#E5C76B]">
              <ShieldCheck className="w-4 h-4 text-[#C9A227] shrink-0" />
              <span>JWT Session + RBAC + Bcrypt Secured Gateway</span>
            </div>
            <p className="text-[11px] text-[#F8F3E7]/65">
              Binugao Ancestral Domain, Toril District, Davao City
            </p>
          </div>
        </div>

        {/* Right Side: Login / Register Form */}
        <div className="md:col-span-7 p-6 sm:p-10 flex flex-col justify-center bg-white">
          <div className="w-full max-w-lg mx-auto space-y-5">
            {/* Tabs */}
            <div className="flex items-center gap-2 border-b border-[#C9A227]/25 pb-3">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setCurrentView('login');
                  setErrorMsg('');
                }}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                  mode === 'login'
                    ? 'bg-[#3B2418] text-[#E5C76B]'
                    : 'bg-[#FAF6ED] text-[#5A3825] hover:bg-[#C9A227]/15'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setCurrentView('register');
                  setErrorMsg('');
                }}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                  mode === 'register'
                    ? 'bg-[#3B2418] text-[#E5C76B]'
                    : 'bg-[#FAF6ED] text-[#5A3825] hover:bg-[#C9A227]/15'
                }`}
              >
                Create Account
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Google OAuth Button */}
            <button
              type="button"
              onClick={handleGoogleOAuth}
              disabled={isGoogleLoading || isSubmitting}
              className="w-full py-2.5 px-4 rounded-lg border border-[#C9A227]/50 bg-[#FAF6ED] hover:bg-[#C9A227]/15 text-[#3B2418] font-semibold text-xs flex items-center justify-center gap-2.5 transition-colors disabled:opacity-60"
            >
              {isGoogleLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#8C6B0F]" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96z"
                  />
                </svg>
              )}
              <span>{mode === 'login' ? 'Sign in with Google' : 'Sign up with Google'}</span>
            </button>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-[#C9A227]/20" />
              <span className="shrink mx-3 text-[10px] uppercase font-bold tracking-wider text-[#5A3825]/60">
                Or continue with Email
              </span>
              <div className="flex-grow border-t border-[#C9A227]/20" />
            </div>

            {mode === 'login' ? (
              <form onSubmit={handleSignIn} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-[#3B2418] mb-1">Email Address *</label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="name@organization.ph"
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-[#C9A227]/40 bg-white text-[#24150F] focus:border-[#C9A227]"
                    />
                    <Mail className="w-4 h-4 text-[#5A3825]/60 absolute left-3 top-3" />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-[#3B2418] mb-1">Password *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full pl-9 pr-10 py-2.5 rounded-lg border border-[#C9A227]/40 bg-white text-[#24150F] focus:border-[#C9A227]"
                    />
                    <Lock className="w-4 h-4 text-[#5A3825]/60 absolute left-3 top-3" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-[#5A3825]/60 hover:text-[#3B2418]"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-[#3B2418] text-[#E5C76B] hover:bg-[#5A3825] disabled:opacity-60 font-bold text-xs uppercase tracking-wider rounded-lg shadow-md transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="w-4 h-4 text-[#C9A227]" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-[#3B2418] mb-1">First Name *</label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={firstName}
                        onChange={e => setFirstName(e.target.value)}
                        placeholder="Maria"
                        className="w-full pl-8 pr-3 py-2 rounded-lg border border-[#C9A227]/40 bg-white text-[#24150F]"
                      />
                      <UserIcon className="w-3.5 h-3.5 text-[#5A3825]/60 absolute left-2.5 top-2.5" />
                    </div>
                  </div>
                  <div>
                    <label className="block font-semibold text-[#3B2418] mb-1">Last Name *</label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                      placeholder="Santos"
                      className="w-full px-3 py-2 rounded-lg border border-[#C9A227]/40 bg-white text-[#24150F]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-[#3B2418] mb-1">Email Address *</label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={e => setRegEmail(e.target.value)}
                        placeholder="name@domain.ph"
                        className="w-full pl-8 pr-3 py-2 rounded-lg border border-[#C9A227]/40 bg-white text-[#24150F]"
                      />
                      <Mail className="w-3.5 h-3.5 text-[#5A3825]/60 absolute left-2.5 top-2.5" />
                    </div>
                  </div>
                  <div>
                    <label className="block font-semibold text-[#3B2418] mb-1">Account Role *</label>
                    <select
                      value={regRole}
                      onChange={e => setRegRole(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-lg border border-[#C9A227]/40 bg-[#FAF6ED] text-[#3B2418] font-medium"
                    >
                      <option value="customer">Customer / Cultural Patron</option>
                      <option value="fashion_designer">Fashion Designer Partner</option>
                      <option value="artisan_weaver">BIBATAWA Artisan Weaver (Requires Verification)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-[#3B2418] mb-1">Phone Number</label>
                    <div className="relative">
                      <input
                        type="tel"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="+63 9XX XXX XXXX"
                        className="w-full pl-8 pr-3 py-2 rounded-lg border border-[#C9A227]/40 bg-white text-[#24150F]"
                      />
                      <Phone className="w-3.5 h-3.5 text-[#5A3825]/60 absolute left-2.5 top-2.5" />
                    </div>
                  </div>
                  <div>
                    <label className="block font-semibold text-[#3B2418] mb-1">Community / Address</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={address}
                        onChange={e => setAddress(e.target.value)}
                        placeholder="City / Barangay"
                        className="w-full pl-8 pr-3 py-2 rounded-lg border border-[#C9A227]/40 bg-white text-[#24150F]"
                      />
                      <MapPin className="w-3.5 h-3.5 text-[#5A3825]/60 absolute left-2.5 top-2.5" />
                    </div>
                  </div>
                </div>

                {regRole === 'artisan_weaver' && (
                  <div>
                    <label className="block font-semibold text-[#3B2418] mb-1">Ancestral Domain / Cluster</label>
                    <input
                      type="text"
                      value={community}
                      onChange={e => setCommunity(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[#C9A227]/40 bg-[#FAF6ED] text-[#24150F]"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-[#3B2418] mb-1">Password *</label>
                    <div className="relative">
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        required
                        value={regPassword}
                        onChange={e => setRegPassword(e.target.value)}
                        placeholder="Min. 8 chars"
                        className="w-full pl-8 pr-9 py-2 rounded-lg border border-[#C9A227]/40 bg-white text-[#24150F]"
                      />
                      <Lock className="w-3.5 h-3.5 text-[#5A3825]/60 absolute left-2.5 top-2.5" />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute right-2.5 top-2.5 text-[#5A3825]/60 hover:text-[#3B2418]"
                        aria-label={showRegPassword ? 'Hide password' : 'Show password'}
                      >
                        {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block font-semibold text-[#3B2418] mb-1">Confirm Password *</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="Repeat password"
                        className="w-full pl-8 pr-9 py-2 rounded-lg border border-[#C9A227]/40 bg-white text-[#24150F]"
                      />
                      <Lock className="w-3.5 h-3.5 text-[#5A3825]/60 absolute left-2.5 top-2.5" />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-2.5 top-2.5 text-[#5A3825]/60 hover:text-[#3B2418]"
                        aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                      >
                        {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Live Password Policy Checklist */}
                <div className="p-2.5 rounded-lg bg-[#FAF6ED] border border-[#C9A227]/25 grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[11px]">
                  {[
                    { ok: passwordChecks.minLength, label: '8+ characters' },
                    { ok: passwordChecks.hasUpper, label: 'Uppercase (A-Z)' },
                    { ok: passwordChecks.hasLower, label: 'Lowercase (a-z)' },
                    { ok: passwordChecks.hasNumber, label: 'Number (0-9)' },
                    { ok: passwordChecks.matches, label: 'Passwords match' },
                  ].map(rule => (
                    <div
                      key={rule.label}
                      className={`flex items-center gap-1 ${rule.ok ? 'text-emerald-700 font-semibold' : 'text-[#5A3825]/70'}`}
                    >
                      {rule.ok ? <CheckCircle2 className="w-3 h-3 shrink-0" /> : <XCircle className="w-3 h-3 shrink-0 opacity-50" />}
                      <span>{rule.label}</span>
                    </div>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-[#3B2418] text-[#E5C76B] hover:bg-[#5A3825] disabled:opacity-60 font-bold text-xs uppercase tracking-wider rounded-lg shadow-md transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Create HandiLink Account</span>
                      <ArrowRight className="w-4 h-4 text-[#C9A227]" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
