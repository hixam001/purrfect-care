import { Link } from 'react-router-dom'
import { useFadeUp } from '../hooks/useScrollReveal.js'
import { BtnOlive, BtnGhostLight } from './ui/index.jsx'

export default function CTABanner() {
  const ref = useFadeUp(0)

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 pb-24">
      <div
        ref={ref}
        className="fade-up rounded-[28px] px-10 py-20 md:px-16 text-center relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg,#5e4749 0%,#4a373a 100%)' }}
      >
        {/* Decorative circles */}
        <div
          className="absolute top-0 left-0 w-72 h-72 rounded-full pointer-events-none"
          style={{ background: 'rgba(255,255,255,.07)', transform: 'translate(-40%,-40%)' }}
        />
        <div
          className="absolute bottom-0 right-0 w-56 h-56 rounded-full pointer-events-none"
          style={{ background: 'rgba(255,255,255,.06)', transform: 'translate(35%,40%)' }}
        />
        <div
          className="absolute top-1/2 left-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{ background: 'rgba(94,71,73,.15)', transform: 'translate(-50%,-50%)' }}
        />

        {/* Eyebrow label */}
        <span
          className="inline-block px-3.5 py-1.5 rounded-lg font-mono text-[10px] font-bold uppercase tracking-[.1em] mb-6 relative"
          style={{ background: 'rgba(255,255,255,.14)', color: 'rgba(219,232,216,.95)' }}
        >
          Organic Apothecary · Feline Sanctuary
        </span>

        {/* Headline */}
        <h2
          className="font-display font-black tracking-tight leading-[1.05] relative mb-4"
          style={{
            fontSize: 'clamp(2rem,4vw,3.4rem)',
            color: '#dbe8d8',
          }}
        >
          Your cat's health.<br />Finally, simplified.
        </h2>

        <p
          className="text-[16px] max-w-lg mx-auto leading-[1.7] mb-9 relative"
          style={{ color: 'rgba(219,232,216,.75)' }}
        >
          Join 18,000+ cat families who trust Purrfect Care for every paw, purr, and prescription.
        </p>

        {/* Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 relative">
          <Link
            to="/register"
            className="btn"
            style={{ background: '#dbe8d8', color: '#3a2c2d' }}
          >
            Register your cat — it's free
          </Link>
          <Link to="/login"><BtnGhostLight>Learn more →</BtnGhostLight></Link>
        </div>

      </div>
    </section>
  )
}
