// VetDashboard | Personal dashboard for Veterinarians (role === 'vet'). | All data is fetched live: | - Appointments  → GET /api/appointments/mine  (backend, bearer token) | - Chat threads  → supabase chat_rooms where vet_id = this vet's ID | - Profile       → AuthContext + supabase user_profiles
import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient.js'

const API = import.meta.env.VITE_API_URL || 'https://us-central1-purrfect-care-app.cloudfunctions.net/server'

// ── Palette ───────────────────────────────────────────────────
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

// ── Mini components ────────────────────────────────────────────
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

function PatientAvatar({ name = '?' }) {
  const letter  = name[0].toUpperCase()
  const colours = ['#5e4749','#4a7c59','#6d5d3b','#2d5a6b','#7a4060']
  const bg      = colours[letter.charCodeAt(0) % colours.length]
  return (
    <div style={{
      width:40, height:40, borderRadius:12, background:bg, flexShrink:0,
      display:'flex', alignItems:'center', justifyContent:'center',
      color:'#fff', fontWeight:800, fontSize:16,
    }}>{letter}</div>
  )
}

// ═══════════════════════════════════════════════════════════════ | MAIN COMPONENT | ═══════════════════════════════════════════════════════════════
export default function VetDashboard() {
  const { user, logout, token } = useAuth()
  const [saving,     setSaving]     = useState(false)
  const [saveMsg,    setSaveMsg]    = useState('')
  const [settingsForm, setSettingsForm] = useState({ name:'', phone:'', specialization:'', experience_years:'', bio:'' })
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

  // ── Load vet profile + appointments + chat rooms ──
  const load = useCallback(async () => {
    if (!user?.id) return

    // Role check from AuthContext — bypasses Supabase RLS/session-timing issues
    if (user.role !== 'vet') {
      navigate('/dashboard', { replace: true }); return
    }

    setLoading(true); setError(null)

    try {
      // 1. Use AuthContext user directly (already contains id, name, email, phone, role)
      setProfile(user)
      setMyProfileId(user.id)

      const { data: vetRow } = await supabase
        .from('vets')
        .select('id, specialization, experience_years, bio, rating, hospital_id, hospitals ( name, city )')
        .eq('user_id', user.id)   // vets.user_id references user_profiles.id
        .maybeSingle()

      setMyVetId(vetRow?.id ?? null)

      // Prefill settings form
      setSettingsForm({
        name:             user.name             ?? '',
        phone:            user.phone            ?? '',
        specialization:   vetRow?.specialization  ?? '',
        experience_years: vetRow?.experience_years ?? '',
        bio:              vetRow?.bio              ?? '',
      })

      // 2. Fetch appointments via backend — errors are non-fatal
      try {
        const authToken = token || localStorage.getItem('pc_token') || ''
        const res = await fetch(`${API}/api/appointments/mine`, {
          headers: { Authorization: `Bearer ${authToken}` },
        })
        if (res.ok) {
          const appts = await res.json()
          setAppointments(Array.isArray(appts) ? appts : [])
        }
      } catch (_) {
        // backend unavailable — show empty list, not hard error
        setAppointments([])
      }

      // 3. Fetch chat rooms for this vet — errors are non-fatal
      if (vetRow?.id) {
        try {
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
        } catch (_) {
          setChatRooms([])
        }
      }
    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
  }, [user?.id, user?.role, token, navigate])

  useEffect(() => { load() }, [load])

  // ── Derived ──
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
    { id:'settings',     label:'Settings',     icon:'⚙️' },
  ]

  // ── Loading / error states ──
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

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8">

        {/* ── Nav tabs ── */}
        <div className="-mx-4 md:mx-0 mb-6 md:mb-8">
          <div className="flex gap-2 px-4 md:px-0 overflow-x-auto pb-1" style={{ scrollbarWidth:'none' }}>
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
                  Recent Patient Chats
                </h2>
                <Link to="/chats" className="text-[11px] font-semibold no-underline"
                      style={{ color: C.olive }}>
                  View all →
                </Link>
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
                    const canChat = ['confirmed','in_progress'].includes(appt?.status)
                    return (
                      <div key={r.id}
                           onClick={() => canChat && navigate(`/chat/${r.appointment_id}`)}
                           className="flex items-center gap-3 p-4 rounded-2xl transition-all"
                           style={{
                             background:'rgba(0,0,0,.02)', border:`1px solid ${C.border}`,
                             cursor: canChat ? 'pointer' : 'default',
                             opacity: canChat ? 1 : 0.65,
                           }}>
                        <PatientAvatar name={patient} />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-[13px] truncate" style={{ color: C.text }}>
                            {patient}
                          </div>
                          <div className="text-[11px]" style={{ color: C.textMuted }}>🐱 {cat}</div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <div className="text-[10px]" style={{ color: C.textMuted }}>
                            {fmtRelative(appt?.appointment_date)}
                          </div>
                          {canChat && (
                            <span className="text-[10px] font-semibold" style={{ color: C.olive }}>Open →</span>
                          )}
                        </div>
                      </div>
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
            <h2 className="font-display font-bold text-[1.1rem] mb-5" style={{ color: C.text }}>Patient Messages</h2>
            {chatRooms.length === 0 ? (
              <EmptyState icon="💬" title="No messages yet" sub="Chats with your patients will appear here once appointments are confirmed." />
            ) : (
              <div className="flex flex-col gap-2">
                {chatRooms.map(r => {
                  const appt    = r.appointments
                  const patient = appt?.user_profiles?.name ?? 'Patient'
                  const cat     = appt?.cats?.name ?? '—'
                  const canChat = ['confirmed','in_progress'].includes(appt?.status)
                  const statusStyle = STATUS_COLORS[appt?.status] ?? STATUS_COLORS.pending
                  return (
                    <div key={r.id}
                         onClick={() => canChat && navigate(`/chat/${r.appointment_id}`)}
                         className="flex items-center gap-4 p-4 rounded-2xl transition-all"
                         style={{
                           background:'rgba(0,0,0,.02)', border:`1px solid ${C.border}`,
                           cursor: canChat ? 'pointer' : 'default',
                           opacity: canChat ? 1 : 0.6,
                         }}>
                      <PatientAvatar name={patient} />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-[14px] truncate" style={{ color: C.text }}>{patient}</div>
                        <div className="text-[11px] mt-0.5" style={{ color: C.textMuted }}>
                          🐱 {cat} · {fmtDate(appt?.appointment_date)}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold"
                              style={{ background: statusStyle.bg, color: statusStyle.text }}>
                          {statusStyle.label}
                        </span>
                        {canChat && (
                          <span className="text-[11px] font-bold" style={{ color: C.olive }}>Open chat →</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Panel>
        )}

        {/* ════════════════════ SETTINGS ════════════════════ */}
        {activeTab === 'settings' && (
          <div className="max-w-xl space-y-4">
            <Panel>
              <h2 className="font-display font-bold text-[1.1rem] mb-5" style={{ color: C.text }}>Profile Settings</h2>
              <div className="space-y-4">
                {[{ key:'name', label:'Full Name', type:'text' }, { key:'phone', label:'Phone', type:'tel' }].map(({ key, label, type }) => (
                  <div key={key}>
                    <label className="block text-[12px] font-semibold mb-1.5" style={{ color: C.textMuted }}>{label}</label>
                    <input type={type} value={settingsForm[key]}
                           onChange={e => setSettingsForm(f => ({ ...f, [key]: e.target.value }))}
                           className="w-full px-4 py-2.5 rounded-xl text-[13px] outline-none transition-all"
                           style={{ background:'rgba(0,0,0,.03)', border:`1.5px solid ${C.border}`, color: C.text }} />
                  </div>
                ))}
              </div>
            </Panel>

            <Panel>
              <h2 className="font-display font-bold text-[1.1rem] mb-5" style={{ color: C.text }}>Vet Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-[12px] font-semibold mb-1.5" style={{ color: C.textMuted }}>Specialization</label>
                  <input value={settingsForm.specialization}
                         onChange={e => setSettingsForm(f => ({ ...f, specialization: e.target.value }))}
                         className="w-full px-4 py-2.5 rounded-xl text-[13px] outline-none"
                         style={{ background:'rgba(0,0,0,.03)', border:`1.5px solid ${C.border}`, color: C.text }} />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold mb-1.5" style={{ color: C.textMuted }}>Years of Experience</label>
                  <input type="number" min="0" value={settingsForm.experience_years}
                         onChange={e => setSettingsForm(f => ({ ...f, experience_years: e.target.value }))}
                         className="w-full px-4 py-2.5 rounded-xl text-[13px] outline-none"
                         style={{ background:'rgba(0,0,0,.03)', border:`1.5px solid ${C.border}`, color: C.text }} />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold mb-1.5" style={{ color: C.textMuted }}>Bio</label>
                  <textarea rows={4} value={settingsForm.bio}
                            onChange={e => setSettingsForm(f => ({ ...f, bio: e.target.value }))}
                            className="w-full px-4 py-2.5 rounded-xl text-[13px] outline-none resize-none"
                            style={{ background:'rgba(0,0,0,.03)', border:`1.5px solid ${C.border}`, color: C.text }} />
                </div>
              </div>
            </Panel>

            {saveMsg && (
              <div className="px-4 py-3 rounded-xl text-[13px] font-semibold text-center"
                   style={{ background: saveMsg.startsWith('✅') ? C.greenBg : 'rgba(184,56,56,.08)',
                            color: saveMsg.startsWith('✅') ? C.greenText : '#7D1F1F',
                            border: `1px solid ${saveMsg.startsWith('✅') ? 'rgba(45,90,39,.2)' : 'rgba(184,56,56,.2)'}` }}>
                {saveMsg}
              </div>
            )}

            <button onClick={async () => {
              setSaving(true); setSaveMsg('')
              try {
                // Update user_profiles
                await supabase.from('user_profiles')
                  .update({ name: settingsForm.name, phone: settingsForm.phone })
                  .eq('id', myProfileId)
                // Update vets row
                if (myVetId) {
                  await supabase.from('vets')
                    .update({
                      specialization:   settingsForm.specialization,
                      experience_years: settingsForm.experience_years ? parseInt(settingsForm.experience_years) : null,
                      bio:              settingsForm.bio,
                    })
                    .eq('id', myVetId)
                }
                setSaveMsg('✅ Profile saved successfully')
              } catch (err) {
                setSaveMsg('❌ Failed to save: ' + err.message)
              } finally { setSaving(false) }
            }}
                    disabled={saving}
                    className="w-full py-3 rounded-2xl font-bold text-[14px] text-white transition-all"
                    style={{ background: C.olive, opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        )}

      </main>
    </div>
  )
}
