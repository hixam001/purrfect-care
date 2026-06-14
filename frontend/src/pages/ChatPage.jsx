import { useState, useEffect, useRef } from 'react'
import { useParams, Link, Navigate }   from 'react-router-dom'
import { useAuth }   from '../context/AuthContext.jsx'
import { supabase }  from '../lib/supabaseClient.js'

export default function ChatPage() {
  const { appointmentId } = useParams()
  const { user }          = useAuth()

  const [appointment, setAppointment] = useState(null)
  const [chatRoom,    setChatRoom]    = useState(null)
  const [messages,    setMessages]    = useState([])
  const [input,       setInput]       = useState('')
  const [loading,     setLoading]     = useState(true)
  const [blocked,     setBlocked]     = useState(false)   // case closed or not authorised

  const bottomRef     = useRef(null)
  const channelRef    = useRef(null)

  /* ── Scroll to bottom ── */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:'smooth' })
  }, [messages])

  /* ── Load appointment + chat room ── */
  useEffect(() => {
    if (!user?.id) return

    async function load() {
      // Fetch appointment
      const { data: appt } = await supabase
        .from('appointments')
        .select(`
          id, case_status, status,
          cats ( name ),
          vets ( id, user_profiles ( id, name ) ),
          hospitals ( name )
        `)
        .eq('id', appointmentId)
        .eq('user_id', user.id)
        .single()

      if (!appt) { setBlocked(true); setLoading(false); return }
      if (appt.case_status !== 'open') { setBlocked(true); setLoading(false); setAppointment(appt); return }

      setAppointment(appt)

      // Get or create chat room for this appointment
      let { data: room } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('appointment_id', appointmentId)
        .maybeSingle()

      if (!room) {
        const { data: newRoom } = await supabase
          .from('chat_rooms')
          .insert({
            user_id:        user.id,
            vet_id:         appt.vets?.id,
            appointment_id: appointmentId,
          })
          .select()
          .single()
        room = newRoom
      }

      setChatRoom(room)

      // Load existing messages
      const { data: msgs } = await supabase
        .from('messages')
        .select(`
          id, content, sent_at, message_type,
          user_profiles ( id, name )
        `)
        .eq('chat_room_id', room.id)
        .order('sent_at', { ascending: true })

      setMessages(msgs ?? [])
      setLoading(false)

      // Subscribe to new messages
      channelRef.current = supabase
        .channel(`chat_room_${room.id}`)
        .on('postgres_changes', {
          event:  'INSERT',
          schema: 'public',
          table:  'messages',
          filter: `chat_room_id=eq.${room.id}`,
        }, payload => {
          setMessages(m => [...m, payload.new])
        })
        .subscribe()
    }

    load()

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current)
    }
  }, [appointmentId, user?.id])

  async function sendMessage(e) {
    e.preventDefault()
    if (!input.trim() || !chatRoom) return

    const text = input.trim()
    setInput('')

    await supabase.from('messages').insert({
      chat_room_id: chatRoom.id,
      sender_id:    user.id,
      content:      text,
      message_type: 'text',
    })
  }

  /* ── Blocked / case closed ── */
  if (!loading && blocked) return (
    <div className="min-h-screen flex items-center justify-center px-4"
         style={{ background:'linear-gradient(135deg,#F5EBE6,#EFE5DC)' }}>
      <div className="max-w-md w-full rounded-3xl p-10 text-center"
           style={{ background:'rgba(255,255,255,.85)', backdropFilter:'blur(12px)', border:'1px solid #D7C9BD' }}>
        <div className="text-5xl mb-4">🔒</div>
        <h2 className="font-display font-black text-[1.5rem] text-espresso mb-3">
          {!appointment ? 'Appointment not found' : 'Case is Closed'}
        </h2>
        <p className="text-clay-muted text-[13px] mb-6">
          {!appointment
            ? 'This appointment does not exist or doesn\'t belong to you.'
            : 'The hospital has closed this case. You can no longer chat with the vet for this appointment. Contact the hospital if you need to reopen it.'}
        </p>
        <Link to="/dashboard" className="btn btn-olive justify-center w-full !py-3 no-underline">
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  )

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background:'#F5EBE6' }}>
      <div className="text-clay-muted">Connecting…</div>
    </div>
  )

  const vetName  = appointment?.vets?.user_profiles?.name ?? 'Vet'
  const catName  = appointment?.cats?.name ?? 'Cat'
  const hospName = appointment?.hospitals?.name ?? 'Hospital'

  return (
    <div className="min-h-screen flex flex-col" style={{ background:'linear-gradient(135deg,#F5EBE6,#EFE5DC)' }}>

      {/* Header */}
      <header className="sticky top-0 z-50"
              style={{ background:'rgba(245,235,230,.92)', backdropFilter:'blur(18px)', borderBottom:'1px solid #D7C9BD' }}>
        <div className="max-w-3xl mx-auto px-4 md:px-6 h-16 flex items-center gap-4">
          <Link to="/dashboard" className="text-clay-muted hover:text-olive text-[13px]">←</Link>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl"
               style={{ background:'linear-gradient(135deg,rgba(107,142,35,.18),rgba(107,142,35,.08))' }}>
            👨‍⚕️
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-[15px] text-espresso truncate">{vetName}</div>
            <div className="text-[11px] text-clay-muted truncate">{hospName} · 🐱 {catName}</div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-olive-light" />
            <span className="text-[11px] text-olive font-mono">Case Open</span>
          </div>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto max-w-3xl w-full mx-auto px-4 md:px-6 py-6 flex flex-col gap-3">
        {messages.length === 0 && (
          <div className="text-center py-12 text-clay-muted text-[13px]">
            No messages yet. Say hello to {vetName}!
          </div>
        )}
        {messages.map(msg => {
          const isMe = msg.sender_id === user.id || msg.user_profiles?.id === user.id
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={isMe ? 'bubble-user max-w-[75%]' : 'bubble-vet max-w-[75%]'}>
                {!isMe && (
                  <div className="text-[10px] text-olive font-mono mb-1">
                    {msg.user_profiles?.name ?? vetName}
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
              style={{ background:'rgba(255,255,255,.85)', backdropFilter:'blur(12px)', border:'1px solid #D7C9BD' }}>
          <input value={input} onChange={e => setInput(e.target.value)}
                 placeholder={`Message ${vetName}…`}
                 className="flex-1 bg-transparent outline-none text-[14px] text-espresso px-2" />
          <button type="submit" disabled={!input.trim()}
                  className="btn btn-olive !py-2 !px-5 !text-[12px]"
                  style={{ opacity:!input.trim() ? .5 : 1 }}>
            Send
          </button>
        </form>
      </div>
    </div>
  )
}
