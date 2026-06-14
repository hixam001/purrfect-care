import { useEffect, useState, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import MobileLayout from '../../layouts/MobileLayout'

const API = import.meta.env.VITE_API_URL ?? 'https://us-central1-purrfect-care-app.cloudfunctions.net'

const SUGGESTIONS = [
  "My cat won't eat since yesterday",
  "She's sneezing and has watery eyes",
  "He's drinking a lot more water than usual",
  "My cat is limping on her back leg",
  "He keeps scratching his ears",
  "My cat is vomiting repeatedly",
]

function Bubble({ msg }) {
  const isUser = msg.from === 'user'
  return (
    <div className={`flex items-end gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-base"
          style={{ backgroundColor: 'rgba(94,71,73,0.12)' }}
        >🤖</div>
      )}
      <div
        className={`max-w-[80%] px-4 py-2.5 text-sm leading-relaxed`}
        style={{
          backgroundColor: isUser ? '#5e4749' : '#ffffff',
          border: isUser ? 'none' : '1px solid #b8ceb5',
          color: isUser ? '#ffffff' : '#3a2c2d',
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
        }}
        dangerouslySetInnerHTML={{
          __html: msg.text
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br/>'),
        }}
      />
    </div>
  )
}

export default function MobileAIChat() {
  const { token } = useAuth()
  const bottomRef = useRef(null)
  const [messages,    setMessages]    = useState([
    { from: 'ai', text: "Hi! 👋 I'm your AI Health Companion, powered by Gemini. Describe any symptoms and I'll help you assess the situation using trusted veterinary knowledge." }
  ])
  const [input,       setInput]       = useState('')
  const [loading,     setLoading]     = useState(false)
  const [rateLimited, setRateLimited] = useState(false)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function send(text) {
    const q = (text ?? input).trim()
    if (!q || loading || rateLimited) return
    setInput('')
    setMessages(prev => [...prev, { from: 'user', text: q }])
    setLoading(true)

    try {
      const res = await fetch(`${API}/api/ai/chat`, {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: q }),
      })

      if (res.status === 429) {
        const retryAfter = res.headers.get('Retry-After') ?? 60
        setRateLimited(true)
        setTimeout(() => setRateLimited(false), Number(retryAfter) * 1000)
        setMessages(prev => [...prev, {
          from: 'ai',
          text: `🚦 You've sent a lot of messages! Please wait ${retryAfter} seconds before asking again.`,
        }])
        return
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail ?? `API error ${res.status}`)
      }

      const data  = await res.json()
      const reply = data.answer ?? data.response ?? data.message ?? 'Sorry, I couldn\'t get a response. Please try again.'
      setMessages(prev => [...prev, { from: 'ai', text: reply }])
    } catch (e) {
      setMessages(prev => [...prev, {
        from: 'ai',
        text: '⚠️ I\'m having trouble connecting right now. Please try again in a moment.',
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-screen" style={{ backgroundColor: '#dbe8d8' }}>

      {/* ── Header ── */}
      <header
        className="flex items-center gap-3 px-4 pt-4 pb-3 sticky top-0 z-40"
        style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #b8ceb5' }}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
          style={{ backgroundColor: '#5e4749' }}
        >🤖</div>
        <div>
          <p className="font-display font-bold text-base" style={{ color: '#3a2c2d' }}>AI Companion</p>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: '#7a5e60' }} />
            <p className="text-[11px]" style={{ color: '#5e4749', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              Online · Powered by Gemini
            </p>
          </div>
        </div>
      </header>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ paddingBottom: 88 }}>
        {messages.map((m, i) => <Bubble key={i} msg={m} />)}

        {/* Typing indicator */}
        {loading && (
          <div className="flex items-end gap-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-base flex-shrink-0"
              style={{ backgroundColor: 'rgba(94,71,73,0.12)' }}
            >🤖</div>
            <div
              className="px-4 py-3 rounded-2xl rounded-bl-sm"
              style={{ backgroundColor: '#ffffff', border: '1px solid #b8ceb5' }}
            >
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <span
                    key={i}
                    className="w-2 h-2 rounded-full inline-block"
                    style={{
                      backgroundColor: '#7a5e60',
                      animation: `bounce 1s ease-in-out ${i * 0.15}s infinite`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Suggestion chips — only on first message */}
        {messages.length <= 1 && !loading && (
          <div className="space-y-2 mt-3">
            <p className="text-xs font-semibold" style={{ color: '#7a5e60', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              Try asking:
            </p>
            {SUGGESTIONS.map(s => (
              <button
                key={s}
                onClick={() => send(s)}
                className="w-full text-left px-4 py-2.5 rounded-xl text-sm transition-all active:scale-95"
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #b8ceb5',
                  color: '#3a2c2d',
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  boxShadow: '0 2px 6px rgba(45,27,14,0.05)',
                }}
              >
                💬 {s}
              </button>
            ))}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input bar ── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 flex items-center gap-2 px-4 py-3"
        style={{
          backgroundColor: '#ffffff',
          borderTop: '1px solid #b8ceb5',
          paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))',
        }}
      >
        {rateLimited && (
          <p className="absolute -top-8 left-4 right-4 text-center text-xs font-semibold px-3 py-1.5 rounded-lg"
            style={{ backgroundColor: 'rgba(184,124,42,0.12)', color: '#7A4F10', border: '1px solid rgba(184,124,42,0.25)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            🚦 Rate limit reached — please wait a moment
          </p>
        )}
        <input
          className="flex-1 px-4 py-3 rounded-2xl text-sm outline-none"
          style={{
            backgroundColor: '#eef4ec',
            border: '1.5px solid #b8ceb5',
            color: '#3a2c2d',
            fontFamily: 'Plus Jakarta Sans, sans-serif',
          }}
          placeholder="Describe your cat's symptoms…"
          value={input}
          disabled={rateLimited}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); send() } }}
        />
        <button
          onClick={() => send()}
          disabled={!input.trim() || loading || rateLimited}
          className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 text-lg transition-all active:scale-90 disabled:opacity-40"
          style={{ backgroundColor: '#5e4749' }}
          aria-label="Send message"
        >
          🐾
        </button>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  )
}
