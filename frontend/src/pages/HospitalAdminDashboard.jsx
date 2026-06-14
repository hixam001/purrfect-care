import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { Badge, Pill, GlassCard, BtnOlive, BtnOutline, PulseDot } from '../components/ui/index.jsx'
import { useFadeUp } from '../hooks/useScrollReveal.js'

const SPECIALTIES = [
  'Feline Internist','Feline Surgeon','Dermatologist','Ophthalmologist',
  'Nutritionist','Cardiologist','Neurologist','Emergency Medicine','Dentistry'
]

/* ── Vet Registration Modal ── */
function VetRegisterModal({ hospitalId, onClose, onRegister }) {
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
  const inputSty = { background:'rgba(255,255,255,.9)', border:'1.5px solid #b8ceb5' }
  const fi = e => { e.target.style.borderColor='#5e4749'; e.target.style.boxShadow='0 0 0 3px rgba(85,107,47,.12)' }
  const fo = e => { e.target.style.borderColor='#b8ceb5'; e.target.style.boxShadow='none' }

  async function handleSubmit(e) {
    e.preventDefault()
    setErr('')
    if (!name || !email || !spec || !license) { setErr('Please fill all required fields.'); return }
    setSuccess(true)
    setTimeout(() => {
      onRegister({ name, spec, exp, fee, license, phone, bio })
    }, 1500)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background:'rgba(61,38,22,.45)', backdropFilter:'blur(6px)' }}>
      <div className="w-full max-w-lg rounded-3xl overflow-hidden"
           style={{ background:'#dbe8d8', maxHeight:'90vh', overflowY:'auto' }}>
        <div className="px-6 py-5 flex items-center justify-between"
             style={{ borderBottom:'1px solid #b8ceb5', background:'rgba(255,255,255,.6)' }}>
          <div>
            <div className="font-display font-black text-[1.2rem] text-espresso">Register New Vet</div>
            <div className="text-[12px] text-clay-muted">This vet will be linked to your hospital</div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-clay-muted hover:bg-clay">✕</button>
        </div>
        <div className="p-6">
          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-4"
                   style={{ background:'rgba(94,71,73,.15)' }}>✅</div>
              <div className="font-bold text-espresso text-[1.1rem] mb-2">Vet Invite Sent!</div>
              <p className="text-clay-muted text-[13px]">
                An invitation email will be sent to <strong>{email}</strong>.<br />
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
  const { user } = useAuth()
  const [tab,       setTab]       = useState('overview')
  const [hospital,  setHospital]  = useState(null)
  const [vets,      setVets]      = useState([])
  const [appts,     setAppts]     = useState([])
  const [loading,   setLoading]   = useState(true)
  const [showModal, setShowModal] = useState(false)
  const headerRef = useFadeUp(0)

  /* ── Load real data ── */
  useEffect(() => {
    if (!user?.id) return

    async function load() {
      // Find the hospital this admin manages
      const { data: h } = await supabase
        .from('hospitals')
        .select('*')
        .eq('admin_user_id', user.id)
        .single()

      if (!h) { setLoading(false); return }
      setHospital(h)

      // Load vets
      const { data: v } = await supabase
        .from('vets')
        .select('id, specialization, experience_years, is_verified, rating, total_reviews, user_profiles ( name )')
        .eq('hospital_id', h.id)

      // Load appointments
      const { data: a } = await supabase
        .from('appointments')
        .select(`
          id, appointment_date, status, case_status, notes,
          cats ( name ),
          user_profiles ( name ),
          vets ( user_profiles ( name ) )
        `)
        .eq('hospital_id', h.id)
        .order('appointment_date', { ascending: false })
        .limit(50)

      setVets(v ?? [])
      setAppts(a ?? [])
      setLoading(false)
    }

    load()
  }, [user?.id])

  /* ── Toggle case status ── */
  async function toggleCaseStatus(apptId, currentStatus) {
    const nextStatus = currentStatus === 'open' ? 'closed' : 'open'
    const { error } = await supabase
      .from('appointments')
      .update({ case_status: nextStatus })
      .eq('id', apptId)

    if (!error) {
      setAppts(prev => prev.map(a => a.id === apptId ? { ...a, case_status: nextStatus } : a))
    }
  }

  /* ── Confirm appointment ── */
  async function confirmAppt(apptId) {
    await supabase.from('appointments').update({ status:'confirmed' }).eq('id', apptId)
    setAppts(prev => prev.map(a => a.id === apptId ? { ...a, status:'confirmed' } : a))
  }

  const TABS = [
    { id:'overview',  label:'Overview'     },
    { id:'vets',      label:'Vets'         },
    { id:'appts',     label:'Appointments' },
    { id:'settings',  label:'Settings'     },
  ]

  const stats = [
    { icon:'👨‍⚕️', label:'Total Vets',        value: vets.length,                              color:'rgba(94,71,73,.12)' },
    { icon:'📅',  label:'Total Appointments', value: appts.length,                             color:'rgba(196,140,56,.12)' },
    { icon:'💬',  label:'Open Cases',         value: appts.filter(a=>a.case_status==='open').length, color:'rgba(94,71,73,.12)' },
    { icon:'⭐',  label:'Avg. Rating',        value: hospital?.rating ? hospital.rating.toFixed(1)+'/5' : 'N/A', color:'rgba(160,140,125,.12)'},
  ]

  function fmtDate(iso) {
    return new Date(iso).toLocaleDateString('en-PK', { day:'numeric', month:'short', year:'numeric' })
  }
  function fmtTime(iso) {
    return new Date(iso).toLocaleTimeString('en-PK', { hour:'2-digit', minute:'2-digit' })
  }

  return (
    <div className="min-h-screen" style={{ background:'#dbe8d8' }}>

      {showModal && (
        <VetRegisterModal
          hospitalId={hospital?.id}
          onClose={() => setShowModal(false)}
          onRegister={() => { setShowModal(false) }}
        />
      )}

      {/* Header */}
      <header className="sticky top-0 z-40"
              style={{ background:'rgba(219,232,216,.92)', backdropFilter:'blur(18px)', borderBottom:'1px solid #b8ceb5' }}>
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-6">
          <Link to="/" className="flex items-center gap-2.5 no-underline flex-shrink-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                 style={{ background:'linear-gradient(135deg,#5e4749,#4a373a)' }}>🐱</div>
            <span className="font-display font-black text-[17px] tracking-tight text-espresso">
              Purrfect<span className="text-olive">Care</span>
              <span className="text-[11px] text-clay-muted ml-2 font-mono font-normal">Hospital Admin</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-0.5">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} className="nav-a"
                      style={tab===t.id ? { background:'rgba(85,107,47,.1)', color:'#5e4749' } : {}}>
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
            <span className="t-label">{hospital?.name ?? 'Your Hospital'}</span>
            {hospital?.is_approved && <Pill variant="green"><span style={{fontSize:9}}>✓ Verified</span></Pill>}
          </div>
          <h1 className="font-display font-black text-espresso tracking-tight"
              style={{ fontSize:'clamp(1.6rem,3vw,2.2rem)' }}>Hospital Dashboard</h1>
        </div>

        {loading ? (
          <div className="text-center py-20 text-clay-muted">Loading…</div>
        ) : !hospital ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-3">🏥</div>
            <div className="font-bold text-espresso mb-2">No hospital found</div>
            <p className="text-clay-muted text-[13px]">Your account is not linked to a hospital. Contact support.</p>
          </div>
        ) : (
          <>
            {/* ── OVERVIEW ── */}
            {tab === 'overview' && (
              <div>
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

                {/* Recent appointments */}
                <h2 className="font-display font-bold text-[1.1rem] text-espresso mb-4">Recent Appointments</h2>
                <div className="flex flex-col gap-3 mb-8">
                  {appts.slice(0,5).map(a => (
                    <GlassCard key={a.id} className="p-4 flex items-center gap-4">
                      <div className="text-center flex-shrink-0 w-14">
                        <div className="font-mono font-black text-xl text-olive leading-none">{fmtDate(a.appointment_date).split(' ')[0]}</div>
                        <div className="t-mono text-[9px] text-clay-muted">{fmtDate(a.appointment_date).split(' ')[1]}</div>
                      </div>
                      <div className="w-px self-stretch" style={{ background:'#b8ceb5' }} />
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-[14px] text-espresso">
                          {a.cats?.name} · {a.user_profiles?.name}
                        </div>
                        <div className="text-[12px] text-clay-muted">
                          {a.vets?.user_profiles?.name} · {fmtTime(a.appointment_date)}
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Pill variant={a.status==='confirmed' ? 'green' : 'amber'}>
                          <span style={{fontSize:9}}>{a.status}</span>
                        </Pill>
                        <Pill variant={a.case_status==='open' ? 'green' : 'clay'}>
                          <span style={{fontSize:9}}>{a.case_status==='open' ? '💬 Open' : '🔒 Closed'}</span>
                        </Pill>
                      </div>
                    </GlassCard>
                  ))}
                  {appts.length === 0 && (
                    <div className="text-center py-10 text-clay-muted text-[13px]">No appointments yet</div>
                  )}
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
                           style={{ background:'rgba(94,71,73,.1)' }}>👨‍⚕️</div>
                      <div className="font-bold text-[14px] text-espresso">{v.user_profiles?.name}</div>
                      <div className="t-mono text-[10px] text-olive mb-2">{v.specialization}</div>
                      <Pill variant={v.is_verified ? 'green' : 'amber'}>
                        <span style={{fontSize:9}}>{v.is_verified ? 'Verified' : 'Pending'}</span>
                      </Pill>
                    </GlassCard>
                  ))}
                  {vets.length === 0 && (
                    <div className="col-span-3 text-center py-8 text-clay-muted text-[13px]">No vets registered yet</div>
                  )}
                </div>
              </div>
            )}

            {/* ── VETS ── */}
            {tab === 'vets' && (
              <div>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-display font-bold text-[1.1rem] text-espresso">Registered Vets ({vets.length})</h2>
                  <button onClick={() => setShowModal(true)} className="btn btn-olive !py-2 !px-5 !text-[11px]">
                    + Register New Vet
                  </button>
                </div>

                <div className="flex flex-col gap-3">
                  {vets.map(v => (
                    <GlassCard key={v.id} className="p-5 flex items-center gap-5">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                           style={{ background:'rgba(94,71,73,.1)' }}>👨‍⚕️</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-[15px] text-espresso">{v.user_profiles?.name}</div>
                        <div className="text-[12px] text-clay-muted">
                          {v.specialization} {v.experience_years ? `· ${v.experience_years} yrs` : ''}
                        </div>
                      </div>
                      <Pill variant={v.is_verified ? 'green' : 'amber'}>
                        <span style={{fontSize:9}}>{v.is_verified ? 'Verified' : 'Pending'}</span>
                      </Pill>
                    </GlassCard>
                  ))}
                  {vets.length === 0 && (
                    <div className="text-center py-10 text-clay-muted text-[13px]">No vets registered yet. Add your first vet!</div>
                  )}
                </div>

                <div className="mt-6 p-4 rounded-2xl text-[13px] text-clay-muted"
                     style={{ background:'rgba(94,71,73,.07)', border:'1px solid rgba(94,71,73,.18)' }}>
                  🔒 Vets registered here are exclusively linked to <strong className="text-espresso">{hospital.name}</strong>.
                  Each vet must have a valid PVMC license to be approved on the platform.
                </div>
              </div>
            )}

            {/* ── APPOINTMENTS ── */}
            {tab === 'appts' && (
              <div>
                <h2 className="font-display font-bold text-[1.1rem] text-espresso mb-5">
                  All Appointments ({appts.length})
                </h2>
                <div className="flex flex-col gap-3">
                  {appts.map(a => (
                    <GlassCard key={a.id} className="p-5">
                      <div className="flex flex-wrap items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-[15px] text-espresso">
                            {a.cats?.name} <span className="text-clay-muted font-normal">({a.user_profiles?.name})</span>
                          </div>
                          <div className="text-[12px] text-clay-muted">
                            {a.vets?.user_profiles?.name} · {fmtDate(a.appointment_date)} at {fmtTime(a.appointment_date)}
                          </div>
                        </div>

                        <div className="flex gap-2 flex-shrink-0">
                          <Pill variant={a.status==='confirmed' ? 'green' : 'amber'}>
                            <span style={{fontSize:9}}>{a.status}</span>
                          </Pill>
                        </div>

                        <div className="flex gap-2 flex-wrap">
                          {/* Confirm button */}
                          {a.status === 'pending' && (
                            <button onClick={() => confirmAppt(a.id)}
                                    className="btn btn-olive !py-1.5 !px-3 !text-[10px]">
                              ✓ Confirm
                            </button>
                          )}

                          {/* Open / Close Case toggle */}
                          <button
                            onClick={() => toggleCaseStatus(a.id, a.case_status)}
                            className="btn !py-1.5 !px-3 !text-[10px]"
                            style={a.case_status === 'open'
                              ? { background:'rgba(196,56,56,.08)', color:'#9B2020', border:'1px solid rgba(196,56,56,.2)' }
                              : { background:'rgba(94,71,73,.1)',  color:'#5e4749', border:'1px solid rgba(94,71,73,.3)' }
                            }>
                            {a.case_status === 'open' ? '🔒 Close Case' : '💬 Open Chat'}
                          </button>
                        </div>
                      </div>

                      {/* Case status badge */}
                      <div className="mt-3 flex items-center gap-2">
                        <Pill variant={a.case_status==='open' ? 'green' : 'clay'}>
                          <span style={{fontSize:9}}>
                            {a.case_status==='open' ? '💬 Chat Active' : '🔒 Case Closed'}
                          </span>
                        </Pill>
                        <span className="text-[10px] text-clay-muted">
                          {a.case_status==='open'
                            ? 'Patient can chat with the vet'
                            : 'Chat is disabled for this appointment'}
                        </span>
                      </div>
                    </GlassCard>
                  ))}
                  {appts.length === 0 && (
                    <div className="text-center py-10 text-clay-muted text-[13px]">No appointments yet</div>
                  )}
                </div>
              </div>
            )}

            {/* ── SETTINGS ── */}
            {tab === 'settings' && (
              <div className="max-w-lg">
                <h2 className="font-display font-bold text-[1.1rem] text-espresso mb-5">Hospital Settings</h2>
                <GlassCard className="p-6 flex flex-col gap-4">
                  {[
                    { label:'Hospital Name', val: hospital.name },
                    { label:'City',          val: hospital.city  ?? '—' },
                    { label:'Address',       val: hospital.address },
                    { label:'Phone',         val: hospital.phone  ?? '—' },
                    { label:'Email',         val: hospital.email  ?? '—' },
                    { label:'Status',        val: hospital.is_approved ? 'Approved ✓' : 'Pending Review' },
                  ].map(r => (
                    <div key={r.label} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor:'#b8ceb5' }}>
                      <span className="text-[13px] text-clay-muted">{r.label}</span>
                      <span className="text-[13px] font-semibold text-espresso">{r.val}</span>
                    </div>
                  ))}
                </GlassCard>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
