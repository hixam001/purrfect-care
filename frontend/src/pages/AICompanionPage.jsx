import { useState, useRef, useEffect } from 'react'
import { Link }          from 'react-router-dom'
import { useAuth }       from '../context/AuthContext.jsx'
import { useFadeUp }     from '../hooks/useScrollReveal.js'
import { Badge, BtnOlive, Pill, Card } from '../components/ui/index.jsx'

const API = import.meta.env.VITE_API_URL ?? 'https://us-central1-purrfect-care-app.cloudfunctions.net'

const INITIAL_MESSAGES = [
  { from:'ai', text:'Hi! 👋 I\'m your AI Health Companion, powered by Gemini. Describe any symptoms and I\'ll help you assess the situation using trusted veterinary knowledge. Remember — I\'m a triage tool, not a replacement for a vet.' },
]

const QUICK_PROMPTS = [
  'My cat won\'t eat since yesterday',
  'She\'s sneezing and has watery eyes',
  'He\'s drinking a lot more water than usual',
  'My cat is limping on her back leg',
  'He keeps scratching his ears',
  'My cat is vomiting repeatedly',
]

export default function AICompanionPage() {
  const { token }       = useAuth()
  const headerRef       = useFadeUp(0)
  const [messages, setMessages] = useState(INITIAL_MESSAGES)
  const [input,    setInput]    = useState('')
  const [typing,   setTyping]   = useState(false)
  const [error,    setError]    = useState(null)
  const [rateLimited, setRateLimited] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:'smooth' })
  }, [messages, typing])

  async function sendMessage(text) {
    if (!text.trim() || typing || rateLimited) return
    const userMsg = text.trim()
    setMessages(m => [...m, { from:'user', text:userMsg }])
    setInput('')
    setTyping(true)
    setError(null)

    try {
      const res = await fetch(`${API}/api/ai/chat`, {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: userMsg }),
      })

      // Rate limited
      if (res.status === 429) {
        const retryAfter = res.headers.get('Retry-After') ?? 60
        setRateLimited(true)
        setTimeout(() => setRateLimited(false), Number(retryAfter) * 1000)
        setMessages(m => [...m, {
          from:'ai',
          text:`🚦 You've sent a lot of messages! Please wait ${retryAfter} seconds before asking again.`,
        }])
        return
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail ?? `API error ${res.status}`)
      }

      const data  = await res.json()
      // Backend returns { answer, sources, retrieved_count }
      const reply = data.answer ?? data.response ?? data.message ?? 'Sorry, I could not get a response.'

      setMessages(m => [...m, { from:'ai', text: reply }])
    } catch (e) {
      setError(e.message)
      setMessages(m => [...m, {
        from:'ai',
        text:'⚠️ I\'m having trouble connecting right now. This is likely a temporary issue — please try again in a moment.',
      }])
    } finally {
      setTyping(false)
    }
  }

  return (
    <div className="min-h-screen">
      <section className="max-w-5xl mx-auto px-4 md:px-8 py-10">

        {/* Header */}
        <div ref={headerRef} className="fade-up mb-8">
          <Badge className="mb-3">AI Companion</Badge>
          <h1 className="font-display font-black text-espresso tracking-tight mb-2"
              style={{ fontSize:'clamp(2rem,4vw,3rem)' }}>
            Instant feline triage. 24/7.
          </h1>
          <p className="text-clay-muted text-[15px] max-w-lg">
            Describe any symptom. Our AI cross-references trusted veterinary knowledge to give you an instant, grounded assessment.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
          {/* Chat window */}
          <Card className="flex flex-col overflow-hidden" style={{ minHeight:520, maxHeight:620 }}>
            {/* Chat header */}
            <div className="px-5 py-4 flex items-center gap-3"
                 style={{ borderBottom:'1px solid #b8ceb5', background:'rgba(255,255,255,.5)' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl"
                   style={{ background:'linear-gradient(135deg,rgba(94,71,73,.2),rgba(94,71,73,.1))' }}>🤖</div>
              <div>
                <div className="font-bold text-[14px] text-espresso">AI Health Companion</div>
                <div className="text-[11px] text-olive flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-olive-light inline-block" />
                  Online · Powered by Gemini
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.from === 'ai' && (
                    <div className="bubble-vet max-w-[85%]"
                         dangerouslySetInnerHTML={{
                           __html: msg.text
                             .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
                             .replace(/\n/g, '<br/>'),
                         }} />
                  )}
                  {msg.from === 'user' && (
                    <div className="bubble-user max-w-[75%]">{msg.text}</div>
                  )}
                </div>
              ))}
              {typing && (
                <div className="flex justify-start">
                  <div className="bubble-vet">
                    <span className="flex gap-1">
                      {[0,1,2].map(i => (
                        <span key={i} className="w-1.5 h-1.5 rounded-full bg-clay-muted inline-block"
                              style={{ animation:`pulse-ring .8s ease-in-out ${i * .2}s infinite` }} />
                      ))}
                    </span>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-clay" style={{ background:'rgba(255,255,255,.5)' }}>
              {rateLimited && (
                <div className="mb-2 px-3 py-2 rounded-lg text-[11px] font-semibold text-center"
                     style={{ background:'rgba(196,140,56,.1)', color:'#8a6320', border:'1px solid rgba(196,140,56,.3)' }}>
                  🚦 Rate limit reached — please wait a moment before sending another message.
                </div>
              )}
              <form onSubmit={e => { e.preventDefault(); sendMessage(input) }}
                    className="flex items-center gap-2">
                <input value={input} onChange={e => setInput(e.target.value)}
                       placeholder="Describe your cat's symptoms…"
                       disabled={rateLimited}
                       className="flex-1 px-4 py-2.5 rounded-xl text-[13px] text-espresso outline-none"
                       style={{ background:'rgba(255,255,255,.8)', border:'1.5px solid #b8ceb5',
                                opacity: rateLimited ? .5 : 1 }} />
                <button type="submit" disabled={!input.trim() || typing || rateLimited}
                        className="btn btn-olive !py-2.5 !px-4 !text-[11px]"
                        style={{ opacity:(!input.trim() || typing || rateLimited) ? .5 : 1 }}>Send</button>
              </form>
              {error && (
                <p className="text-[11px] mt-2" style={{ color:'#9B2020' }}>⚠️ {error}</p>
              )}
            </div>
          </Card>

          {/* Sidebar */}
          <div className="flex flex-col gap-4">
            <Card className="p-5">
              <div className="t-mono text-[10px] text-olive mb-3">QUICK PROMPTS</div>
              <div className="flex flex-col gap-2">
                {QUICK_PROMPTS.map(p => (
                  <button key={p} onClick={() => sendMessage(p)} disabled={typing}
                          className="text-left px-3 py-2.5 rounded-xl text-[12px] text-espresso transition-all"
                          style={{ background:'rgba(94,71,73,.07)', border:'1px solid rgba(94,71,73,.15)',
                                   opacity: typing ? .5 : 1 }}
                          onMouseOver={e => { if (!typing) e.currentTarget.style.background='rgba(94,71,73,.14)' }}
                          onMouseOut={e  => e.currentTarget.style.background='rgba(94,71,73,.07)'}>
                    💬 {p}
                  </button>
                ))}
              </div>
            </Card>

            <Card className="p-5">
              <div className="t-mono text-[10px] text-clay-muted mb-3">⚠️ DISCLAIMER</div>
              <p className="text-[12px] text-clay-muted leading-relaxed">
                This AI companion provides general guidance based on published veterinary knowledge. It is not a substitute for professional veterinary care. Always consult a licensed vet for diagnosis and treatment.
              </p>
            </Card>
          </div>
        </div>
      </section>
    </div>
  )
}
