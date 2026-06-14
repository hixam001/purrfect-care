import { useState } from 'react'
import { useFadeUp } from '../hooks/useScrollReveal.js'
import { Badge, Pill, Card, GlassCard } from '../components/ui/index.jsx'

const MEDICINES = [
  { name:'Amoxicillin',       tag:'Rx Required', tv:'clay',  cat:'Antibiotic',
    desc:'Antibiotic · Oral · 5–12.5 mg/kg q12h · Duration: 7–14 days',
    warn:'⚠ Penicillin allergy risk · Avoid in rabbits',
    details:'Broad-spectrum antibiotic effective against gram-positive and some gram-negative bacteria. Commonly used for URIs, skin infections, and dental abscesses in cats.',
    bg:'rgba(94,71,73,.06)', bd:'rgba(94,71,73,.18)' },
  { name:'Metronidazole',     tag:'OTC',          tv:'green', cat:'Antiprotozoal',
    desc:'Antiprotozoal / Antibiotic · Oral · 7.5 mg/kg q12h · Duration: 5–7 days',
    warn:null,
    details:'Used for gastrointestinal infections, giardia, and inflammatory bowel disease. Also has anti-inflammatory effects on the gut.',
    bg:'rgba(255,255,255,.5)', bd:'#b8ceb5' },
  { name:'Prednisolone',      tag:'Rx Required', tv:'clay',  cat:'Corticosteroid',
    desc:'Corticosteroid · Oral/Injectable · 1–2 mg/kg q24h',
    warn:'⚠ Do not use long-term without monitoring · Risk of diabetes',
    details:'Used for inflammation, allergies, asthma, and immune-mediated diseases. Cats tolerate corticosteroids better than dogs but long-term use requires monitoring.',
    bg:'rgba(196,140,56,.06)', bd:'rgba(196,140,56,.18)' },
  { name:'Gabapentin',        tag:'Rx Required', tv:'clay',  cat:'Analgesic',
    desc:'Analgesic / Anticonvulsant · Oral · 5–10 mg/kg q8-12h',
    warn:null,
    details:'Effective for chronic pain, neuropathic pain, and as a pre-visit anxiolytic. Commonly used before stressful vet visits.',
    bg:'rgba(160,140,125,.06)', bd:'rgba(160,140,125,.18)' },
  { name:'Onsior (Robenacoxib)', tag:'Rx Required', tv:'clay', cat:'NSAID',
    desc:'NSAID · Oral/Injectable · 1–2.4 mg/kg q24h · Max 3 days oral',
    warn:'⚠ Do not use with other NSAIDs or steroids · Monitor kidney function',
    details:'Feline-specific NSAID for short-term pain relief post-surgery or injury. Safe for short duration in healthy cats.',
    bg:'rgba(94,71,73,.06)', bd:'rgba(94,71,73,.18)' },
  { name:'Doxycycline',       tag:'Rx Required', tv:'clay',  cat:'Antibiotic',
    desc:'Antibiotic · Oral · 5–10 mg/kg q12-24h · Duration: 14–28 days',
    warn:'⚠ Always give with water/food · Risk of esophageal stricture if dry',
    details:'Used for respiratory infections, Mycoplasma, Chlamydia, and vector-borne diseases. Must always be followed with water.',
    bg:'rgba(94,71,73,.06)', bd:'rgba(94,71,73,.18)' },
]

const CATEGORIES = ['All', ...new Set(MEDICINES.map(m => m.cat))]

