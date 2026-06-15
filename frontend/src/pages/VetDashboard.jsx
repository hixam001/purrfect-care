/**
 * VetDashboard
 *
 * Personal dashboard for Veterinarians (role === 'vet').
 * All data is fetched live:
 *   - Appointments  → GET /api/appointments/mine  (backend, bearer token)
 *   - Chat threads  → supabase chat_rooms where vet_id = this vet's ID
 *   - Profile       → AuthContext + supabase user_profiles
 */
import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient.js'

const API = import.meta.env.VITE_API_URL || 'https://us-central1-purrfect-care-app.cloudfunctions.net/server'

/* ── Palette ─────────────────────────────────────────────────── */
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
  greenBg:     'rgba(45,90,39,.10)',
  greenText:   '#1E4D1C',
}

/* ── Mini components ──────────────────────────────────────────── */
function Panel({ children, className = '' }) {
  return (
    <div className={`rounded-2xl p-6 ${className}`}
         style={{ background: C.surface, border: `1px solid ${C.border}` }}>
      {children}
    </div>
  )
}

function StatCard({ icon, label, value, accentBg, accentText }) {
  return (
    <div className="rounded-2xl p-5 flex flex-col gap-1"
         style={{ background: C.surface, border: `1px solid ${C.border}` }}>
      <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl mb-3"
           style={{ background: accentBg }}>{icon}</div>
      <div className="font-display font-black text-[1.7rem] leading-none"
           style={{ color: accentText ?? C.text }}>{value}</div>
      <div className="text-[13px] font-medium mt-1" style={{ color: C.textMuted }}>{label}</div>
    </div>
  )
}

function EmptyState({ icon, title, sub }) {
  return (
    <div className="py-12 text-center">
      <div className="text-4xl mb-3">{icon}</div>
      <div className="font-display font-bold text-[1rem]" style={{ color: C.text }}>{title}</div>
      {sub && <div className="text-[13px] mt-1.5" style={{ color: C.textMuted }}>{sub}</div>}
    </div>
  )
}

