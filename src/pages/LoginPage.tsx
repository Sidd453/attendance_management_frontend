import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, Clock, Activity } from 'lucide-react';
import { Input, Button } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/context/AuthContext';

export function LoginPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@srujaninfotech.com');
  const [password, setPassword] = useState('Srujan@2026');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: typeof errors = {};
    if (!email.includes('@')) errs.email = 'Please enter a valid email address';
    if (password.length < 4) errs.password = 'Password must be at least 4 characters';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    try {
      await login(email, password);
      toast('Welcome back! Redirecting to dashboard...', 'success');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white dark:bg-ink-950">
      {/* Left panel */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-ink-950 p-12 lg:flex">
        <div className="absolute inset-0 bg-gradient-to-br from-ink-900 via-ink-950 to-brand-950" />
        <div className="pattern-grid absolute inset-0 opacity-60" />
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="absolute -bottom-20 -left-10 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-white p-2 shadow-lg shadow-black/20">
              <img src="/logo.png" alt="Srujan Infotech" className="h-10 w-10" />
            </div>
            <div>
              <p className="font-display text-xl font-bold text-white">Srujan Infotech</p>
              <p className="-mt-0.5 text-[11px] font-medium uppercase tracking-wider text-white/50">Workforce Platform</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 max-w-md">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-brand-300 backdrop-blur-sm">
            Enterprise HR Suite
          </span>
          <h2 className="font-display mt-4 text-3xl font-bold leading-tight text-white">
            Attendance management,<br />reimagined for modern teams.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-white/60">
            Track time, manage leave, and analyze workforce patterns — all from one elegant dashboard built for global-scale organizations.
          </p>

          <div className="mt-10 space-y-4">
            {[
              { icon: Activity, title: 'Real-time tracking', desc: 'Live check-in monitoring across all departments' },
              { icon: ShieldCheck, title: '99.9% uptime', desc: 'Enterprise-grade reliability and security' },
              { icon: Clock, title: 'Fixed working hours', desc: 'Automated check-in/check-out for the 9:30 AM – 6:30 PM schedule' },
            ].map((f) => (
              <div key={f.title} className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm ring-1 ring-white/10">
                  <f.icon className="h-5 w-5 text-brand-300" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{f.title}</p>
                  <p className="text-xs text-white/50">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 grid grid-cols-3 gap-4 border-t border-white/10 pt-6">
            {[{ v: '10K+', l: 'Employees tracked' }, { v: '40+', l: 'Client organizations' }, { v: '99.9%', l: 'Platform uptime' }].map((s) => (
              <div key={s.l}>
                <p className="font-display text-xl font-bold text-white">{s.v}</p>
                <p className="text-[11px] text-white/45">{s.l}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-6 text-white/40">
          <span className="text-xs">© 2026 Srujan Infotech</span>
          <span className="text-xs">Privacy</span>
          <span className="text-xs">Terms</span>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-20">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <img src="/logo.png" alt="Srujan Infotech" className="h-10 w-10" />
            <div>
              <p className="text-lg font-bold text-ink-900 dark:text-ink-50">Srujan Infotech</p>
              <p className="-mt-0.5 text-[10px] font-medium uppercase tracking-wider text-ink-400">Workforce Platform</p>
            </div>
          </div>

          <h1 className="font-display text-2xl font-bold tracking-tight text-ink-900 dark:text-ink-50">Sign in to your account</h1>
          <p className="mt-1.5 text-sm text-ink-500 dark:text-ink-400">Enter your credentials to access the dashboard</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <Input
              id="email"
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              icon={<Mail className="h-4 w-4" />}
              error={errors.email}
            />
            <div>
              <Input
                id="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                icon={<Lock className="h-4 w-4" />}
                error={errors.password}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="mt-1.5 flex items-center gap-1 text-xs text-ink-400 hover:text-ink-600 dark:hover:text-ink-200"
              >
                {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                {showPassword ? 'Hide password' : 'Show password'}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-ink-600 dark:text-ink-300">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
                />
                Remember me
              </label>
              <button
                type="button"
                onClick={() => toast('Password reset isn\'t available in this demo — contact your admin', 'info')}
                className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
              >
                Forgot password?
              </button>
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Signing in...
                </span>
              ) : (
                <>
                  Sign In <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <div className="my-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-ink-100 dark:bg-ink-800" />
            <span className="text-xs text-ink-400">or continue with</span>
            <div className="h-px flex-1 bg-ink-100 dark:bg-ink-800" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => toast('Google sign-in is not configured in this demo', 'info')}
              className="flex h-11 items-center justify-center gap-2 rounded-xl border border-ink-200 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-50 dark:border-ink-700 dark:text-ink-200 dark:hover:bg-ink-800"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Google
            </button>
            <button
              onClick={() => toast('Microsoft sign-in is not configured in this demo', 'info')}
              className="flex h-11 items-center justify-center gap-2 rounded-xl border border-ink-200 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-50 dark:border-ink-700 dark:text-ink-200 dark:hover:bg-ink-800"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24"><path fill="#F25022" d="M1 1h10v10H1z"/><path fill="#7FBA00" d="M13 1h10v10H13z"/><path fill="#00A4EF" d="M1 13h10v10H1z"/><path fill="#FFB900" d="M13 13h10v10H13z"/></svg>
              Microsoft
            </button>
          </div>

          <p className="mt-8 text-center text-xs text-ink-400">
            Don't have an account? <button onClick={() => toast('New accounts are created by your HR admin', 'info')} className="font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">Request access</button>
          </p>
        </div>
      </div>
    </div>
  );
}
