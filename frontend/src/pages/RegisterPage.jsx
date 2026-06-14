import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

/* Only publicly self-registerable roles.
   Vets must be registered by a Hospital Admin → /hospital/register.
   Store Owners must apply and be verified → /store/register.
   Hospital Admins and System Admins are provisioned separately.  */
const ROLES = [
  { value: 'cat_owner', label: '🐱 Cat Owner', desc: 'Book vets, track health & shop for your cat' },
]

export default function RegisterPage() {
  const { register, loading } = useAuth()
  const navigate = useNavigate()

  const [step,     setStep]     = useState(1)   // 1 = role, 2 = details
  const [role,     setRole]     = useState('')
  const [fullName, setFullName] = useState('')
  const [email,    setEmail]    = useState('')
  const [phone,    setPhone]    = useState('')
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [err,      setErr]      = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setErr('')
    if (password !== confirm) { setErr('Passwords do not match.'); return }
    if (password.length < 8)  { setErr('Password must be at least 8 characters.'); return }

    const result = await register({
      name: fullName,
      email,
      phone: phone || undefined,
      password,
      role,
    })
    if (result.ok) navigate('/dashboard')
    else           setErr(result.error)
  }

  const inputCls = "w-full px-4 py-3 rounded-xl text-[14px] text-espresso outline-none transition-all"
  const inputStyle = { background: 'rgba(255,255,255,.8)', border: '1.5px solid #b8ceb5' }
  const focusIn  = e => { e.target.style.borderColor = '#5e4749'; e.target.style.boxShadow = '0 0 0 3px rgba(85,107,47,.12)' }
  const focusOut = e => { e.target.style.borderColor = '#b8ceb5'; e.target.style.boxShadow = 'none' }

  return (
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg,#dbe8d8 0%,#EFE5DC 100%)' }}>

      {/* ── Left branding ────────────────────────────── */}
      <div
        className="hidden lg:flex flex-col justify-between w-[44%] p-14 relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg,#4a373a 0%,#5e4749 60%,#7a5e60 100%)' }}
      >
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full pointer-events-none"
             style={{ background: 'rgba(255,255,255,.08)', transform: 'translate(30%,-30%)' }} />

        <Link to="/" className="flex items-center gap-3 no-underline">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
               style={{ background: 'rgba(255,255,255,.18)' }}>🐱</div>
          <span className="font-display font-black text-xl tracking-tight text-cream">
            Purrfect<span style={{ color: '#A8D060' }}>Care</span>
          </span>
        </Link>

        <div>
          <div className="text-[2.6rem] font-display font-black text-cream leading-[1.1] tracking-tight mb-6">
            Join the feline<br />
            <span style={{ color: '#A8D060' }}>sanctuary.</span>
          </div>
          <div className="flex flex-col gap-4 mt-8">
            {['Free to join — no credit card needed', 'Book vets instantly, 24/7', 'AI health companion included'].map(f => (
              <div key={f} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[12px] flex-shrink-0"
                     style={{ background: 'rgba(255,255,255,.18)' }}>✓</div>
                <span className="text-cream/80 text-[14px]">{f}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-cream/50 text-[12px]">© 2024 Purrfect Care · Built with 🐾</p>
      </div>

      {/* ── Right: form ──────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">

        {/* Mobile logo */}
        <Link to="/" className="flex items-center gap-2 no-underline mb-8 lg:hidden">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
               style={{ background: 'linear-gradient(135deg,#5e4749,#4a373a)' }}>🐱</div>
          <span className="font-display font-black text-lg text-espresso">
            Purrfect<span className="text-olive">Care</span>
          </span>
        </Link>

        <div className="w-full max-w-sm">

          {/* Progress dots */}
          <div className="flex items-center gap-2 mb-6">
            {[1,2].map(n => (
              <div key={n} className="h-1.5 rounded-full transition-all duration-300"
                   style={{ width: step >= n ? 48 : 24, background: step >= n ? '#5e4749' : '#b8ceb5' }} />
            ))}
            <span className="text-[11px] text-clay-muted font-mono ml-2">Step {step} of 2</span>
          </div>

          {/* ── Step 1: Role ── */}
          {step === 1 && (
            <>
              <h1 className="font-display font-black text-[1.8rem] text-espresso tracking-tight mb-1">Create account</h1>
              <p className="text-clay-muted text-[14px] mb-6">I am joining as a…</p>

              <div className="flex flex-col gap-3 mb-4">
                {ROLES.map(r => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRole(r.value)}
                    className="text-left px-5 py-4 rounded-2xl transition-all duration-200"
                    style={{
                      background:   role === r.value ? 'rgba(85,107,47,.08)' : 'rgba(255,255,255,.7)',
                      border:       role === r.value ? '2px solid #5e4749'   : '1.5px solid #b8ceb5',
                    }}
                  >
                    <div className="font-bold text-[14px] text-espresso mb-0.5">{r.label}</div>
                    <div className="text-[12px] text-clay-muted">{r.desc}</div>
                  </button>
                ))}
              </div>

              {/* Hospital / Store / Vet info banners */}
              <div className="rounded-2xl p-4 mb-5 flex flex-col gap-2"
                   style={{ background: 'rgba(94,71,73,.07)', border: '1px solid rgba(94,71,73,.2)' }}>

                {/* Hospital */}
                <div className="flex items-start gap-2.5">
                  <span className="text-base mt-0.5 flex-shrink-0">🏥</span>
                  <div>
                    <div className="text-[13px] font-semibold text-espresso mb-0.5">Running a veterinary clinic?</div>
                    <div className="text-[12px] text-clay-muted mb-1.5">Register your hospital and onboard your team of vets.</div>
                    <Link to="/hospital/register"
                          className="text-[12px] font-bold text-olive no-underline hover:underline">
                      Register your hospital →
                    </Link>
                  </div>
                </div>

                <div className="h-px mx-1" style={{ background: 'rgba(94,71,73,.15)' }} />

                {/* Store */}
                <div className="flex items-start gap-2.5">
                  <span className="text-base mt-0.5 flex-shrink-0">🏪</span>
                  <div>
                    <div className="text-[13px] font-semibold text-espresso mb-0.5">Selling cat products?</div>
                    <div className="text-[12px] text-clay-muted mb-1.5">Apply to list your store — all stores are verified before going live.</div>
                    <Link to="/store/register"
                          className="text-[12px] font-bold text-olive no-underline hover:underline">
                      Apply for a store →
                    </Link>
                  </div>
                </div>

                <div className="h-px mx-1" style={{ background: 'rgba(94,71,73,.15)' }} />

                {/* Vet */}
                <div className="flex items-start gap-2.5">
                  <span className="text-base mt-0.5 flex-shrink-0">👩‍⚕️</span>
                  <div className="text-[12px] text-clay-muted">
                    <strong className="text-espresso">Are you a vet?</strong> Vets join through their
                    hospital — ask your Hospital Admin to register you on the platform.
                  </div>
                </div>
              </div>

              <button
                id="register-next"
                type="button"
                disabled={!role}
                onClick={() => setStep(2)}
                className="btn btn-olive justify-center py-3 w-full"
                style={{ fontSize: 12, opacity: role ? 1 : 0.5 }}
              >
                Continue →
              </button>
            </>
          )}

          {/* ── Step 2: Details ── */}
          {step === 2 && (
            <form onSubmit={handleSubmit}>
              <div className="flex items-center gap-2 mb-6">
                <button type="button" onClick={() => setStep(1)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-clay-muted transition-colors"
                        style={{ background: '#b8ceb5' }}>←</button>
                <h1 className="font-display font-black text-[1.6rem] text-espresso tracking-tight">Your details</h1>
              </div>

              <div className="flex flex-col gap-4">
                <div>
                  <label className="t-mono text-[10px] text-espresso-soft block mb-1.5">Full name</label>
                  <input id="reg-name" type="text" required value={fullName} onChange={e => setFullName(e.target.value)}
                         placeholder="Laiba Khan" className={inputCls} style={inputStyle}
                         onFocus={focusIn} onBlur={focusOut} />
                </div>
                <div>
                  <label className="t-mono text-[10px] text-espresso-soft block mb-1.5">Email address</label>
                  <input id="reg-email" type="email" required value={email} onChange={e => setEmail(e.target.value)}
                         placeholder="you@example.com" className={inputCls} style={inputStyle}
                         onFocus={focusIn} onBlur={focusOut} />
                </div>
                <div>
                  <label className="t-mono text-[10px] text-espresso-soft block mb-1.5">Phone (optional)</label>
                  <input id="reg-phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                         placeholder="+92 300 0000000" className={inputCls} style={inputStyle}
                         onFocus={focusIn} onBlur={focusOut} />
                </div>
                <div>
                  <label className="t-mono text-[10px] text-espresso-soft block mb-1.5">Password</label>
                  <input id="reg-password" type="password" required value={password} onChange={e => setPassword(e.target.value)}
                         placeholder="Min. 8 characters" className={inputCls} style={inputStyle}
                         onFocus={focusIn} onBlur={focusOut} />
                </div>
                <div>
                  <label className="t-mono text-[10px] text-espresso-soft block mb-1.5">Confirm password</label>
                  <input id="reg-confirm" type="password" required value={confirm} onChange={e => setConfirm(e.target.value)}
                         placeholder="Repeat password" className={inputCls} style={inputStyle}
                         onFocus={focusIn} onBlur={focusOut} />
                </div>

                {err && (
                  <div className="px-4 py-3 rounded-xl text-[13px]"
                       style={{ background: 'rgba(196,56,56,.08)', border: '1px solid rgba(196,56,56,.2)', color: '#9B2020' }}>
                    ⚠️ {err}
                  </div>
                )}

                <button id="register-submit" type="submit" disabled={loading}
                        className="btn btn-olive justify-center py-3 mt-1 w-full" style={{ fontSize: 12 }}>
                  {loading ? '⏳ Creating account…' : '🐾 Create Account'}
                </button>
              </div>
            </form>
          )}

          {/* Sign in link */}
          <p className="text-center text-[13px] text-clay-muted mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-olive font-semibold no-underline hover:underline">Sign in →</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
