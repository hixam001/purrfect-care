import { useFadeUp } from '../hooks/useScrollReveal.js'
import { Badge, Card } from './ui/index.jsx'

export default function Testimonials() {
  const headerRef = useFadeUp(0)
  const ctaRef    = useFadeUp(0.1)

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 py-24">

      <div ref={headerRef} className="fade-up text-center mb-14">
        <Badge className="mb-3">Built for Cat Families</Badge>
        <h2
          className="font-display font-black tracking-tight text-espresso mt-3"
          style={{ fontSize: 'clamp(1.8rem,3vw,2.6rem)' }}
        >
          Designed with care.
        </h2>
        <p className="text-clay-muted text-[15px] mt-4 max-w-xl mx-auto">
          Purrfect Care was built from the ground up for cat owners in Pakistan — bringing
          together veterinary care, AI health support, and a curated cat store in one trusted platform.
        </p>
      </div>

      <div
        ref={ctaRef}
        className="fade-up grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {[
          {
            icon: '',
            title: 'For Cat Parents',
            desc: 'Book vet appointments, track your cat\'s health records, and get instant AI-powered guidance — all in one place.',
            bg: 'rgba(94,71,73,.1)',
          },
          {
            icon: '',
            title: 'For Veterinarians',
            desc: 'Manage appointments, view full patient history, issue digital prescriptions, and communicate with clients seamlessly.',
            bg: 'rgba(196,140,56,.1)',
          },
          {
            icon: '',
            title: 'For Hospitals',
            desc: 'Register your clinic, manage your vet team, handle appointment approvals, and grow your client base online.',
            bg: 'rgba(94,71,73,.1)',
          },
        ].map(f => (
          <Card key={f.title} className="p-6">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-4"
              style={{ background: f.bg }}
            >
              {f.icon}
            </div>
            <div className="font-bold text-[15px] text-espresso mb-2">{f.title}</div>
            <p className="text-[13px] text-clay-muted leading-relaxed">{f.desc}</p>
          </Card>
        ))}
      </div>

    </section>
  )
}
