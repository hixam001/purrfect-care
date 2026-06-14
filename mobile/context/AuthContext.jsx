import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, API_URL } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,      setUser]      = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  /* Restore session on app start */
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        _fetchProfile(session)
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session) {
          _fetchProfile(session)
        } else {
          setUser(null)
          setIsLoggedIn(false)
          setLoading(false)
        }
      }
    )
    return () => subscription.unsubscribe()
  }, [])

  async function _fetchProfile(session) {
    try {
      const res = await fetch(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (res.ok) {
        const profile = await res.json()
        setUser({ ...profile, email: session.user.email })
        setIsLoggedIn(true)
      }
    } catch (e) {
      console.warn('Profile fetch failed:', e)
    } finally {
      setLoading(false)
    }
  }

  async function login({ email, password }) {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) return { ok: false, error: data.detail ?? 'Login failed' }

      await supabase.auth.setSession({
        access_token:  data.access_token,
        refresh_token: data.refresh_token,
      })
      setUser({ ...data.user, email })
      setIsLoggedIn(true)
      return { ok: true }
    } catch (e) {
      return { ok: false, error: 'Network error' }
    } finally {
      setLoading(false)
    }
  }

  async function register({ name, email, phone, password, role = 'cat_owner' }) {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name, email, phone, password, role }),
      })
      const data = await res.json()
      if (!res.ok) return { ok: false, error: data.detail ?? 'Registration failed' }

      await supabase.auth.setSession({
        access_token:  data.access_token,
        refresh_token: data.refresh_token ?? '',
      })
      setUser({ ...data.user, email })
      setIsLoggedIn(true)
      return { ok: true }
    } catch (e) {
      return { ok: false, error: 'Network error' }
    } finally {
      setLoading(false)
    }
  }

  async function logout() {
    await supabase.auth.signOut()
    setUser(null)
    setIsLoggedIn(false)
  }

  return (
    <AuthContext.Provider value={{ user, loading, isLoggedIn, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
