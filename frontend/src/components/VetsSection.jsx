import { Link } from 'react-router-dom'
import { useFadeUp } from '../hooks/useScrollReveal.js'
import { Badge, BtnOlive, BtnOutline } from './ui/index.jsx'

export default function VetsSection() {
  const headerRef = useFadeUp(0)
  const ctaRef    = useFadeUp(0.1)

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
            <Badge className="mb-3">Veterinarians</Badge>
            <h2
              className="font-display font-black tracking-tight text-espresso mt-3"
              style={{ fontSize: 'clamp(1.8rem,3vw,2.6rem)' }}
            >
              Meet our verified vets.
            </h2>
            <p className="text-clay-muted text-[15px] mt-3 max-w-md">
              Every vet on Purrfect Care is a registered professional working within
              an approved veterinary hospital. Browse hospitals to see their current team.
            </p>
          </div>
          <Link to="/find-vets"><BtnOutline>Browse hospitals →</BtnOutline></Link>
        </div>

        {/* Feature highlights (real, not fake) */}
        <div
          ref={ctaRef}
          className="fade-up grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          {[
            { icon: '✅', title: 'Verified & Approved',    desc: 'Every vet is manually reviewed before being listed on the platform.' },
            { icon: '📋', title: 'Full Patient History',   desc: 'Vets access your cat\'s complete records and prescription history during consultations.' },
            { icon: '💬', title: 'Post-Appointment Chat',  desc: 'Stay in touch with your vet after the visit — chat is open while your case is active.' },
          ].map(f => (
            <div key={f.title}
              className="card p-6"
            >
              <div className="text-3xl mb-3">{f.icon}</div>
              <div className="font-bold text-[15px] text-espresso mb-2">{f.title}</div>
              <p className="text-clay-muted text-[13px] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
