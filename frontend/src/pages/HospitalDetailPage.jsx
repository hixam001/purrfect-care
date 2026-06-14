import { useState, useEffect } from 'react'
import { useParams, Link }    from 'react-router-dom'
import { supabase }           from '../lib/supabaseClient.js'
import { useFadeUp }          from '../hooks/useScrollReveal.js'
import { Badge, BtnOlive, BtnOutline, Pill, GlassCard, Card } from '../components/ui/index.jsx'

export default function HospitalDetailPage() {
  const { id } = useParams()
  const headerRef = useFadeUp(0)
  const listRef   = useFadeUp(0.1)

  const [hospital, setHospital] = useState(null)
  const [vets,     setVets]     = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    async function load() {
      // Fetch hospital
      const { data: h } = await supabase
        .from('hospitals')
        .select('*')
        .eq('id', id)
        .single()

      // Fetch vets for this hospital (join through vets table → user_profiles)
      const { data: v } = await supabase
        .from('vets')
        .select(`
          id,
          specialization,
          experience_years,
          bio,
          is_verified,
          rating,
          total_reviews,
          user_profiles (
            id,
            name,
            avatar_url
          ),
          hospital_services ( id, name, price, duration_minutes, category )
        `)
        .eq('hospital_id', id)
        .eq('is_verified', true)

      setHospital(h)
      setVets(v ?? [])
      setLoading(false)
    }

    load()
  }, [id])

  if (loading) return (
    <div className="max-w-5xl mx-auto px-4 py-16 text-center">
      <div className="text-clay-muted">Loading hospital…</div>
    </div>
  )

  if (!hospital) return (
    <div className="max-w-5xl mx-auto px-4 py-16 text-center">
      <div className="text-5xl mb-4">🏥</div>
      <div className="font-bold text-espresso mb-2">Hospital not found</div>
      <Link to="/find-vets"><BtnOlive>← Back to Hospitals</BtnOlive></Link>
    </div>
  )

  return (
    <section className="max-w-5xl mx-auto px-4 md:px-8 py-16">

      {/* Back */}
      <Link to="/find-vets"
            className="inline-flex items-center gap-1.5 no-underline mb-8 font-semibold text-[13px] px-4 py-2 rounded-xl w-fit"
            style={{ color:'#5e4749', background:'rgba(94,71,73,.09)', border:'1px solid rgba(94,71,73,.18)' }}>
        ← Back to Hospitals
      </Link>

      {/* Hospital header */}
      <div ref={headerRef} className="fade-up mb-10">
        <div className="flex items-start gap-5 mb-6">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl flex-shrink-0"
               style={{ background:'linear-gradient(135deg,rgba(94,71,73,.18),rgba(94,71,73,.08))',
                        boxShadow:'0 0 0 6px rgba(94,71,73,.1)' }}>
            🏥
          </div>
          <div>
            <Badge className="mb-2">Verified Hospital</Badge>
            <h1 className="font-display font-black text-espresso tracking-tight"
                style={{ fontSize:'clamp(1.5rem,3vw,2.2rem)' }}>
              {hospital.name}
            </h1>
            <p className="text-clay-muted text-[14px] mt-1">
              📍 {hospital.address}{hospital.city ? `, ${hospital.city}` : ''}
              {hospital.phone && <> · 📞 {hospital.phone}</>}
            </p>
          </div>
        </div>

        {hospital.description && (
          <p className="text-[14px] text-clay-muted max-w-2xl">{hospital.description}</p>
        )}
      </div>

      {/* Vets */}
      <div ref={listRef} className="fade-up">
        <h2 className="font-display font-bold text-[1.2rem] text-espresso mb-5">
          Available Veterinarians ({vets.length})
        </h2>

        {vets.length === 0 ? (
          <Card className="p-10 text-center">
            <div className="text-4xl mb-3">👨‍⚕️</div>
            <div className="font-bold text-espresso mb-1">No vets registered yet</div>
            <div className="text-clay-muted text-[13px]">Check back soon — this hospital is adding their team.</div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vets.map(v => {
              const name  = v.user_profiles?.name ?? 'Veterinarian'
              const stars = Math.round(v.rating ?? 0)
              // Cheapest service fee
              const fee   = v.hospital_services?.length
                ? Math.min(...v.hospital_services.map(s => s.price))
                : null

              return (
                <GlassCard key={v.id} className="p-6 flex flex-col">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
                         style={{ background:'linear-gradient(135deg,rgba(94,71,73,.15),rgba(94,71,73,.07))' }}>
                      👨‍⚕️
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-[15px] text-espresso">{name}</div>
                      <div className="t-mono text-[10px] text-olive">{v.specialization ?? 'Veterinarian'}</div>
                      {v.total_reviews > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-amber-500 text-[11px]">{'★'.repeat(stars)}{'☆'.repeat(5-stars)}</span>
                          <span className="text-[10px] text-clay-muted">({v.total_reviews})</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    <Pill variant="green"><span className="text-[9px]">✓ Verified</span></Pill>
                    {v.experience_years && (
                      <Pill variant="clay"><span className="text-[9px]">⏱ {v.experience_years} yrs exp</span></Pill>
                    )}
                  </div>

                  {v.bio && (
                    <p className="text-[12px] text-clay-muted mb-4 line-clamp-2">{v.bio}</p>
                  )}

                  <div className="flex items-center justify-between mt-auto">
                    {fee != null && (
                      <span className="font-black text-[16px] text-espresso">
                        ₨ {fee.toLocaleString()}
                        <span className="text-[11px] text-clay-muted font-normal"> / consult</span>
                      </span>
                    )}
                    <Link to={`/book/${v.id}?hospital=${hospital.id}`} className="no-underline ml-auto">
                      <BtnOlive className="!py-2 !px-4 !text-[11px]">Book →</BtnOlive>
                    </Link>
                  </div>
                </GlassCard>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
