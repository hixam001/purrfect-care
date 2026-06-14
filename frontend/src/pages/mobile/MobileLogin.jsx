import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function MobileLogin() {
  const { login, loading } = useAuth()
  const navigate = useNavigate()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [err,      setErr]      = useState('')

  async function handleSubmit(e) {
    e.preventDefault(); setErr('')
    if (!email || !password) { setErr('Please fill in all fields.'); return }
    const result = await login(email.trim().toLowerCase(), password)
    if (result.ok) navigate('/dashboard')
    else setErr(result.error)
  }

  return (
    <div className="min-h-screen flex flex-col justify-center px-6 py-10" style={{ backgroundColor:'#dbe8d8' }}>
      {/* Logo */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 text-3xl"
          style={{ backgroundColor:'#5e4749', boxShadow:'0 4px 16px rgba(94,71,73,0.30)' }}>🐱</div>
        <h1 className="font-display font-black text-3xl text-center" style={{ color:'#3a2c2d' }}>Welcome back</h1>
        <p className="text-sm mt-1 text-center" style={{ color:'#7a5e60', fontFamily:'Plus Jakarta Sans, sans-serif' }}>Sign in to your Purrfect Care account</p>
      </div>

      {/* Card */}
      <form onSubmit={handleSubmit} className="space-y-4 p-6 rounded-3xl"
        style={{ backgroundColor:'#ffffff', border:'1px solid #b8ceb5', boxShadow:'0 4px 24px rgba(45,27,14,0.08)' }}>

        <div>
          <label className="block text-xs font-semibold mb-1" style={{ color:'#3a2c2d', fontFamily:'Plus Jakarta Sans, sans-serif' }}>Email address</label>
          <input type="email" autoComplete="email" required
            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={{ backgroundColor:'#eef4ec', border:'1.5px solid #b8ceb5', color:'#3a2c2d', fontFamily:'Plus Jakarta Sans, sans-serif' }}
            placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} />
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1" style={{ color:'#3a2c2d', fontFamily:'Plus Jakarta Sans, sans-serif' }}>Password</label>
          <input type="password" autoComplete="current-password" required
            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={{ backgroundColor:'#eef4ec', border:'1.5px solid #b8ceb5', color:'#3a2c2d', fontFamily:'Plus Jakarta Sans, sans-serif' }}
            placeholder="Your password" value={password} onChange={e=>setPassword(e.target.value)} />
        </div>

        {err && (
          <div className="px-4 py-3 rounded-xl text-sm font-medium"
            style={{ backgroundColor:'rgba(184,56,56,0.09)', border:'1px solid rgba(184,56,56,0.22)', color:'#7D1F1F', fontFamily:'Plus Jakarta Sans, sans-serif' }}>
            ⚠ {err}
          </div>
        )}

        <button type="submit" disabled={loading}
          className="w-full py-3.5 rounded-xl font-bold text-white text-sm disabled:opacity-50 transition-all active:scale-95"
          style={{ backgroundColor:'#5e4749', boxShadow:'0 4px 16px rgba(94,71,73,0.25)', fontFamily:'Plus Jakarta Sans, sans-serif' }}>
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>

      <p className="text-center text-sm mt-6" style={{ color:'#7a5e60', fontFamily:'Plus Jakarta Sans, sans-serif' }}>
        Don't have an account?{' '}
        <Link to="/register" className="font-semibold" style={{ color:'#5e4749' }}>Create one →</Link>
      </p>
    </div>
  )
}
