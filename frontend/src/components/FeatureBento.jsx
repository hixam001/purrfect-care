import { useFadeUp } from '../hooks/useScrollReveal.js'
import {
  Badge, Card, GlassCard,
  Pill, ProgressBar,
  FeatIcon, Stars,
  BubbleVet, BubbleUser,
} from './ui/index.jsx'

/* ── Sub-panels ──────────────────────────────────── */

function ClinicMap() {
  return (
    <Card className="md:col-span-8 p-7 relative overflow-hidden">
      {/* Decorative circle */}
      <div
        className="absolute top-0 right-0 w-48 h-48 rounded-full pointer-events-none opacity-[.07]"
        style={{ background: '#556B2F', transform: 'translate(30%,-30%)' }}
      />

      <Badge className="mb-4">UC-1.4 · Nearby Hospitals</Badge>
      <h3 className="font-display font-black text-[1.5rem] tracking-tight text-espresso mt-2 mb-2">
        Find clinics near you
      </h3>
      <p className="text-[14px] text-clay-muted leading-relaxed max-w-[440px] mb-5">
        DoorDash-style discovery of approved vet hospitals. Sort by distance, rating, or availability.
      </p>

      {/* Map mockup */}
      <div
        className="rounded-2xl p-4 relative"
        style={{
          background: 'rgba(107,142,35,.06)',
          border: '1px solid #D7C9BD',
          minHeight: '140px',
          backgroundImage:
            'linear-gradient(rgba(107,142,35,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(107,142,35,.07) 1px,transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      >
        {/* Pins */}
        <div className="absolute" style={{ top: '28%', left: '38%' }}>
          <div className="map-pin" />
        </div>
        <div className="absolute" style={{ top: '52%', left: '62%' }}>
          <div className="map-pin" style={{ background: '#A08C7D', boxShadow: '0 0 0 5px rgba(160,140,125,.2)' }} />
        </div>
        <div className="absolute" style={{ top: '18%', left: '72%' }}>
          <div className="map-pin" style={{ background: '#C48C38', boxShadow: '0 0 0 5px rgba(196,140,56,.2)' }} />
        </div>

        {/* Clinic cards */}
        <div className="absolute bottom-2 left-2 right-2 flex gap-2 overflow-x-auto">
          {[
            { name: 'Green Paw Clinic',   dist: '1.2 km', rating: 5 },
            { name: 'Feline Care Centre', dist: '2.8 km', rating: 4 },
          ].map(c => (
            <GlassCard key={c.name} className="flex-shrink-0 px-3 py-2 flex items-center gap-2.5" style={{ minWidth: 180 }}>
              <span className="text-[22px]">🏥</span>
              <div>
                <div className="text-[12px] font-bold text-espresso">{c.name}</div>
                <div className="flex items-center gap-1">
                  <Stars rating={c.rating} className="text-[10px]" />
                  <span className="text-[10px] text-clay-muted">· {c.dist}</span>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    </Card>
  )
}

function CatProfiles() {
  const cats = [
    { emoji: '🐱', name: 'Luna',  desc: 'Persian · 3y · ♀ · Spayed',  pill: 'Active',   variant: 'green', bg: 'rgba(107,142,35,.1)'  },
    { emoji: '🐈', name: 'Mochi', desc: 'Bengal · 1y · ♂ · Neutered', pill: 'Due shot', variant: 'amber', bg: 'rgba(196,140,56,.1)'  },
  ]

  return (
    <Card className="md:col-span-4 p-6">
      <Badge className="mb-4">UC-1.2 · Cat Profiles</Badge>
      <h3 className="font-display font-black text-[1.2rem] tracking-tight text-espresso mt-2 mb-2">
        Your fur family, organized.
      </h3>
      <p className="text-[13px] text-clay-muted leading-relaxed mb-4">
        Breed, age, allergies, vaccinations — all in one place.
      </p>

      <div className="flex flex-col gap-2.5">
        {cats.map(c => (
          <div
            key={c.name}
            className="flex items-center gap-3 p-3 rounded-[14px]"
            style={{ background: 'rgba(255,255,255,.65)', border: '1px solid #D7C9BD' }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-[22px] flex-shrink-0"
              style={{ background: c.bg }}
            >
              {c.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-[13px] text-espresso">{c.name}</div>
              <div className="text-[11px] text-clay-muted">{c.desc}</div>
            </div>
            <Pill variant={c.variant} className="text-[10px]">{c.pill}</Pill>
          </div>
        ))}

        <button
          className="w-full py-2.5 rounded-xl text-[10px] t-mono text-clay-muted transition-all duration-200"
          style={{ border: '1.5px dashed #D7C9BD', background: 'transparent', cursor: 'pointer' }}
          onMouseOver={e => { e.currentTarget.style.borderColor = '#556B2F'; e.currentTarget.style.color = '#556B2F' }}
          onMouseOut={e  => { e.currentTarget.style.borderColor = '#D7C9BD'; e.currentTarget.style.color = '#A08C7D' }}
        >
          + Add a cat
        </button>
      </div>
    </Card>
  )
}

function AICompanion() {
  return (
    <Card className="md:col-span-5 p-6" id="ai">
      <Badge className="mb-4">UC-1.11 · AI Companion</Badge>
      <h3 className="font-display font-black text-[1.2rem] tracking-tight text-espresso mt-2 mb-2">
        Instant feline triage. 24/7.
      </h3>
      <p className="text-[13px] text-clay-muted leading-relaxed mb-4">
        Describe any symptom. Our vector-powered AI cross-references thousands of feline records.
      </p>

      <div
        className="rounded-2xl p-3.5"
        style={{ background: 'rgba(255,255,255,.6)', border: '1px solid #D7C9BD' }}
      >
        <div className="flex flex-col gap-2 mb-3.5">
          <BubbleVet>Hi! Describe Luna's symptoms and I'll help assess. 🌿</BubbleVet>
          <BubbleUser>She's sneezing a lot and has watery eyes for 2 days</BubbleUser>
          <BubbleVet>
            Likely Upper Respiratory Infection. Severity:{' '}
            <strong style={{ color: '#8B6A14' }}>Moderate</strong>. Vet visit within 48h recommended.
          </BubbleVet>
        </div>

        <div className="flex items-center gap-2">
          <span className="t-mono text-[10px] text-clay-muted">Risk</span>
          <div className="prog-track flex-1">
            <div
              className="prog-fill"
              style={{ width: '45%', background: 'linear-gradient(90deg,#6B8E23,#C48C38)' }}
            />
          </div>
          <span className="t-mono text-[10px] text-amber">Moderate</span>
        </div>
      </div>
    </Card>
  )
}

function MedicineDB() {
  const meds = [
    {
      name: 'Amoxicillin',
      tag: 'Rx Required', tagVariant: 'clay',
      desc: 'Antibiotic · Oral · 5–12.5 mg/kg q12h',
      warn: '⚠ Penicillin allergy risk',
      bg: 'rgba(107,142,35,.06)', border: 'rgba(107,142,35,.18)',
    },
    {
      name: 'Metronidazole',
      tag: 'OTC', tagVariant: 'green',
      desc: 'Antiprotozoal · Oral · 7.5 mg/kg q12h',
      warn: null,
      bg: 'rgba(255,255,255,.5)', border: '#D7C9BD',
    },
  ]

  return (
    <Card className="md:col-span-4 p-6">
      <Badge className="mb-4">UC-1.10 · Medicine DB</Badge>
      <h3 className="font-display font-black text-[1.2rem] tracking-tight text-espresso mt-2 mb-2">
        Comprehensive medicine library.
      </h3>
      <p className="text-[13px] text-clay-muted leading-relaxed mb-4">
        Dosages, contraindications, breed warnings, allergy cross-references.
      </p>

      {/* Search bar */}
      <div
        className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl mb-3"
        style={{ background: 'rgba(255,255,255,.65)', border: '1px solid #D7C9BD' }}
      >
        <span className="text-clay-muted">🔍</span>
        <span className="t-mono text-[10px] text-clay-muted">Search "amoxicillin"…</span>
      </div>

      <div className="flex flex-col gap-2">
        {meds.map(m => (
          <div
            key={m.name}
            className="p-3 rounded-[13px]"
            style={{ background: m.bg, border: `1px solid ${m.border}` }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-[13px] text-espresso">💊 {m.name}</span>
              <Pill variant={m.tagVariant} className="text-[10px]">{m.tag}</Pill>
            </div>
            <div className="text-[11px] text-clay-muted">{m.desc}</div>
            {m.warn && (
              <Pill variant="amber" className="text-[10px] mt-1.5">{m.warn}</Pill>
            )}
          </div>
        ))}
      </div>
    </Card>
  )
}

function Prescriptions() {
  return (
    <Card className="md:col-span-3 p-6">
      <Badge className="mb-4">UC-2.5 · Prescriptions</Badge>
      <h3 className="font-display font-black text-[1.2rem] tracking-tight text-espresso mt-2 mb-2">
        Digital Rx tracking.
      </h3>
      <p className="text-[13px] text-clay-muted leading-relaxed mb-4">
        Issued by verified vets, linked to your cat's record.
      </p>

      <div className="flex flex-col gap-2.5">
        {/* Active Rx */}
        <div
          className="p-3 rounded-[13px]"
          style={{ background: 'rgba(107,142,35,.06)', border: '1px solid rgba(107,142,35,.22)' }}
        >
          <div className="t-mono text-[9px] text-olive mb-1">RX-2024-0091 · Active</div>
          <div className="font-bold text-[13px] text-espresso">Doxycycline 10mg</div>
          <div className="text-[11px] text-clay-muted mb-2">1× daily · 14 days · Luna</div>
          <ProgressBar pct={57} />
          <div className="t-mono text-[9px] text-clay-muted mt-1">Day 8 of 14</div>
        </div>

        {/* Completed Rx */}
        <div
          className="p-3 rounded-[13px]"
          style={{ background: 'rgba(255,255,255,.5)', border: '1px solid #D7C9BD' }}
        >
          <div className="t-mono text-[9px] text-clay-muted mb-1">RX-2024-0078 · Completed</div>
          <div className="font-bold text-[13px] text-espresso">Amoxicillin 50mg</div>
          <div className="text-[11px] text-clay-muted">2× daily · 7 days · Luna</div>
        </div>
      </div>
    </Card>
  )
}

/* ── Main ──────────────────────────────────────────── */
export default function FeatureBento() {
  const headerRef = useFadeUp(0)
  const bentoRef  = useFadeUp(0.1)

  return (
    <section id="features" className="max-w-7xl mx-auto px-4 md:px-8 py-24">

      {/* Header */}
      <div ref={headerRef} className="fade-up max-w-2xl mb-14">
        <Badge className="mb-4">Platform Features</Badge>
        <h2
          className="font-display font-black tracking-tight text-espresso mt-3 mb-4"
          style={{ fontSize: 'clamp(2rem,4vw,3rem)' }}
        >
          Everything your cat's<br />health journey needs.
        </h2>
        <p className="text-[16px] leading-[1.75] text-espresso-soft opacity-82">
          From booking a vet to buying organic kibble to asking our AI why your cat is acting strange at 3am — we've built it all with the care of a botanical apothecary.
        </p>
      </div>

      {/* 12-col bento */}
      <div
        ref={bentoRef}
        className="fade-up grid md:grid-cols-12 gap-4"
      >
        <ClinicMap />
        <CatProfiles />
        <AICompanion />
        <MedicineDB />
        <Prescriptions />
      </div>
    </section>
  )
}
