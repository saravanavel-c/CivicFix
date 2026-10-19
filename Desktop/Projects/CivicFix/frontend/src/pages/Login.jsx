import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Building2, Wrench, ShieldCheck, ArrowRight,
  Sparkles, CheckCircle2, MapPin, FileText,
  Mail, Lock, Eye, EyeOff, UserPlus, LogIn, AlertCircle, Loader2,
} from 'lucide-react';
import { userService, signIn, signUp } from '../services/userService';

// ─────────────────────────────────────────────────────────────
// Demo role cards (preserved exactly as before)
// ─────────────────────────────────────────────────────────────
const ROLES = [
  {
    id: 'citizen', title: 'Citizen Login', roleName: 'Citizen',
    subtitle: 'Report civic issues, track real-time resolution, and upvote neighborhood concerns.',
    icon: User,     color: 'bg-primary-600',
    badgeBg: 'bg-primary-50 text-primary-700 border-primary-100',
    route: '/citizen/dashboard', tag: 'Public Access',
  },
  {
    id: 'department', title: 'Department Login', roleName: 'Department User',
    subtitle: 'Manage department complaints, allocate ground workers, and monitor heatmaps.',
    icon: Building2, color: 'bg-emerald-600',
    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    route: '/department/dashboard', tag: 'Municipal Authority',
  },
  {
    id: 'worker', title: 'Worker Login', roleName: 'Worker',
    subtitle: 'View allocated work orders, submit execution updates, and upload completion proof.',
    icon: Wrench,   color: 'bg-amber-600',
    badgeBg: 'bg-amber-50 text-amber-700 border-amber-100',
    route: '/worker/dashboard', tag: 'Field Staff',
  },
  {
    id: 'admin', title: 'Admin Login', roleName: 'Admin',
    subtitle: 'Manage system users, oversee department personnel, and audit civic platform activity.',
    icon: ShieldCheck, color: 'bg-violet-600',
    badgeBg: 'bg-violet-50 text-violet-700 border-violet-100',
    route: '/admin/dashboard', tag: 'System Admin',
  },
];

