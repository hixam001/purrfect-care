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

          {/* Real feature badges */}
          <div className="flex flex-wrap gap-3">
            <StatChip>
              <span>✅</span>
              <span className="text-[12px] font-bold text-espresso">Verified Hospitals</span>
            </StatChip>
            <StatChip>
              <span>🤖</span>
              <span className="text-[12px] font-bold text-espresso">AI Health Triage</span>
            </StatChip>
            <StatChip>
              <span>💬</span>
              <span className="text-[12px] font-bold text-espresso">Real-time Vet Chat</span>
            </StatChip>
          </div>
        </div>

        {/* ── Right: Mini-dashboard bento ─────────── */}
        <div className="grid grid-cols-2 gap-4">

          {/* Platform overview card — spans both columns */}
          <GlassCard
            className="col-span-2 p-6 glow-border"
            style={{ borderColor: 'rgba(107,142,35,.35)' }}
          >
            <div className="mb-4">
              <Badge className="mb-2">All-in-one Cat Care</Badge>
              <div className="font-display font-bold text-[15px] text-espresso mt-1.5">
                Everything your cat needs, in one place.
              </div>
              <div className="text-[12px] text-clay-muted mt-1.5 leading-relaxed">
                Book appointments with verified vets, chat post-visit,
                get AI-powered symptom triage, and order from curated cat stores —
                all from a single platform built for Pakistani cat parents.
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Pill variant="green">✅ Verified Hospitals</Pill>
              <Pill variant="clay">🐱 Cat Health Records</Pill>
              <Pill variant="amber">🤖 AI Companion</Pill>
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
