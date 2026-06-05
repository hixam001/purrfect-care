import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useFadeUp } from '../hooks/useScrollReveal.js'
import { Badge, BtnOlive, BtnOutline, Stars, Pill, PulseDot, Card, GlassCard } from '../components/ui/index.jsx'

const VETS = [
  { e:'👩‍⚕️', name:'Dr. Aisha Mirza',  spec:'Feline Internist',  stars:5, reviews:148, exp:'8 yrs',  online:true,  clinic:'Green Paw Veterinary Clinic',  dist:'1.2 km', city:'Lahore',    fee:'₨ 1,500', bg:'linear-gradient(135deg,rgba(107,142,35,.14),rgba(107,142,35,.07))' },
  { e:'👨‍⚕️', name:'Dr. Omar Khalid',  spec:'Feline Surgeon',    stars:5, reviews:92,  exp:'12 yrs', online:false, clinic:'Feline Care Centre',           dist:'2.8 km', city:'Karachi',   fee:'₨ 2,000', bg:'linear-gradient(135deg,rgba(196,140,56,.14),rgba(196,140,56,.07))' },
  { e:'👩‍⚕️', name:'Dr. Sana Farooq',  spec:'Dermatologist',     stars:4, reviews:67,  exp:'5 yrs',  online:true,  clinic:'PawsFirst Animal Hospital',   dist:'0.9 km', city:'Islamabad', fee:'₨ 1,200', bg:'linear-gradient(135deg,rgba(107,142,35,.14),rgba(107,142,35,.07))' },
  { e:'👨‍⚕️', name:'Dr. Bilal Raza',   spec:'Nutritionist',      stars:5, reviews:203, exp:'15 yrs', online:false, clinic:'NutriPaws Clinic',             dist:'4.1 km', city:'Lahore',    fee:'₨ 2,500', bg:'linear-gradient(135deg,rgba(160,140,125,.14),rgba(160,140,125,.07))' },
  { e:'👩‍⚕️', name:'Dr. Nadia Shah',   spec:'Ophthalmologist',   stars:4, reviews:44,  exp:'7 yrs',  online:true,  clinic:'ClearSight Vet Eye Center',   dist:'3.5 km', city:'Karachi',   fee:'₨ 1,800', bg:'linear-gradient(135deg,rgba(107,142,35,.14),rgba(107,142,35,.07))' },
  { e:'👨‍⚕️', name:'Dr. Fahad Malik',  spec:'Cardiologist',      stars:5, reviews:77,  exp:'10 yrs', online:false, clinic:'HeartPaws Cardiology Clinic', dist:'5.0 km', city:'Islamabad', fee:'₨ 3,000', bg:'linear-gradient(135deg,rgba(196,140,56,.14),rgba(196,140,56,.07))' },
]