export const Login = () => {
  const navigate = useNavigate();

  // Auth modal state
  const [authMode, setAuthMode]       = useState(null); // null | 'signin' | 'signup'
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [fullName, setFullName]       = useState('');
  const [showPw, setShowPw]           = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError]     = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  // Demo role switcher (offline / presentation mode)
  const handleRoleLogin = async (role, route) => {
    await userService.setCurrentRole(role);
    navigate(route);
  };

  // Real Supabase sign-in
  const handleSignIn = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      const { redirectPath } = await signIn(email, password);
      navigate(redirectPath);
    } catch (err) {
      setAuthError(err.message || 'Sign in failed. Check your email and password.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Real Supabase sign-up
  const handleSignUp = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (!fullName.trim()) { setAuthError('Full name is required.'); return; }
    if (password.length < 8) { setAuthError('Password must be at least 8 characters.'); return; }
    setAuthLoading(true);
    try {
      await signUp(email, password, fullName);
      setAuthSuccess('Account created! Check your email to confirm, then sign in.');
      setAuthMode('signin');
    } catch (err) {
      setAuthError(err.message || 'Sign up failed. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  const closeModal = () => {
    setAuthMode(null); setAuthError(''); setAuthSuccess('');
    setEmail(''); setPassword(''); setFullName('');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* ── Header ── */}
      <div className="max-w-6xl mx-auto w-full flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-primary-600 rounded-2xl flex items-center justify-center text-white shadow-md shadow-primary-500/25">
            <span className="font-display font-bold text-xl">C</span>
          </div>
          <span className="font-display font-bold text-2xl text-slate-800 tracking-tight">
            Civic<span className="text-primary-600">Fix</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-500 bg-white px-3.5 py-1.5 rounded-full border border-slate-200/70 shadow-sm">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span>Role-Based Portal Access</span>
          </div>
          {/* Real auth toggle */}
          <button
            onClick={() => setAuthMode('signin')}
            className="flex items-center gap-1.5 text-xs font-semibold text-primary-600 bg-primary-50 border border-primary-100 px-3.5 py-1.5 rounded-full hover:bg-primary-100 transition-colors cursor-pointer"
          >
            <LogIn className="h-3.5 w-3.5" />
            <span>Sign In</span>
          </button>
        </div>
      </div>

      {/* ── Role cards ── */}
      <div className="max-w-5xl mx-auto w-full my-auto py-8 space-y-8 animate-fade-in">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary-600 bg-primary-50 px-3 py-1 rounded-full border border-primary-100">
            Civic Grievance &amp; Resolution Platform
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 font-display tracking-tight leading-tight">
            Select Your Account Role
          </h1>
          <p className="text-sm sm:text-base text-slate-500 leading-relaxed">
            Welcome to CivicFix. Choose your portal to access specialized dashboards for issue reporting,
            department assignments, and resolution tracking.
          </p>
          <p className="text-xs text-slate-400">
            Demo mode — click any card to explore instantly.&nbsp;
            <button onClick={() => setAuthMode('signin')} className="text-primary-600 font-semibold underline cursor-pointer">
              Sign in with a real account
            </button>{' '}for persistent data.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4">
          {ROLES.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-300 group flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className={`h-12 w-12 ${item.color} rounded-2xl flex items-center justify-center text-white shadow-md transition-transform group-hover:scale-105`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${item.badgeBg}`}>
                      {item.tag}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 font-display group-hover:text-primary-600 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{item.subtitle}</p>
                  </div>
                </div>
                <div className="pt-6 mt-4 border-t border-slate-100">
                  <button
                    onClick={() => handleRoleLogin(item.id, item.route)}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-900 hover:bg-primary-600 text-white rounded-2xl font-semibold text-xs transition-all shadow-sm group-hover:shadow-md cursor-pointer"
                  >
                    <span>Enter as {item.roleName}</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-6 border-t border-slate-200/60 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-600">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            <span>Instant Role Navigation</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-600">
            <MapPin className="h-4 w-4 text-primary-500 shrink-0" />
            <span>Area Heatmaps &amp; Location Tracking</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-600">
            <FileText className="h-4 w-4 text-violet-500 shrink-0" />
            <span>Real-time Work Order Status</span>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="max-w-6xl mx-auto w-full text-center py-4 border-t border-slate-200/40 text-xs text-slate-400">
        © 2026 CivicFix Municipal Governance System. All rights reserved.
      </footer>

      {/* ── Auth Modal ── */}
      {authMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 space-y-6 animate-fade-in">
            {/* Modal header */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800 font-display">
                {authMode === 'signin' ? 'Sign In' : 'Create Account'}
              </h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 text-2xl leading-none cursor-pointer">&times;</button>
            </div>

            {authSuccess && (
              <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                <p className="text-xs text-emerald-700">{authSuccess}</p>
              </div>
            )}

            {authError && (
              <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 rounded-xl p-3">
                <AlertCircle className="h-4 w-4 text-rose-500 mt-0.5 shrink-0" />
                <p className="text-xs text-rose-700">{authError}</p>
              </div>
            )}

            <form onSubmit={authMode === 'signin' ? handleSignIn : handleSignUp} className="space-y-4">
              {authMode === 'signup' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                      placeholder="e.g. Saravanavel" required
                      className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com" required
                    className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type={showPw ? 'text' : 'password'} value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder={authMode === 'signup' ? 'Min. 8 characters' : '••••••••'}
                    required minLength={authMode === 'signup' ? 8 : 1}
                    className="w-full pl-9 pr-10 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <button type="button" onClick={() => setShowPw(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit" disabled={authLoading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white rounded-2xl font-semibold text-sm transition-all cursor-pointer"
              >
                {authLoading
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : authMode === 'signin'
                    ? <><LogIn className="h-4 w-4" /> Sign In</>
                    : <><UserPlus className="h-4 w-4" /> Create Account</>
                }
              </button>
            </form>

            <p className="text-center text-xs text-slate-500">
              {authMode === 'signin' ? (
                <>No account?{' '}
                  <button onClick={() => { setAuthMode('signup'); setAuthError(''); }} className="text-primary-600 font-semibold underline cursor-pointer">Create one</button>
                </>
              ) : (
                <>Already have an account?{' '}
                  <button onClick={() => { setAuthMode('signin'); setAuthError(''); }} className="text-primary-600 font-semibold underline cursor-pointer">Sign in</button>
                </>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
