'use client';

import { useState } from 'react';
import { api, setCookie } from '../../lib/api';
import { useApp } from '../../context/AppContext';

const FEATURES = [
  { icon: '🏗️', labelAr: 'إدارة المشاريع الهندسية', labelEn: 'Project Management',    desc: 'تتبع التقدم والمراحل والمهام' },
  { icon: '🏘️', labelAr: 'منصة العقارات الذكية',     labelEn: 'Smart Real Estate',      desc: 'إدارة العقارات وأنواعها وتصنيفاتها' },
  { icon: '🤖', labelAr: 'مساعد ذكاء اصطناعي',       labelEn: 'AI Assistant',            desc: 'دعم العملاء بتقنية Gemini AI' },
  { icon: '📊', labelAr: 'تقارير وإحصاءات',           labelEn: 'Reports & Analytics',     desc: 'لوحة بيانات تحليلية شاملة' },
];

export default function LoginPage() {
  const { theme, lang, platformLogo, platformName } = useApp();
  const isRtl  = lang === 'ar';
  const isDark = theme === 'dark';

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [focused, setFocused]   = useState<'email' | 'password' | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res   = await api.post('/auth/login', { email, password });
      const token = res.accessToken || res.token;
      if (!token) throw new Error(isRtl ? 'لم يتم استرجاع رمز المصادقة.' : 'No auth token received.');
      setCookie('token', token, 7);
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err?.message || (isRtl ? 'بريد إلكتروني أو كلمة مرور غير صحيحة.' : 'Invalid email or password.'));
    } finally {
      setLoading(false);
    }
  };

  // ── Theme-aware class helpers ──
  const bg          = isDark ? 'bg-[#09090b]'   : 'bg-zinc-50';
  const leftPane    = isDark ? 'bg-gradient-to-br from-zinc-950 via-[#0e0e11] to-zinc-900 border-zinc-800/60'
                             : 'bg-gradient-to-br from-zinc-100 via-white to-zinc-50 border-zinc-200';
  const cardBg      = isDark ? 'bg-zinc-900/60 border-zinc-800/80' : 'bg-white border-zinc-200';
  const headingCls  = isDark ? 'text-zinc-100'  : 'text-zinc-800';
  const subCls      = isDark ? 'text-zinc-400'  : 'text-zinc-500';
  const featureCard = isDark
    ? 'bg-zinc-900/60 border-zinc-800/80 hover:border-primary/30 hover:bg-zinc-900/80'
    : 'bg-white/80 border-zinc-200 hover:border-primary/40 hover:bg-white';
  const featureTitle = isDark ? 'text-zinc-200' : 'text-zinc-700';
  const featureDesc  = isDark ? 'text-zinc-500' : 'text-zinc-400';
  const inputBg     = isDark ? 'bg-zinc-900'    : 'bg-white';
  const inputBorder = isDark ? 'border-zinc-800 hover:border-zinc-700' : 'border-zinc-300 hover:border-zinc-400';
  const inputFocus  = 'border-primary ring-2 ring-primary/20';
  const inputText   = isDark ? 'text-zinc-100 placeholder-zinc-600' : 'text-zinc-800 placeholder-zinc-400';
  const iconColor   = isDark ? 'text-zinc-500'  : 'text-zinc-400';
  const labelCls    = isDark ? 'text-zinc-400'  : 'text-zinc-500';
  const dividerCls  = isDark ? 'bg-zinc-800'    : 'bg-zinc-200';
  const dividerText = isDark ? 'text-zinc-600'  : 'text-zinc-400';
  const noteBg      = isDark ? 'bg-zinc-900/50 border-zinc-800/60' : 'bg-zinc-100/80 border-zinc-200';
  const noteText    = isDark ? 'text-zinc-500'  : 'text-zinc-400';
  const footerText  = isDark ? 'text-zinc-700'  : 'text-zinc-400';
  const logoText    = isDark ? 'text-zinc-100'  : 'text-zinc-800';
  const copyright   = isDark ? 'text-zinc-600'  : 'text-zinc-400';

  const inputWrap = (field: 'email' | 'password') =>
    `relative flex items-center rounded-xl border transition-all duration-200 ${inputBg} ${
      focused === field ? inputFocus : inputBorder
    }`;

  return (
    <main
      dir={isRtl ? 'rtl' : 'ltr'}
      className={`min-h-screen flex ${bg} text-${isDark ? 'zinc-100' : 'zinc-800'} overflow-hidden transition-colors duration-300`}
      role="main"
      aria-label={isRtl ? 'صفحة تسجيل الدخول' : 'Login Page'}
    >
      {/* ══ Left pane — branding ══ */}
      <div className={`hidden lg:flex flex-col justify-between w-[52%] relative overflow-hidden ${leftPane} p-12 border-l`}>
        {/* Glow orbs */}
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[90px] pointer-events-none" />

        {/* Top logo */}
        <div className="relative z-10 flex items-center gap-3">
          {platformLogo ? (
            <img
              src={platformLogo}
              alt="Logo"
              className="w-10 h-10 rounded-xl object-contain bg-zinc-900 border border-zinc-700/50 shadow-lg shadow-primary/20"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl primary-gradient flex items-center justify-center text-zinc-950 font-black text-sm shadow-lg shadow-primary/20">
              {isRtl ? 'آفاق' : 'A'}
            </div>
          )}
          <span className={`text-lg font-extrabold tracking-tight ${logoText}`}>
            {platformName || (isRtl ? 'آفاق العرب الذكية' : 'Smart Arab Horizons')}
          </span>
        </div>

        {/* Center hero */}
        <div className="relative z-10 space-y-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[11px] font-bold text-primary tracking-widest uppercase">
                {isRtl ? 'لوحة التحكم الإدارية' : 'Admin Dashboard'}
              </span>
            </div>
            <h2 className={`text-4xl font-black leading-tight mb-3 ${headingCls}`}>
              {isRtl ? (<>منصة متكاملة<br /><span className="text-transparent bg-clip-text primary-gradient">للتطوير الهندسي</span></>) : (<>Integrated Platform<br /><span className="text-transparent bg-clip-text primary-gradient">for Engineering</span></>)}
            </h2>
            <p className={`text-sm leading-relaxed max-w-sm ${subCls}`}>
              {isRtl
                ? 'إدارة شاملة للمشاريع الهندسية والعقارات والخدمات ومجتمع العملاء بأدوات ذكاء اصطناعي متقدمة.'
                : 'Comprehensive management of engineering projects, real estate, and client services powered by advanced AI tools.'}
            </p>
          </div>

          {/* Feature cards */}
          <div className="grid grid-cols-2 gap-3">
            {FEATURES.map((f, i) => (
              <div key={i} className={`p-4 rounded-2xl border transition-all duration-200 group cursor-default ${featureCard}`}>
                <div className="text-2xl mb-2">{f.icon}</div>
                <div className={`text-xs font-extrabold group-hover:text-primary transition-colors mb-1 ${featureTitle}`}>
                  {isRtl ? f.labelAr : f.labelEn}
                </div>
                <div className={`text-[10px] leading-relaxed ${featureDesc}`}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom copyright */}
        <p className={`relative z-10 text-[11px] ${copyright}`}>
          © {new Date().getFullYear()} {isRtl ? 'آفاق العرب الذكية · جميع الحقوق محفوظة · ذمار، اليمن' : 'Smart Arab Horizons · All rights reserved'}
        </p>
      </div>

      {/* ══ Right pane — form ══ */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative">
        {/* Soft glow */}
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-primary/6 rounded-full blur-[80px] pointer-events-none" />

        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-3 mb-10">
          {platformLogo ? (
            <img
              src={platformLogo}
              alt="Logo"
              className="w-10 h-10 rounded-xl object-contain bg-zinc-900 border border-zinc-700/50 shadow-lg"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl primary-gradient flex items-center justify-center text-zinc-950 font-black text-sm shadow-lg">
              {isRtl ? 'آفاق' : 'A'}
            </div>
          )}
          <span className={`text-lg font-extrabold ${logoText}`}>
            {platformName || (isRtl ? 'آفاق العرب الذكية' : 'Smart Arab Horizons')}
          </span>
        </div>

        {/* Card */}
        <div className="w-full max-w-sm relative z-10">

          {/* Heading */}
          <div className="mb-8">
            <h1 className={`text-2xl font-black mb-1 ${headingCls}`}>
              {isRtl ? 'أهلاً بعودتك 👋' : 'Welcome back 👋'}
            </h1>
            <p className={`text-sm ${subCls}`}>
              {isRtl ? 'سجّل دخولك للوصول إلى لوحة التحكم' : 'Sign in to access the admin dashboard'}
            </p>
          </div>

          {/* Error banner */}
          {error && (
            <div
              role="alert"
              aria-live="assertive"
              className="mb-5 flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-600 dark:text-red-400 text-sm"
            >
              <span className="text-base shrink-0 mt-px">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Email */}
            <div>
              <label htmlFor="login-email" className={`block text-[11px] font-extrabold uppercase tracking-wider mb-2 ${labelCls}`}>
                {isRtl ? 'البريد الإلكتروني' : 'Email Address'}
              </label>
              <div className={inputWrap('email')}>
                <span className={`absolute ${isRtl ? 'right-3.5' : 'left-3.5'} ${iconColor} text-sm pointer-events-none`}>✉️</span>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onFocus={() => setFocused('email')}
                  onBlur={() => setFocused(null)}
                  placeholder="admin@afaq.com"
                  dir="ltr"
                  className={`w-full bg-transparent px-4 py-3 ${isRtl ? 'pe-10' : 'ps-10'} text-sm focus:outline-none rounded-xl ${inputText}`}
                  aria-required="true"
                  aria-label={isRtl ? 'البريد الإلكتروني' : 'Email Address'}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="login-password" className={`block text-[11px] font-extrabold uppercase tracking-wider mb-2 ${labelCls}`}>
                {isRtl ? 'كلمة المرور' : 'Password'}
              </label>
              <div className={inputWrap('password')}>
                <span className={`absolute ${isRtl ? 'right-3.5' : 'left-3.5'} ${iconColor} text-sm pointer-events-none`}>🔒</span>
                <input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onFocus={() => setFocused('password')}
                  onBlur={() => setFocused(null)}
                  placeholder="••••••••••"
                  dir="ltr"
                  className={`w-full bg-transparent px-4 py-3 ${isRtl ? 'pe-10 ps-10' : 'ps-10 pe-10'} text-sm focus:outline-none rounded-xl ${inputText}`}
                  aria-required="true"
                  aria-label={isRtl ? 'كلمة المرور' : 'Password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className={`absolute ${isRtl ? 'left-3.5' : 'right-3.5'} ${iconColor} hover:text-primary transition text-sm cursor-pointer`}
                  aria-label={showPass ? (isRtl ? 'إخفاء كلمة المرور' : 'Hide password') : (isRtl ? 'إظهار كلمة المرور' : 'Show password')}
                >
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              aria-disabled={loading}
              aria-label={isRtl ? 'تسجيل الدخول' : 'Sign In'}
              className="w-full py-3 rounded-xl primary-gradient text-zinc-950 font-black text-base hover:opacity-90 active:scale-[0.98] transition-all duration-150 shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer mt-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-zinc-950/40 border-t-zinc-950 rounded-full animate-spin" />
                  <span>{isRtl ? 'جاري التحقق...' : 'Signing in...'}</span>
                </>
              ) : (
                <>
                  <span>{isRtl ? 'تسجيل الدخول' : 'Sign In'}</span>
                  <span className="text-zinc-950/60">{isRtl ? '←' : '→'}</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className={`flex-1 h-px ${dividerCls}`} />
            <span className={`text-[10px] font-bold uppercase tracking-widest ${dividerText}`}>
              {isRtl ? 'للمسؤولين فقط' : 'Admins only'}
            </span>
            <div className={`flex-1 h-px ${dividerCls}`} />
          </div>

          {/* Security note */}
          <div className={`flex items-center gap-2 p-3 rounded-xl border ${noteBg}`}>
            <span className="text-base shrink-0">🛡️</span>
            <p className={`text-[10px] leading-relaxed ${noteText}`}>
              {isRtl
                ? 'هذه المنصة مخصصة للمشرفين المعتمدين فقط. يتم تسجيل جميع العمليات في سجل الرقابة.'
                : 'This platform is restricted to authorized administrators only. All operations are recorded in the audit log.'}
            </p>
          </div>

          {/* Footer */}
          <p className={`text-center text-[10px] mt-6 ${footerText}`}>
            © {new Date().getFullYear()} {isRtl ? 'آفاق العرب الذكية' : 'Smart Arab Horizons'}
          </p>
        </div>
      </div>
    </main>
  );
}
