import { useState, useRef, useEffect } from 'react'
import { useFadeUp } from '../hooks/useScrollReveal.js'
import { Badge, BtnOlive, Pill, Card } from '../components/ui/index.jsx'

const INITIAL_MESSAGES = [
  { from:'ai', text:'Hi! 👋 I\'m Luna\'s AI Health Companion. Describe any symptoms and I\'ll help assess the situation. Remember: I\'m a triage tool, not a replacement for a vet.' },
]

const QUICK_PROMPTS = [
  'My cat won\'t eat since yesterday',
  'She\'s sneezing and has watery eyes',
  'He\'s drinking a lot more water than usual',
  'My cat is limping on her back leg',
  'He keeps scratching his ears',
]

export default function AICompanionPage() {
  const headerRef = useFadeUp(0)
  const [messages, setMessages]   = useState(INITIAL_MESSAGES)
  const [input,    setInput]      = useState('')
  const [typing,   setTyping]     = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:'smooth' })
  }, [messages, typing])

  function simulateResponse(userMsg) {
    const lower = userMsg.toLowerCase()
    if (lower.includes('eat') || lower.includes('food') || lower.includes('appetite')) {
      return { text:'Reduced appetite can have many causes — stress, dental pain, nausea, or underlying illness. If it has been **more than 24 hours**, a vet visit is recommended. Watch for lethargy or weight loss.', severity:'moderate' }
    } else if (lower.includes('sneez') || lower.includes('eye') || lower.includes('watery')) {
      return { text:'These symptoms suggest **Upper Respiratory Infection (URI)** — the cat equivalent of a cold. Severity: Moderate. A vet visit within 48h is recommended. Keep your cat warm and ensure hydration.', severity:'moderate' }
    } else if (lower.includes('water') || lower.includes('drink') || lower.includes('thirst')) {
      return { text:'Increased thirst (polydipsia) can indicate **diabetes, kidney disease, or hyperthyroidism**. This should be assessed by a vet promptly — within 24–48h. Bring a urine sample if possible.', severity:'high' }
    } else if (lower.includes('limp') || lower.includes('leg') || lower.includes('paw')) {
      return { text:'Limping may indicate a **sprain, injury, or joint issue**. Check the paw for wounds or foreign objects. If limping is severe or the cat won\'t bear weight, see a vet today.', severity:'high' }
    } else if (lower.includes('scratch') || lower.includes('ear') || lower.includes('itch')) {
      return { text:'Ear scratching often points to **ear mites, infection, or allergies**. Look inside the ear for dark discharge or odour. A vet can diagnose and prescribe appropriate treatment.', severity:'low' }
    } else {
      return { text:'Thank you for sharing. Based on what you\'ve described, I recommend monitoring closely. If symptoms persist for more than 24 hours or worsen, please consult a vet. Is there anything more specific you can share?', severity:'low' }
    }
  }

  async function sendMessage(text) {
    if (!text.trim()) return
    const userMsg = text.trim()
    setMessages(m => [...m, { from:'user', text:userMsg }])
    setInput('')
    setTyping(true)

    await new Promise(r => setTimeout(r, 1400))
    const { text: reply, severity } = simulateResponse(userMsg)
    setMessages(m => [...m, { from:'ai', text:reply, severity }])
    setTyping(false)
  }

  const severityColor = { low:'#556B2F', moderate:'#8B6A14', high:'#9B2020' }
  const severityBg    = { low:'rgba(107,142,35,.1)', moderate:'rgba(196,140,56,.12)', high:'rgba(196,56,56,.08)' }

  return (
    <section className="max-w-5xl mx-auto px-4 md:px-8 py-16">

      {/* Header */}
      <div ref={headerRef} className="fade-up mb-8">
        <Badge className="mb-3">UC-1.11 · AI Companion</Badge>
        <h1 className="font-display font-black text-espresso tracking-tight mb-2"
            style={{ fontSize:'clamp(2rem,4vw,3rem)' }}>
          Instant feline triage. 24/7.
        </h1>
        <p className="text-clay-muted text-[15px] max-w-lg">
          Describe any symptom. Our AI cross-references thousands of feline records to give you an instant assessment.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        {/* Chat window */}
        <Card className="flex flex-col overflow-hidden" style={{ minHeight:520, maxHeight:620 }}>
          {/* Chat header */}
          <div className="px-5 py-4 flex items-center gap-3"
               style={{ borderBottom:'1px solid #D7C9BD', background:'rgba(255,255,255,.5)' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl"
                 style={{ background:'linear-gradient(135deg,rgba(107,142,35,.2),rgba(107,142,35,.1))' }}>🤖</div>
            <div>
              <div className="font-bold text-[14px] text-espresso">AI Health Companion</div>
              <div className="text-[11px] text-olive flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-olive-light inline-block" />
                Online · Powered by GPT-4
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.from === 'ai' && (
                  <div className="flex flex-col gap-1.5 max-w-[85%]">
                    <div className="bubble-vet" dangerouslySetInnerHTML={{
                      __html: msg.text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
                    }} />
                    {msg.severity && (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-mono font-bold"
                           style={{ background:severityBg[msg.severity], color:severityColor[msg.severity] }}>
                        Risk level: {msg.severity.charAt(0).toUpperCase() + msg.severity.slice(1)}
                      </div>
                    )}
                  </div>
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
            <form onSubmit={e => { e.preventDefault(); sendMessage(input) }}
                  className="flex items-center gap-2">
              <input value={input} onChange={e => setInput(e.target.value)}
                     placeholder="Describe your cat's symptoms…"
                     className="flex-1 px-4 py-2.5 rounded-xl text-[13px] text-espresso outline-none"
                     style={{ background:'rgba(255,255,255,.8)', border:'1.5px solid #D7C9BD' }} />
              <button type="submit" disabled={!input.trim() || typing}
                      className="btn btn-olive !py-2.5 !px-4 !text-[11px]"
                      style={{ opacity:(!input.trim() || typing) ? .5 : 1 }}>Send</button>
            </form>
          </div>
        </Card>

        {/* Sidebar */}
        <div className="flex flex-col gap-4">
          <Card className="p-5">
            <div className="t-mono text-[10px] text-olive mb-3">QUICK PROMPTS</div>
            <div className="flex flex-col gap-2">
              {QUICK_PROMPTS.map(p => (
                <button key={p} onClick={() => sendMessage(p)}
                        className="text-left px-3 py-2.5 rounded-xl text-[12px] text-espresso transition-all"
                        style={{ background:'rgba(107,142,35,.07)', border:'1px solid rgba(107,142,35,.15)' }}
                        onMouseOver={e => e.currentTarget.style.background='rgba(107,142,35,.14)'}
                        onMouseOut={e  => e.currentTarget.style.background='rgba(107,142,35,.07)'}>
                  💬 {p}
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <div className="t-mono text-[10px] text-clay-muted mb-3">⚠️ DISCLAIMER</div>
            <p className="text-[12px] text-clay-muted leading-relaxed">
              This AI companion provides general guidance only. It is not a substitute for professional veterinary care.
              Always consult a licensed vet for diagnosis and treatment.
            </p>
          </Card>
        </div>
      </div>
    </section>
  )
}
