import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Stepper from '../components/ui/Stepper.jsx'
import PaymentForm from '../components/ui/PaymentForm.jsx'

const STEPS = ['Hospital Info', 'Admin Account', 'Documents', 'Choose Plan', 'Payment', 'Done']

const HOSPITAL_TYPES = [
  { value:'general',   label:'General Veterinary Clinic',     icon:'🏥' },
  { value:'specialist',label:'Specialist Feline Hospital',    icon:'⚕️' },
  { value:'emergency', label:'Emergency & Critical Care',     icon:'🚨' },
  { value:'wellness',  label:'Wellness & Preventive Care',    icon:'🌿' },
]

const PLANS = [
  {
    id:'basic', name:'Basic',      price:'₨ 1,500/mo', yearly:'₨ 15,000/yr',
    color:'rgba(160,140,125,.12)', border:'#D7C9BD',
    features:['Up to 3 vets', '50 appointments/mo', 'Basic analytics', 'Email support'],
  },
  {
    id:'pro',   name:'Professional', price:'₨ 3,500/mo', yearly:'₨ 35,000/yr',
    color:'rgba(107,142,35,.1)',   border:'rgba(107,142,35,.35)', badge:'Most Popular',
    features:['Up to 15 vets', 'Unlimited appointments', 'Advanced analytics', 'Priority support', 'Digital prescriptions', 'Patient history'],
  },
  {
    id:'ent',   name:'Enterprise',  price:'₨ 7,500/mo', yearly:'₨ 75,000/yr',
    color:'rgba(61,38,22,.07)',    border:'rgba(61,38,22,.25)',
    features:['Unlimited vets', 'Unlimited everything', 'Custom integrations', 'Dedicated account manager', 'AI diagnostics', 'Multi-branch support'],
  },
]

const inputCls = "w-full px-4 py-3 rounded-xl text-[14px] text-espresso outline-none transition-all"
const inputSty = { background:'rgba(255,255,255,.8)', border:'1.5px solid #D7C9BD' }
const fi = e => { e.target.style.borderColor='#556B2F'; e.target.style.boxShadow='0 0 0 3px rgba(85,107,47,.12)' }
const fo = e => { e.target.style.borderColor='#D7C9BD'; e.target.style.boxShadow='none' }

function Label({ children }) {
  return <label className="t-mono text-[10px] text-espresso-soft block mb-1.5">{children}</label>
}
function Field({ label, children }) {
  return <div><Label>{label}</Label>{children}</div>
}

