import { useFadeUp } from '../hooks/useScrollReveal.js'

const STATS = [
  { value: '18k+', label: 'Cats Registered'  },
  { value: '340+', label: 'Partner Clinics'  },
  { value: '200+', label: 'Verified Vets'    },
  { value: '4.9★', label: 'Average Rating'   },
]

export default function StatsBand() {
  const ref = useFadeUp(0)

  return (
    <section style={{ background: '#3D2616' }} className="py-20 px-4 md:px-8">
      <div
        ref={ref}
        className="fade-up max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
      >
        {STATS.map(s => (
          <div key={s.label}>
            <div
              className="font-display font-black tracking-tight leading-none mb-2"
              style={{ fontSize: 'clamp(2.4rem,4vw,3rem)', color: '#F5EBE6' }}
            >
              {s.value}
            </div>
            <div
              className="t-mono text-[11px]"
              style={{ color: '#6B8E23' }}
            >
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
