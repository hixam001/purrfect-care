/**
 * AuthContext — manages auth state (token, user) across the app.
 * Provides login / logout helpers and exposes the current user.
 */
import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export function AuthProvider({ children }) {
  const [user,  setUser]  = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('pc_token') ?? null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  /* ── Persist token ───────────────────────────────── */
  useEffect(() => {
    if (token) localStorage.setItem('pc_token', token)
    else        localStorage.removeItem('pc_token')
  }, [token])

  /* ── Login ───────────────────────────────────────── */
  async function login(email, password) {
    setLoading(true); setError(null)
    try {
      const res  = await fetch(`${API}/api/auth/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail ?? 'Login failed')
      setToken(data.access_token)
      setUser(data.user)
      return { ok: true, user: data.user }
    } catch (e) {
      setError(e.message)
      return { ok: false, error: e.message }
    } finally {
      setLoading(false)
    }
  }

  /* ── Register ────────────────────────────────────── */
  async function register(payload) {
    setLoading(true); setError(null)
    try {
      const res  = await fetch(`${API}/api/auth/register`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail ?? 'Registration failed')
      setToken(data.access_token)
      setUser(data.user)
      return { ok: true }
    } catch (e) {
      setError(e.message)
      return { ok: false, error: e.message }
    } finally {
      setLoading(false)
    }
  }

  /* ── Logout ──────────────────────────────────────── */
  function logout() {
    if (token) {
      fetch(`${API}/api/auth/logout`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {})
    }
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, error, login, register, logout, isLoggedIn: !!token }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
