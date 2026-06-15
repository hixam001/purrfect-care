// ChatsInboxPage — /chats | A unified chat inbox that auto-detects the logged-in user's role: | Patient  → shows all chat rooms where they are the patient | (appointment status: confirmed / in_progress) | Vet      → shows all chat rooms where vet_id = their vet profile | Each conversation card shows: | • Other person's name + avatar initial | • Cat name | • Appointment date & status | • Click anywhere → /chat/:appointmentId | This page is intentionally standalone (no AppLayout wrapper) | so it works seamlessly in both mobile and desktop contexts.
import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate }                from 'react-router-dom'
import { useAuth }                          from '../context/AuthContext.jsx'
import { supabase }                         from '../lib/supabaseClient.js'

// ── Palette ───────────────────────────────────────────────
const C = {
  bg:          '#dbe8d8',
  surface:     'rgba(255,255,255,.90)',
  border:      '#b8ceb5',
  text:        '#3a2c2d',
  textMuted:   '#7a5e60',
  olive:       '#5e4749',
  oliveBg:     'rgba(94,71,73,.09)',
  oliveBorder: 'rgba(94,71,73,.20)',
  amberBg:     'rgba(184,124,42,.10)',
  amberText:   '#7A4F10',
  amberBorder: 'rgba(184,124,42,.25)',
  greenBg:     'rgba(45,90,39,.10)',
  greenText:   '#1E4D1C',
  blueBg:      'rgba(59,130,246,.09)',
  blueText:    '#1D4ED8',
  redBg:       'rgba(184,56,56,.09)',
  redText:     '#7D1F1F',
}

// ── Status colour map ───────────────────────────────────────
const STATUS = {
  confirmed:   { bg: C.oliveBg,  text: C.olive,     label: 'Confirmed'    },
  pending:     { bg: C.amberBg,  text: C.amberText,  label: 'Pending'     },
  in_progress: { bg: C.blueBg,   text: C.blueText,   label: 'In Progress' },
  completed:   { bg: C.greenBg,  text: C.greenText,  label: 'Completed'   },
  cancelled:   { bg: C.redBg,    text: C.redText,    label: 'Cancelled'   },
  no_show:     { bg:'rgba(100,100,100,.08)', text:'#555', label: 'No Show' },
}

function StatusPill({ status }) {
  const s = STATUS[status] ?? { bg:'rgba(0,0,0,.06)', text:'#444', label: status }
  return (
    <span className="inline-flex items-center px-2.5 py-[3px] rounded-full text-[11px] font-semibold"
          style={{ background: s.bg, color: s.text }}>
      {s.label}
    </span>
  )
}

function Avatar({ name, size = 44 }) {
  const letter  = (name ?? '?')[0].toUpperCase()
  const colours = ['#5e4749','#4a7c59','#6d5d3b','#2d5a6b','#7a4060']
  const bg      = colours[letter.charCodeAt(0) % colours.length]
  return (
    <div style={{
      width: size, height: size, borderRadius: 14,
      background: bg, flexShrink: 0,
      display:'flex', alignItems:'center', justifyContent:'center',
      color:'#fff', fontWeight:800, fontSize: size * 0.38,
    }}>{letter}</div>
  )
}

function fmtDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  const now = new Date()
  const diff = now - d
  if (diff < 60 * 60 * 1000)     return 'Just now'
  if (diff < 24 * 60 * 60 * 1000) return d.toLocaleTimeString('en-PK', { hour:'2-digit', minute:'2-digit' })
  if (diff < 7  * 24 * 60 * 60 * 1000) return d.toLocaleDateString('en-GB', { weekday:'short' })
  return d.toLocaleDateString('en-GB', { day:'numeric', month:'short' })
}

function fmtApptDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'short' })
}

