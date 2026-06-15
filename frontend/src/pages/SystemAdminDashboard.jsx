// SystemAdminDashboard — Full platform administration panel. | All data is fetched live from the backend. No mock/static data.
import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const API = import.meta.env.VITE_API_URL || 'https://server-vmvwkwachq-uc.a.run.app'

// ── Colour palette ──
const C = {
  bg:          '#dbe8d8',
  surface:     'rgba(255,255,255,.88)',
  border:      '#b8ceb5',
  text:        '#3a2c2d',
  textMuted:   '#7a5e60',
  olive:       '#5e4749',
  oliveBg:     'rgba(94,71,73,.09)',
  oliveBorder: 'rgba(94,71,73,.20)',
  amberBg:     'rgba(184,92,56,.08)',
  amberBorder: 'rgba(184,92,56,.22)',
  amberText:   '#7A4F10',
  dangerBg:    'rgba(184,56,56,.08)',
  dangerBorder:'rgba(184,56,56,.20)',
  dangerText:  '#7D1F1F',
  adminBg:     'rgba(99,102,241,.08)',
  adminBorder: 'rgba(99,102,241,.22)',
  adminText:   '#4338CA',
  greenBg:     'rgba(94,71,73,.07)',
  greenBorder: 'rgba(94,71,73,.18)',
}

const ROLE_META = {
  cat_owner:      { label:'Cat Owner',      bg:'rgba(94,71,73,.10)',   text:'#4a373a',  icon:'🐱' },
  vet:            { label:'Veterinarian',   bg:'rgba(59,130,246,.10)', text:'#1D4ED8',  icon:'👩‍⚕️' },
  hospital_admin: { label:'Hospital Admin', bg:'rgba(184,92,56,.10)',  text:'#8C4229',  icon:'🏥' },
  store_owner:    { label:'Store Owner',    bg:'rgba(124,58,237,.10)', text:'#6D28D9',  icon:'🏪' },
  admin:          { label:'System Admin',   bg:'rgba(99,102,241,.10)', text:'#4338CA',  icon:'⚙️' },
}

function RolePill({ role }) {
  const m = ROLE_META[role] ?? { label: role, bg:'rgba(0,0,0,.05)', text:'#333', icon:'👤' }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-semibold"
          style={{ background: m.bg, color: m.text }}>
      {m.icon} {m.label}
    </span>
  )
}

function StatusPill({ active }) {
  return active
    ? <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11.5px] font-semibold"
            style={{ background:'rgba(94,71,73,.10)', color:'#4a373a', border:'1px solid rgba(94,71,73,.20)' }}>
        ✓ Active
      </span>
    : <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11.5px] font-semibold"
            style={{ background:C.amberBg, color:C.amberText, border:`1px solid ${C.amberBorder}` }}>
        ⏳ Pending
      </span>
}

function StatCard({ icon, label, value, sub, accentBg }) {
  return (
    <div className="rounded-2xl p-5 flex flex-col gap-1"
         style={{ background: C.surface, border: `1px solid ${C.border}` }}>
      <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl mb-3"
           style={{ background: accentBg }}>{icon}</div>
      <div className="font-display font-black text-[1.7rem] leading-none" style={{ color: C.text }}>{value}</div>
      <div className="text-[13px] font-medium mt-1" style={{ color: C.textMuted }}>{label}</div>
      {sub && <div className="text-[11.5px]" style={{ color: C.olive }}>{sub}</div>}
    </div>
  )
}

function Panel({ children, className = '' }) {
  return (
    <div className={`rounded-2xl p-5 ${className}`}
         style={{ background: C.surface, border: `1px solid ${C.border}` }}>
      {children}
    </div>
  )
}

function EmptyState({ icon, title, sub }) {
  return (
    <Panel className="py-16 text-center">
      <div className="text-5xl mb-4">{icon}</div>
      <div className="font-display font-bold text-[1.1rem]" style={{ color: C.text }}>{title}</div>
      {sub && <div className="text-[13.5px] mt-2" style={{ color: C.textMuted }}>{sub}</div>}
    </Panel>
  )
}

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })
}

// ── Shared button styles ──
const btnApprove = {
  background: C.oliveBg, color: C.olive, border: `1px solid ${C.oliveBorder}`,
  padding: '6px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer',
}
const btnReject = {
  background: C.dangerBg, color: C.dangerText, border: `1px solid ${C.dangerBorder}`,
  padding: '6px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer',
}

