import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Pill, GlassCard, BtnOlive, BtnOutline, Stars, PulseDot } from '../components/ui/index.jsx'
import { useFadeUp } from '../hooks/useScrollReveal.js'

/* ── Mock data ── */
const MOCK_VETS = [
  { id:1, name:'Dr. Aisha Mirza',  spec:'Feline Internist',  exp:'8 yrs',  fee:'₨ 1,500', status:'active',  appts:24, online:true  },
  { id:2, name:'Dr. Omar Khalid',  spec:'Feline Surgeon',    exp:'12 yrs', fee:'₨ 2,000', status:'active',  appts:18, online:false },
  { id:3, name:'Dr. Sana Farooq',  spec:'Dermatologist',     exp:'5 yrs',  fee:'₨ 1,200', status:'pending', appts:0,  online:false },
]

const MOCK_APPTS = [
  { id:1, cat:'Luna',  owner:'Laiba Khan',  vet:'Dr. Aisha Mirza', date:'Jun 14', time:'10:30 AM', type:'Vaccination', status:'confirmed' },
  { id:2, cat:'Mochi', owner:'Ahmed Ali',   vet:'Dr. Omar Khalid', date:'Jun 15', time:'2:00 PM',  type:'Surgery Consult', status:'confirmed' },
  { id:3, cat:'Biscuit',owner:'Sara Riaz',  vet:'Dr. Aisha Mirza', date:'Jun 16', time:'11:00 AM', type:'Checkup',      status:'pending'   },
]

const SPECIALTIES = [
  'Feline Internist','Feline Surgeon','Dermatologist','Ophthalmologist',
  'Nutritionist','Cardiologist','Neurologist','Emergency Medicine','Dentistry'
]

