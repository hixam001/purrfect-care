import { useState, useEffect } from 'react'
import { useParams, Link }    from 'react-router-dom'
import { supabase }           from '../lib/supabaseClient.js'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
import { Badge, BtnOlive, BtnOutline, Pill, GlassCard, Card } from '../components/ui/index.jsx'

export default function HospitalDetailPage() {
  const { id } = useParams()
  const [hospital, setHospital] = useState(null)
  const [vets,     setVets]     = useState([])
  const [services, setServices] = useState([])
  const [slots,    setSlots]    = useState([])
  const [loading,  setLoading]  = useState(true)

  // Booking state
  const [selectedVet,     setSelectedVet]     = useState(null)
  const [selectedService, setSelectedService] = useState(null)
  const [selectedSlot,    setSelectedSlot]    = useState(null)
  const [bookingStep,     setBookingStep]     = useState('vets') // vets | services | slots | confirm

  useEffect(() => {
    async function load() {
      // 1. Fetch hospital
      const { data: h } = await supabase
        .from('hospitals')
        .select('*')
        .eq('id', id)
        .single()

      // 2. Fetch verified vets via backend (service role bypasses RLS, returns names)
      const vetsRes = await fetch(`${API}/api/hospitals/${id}/vets`)
      const v = vetsRes.ok ? await vetsRes.json() : []

      // 3. Fetch hospital services
      const { data: svc } = await supabase
        .from('hospital_services')
        .select('id, name, price, duration_minutes, category')
        .eq('hospital_id', id)
        .order('category')

      setHospital(h)
      setVets(v ?? [])
      setServices(svc ?? [])
      setLoading(false)
    }
    load()
  }, [id])

  // Fetch available slots when vet is selected
  useEffect(() => {
    if (!selectedVet) return
    setSlots([])
    supabase
      .from('appointment_slots')
      .select('id, slot_date, start_time, end_time, is_booked')
      .eq('hospital_id', id)
      .eq('vet_id', selectedVet.id)
      .eq('is_booked', false)
      .gte('slot_date', new Date().toISOString().slice(0, 10))
      .order('slot_date')
      .order('start_time')
      .limit(30)
      .then(({ data }) => setSlots(data ?? []))
  }, [selectedVet, id])

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

  // Format slot: combine slot_date (DATE) + start_time (TIME) into readable string
  function fmtSlot(slot) {
    const dt = new Date(`${slot.slot_date}T${slot.start_time}`)
    return dt.toLocaleString('en-PK', {
      weekday: 'short', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  // Group services by category
  const servicesByCategory = services.reduce((acc, s) => {
    const cat = s.category || 'General'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(s)
    return acc
  }, {})

  return (
    <section className="max-w-5xl mx-auto px-4 md:px-8 py-12">

      {/* Back */}
      <Link to="/find-vets"
            className="inline-flex items-center gap-1.5 no-underline mb-8 font-semibold text-[13px] px-4 py-2 rounded-xl w-fit"
            style={{ color:'#5e4749', background:'rgba(94,71,73,.09)', border:'1px solid rgba(94,71,73,.18)' }}>
        ← Back to Hospitals
      </Link>

      {/* Hospital header */}
      <div className="mb-10">
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

      <div className="space-y-12">

        {/* ── STEP 1: Choose a Vet ── */}
        <div>
          <h2 className="font-display font-bold text-[1.2rem] text-espresso mb-5 flex items-center gap-2">
            <span className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[12px] font-black"
                  style={{ background: bookingStep === 'vets' ? '#5e4749' : '#b8ceb5' }}>1</span>
            Choose a Veterinarian
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
                const isSelected = selectedVet?.id === v.id
                return (
                  <GlassCard key={v.id}
                    className="p-5 flex flex-col cursor-pointer transition-all"
                    style={{
                      border: isSelected ? '2px solid #5e4749' : '2px solid rgba(184,206,181,.5)',
                      transform: isSelected ? 'translateY(-2px)' : 'none',
                      boxShadow: isSelected ? '0 8px 24px rgba(94,71,73,.15)' : 'none',
                    }}
                    onClick={() => {
                      setSelectedVet(v)
                      setSelectedService(null)
                      setSelectedSlot(null)
                      setBookingStep('services')
                    }}>
                    <div className="flex items-center gap-4 mb-3">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                           style={{ background:'linear-gradient(135deg,rgba(94,71,73,.15),rgba(94,71,73,.07))' }}>
                        👨‍⚕️
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-[14px] text-espresso">{name}</div>
                        <div className="t-mono text-[10px] text-olive">{v.specialization ?? 'Veterinarian'}</div>
                        {v.total_reviews > 0 && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="text-amber-500 text-[11px]">{'★'.repeat(stars)}{'☆'.repeat(5-stars)}</span>
                            <span className="text-[10px] text-clay-muted">({v.total_reviews})</span>
                          </div>
                        )}
                      </div>
                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-olive flex items-center justify-center text-white text-[11px] flex-shrink-0">✓</div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Pill variant="green"><span className="text-[9px]">✓ Verified</span></Pill>
                      {v.experience_years && (
                        <Pill variant="clay"><span className="text-[9px]">⏱ {v.experience_years} yrs exp</span></Pill>
                      )}
                    </div>
                    {v.bio && <p className="text-[11px] text-clay-muted line-clamp-2 mb-3">{v.bio}</p>}
                    <BtnOlive className="!py-2 !text-[12px] w-full justify-center mt-auto"
                      onClick={e => {
                        e.stopPropagation()
                        setSelectedVet(v)
                        setSelectedService(null)
                        setSelectedSlot(null)
                        setBookingStep('services')
                      }}>
                      {isSelected ? '✓ Selected' : 'Select Vet →'}
                    </BtnOlive>
                  </GlassCard>
                )
              })}
            </div>
          )}
        </div>

        {/* ── STEP 2: Choose a Service ── */}
        {selectedVet && (
          <div>
            <h2 className="font-display font-bold text-[1.2rem] text-espresso mb-5 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[12px] font-black"
                    style={{ background: bookingStep === 'services' ? '#5e4749' : '#b8ceb5' }}>2</span>
              Choose a Service
            </h2>

            {services.length === 0 ? (
              <Card className="p-8 text-center">
                <div className="text-3xl mb-2">🩺</div>
                <div className="font-bold text-espresso mb-1">No services listed yet</div>
                <div className="text-clay-muted text-[13px]">This hospital hasn't added services yet.</div>
              </Card>
            ) : (
              <div className="space-y-6">
                {Object.entries(servicesByCategory).map(([cat, catServices]) => (
                  <div key={cat}>
                    <div className="t-mono text-[10px] text-clay-muted mb-3 font-bold">{cat.toUpperCase()}</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {catServices.map(s => {
                        const isSelected = selectedService?.id === s.id
                        return (
                          <div key={s.id}
                               onClick={() => { setSelectedService(s); setBookingStep('slots') }}
                               className="p-4 rounded-2xl cursor-pointer transition-all"
                               style={{
                                 background: isSelected ? 'rgba(94,71,73,.1)' : 'rgba(255,255,255,.6)',
                                 border: `2px solid ${isSelected ? '#5e4749' : 'rgba(184,206,181,.5)'}`,
                               }}>
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="font-bold text-[13px] text-espresso">{s.name}</div>
                                {s.duration_minutes && (
                                  <div className="text-[11px] text-clay-muted mt-0.5">⏱ {s.duration_minutes} min</div>
                                )}
                              </div>
                              <div className="text-right flex-shrink-0">
                                <div className="font-black text-[15px] text-olive">₨ {(s.price || 0).toLocaleString()}</div>
                                {isSelected && <div className="text-[10px] text-olive font-bold mt-0.5">✓ Selected</div>}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── STEP 3: Choose a Slot ── */}
        {selectedVet && selectedService && (
          <div>
            <h2 className="font-display font-bold text-[1.2rem] text-espresso mb-5 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[12px] font-black"
                    style={{ background: '#5e4749' }}>3</span>
              Choose an Available Slot
            </h2>

            {slots.length === 0 ? (
              <Card className="p-8 text-center">
                <div className="text-3xl mb-2">📅</div>
                <div className="font-bold text-espresso mb-1">No available slots</div>
                <div className="text-clay-muted text-[13px]">
                  {selectedVet.user_profiles?.name ?? 'This vet'} has no open slots right now. Check back soon.
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {slots.map(slot => {
                  const isSelected = selectedSlot?.id === slot.id
                  return (
                    <div key={slot.id}
                         onClick={() => { setSelectedSlot(slot); setBookingStep('confirm') }}
                         className="p-4 rounded-2xl cursor-pointer transition-all"
                         style={{
                           background: isSelected ? 'rgba(94,71,73,.1)' : 'rgba(255,255,255,.6)',
                           border: `2px solid ${isSelected ? '#5e4749' : 'rgba(184,206,181,.5)'}`,
                         }}>
                      <div className="font-bold text-[12px] text-espresso">{fmtSlot(slot)}</div>
                      <div className="text-[11px] text-clay-muted mt-0.5">
                        → {slot.end_time?.slice(0, 5)}
                      </div>
                      {isSelected && <div className="text-[10px] text-olive font-bold mt-1">✓ Selected</div>}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── STEP 4: Confirm ── */}
        {selectedVet && selectedService && selectedSlot && (
          <div className="rounded-3xl p-6 md:p-8"
               style={{ background:'rgba(94,71,73,.06)', border:'2px solid rgba(94,71,73,.18)' }}>
            <h2 className="font-display font-bold text-[1.2rem] text-espresso mb-5">Booking Summary</h2>
            <div className="space-y-3 mb-6 text-[13px]">
              <div className="flex justify-between">
                <span className="text-clay-muted">Hospital</span>
                <span className="font-bold text-espresso">{hospital.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-clay-muted">Vet</span>
                <span className="font-bold text-espresso">{selectedVet.name ?? 'Veterinarian'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-clay-muted">Service</span>
                <span className="font-bold text-espresso">{selectedService.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-clay-muted">Date & Time</span>
                <span className="font-bold text-espresso">{fmtSlot(selectedSlot)}</span>
              </div>
              <div className="flex justify-between pt-3 border-t" style={{ borderColor:'rgba(94,71,73,.15)' }}>
                <span className="font-bold text-espresso">Total</span>
                <span className="font-black text-[16px] text-olive">₨ {(selectedService.price || 0).toLocaleString()}</span>
              </div>
            </div>
            <Link to={`/book/${selectedVet.id}?hospital=${hospital.id}&service=${selectedService.id}&slot=${selectedSlot.id}`}
                  className="no-underline">
              <BtnOlive className="w-full justify-center !py-3 !text-[14px]">
                Confirm & Book Appointment →
              </BtnOlive>
            </Link>
          </div>
        )}

      </div>
    </section>
  )
}