export default function HospitalRegisterPage() {
  const navigate = useNavigate()
  const [step, setStep]         = useState(0)
  const [plan, setPlan]         = useState('pro')
  const [billing, setBilling]   = useState('monthly')

  /* Step 1 */
  const [hospName, setHospName]     = useState('')
  const [hospType, setHospType]     = useState('')
  const [license,  setLicense]      = useState('')
  const [city,     setCity]         = useState('')
  const [address,  setAddress]      = useState('')
  const [phone,    setPhone]        = useState('')

  /* Step 2 */
  const [adminName, setAdminName]   = useState('')
  const [adminEmail,setAdminEmail]  = useState('')
  const [adminCnic, setAdminCnic]   = useState('')
  const [password,  setPassword]    = useState('')
  const [confirm,   setConfirm]     = useState('')
  const [err,       setErr]         = useState('')

  const selectedPlan = PLANS.find(p => p.id === plan)
  const payAmount = billing === 'monthly' ? selectedPlan?.price : selectedPlan?.yearly

  function next() { setErr(''); setStep(s => s + 1) }
  function back() { setErr(''); setStep(s => s - 1) }

  function validateStep() {
    if (step === 0) {
      if (!hospName || !hospType || !license || !city) { setErr('Please fill all required fields.'); return false }
    }
    if (step === 1) {
      if (!adminName || !adminEmail || !password) { setErr('Please fill all required fields.'); return false }
      if (password !== confirm)                   { setErr('Passwords do not match.'); return false }
      if (password.length < 8)                    { setErr('Password must be at least 8 characters.'); return false }
    }
    return true
  }

  function handleNext() {
    if (validateStep()) next()
  }

  return (
    <div className="min-h-screen" style={{ background:'linear-gradient(135deg,#F5EBE6 0%,#EFE5DC 100%)' }}>
      <div className="max-w-3xl mx-auto px-4 py-10">

        {/* Back to home */}
        <Link to="/" className="flex items-center gap-2 no-underline mb-8 w-fit">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
               style={{ background:'linear-gradient(135deg,#556B2F,#3D4F21)' }}>🐱</div>
          <span className="font-display font-black text-lg text-espresso">
            Purrfect<span className="text-olive">Care</span>
          </span>
        </Link>

        {/* Header */}
        {step < 5 && (
          <div className="mb-8">
            <span className="t-label mb-3 inline-block">Hospital / Clinic Registration</span>
            <h1 className="font-display font-black text-espresso tracking-tight mb-2"
                style={{ fontSize:'clamp(1.6rem,3vw,2.2rem)' }}>
              Register Your Veterinary Hospital
            </h1>
            <p className="text-clay-muted text-[14px]">
              Set up your hospital profile and start onboarding your veterinary team.
            </p>
          </div>
        )}

        {/* Stepper */}
        {step < 5 && <Stepper steps={STEPS} current={step} />}

        {/* Card */}
        {step < 5 && (
          <div className="rounded-3xl p-8" style={{ background:'rgba(255,255,255,.75)', backdropFilter:'blur(12px)', border:'1px solid #D7C9BD' }}>

            {/* ── STEP 0: Hospital Info ── */}
            {step === 0 && (
              <div className="flex flex-col gap-4">
                <h2 className="font-display font-black text-[1.3rem] text-espresso mb-2">Hospital Information</h2>

                <Field label="Hospital / Clinic Name *">
                  <input value={hospName} onChange={e=>setHospName(e.target.value)}
                         placeholder="e.g. Green Paw Veterinary Clinic"
                         className={inputCls} style={inputSty} onFocus={fi} onBlur={fo} />
                </Field>

                <div>
                  <Label>Hospital Type *</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {HOSPITAL_TYPES.map(t => (
                      <button key={t.value} type="button" onClick={() => setHospType(t.value)}
                              className="flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all"
                              style={{
                                background: hospType===t.value ? 'rgba(85,107,47,.1)' : 'rgba(255,255,255,.6)',
                                border:     hospType===t.value ? '2px solid #556B2F'  : '1.5px solid #D7C9BD',
                              }}>
                        <span className="text-xl">{t.icon}</span>
                        <span className="text-[13px] font-semibold text-espresso">{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="License / Registration Number *">
                    <input value={license} onChange={e=>setLicense(e.target.value)}
                           placeholder="VET-2024-XXXXX"
                           className={inputCls} style={inputSty} onFocus={fi} onBlur={fo} />
                  </Field>
                  <Field label="City *">
                    <select value={city} onChange={e=>setCity(e.target.value)}
                            className={inputCls} style={inputSty}>
                      <option value="">Select city</option>
                      {['Lahore','Karachi','Islamabad','Rawalpindi','Faisalabad','Multan','Peshawar'].map(c=>(
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </Field>
                </div>

                <Field label="Street Address">
                  <input value={address} onChange={e=>setAddress(e.target.value)}
                         placeholder="Full street address"
                         className={inputCls} style={inputSty} onFocus={fi} onBlur={fo} />
                </Field>

                <Field label="Hospital Contact Number">
                  <input value={phone} onChange={e=>setPhone(e.target.value.replace(/\D/g,'').slice(0,11))}
                         placeholder="03XX XXXXXXX"
                         className={inputCls} style={inputSty} onFocus={fi} onBlur={fo} />
                </Field>
              </div>
            )}

            {/* ── STEP 1: Admin Account ── */}
            {step === 1 && (
              <div className="flex flex-col gap-4">
                <h2 className="font-display font-black text-[1.3rem] text-espresso mb-2">Admin Account Details</h2>

                <Field label="Full Name *">
                  <input value={adminName} onChange={e=>setAdminName(e.target.value)}
                         placeholder="Hospital Admin's Full Name"
                         className={inputCls} style={inputSty} onFocus={fi} onBlur={fo} />
                </Field>

                <Field label="Email Address *">
                  <input type="email" value={adminEmail} onChange={e=>setAdminEmail(e.target.value)}
                         placeholder="admin@hospital.com"
                         className={inputCls} style={inputSty} onFocus={fi} onBlur={fo} />
                </Field>

                <Field label="CNIC Number">
                  <input value={adminCnic} onChange={e=>setAdminCnic(e.target.value.replace(/\D/g,'').slice(0,13))}
                         placeholder="3520XXXXXXXXXX (without dashes)"
                         className={inputCls} style={inputSty} onFocus={fi} onBlur={fo} />
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Password *">
                    <input type="password" value={password} onChange={e=>setPassword(e.target.value)}
                           placeholder="Min. 8 characters"
                           className={inputCls} style={inputSty} onFocus={fi} onBlur={fo} />
                  </Field>
                  <Field label="Confirm Password *">
                    <input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)}
                           placeholder="Repeat password"
                           className={inputCls} style={inputSty} onFocus={fi} onBlur={fo} />
                  </Field>
                </div>
              </div>
            )}

            {/* ── STEP 2: Documents ── */}
            {step === 2 && (
              <div className="flex flex-col gap-5">
                <h2 className="font-display font-black text-[1.3rem] text-espresso mb-2">Verification Documents</h2>
                <p className="text-clay-muted text-[13px] -mt-2">Upload required documents for verification. Accepted formats: PDF, JPG, PNG.</p>

                {[
                  { label:'Hospital Registration Certificate *', hint:'Issued by Provincial Veterinary Council' },
                  { label:'Veterinary License *',                hint:'Valid license from Pakistan Veterinary Medical Council (PVMC)' },
                  { label:'Owner / Director CNIC',               hint:'Front side of CNIC/Passport' },
                  { label:'Proof of Address',                    hint:'Utility bill or tenancy agreement (last 3 months)' },
                ].map(doc => (
                  <div key={doc.label} className="p-5 rounded-2xl cursor-pointer transition-all"
                       style={{ background:'rgba(255,255,255,.6)', border:'2px dashed #D7C9BD' }}
                       onMouseOver={e=>e.currentTarget.style.borderColor='#556B2F'}
                       onMouseOut={e=>e.currentTarget.style.borderColor='#D7C9BD'}>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                           style={{ background:'rgba(107,142,35,.1)' }}>📄</div>
                      <div className="flex-1">
                        <div className="font-semibold text-[14px] text-espresso">{doc.label}</div>
                        <div className="text-[12px] text-clay-muted">{doc.hint}</div>
                      </div>
                      <div className="btn btn-outline !py-2 !px-4 !text-[10px]">Upload</div>
                    </div>
                  </div>
                ))}

                <div className="p-4 rounded-xl text-[12px] text-clay-muted"
                     style={{ background:'rgba(196,140,56,.08)', border:'1px solid rgba(196,140,56,.2)' }}>
                  ⏱️ Verification typically takes <strong>24–48 hours</strong>. You'll receive an email once approved.
                </div>
              </div>
            )}

            {/* ── STEP 3: Plans ── */}
            {step === 3 && (
              <div>
                <h2 className="font-display font-black text-[1.3rem] text-espresso mb-2">Choose Your Plan</h2>
                <div className="flex gap-2 mb-5">
                  {['monthly','yearly'].map(b => (
                    <button key={b} type="button" onClick={()=>setBilling(b)}
                            className="flex-1 py-2 rounded-xl text-[12px] font-bold transition-all"
                            style={{ background: billing===b ? '#556B2F' : 'rgba(255,255,255,.7)',
                                     color: billing===b ? '#fff' : '#4E342E', border: billing===b ? 'none' : '1.5px solid #D7C9BD' }}>
                      {b === 'monthly' ? 'Monthly' : 'Yearly (2 months free)'}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {PLANS.map(p => (
                    <div key={p.id} onClick={()=>setPlan(p.id)}
                         className="relative p-5 rounded-2xl cursor-pointer transition-all"
                         style={{ background:p.color, border:`2px solid ${plan===p.id ? '#556B2F' : p.border}` }}>
                      {p.badge && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <span className="t-label text-[9px]">{p.badge}</span>
                        </div>
                      )}
                      <div className="font-display font-black text-[1.1rem] text-espresso mb-1">{p.name}</div>
                      <div className="font-black text-[1.5rem] text-olive mb-3">
                        {billing==='monthly' ? p.price : p.yearly}
                      </div>
                      <div className="flex flex-col gap-1.5">
                        {p.features.map(f => (
                          <div key={f} className="flex items-start gap-2 text-[12px] text-espresso-soft">
                            <span className="text-olive mt-0.5 flex-shrink-0">✓</span>{f}
                          </div>
                        ))}
                      </div>
                      {plan===p.id && (
                        <div className="mt-3 pt-3 border-t" style={{ borderColor:'rgba(107,142,35,.2)' }}>
                          <span className="t-mono text-[9px] text-olive">✓ Selected</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── STEP 4: Payment ── */}
            {step === 4 && (
              <PaymentForm
                amount={payAmount}
                title={`${selectedPlan?.name} Plan · ${billing === 'monthly' ? 'Monthly' : 'Annual'}`}
                onBack={back}
                onSuccess={() => setStep(5)}
              />
            )}

            {/* Error */}
            {err && step < 4 && (
              <div className="mt-4 px-4 py-3 rounded-xl text-[13px]"
                   style={{ background:'rgba(196,56,56,.08)', border:'1px solid rgba(196,56,56,.2)', color:'#9B2020' }}>
                ⚠️ {err}
              </div>
            )}

            {/* Nav buttons (not on payment step) */}
            {step < 4 && (
              <div className="flex gap-3 mt-6">
                {step > 0 && (
                  <button type="button" onClick={back}
                          className="btn btn-outline flex-1 justify-center !py-3">← Back</button>
                )}
                <button type="button" onClick={handleNext}
                        className="btn btn-olive flex-1 justify-center !py-3">
                  {step === 3 ? 'Continue to Payment →' : 'Continue →'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 5: SUCCESS ── */}
        {step === 5 && (
          <div className="text-center py-16 px-8 rounded-3xl"
               style={{ background:'rgba(255,255,255,.75)', backdropFilter:'blur(12px)', border:'1px solid rgba(107,142,35,.25)' }}>
            <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mx-auto mb-6"
                 style={{ background:'rgba(107,142,35,.15)', border:'2px solid rgba(107,142,35,.3)' }}>🏥</div>
            <div className="t-label mb-4 inline-block">Registration Complete</div>
            <h2 className="font-display font-black text-[2rem] text-espresso tracking-tight mb-3">
              Welcome to Purrfect Care!
            </h2>
            <p className="text-clay-muted text-[15px] max-w-md mx-auto mb-6">
              Your hospital <strong className="text-espresso">{hospName}</strong> has been registered.
              Our team will verify your documents within 24–48 hours.
            </p>
            <div className="flex flex-col gap-3 max-w-xs mx-auto">
              <button onClick={() => navigate('/hospital/dashboard')}
                      className="btn btn-olive justify-center !py-3 w-full">
                Go to Hospital Dashboard →
              </button>
              <Link to="/" className="text-[13px] text-clay-muted hover:text-olive">← Back to home</Link>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
