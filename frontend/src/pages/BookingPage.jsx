import { useState, useEffect } from 'react'
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom'
import { useAuth }   from '../context/AuthContext.jsx'
import { supabase }  from '../lib/supabaseClient.js'
import { Badge, Pill, GlassCard, BtnOlive, BtnOutline, Stars } from '../components/ui/index.jsx'
import Stepper      from '../components/ui/Stepper.jsx'
import PaymentForm  from '../components/ui/PaymentForm.jsx'

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

const TIME_SLOTS = [
  '9:00 AM','9:30 AM','10:00 AM','10:30 AM','11:00 AM','11:30 AM',
  '2:00 PM','2:30 PM','3:00 PM','3:30 PM','4:00 PM','4:30 PM','5:00 PM',
]

export default function BookingPage() {
  const { vetId }     = useParams()
  const [searchParams]= useSearchParams()
  const hospitalId    = searchParams.get('hospital')
  const navigate      = useNavigate()
  const { user }      = useAuth()

  const [vet,      setVet]      = useState(null)
  const [hospital, setHospital] = useState(null)
  const [cats,     setCats]     = useState([])
  const [loading,  setLoading]  = useState(true)

  const [step,   setStep]  = useState(0)
  const [date,   setDate]  = useState('')
  const [time,   setTime]  = useState('')
  const [catId,  setCatId] = useState(null)
  const [notes,  setNotes] = useState('')
  const [done,   setDone]  = useState(false)
  const [saving, setSaving]= useState(false)

  const bookingRef = 'PC-' + Math.random().toString(36).slice(2,8).toUpperCase()

  /* ── Load vet, hospital, and user's cats ── */
  useEffect(() => {
    async function load() {
      const [{ data: v }, { data: h }, { data: c }] = await Promise.all([
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
      ])

      setVet(v)
      setHospital(h)
      setCats(c ?? [])
      setLoading(false)
    }
    load()
  }, [vetId, hospitalId, user?.id])

  function fmtDate(d) {
    if (!d) return ''
    const [y, m, day] = d.split('-')
    return `${day} ${MONTHS[parseInt(m)-1]} ${y}`
  }

  const cat         = cats.find(c => c.id === catId)
  const defaultFee  = vet?.hospital_services?.[0]?.price ?? 0
  const feeDisplay  = `₨ ${defaultFee.toLocaleString()}`

  /* ── Confirm booking ── */
  async function handleConfirm() {
    setSaving(true)
    try {
      // Build appointment datetime
      const [h, mStr] = time.replace(/ (AM|PM)/, '').split(':')
      let hr = parseInt(h)
      if (time.includes('PM') && hr !== 12) hr += 12
      if (time.includes('AM') && hr === 12) hr = 0
      const apptDate = new Date(`${date}T${String(hr).padStart(2,'0')}:${mStr}:00`)

      await supabase.from('appointments').insert({
        user_id:          user.id,
        cat_id:           catId,
        vet_id:           vetId,
        hospital_id:      hospitalId,
        service_id:       vet?.hospital_services?.[0]?.id,
        appointment_date: apptDate.toISOString(),
        notes:            notes || null,
        status:           'pending',
        case_status:      'closed',
        amount_paid:      defaultFee,
      })
      setDone(true)
    } catch (e) {
      console.error(e)
    } finally {
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

  /* ── Confirmed screen ── */
  if (done) return (
    <div className="min-h-screen flex items-center justify-center px-4"
         style={{ background:'linear-gradient(135deg,#dbe8d8,#EFE5DC)' }}>
      <div className="max-w-md w-full rounded-3xl p-10 text-center"
           style={{ background:'rgba(255,255,255,.85)', backdropFilter:'blur(12px)', border:'1px solid rgba(94,71,73,.25)' }}>
        <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mx-auto mb-5"
             style={{ background:'rgba(94,71,73,.15)', border:'2px solid rgba(94,71,73,.3)' }}>📅</div>
        <div className="t-label mb-3 inline-block">Booking Confirmed</div>
        <h2 className="font-display font-black text-[1.8rem] text-espresso mb-3">You're booked!</h2>
        <div className="flex flex-col gap-2 mb-5 p-4 rounded-2xl text-left"
             style={{ background:'rgba(94,71,73,.07)', border:'1px solid rgba(94,71,73,.18)' }}>
          {[
            ['Reference', bookingRef],
            ['Vet',       vetName],
            ['Hospital',  hospital?.name ?? '—'],
            ['Cat',       cat?.name ?? '—'],
            ['Date',      fmtDate(date)],
            ['Time',      time],
            ['Fee',       feeDisplay],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between text-[13px]">
              <span className="text-clay-muted">{k}</span>
              <span className="font-semibold text-espresso">{v}</span>
            </div>
          ))}
        </div>
        <p className="text-clay-muted text-[12px] mb-5">
          Your appointment is now pending confirmation from the hospital.
        </p>
        <div className="flex flex-col gap-3">
          <button onClick={() => navigate('/dashboard')} className="btn btn-olive justify-center w-full !py-3">
            Go to Dashboard
          </button>
          <Link to="/find-vets" className="text-[13px] font-semibold" style={{ color:"#5e4749" }}>← Book another</Link>
        </div>
      </div>
    </div>
  )

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

              {/* STEP 0: Date & Time */}
              {step === 0 && (
                <div>
                  <h2 className="font-bold text-[1rem] text-espresso mb-4">Select Date</h2>
                  <Calendar selected={date} onSelect={setDate} />
                  {date && (
                    <div className="mt-5">
                      <h2 className="font-bold text-[1rem] text-espresso mb-3">
                        Select Time — <span className="text-olive">{fmtDate(date)}</span>
                      </h2>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {TIME_SLOTS.map(t => (
                          <button key={t} type="button" onClick={() => setTime(t)}
                                  className="py-2.5 rounded-xl text-[12px] font-semibold transition-all"
                                  style={{
                                    background: time===t ? '#5e4749' : 'rgba(255,255,255,.7)',
                                    color:      time===t ? '#fff'    : '#4E342E',
                                    border:     time===t ? 'none'    : '1px solid #b8ceb5',
                                  }}>
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <button onClick={() => setStep(1)} disabled={!date || !time}
                          className="btn btn-olive w-full justify-center !py-3 mt-5"
                          style={{ opacity:(!date||!time) ? .5 : 1 }}>
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
                  <div className="p-4 rounded-2xl mb-5"
                       style={{ background:'rgba(94,71,73,.07)', border:'1px solid rgba(94,71,73,.2)' }}>
                    <div className="t-mono text-[10px] text-olive mb-3">BOOKING SUMMARY</div>
                    {[
                      ['Vet',      vetName],
                      ['Hospital', hospital?.name ?? '—'],
                      ['Date',     fmtDate(date)],
                      ['Time',     time],
                      ['Cat',      cat?.name ?? '—'],
                      ['Fee',      feeDisplay],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between py-1.5 text-[13px] border-b last:border-0"
                           style={{ borderColor:'rgba(94,71,73,.15)' }}>
                        <span className="text-clay-muted">{k}</span>
                        <span className="font-semibold text-espresso">{v}</span>
                      </div>
                    ))}
                  </div>

                  <PaymentForm
                    amount={feeDisplay}
                    title={`Consultation with ${vetName}`}
                    onBack={() => setStep(1)}
                    onSuccess={handleConfirm}
                  />
                  {saving && <p className="text-center text-clay-muted text-[12px] mt-3">Saving booking…</p>}
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
