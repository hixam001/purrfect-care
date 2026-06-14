import { useState, useEffect } from 'react'
import { Link }                from 'react-router-dom'
import { supabase }            from '../lib/supabaseClient.js'
import { useGeolocation, sortByDistance, fmtDist } from '../hooks/useGeolocation.js'
import { useFadeUp }           from '../hooks/useScrollReveal.js'
import { Badge, BtnOlive, Pill, GlassCard, Card } from '../components/ui/index.jsx'

export default function StorePage() {
  const headerRef = useFadeUp(0)
  const listRef   = useFadeUp(0.1)

  const { coords, loading: geoLoading, denied: geoDenied } = useGeolocation()

  const [stores,    setStores]   = useState([])
  const [dbLoading, setDbLoading]= useState(true)
  const [search,    setSearch]   = useState('')
  const [cityFilter,setCityFilter]= useState('All')

  useEffect(() => {
    supabase
      .from('cat_stores')
      .select('id, name, description, city, address, phone, latitude, longitude, rating, total_reviews, delivery_fee, is_active, is_approved')
      .eq('is_active',   true)
      .eq('is_approved', true)
      .then(({ data, error }) => {
        if (!error && data) setStores(data)
        setDbLoading(false)
      })
  }, [])

  const sorted = sortByDistance(stores, coords)
  const cities = ['All', ...new Set(stores.map(s => s.city).filter(Boolean))]

  const filtered = sorted.filter(s => {
    const q = search.toLowerCase()
    return (s.name?.toLowerCase().includes(q) || s.city?.toLowerCase().includes(q)) &&
           (cityFilter === 'All' || s.city === cityFilter)
  })

  const loading = dbLoading || geoLoading

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 py-16">

      {/* Header */}
      <div ref={headerRef} className="fade-up mb-10">
        <Badge className="mb-3">Cat Store</Badge>
        <h1 className="font-display font-black text-espresso tracking-tight mb-3"
            style={{ fontSize:'clamp(2rem,4vw,3rem)' }}>
          Shop for your<br />feline companion.
        </h1>
        <p className="text-clay-muted text-[15px] max-w-lg">
          Browse registered cat stores near you. {!geoDenied
            ? 'Sorted by proximity — nearest first.'
            : 'Allow location access to sort by distance.'}
        </p>
        {geoDenied && (
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-2 rounded-xl text-[12px]"
               style={{ background:'rgba(196,140,56,.1)', border:'1px solid rgba(196,140,56,.3)', color:'#8B6A14' }}>
            📍 Location access denied — showing all stores
          </div>
        )}
      </div>

      {/* Filters */}
      <div ref={listRef} className="fade-up">
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl flex-1 min-w-[220px]"
               style={{ background:'rgba(255,255,255,.8)', border:'1.5px solid #b8ceb5' }}>
            <span>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)}
                   placeholder="Search stores or cities…"
                   className="flex-1 bg-transparent outline-none text-[14px] text-espresso" />
          </div>
          <div className="flex flex-wrap gap-2">
            {cities.map(c => (
              <button key={c} onClick={() => setCityFilter(c)}
                      className="pill transition-all"
                      style={{
                        background: cityFilter===c ? '#5e4749' : 'rgba(255,255,255,.7)',
                        color:      cityFilter===c ? '#fff'    : '#4E342E',
                        border:     cityFilter===c ? 'none'    : '1px solid #b8ceb5',
                      }}>
                {c}
              </button>
            ))}
          </div>
        </div>

        <p className="text-[12px] text-clay-muted mb-4 t-mono">
          {loading ? 'LOCATING STORES…' : `SHOWING ${filtered.length} STORE${filtered.length!==1?'S':''}`}
        </p>

        {/* Skeleton */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3].map(i => (
              <div key={i} className="card p-6 animate-pulse">
                <div className="w-14 h-14 rounded-2xl bg-clay mb-4" />
                <div className="h-4 bg-clay rounded w-3/4 mb-2" />
                <div className="h-3 bg-clay rounded w-1/2" />
              </div>
            ))}
          </div>
        )}

        {/* Store cards */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(s => {
              const dist  = fmtDist(s.distKm)
              const stars = Math.round(s.rating ?? 0)
              return (
                <GlassCard key={s.id} className="p-6 flex flex-col">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
                         style={{ background:'linear-gradient(135deg,rgba(196,140,56,.18),rgba(196,140,56,.08))' }}>
                      🏪
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-[15px] text-espresso leading-snug">{s.name}</div>
                      <div className="text-[12px] text-clay-muted mt-0.5">{s.address}</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    <Pill variant="green"><span className="text-[9px]">✓ Verified</span></Pill>
                    {s.city && <Pill variant="clay"><span className="text-[9px]">📍 {s.city}</span></Pill>}
                    {dist   && <Pill variant="amber"><span className="text-[9px]">🗺 {dist} away</span></Pill>}
                    {s.delivery_fee === 0
                      ? <Pill variant="green"><span className="text-[9px]">🚚 Free delivery</span></Pill>
                      : s.delivery_fee > 0
                        ? <Pill variant="clay"><span className="text-[9px]">🚚 ₨ {s.delivery_fee}</span></Pill>
                        : null
                    }
                  </div>

                  {s.total_reviews > 0 && (
                    <div className="flex items-center gap-1.5 mb-3">
                      <span className="text-amber-500 text-[13px]">{'★'.repeat(stars)}{'☆'.repeat(5-stars)}</span>
                      <span className="text-[11px] text-clay-muted">({s.total_reviews} reviews)</span>
                    </div>
                  )}

                  {s.description && (
                    <p className="text-[12px] text-clay-muted mb-4 flex-1 line-clamp-2">{s.description}</p>
                  )}

                  <Link to={`/store/${s.id}`} className="no-underline mt-auto">
                    <BtnOlive className="w-full justify-center !py-2.5">
                      Browse Products →
                    </BtnOlive>
                  </Link>
                </GlassCard>
              )
            })}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🏪</div>
            <div className="font-bold text-espresso mb-2">No stores found</div>
            <div className="text-clay-muted text-[13px]">
              {stores.length === 0 ? 'No registered stores yet.' : 'Try adjusting your search.'}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
