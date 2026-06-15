/**
 * AuthContext — manages auth state (token, user, subscription) across the app.
 * Provides login / logout helpers and exposes the current user + subscription.
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient.js'

const AuthContext = createContext(null)

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export function AuthProvider({ children }) {
  const [user,         setUser]         = useState(null)
  const [token,        setToken]        = useState(() => localStorage.getItem('pc_token') ?? null)
  const [subscription, setSubscription] = useState(null)   // { subscription, plan } or null
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState(null)

  /* ── Fetch subscription for authenticated user ─────────────────── */
  const fetchSubscription = useCallback(async (jwt) => {
    if (!jwt) { setSubscription(null); return }
    try {
      const res  = await fetch(`${API}/api/subscriptions/me`, {
        headers: { Authorization: `Bearer ${jwt}` },
      })
      const data = await res.json()
      setSubscription(data?.subscription ? data : null)
    } catch {
      setSubscription(null)
    }
  }, [])

  /* ── Restore session on mount ─────────────────────── */
  useEffect(() => {
    const stored = localStorage.getItem('pc_token')
    if (!stored) { setLoading(false); return }

    fetch(`${API}/api/auth/me`, {
      headers: { Authorization: `Bearer ${stored}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(async profile => {
        if (profile) {
          setUser(profile)
          await fetchSubscription(stored)
        } else {
          localStorage.removeItem('pc_token')
          setToken(null)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))

    const sb_access  = localStorage.getItem('pc_sb_access')
    const sb_refresh = localStorage.getItem('pc_sb_refresh')
    if (sb_access && sb_refresh) {
      supabase.auth.setSession({ access_token: sb_access, refresh_token: sb_refresh })
        .catch(() => {})
    }
  }, [fetchSubscription])

  /* ── Persist backend token ──────────────────────────── */
  useEffect(() => {
    if (token) localStorage.setItem('pc_token', token)
    else       localStorage.removeItem('pc_token')
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
      if (data.access_token && data.refresh_token) {
        await supabase.auth.setSession({
          access_token:  data.access_token,
          refresh_token: data.refresh_token,
        })
        localStorage.setItem('pc_sb_access',  data.access_token)
        localStorage.setItem('pc_sb_refresh', data.refresh_token)
      }
      // Fetch subscription after login
      await fetchSubscription(data.access_token)
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
      if (data.access_token && data.refresh_token) {
        await supabase.auth.setSession({
          access_token:  data.access_token,
          refresh_token: data.refresh_token,
        })
        localStorage.setItem('pc_sb_access',  data.access_token)
        localStorage.setItem('pc_sb_refresh', data.refresh_token)
      }
      await fetchSubscription(data.access_token)
      return { ok: true }
    } catch (e) {
      setError(e.message)
      return { ok: false, error: e.message }
    } finally {
      setLoading(false)
    }
  }

  /* ── Logout ──────────────────────────────────────── */
  async function logout() {
    if (token) {
      fetch(`${API}/api/auth/logout`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {})
    }
    await supabase.auth.signOut()
    localStorage.removeItem('pc_sb_access')
    localStorage.removeItem('pc_sb_refresh')
    setToken(null)
    setUser(null)
    setSubscription(null)
  }

  /* ── Refresh subscription (call after Safepay return) ─────────── */
  const refreshSubscription = useCallback(async () => {
    const jwt = localStorage.getItem('pc_token')
    await fetchSubscription(jwt)
  }, [fetchSubscription])

  /* ── Computed helpers ─────────────────────────────────────────── */
  const activePlan    = subscription?.plan ?? null
  const isSubscribed  = subscription?.subscription?.status === 'active'
  const planLimits    = {
    maxProducts: activePlan?.max_products ?? null,   // null = unlimited
    maxVets:     activePlan?.max_vets     ?? null,
  }

  return (
    <AuthContext.Provider value={{
      user, token, loading, error,
      subscription, activePlan, isSubscribed, planLimits,
      login, register, logout, refreshSubscription,
      isLoggedIn: !!token,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