export default function FindVetsPage() {
  const headerRef = useFadeUp(0)
  const listRef   = useFadeUp(0.1)

  const [search,    setSearch]    = useState('')
  const [specialty, setSpecialty] = useState('All')
  const [onlineOnly,setOnlineOnly]= useState(false)

  const specs = ['All', ...new Set(VETS.map(v => v.spec))]
  const filtered = VETS.filter(v => {
    const matchName = v.name.toLowerCase().includes(search.toLowerCase()) ||
                      v.clinic.toLowerCase().includes(search.toLowerCase())
    const matchSpec = specialty === 'All' || v.spec === specialty
    const matchOnline = !onlineOnly || v.online
    return matchName && matchSpec && matchOnline
  })

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 py-16">

      {/* Header */}
      <div ref={headerRef} className="fade-up mb-10">
        <Badge className="mb-3">UC-A2 · Veterinarians</Badge>
        <h1 className="font-display font-black text-espresso tracking-tight mb-3"
            style={{ fontSize:'clamp(2rem,4vw,3rem)' }}>
          Find & book a vet.
        </h1>
        <p className="text-clay-muted text-[15px] max-w-lg">
          Browse 200+ verified feline specialists. Check real-time availability and confirm in seconds.
        </p>
      </div>

      {/* Filters */}
      <div ref={listRef} className="fade-up">
        <div className="flex flex-wrap gap-3 mb-6">
          {/* Search */}
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl flex-1 min-w-[220px]"
               style={{ background:'rgba(255,255,255,.8)', border:'1.5px solid #D7C9BD' }}>
            <span className="text-clay-muted">🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)}
                   placeholder="Search by name or clinic…"
                   className="flex-1 bg-transparent outline-none text-[14px] text-espresso" />
          </div>
          {/* Specialty pills */}
          <div className="flex flex-wrap gap-2">
            {specs.map(s => (
              <button key={s} onClick={() => setSpecialty(s)}
                      className="pill transition-all"
                      style={{
                        background: specialty === s ? '#556B2F' : 'rgba(255,255,255,.7)',
                        color:      specialty === s ? '#fff'    : '#4E342E',
                        border:     specialty === s ? 'none'    : '1px solid #D7C9BD',
                      }}>
                {s}
              </button>
            ))}
          </div>
          {/* Online toggle */}
          <button onClick={() => setOnlineOnly(o => !o)}
                  className="pill transition-all"
                  style={{
                    background: onlineOnly ? '#556B2F' : 'rgba(255,255,255,.7)',
                    color:      onlineOnly ? '#fff'    : '#4E342E',
                    border:     onlineOnly ? 'none'    : '1px solid #D7C9BD',
                  }}>
            <PulseDot size="sm" /> Online now
          </button>
        </div>

        {/* Results count */}
        <p className="text-[12px] text-clay-muted mb-4 t-mono">
          SHOWING {filtered.length} OF {VETS.length} VETS
        </p>

        {/* Vet cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(v => (
            <GlassCard key={v.name} className="p-6 text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-3"
                   style={{ background: v.bg, ...(v.online ? { boxShadow:'0 0 0 5px rgba(107,142,35,.12),0 0 0 10px rgba(107,142,35,.06)' } : {}) }}>
                {v.e}
              </div>
              <div className="font-bold text-[15px] text-espresso mb-0.5">{v.name}</div>
              <div className="t-mono text-[10px] text-olive mb-2">{v.spec}</div>

              <div className="flex items-center justify-center gap-2 mb-3">
                <Stars rating={v.stars} />
                <span className="text-[11px] text-clay-muted">({v.reviews})</span>
              </div>

              <div className="text-[12px] text-clay-muted mb-1">{v.clinic}</div>
              <div className="flex items-center justify-center gap-3 mb-3 flex-wrap">
                <Pill variant="green"><span className="text-[9px]">✓ Verified</span></Pill>
                <Pill variant="clay"><span className="text-[9px]">{v.exp} exp</span></Pill>
                <Pill variant="clay"><span className="text-[9px]">📍 {v.dist}</span></Pill>
              </div>

              <div className="flex items-center justify-center gap-2 mb-4">
                {v.online
                  ? <><PulseDot size="sm" /><span className="t-mono text-[10px] text-olive">Online Now</span></>
                  : <span className="t-mono text-[10px] text-clay-muted">Available later today</span>}
              </div>

              <div className="flex items-center justify-between mb-3">
                <span className="text-[12px] text-clay-muted">Consultation fee</span>
                <span className="font-bold text-[14px] text-espresso">{v.fee}</span>
              </div>

              {v.online
                ? <BtnOlive className="w-full justify-center !py-2.5">Book Consult</BtnOlive>
                : <BtnOutline className="w-full justify-center !py-2.5" style={{ borderColor:'#D7C9BD', color:'#A08C7D' }}>Schedule →</BtnOutline>}
            </GlassCard>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🔍</div>
            <div className="font-bold text-espresso mb-2">No vets found</div>
            <div className="text-clay-muted text-[13px]">Try adjusting your filters</div>
          </div>
        )}
      </div>
    </section>
  )
}