// ════════════════════════════════════════════════
export default function SystemAdminDashboard() {
  const navigate = useNavigate()

  function getToken() { return sessionStorage.getItem('pc_admin_token') || '' }

  function handleLogout() {
    sessionStorage.removeItem('pc_admin_session')
    sessionStorage.removeItem('pc_admin_token')
    navigate('/admin/login')
  }

  const [tab,          setTab]          = useState('overview')
  const [allUsers,     setAllUsers]     = useState([])
  const [pendingUsers, setPendingUsers] = useState([])
  const [loading,      setLoading]      = useState(true)
  const [docUrls,      setDocUrls]      = useState({})
  const [roleFilter,   setRoleFilter]   = useState('all')
  const [search,       setSearch]       = useState('')
  const [actionMsg,    setActionMsg]    = useState('')

  // ── API helpers ──
  async function apiFetch(path, opts = {}) {
    const res = await fetch(`${API}${path}`, {
      ...opts,
      headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type':'application/json', ...(opts.headers||{}) },
    })
    if (!res.ok) throw new Error(`API ${path} → ${res.status}`)
    return res.json()
  }

  const loadData = useCallback(async () => {
    const token = getToken()
    if (!token) { setLoading(false); return }
    setLoading(true)
    try {
      const [all, pending] = await Promise.all([
        apiFetch('/api/users/admin/all'),
        apiFetch('/api/users/admin/pending'),
      ])
      setAllUsers(all)
      setPendingUsers(pending)
    } catch (e) {
      console.warn('Admin data load error:', e.message)
    } finally {
      setLoading(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadData() }, [loadData])

  async function loadDocUrls(profileId) {
    if (docUrls[profileId]) return
    setDocUrls(d => ({ ...d, [profileId]: 'loading' }))
    try {
      const data = await apiFetch(`/api/users/admin/${profileId}/doc-urls`)
      setDocUrls(d => ({ ...d, [profileId]: data.docs || {} }))
    } catch {
      setDocUrls(d => ({ ...d, [profileId]: 'error' }))
    }
  }

  async function approveUser(profileId) {
    try {
      await apiFetch(`/api/users/admin/${profileId}/approve`, { method: 'PATCH' })
      setPendingUsers(p => p.filter(u => u.id !== profileId))
      setAllUsers(a => a.map(u => u.id === profileId ? { ...u, is_active: true } : u))
      flash('Account approved.')
    } catch { flash('Failed to approve. Try again.', true) }
  }

  async function rejectUser(profileId) {
    try {
      await apiFetch(`/api/users/admin/${profileId}/reject`, { method: 'PATCH' })
      setPendingUsers(p => p.filter(u => u.id !== profileId))
      flash('Account rejected.')
    } catch { flash('Failed to reject. Try again.', true) }
  }

  function flash(msg, isErr = false) {
    setActionMsg({ text: msg, err: isErr })
    setTimeout(() => setActionMsg(''), 4000)
  }

  // ── Derived data ──
  const hospitals    = allUsers.filter(u => u.role === 'hospital_admin')
  const stores       = allUsers.filter(u => u.role === 'store_owner')
  const vets         = allUsers.filter(u => u.role === 'vet')
  const catOwners    = allUsers.filter(u => u.role === 'cat_owner')
  const pendingCount = pendingUsers.length

  const filteredUsers = allUsers.filter(u => {
    const matchRole   = roleFilter === 'all' || u.role === roleFilter
    const matchSearch = !search || u.name?.toLowerCase().includes(search.toLowerCase())
                     || u.email?.toLowerCase().includes(search.toLowerCase())
    return matchRole && matchSearch
  })

  const TABS = [
    { id:'overview',  label:'Overview',                    icon:'📊' },
    { id:'hospitals', label:`Hospitals (${hospitals.length})`,   icon:'🏥' },
    { id:'stores',    label:`Stores (${stores.length})`,         icon:'🏪' },
    { id:'users',     label:`Users (${allUsers.length})`,        icon:'👤' },
    { id:'pending',   label:`Pending (${pendingCount})`,         icon:'⏳' },
  ]

  // ════════ PENDING USER CARD ════════
  function PendingCard({ u }) {
    const urls    = docUrls[u.id]
    const hasNoDocs = typeof urls === 'object' && Object.keys(urls).length === 0
    return (
      <div className="rounded-2xl p-6"
           style={{ background: C.amberBg, border: `1px solid ${C.amberBorder}` }}>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
               style={{ background: 'rgba(184,92,56,.12)' }}>
            {u.role === 'hospital_admin' ? '🏥' : '🏪'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <div className="font-semibold text-[15px]" style={{ color: C.text }}>{u.name}</div>
              <RolePill role={u.role} />
            </div>
            <div className="text-[13.5px] mb-3" style={{ color: C.textMuted }}>
              {u.email} · {u.city || 'No city'} · Registered {fmtDate(u.created_at)}
            </div>

            {!urls && (
              <button onClick={() => loadDocUrls(u.id)}
                      className="text-[12px] font-semibold px-3 py-1.5 rounded-lg"
                      style={{ background: C.oliveBg, color: C.olive, border: `1px solid ${C.oliveBorder}` }}>
                📂 View Documents
              </button>
            )}
            {urls === 'loading' && <div className="text-[12px]" style={{ color: C.textMuted }}>⏳ Loading…</div>}
            {urls === 'error'   && <div className="text-[12px]" style={{ color: '#9B2020' }}>⚠️ Could not load documents.</div>}
            {hasNoDocs          && <div className="text-[12px]" style={{ color: C.textMuted }}>📄 No documents submitted yet.</div>}
            {typeof urls === 'object' && !hasNoDocs && (
              <div className="mt-2 flex flex-col gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: C.textMuted }}>
                  Submitted Documents
                </p>
                {Object.entries(urls).map(([label, url]) => (
                  <a key={label} href={url} target="_blank" rel="noopener noreferrer"
                     className="flex items-center gap-2.5 px-3 py-2 rounded-xl no-underline"
                     style={{ background:'rgba(255,255,255,.7)', border:`1px solid ${C.border}` }}>
                    <span className="text-base">{/\.pdf$/i.test(url) ? '📄' : '🖼️'}</span>
                    <span className="text-[12.5px] font-medium flex-1" style={{ color: C.text }}>{label}</span>
                    <span className="text-[11px]" style={{ color: C.olive }}>Open →</span>
                  </a>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 flex-shrink-0">
            <button onClick={() => approveUser(u.id)} style={{ ...btnApprove, padding:'8px 16px' }}>✓ Approve</button>
            <button onClick={() => rejectUser(u.id)}  style={{ ...btnReject,  padding:'8px 16px' }}>✕ Reject</button>
          </div>
        </div>
      </div>
    )
  }

  // ════════════════════════════════════════════════
  return (
    <div className="min-h-screen" style={{ background: C.bg }}>

      {/* Action banner */}
      {actionMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-lg text-[13px] font-semibold"
             style={{ background: C.surface, border: `1px solid ${actionMsg.err ? C.dangerBorder : C.oliveBorder}`,
                      color: actionMsg.err ? C.dangerText : C.olive }}>
          {actionMsg.text}
        </div>
      )}

      {/* ── Header ── */}
      <header className="sticky top-0 z-40"
              style={{ background:'rgba(219,232,216,.93)', backdropFilter:'blur(18px)',
                       WebkitBackdropFilter:'blur(18px)', borderBottom:`1px solid ${C.border}` }}>
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-6">
          <Link to="/" className="flex items-center gap-2.5 no-underline flex-shrink-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                 style={{ background:'linear-gradient(135deg,#5e4749,#4a373a)' }}>🐱</div>
            <div>
              <span className="font-display font-black text-[17px] tracking-tight" style={{ color: C.text }}>
                Purrfect<span style={{ color: C.olive }}>Care</span>
              </span>
              <span className="text-[11px] font-semibold ml-2.5 px-2 py-0.5 rounded-full"
                    style={{ background: C.adminBg, border:`1px solid ${C.adminBorder}`, color: C.adminText }}>
                Admin
              </span>
            </div>
          </Link>

          {/* Tabs */}
          <nav className="hidden md:flex items-center gap-0.5">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                      className="px-4 py-2 rounded-xl text-[13px] font-medium transition-all"
                      style={{
                        background: tab === t.id ? C.oliveBg   : 'transparent',
                        color:      tab === t.id ? C.olive     : C.textMuted,
                        border:     tab === t.id ? `1px solid ${C.oliveBorder}` : '1px solid transparent',
                      }}>
                {t.icon} {t.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {pendingCount > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                   style={{ background: C.amberBg, border:`1px solid ${C.amberBorder}` }}>
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background:'#B87C2A' }} />
                <span className="text-[12px] font-semibold" style={{ color: C.amberText }}>
                  {pendingCount} pending
                </span>
              </div>
            )}
            <button onClick={handleLogout} className="btn btn-outline !text-[12.5px] !py-2">Log out</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-10">

        {/* Page heading */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-3"
               style={{ background: C.adminBg, border:`1px solid ${C.adminBorder}` }}>
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: C.adminText }} />
            <span className="text-[11.5px] font-semibold" style={{ color: C.adminText }}>System Administration</span>
          </div>
          <h1 className="font-display font-black tracking-tight mb-1"
              style={{ fontSize:'clamp(1.6rem,3vw,2.2rem)', color: C.text }}>
            Platform Dashboard
          </h1>
          <p className="text-[14.5px]" style={{ color: C.textMuted }}>
            Manage hospitals, stores, and all platform accounts.
          </p>
        </div>

        {loading && (
          <Panel className="py-20 text-center">
            <div className="text-4xl mb-4">⏳</div>
            <div className="font-display font-bold" style={{ color: C.text }}>Loading…</div>
          </Panel>
        )}

        {!loading && (
          <>

            {/* ══ OVERVIEW ══ */}
            {tab === 'overview' && (
              <div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <StatCard icon="👤" label="Total Users"       value={allUsers.length}  accentBg="rgba(99,102,241,.10)" />
                  <StatCard icon="🏥" label="Hospitals"         value={hospitals.length} accentBg="rgba(59,130,246,.10)" />
                  <StatCard icon="🏪" label="Stores"            value={stores.length}    accentBg="rgba(124,58,237,.10)" />
                  <StatCard icon="⏳" label="Pending Approvals" value={pendingCount}
                            sub={pendingCount > 0 ? 'Needs review' : 'All clear'}
                            accentBg={C.amberBg} />
                </div>

                {/* Role breakdown */}
                <Panel className="mb-6">
                  <h2 className="font-display font-bold text-[1.05rem] mb-4" style={{ color: C.text }}>
                    User Role Breakdown
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { role:'cat_owner',      count: catOwners.length },
                      { role:'vet',            count: vets.length      },
                      { role:'hospital_admin', count: hospitals.length  },
                      { role:'store_owner',    count: stores.length    },
                    ].map(({ role, count }) => {
                      const meta = ROLE_META[role]
                      return (
                        <div key={role} className="flex items-center gap-3 p-3 rounded-xl"
                             style={{ background: meta.bg, border:`1px solid ${C.border}` }}>
                          <span className="text-2xl">{meta.icon}</span>
                          <div>
                            <div className="font-display font-black text-[1.3rem] leading-none" style={{ color: meta.text }}>{count}</div>
                            <div className="text-[12px] font-medium mt-0.5" style={{ color: meta.text, opacity:.75 }}>{meta.label}</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </Panel>

                {/* Pending alert */}
                {pendingCount > 0 && (
                  <div className="rounded-2xl p-6" style={{ background: C.amberBg, border:`1px solid ${C.amberBorder}` }}>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-display font-bold text-[1.05rem]" style={{ color: C.text }}>
                        ⏳ Pending Approvals
                      </h2>
                      <button onClick={() => setTab('pending')}
                              style={{ color: C.olive, background:'none', border:'none', fontWeight:600, fontSize:13, cursor:'pointer' }}>
                        View all →
                      </button>
                    </div>
                    <div className="flex flex-col gap-2">
                      {pendingUsers.slice(0, 3).map(u => (
                        <div key={u.id} className="flex items-center gap-4 p-3 rounded-xl"
                             style={{ background:'rgba(255,255,255,.6)' }}>
                          <span className="text-xl">{u.role === 'hospital_admin' ? '🏥' : '🏪'}</span>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-[14px]" style={{ color: C.text }}>{u.name}</div>
                            <div className="text-[12.5px]" style={{ color: C.textMuted }}>
                              {u.email} · {u.city || 'No city'} · {fmtDate(u.created_at)}
                            </div>
                          </div>
                          <RolePill role={u.role} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {pendingCount === 0 && (
                  <div className="rounded-2xl p-5 flex items-center gap-3"
                       style={{ background: C.greenBg, border:`1px solid ${C.greenBorder}` }}>
                    <span className="text-2xl">✅</span>
                    <span className="text-[14px] font-semibold" style={{ color: C.olive }}>
                      No pending approvals — all accounts are up to date.
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* ══ HOSPITALS ══ */}
            {tab === 'hospitals' && (
              <div>
                <h2 className="font-display font-bold text-[1.1rem] mb-5" style={{ color: C.text }}>
                  Registered Hospitals ({hospitals.length})
                </h2>
                {hospitals.length === 0
                  ? <EmptyState icon="🏥" title="No hospitals registered yet" sub="Hospital admins will appear here after registration." />
                  : (
                    <div className="flex flex-col gap-3">
                      {hospitals.map(h => (
                        <Panel key={h.id} className="!p-5 flex items-center gap-5">
                          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                               style={{ background:'rgba(59,130,246,.09)' }}>🏥</div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-[15px]" style={{ color: C.text }}>{h.name}</div>
                            <div className="text-[13px] mt-0.5" style={{ color: C.textMuted }}>
                              {h.email} · {h.city || 'No city'} · Joined {fmtDate(h.created_at)}
                            </div>
                          </div>
                          <StatusPill active={h.is_active} />
                          {!h.is_active && (
                            <div className="flex gap-2">
                              <button onClick={() => approveUser(h.id)} style={btnApprove}>✓ Approve</button>
                              <button onClick={() => rejectUser(h.id)}  style={btnReject}>✕ Reject</button>
                            </div>
                          )}
                        </Panel>
                      ))}
                    </div>
                  )
                }
                <div className="mt-5 p-4 rounded-2xl text-[13px]"
                     style={{ background: C.oliveBg, border:`1px solid ${C.oliveBorder}` }}>
                  ℹ️ <span style={{ color: C.text }}>
                    Veterinarians are added exclusively by the Hospital Admin through their own dashboard. They do not self-register.
                  </span>
                </div>
              </div>
            )}

            {/* ══ STORES ══ */}
            {tab === 'stores' && (
              <div>
                <h2 className="font-display font-bold text-[1.1rem] mb-5" style={{ color: C.text }}>
                  Registered Stores ({stores.length})
                </h2>
                {stores.length === 0
                  ? <EmptyState icon="🏪" title="No stores registered yet" sub="Store owners will appear here after registration." />
                  : (
                    <>
                      {/* Active stores */}
                      {stores.filter(s => s.is_active).length > 0 && (
                        <>
                          <p className="text-[13px] font-semibold mb-3" style={{ color: C.textMuted }}>Active</p>
                          <div className="flex flex-col gap-3 mb-6">
                            {stores.filter(s => s.is_active).map(s => (
                              <Panel key={s.id} className="!p-5 flex items-center gap-5">
                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                                     style={{ background:'rgba(124,58,237,.08)' }}>🏪</div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-[15px]" style={{ color: C.text }}>{s.name}</div>
                                  <div className="text-[13px] mt-0.5" style={{ color: C.textMuted }}>
                                    {s.email} · {s.city || 'No city'} · Joined {fmtDate(s.created_at)}
                                  </div>
                                </div>
                                <StatusPill active={true} />
                              </Panel>
                            ))}
                          </div>
                        </>
                      )}

                      {/* Pending stores */}
                      {stores.filter(s => !s.is_active).length > 0 && (
                        <>
                          <p className="text-[13px] font-semibold mb-3" style={{ color: C.amberText }}>Pending Review</p>
                          <div className="flex flex-col gap-3">
                            {stores.filter(s => !s.is_active).map(s => (
                              <div key={s.id} className="rounded-2xl p-5 flex items-center gap-5"
                                   style={{ background: C.amberBg, border:`1px solid ${C.amberBorder}` }}>
                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                                     style={{ background:'rgba(184,92,56,.12)' }}>🏪</div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-[15px]" style={{ color: C.text }}>{s.name}</div>
                                  <div className="text-[13px] mt-0.5" style={{ color: C.textMuted }}>
                                    {s.email} · {s.city || 'No city'} · Registered {fmtDate(s.created_at)}
                                  </div>
                                </div>
                                <StatusPill active={false} />
                                <div className="flex gap-2">
                                  <button onClick={() => approveUser(s.id)} style={btnApprove}>✓ Approve</button>
                                  <button onClick={() => rejectUser(s.id)}  style={btnReject}>✕ Reject</button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  )
                }
                <div className="mt-5 p-4 rounded-2xl text-[13.5px] flex items-start gap-2.5"
                     style={{ background: C.oliveBg, border:`1px solid ${C.oliveBorder}` }}>
                  <span style={{ color: C.olive, flexShrink:0 }}>🔒</span>
                  <span style={{ color: C.text }}>
                    Store accounts are not publicly listed until explicitly approved by a System Admin.
                  </span>
                </div>
              </div>
            )}

            {/* ══ USERS ══ */}
            {tab === 'users' && (
              <div>
                <div className="flex flex-wrap items-center gap-3 mb-5">
                  <input
                    type="text"
                    placeholder="Search by name or email…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="px-4 py-2.5 rounded-xl text-[13.5px] outline-none"
                    style={{ background:'rgba(255,255,255,.9)', border:`1.5px solid ${C.border}`, color: C.text, minWidth:240 }}
                  />
                  <div className="flex gap-2 flex-wrap">
                    {['all', ...Object.keys(ROLE_META)].map(r => (
                      <button key={r} onClick={() => setRoleFilter(r)}
                              className="px-3 py-1.5 rounded-lg text-[12px] font-semibold capitalize"
                              style={{
                                background: roleFilter===r ? C.oliveBg  : C.surface,
                                color:      roleFilter===r ? C.olive    : C.textMuted,
                                border:     roleFilter===r ? `1px solid ${C.oliveBorder}` : `1px solid ${C.border}`,
                              }}>
                        {r === 'all' ? 'All Roles' : (ROLE_META[r]?.icon + ' ' + ROLE_META[r]?.label)}
                      </button>
                    ))}
                  </div>
                  <span className="text-[13px] ml-auto" style={{ color: C.textMuted }}>
                    {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {filteredUsers.length === 0
                  ? <EmptyState icon="👤" title="No users found" sub="Try adjusting your search or role filter." />
                  : (
                    <div className="flex flex-col gap-2">
                      {filteredUsers.map(u => (
                        <Panel key={u.id} className="!p-4 flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                               style={{ background: ROLE_META[u.role]?.bg ?? C.surface }}>
                            {ROLE_META[u.role]?.icon ?? '👤'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-[14.5px]" style={{ color: C.text }}>{u.name}</div>
                            <div className="text-[13px]" style={{ color: C.textMuted }}>{u.email}</div>
                          </div>
                          <RolePill role={u.role} />
                          <StatusPill active={u.is_active} />
                          <span className="text-[12px] hidden sm:block" style={{ color: C.textMuted }}>
                            {fmtDate(u.created_at)}
                          </span>
                        </Panel>
                      ))}
                    </div>
                  )
                }
              </div>
            )}

            {/* ══ PENDING APPROVALS ══ */}
            {tab === 'pending' && (
              <div>
                <h2 className="font-display font-bold text-[1.1rem] mb-5" style={{ color: C.text }}>
                  Pending Approvals ({pendingCount})
                </h2>

                {pendingCount === 0
                  ? <EmptyState icon="✅" title="All caught up!" sub="No pending approvals at this time." />
                  : (
                    <div className="flex flex-col gap-4">
                      {pendingUsers.map(u => <PendingCard key={u.id} u={u} />)}
                    </div>
                  )
                }

                <div className="mt-6 p-4 rounded-2xl text-[13.5px]"
                     style={{ background: C.oliveBg, border:`1px solid ${C.oliveBorder}` }}>
                  ℹ️ <span style={{ color: C.text }}>
                    Hospitals and stores require System Admin verification before they can access the platform.
                    Vets are added exclusively by their Hospital Admin — they do not self-register or appear here.
                  </span>
                </div>
              </div>
            )}

          </>
        )}

      </main>
    </div>
  )
}
