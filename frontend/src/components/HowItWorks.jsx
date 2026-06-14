import { Link } from 'react-router-dom'
import { useFadeUp } from '../hooks/useScrollReveal.js'
import { Badge, BtnOlive } from './ui/index.jsx'

const STEPS = [
  {
    
    step:  'Step 01',
    title: 'Register your cat',
    desc:  'Add breed, age, weight, allergies, and medical history. Under 2 minutes.',
    style: {
      background: 'linear-gradient(135deg,#dbe8d8,#EFE5DC)',
      border:     '2px solid #b8ceb5',
    },
  },
  {
    
    step:  'Step 02',
    title: 'Find & book a vet',
    desc:  'Browse verified clinics, check real-time availability, and confirm in seconds.',
    style: {
      background: 'linear-gradient(135deg,rgba(94,71,73,.1),rgba(85,107,47,.18))',
      border:     '2px solid rgba(94,71,73,.28)',
    },
  },
  {
    
    step:  'Step 03',
    title: 'Track & heal',
    desc:  'Digital prescriptions, progress tracking, vet chat, and recovery shopping — all connected.',
    style: {
      background: 'linear-gradient(135deg,rgba(196,140,56,.12),rgba(196,140,56,.2))',
      border:     '2px solid rgba(196,140,56,.28)',
    },
  },
]

export default function HowItWorks() {
  const headerRef = useFadeUp(0)
  const stepsRef  = useFadeUp(0.1)
  const ctaRef    = useFadeUp(0.2)

  return (
    <section
      id="how"
      style={{ background: '#EFE5DC', borderTop: '1px solid #b8ceb5' }}
      className="py-24 px-4 md:px-8"
    >
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div ref={headerRef} className="fade-up text-center mb-16">
          <Badge className="mb-3">Simple by Design</Badge>
          <h2
            className="font-display font-black tracking-tight text-espresso mt-3"
            style={{ fontSize: 'clamp(2rem,4vw,2.8rem)' }}
          >
            Care in three steps.
          </h2>
        </div>

        {/* Steps */}
        <div
          ref={stepsRef}
          className="fade-up grid grid-cols-1 md:grid-cols-3 gap-12 relative"
        >
          {/* Desktop connector line */}
          <div
            className="hidden md:block absolute pointer-events-none"
            style={{
              top: '52px', left: '22%', right: '22%',
              height: '1px',
              background: 'linear-gradient(to right,transparent,#b8ceb5,#b8ceb5,transparent)',
            }}
          />

          {STEPS.map(s => (
            <div key={s.step} className="text-center">
              <div
                className="w-[88px] h-[88px] rounded-[24px] flex items-center justify-center text-[38px] mx-auto mb-5"
                style={{ ...s.style, boxShadow: '0 4px 16px rgba(61,38,22,.07)' }}
              >
                {s.emoji}
              </div>
              <Badge className="mb-3">{s.step}</Badge>
              <h3 className="font-display font-black text-[1.15rem] tracking-tight text-espresso mt-2.5 mb-2">
                {s.title}
              </h3>
              <p className="text-[14px] text-clay-muted leading-[1.7]">{s.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div ref={ctaRef} className="fade-up text-center mt-14">
          <Link to="/register"><BtnOlive>Start your cat's health journey</BtnOlive></Link>
        </div>

      </div>
    </section>
  )
}
