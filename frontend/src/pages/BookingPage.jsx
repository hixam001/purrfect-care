import { useState, useEffect, useMemo } from 'react'
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom'
import { useAuth }   from '../context/AuthContext.jsx'
import { supabase }  from '../lib/supabaseClient.js'
import { Badge, Pill, GlassCard, BtnOlive, BtnOutline, Stars } from '../components/ui/index.jsx'
import Stepper      from '../components/ui/Stepper.jsx'

const API                 = import.meta.env.VITE_API_URL || 'https://server-vmvwkwachq-uc.a.run.app'
const PLATFORM_FEE_BASE   = 500      // PKR
const PLATFORM_FEE_TOTAL  = 508      // PKR (500 + 1.5%)

const STEPS = ['Select Date & Time', 'Choose Pet', 'Review & Pay', 'Confirmed']
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

/* ── Mini Calendar ── */
function Calendar({ selected, onSelect }) {
  const today = new Date()
  const [year,  setYear]  = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())

  const firstDay = new Date(year, month, 1).getDay()
  const daysIn   = new Date(year, month + 1, 0).getDate()
  const cells    = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysIn; d++) cells.push(d)

  const isPast = d => {
    const date = new Date(year, month, d); date.setHours(0,0,0,0)
    const t = new Date(); t.setHours(0,0,0,0)
    return date < t
  }
  const isSel = d => selected === `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
  function pick(d) {
    if (!d || isPast(d)) return
    onSelect(`${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`)
  }

  return (
    <div className="rounded-2xl p-5" style={{ background:'rgba(255,255,255,.7)', border:'1px solid #b8ceb5' }}>
      <div className="flex items-center justify-between mb-4">
        <button type="button" onClick={() => { if (month===0) { setMonth(11); setYear(y=>y-1) } else setMonth(m=>m-1) }}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-clay-muted hover:bg-clay">‹</button>
        <span className="font-bold text-[14px] text-espresso">{MONTHS[month]} {year}</span>
        <button type="button" onClick={() => { if (month===11) { setMonth(0); setYear(y=>y+1) } else setMonth(m=>m+1) }}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-clay-muted hover:bg-clay">›</button>
      </div>
      <div className="grid grid-cols-7 mb-2">
        {DAYS.map(d => <div key={d} className="text-center t-mono text-[9px] text-clay-muted py-1">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => (
          <button key={i} type="button" onClick={() => pick(d)} disabled={!d || isPast(d)}
                  className="aspect-square w-full rounded-xl text-[13px] font-medium transition-all"
                  style={{
                    background: isSel(d) ? '#5e4749' : 'transparent',
                    color:      isSel(d) ? '#fff' : (isPast(d)||!d) ? '#C4B5AC' : '#4E342E',
                    cursor:     (!d||isPast(d)) ? 'default' : 'pointer',
                  }}
                  onMouseOver={e => { if (d&&!isPast(d)&&!isSel(d)) e.currentTarget.style.background='rgba(85,107,47,.1)' }}
                  onMouseOut={e  => { if (!isSel(d)) e.currentTarget.style.background='transparent' }}>
            {d || ''}
          </button>
        ))}
      </div>
    </div>
  )
}

// TIME_SLOTS replaced by real DB slots

export default function BookingPage() {
  const { vetId }     = useParams()
  const [searchParams]= useSearchParams()
  const hospitalId    = searchParams.get('hospital')
  const navigate      = useNavigate()
  const { user, token } = useAuth()

  const [vet,      setVet]      = useState(null)
  const [hospital, setHospital] = useState(null)
  const [cats,     setCats]     = useState([])
  const [loading,  setLoading]  = useState(true)

  const [step,              setStep]             = useState(0)
  const [date,              setDate]             = useState('')
  const [time,              setTime]             = useState('')
  const [catId,             setCatId]            = useState(null)
  const [selectedServiceId, setSelectedServiceId]= useState(null)
  const [notes,             setNotes]            = useState('')
  const [saving,            setSaving]           = useState(false)
  const [payErr,            setPayErr]           = useState('')
  const [slots,             setSlots]            = useState([])
  const [slotId,            setSlotId]           = useState(null)
  const [slotsLoading,      setSlotsLoading]     = useState(true)

  const bookingRef = 'PC-' + Math.random().toString(36).slice(2,8).toUpperCase()

  /* ── Load vet, hospital, cats, and available slots ── */
  useEffect(() => {
    async function load() {
      const today = new Date().toISOString().slice(0, 10)
      const [{ data: v }, { data: h }, { data: c }, { data: sl }] = await Promise.all([
        supabase.from('vets').select(`
          id, specialization, experience_years, bio, rating, total_reviews,
          user_profiles ( name ),
          hospital_services ( id, name, price, duration_minutes )
        `).eq('id', vetId).single(),

        hospitalId
          ? supabase.from('hospitals').select('id, name, city, address').eq('id', hospitalId).single()
          : { data: null },

        user?.id
          ? supabase.from('cats').select('id, name, breed_id, age_months').eq('owner_id', user.id)
          : { data: [] },

        // Real availability slots — only future, unbooked ones for this vet
        supabase.from('appointment_slots')
          .select('id, slot_date, start_time, end_time, is_booked')
          .eq('vet_id', vetId)
          .eq('is_booked', false)
          .gte('slot_date', today)
          .order('slot_date')
          .order('start_time'),
      ])

      setVet(v ?? null)
      setHospital(h ?? null)
      setCats(c ?? [])
      setSlots(sl ?? [])
      setSlotsLoading(false)
      // Default to first available service
      if (v?.hospital_services?.length) setSelectedServiceId(v.hospital_services[0].id)
      setLoading(false)
    }
    load()
  }, [vetId, hospitalId, user?.id])

  /* Group slots by date for display */
  const slotsByDate = useMemo(() => {
    return slots.reduce((acc, s) => {
      acc[s.slot_date] = acc[s.slot_date] ?? []
      acc[s.slot_date].push(s)
      return acc
    }, {})
  }, [slots])

  const availableDates = Object.keys(slotsByDate).sort()

  function fmtDate(d) {
    if (!d) return ''
    const [y, m, day] = d.split('-')
    return `${day} ${MONTHS[parseInt(m)-1]} ${y}`
  }

  const cat            = cats.find(c => c.id === catId)
  const selectedService = vet?.hospital_services?.find(s => s.id === selectedServiceId)
                       ?? vet?.hospital_services?.[0]
  const feeDisplay     = selectedService ? `₨ ${selectedService.price.toLocaleString()}` : '—'

  /* ── Confirm booking: save appointment (with slot_id) then initiate Safepay ── */
  async function handleConfirm() {
    setSaving(true)
    setPayErr('')
    try {
      if (!slotId) throw new Error('Please select a time slot.')

      // Guard: vet must have at least one service configured
      const serviceId = selectedServiceId ?? vet?.hospital_services?.[0]?.id
      if (!serviceId) throw new Error('This vet has no services configured. Please contact the hospital.')

      // 1. Build appointment datetime from the selected slot
      const selectedSlot = slots.find(s => s.id === slotId)
      const apptDate = new Date(`${date}T${selectedSlot.start_time}`)

      // 2. Insert appointment — slot_id UNIQUE constraint prevents double-booking
      //    The DB trigger (migration 010) will mark slot as is_booked = true
      const { data: appt, error: apptErr } = await supabase.from('appointments').insert({
        user_id:          user.id,
        cat_id:           catId,
        vet_id:           vetId,
        hospital_id:      hospitalId,
        service_id:       serviceId,
        slot_id:          slotId,
        appointment_date: apptDate.toISOString(),
        notes:            notes || null,
        status:           'pending',
        amount_paid:      selectedService?.price ?? 0,
      }).select('id').single()

      if (apptErr) {
        // Unique violation = slot was just taken by another user
        if (apptErr.code === '23505') throw new Error('This slot was just booked by someone else. Please choose another.')
        throw new Error(apptErr.message)
      }

      // 3. Create Safepay session for platform fee (₨508)
      const sessionRes = await fetch(`${API}/api/payments/appointment-session`, {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify({
          appointment_ref: appt.id,
          redirect_url:    `${window.location.origin}/payment/return?type=appointment&ref=${bookingRef}`,
          cancel_url:      `${window.location.origin}/payment/return?type=appointment&status=cancelled`,
        }),
      })
      const sessionData = await sessionRes.json()
      if (!sessionRes.ok) throw new Error(sessionData.detail || 'Payment session failed.')

      // 4. Redirect to Safepay checkout
      window.location.href = sessionData.checkout_url
    } catch (e) {
      setPayErr(e.message)
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background:'#dbe8d8' }}>
      <div className="text-clay-muted">Loading…</div>
    </div>
  )

  if (!vet) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background:'#dbe8d8' }}>
      <div className="text-center">
        <div className="text-4xl mb-3">👨‍⚕️</div>
        <div className="font-bold text-espresso mb-2">Vet not found</div>
        <Link to="/find-vets"><BtnOlive>← Back</BtnOlive></Link>
      </div>
    </div>
  )

  const vetName = vet.user_profiles?.name ?? 'Veterinarian'



  return (
    <div className="min-h-screen" style={{ background:'linear-gradient(135deg,#dbe8d8,#EFE5DC)' }}>
      <div className="max-w-4xl mx-auto px-4 py-10">
        <Link to={hospitalId ? `/hospital/${hospitalId}` : '/find-vets'}
              className="inline-flex items-center gap-1.5 no-underline mb-8 font-semibold text-[13px] px-4 py-2 rounded-xl w-fit" style={{ color:"#5e4749", background:"rgba(94,71,73,.09)", border:"1px solid rgba(94,71,73,.18)" }}>
          ← Back
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
          {/* Left: form */}
          <div>
            <div className="mb-6">
              <Badge className="mb-2">Book Appointment</Badge>
              <h1 className="font-display font-black text-espresso tracking-tight"
                  style={{ fontSize:'clamp(1.5rem,3vw,2rem)' }}>
                Book with {vetName}
              </h1>
              {hospital && (
                <p className="text-clay-muted text-[13px] mt-1">🏥 {hospital.name} · {hospital.city}</p>
              )}
            </div>

            <Stepper steps={STEPS} current={step} />

            <div className="rounded-3xl p-6" style={{ background:'rgba(255,255,255,.75)', backdropFilter:'blur(12px)', border:'1px solid #b8ceb5' }}>

              {/* STEP 0: Real Slot Selection */}
              {step === 0 && (
                <div>
                  <h2 className="font-bold text-[1rem] text-espresso mb-1">Select Available Slot</h2>
                  <p className="text-[13px] text-clay-muted mb-4">Only available (unbooked) slots are shown.</p>

                  {slotsLoading ? (
                    <div className="text-center py-10 text-clay-muted text-[13px]">Loading availability…</div>
                  ) : availableDates.length === 0 ? (
                    <div className="text-center py-10 rounded-2xl" style={{ background:'rgba(255,255,255,.6)', border:'1px solid #b8ceb5' }}>
                      <div className="text-3xl mb-3">🗓️</div>
                      <div className="font-bold text-espresso mb-1">No slots available</div>
                      <p className="text-[13px] text-clay-muted">The hospital admin hasn't added availability for this vet yet.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-5">
                      {availableDates.map(d => (
                        <div key={d}>
                          <div className="font-semibold text-[13px] text-espresso mb-2">
                            {new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long' })}
                          </div>
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {slotsByDate[d].map(slot => {
                              const isSelected = slotId === slot.id
                              return (
                                <button key={slot.id} type="button"
                                        onClick={() => { setSlotId(slot.id); setDate(d); setTime(slot.start_time) }}
                                        className="py-2.5 rounded-xl text-[12px] font-semibold transition-all"
                                        style={{
                                          background: isSelected ? '#5e4749' : 'rgba(255,255,255,.7)',
                                          color:      isSelected ? '#fff'    : '#4E342E',
                                          border:     isSelected ? 'none'    : '1px solid #b8ceb5',
                                        }}>
                                  {slot.start_time.slice(0,5)}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <button onClick={() => setStep(1)} disabled={!slotId}
                          className="btn btn-olive w-full justify-center !py-3 mt-6"
                          style={{ opacity: slotId ? 1 : 0.5 }}>
                    Continue →
                  </button>
                </div>
              )}

              {/* STEP 1: Choose Pet */}
              {step === 1 && (
                <div>
                  <h2 className="font-bold text-[1rem] text-espresso mb-4">Which cat is this for?</h2>
                  {cats.length === 0 ? (
                    <div className="text-center py-8 text-clay-muted text-[13px]">
                      No cats registered yet. Add a cat profile first.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3 mb-5">
                      {cats.map(c => (
                        <button key={c.id} type="button" onClick={() => setCatId(c.id)}
                                className="flex items-center gap-4 px-5 py-4 rounded-2xl text-left transition-all"
                                style={{
                                  background: catId===c.id ? 'rgba(85,107,47,.08)' : 'rgba(255,255,255,.7)',
                                  border:     catId===c.id ? '2px solid #5e4749'   : '1.5px solid #b8ceb5',
                                }}>
                          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
                               style={{ background:'rgba(94,71,73,.1)' }}>🐱</div>
                          <div>
                            <div className="font-bold text-[15px] text-espresso">{c.name}</div>
                            {c.age_months && (
                              <div className="text-[12px] text-clay-muted">{Math.floor(c.age_months/12)} yrs old</div>
                            )}
                          </div>
                          {catId===c.id && (
                            <div className="ml-auto w-6 h-6 rounded-full bg-olive flex items-center justify-center text-white text-[12px]">✓</div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Service selector — shown when vet has multiple services */}
                  {vet?.hospital_services?.length > 1 && (
                    <div className="mb-5">
                      <label className="t-mono text-[10px] text-espresso-soft block mb-1.5">Select Service</label>
                      <div className="flex flex-col gap-2">
                        {vet.hospital_services.map(s => (
                          <button key={s.id} type="button" onClick={() => setSelectedServiceId(s.id)}
                                  className="flex items-center justify-between px-4 py-3 rounded-xl text-left transition-all"
                                  style={{
                                    background: selectedServiceId===s.id ? 'rgba(85,107,47,.08)' : 'rgba(255,255,255,.7)',
                                    border:     selectedServiceId===s.id ? '2px solid #5e4749' : '1.5px solid #b8ceb5',
                                  }}>
                            <div>
                              <div className="font-semibold text-[14px] text-espresso">{s.name}</div>
                              {s.duration_minutes && <div className="text-[11px] text-clay-muted">{s.duration_minutes} min</div>}
                            </div>
                            <div className="font-black text-[14px]" style={{ color:'#5e4749' }}>
                              ₨ {s.price.toLocaleString()}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mb-5">
                    <label className="t-mono text-[10px] text-espresso-soft block mb-1.5">Notes (optional)</label>
                    <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                              placeholder="Describe symptoms, reason for visit…"
                              className="w-full px-4 py-3 rounded-xl text-[14px] text-espresso outline-none"
                              style={{ background:'rgba(255,255,255,.8)', border:'1.5px solid #b8ceb5', resize:'none' }} />
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => setStep(0)} className="btn btn-outline flex-1 justify-center !py-3">← Back</button>
                    <button onClick={() => setStep(2)} disabled={!catId || cats.length===0}
                            className="btn btn-olive flex-1 justify-center !py-3"
                            style={{ opacity:(!catId||cats.length===0) ? .5 : 1 }}>
                      Continue →
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: Review & Pay */}
              {step === 2 && (
                <div>
                  <h2 className="font-bold text-[1rem] text-espresso mb-4">Review & Complete Payment</h2>

                  {/* Booking summary */}
                  <div className="p-4 rounded-2xl mb-4"
                       style={{ background:'rgba(94,71,73,.07)', border:'1px solid rgba(94,71,73,.2)' }}>
                    <div className="t-mono text-[10px] text-olive mb-3">BOOKING SUMMARY</div>
                    {[
                      ['Vet',      vetName],
                      ['Hospital', hospital?.name ?? '—'],
                      ['Service',  selectedService?.name ?? '—'],
                      ['Date',     fmtDate(date)],
                      ['Time',     time],
                      ['Cat',      cat?.name ?? '—'],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between py-1.5 text-[13px] border-b last:border-0"
                           style={{ borderColor:'rgba(94,71,73,.15)' }}>
                        <span className="text-clay-muted">{k}</span>
                        <span className="font-semibold text-espresso">{v}</span>
                      </div>
                    ))}
                  </div>

                  {/* Platform fee breakdown */}
                  <div className="p-4 rounded-2xl mb-4"
                       style={{ background:'rgba(85,107,47,.06)', border:'1px solid rgba(85,107,47,.2)' }}>
                    <div className="t-mono text-[10px] text-olive mb-3">PAYMENT BREAKDOWN</div>
                    <div className="flex justify-between text-[13px] py-1.5">
                      <span className="text-clay-muted">Platform Booking Fee</span>
                      <span className="font-semibold text-espresso">₨ {PLATFORM_FEE_BASE.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-[13px] py-1.5 border-b"
                         style={{ borderColor:'rgba(85,107,47,.15)' }}>
                      <span className="text-clay-muted">Service Charge (1.5%)</span>
                      <span className="font-semibold text-espresso">₨ {(PLATFORM_FEE_TOTAL - PLATFORM_FEE_BASE).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-[14px] pt-2 font-black">
                      <span className="text-espresso">Total Due via Safepay</span>
                      <span className="text-olive">₨ {PLATFORM_FEE_TOTAL.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl mb-4 text-[12px]"
                       style={{ background:'rgba(196,140,56,.07)', border:'1px solid rgba(196,140,56,.2)', color:'#7A4F10' }}>
                    The hospital's consultation fee (<strong>{feeDisplay}</strong>) is billed separately at the clinic.
                    The amount above is the Purrfect Care platform booking fee processed via Safepay.
                  </div>

                  {payErr && (
                    <div className="mb-4 px-4 py-3 rounded-xl text-[13px]"
                         style={{ background:'rgba(196,56,56,.08)', border:'1px solid rgba(196,56,56,.2)', color:'#9B2020' }}>
                      ⚠️ {payErr}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button onClick={() => setStep(1)} className="btn btn-outline flex-1 justify-center !py-3">← Back</button>
                    <button onClick={handleConfirm} disabled={saving}
                            className="btn btn-olive flex-1 justify-center !py-3"
                            style={{ opacity: saving ? .7 : 1 }}>
                      {saving
                        ? <span className="flex items-center gap-2">
                            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity=".3"/>
                              <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                            </svg>
                            Redirecting to payment…
                          </span>
                        : `Confirm & Pay ₨ ${PLATFORM_FEE_TOTAL} →`
                      }
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Vet card */}
          <div className="lg:sticky lg:top-24 h-fit">
            <GlassCard className="p-6">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-4"
                   style={{ background:'linear-gradient(135deg,rgba(94,71,73,.18),rgba(94,71,73,.08))',
                            boxShadow:'0 0 0 6px rgba(94,71,73,.1)' }}>
                👨‍⚕️
              </div>
              <div className="text-center mb-4">
                <div className="font-bold text-[16px] text-espresso">{vetName}</div>
                <div className="t-mono text-[10px] text-olive mb-2">{vet.specialization ?? 'Veterinarian'}</div>
                {vet.total_reviews > 0 && (
                  <>
                    <Stars rating={Math.round(vet.rating)} />
                    <span className="text-[11px] text-clay-muted">({vet.total_reviews} reviews)</span>
                  </>
                )}
              </div>

              <div className="flex flex-col gap-2 mb-4">
                {hospital && (
                  <div className="flex justify-between text-[12px]">
                    <span className="text-clay-muted">🏥 Hospital</span>
                    <span className="font-medium text-espresso text-right max-w-[55%]">{hospital.name}</span>
                  </div>
                )}
                {vet.experience_years && (
                  <div className="flex justify-between text-[12px]">
                    <span className="text-clay-muted">⏱ Experience</span>
                    <span className="font-medium text-espresso">{vet.experience_years} yrs</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl mb-4"
                   style={{ background:'rgba(94,71,73,.08)', border:'1px solid rgba(94,71,73,.2)' }}>
                <span className="text-[13px] text-clay-muted">Consultation Fee</span>
                <span className="font-black text-[18px] text-olive">{feeDisplay}</span>
              </div>

              <Pill variant="green" className="w-full justify-center">✓ PVMC Verified</Pill>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  )
}
