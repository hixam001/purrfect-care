import { useFadeUp } from '../hooks/useScrollReveal.js'

const PILLARS = [
  { icon: '🏥', label: 'Verified Clinics',   desc: 'Every hospital is reviewed and approved before listing.' },
  { icon: '👨‍⚕️', label: 'Qualified Vets',    desc: 'All vets are registered professionals within partner hospitals.' },
  { icon: '🔒', label: 'Secure Platform',    desc: 'Your data and your cat\'s health records are always protected.' },
  { icon: '🌱', label: 'Growing Community', desc: 'Connecting cat families with trusted care across Pakistan.' },
]

export default function StatsBand() {
  const ref = useFadeUp(0)

  return (
    <section style={{ background: '#3D2616' }} className="py-20 px-4 md:px-8">
      <div
        ref={ref}
        className="fade-up max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
      >
        {PILLARS.map(p => (
          <div key={p.label}>
            <div
              className="text-4xl mb-3"
            >
              {p.icon}
            </div>
            <div
              className="font-display font-bold text-[15px] mb-1"
              style={{ color: '#F5EBE6' }}
            >
              {p.label}
            </div>
            <div
              className="text-[11px] leading-relaxed"
              style={{ color: 'rgba(245,235,230,.55)' }}
            >
              {p.desc}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
