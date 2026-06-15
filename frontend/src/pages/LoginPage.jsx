import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

/* Redirect destination per role after login.
 * Subscription state is checked separately — the guard in App.jsx will
 * bounce hospital_admin; login page handles store_owner redirect itself. */
function dashboardForRole(role) {
  if (role === 'admin')          return '/admin/dashboard'
  if (role === 'hospital_admin') return '/hospital/dashboard'
  if (role === 'store_owner')    return '/store/dashboard'
  if (role === 'vet')            return '/vet-dashboard'
  return '/dashboard'
}

export default function LoginPage() {
  const { login, loading, isSubscribed } = useAuth()
  const navigate = useNavigate()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [err,      setErr]      = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setErr('')
    const result = await login(email, password)
    if (result.ok) {
      const role = result.user?.role ?? null
      // Store owners and hospital admins without an active subscription
      // are redirected to plan selection before accessing their dashboards.
      const needsSubscription =
        (role === 'store_owner' || role === 'hospital_admin') && !isSubscribed
      navigate(needsSubscription ? '/subscription' : dashboardForRole(role))
    } else {
      setErr(result.error)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg,#dbe8d8 0%,#EFE5DC 100%)' }}>

      {/* ── Left panel ───────────────────────────────── */}
      <div
        className="hidden lg:flex flex-col justify-between w-[44%] p-14 relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg,#4a373a 0%,#5e4749 60%,#7a5e60 100%)' }}
      >
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-10 pointer-events-none"
             style={{ background: 'rgba(255,255,255,.15)', transform: 'translate(30%,-30%)' }} />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-10 pointer-events-none"
             style={{ background: 'rgba(255,255,255,.1)', transform: 'translate(-30%,30%)' }} />

        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 no-underline">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
               style={{ background: 'rgba(255,255,255,.18)' }}>🐱</div>
          <span className="font-display font-black text-xl tracking-tight text-cream">
            Purrfect<span style={{ color: '#A8D060' }}>Care</span>
          </span>
        </Link>

        {/* Middle content */}
        <div>
          <div className="text-[2.8rem] font-display font-black text-cream leading-[1.1] tracking-tight mb-6">
            Your cat's health,<br />
            <span style={{ color: '#A8D060' }}>finally</span> simplified.
          </div>
          <p className="text-cream/70 text-[15px] leading-relaxed max-w-sm">
            Book vet appointments, track your cat's health records, and get AI-powered care guidance — all in one place.
          </p>
        </div>

        {/* Feature list */}
        <div className="flex flex-col gap-3">
          {[
            { icon: '🏥', label: 'Find & book verified veterinarians' },
            { icon: '🤖', label: 'AI health companion for your cat' },
            { icon: '🛍️', label: 'Curated cat care store' },
          ].map(f => (
            <div key={f.label} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                   style={{ background: 'rgba(255,255,255,.12)' }}>{f.icon}</div>
              <span className="text-cream/70 text-[13.5px]">{f.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right: form ──────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">

        {/* Mobile logo */}
        <Link to="/" className="flex items-center gap-2 no-underline mb-10 lg:hidden">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
               style={{ background: 'linear-gradient(135deg,#5e4749,#4a373a)' }}>🐱</div>
          <span className="font-display font-black text-lg text-espresso">
            Purrfect<span className="text-olive">Care</span>
          </span>
        </Link>

        <div className="w-full max-w-sm">
          <h1 className="font-display font-black text-[2rem] text-espresso tracking-tight mb-1">Welcome back</h1>
          <p className="text-clay-muted text-[14px] mb-8">Sign in to your account to continue</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Email */}
            <div>
              <label className="t-mono text-[10px] text-espresso-soft block mb-1.5">Email address</label>
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl text-[14px] text-espresso outline-none transition-all"
                style={{
                  background: 'rgba(255,255,255,.8)',
                  border: '1.5px solid #b8ceb5',
                }}
                onFocus={e => { e.target.style.borderColor = '#5e4749'; e.target.style.boxShadow = '0 0 0 3px rgba(85,107,47,.12)' }}
                onBlur={e  => { e.target.style.borderColor = '#b8ceb5'; e.target.style.boxShadow = 'none' }}
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="t-mono text-[10px] text-espresso-soft">Password</label>
                <Link to="/forgot-password" className="text-[12px] text-olive no-underline hover:underline">
                  Forgot password?
                </Link>
              </div>
              <input
                id="login-password"
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl text-[14px] text-espresso outline-none transition-all"
                style={{ background: 'rgba(255,255,255,.8)', border: '1.5px solid #b8ceb5' }}
                onFocus={e => { e.target.style.borderColor = '#5e4749'; e.target.style.boxShadow = '0 0 0 3px rgba(85,107,47,.12)' }}
                onBlur={e  => { e.target.style.borderColor = '#b8ceb5'; e.target.style.boxShadow = 'none' }}
              />
            </div>

            {/* Error */}
            {err && (
              <div className="px-4 py-3 rounded-xl text-[13px]"
                   style={{ background: 'rgba(196,56,56,.08)', border: '1px solid rgba(196,56,56,.2)', color: '#9B2020' }}>
                ⚠️ {err}
              </div>
            )}

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="btn btn-olive justify-center py-3 mt-1 w-full"
              style={{ fontSize: 12 }}
            >
              {loading ? '⏳ Signing in…' : '🐾 Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px" style={{ background: '#b8ceb5' }} />
            <span className="text-[11px] text-clay-muted font-mono uppercase tracking-widest">or</span>
            <div className="flex-1 h-px" style={{ background: '#b8ceb5' }} />
          </div>

          {/* Register link */}
          <p className="text-center text-[13px] text-clay-muted">
            Don't have an account?{' '}
            <Link to="/register" className="text-olive font-semibold no-underline hover:underline">
              Create one free →
            </Link>
          </p>

          {/* Hospital / Store admin registration links */}
          <p className="text-center text-[12px] text-clay-muted mt-3">
            Registering a hospital?{' '}
            <Link to="/hospital/register" className="text-olive no-underline hover:underline font-semibold">
              Hospital registration →
            </Link>
          </p>
          <p className="text-center text-[12px] text-clay-muted mt-1">
            Registering a store?{' '}
            <Link to="/store/register" className="text-olive no-underline hover:underline font-semibold">
              Store registration →
            </Link>
          </p>

          {/* System admin portal — discreet */}
          <div className="mt-8 pt-5 flex justify-center" style={{ borderTop: '1px solid #E8DDD6' }}>
            <Link
              to="/admin/login"
              className="text-[11px] font-mono no-underline hover:underline"
              style={{ color: 'rgba(100,100,120,.4)' }}
            >
              ⚙️ System Admin Portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
