import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function MobileRegister() {
  const { register, loading } = useAuth()
  const navigate = useNavigate()
  const [step,     setStep]     = useState(1)
  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [phone,    setPhone]    = useState('')
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [err,      setErr]      = useState('')

  async function handleSubmit(e) {
    e.preventDefault(); setErr('')
    if (password !== confirm) { setErr('Passwords do not match.'); return }
    if (password.length < 8)  { setErr('Password must be at least 8 characters.'); return }
    const result = await register({ name, email: email.trim().toLowerCase(), phone: phone||undefined, password, role:'cat_owner' })
    if (result.ok) navigate('/dashboard')
    else setErr(result.error)
  }

  return (
    <div className="min-h-screen flex flex-col justify-center px-6 py-10" style={{ backgroundColor:'#dbe8d8' }}>
      {/* Logo */}
      <div className="flex flex-col items-center mb-6">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 text-3xl"
          style={{ backgroundColor:'#5e4749', boxShadow:'0 4px 16px rgba(94,71,73,0.30)' }}>🐱</div>
        <h1 className="font-display font-black text-3xl text-center" style={{ color:'#3a2c2d' }}>Join the sanctuary</h1>
        <p className="text-sm mt-1 text-center" style={{ color:'#7a5e60', fontFamily:'Plus Jakarta Sans, sans-serif' }}>Create your free account</p>
      </div>

      {/* Step indicators */}
      <div className="flex items-center justify-center gap-2 mb-5">
        {[1,2].map(n=>(
          <div key={n} className="h-1.5 rounded-full transition-all"
            style={{ width:step>=n?48:24, backgroundColor:step>=n?'#5e4749':'#b8ceb5' }} />
        ))}
        <span className="text-xs ml-2" style={{ color:'#7a5e60', fontFamily:'Plus Jakarta Sans, sans-serif' }}>Step {step} of 2</span>
      </div>

      <div className="p-6 rounded-3xl" style={{ backgroundColor:'#ffffff', border:'1px solid #b8ceb5', boxShadow:'0 4px 24px rgba(45,27,14,0.08)' }}>

        {/* Step 1 */}
        {step===1 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-2xl"
              style={{ backgroundColor:'rgba(94,71,73,0.07)', border:'1.5px solid rgba(94,71,73,0.20)' }}>
              <span className="text-3xl">🐱</span>
              <div>
                <p className="font-bold text-sm" style={{ color:'#3a2c2d', fontFamily:'Plus Jakarta Sans, sans-serif' }}>Cat Owner</p>
                <p className="text-xs" style={{ color:'#7a5e60', fontFamily:'Plus Jakarta Sans, sans-serif' }}>Book vets, track health & shop for your cat</p>
              </div>
            </div>
            <div className="px-4 py-3 rounded-xl text-xs" style={{ backgroundColor:'rgba(94,71,73,0.07)', color:'#3a2c2d', fontFamily:'Plus Jakarta Sans, sans-serif' }}>
              🏥 Running a clinic? Register at purrfectcare.pk/hospital/register
            </div>
            <button onClick={()=>setStep(2)}
              className="w-full py-3.5 rounded-xl font-bold text-white text-sm active:scale-95 transition-all"
              style={{ backgroundColor:'#5e4749', fontFamily:'Plus Jakarta Sans, sans-serif' }}>
              Continue 
            </button>
          </div>
        )}

        {/* Step 2 */}
        {step===2 && (
          <form onSubmit={handleSubmit} className="space-y-3">
            <button type="button" onClick={()=>setStep(1)} className="text-sm font-semibold mb-1" style={{ color:'#7a5e60', fontFamily:'Plus Jakarta Sans, sans-serif' }}>Back Back</button>

            {[
              { label:'Full name', val:name, set:setName, type:'text', ph:'Laiba Khan' },
              { label:'Email address', val:email, set:setEmail, type:'email', ph:'you@example.com' },
              { label:'Phone (optional)', val:phone, set:setPhone, type:'tel', ph:'+92 300 0000000' },
              { label:'Password', val:password, set:setPassword, type:'password', ph:'Min. 8 characters' },
              { label:'Confirm password', val:confirm, set:setConfirm, type:'password', ph:'Repeat password' },
            ].map(f=>(
              <div key={f.label}>
                <label className="block text-xs font-semibold mb-1" style={{ color:'#3a2c2d', fontFamily:'Plus Jakarta Sans, sans-serif' }}>{f.label}</label>
                <input type={f.type} required={f.label!=='Phone (optional)'}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{ backgroundColor:'#eef4ec', border:'1.5px solid #b8ceb5', color:'#3a2c2d', fontFamily:'Plus Jakarta Sans, sans-serif' }}
                  placeholder={f.ph} value={f.val} onChange={e=>f.set(e.target.value)} />
              </div>
            ))}

            {err && (
              <div className="px-4 py-3 rounded-xl text-sm font-medium"
                style={{ backgroundColor:'rgba(184,56,56,0.09)', border:'1px solid rgba(184,56,56,0.22)', color:'#7D1F1F', fontFamily:'Plus Jakarta Sans, sans-serif' }}>
                ⚠ {err}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold text-white text-sm disabled:opacity-50 active:scale-95 transition-all"
              style={{ backgroundColor:'#5e4749', boxShadow:'0 4px 16px rgba(94,71,73,0.25)', fontFamily:'Plus Jakarta Sans, sans-serif' }}>
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>
        )}
      </div>

      <p className="text-center text-sm mt-6" style={{ color:'#7a5e60', fontFamily:'Plus Jakarta Sans, sans-serif' }}>
        Already have an account?{' '}
        <Link to="/login" className="font-semibold" style={{ color:'#5e4749' }}>Sign in →</Link>
      </p>
    </div>
  )
}
