import { Link } from 'react-router-dom'
import { useFadeUp } from '../hooks/useScrollReveal.js'
import {
  Badge, GlassCard, Card,
  BtnOlive, BtnOutline,
  PulseDot, StatChip, Stars,
  ProgressBar, Pill,
  BubbleVet, BubbleUser,
  FeatIcon,
} from './ui/index.jsx'

export default function Hero() {
  const ref1 = useFadeUp(0)
  const ref2 = useFadeUp(0.1)

  return (
    <section
      id="hero"
      className="max-w-7xl mx-auto px-4 md:px-8 pt-20 pb-16"
    >
      {/* Status row */}
      <div ref={ref1} className="fade-up flex items-center gap-4 mb-10">
        <Badge>Organic Apothecary · Feline Sanctuary</Badge>
        <div className="flex items-center gap-2">
          <PulseDot />
          <span className="t-mono text-[10px] text-clay-muted">12 Vets Online Now</span>
        </div>
      </div>

      {/* Two-column grid */}
      <div ref={ref2} className="fade-up grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

        {/* ── Left: Headline ──────────────────────── */}
        <div>
          <h1
            className="font-display font-black tracking-tight text-espresso leading-[1.05] mb-6"
            style={{ fontSize: 'clamp(3rem,5vw,5rem)' }}
          >
            The sanctuary<br />
            <span className="text-olive">your cat</span><br />
            deserves.
          </h1>

          <p className="text-[17px] leading-relaxed text-espresso-soft opacity-88 max-w-md mb-8">
            Veterinary appointments, real-time vet chat, AI-powered health companion, curated organic cat store — all in one beautifully grounded platform.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-3 mb-9">
            <Link to="/find-vets"><BtnOlive>🐾 Book a Vet Today</BtnOlive></Link>
            <a href="#features"><BtnOutline>Explore Platform →</BtnOutline></a>
          </div>

          {/* Proof chips */}
          <div className="flex flex-wrap gap-3">
            <StatChip>
              <Stars rating={5} className="text-[13px]" />
              <span className="text-[12px] font-bold text-espresso">4.9 / 5</span>
              <span className="text-[11px] text-clay-muted">· 2,400+ reviews</span>
            </StatChip>
            <StatChip>
              <span>🏥</span>
              <span className="text-[12px] font-bold text-espresso">340+ Clinics</span>
            </StatChip>
            <StatChip>
              <span>🐱</span>
              <span className="text-[12px] font-bold text-espresso">18k+ Cats</span>
            </StatChip>
          </div>
        </div>

        {/* ── Right: Mini-dashboard bento ─────────── */}
        <div className="grid grid-cols-2 gap-4">

          {/* Appointment card — spans both columns */}
          <GlassCard
            className="col-span-2 p-6 glow-border"
            style={{ borderColor: 'rgba(107,142,35,.35)' }}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <Badge className="mb-2">Next Appointment</Badge>
                <div className="font-display font-bold text-[15px] text-espresso mt-1.5">
                  Dr. Aisha Mirza, DVM
                </div>
                <div className="text-[12px] text-clay-muted mt-0.5">
                  Green Paw Veterinary Clinic · 1.2 km
                </div>
              </div>
              <div className="text-center flex-shrink-0">
                <div className="font-mono font-black text-[28px] leading-none text-olive">14</div>
                <div className="t-mono text-[10px] text-clay-muted">June</div>
              </div>
            </div>

            <div className="flex items-center gap-3 mb-3">
              <ProgressBar pct={65} className="flex-1" />
              <span className="t-mono text-[10px] text-olive flex-shrink-0">10:30 AM</span>
            </div>

            <div className="flex flex-wrap gap-2">
              <Pill variant="green">✓ Confirmed</Pill>
              <Pill variant="clay">🐱 Luna · Persian · 3y</Pill>
              <Pill variant="amber">💉 Vaccination</Pill>
            </div>
          </GlassCard>

          {/* AI Companion mini */}
          <Card className="p-4">
            <FeatIcon className="mb-3">🤖</FeatIcon>
            <Badge className="mb-2">AI Companion</Badge>
            <div className="font-display font-bold text-[14px] text-espresso mt-1.5 mb-2">
              Symptom Triage
            </div>
            <div
              className="rounded-xl p-2.5"
              style={{
                background: 'rgba(107,142,35,.07)',
                border: '1px dashed rgba(107,142,35,.3)',
              }}
            >
              <span className="t-mono text-[10px] text-olive">
                "My cat won't eat since yesterday…"
              </span>
            </div>
          </Card>

          {/* Vet Chat mini */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <FeatIcon>💬</FeatIcon>
              <PulseDot />
            </div>
            <Badge className="mb-2">Vet Chat</Badge>
            <div className="flex flex-col gap-2 mt-2.5">
              <BubbleVet>Is Luna drinking water normally?</BubbleVet>
              <BubbleUser>Yes, about the same 💧</BubbleUser>
            </div>
          </Card>

        </div>
      </div>
    </section>
  )
}
