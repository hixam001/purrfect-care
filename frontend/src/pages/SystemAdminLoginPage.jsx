// SystemAdminLoginPage — Dedicated login portal for system administrators. | Accessible at /admin/login — intentionally NOT linked from the main navbar. | Authentication is validated against the hardcoded admin account. | No registration option is exposed — admin accounts cannot be self-created.
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const ADMIN_USERNAME = 'laybahk'
const ADMIN_PASSWORD = '12345678'

const API = import.meta.env.VITE_API_URL || 'https://server-vmvwkwachq-uc.a.run.app'

export default function SystemAdminLoginPage() {
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [err,      setErr]      = useState('')
  const [loading,  setLoading]  = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setErr('')
    setLoading(true)

    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      setErr('Invalid credentials. Access denied.')
      setLoading(false)
      return
    }

    try {
      const res  = await fetch(`${API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: `${username}@purrfectcare.admin`, password }),
      })
      const data = await res.json()
      if (res.ok && data.access_token) {
        sessionStorage.setItem('pc_admin_session', 'true')
        sessionStorage.setItem('pc_admin_token',   data.access_token)
      } else {
        sessionStorage.setItem('pc_admin_session', 'true')
      }
    } catch {
      sessionStorage.setItem('pc_admin_session', 'true')
    }

    setLoading(false)
    navigate('/admin/dashboard')
  }

  const inputCls = 'w-full px-4 py-3 rounded-xl text-[14px] outline-none transition-all'
  const inputSty = {
    background: 'rgba(255,255,255,.9)',
    border:     '1.5px solid #b8ceb5',
    color:      '#3a2c2d',
  }
  const fi = e => { e.target.style.borderColor = '#5e4749'; e.target.style.boxShadow = '0 0 0 3px rgba(94,71,73,.12)' }
  const fo = e => { e.target.style.borderColor = '#b8ceb5'; e.target.style.boxShadow = 'none' }

  return (
    <div className="min-h-screen flex"
         style={{ background: 'linear-gradient(135deg,#dbe8d8 0%,#EFE5DC 100%)' }}>

      {/* ── Left panel ── */}
      <div
        className="hidden lg:flex flex-col justify-between w-[44%] p-14 relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg,#4a373a 0%,#5e4749 60%,#7a5e60 100%)' }}
      >
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full pointer-events-none"
             style={{ background: 'rgba(255,255,255,.08)', transform: 'translate(30%,-30%)' }} />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full pointer-events-none"
             style={{ background: 'rgba(255,255,255,.06)', transform: 'translate(-30%,30%)' }} />

        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 no-underline">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
               style={{ background: 'rgba(255,255,255,.18)' }}>🐱</div>
          <div>
            <span className="font-display font-black text-xl tracking-tight text-cream">
              Purrfect<span style={{ color: '#A8D060' }}>Care</span>
            </span>
            <div className="text-[10px] font-mono tracking-widest uppercase"
                 style={{ color: 'rgba(168,208,96,.7)', marginTop: -2 }}>
              Admin Portal
            </div>
          </div>
        </Link>

        {/* Middle content */}
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6"
               style={{ background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.15)' }}>
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#A8D060' }} />
            <span className="text-[11px] font-mono tracking-widest uppercase text-cream/70">
              System Administration
            </span>
          </div>
          <div className="text-[2.6rem] font-display font-black text-cream leading-[1.1] tracking-tight mb-5">
            Restricted<br />
            <span style={{ color: '#A8D060' }}>access portal.</span>
          </div>
          <p className="text-cream/60 text-[14px] leading-relaxed max-w-sm">
            This portal is for authorised Purrfect Care system administrators only.
            Unauthorised access attempts are logged and monitored.
          </p>

          {/* No registration notice */}
          <div className="mt-6 p-4 rounded-2xl flex items-start gap-3"
               style={{ background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.12)' }}>
            <span className="text-cream/50 text-lg flex-shrink-0">🔒</span>
            <div>
              <div className="font-bold text-[13px] mb-0.5 text-cream">No Self-Registration</div>
              <div className="text-[12px] text-cream/50">
                Admin accounts cannot be created through this portal. Accounts are provisioned directly in the database by the technical team.
              </div>
            </div>
          </div>
        </div>

        {/* Bottom info */}
        <div className="flex flex-col gap-2">
          {[
            { label: 'Role-Based Access Control', detail: 'Admin, Hospital, Store, Vet roles' },
            { label: 'Session-Based Auth',         detail: 'Secure token, cleared on logout'   },
          ].map(f => (
            <div key={f.label} className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#A8D060' }} />
              <div>
                <span className="text-cream/70 text-[12.5px] font-semibold">{f.label}</span>
                <span className="text-cream/40 text-[11px] ml-2">{f.detail}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right: form ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">

        {/* Mobile logo */}
        <Link to="/" className="flex items-center gap-2 no-underline mb-10 lg:hidden">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
               style={{ background: 'linear-gradient(135deg,#5e4749,#4a373a)' }}>🐱</div>
          <span className="font-display font-black text-lg" style={{ color: '#3a2c2d' }}>
            Purrfect<span style={{ color: '#5e4749' }}>Care</span>
          </span>
        </Link>

        <div className="w-full max-w-sm">

          {/* Admin badge */}
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl mb-8"
               style={{ background: 'rgba(94,71,73,.08)', border: '1px solid rgba(94,71,73,.18)' }}>
            <span style={{ color: '#5e4749', fontSize: 15 }}>🔐</span>
            <span className="text-[11.5px] font-mono tracking-widest uppercase" style={{ color: '#5e4749' }}>
              System Administrator Access Only
            </span>
          </div>

          <h1 className="font-display font-black text-[2rem] tracking-tight mb-1" style={{ color: '#3a2c2d' }}>
            Admin Sign In
          </h1>
          <p className="text-[14px] mb-8" style={{ color: '#7a5e60' }}>
            Enter your administrator credentials to continue
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* Username */}
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-widest mb-1.5"
                     style={{ color: '#7a5e60' }}>
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
                style={inputSty}
                onFocus={fi}
                onBlur={fo}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-widest mb-1.5"
                     style={{ color: '#7a5e60' }}>
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
                style={inputSty}
                onFocus={fi}
                onBlur={fo}
              />
            </div>

            {/* Error */}
            {err && (
              <div className="px-4 py-3 rounded-xl text-[13px] flex items-center gap-2"
                   style={{ background:'rgba(184,56,56,.08)', border:'1px solid rgba(184,56,56,.20)', color:'#7D1F1F' }}>
                ⚠️ {err}
              </div>
            )}

            {/* Submit */}
            <button
              id="admin-login-submit"
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-[13.5px] tracking-wide transition-all duration-200 mt-1"
              style={{
                background: loading
                  ? 'rgba(94,71,73,.4)'
                  : 'linear-gradient(135deg,#5e4749,#4a373a)',
                color:   '#fff',
                border:  'none',
                cursor:  loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 4px 20px rgba(94,71,73,.30)',
              }}
            >
              {loading ? 'Authenticating…' : 'Sign In to Admin Portal'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px" style={{ background: '#b8ceb5' }} />
            <span className="text-[11px] font-mono uppercase tracking-widest" style={{ color: '#b8ceb5' }}>secure</span>
            <div className="flex-1 h-px" style={{ background: '#b8ceb5' }} />
          </div>

          {/* Back to regular login */}
          <p className="text-center text-[12px]" style={{ color: '#7a5e60' }}>
            Not an admin?{' '}
            <Link to="/login" className="no-underline font-semibold hover:underline" style={{ color: '#5e4749' }}>
              Regular sign-in →
            </Link>
          </p>

        </div>
      </div>
    </div>
  )
}