// ═══════════════════════════════════════════════════════════ | MAIN | ═══════════════════════════════════════════════════════════
export default function ChatsInboxPage() {
  const { user, logout } = useAuth()
  const navigate         = useNavigate()

  const [rooms,   setRooms]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const [role,    setRole]    = useState(null)
  const [myName,  setMyName]  = useState('')

  const load = useCallback(async () => {
    if (!user?.id) return
    setLoading(true); setError(null)

    try {
      // 1. Resolve profile
      // FIX: user.id = user_profiles.id (PK), not auth UID — use .eq('id')
      const { data: prof } = await supabase
        .from('user_profiles')
        .select('id, name, role')
        .eq('id', user.id)
        .single()

      if (!prof) throw new Error('Profile not found.')
      setRole(prof.role)
      setMyName(prof.name ?? '')

      let data = []

      if (prof.role === 'vet') {
        // Vet: get vet row first, then query chat_rooms by vet_id
        const { data: vetRow } = await supabase
          .from('vets')
          .select('id')
          .eq('user_id', prof.id)
          .single()

        if (vetRow?.id) {
          const { data: rows, error: e } = await supabase
            .from('chat_rooms')
            .select(`
              id,
              appointment_id,
              created_at,
              appointments (
                id,
                appointment_date,
                status,
                cats   ( name ),
                user_profiles ( id, name )
              )
            `)
            .eq('vet_id', vetRow.id)
            .order('created_at', { ascending: false })

          if (e) throw e
          // Map: "other" is the patient
          data = (rows ?? []).map(r => ({
            roomId:         r.id,
            appointmentId:  r.appointment_id,
            otherName:      r.appointments?.user_profiles?.name ?? 'Patient',
            catName:        r.appointments?.cats?.name ?? '—',
            apptDate:       r.appointments?.appointment_date,
            status:         r.appointments?.status ?? 'pending',
            updatedAt:      r.created_at,
            canChat:        ['confirmed','in_progress'].includes(r.appointments?.status),
          }))
        }
      } else {
        // Patient: query chat_rooms by user_id (patient's profile id)
        const { data: rows, error: e } = await supabase
          .from('chat_rooms')
          .select(`
            id,
            appointment_id,
            created_at,
            appointments (
              id,
              appointment_date,
              status,
              cats ( name ),
              vets (
                id,
                specialization,
                user_profiles ( id, name )
              ),
              hospitals ( name )
            )
          `)
          .eq('user_id', prof.id)
          .order('created_at', { ascending: false })

        if (e) throw e
        // Map: "other" is the vet
        data = (rows ?? []).map(r => ({
          roomId:         r.id,
          appointmentId:  r.appointment_id,
          otherName:      r.appointments?.vets?.user_profiles?.name ?? 'Vet',
          subLabel:       r.appointments?.vets?.specialization ?? '',
          hospitalName:   r.appointments?.hospitals?.name ?? '',
          catName:        r.appointments?.cats?.name ?? '—',
          apptDate:       r.appointments?.appointment_date,
          status:         r.appointments?.status ?? 'pending',
          updatedAt:      r.created_at,
          canChat:        ['confirmed','in_progress'].includes(r.appointments?.status),
        }))
      }

      setRooms(data)
    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
  }, [user?.id])

  useEffect(() => { load() }, [load])

  // ── back destination ──
  const backTo = role === 'vet' ? '/vet-dashboard' : '/dashboard'

  // ── Loading ──
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: C.bg }}>
      <div className="text-[14px]" style={{ color: C.textMuted }}>Loading conversations…</div>
    </div>
  )

  // ── Error ──
  if (error) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: C.bg }}>
      <div className="text-center max-w-xs">
        <div className="text-4xl mb-3">⚠️</div>
        <div className="font-bold mb-2" style={{ color: C.text }}>Couldn't load chats</div>
        <div className="text-[13px] mb-4" style={{ color: C.textMuted }}>{error}</div>
        <button onClick={load} className="px-6 py-2.5 rounded-xl font-semibold text-[13px]"
                style={{ background: C.olive, color: '#fff' }}>Retry</button>
      </div>
    </div>
  )

  const isVet = role === 'vet'

  return (
    <div className="min-h-screen" style={{ background: C.bg }}>

      {/* ── Header ── */}
      <header className="sticky top-0 z-40"
              style={{ background:'rgba(219,232,216,.88)', backdropFilter:'blur(14px)', borderBottom:`1px solid ${C.border}` }}>
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link to={backTo} className="w-8 h-8 rounded-xl flex items-center justify-center no-underline"
                style={{ background: C.oliveBg, border:`1px solid ${C.oliveBorder}`, color: C.olive }}>
            ←
          </Link>
          <div className="flex-1">
            <div className="font-display font-black text-[1rem]" style={{ color: C.text }}>
              {isVet ? 'Patient Messages' : 'My Chats'}
            </div>
            <div className="text-[11px]" style={{ color: C.textMuted }}>
              {isVet ? 'Your booked patient conversations' : 'Chat with your vets'}
            </div>
          </div>
          <div className="text-[12px] px-3 py-1.5 rounded-xl font-semibold"
               style={{ background: C.oliveBg, color: C.olive }}>
            {rooms.length} chat{rooms.length !== 1 ? 's' : ''}
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">

        {rooms.length === 0 ? (
          // ── Empty state ──
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl mb-5"
                 style={{ background: C.oliveBg, border:`1px solid ${C.oliveBorder}` }}>
              💬
            </div>
            <div className="font-display font-black text-[1.2rem] mb-2" style={{ color: C.text }}>
              No conversations yet
            </div>
            <div className="text-[13px] max-w-xs" style={{ color: C.textMuted }}>
              {isVet
                ? 'Chats with your patients will appear here once an appointment is confirmed.'
                : 'Once your appointment is confirmed, you can chat with your vet here.'}
            </div>
            {!isVet && (
              <Link to="/find-vets"
                    className="mt-6 px-6 py-3 rounded-2xl font-semibold text-[13px] no-underline"
                    style={{ background: C.olive, color:'#fff' }}>
                Find a Vet →
              </Link>
            )}
          </div>
        ) : (
          // ── Conversation list ──
          <div className="flex flex-col gap-3">
            {rooms.map(r => (
              <ConversationCard key={r.roomId} room={r} isVet={isVet} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

// ── Single conversation card ──
function ConversationCard({ room, isVet }) {
  const navigate = useNavigate()

  function open() {
    if (room.canChat) navigate(`/chat/${room.appointmentId}`)
  }

  return (
    <div onClick={open}
         className="rounded-2xl transition-all"
         style={{
           background:  C.surface,
           border:      `1px solid ${C.border}`,
           cursor:      room.canChat ? 'pointer' : 'default',
           opacity:     room.canChat ? 1 : 0.72,
           boxShadow:   '0 2px 8px rgba(58,44,45,.04)',
         }}
         onMouseEnter={e => {
           if (room.canChat) {
             e.currentTarget.style.background = 'rgba(255,255,255,.98)'
             e.currentTarget.style.boxShadow  = '0 6px 20px rgba(58,44,45,.10)'
             e.currentTarget.style.transform  = 'translateY(-1px)'
           }
         }}
         onMouseLeave={e => {
           e.currentTarget.style.background = C.surface
           e.currentTarget.style.boxShadow  = '0 2px 8px rgba(58,44,45,.04)'
           e.currentTarget.style.transform  = 'none'
         }}>
      <div className="p-4 flex items-center gap-4">

        {/* Avatar */}
        <Avatar name={room.otherName} />

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-[14.5px] truncate" style={{ color: C.text }}>
              {room.otherName}
            </span>
            {room.subLabel && (
              <span className="text-[10px] px-2 py-0.5 rounded-full"
                    style={{ background: C.amberBg, color: C.amberText }}>
                {room.subLabel}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5 text-[12px]" style={{ color: C.textMuted }}>
            <span>🐱 {room.catName}</span>
            {room.hospitalName && <><span>·</span><span>🏥 {room.hospitalName}</span></>}
            <span>·</span>
            <span>📅 {fmtApptDate(room.apptDate)}</span>
          </div>
        </div>

        {/* Right side */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <StatusPill status={room.status} />
          {room.canChat ? (
            <div className="flex items-center gap-1 text-[11px] font-semibold"
                 style={{ color: C.olive }}>
              Open chat →
            </div>
          ) : (
            <div className="text-[10px]" style={{ color: C.textMuted }}>
              {room.status === 'pending' ? 'Awaiting confirmation' : 'Chat closed'}
            </div>
          )}
        </div>
      </div>

      {/* Bottom accent bar for active chats */}
      {room.canChat && (
        <div className="h-[3px] rounded-b-2xl"
             style={{ background:`linear-gradient(90deg, ${C.olive}, rgba(94,71,73,.3))` }} />
      )}
    </div>
  )
}