const STATUS_COLORS = {
  confirmed:   { bg:'rgba(94,71,73,.10)',   text:'#4a373a',  label:'Confirmed'    },
  pending:     { bg:'rgba(184,124,42,.10)', text:'#7A4F10',  label:'Pending'      },
  in_progress: { bg:'rgba(59,130,246,.10)', text:'#1D4ED8',  label:'In Progress'  },
  completed:   { bg:'rgba(45,90,39,.10)',   text:'#1E4D1C',  label:'Completed'    },
  cancelled:   { bg:'rgba(184,56,56,.09)',  text:'#7D1F1F',  label:'Cancelled'    },
  no_show:     { bg:'rgba(100,100,100,.09)',text:'#555555',  label:'No Show'      },
}
function StatusPill({ status }) {
  const s = STATUS_COLORS[status] ?? { bg:'rgba(0,0,0,.06)', text:'#444', label: status }
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11.5px] font-semibold"
          style={{ background: s.bg, color: s.text }}>{s.label}</span>
  )
}

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'short' })
}
function fmtTime(t) { return t ? t.slice(0, 5) : '—' }
function fmtRelative(iso) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60000)
  if (mins < 1)   return 'just now'
  if (mins < 60)  return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs  < 24)  return `${hrs}h ago`
  return new Date(iso).toLocaleDateString('en-GB', { day:'numeric', month:'short' })
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */
export default function VetDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [activeTab,    setActiveTab]    = useState('overview')
  const [appointments, setAppointments] = useState([])
  const [chatRooms,    setChatRooms]    = useState([])
  const [myVetId,      setMyVetId]      = useState(null)
  const [myProfileId,  setMyProfileId]  = useState(null)
  const [profile,      setProfile]      = useState(null)
  const [apptTab,      setApptTab]      = useState('today')
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState(null)

  /* ── Load vet profile + appointments + chat rooms ── */
  const load = useCallback(async () => {
    if (!user?.id) return
    setLoading(true); setError(null)

    try {
      // 1. Resolve profile + vet IDs (needed for chat_rooms query)
      const { data: prof } = await supabase
        .from('user_profiles')
        .select('id, name, email, phone, role')
        .eq('user_id', user.id)
        .single()

      if (!prof || prof.role !== 'vet') {
        navigate('/dashboard', { replace: true }); return
      }
      setProfile(prof)
      setMyProfileId(prof.id)

      const { data: vetRow } = await supabase
        .from('vets')
        .select('id, specialization, experience_years, bio, rating, hospital_id, hospitals ( name, city )')
        .eq('user_id', prof.id)
        .single()

      setMyVetId(vetRow?.id ?? null)

      // 2. Fetch appointments via backend (service-role bypasses RLS cleanly)
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || ''
      const res   = await fetch(`${API}/api/appointments/mine`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const appts = await res.json()
        setAppointments(Array.isArray(appts) ? appts : [])
      } else {
        setAppointments([])
      }

      // 3. Fetch chat rooms for this vet (with patient name + cat + latest message)
      if (vetRow?.id) {
        const { data: rooms } = await supabase
          .from('chat_rooms')
          .select(`
            id, appointment_id, created_at,
            appointments (
              id, appointment_date, status,
              cats ( name ),
              user_profiles ( id, name )
            )
          `)
          .eq('vet_id', vetRow.id)
          .order('created_at', { ascending: false })

        setChatRooms(rooms ?? [])
      }
    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
  }, [user?.id, navigate])

  useEffect(() => { load() }, [load])

  /* ── Derived ── */
  const today         = new Date().toISOString().slice(0, 10)
  const todayAppts    = appointments.filter(a => (a.appointment_date ?? '').slice(0, 10) === today)
  const upcomingAppts = appointments.filter(a => (a.appointment_date ?? '').slice(0, 10) >  today)
  const pastAppts     = appointments.filter(a => (a.appointment_date ?? '').slice(0, 10) <  today)

  const tabAppts = apptTab === 'today' ? todayAppts : apptTab === 'upcoming' ? upcomingAppts : pastAppts

  const APPT_TABS = [
    { id:'today',    label:`Today (${todayAppts.length})` },
    { id:'upcoming', label:`Upcoming (${upcomingAppts.length})` },
    { id:'past',     label:`Past (${pastAppts.length})` },
  ]

  const MAIN_TABS = [
    { id:'overview',     label:'Overview',     icon:'🏠' },
    { id:'appointments', label:'Appointments', icon:'📅' },
    { id:'messages',     label:'Messages',     icon:'💬' },
  ]

  /* ── Loading / error states ── */
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: C.bg }}>
      <div className="text-[14px]" style={{ color: C.textMuted }}>Loading your dashboard…</div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: C.bg }}>
      <div className="text-center">
        <div className="text-4xl mb-3">⚠️</div>
        <div className="font-bold mb-2" style={{ color: C.text }}>Could not load dashboard</div>
        <div className="text-[13px] mb-4" style={{ color: C.textMuted }}>{error}</div>
        <button onClick={load} className="px-6 py-2.5 rounded-xl font-semibold text-[13px]"
                style={{ background: C.olive, color: '#fff' }}>Retry</button>
      </div>
    </div>
  )

  const vetName = profile?.name ?? 'Vet'

  return (
    <div className="min-h-screen" style={{ background: C.bg }}>

      {/* ── Header ── */}
      <header className="sticky top-0 z-40"
              style={{ background:'rgba(219,232,216,.85)', backdropFilter:'blur(14px)', borderBottom:`1px solid ${C.border}` }}>
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center gap-4">
          <div className="text-2xl">🐾</div>
          <div className="flex-1">
            <div className="font-display font-black text-[1rem]" style={{ color: C.text }}>Vet Dashboard</div>
            <div className="text-[11px]" style={{ color: C.textMuted }}>Purrfect Care · {vetName}</div>
          </div>
          <button onClick={() => { logout(); navigate('/login') }}
                  className="text-[12px] px-4 py-2 rounded-xl font-semibold"
                  style={{ background: C.oliveBg, border:`1px solid ${C.oliveBorder}`, color: C.olive }}>
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">

        {/* ── Nav tabs ── */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {MAIN_TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[13px] font-semibold transition-all"
                    style={{
                      background: activeTab === t.id ? C.olive : C.surface,
                      color:      activeTab === t.id ? '#fff'   : C.textMuted,
                      border:     `1px solid ${activeTab === t.id ? C.olive : C.border}`,
                    }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ════════════════════ OVERVIEW ════════════════════ */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon="📅" label="Today"     value={todayAppts.length}
                        accentBg={C.amberBg} accentText={C.amberText} />
              <StatCard icon="🔜" label="Upcoming"  value={upcomingAppts.length}
                        accentBg={C.oliveBg} accentText={C.olive} />
              <StatCard icon="✅" label="Completed" value={appointments.filter(a => a.status === 'completed').length}
                        accentBg={C.greenBg} accentText={C.greenText} />
              <StatCard icon="💬" label="Chats"     value={chatRooms.length}
                        accentBg="rgba(59,130,246,.08)" accentText="#1D4ED8" />
            </div>

            {/* Today's schedule */}
            <Panel>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-bold text-[1.05rem]" style={{ color: C.text }}>
                  Today's Schedule
                </h2>
                <button onClick={() => { setActiveTab('appointments'); setApptTab('today') }}
                        className="text-[11px] font-semibold" style={{ color: C.olive }}>
                  View all →
                </button>
              </div>
              {todayAppts.length === 0 ? (
                <EmptyState icon="☀️" title="No appointments today"
                            sub="Enjoy the day — nothing scheduled." />
              ) : (
                <div className="flex flex-col gap-3">
                  {todayAppts.slice(0, 5).map(a => (
                    <div key={a.id} className="flex items-center gap-4 p-4 rounded-2xl"
                         style={{ background:'rgba(0,0,0,.02)', border:`1px solid ${C.border}` }}>
                      <div className="text-center w-14 flex-shrink-0">
                        <div className="font-mono font-black text-[1.3rem] leading-none" style={{ color: C.olive }}>
                          {fmtTime(a.appointment_slots?.start_time)}
                        </div>
                        <div className="text-[10px] mt-0.5" style={{ color: C.textMuted }}>
                          {fmtTime(a.appointment_slots?.end_time)}
                        </div>
                      </div>
                      <div className="w-px self-stretch" style={{ background: C.border }} />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-[14px]" style={{ color: C.text }}>
                          {a.user_profiles?.name ?? 'Patient'}
                        </div>
                        <div className="text-[12px]" style={{ color: C.textMuted }}>
                          🐱 {a.cats?.name ?? '—'} · {a.hospital_services?.name ?? 'Consultation'}
                        </div>
                      </div>
                      <StatusPill status={a.status} />
                    </div>
                  ))}
                </div>
              )}
            </Panel>

            {/* Recent messages */}
            <Panel>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-bold text-[1.05rem]" style={{ color: C.text }}>
                  Recent Messages
                </h2>
                <button onClick={() => setActiveTab('messages')}
                        className="text-[11px] font-semibold" style={{ color: C.olive }}>
                  View all →
                </button>
              </div>
              {chatRooms.length === 0 ? (
                <EmptyState icon="💬" title="No messages yet"
                            sub="Chats with your patients will appear here." />
              ) : (
                <div className="flex flex-col gap-2">
                  {chatRooms.slice(0, 4).map(r => {
                    const appt    = r.appointments
                    const patient = appt?.user_profiles?.name ?? 'Patient'
                    const cat     = appt?.cats?.name ?? '—'
                    return (
                      <Link key={r.id} to={`/chat/${r.appointment_id}`}
                            className="flex items-center gap-3 p-4 rounded-2xl no-underline transition-all hover:opacity-80"
                            style={{ background:'rgba(0,0,0,.02)', border:`1px solid ${C.border}` }}>
                        <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
                             style={{ background: C.oliveBg }}>💬</div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-[13px] truncate" style={{ color: C.text }}>
                            {patient}
                          </div>
                          <div className="text-[11px]" style={{ color: C.textMuted }}>🐱 {cat}</div>
                        </div>
                        <div className="text-[10px] flex-shrink-0" style={{ color: C.textMuted }}>
                          {fmtRelative(appt?.appointment_date)}
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </Panel>
          </div>
        )}

        {/* ════════════════════ APPOINTMENTS ════════════════════ */}
        {activeTab === 'appointments' && (
          <Panel>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-bold text-[1.1rem]" style={{ color: C.text }}>
                My Appointments
              </h2>
              <div className="flex gap-1">
                {APPT_TABS.map(t => (
                  <button key={t.id} onClick={() => setApptTab(t.id)}
                          className="px-4 py-1.5 rounded-xl text-[11.5px] font-semibold transition-all"
                          style={{
                            background: apptTab === t.id ? C.olive : 'transparent',
                            color:      apptTab === t.id ? '#fff'   : C.textMuted,
                            border:     `1px solid ${apptTab === t.id ? C.olive : C.border}`,
                          }}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            {tabAppts.length === 0 ? (
              <EmptyState icon="📋" title={`No ${apptTab} appointments`}
                          sub={apptTab === 'today' ? 'Nothing scheduled for today.' : 'All clear here.'} />
            ) : (
              <div className="flex flex-col gap-3">
                {tabAppts.map(a => {
                  const patientName = a.user_profiles?.name ?? 'Patient'
                  const catName     = a.cats?.name ?? '—'
                  const canChat     = ['confirmed','in_progress'].includes(a.status)
                  return (
                    <div key={a.id} className="p-5 rounded-2xl"
                         style={{ background:'rgba(0,0,0,.02)', border:`1px solid ${C.border}` }}>
                      <div className="flex items-start gap-4">
                        {/* Date/time badge */}
                        <div className="text-center flex-shrink-0 w-16">
                          <div className="font-mono font-black text-[1.2rem] leading-none" style={{ color: C.olive }}>
                            {fmtDate(a.appointment_date).split(',')[0]}
                          </div>
                          <div className="text-[10px] mt-0.5" style={{ color: C.textMuted }}>
                            {fmtDate(a.appointment_date).split(',').slice(1).join(',').trim()}
                          </div>
                          <div className="text-[10px] mt-1 font-mono" style={{ color: C.textMuted }}>
                            {fmtTime(a.appointment_slots?.start_time)}
                          </div>
                        </div>
                        <div className="w-px self-stretch" style={{ background: C.border }} />
                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-[14px]" style={{ color: C.text }}>
                            {patientName}
                          </div>
                          <div className="text-[12px] mt-0.5" style={{ color: C.textMuted }}>
                            🐱 {catName} · {a.hospital_services?.name ?? 'Consultation'}
                          </div>
                          {a.notes && (
                            <div className="text-[11px] mt-2 px-3 py-2 rounded-xl"
                                 style={{ background: C.amberBg, color: C.amberText }}>
                              📝 {a.notes}
                            </div>
                          )}
                        </div>
                        {/* Actions */}
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <StatusPill status={a.status} />
                          {canChat && (
                            <Link to={`/chat/${a.id}`}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold no-underline"
                                  style={{ background: C.olive, color:'#fff' }}>
                              💬 Message Patient
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Panel>
        )}

        {/* ════════════════════ MESSAGES ════════════════════ */}
        {activeTab === 'messages' && (
          <Panel>
            <h2 className="font-display font-bold text-[1.1rem] mb-5" style={{ color: C.text }}>
              Patient Messages
            </h2>
            {chatRooms.length === 0 ? (
              <EmptyState icon="💬" title="No chats yet"
                          sub="When a patient books with you and you're both confirmed, you can message each other here." />
            ) : (
              <div className="flex flex-col gap-3">
                {chatRooms.map(r => {
                  const appt    = r.appointments
                  const patient = appt?.user_profiles?.name ?? 'Patient'
                  const cat     = appt?.cats?.name ?? '—'
                  const status  = appt?.status ?? 'pending'
                  const canChat = ['confirmed','in_progress'].includes(status)
                  return (
                    <div key={r.id} className="p-5 rounded-2xl flex items-center gap-4"
                         style={{ background:'rgba(0,0,0,.02)', border:`1px solid ${C.border}` }}>
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                           style={{ background: C.oliveBg }}>🐱</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-[14px]" style={{ color: C.text }}>
                          {patient}
                        </div>
                        <div className="text-[12px]" style={{ color: C.textMuted }}>
                          🐱 {cat}
                        </div>
                        <div className="text-[11px] mt-1" style={{ color: C.textMuted }}>
                          Appt: {fmtDate(appt?.appointment_date)}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <StatusPill status={status} />
                        {canChat ? (
                          <Link to={`/chat/${r.appointment_id}`}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold no-underline"
                                style={{ background: C.olive, color:'#fff' }}>
                            💬 Open Chat
                          </Link>
                        ) : (
                          <span className="text-[11px] px-3 py-1.5 rounded-xl"
                                style={{ background: C.amberBg, color: C.amberText, border:`1px solid ${C.amberBorder}` }}>
                            {status === 'pending' ? 'Awaiting Confirmation' : 'Chat Closed'}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Panel>
        )}

      </main>
    </div>
  )
}