/* ── Vet Registration Modal ── */
function VetRegisterModal({ onClose, onRegister }) {
  const [name,    setName]    = useState('')
  const [email,   setEmail]   = useState('')
  const [spec,    setSpec]    = useState('')
  const [license, setLicense] = useState('')
  const [exp,     setExp]     = useState('')
  const [fee,     setFee]     = useState('')
  const [phone,   setPhone]   = useState('')
  const [bio,     setBio]     = useState('')
  const [err,     setErr]     = useState('')
  const [success, setSuccess] = useState(false)

  const inputCls = "w-full px-4 py-3 rounded-xl text-[14px] text-espresso outline-none transition-all"
  const inputSty = { background:'rgba(255,255,255,.9)', border:'1.5px solid #D7C9BD' }
  const fi = e => { e.target.style.borderColor='#556B2F'; e.target.style.boxShadow='0 0 0 3px rgba(85,107,47,.12)' }
  const fo = e => { e.target.style.borderColor='#D7C9BD'; e.target.style.boxShadow='none' }

  async function handleSubmit(e) {
    e.preventDefault()
    setErr('')
    if (!name || !email || !spec || !license) { setErr('Please fill all required fields.'); return }
    await new Promise(r => setTimeout(r, 1000))
    setSuccess(true)
    setTimeout(() => {
      onRegister({ id:Date.now(), name, spec, exp:exp+'yrs', fee:`₨ ${fee}`, status:'pending', appts:0, online:false })
    }, 1500)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background:'rgba(61,38,22,.45)', backdropFilter:'blur(6px)' }}>
      <div className="w-full max-w-lg rounded-3xl overflow-hidden"
           style={{ background:'#F5EBE6', maxHeight:'90vh', overflowY:'auto' }}>

        {/* Modal header */}
        <div className="px-6 py-5 flex items-center justify-between"
             style={{ borderBottom:'1px solid #D7C9BD', background:'rgba(255,255,255,.6)' }}>
          <div>
            <div className="font-display font-black text-[1.2rem] text-espresso">Register New Vet</div>
            <div className="text-[12px] text-clay-muted">This vet will be linked to your hospital</div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-clay-muted hover:bg-clay transition-colors">✕</button>
        </div>

        <div className="p-6">
          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-4"
                   style={{ background:'rgba(107,142,35,.15)' }}>✅</div>
              <div className="font-bold text-espresso text-[1.1rem] mb-2">Vet Profile Created!</div>
              <p className="text-clay-muted text-[13px]">
                An invitation email has been sent to <strong>{email}</strong>.<br/>
                Once they accept, their profile will go live.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="t-mono text-[10px] text-espresso-soft block mb-1.5">Full Name *</label>
                  <input value={name} onChange={e=>setName(e.target.value)} placeholder="Dr. Jane Doe"
                         className={inputCls} style={inputSty} onFocus={fi} onBlur={fo} />
                </div>
                <div>
                  <label className="t-mono text-[10px] text-espresso-soft block mb-1.5">Email Address *</label>
                  <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="vet@hospital.com"
                         className={inputCls} style={inputSty} onFocus={fi} onBlur={fo} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="t-mono text-[10px] text-espresso-soft block mb-1.5">Specialty *</label>
                  <select value={spec} onChange={e=>setSpec(e.target.value)} className={inputCls} style={inputSty}>
                    <option value="">Select specialty</option>
                    {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="t-mono text-[10px] text-espresso-soft block mb-1.5">PVMC License No. *</label>
                  <input value={license} onChange={e=>setLicense(e.target.value)} placeholder="PVMC-2024-XXXX"
                         className={inputCls} style={inputSty} onFocus={fi} onBlur={fo} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="t-mono text-[10px] text-espresso-soft block mb-1.5">Experience (years)</label>
                  <input type="number" value={exp} onChange={e=>setExp(e.target.value)} placeholder="e.g. 8"
                         className={inputCls} style={inputSty} onFocus={fi} onBlur={fo} />
                </div>
                <div>
                  <label className="t-mono text-[10px] text-espresso-soft block mb-1.5">Consultation Fee (₨)</label>
                  <input type="number" value={fee} onChange={e=>setFee(e.target.value)} placeholder="e.g. 1500"
                         className={inputCls} style={inputSty} onFocus={fi} onBlur={fo} />
                </div>
              </div>

              <div>
                <label className="t-mono text-[10px] text-espresso-soft block mb-1.5">Phone Number</label>
                <input value={phone} onChange={e=>setPhone(e.target.value.replace(/\D/g,'').slice(0,11))} placeholder="03XX XXXXXXX"
                       className={inputCls} style={inputSty} onFocus={fi} onBlur={fo} />
              </div>

              <div>
                <label className="t-mono text-[10px] text-espresso-soft block mb-1.5">Short Bio</label>
                <textarea value={bio} onChange={e=>setBio(e.target.value)} rows={3} placeholder="Brief professional bio…"
                          className={inputCls} style={{ ...inputSty, resize:'none' }} onFocus={fi} onBlur={fo} />
              </div>

              {err && (
                <div className="px-4 py-3 rounded-xl text-[13px]"
                     style={{ background:'rgba(196,56,56,.08)', border:'1px solid rgba(196,56,56,.2)', color:'#9B2020' }}>
                  ⚠️ {err}
                </div>
              )}

              <div className="flex gap-3 mt-2">
                <button type="button" onClick={onClose} className="btn btn-outline flex-1 justify-center !py-3">Cancel</button>
                <button type="submit" className="btn btn-olive flex-1 justify-center !py-3">✉️ Send Invite</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Main Dashboard ── */
export default function HospitalAdminDashboard() {
  const [tab,       setTab]       = useState('overview')
  const [vets,      setVets]      = useState(MOCK_VETS)
  const [showModal, setShowModal] = useState(false)
  const headerRef = useFadeUp(0)

  const stats = [
    { icon:'👨‍⚕️', label:'Total Vets',       value:vets.length,                            color:'rgba(107,142,35,.12)' },
    { icon:'📅', label:'Appointments Today', value:MOCK_APPTS.length,                      color:'rgba(196,140,56,.12)' },
    { icon:'⭐', label:'Avg. Rating',        value:'4.8 / 5',                              color:'rgba(107,142,35,.12)' },
    { icon:'🐱', label:'Active Patients',    value:'142',                                   color:'rgba(160,140,125,.12)'},
  ]

  const TABS = [
    { id:'overview',  label:'Overview'    },
    { id:'vets',      label:'Vets'        },
    { id:'appts',     label:'Appointments'},
    { id:'settings',  label:'Settings'    },
  ]

  return (
    <div className="min-h-screen" style={{ background:'#F5EBE6' }}>

      {showModal && (
        <VetRegisterModal
          onClose={() => setShowModal(false)}
          onRegister={v => { setVets(p => [...p, v]); setShowModal(false); setTab('vets') }}
        />
      )}

      {/* Header */}
      <header className="sticky top-0 z-40"
              style={{ background:'rgba(245,235,230,.92)', backdropFilter:'blur(18px)', borderBottom:'1px solid #D7C9BD' }}>
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-6">
          <Link to="/" className="flex items-center gap-2.5 no-underline flex-shrink-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                 style={{ background:'linear-gradient(135deg,#556B2F,#3D4F21)' }}>🐱</div>
            <span className="font-display font-black text-[17px] tracking-tight text-espresso">
              Purrfect<span className="text-olive">Care</span>
              <span className="text-[11px] text-clay-muted ml-2 font-mono font-normal">Hospital Admin</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-0.5">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                      className="nav-a"
                      style={tab===t.id ? { background:'rgba(85,107,47,.1)', color:'#556B2F' } : {}}>
                {t.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <button onClick={() => setShowModal(true)} className="btn btn-olive !py-2 !px-4 !text-[11px]">
              + Register Vet
            </button>
            <Link to="/" className="btn btn-outline !py-2 !px-4 !text-[10px]">Log out</Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-10">

        <div ref={headerRef} className="fade-up mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="t-label">Green Paw Veterinary Clinic</span>
            <Pill variant="green"><span style={{fontSize:9}}>✓ Verified</span></Pill>
          </div>
          <h1 className="font-display font-black text-espresso tracking-tight"
              style={{ fontSize:'clamp(1.6rem,3vw,2.2rem)' }}>Hospital Dashboard</h1>
        </div>

        {/* ── OVERVIEW ── */}
        {tab === 'overview' && (
          <div>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {stats.map(s => (
                <GlassCard key={s.label} className="p-5">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl mb-3"
                       style={{ background:s.color }}>{s.icon}</div>
                  <div className="font-black text-[1.5rem] text-espresso">{s.value}</div>
                  <div className="text-[12px] text-clay-muted">{s.label}</div>
                </GlassCard>
              ))}
            </div>

            {/* Today's Appointments */}
            <h2 className="font-display font-bold text-[1.1rem] text-espresso mb-4">Today's Appointments</h2>
            <div className="flex flex-col gap-3 mb-8">
              {MOCK_APPTS.slice(0,3).map(a => (
                <GlassCard key={a.id} className="p-4 flex items-center gap-4">
                  <div className="text-center flex-shrink-0 w-14">
                    <div className="font-mono font-black text-xl text-olive leading-none">{a.date.split(' ')[0]}</div>
                    <div className="t-mono text-[9px] text-clay-muted">{a.date.split(' ')[1]}</div>
                  </div>
                  <div className="w-px self-stretch" style={{ background:'#D7C9BD' }} />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[14px] text-espresso">{a.cat} · {a.owner}</div>
                    <div className="text-[12px] text-clay-muted">{a.vet} · {a.time}</div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Pill variant="clay"><span style={{fontSize:9}}>{a.type}</span></Pill>
                    <Pill variant={a.status==='confirmed' ? 'green' : 'amber'}>
                      <span style={{fontSize:9}}>{a.status}</span>
                    </Pill>
                  </div>
                </GlassCard>
              ))}
            </div>

            {/* Vet overview */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-[1.1rem] text-espresso">Veterinary Team</h2>
              <button onClick={() => setShowModal(true)} className="btn btn-olive !py-1.5 !px-4 !text-[10px]">+ Add Vet</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {vets.slice(0,3).map(v => (
                <GlassCard key={v.id} className="p-5 text-center">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3"
                       style={{ background:'rgba(107,142,35,.1)' }}>👨‍⚕️</div>
                  <div className="font-bold text-[14px] text-espresso">{v.name}</div>
                  <div className="t-mono text-[10px] text-olive mb-2">{v.spec}</div>
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <Pill variant={v.status==='active' ? 'green' : 'amber'}>
                      <span style={{fontSize:9}}>{v.status}</span>
                    </Pill>
                    {v.online && <><PulseDot size="sm"/><span className="t-mono text-[9px] text-olive">Online</span></>}
                  </div>
                  <div className="text-[12px] text-clay-muted">{v.appts} appointments this month</div>
                </GlassCard>
              ))}
            </div>
          </div>
        )}

        {/* ── VETS ── */}
        {tab === 'vets' && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-bold text-[1.1rem] text-espresso">Registered Vets ({vets.length})</h2>
              <button onClick={() => setShowModal(true)} className="btn btn-olive !py-2 !px-5 !text-[11px]">+ Register New Vet</button>
            </div>

            <div className="flex flex-col gap-3">
              {vets.map(v => (
                <GlassCard key={v.id} className="p-5 flex items-center gap-5">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                       style={{ background:'rgba(107,142,35,.1)' }}>👨‍⚕️</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[15px] text-espresso">{v.name}</div>
                    <div className="text-[12px] text-clay-muted">{v.spec} · {v.exp} experience</div>
                  </div>
                  <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
                    <span className="font-bold text-[14px] text-espresso">{v.fee}</span>
                    <span className="text-[11px] text-clay-muted">/ consult</span>
                  </div>
                  <Pill variant={v.status==='active' ? 'green' : 'amber'}>
                    <span style={{fontSize:9}}>{v.status}</span>
                  </Pill>
                  <div className="flex gap-2">
                    <button className="btn btn-outline !py-1.5 !px-3 !text-[10px]">Edit</button>
                    <button className="btn !py-1.5 !px-3 !text-[10px]"
                            style={{ background:'rgba(196,56,56,.08)', color:'#9B2020', border:'1px solid rgba(196,56,56,.2)' }}>
                      Remove
                    </button>
                  </div>
                </GlassCard>
              ))}
            </div>

            {/* Note */}
            <div className="mt-6 p-4 rounded-2xl text-[13px] text-clay-muted flex flex-col gap-2"
                 style={{ background:'rgba(107,142,35,.07)', border:'1px solid rgba(107,142,35,.18)' }}>
              <div>
                ℹ️ Vets registered here are exclusively linked to <strong className="text-espresso">Green Paw Veterinary Clinic</strong>.
                Each vet must have a valid PVMC license to be approved on the platform.
              </div>
              <div className="pt-2 flex items-start gap-2" style={{ borderTop:'1px solid rgba(107,142,35,.18)' }}>
                <span className="text-base flex-shrink-0">🔒</span>
                <span>
                  <strong className="text-espresso">Vets cannot self-register</strong> on Purrfect Care.
                  They can only join the platform by being registered and verified here by their Hospital Admin.
                  Once registered, vets receive an invitation email to set up their credentials.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ── APPOINTMENTS ── */}
        {tab === 'appts' && (
          <div>
            <h2 className="font-display font-bold text-[1.1rem] text-espresso mb-5">All Appointments</h2>
            <div className="flex flex-col gap-3">
              {MOCK_APPTS.map(a => (
                <GlassCard key={a.id} className="p-5">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-[15px] text-espresso">{a.cat} <span className="text-clay-muted font-normal">({a.owner})</span></div>
                      <div className="text-[12px] text-clay-muted">{a.vet} · {a.date} at {a.time}</div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Pill variant="clay"><span style={{fontSize:9}}>{a.type}</span></Pill>
                      <Pill variant={a.status==='confirmed' ? 'green' : 'amber'}>
                        <span style={{fontSize:9}}>{a.status}</span>
                      </Pill>
                    </div>
                    <div className="flex gap-2">
                      <button className="btn btn-olive !py-1.5 !px-3 !text-[10px]">✓ Confirm</button>
                      <button className="btn btn-outline !py-1.5 !px-3 !text-[10px]">Reschedule</button>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        )}

        {/* ── SETTINGS ── */}
        {tab === 'settings' && (
          <div className="max-w-lg">
            <h2 className="font-display font-bold text-[1.1rem] text-espresso mb-5">Hospital Settings</h2>
            <GlassCard className="p-6 flex flex-col gap-4">
              {[
                { label:'Hospital Name',       val:'Green Paw Veterinary Clinic' },
                { label:'City',                val:'Lahore'                       },
                { label:'License Number',      val:'VET-2024-04892'               },
                { label:'Subscription Plan',   val:'Professional · Monthly'       },
                { label:'Billing Renewal',     val:'July 4, 2026'                 },
              ].map(r => (
                <div key={r.label} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor:'#D7C9BD' }}>
                  <span className="text-[13px] text-clay-muted">{r.label}</span>
                  <span className="text-[13px] font-semibold text-espresso">{r.val}</span>
                </div>
              ))}
              <BtnOlive className="mt-2">Save Changes</BtnOlive>
            </GlassCard>
          </div>
        )}
      </main>
    </div>
  )
}
