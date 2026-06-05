import { useFadeUp } from '../hooks/useScrollReveal.js'
import { Badge, Card, Stars } from './ui/index.jsx'

const REVIEWS = [
  {
    stars:  5,
    quote:  '"The AI companion diagnosed Luna\'s URI before our appointment. It was accurate and calming. I was panicking at midnight and it guided me through every step."',
    emoji:  '👩',
    name:   'Zainab K.',
    sub:    'Cat mom to Luna · Lahore',
    bg:     'rgba(107,142,35,.1)',
  },
  {
    stars:  5,
    quote:  '"Booking used to be a nightmare. Now it\'s 30 seconds. The digital prescription tracking is a game-changer — I never miss a dose for Mochi."',
    emoji:  '👨',
    name:   'Ahmad R.',
    sub:    'Cat dad to Mochi · Karachi',
    bg:     'rgba(196,140,56,.1)',
  },
  {
    stars:  5,
    quote:  '"As a vet, Purrfect Care transformed how I manage patients. The prescription module and patient history save me 40 minutes per consultation day."',
    emoji:  '👩‍⚕️',
    name:   'Dr. Sana F.',
    sub:    'Vet Dermatologist · Islamabad',
    bg:     'rgba(107,142,35,.1)',
  },
]

export default function Testimonials() {
  const headerRef = useFadeUp(0)
  const cardsRef  = useFadeUp(0.1)

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 py-24">

      <div ref={headerRef} className="fade-up text-center mb-14">
        <Badge className="mb-3">Cat Parent Stories</Badge>
        <h2
          className="font-display font-black tracking-tight text-espresso mt-3"
          style={{ fontSize: 'clamp(1.8rem,3vw,2.6rem)' }}
        >
          Loved by cat families.
        </h2>
      </div>

      <div
        ref={cardsRef}
        className="fade-up grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {REVIEWS.map(r => (
          <Card key={r.name} className="p-6">
            <Stars rating={r.stars} className="text-[18px] mb-4 block" />
            <p className="text-[14px] leading-[1.75] text-espresso-soft italic mb-5">
              {r.quote}
            </p>
            <div className="flex items-center gap-3">
              <div
                className="w-[38px] h-[38px] rounded-xl flex items-center justify-center text-[20px] flex-shrink-0"
                style={{ background: r.bg }}
              >
                {r.emoji}
              </div>
              <div>
                <div className="font-bold text-[13px] text-espresso">{r.name}</div>
                <div className="text-[11px] text-clay-muted">{r.sub}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

    </section>
  )
}
