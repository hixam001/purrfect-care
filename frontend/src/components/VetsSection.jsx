import { Link } from 'react-router-dom'
import { useFadeUp } from '../hooks/useScrollReveal.js'
import { Badge, GlassCard, BtnOlive, BtnOutline, Pill, Stars, PulseDot } from './ui/index.jsx'

const VETS = [
  {
    emoji: '👩‍⚕️',
    name:    'Dr. Aisha Mirza',
    spec:    'Feline Internist',
    stars:   5,
    reviews: 148,
    exp:     '8 yrs',
    online:  true,
    bg: 'linear-gradient(135deg,rgba(107,142,35,.14),rgba(107,142,35,.07))',
    glow: true,
  },
  {
    emoji: '👨‍⚕️',
    name:    'Dr. Omar Khalid',
    spec:    'Feline Surgeon',
    stars:   5,
    reviews: 92,
    exp:     '12 yrs',
    online:  false,
    avail:   'Available 3pm',
    bg: 'linear-gradient(135deg,rgba(196,140,56,.14),rgba(196,140,56,.07))',
  },
  {
    emoji: '👩‍⚕️',
    name:    'Dr. Sana Farooq',
    spec:    'Dermatologist',
    stars:   4,
    reviews: 67,
    exp:     '5 yrs',
    online:  true,
    bg: 'linear-gradient(135deg,rgba(107,142,35,.14),rgba(107,142,35,.07))',
    glow: true,
  },
  {
    emoji: '👨‍⚕️',
    name:    'Dr. Bilal Raza',
    spec:    'Nutritionist',
    stars:   5,
    reviews: 203,
    exp:     '15 yrs',
    online:  false,
    avail:   'Off Today',
    bg: 'linear-gradient(135deg,rgba(160,140,125,.14),rgba(160,140,125,.07))',
  },
]

function VetCard({ v }) {
  const glowStyle = v.glow
    ? { boxShadow: '0 0 0 5px rgba(107,142,35,.12), 0 0 0 10px rgba(107,142,35,.06)' }
    : {}

  return (
    <GlassCard className="p-6 text-center">
      {/* Avatar */}
      <div
        className="w-[68px] h-[68px] rounded-[20px] flex items-center justify-center text-[36px] mx-auto mb-3"
        style={{ background: v.bg, ...glowStyle }}
      >
        {v.emoji}
      </div>

      <div className="font-bold text-[14px] text-espresso mb-0.5">{v.name}</div>
      <div className="t-mono text-[10px] text-olive mb-2.5">{v.spec}</div>

      <div className="flex items-center justify-center gap-1 mb-2.5">
        <Stars rating={v.stars} className="text-[12px]" />
        <span className="text-[11px] text-clay-muted">({v.reviews})</span>
      </div>

      <div className="flex justify-center gap-1.5 flex-wrap mb-3">
        <Pill variant="green" className="text-[9px]">✓ Verified</Pill>
        <Pill variant="clay"  className="text-[9px]">{v.exp} exp</Pill>
      </div>

      {/* Status */}
      <div className="flex items-center justify-center gap-1.5 mb-4">
        {v.online ? (
          <>
            <PulseDot size="sm" />
            <span className="t-mono text-[10px] text-olive">Online Now</span>
          </>
        ) : (
          <>
            <div className="w-[7px] h-[7px] rounded-full flex-shrink-0" style={{ background: '#D7C9BD' }} />
            <span className="t-mono text-[10px] text-clay-muted">{v.avail}</span>
          </>
        )}
      </div>

      {v.online
        ? <Link to="/find-vets"><BtnOlive className="!w-full !justify-center !py-2.5">Book Consult</BtnOlive></Link>
        : <Link to="/find-vets"><BtnOutline className="!w-full !justify-center !py-2.5" style={{ borderColor: '#D7C9BD', color: '#A08C7D' }}>Schedule →</BtnOutline></Link>
      }
    </GlassCard>
  )
}

export default function VetsSection() {
  const headerRef = useFadeUp(0)
  const cardsRef  = useFadeUp(0.1)

  return (
    <section
      id="vets"
      style={{
        background:  'linear-gradient(180deg,#EFE5DC,#F5EBE6)',
        borderTop:   '1px solid #D7C9BD',
      }}
      className="py-24 px-4 md:px-8"
    >
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div
          ref={headerRef}
          className="fade-up flex items-end justify-between gap-6 flex-wrap mb-12"
        >
          <div>
            <Badge className="mb-3">UC-A2 · Veterinarians</Badge>
            <h2
              className="font-display font-black tracking-tight text-espresso mt-3"
              style={{ fontSize: 'clamp(1.8rem,3vw,2.6rem)' }}
            >
              Meet our verified vets.
            </h2>
          </div>
          <Link to="/find-vets"><BtnOutline>See all 200+ vets →</BtnOutline></Link>
        </div>

        {/* Cards */}
        <div
          ref={cardsRef}
          className="fade-up grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {VETS.map(v => <VetCard key={v.name} v={v} />)}
        </div>

      </div>
    </section>
  )
}
