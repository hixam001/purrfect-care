import { useState, useEffect, useRef } from 'react'
import { useParams, Link, Navigate }   from 'react-router-dom'
import { useAuth }   from '../context/AuthContext.jsx'
import { supabase }  from '../lib/supabaseClient.js'

const API = import.meta.env.VITE_API_URL ?? ''

export default function ChatPage() {
  const { appointmentId } = useParams()
  const { user }          = useAuth()

  const [appointment, setAppointment] = useState(null)
  const [chatRoom,    setChatRoom]    = useState(null)
  const [messages,    setMessages]    = useState([])
  const [myProfileId, setMyProfileId] = useState(null)
  const [vetName,     setVetName]     = useState('Your Vet')
  const [input,       setInput]       = useState('')
  const [loading,     setLoading]     = useState(true)
  const [blocked,     setBlocked]     = useState(false)
  const [chatError,   setChatError]   = useState(null)
  const [retryKey,    setRetryKey]    = useState(0)

  const bottomRef  = useRef(null)
  const channelRef = useRef(null)

  // ── Scroll to bottom ──
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:'smooth' })
  }, [messages])

  // ── Load appointment + chat room ──
  useEffect(() => {
    setChatError(null)
    if (!user?.id) return

    async function load() {
      const stored = localStorage.getItem('pc_token')
      if (!stored) { setBlocked(true); setLoading(false); return }

      // ── Phase 1: Verify identity + appointment ────────────────────────
      // Any failure here blocks the page (no token, not a participant, etc.)
      let appt
      try {
        const meRes = await fetch(`${API}/api/auth/me`, {
          headers: { Authorization: `Bearer ${stored}` },
        })
        if (!meRes.ok) {
          console.error('[ChatPage] /api/auth/me failed', meRes.status)
          setBlocked(true); setLoading(false); return
        }
        const myProfile = await meRes.json()
        setMyProfileId(myProfile.id)

        const apptRes = await fetch(`${API}/api/appointments/${appointmentId}`, {
          headers: { Authorization: `Bearer ${stored}` },
        })
        if (!apptRes.ok) {
          const detail = await apptRes.json().catch(() => ({}))
          console.error('[ChatPage] appointment fetch failed', apptRes.status, detail)
          setBlocked(true); setLoading(false); return
        }
        appt = await apptRes.json()
        setVetName(appt.vet_name ?? 'Your Vet')
        setAppointment(appt)

        // Only block for truly terminal statuses
        if (['cancelled', 'no_show'].includes(appt.status)) {
          setBlocked(true); setLoading(false); return
        }
      } catch (err) {
        console.error('[ChatPage] Phase 1 error:', err)
        setBlocked(true); setLoading(false); return
      }

      // ── Phase 2: Load chat room + messages ───────────────────────────
      // Errors here NEVER block the page — user still sees the chat UI
      try {
        const roomRes = await fetch(`${API}/api/appointments/${appointmentId}/chat-room`, {
          headers: { Authorization: `Bearer ${stored}` },
        })
        if (!roomRes.ok) {
          const detail = await roomRes.json().catch(() => ({}))
          const msg = detail?.detail ?? `Server error ${roomRes.status}`
          console.error('[ChatPage] chat-room fetch failed', roomRes.status, msg)
          setChatError(`Could not connect to chat (${roomRes.status}): ${msg}`)
          return
        }
        const room = await roomRes.json()
        setChatError(null)
        setChatRoom(room)

        const msgsRes = await fetch(`${API}/api/appointments/${appointmentId}/messages`, {
          headers: { Authorization: `Bearer ${stored}` },
        })
        const msgs = msgsRes.ok ? await msgsRes.json() : []
        setMessages(msgs)

        // Realtime: subscribe for live message updates
        channelRef.current = supabase
          .channel(`chat_room_${room.id}`)
          .on('postgres_changes', {
            event:  'INSERT',
            schema: 'public',
            table:  'messages',
            filter: `chat_room_id=eq.${room.id}`,
          }, payload => {
            setMessages(m => {
              const withoutOpt = m.filter(x => !String(x.id).startsWith('opt-'))
              const alreadyHas = withoutOpt.some(x => x.id === payload.new.id)
              return alreadyHas ? withoutOpt : [...withoutOpt, payload.new]
            })
          })
          .subscribe()

      } catch (err) {
        console.error('[ChatPage] Phase 2 (chat setup) error:', err)
        // Surface the error so the user can retry
        setChatError(`Chat connection error: ${err?.message ?? 'Unknown error'}`)
      } finally {
        setLoading(false)
      }
    }

    load()
  // retryKey is incremented by the Retry button to force re-run

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current)
    }
  }, [appointmentId, user?.id, retryKey])

  async function sendMessage(e) {
    e.preventDefault()
    if (!input.trim() || !chatRoom) return

    const text = input.trim()
    setInput('')

    // Optimistic: add message to UI immediately
    const optimistic = {
      id:           `opt-${Date.now()}`,
      content:      text,
      sent_at:      new Date().toISOString(),
      message_type: 'text',
      sender_id:    myProfileId,
      user_profiles: { id: myProfileId, name: 'You' },
    }
    setMessages(m => [...m, optimistic])

    // Send via backend (no Supabase session needed)
    const stored = localStorage.getItem('pc_token')
    const res = await fetch(`${API}/api/appointments/${appointmentId}/messages`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${stored}` },
      body:    JSON.stringify({ content: text }),
    })

    if (!res.ok) {
      console.error('[ChatPage] send failed', res.status)
      // Rollback optimistic message and restore input
      setMessages(m => m.filter(msg => msg.id !== optimistic.id))
      setInput(text)
    }
  }

  // ── Derive display values from appointment ──
  const hospName    = appointment?.hospitals?.name ?? ''
  const catName     = appointment?.cats?.name ?? 'your cat'
  const isVetViewer = myProfileId && appointment?.vet_id
    ? false  // simplified: chat opened from cat owner side by default
    : false
  const backTo = '/dashboard'

  if (!loading && blocked) return (
    <div className="min-h-screen flex items-center justify-center px-4"
         style={{ background:'linear-gradient(135deg,#dbe8d8,#EFE5DC)' }}>
      <div className="max-w-md w-full rounded-3xl p-10 text-center"
           style={{ background:'rgba(255,255,255,.85)', backdropFilter:'blur(12px)', border:'1px solid #b8ceb5' }}>
        <div className="text-5xl mb-4">🔒</div>
        <h2 className="font-display font-black text-[1.5rem] text-espresso mb-3">
          {!appointment ? 'Appointment not found' : 'Case is Closed'}
        </h2>
        <p className="text-clay-muted text-[13px] mb-6">
          {!appointment
            ? 'This appointment does not exist or you are not a participant.'
            : `This appointment has been ${appointment.status}. Chat is no longer available.`}
        </p>
        <Link to={backTo} className="btn btn-olive justify-center w-full !py-3 no-underline">
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  )

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background:'#dbe8d8' }}>
      <div className="text-clay-muted">Connecting…</div>
    </div>
  )

  const otherName = isVetViewer
    ? (appointment?.user_profiles?.name ?? 'Patient')
    : vetName

  return (
    <div className="min-h-screen flex flex-col" style={{ background:'linear-gradient(135deg,#dbe8d8,#EFE5DC)' }}>

      {/* Sub-header */}
      <div style={{ background:'rgba(219,232,216,.80)', backdropFilter:'blur(12px)', borderBottom:'1px solid #b8ceb5' }}>
        <div className="max-w-3xl mx-auto px-4 md:px-6 h-14 flex items-center gap-4">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
               style={{ background:'linear-gradient(135deg,rgba(94,71,73,.18),rgba(94,71,73,.08))' }}>
            {isVetViewer ? '🐱' : '👨‍⚕️'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-[14px] text-espresso truncate">
              {isVetViewer ? otherName : vetName}
            </div>
            <div className="text-[11px] text-clay-muted truncate">
              {hospName} · 🐱 {catName}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background:'#5e4749' }} />
            <span className="text-[11px] font-mono" style={{ color:'#5e4749' }}>Case Open</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto max-w-3xl w-full mx-auto px-4 md:px-6 py-6 flex flex-col gap-3">
        {/* Chat-room error banner with retry */}
        {chatError && (
          <div className="mx-auto max-w-sm mt-8 p-4 rounded-2xl text-center"
               style={{ background:'rgba(255,255,255,.85)', border:'1px solid #e2b9b9' }}>
            <div className="text-2xl mb-2">⚠️</div>
            <p className="text-[12px] text-clay-muted mb-3">{chatError}</p>
            <button
              onClick={() => { setLoading(true); setRetryKey(k => k + 1) }}
              className="btn btn-olive !py-2 !px-5 !text-[12px]">
              Retry Connection
            </button>
          </div>
        )}

        {messages.length === 0 && !chatError && (
          <div className="text-center py-12 text-clay-muted text-[13px]">
            No messages yet. {isVetViewer ? `Send a message to ${otherName}!` : `Say hello to ${vetName}!`}
          </div>
        )}
        {messages.map(msg => {
          const isMe = msg.sender_id === myProfileId
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={isMe ? 'bubble-user max-w-[75%]' : 'bubble-vet max-w-[75%]'}>
                {!isMe && (
                  <div className="text-[10px] text-olive font-mono mb-1">
                    {msg.user_profiles?.name ?? otherName}
                  </div>
                )}
                <div>{msg.content}</div>
                <div className="text-[9px] text-right mt-1 opacity-60">
                  {new Date(msg.sent_at).toLocaleTimeString('en-PK', { hour:'2-digit', minute:'2-digit' })}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </main>

      {/* Input */}
      <div className="sticky bottom-0 max-w-3xl w-full mx-auto px-4 md:px-6 pb-6">
        <form onSubmit={sendMessage}
              className="flex items-center gap-3 p-3 rounded-2xl"
              style={{ background:'rgba(255,255,255,.85)', backdropFilter:'blur(12px)', border:'1px solid #b8ceb5' }}>
          <input value={input} onChange={e => setInput(e.target.value)}
                 placeholder={`Message ${isVetViewer ? otherName : vetName}…`}
                 className="flex-1 bg-transparent outline-none text-[14px] text-espresso px-2" />
          <button type="submit" disabled={!input.trim() || !chatRoom}
                  className="btn btn-olive !py-2 !px-5 !text-[12px]"
                  style={{ opacity:(!input.trim() || !chatRoom) ? .5 : 1 }}>
            Send
          </button>
        </form>
      </div>
    </div>
  )
}