export default function MedicinesPage() {
  const headerRef = useFadeUp(0)
  const listRef   = useFadeUp(0.1)
  const [search, setSearch]   = useState('')
  const [cat,    setCat]      = useState('All')
  const [expand, setExpand]   = useState(null)

  const filtered = MEDICINES.filter(m =>
    (cat === 'All' || m.cat === cat) &&
    m.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <section className="max-w-5xl mx-auto px-4 md:px-8 py-16">

      {/* Header */}
      <div ref={headerRef} className="fade-up mb-8">
        <Badge className="mb-3">UC-1.10 · Medicine Database</Badge>
        <h1 className="font-display font-black text-espresso tracking-tight mb-2"
            style={{ fontSize:'clamp(2rem,4vw,3rem)' }}>
          Feline medicine library.
        </h1>
        <p className="text-clay-muted text-[15px] max-w-lg">
          Dosages, contraindications, breed warnings, and allergy cross-references — all in one place.
        </p>
      </div>

      <div ref={listRef} className="fade-up">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl flex-1 min-w-[220px]"
               style={{ background:'rgba(255,255,255,.8)', border:'1.5px solid #b8ceb5' }}>
            <span className="text-clay-muted">🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)}
                   placeholder="Search medicines…"
                   className="flex-1 bg-transparent outline-none text-[14px] text-espresso" />
          </div>
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCat(c)}
                    className="pill transition-all"
                    style={{
                      background: cat === c ? '#5e4749' : 'rgba(255,255,255,.7)',
                      color:      cat === c ? '#fff'    : '#4E342E',
                      border:     cat === c ? 'none'    : '1px solid #b8ceb5',
                    }}>
              {c}
            </button>
          ))}
        </div>

        <p className="t-mono text-[10px] text-clay-muted mb-4">
          SHOWING {filtered.length} OF {MEDICINES.length} MEDICINES · CLICK TO EXPAND
        </p>

        {/* Medicine cards */}
        <div className="flex flex-col gap-3">
          {filtered.map(m => (
            <div key={m.name}
                 className="rounded-2xl p-5 cursor-pointer transition-all duration-200"
                 style={{ background:m.bg, border:`1px solid ${m.bd}` }}
                 onClick={() => setExpand(expand === m.name ? null : m.name)}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-1.5">
                    <span className="font-bold text-[16px] text-espresso">💊 {m.name}</span>
                    <Pill variant={m.tv}><span style={{ fontSize:9 }}>{m.tag}</span></Pill>
                    <span className="t-label" style={{ fontSize:9 }}>{m.cat}</span>
                  </div>
                  <div className="text-[12px] text-clay-muted font-mono">{m.desc}</div>
                </div>
                <span className="text-clay-muted text-lg ml-4 flex-shrink-0 transition-transform duration-200"
                      style={{ transform: expand === m.name ? 'rotate(180deg)' : 'none' }}>▾</span>
              </div>

              {m.warn && (
                <div className="mt-2">
                  <Pill variant="amber"><span style={{ fontSize:10 }}>{m.warn}</span></Pill>
                </div>
              )}

              {/* Expanded details */}
              {expand === m.name && (
                <div className="mt-4 pt-4 border-t" style={{ borderColor: m.bd }}>
                  <div className="t-mono text-[10px] text-clay-muted mb-2">OVERVIEW</div>
                  <p className="text-[13px] text-espresso-soft leading-relaxed">{m.details}</p>
                  <div className="flex gap-2 mt-4">
                    <div className="flex-1 p-3 rounded-xl text-center"
                         style={{ background:'rgba(255,255,255,.5)', border:'1px solid #b8ceb5' }}>
                      <div className="t-mono text-[9px] text-clay-muted mb-1">ROUTE</div>
                      <div className="text-[12px] font-bold text-espresso">Oral / Injectable</div>
                    </div>
                    <div className="flex-1 p-3 rounded-xl text-center"
                         style={{ background:'rgba(255,255,255,.5)', border:'1px solid #b8ceb5' }}>
                      <div className="t-mono text-[9px] text-clay-muted mb-1">SPECIES</div>
                      <div className="text-[12px] font-bold text-espresso">Feline ✓</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">💊</div>
            <div className="font-bold text-espresso">No medicines found</div>
            <div className="text-clay-muted text-[13px] mt-1">Try adjusting your search</div>
          </div>
        )}

        {/* Disclaimer */}
        <div className="mt-8 p-5 rounded-2xl"
             style={{ background:'rgba(196,140,56,.08)', border:'1px solid rgba(196,140,56,.2)' }}>
          <div className="t-mono text-[10px] text-amber mb-2">⚠️ IMPORTANT DISCLAIMER</div>
          <p className="text-[13px] text-espresso-soft leading-relaxed">
            This database is for educational reference only. Dosages may vary based on individual cat weight, age, and health status.
            Always consult a licensed veterinarian before administering any medication.
          </p>
        </div>
      </div>
    </section>
  )
}
