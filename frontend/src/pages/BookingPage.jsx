import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Badge, Pill, GlassCard, BtnOlive, BtnOutline, Stars, PulseDot } from '../components/ui/index.jsx'
import PaymentForm from '../components/ui/PaymentForm.jsx'
import Stepper from '../components/ui/Stepper.jsx'

const STEPS = ['Select Date & Time', 'Choose Pet', 'Review & Pay', 'Confirmed']

/* ── Mock vet data ── */
const VET = {
  name:    'Dr. Aisha Mirza',
  spec:    'Feline Internist',
  clinic:  'Green Paw Veterinary Clinic',
  city:    'Lahore · 1.2 km away',
  stars:   5,
  reviews: 148,
  exp:     '8 years',
  fee:     '₨ 1,500',
  feeNum:  '₨ 1,500',
  online:  true,
  bio:     'Dr. Aisha Mirza is a board-certified feline internist with 8 years of experience specialising in internal medicine, diagnostics, and chronic disease management in cats.',
}

/* Calendar helpers */
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

function Calendar({ selected, onSelect }) {
  const today  = new Date()
  const [year, setYear]  = useState(today.getFullYear())
  const [month, setMonth]= useState(today.getMonth())

  const firstDay = new Date(year, month, 1).getDay()
  const daysIn   = new Date(year, month+1, 0).getDate()

  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysIn; d++) cells.push(d)

  const isPast = d => {
    const date = new Date(year, month, d)
    date.setHours(0,0,0,0)
    const t = new Date(); t.setHours(0,0,0,0)
    return date < t
  }

  const isSel = d => selected === `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`

  function pick(d) {
    if (!d || isPast(d)) return
    onSelect(`${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`)
  }

  return (
    <div className="rounded-2xl p-5" style={{ background:'rgba(255,255,255,.7)', border:'1px solid #D7C9BD' }}>
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button type="button" onClick={() => { if (month === 0) { setMonth(11); setYear(y=>y-1) } else setMonth(m=>m-1) }}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-clay-muted hover:bg-clay transition-colors">‹</button>
        <span className="font-bold text-[14px] text-espresso">{MONTHS[month]} {year}</span>
        <button type="button" onClick={() => { if (month === 11) { setMonth(0); setYear(y=>y+1) } else setMonth(m=>m+1) }}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-clay-muted hover:bg-clay transition-colors">›</button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-2">
        {DAYS.map(d => <div key={d} className="text-center t-mono text-[9px] text-clay-muted py-1">{d}</div>)}
      </div>

      {/* Cells */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => (
          <button key={i} type="button" onClick={() => pick(d)} disabled={!d || isPast(d)}
                  className="aspect-square w-full rounded-xl text-[13px] font-medium transition-all"
                  style={{
                    background:   isSel(d)     ? '#556B2F'                  : d && !isPast(d) ? 'transparent' : 'transparent',
                    color:        isSel(d)      ? '#fff'                     : isPast(d) || !d ? '#C4B5AC'    : '#4E342E',
                    cursor:       !d||isPast(d) ? 'default'                 : 'pointer',
                    fontWeight:   isSel(d)      ? '700'                     : '500',
                  }}
                  onMouseOver={e => { if (d && !isPast(d) && !isSel(d)) e.currentTarget.style.background='rgba(85,107,47,.1)' }}
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
const UNAVAILABLE = ['10:30 AM','3:00 PM']

const MY_CATS = [
  { id:1, name:'Luna',   breed:'British Shorthair', age:'3 yrs', icon:'🐱' },
  { id:2, name:'Mochi',  breed:'Persian',           age:'2 yrs', icon:'😺' },
  { id:3, name:'Biscuit',breed:'Tabby',             age:'5 yrs', icon:'🐈' },
]

export default function BookingPage() {
  const navigate  = useNavigate()
  const [step, setStep]     = useState(0)
  const [date, setDate]     = useState('')
  const [time, setTime]     = useState('')
  const [catId,setCatId]    = useState(null)
  const [notes,setNotes]    = useState('')
  const [done, setDone]     = useState(false)

  const cat = MY_CATS.find(c => c.id === catId)
  const bookingRef = 'PC-' + Math.random().toString(36).slice(2,8).toUpperCase()

  function fmtDate(d) {
    if (!d) return ''
    const [y,m,day] = d.split('-')
    return `${day} ${MONTHS[parseInt(m)-1]} ${y}`
  }

  if (done) return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background:'linear-gradient(135deg,#F5EBE6,#EFE5DC)' }}>
      <div className="max-w-md w-full rounded-3xl p-10 text-center"
           style={{ background:'rgba(255,255,255,.85)', backdropFilter:'blur(12px)', border:'1px solid rgba(107,142,35,.25)' }}>
        <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mx-auto mb-5"
             style={{ background:'rgba(107,142,35,.15)', border:'2px solid rgba(107,142,35,.3)' }}>📅</div>
        <div className="t-label mb-3 inline-block">Booking Confirmed</div>
        <h2 className="font-display font-black text-[1.8rem] text-espresso mb-3">You're booked!</h2>
        <div className="flex flex-col gap-2 mb-5 p-4 rounded-2xl text-left"
             style={{ background:'rgba(107,142,35,.07)', border:'1px solid rgba(107,142,35,.18)' }}>
          {[
            ['Reference', bookingRef],
            ['Vet',       VET.name],
            ['Clinic',    VET.clinic],
            ['Cat',       cat?.name ?? '—'],
            ['Date',      fmtDate(date)],
            ['Time',      time],
            ['Fee Paid',  VET.feeNum],
          ].map(([k,v]) => (
            <div key={k} className="flex justify-between text-[13px]">
              <span className="text-clay-muted">{k}</span>
              <span className="font-semibold text-espresso">{v}</span>
            </div>
          ))}
        </div>
        <p className="text-clay-muted text-[12px] mb-5">
          A confirmation email has been sent. You will receive a reminder 1 hour before your appointment.
        </p>
        <div className="flex flex-col gap-3">
          <button onClick={() => navigate('/dashboard')} className="btn btn-olive justify-center w-full !py-3">Go to Dashboard</button>
          <Link to="/find-vets" className="text-[13px] text-clay-muted hover:text-olive">← Book another vet</Link>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen" style={{ background:'linear-gradient(135deg,#F5EBE6,#EFE5DC)' }}>
      <div className="max-w-4xl mx-auto px-4 py-10">

        {/* Header */}
        <Link to="/find-vets" className="flex items-center gap-2 no-underline mb-8 text-clay-muted hover:text-olive text-[13px] w-fit">
          ← Back to Find Vets
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
          {/* Left: form */}
          <div>
            <div className="mb-6">
              <Badge className="mb-2">Book Appointment</Badge>
              <h1 className="font-display font-black text-espresso tracking-tight"
                  style={{ fontSize:'clamp(1.5rem,3vw,2rem)' }}>
                Book with {VET.name}
              </h1>
            </div>

            <Stepper steps={STEPS} current={step} />

            <div className="rounded-3xl p-6" style={{ background:'rgba(255,255,255,.75)', backdropFilter:'blur(12px)', border:'1px solid #D7C9BD' }}>

              {/* ── STEP 0: Date & Time ── */}
              {step === 0 && (
                <div>
                  <h2 className="font-bold text-[1rem] text-espresso mb-4">Select Date</h2>
                  <Calendar selected={date} onSelect={setDate} />

                  {date && (
                    <div className="mt-5">
                      <h2 className="font-bold text-[1rem] text-espresso mb-3">Select Time — <span className="text-olive">{fmtDate(date)}</span></h2>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {TIME_SLOTS.map(t => {
                          const unavail = UNAVAILABLE.includes(t)
                          return (
                            <button key={t} type="button" disabled={unavail} onClick={() => setTime(t)}
                                    className="py-2.5 rounded-xl text-[12px] font-semibold transition-all"
                                    style={{
                                      background: time===t      ? '#556B2F'              : unavail ? 'rgba(215,201,189,.4)' : 'rgba(255,255,255,.7)',
                                      color:      time===t      ? '#fff'                 : unavail ? '#C4B5AC'               : '#4E342E',
                                      border:     time===t      ? 'none'                 : `1px solid ${unavail ? '#E0D5CF' : '#D7C9BD'}`,
                                      cursor:     unavail       ? 'not-allowed'          : 'pointer',
                                      textDecoration: unavail   ? 'line-through'         : 'none',
                                    }}>
                              {t}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 mt-6 items-center text-[11px] text-clay-muted">
                    <div className="w-4 h-4 rounded" style={{ background:'rgba(215,201,189,.4)', border:'1px solid #E0D5CF' }} />
                    <span>Not available</span>
                    <div className="w-4 h-4 rounded ml-3 bg-olive" />
                    <span>Selected</span>
                  </div>

                  <button onClick={() => setStep(1)} disabled={!date || !time}
                          className="btn btn-olive w-full justify-center !py-3 mt-5"
                          style={{ opacity:(!date||!time) ? .5 : 1 }}>
                    Continue →
                  </button>
                </div>
              )}

              {/* ── STEP 1: Choose Pet ── */}
              {step === 1 && (
                <div>
                  <h2 className="font-bold text-[1rem] text-espresso mb-4">Which cat is this appointment for?</h2>
                  <div className="flex flex-col gap-3 mb-5">
                    {MY_CATS.map(c => (
                      <button key={c.id} type="button" onClick={() => setCatId(c.id)}
                              className="flex items-center gap-4 px-5 py-4 rounded-2xl text-left transition-all"
                              style={{
                                background: catId===c.id ? 'rgba(85,107,47,.08)' : 'rgba(255,255,255,.7)',
                                border:     catId===c.id ? '2px solid #556B2F'  : '1.5px solid #D7C9BD',
                              }}>
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
                             style={{ background:'rgba(107,142,35,.1)' }}>{c.icon}</div>
                        <div>
                          <div className="font-bold text-[15px] text-espresso">{c.name}</div>
                          <div className="text-[12px] text-clay-muted">{c.breed} · {c.age}</div>
                        </div>
                        {catId===c.id && <div className="ml-auto w-6 h-6 rounded-full bg-olive flex items-center justify-center text-white text-[12px]">✓</div>}
                      </button>
                    ))}
                  </div>

                  <div>
                    <label className="t-mono text-[10px] text-espresso-soft block mb-1.5">Additional Notes (optional)</label>
                    <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={3}
                              placeholder="Describe symptoms, reason for visit, or special instructions…"
                              className="w-full px-4 py-3 rounded-xl text-[14px] text-espresso outline-none transition-all"
                              style={{ background:'rgba(255,255,255,.8)', border:'1.5px solid #D7C9BD', resize:'none' }} />
                  </div>

                  <div className="flex gap-3 mt-5">
                    <button type="button" onClick={() => setStep(0)} className="btn btn-outline flex-1 justify-center !py-3">← Back</button>
                    <button onClick={() => setStep(2)} disabled={!catId}
                            className="btn btn-olive flex-1 justify-center !py-3"
                            style={{ opacity:!catId ? .5 : 1 }}>
                      Continue →
                    </button>
                  </div>
                </div>
              )}

              {/* ── STEP 2: Review & Pay ── */}
              {step === 2 && (
                <div>
                  <h2 className="font-bold text-[1rem] text-espresso mb-4">Review & Complete Payment</h2>

                  {/* Summary */}
                  <div className="p-4 rounded-2xl mb-5"
                       style={{ background:'rgba(107,142,35,.07)', border:'1px solid rgba(107,142,35,.2)' }}>
                    <div className="t-mono text-[10px] text-olive mb-3">BOOKING SUMMARY</div>
                    {[
                      ['Vet',    VET.name  ],
                      ['Clinic', VET.clinic],
                      ['Date',   fmtDate(date)],
                      ['Time',   time      ],
                      ['Cat',    cat?.name ],
                    ].map(([k,v]) => (
                      <div key={k} className="flex justify-between py-1.5 text-[13px] border-b last:border-0" style={{ borderColor:'rgba(107,142,35,.15)' }}>
                        <span className="text-clay-muted">{k}</span>
                        <span className="font-semibold text-espresso">{v}</span>
                      </div>
                    ))}
                  </div>

                  <PaymentForm
                    amount={VET.feeNum}
                    title={`Consultation with ${VET.name}`}
                    onBack={() => setStep(1)}
                    onSuccess={() => setDone(true)}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Right: Vet card */}
          <div className="lg:sticky lg:top-24 h-fit">
            <GlassCard className="p-6">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-4"
                   style={{ background:'linear-gradient(135deg,rgba(107,142,35,.18),rgba(107,142,35,.08))',
                            boxShadow:'0 0 0 6px rgba(107,142,35,.1)' }}>
                👩‍⚕️
              </div>
              <div className="text-center mb-4">
                <div className="font-bold text-[16px] text-espresso">{VET.name}</div>
                <div className="t-mono text-[10px] text-olive mb-2">{VET.spec}</div>
                <Stars rating={VET.stars} />
                <span className="text-[11px] text-clay-muted"> ({VET.reviews} reviews)</span>
              </div>

              <div className="flex flex-col gap-2 mb-4">
                {[
                  ['🏥 Clinic', VET.clinic],
                  ['📍 Location', VET.city],
                  ['⏱️ Experience', VET.exp],
                ].map(([k,v]) => (
                  <div key={k} className="flex justify-between text-[12px]">
                    <span className="text-clay-muted">{k}</span>
                    <span className="font-medium text-espresso text-right max-w-[55%]">{v}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl mb-4"
                   style={{ background:'rgba(107,142,35,.08)', border:'1px solid rgba(107,142,35,.2)' }}>
                <span className="text-[13px] text-clay-muted">Consultation Fee</span>
                <span className="font-black text-[18px] text-olive">{VET.fee}</span>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <PulseDot size="sm" />
                <span className="t-mono text-[10px] text-olive">Available Now</span>
              </div>

              <Pill variant="green" className="w-full justify-center">✓ PVMC Verified</Pill>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  )
}
