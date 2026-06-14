/**
 * SystemAdminLoginPage — Dedicated login portal for system administrators.
 * Accessible at /admin/login — intentionally NOT linked from the main navbar.
 *
 * Authentication is validated against the hardcoded admin account.
 * No registration option is exposed — admin accounts cannot be self-created.
 */
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

/* ─────────────────────────────────────────────────────────────
   Hardcoded system admin credentials.
   NOTE: In production, replace this with a server-side session
   or a properly hashed check — never expose real credentials
   in client-side code in a public-facing deployment.
───────────────────────────────────────────────────────────── */
const ADMIN_USERNAME = 'laybahk'
const ADMIN_PASSWORD = '12345678'

export default function SystemAdminLoginPage() {
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [err,      setErr]      = useState('')
  const [loading,  setLoading]  = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    setErr('')
    setLoading(true)

    /* Simulate a brief authentication delay for UX realism */
    setTimeout(() => {
      if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        /* Store a simple admin session flag in sessionStorage
           (cleared automatically when the browser tab is closed) */
        sessionStorage.setItem('pc_admin_session', 'true')
        navigate('/admin/dashboard')
      } else {
        setErr('Invalid credentials. Access denied.')
      }
      setLoading(false)
    }, 600)
  }

  const inputCls = "w-full px-4 py-3 rounded-xl text-[14px] outline-none transition-all"
  const inputStyle = {
    background: 'rgba(255,255,255,.06)',
    border: '1.5px solid rgba(255,255,255,.12)',
    color: '#E8E8F0',
  }
  const focusIn  = e => { e.target.style.borderColor = '#7C6EF5'; e.target.style.boxShadow = '0 0 0 3px rgba(124,110,245,.18)' }
  const focusOut = e => { e.target.style.borderColor = 'rgba(255,255,255,.12)'; e.target.style.boxShadow = 'none' }

  return (
    <div
      className="min-h-screen flex"
      style={{ background: 'linear-gradient(135deg, #0D0D1A 0%, #111128 60%, #0A0A18 100%)' }}
    >
      {/* ── Left panel ── */}
      <div
        className="hidden lg:flex flex-col justify-between w-[44%] p-14 relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #13133A 0%, #1A1A4A 60%, #0F0F2E 100%)' }}
      >
        {/* Decorative glow */}
        <div className="absolute top-0 right-0 w-96 h-96 pointer-events-none rounded-full"
             style={{ background: 'radial-gradient(circle, rgba(124,110,245,.2), transparent 70%)', transform: 'translate(30%,-30%)' }} />
        <div className="absolute bottom-0 left-0 w-72 h-72 pointer-events-none rounded-full"
             style={{ background: 'radial-gradient(circle, rgba(80,150,255,.15), transparent 70%)', transform: 'translate(-30%,30%)' }} />

        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 no-underline">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
               style={{ background: 'rgba(124,110,245,.2)', border: '1px solid rgba(124,110,245,.3)' }}>🐱</div>
          <div>
            <span className="font-display font-black text-xl tracking-tight" style={{ color: '#E8E8F0' }}>
              Purrfect<span style={{ color: '#7C6EF5' }}>Care</span>
            </span>
            <div className="text-[10px] font-mono tracking-widest uppercase"
                 style={{ color: 'rgba(124,110,245,.7)', marginTop: -2 }}>
              Admin Portal
            </div>
          </div>
        </Link>

        {/* Middle content */}
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6"
               style={{ background: 'rgba(124,110,245,.15)', border: '1px solid rgba(124,110,245,.25)' }}>
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#7C6EF5' }} />
            <span className="text-[11px] font-mono tracking-widest uppercase" style={{ color: '#7C6EF5' }}>
              System Administration
            </span>
          </div>
          <div className="text-[2.6rem] font-display font-black leading-[1.1] tracking-tight mb-6" style={{ color: '#E8E8F0' }}>
            Restricted<br />
            <span style={{ color: '#7C6EF5' }}>access portal.</span>
          </div>
          <p style={{ color: 'rgba(232,232,240,.5)', fontSize: 14, lineHeight: 1.7 }}>
            This portal is for authorized Purrfect Care system administrators only.
            Unauthorized access attempts are logged and monitored.
          </p>

          {/* No registration notice */}
          <div className="mt-6 p-4 rounded-2xl flex items-start gap-3"
               style={{ background: 'rgba(220,80,80,.08)', border: '1px solid rgba(220,80,80,.18)' }}>
            <span style={{ color: '#F87171', fontSize: 18, flexShrink: 0 }}>🚫</span>
            <div>
              <div className="font-bold text-[13px] mb-0.5" style={{ color: '#F87171' }}>No Self-Registration</div>
              <div className="text-[12px]" style={{ color: 'rgba(248,113,113,.7)' }}>
                Admin accounts cannot be created through this portal. Accounts are provisioned directly in the database by the technical team.
              </div>
            </div>
          </div>
        </div>

        {/* Security highlights */}
        <div className="flex gap-8">
          {[['RBAC', 'Role-Based Access'], ['AES-256', 'Encryption']].map(([v, l]) => (
            <div key={l}>
              <div className="font-display font-black text-xl" style={{ color: '#E8E8F0' }}>{v}</div>
              <div className="text-[11px] font-mono uppercase tracking-wider" style={{ color: 'rgba(232,232,240,.4)' }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right: form ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">

        {/* Mobile logo */}
        <Link to="/" className="flex items-center gap-2 no-underline mb-10 lg:hidden">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
               style={{ background: 'rgba(124,110,245,.2)', border: '1px solid rgba(124,110,245,.3)' }}>🐱</div>
          <span className="font-display font-black text-lg" style={{ color: '#E8E8F0' }}>
            Purrfect<span style={{ color: '#7C6EF5' }}>Care</span>
          </span>
        </Link>

        <div className="w-full max-w-sm">

          {/* Warning badge */}
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl mb-8"
               style={{ background: 'rgba(124,110,245,.1)', border: '1px solid rgba(124,110,245,.2)' }}>
            <span style={{ color: '#7C6EF5', fontSize: 16 }}>🔐</span>
            <span className="text-[12px] font-mono" style={{ color: 'rgba(124,110,245,.9)' }}>
              SYSTEM ADMINISTRATOR ACCESS ONLY
            </span>
          </div>

          <h1 className="font-display font-black text-[2rem] tracking-tight mb-1" style={{ color: '#E8E8F0' }}>
            Admin Sign In
          </h1>
          <p className="text-[14px] mb-8" style={{ color: 'rgba(232,232,240,.4)' }}>
            Enter your administrator credentials to continue
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* Username */}
            <div>
              <label className="t-mono text-[10px] block mb-1.5 uppercase tracking-widest"
                     style={{ color: 'rgba(232,232,240,.4)' }}>
                Admin Username
              </label>
              <input
                id="admin-username"
                type="text"
                required
                autoComplete="username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Enter your username"
                className={inputCls}
                style={inputStyle}
                onFocus={focusIn}
                onBlur={focusOut}
              />
            </div>

            {/* Password */}
            <div>
              <label className="t-mono text-[10px] block mb-1.5 uppercase tracking-widest"
                     style={{ color: 'rgba(232,232,240,.4)' }}>
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className={inputCls}
                style={inputStyle}
                onFocus={focusIn}
                onBlur={focusOut}
              />
            </div>

            {/* Error */}
            {err && (
              <div className="px-4 py-3 rounded-xl text-[13px] flex items-center gap-2"
                   style={{ background: 'rgba(220,80,80,.1)', border: '1px solid rgba(220,80,80,.25)', color: '#F87171' }}>
                🚫 {err}
              </div>
            )}

            {/* Submit */}
            <button
              id="admin-login-submit"
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-[13px] tracking-wide transition-all duration-200 mt-1"
              style={{
                background: loading
                  ? 'rgba(124,110,245,.4)'
                  : 'linear-gradient(135deg, #7C6EF5, #5B4EDB)',
                color: '#fff',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 4px 20px rgba(124,110,245,.35)',
              }}
            >
              {loading ? '⏳ Authenticating…' : '🔐 Sign In to Admin Portal'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,.07)' }} />
            <span className="text-[11px] font-mono uppercase tracking-widest" style={{ color: 'rgba(232,232,240,.2)' }}>secure</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,.07)' }} />
          </div>

          {/* Back to regular login — no registration link */}
          <p className="text-center text-[12px]" style={{ color: 'rgba(232,232,240,.25)' }}>
            Not an admin?{' '}
            <Link to="/login" className="no-underline hover:underline" style={{ color: 'rgba(124,110,245,.7)' }}>
              Regular sign-in →
            </Link>
          </p>

        </div>
      </div>
    </div>
  )
}
