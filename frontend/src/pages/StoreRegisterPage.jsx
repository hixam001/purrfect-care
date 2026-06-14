import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Stepper from '../components/ui/Stepper.jsx'
import PaymentForm from '../components/ui/PaymentForm.jsx'

/* ─────────────────────────────────────────────────────────────────────
   Store registration — GATED flow.
   After submitting, stores go into "pending_review" status.
   They are NOT live until approved by a System Admin.
   This mirrors the hospital registration security model.
───────────────────────────────────────────────────────────────────── */

const STEPS = ['Store Type', 'Store Info', 'Owner Details', 'Documents', 'Choose Plan', 'Payment', 'Done']

const STORE_TYPES = [
  { value:'online',   icon:'🌐', label:'Online Store',       desc:'Sell products through the Purrfect Care app only'         },
  { value:'physical', icon:'🏪', label:'Physical Store',     desc:'Have a walk-in store location that customers can visit'   },
  { value:'both',     icon:'🔗', label:'Online + Physical',  desc:'Operate both digitally and at a physical store location'  },
]

const CATEGORIES = ['Food & Treats','Beds & Furniture','Wellness','Grooming','Toys','Supplements','Clothing','Accessories','Medications']

const PLANS = [
  {
    id:'starter', name:'Starter',    price:'₨ 500/mo',   yearly:'₨ 5,000/yr', commission:'8%',
    color:'rgba(160,140,125,.1)', border:'#b8ceb5',
    features:['Up to 30 products', '₨ 50,000 monthly orders', '8% commission per order', 'Standard delivery integration','Email support'],
  },
  {
    id:'growth',  name:'Growth',     price:'₨ 1,500/mo', yearly:'₨ 15,000/yr', commission:'5%', badge:'Best Value',
    color:'rgba(94,71,73,.1)', border:'rgba(94,71,73,.35)',
    features:['Up to 200 products','Unlimited orders','5% commission per order','Priority listing in search','Real-time analytics','Dedicated support'],
  },
  {
    id:'premium', name:'Premium',    price:'₨ 3,500/mo', yearly:'₨ 35,000/yr', commission:'3%',
    color:'rgba(196,140,56,.1)', border:'rgba(196,140,56,.35)',
    features:['Unlimited products','Unlimited orders','3% commission per order','Featured store placement','AI-driven recommendations','Vet-approved badge eligibility','API access'],
  },
]

const inputCls = "w-full px-4 py-3 rounded-xl text-[14px] text-espresso outline-none transition-all"
const inputSty = { background:'rgba(255,255,255,.8)', border:'1.5px solid #b8ceb5' }
const fi = e => { e.target.style.borderColor='#5e4749'; e.target.style.boxShadow='0 0 0 3px rgba(85,107,47,.12)' }
const fo = e => { e.target.style.borderColor='#b8ceb5'; e.target.style.boxShadow='none' }

function Label({ children }) {
  return <label className="t-mono text-[10px] text-espresso-soft block mb-1.5">{children}</label>
}
function Field({ label, children }) {
  return <div><Label>{label}</Label>{children}</div>
}

export default function StoreRegisterPage() {
  const navigate = useNavigate()
  const [step,     setStep]     = useState(0)
  const [plan,     setPlan]     = useState('growth')
  const [billing,  setBilling]  = useState('monthly')

  /* Step 0 */
  const [storeType, setStoreType] = useState('')

  /* Step 1 */
  const [storeName, setStoreName]   = useState('')
  const [storeDesc, setStoreDesc]   = useState('')
  const [city,      setCity]        = useState('')
  const [address,   setAddress]     = useState('')
  const [storePhone,setStorePhone]  = useState('')
  const [selCats,   setSelCats]     = useState([])

  /* Step 2 — Owner Details */
  const [ownerName,  setOwnerName]  = useState('')
  const [ownerEmail, setOwnerEmail] = useState('')
  const [ownerCnic,  setOwnerCnic]  = useState('')
  const [ownerPhone, setOwnerPhone] = useState('')
  const [password,   setPassword]   = useState('')
  const [confirm,    setConfirm]    = useState('')

  const [err, setErr] = useState('')

  const selectedPlan = PLANS.find(p => p.id === plan)
  const payAmount    = billing === 'monthly' ? selectedPlan?.price : selectedPlan?.yearly

  function toggleCat(c) {
    setSelCats(s => s.includes(c) ? s.filter(x=>x!==c) : [...s, c])
  }

  function validate() {
    if (step === 0 && !storeType)                                    { setErr('Please select a store type.'); return false }
    if (step === 1 && (!storeName || !city || selCats.length===0))   { setErr('Please fill required fields and select at least one category.'); return false }
    if (step === 2 && (!ownerName || !ownerEmail || !password))      { setErr('Please fill all required fields.'); return false }
    if (step === 2 && password !== confirm)                           { setErr('Passwords do not match.'); return false }
    if (step === 2 && password.length < 8)                           { setErr('Password must be at least 8 characters.'); return false }
    return true
  }

  function next() { setErr(''); if (validate()) setStep(s => s+1) }
  function back() { setErr(''); setStep(s => s-1) }

  return (
    <div className="min-h-screen" style={{ background:'linear-gradient(135deg,#dbe8d8 0%,#EFE5DC 100%)' }}>
      <div className="max-w-3xl mx-auto px-4 py-10">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 no-underline mb-8 w-fit">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
               style={{ background:'linear-gradient(135deg,#5e4749,#4a373a)' }}>🐱</div>
          <span className="font-display font-black text-lg text-espresso">
            Purrfect<span className="text-olive">Care</span>
          </span>
        </Link>

        {/* Header */}
        {step < 6 && (
          <div className="mb-8">
            <span className="t-label mb-3 inline-block">Cat Store Registration</span>
            <h1 className="font-display font-black text-espresso tracking-tight mb-2"
                style={{ fontSize:'clamp(1.6rem,3vw,2.2rem)' }}>
              Register Your Cat Store
            </h1>
            <p className="text-clay-muted text-[14px]">
              List your products and reach 18,000+ cat owners across Pakistan.
            </p>

            {/* Verification notice — prominently displayed */}
            <div className="mt-4 flex items-start gap-3 p-4 rounded-2xl"
                 style={{ background:'rgba(196,140,56,.08)', border:'1px solid rgba(196,140,56,.25)' }}>
              <span className="text-xl flex-shrink-0 mt-0.5">🔒</span>
              <div>
                <div className="font-bold text-[13px] text-espresso mb-1">Verification Required Before Going Live</div>
                <div className="text-[12px] text-clay-muted leading-relaxed">
                  All store applications are reviewed by our team. Your store will be in <strong className="text-espresso">pending status</strong> after
                  registration and will only go live once a System Admin verifies your documents and approves your application.
                  This typically takes <strong className="text-espresso">24–48 hours</strong>.
                </div>
              </div>
            </div>
          </div>
        )}

        {step < 6 && <Stepper steps={STEPS} current={step} />}

        {/* Card */}
        {step < 6 && (
          <div className="rounded-3xl p-8" style={{ background:'rgba(255,255,255,.75)', backdropFilter:'blur(12px)', border:'1px solid #b8ceb5' }}>

            {/* ── STEP 0: Store Type ── */}
            {step === 0 && (
              <div>
                <h2 className="font-display font-black text-[1.3rem] text-espresso mb-2">What type of store are you opening?</h2>
                <p className="text-clay-muted text-[13px] mb-5">Choose the option that best describes how you operate.</p>
                <div className="flex flex-col gap-3">
                  {STORE_TYPES.map(t => (
                    <button key={t.value} type="button" onClick={() => setStoreType(t.value)}
                            className="flex items-center gap-4 px-5 py-4 rounded-2xl text-left transition-all"
                            style={{
                              background: storeType===t.value ? 'rgba(85,107,47,.08)' : 'rgba(255,255,255,.7)',
                              border:     storeType===t.value ? '2px solid #5e4749'  : '1.5px solid #b8ceb5',
                            }}>
                      <span className="text-3xl">{t.icon}</span>
                      <div>
                        <div className="font-bold text-[15px] text-espresso">{t.label}</div>
                        <div className="text-[12px] text-clay-muted">{t.desc}</div>
                      </div>
                      {storeType===t.value && (
                        <div className="ml-auto w-6 h-6 rounded-full bg-olive flex items-center justify-center text-white text-[12px]">✓</div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── STEP 1: Store Info ── */}
            {step === 1 && (
              <div className="flex flex-col gap-4">
                <h2 className="font-display font-black text-[1.3rem] text-espresso mb-1">Store Information</h2>

                <Field label="Store Name *">
                  <input value={storeName} onChange={e=>setStoreName(e.target.value)}
                         placeholder="e.g. Paws & Whiskers Boutique"
                         className={inputCls} style={inputSty} onFocus={fi} onBlur={fo} />
                </Field>

                <Field label="Store Description">
                  <textarea value={storeDesc} onChange={e=>setStoreDesc(e.target.value)} rows={3}
                            placeholder="Tell customers what makes your store special…"
                            className={inputCls} style={{ ...inputSty, resize:'none' }} onFocus={fi} onBlur={fo} />
                </Field>

                <div>
                  <Label>Product Categories * (select all that apply)</Label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map(c => (
                      <button key={c} type="button" onClick={() => toggleCat(c)}
                              className="pill transition-all"
                              style={{
                                background: selCats.includes(c) ? '#5e4749' : 'rgba(255,255,255,.7)',
                                color:      selCats.includes(c) ? '#fff'    : '#4E342E',
                                border:     selCats.includes(c) ? 'none'    : '1px solid #b8ceb5',
                              }}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="City *">
                    <select value={city} onChange={e=>setCity(e.target.value)} className={inputCls} style={inputSty}>
                      <option value="">Select city</option>
                      {['Lahore','Karachi','Islamabad','Rawalpindi','Faisalabad','Multan','Peshawar'].map(c=>(
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Store Phone">
                    <input value={storePhone} onChange={e=>setStorePhone(e.target.value.replace(/\D/g,'').slice(0,11))}
                           placeholder="03XX XXXXXXX"
                           className={inputCls} style={inputSty} onFocus={fi} onBlur={fo} />
                  </Field>
                </div>

                {(storeType === 'physical' || storeType === 'both') && (
                  <Field label="Physical Store Address">
                    <input value={address} onChange={e=>setAddress(e.target.value)}
                           placeholder="Street address, area"
                           className={inputCls} style={inputSty} onFocus={fi} onBlur={fo} />
                  </Field>
                )}
              </div>
            )}

            {/* ── STEP 2: Owner Details ── */}
            {step === 2 && (
              <div className="flex flex-col gap-4">
                <h2 className="font-display font-black text-[1.3rem] text-espresso mb-1">Owner / Account Details</h2>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Full Name *">
                    <input value={ownerName} onChange={e=>setOwnerName(e.target.value)} placeholder="Your Full Name"
                           className={inputCls} style={inputSty} onFocus={fi} onBlur={fo} />
                  </Field>
                  <Field label="Email Address *">
                    <input type="email" value={ownerEmail} onChange={e=>setOwnerEmail(e.target.value)} placeholder="you@store.com"
                           className={inputCls} style={inputSty} onFocus={fi} onBlur={fo} />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="CNIC Number *">
                    <input value={ownerCnic} onChange={e=>setOwnerCnic(e.target.value.replace(/\D/g,'').slice(0,13))} placeholder="3520XXXXXXXXXX"
                           className={inputCls} style={inputSty} onFocus={fi} onBlur={fo} />
                  </Field>
                  <Field label="Phone Number">
                    <input value={ownerPhone} onChange={e=>setOwnerPhone(e.target.value.replace(/\D/g,'').slice(0,11))} placeholder="03XX XXXXXXX"
                           className={inputCls} style={inputSty} onFocus={fi} onBlur={fo} />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Password *">
                    <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Min. 8 characters"
                           className={inputCls} style={inputSty} onFocus={fi} onBlur={fo} />
                  </Field>
                  <Field label="Confirm Password *">
                    <input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Repeat password"
                           className={inputCls} style={inputSty} onFocus={fi} onBlur={fo} />
                  </Field>
                </div>
              </div>
            )}

            {/* ── STEP 3: Documents ── */}
            {step === 3 && (
              <div className="flex flex-col gap-5">
                <h2 className="font-display font-black text-[1.3rem] text-espresso mb-2">Verification Documents</h2>
                <p className="text-clay-muted text-[13px] -mt-2">
                  Upload the required documents so our team can verify your store. Accepted: PDF, JPG, PNG (max 5 MB each).
                </p>

                {[
                  { label:'Owner CNIC (Front & Back) *',       hint:'Clear photo or scan of your national identity card' },
                  { label:'Business Registration Certificate *', hint:'FBR / SECP registration or NTN certificate' },
                  { label:'Proof of Address *',                  hint:'Utility bill or bank statement (last 3 months)' },
                  { label:'Product Source / Supplier Agreement', hint:'Invoice, supplier contract, or import documents (optional but recommended)' },
                ].map(doc => (
                  <div key={doc.label} className="p-5 rounded-2xl cursor-pointer transition-all"
                       style={{ background:'rgba(255,255,255,.6)', border:'2px dashed #b8ceb5' }}
                       onMouseOver={e=>e.currentTarget.style.borderColor='#5e4749'}
                       onMouseOut={e=>e.currentTarget.style.borderColor='#b8ceb5'}>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                           style={{ background:'rgba(94,71,73,.1)' }}>📄</div>
                      <div className="flex-1">
                        <div className="font-semibold text-[14px] text-espresso">{doc.label}</div>
                        <div className="text-[12px] text-clay-muted">{doc.hint}</div>
                      </div>
                      <div className="btn btn-outline !py-2 !px-4 !text-[10px]">Upload</div>
                    </div>
                  </div>
                ))}

                <div className="p-4 rounded-xl text-[12px] text-clay-muted flex flex-col gap-1.5"
                     style={{ background:'rgba(196,140,56,.08)', border:'1px solid rgba(196,140,56,.2)' }}>
                  <div className="font-semibold text-espresso text-[13px]">⏱️ What happens next?</div>
                  <div>Our team reviews your documents within <strong>24–48 hours</strong>. You'll receive an email at <strong>{ownerEmail || 'your registered email'}</strong> once your application is approved or if we need more information.</div>
                  <div className="pt-1" style={{ borderTop:'1px solid rgba(196,140,56,.2)' }}>
                    🔒 <strong>Your store will not be listed publicly</strong> until a System Admin explicitly approves your application.
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 4: Plan ── */}
            {step === 4 && (
              <div>
                <h2 className="font-display font-black text-[1.3rem] text-espresso mb-2">Choose Your Plan</h2>
                <div className="flex gap-2 mb-5">
                  {['monthly','yearly'].map(b => (
                    <button key={b} type="button" onClick={()=>setBilling(b)}
                            className="flex-1 py-2 rounded-xl text-[12px] font-bold transition-all"
                            style={{ background: billing===b ? '#5e4749' : 'rgba(255,255,255,.7)',
                                     color: billing===b ? '#fff' : '#4E342E', border: billing===b ? 'none' : '1.5px solid #b8ceb5' }}>
                      {b === 'monthly' ? 'Monthly' : 'Yearly (2 months free)'}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {PLANS.map(p => (
                    <div key={p.id} onClick={()=>setPlan(p.id)}
                         className="relative p-5 rounded-2xl cursor-pointer transition-all"
                         style={{ background:p.color, border:`2px solid ${plan===p.id ? '#5e4749' : p.border}` }}>
                      {p.badge && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <span className="t-label text-[9px]">{p.badge}</span>
                        </div>
                      )}
                      <div className="font-display font-black text-[1rem] text-espresso mb-0.5">{p.name}</div>
                      <div className="font-black text-[1.4rem] text-olive mb-0.5">
                        {billing==='monthly' ? p.price : p.yearly}
                      </div>
                      <div className="t-mono text-[9px] text-clay-muted mb-3">{p.commission} commission</div>
                      <div className="flex flex-col gap-1.5">
                        {p.features.map(f => (
                          <div key={f} className="flex items-start gap-2 text-[11px] text-espresso-soft">
                            <span className="text-olive flex-shrink-0">✓</span>{f}
                          </div>
                        ))}
                      </div>
                      {plan===p.id && (
                        <div className="mt-3 pt-2 border-t" style={{ borderColor:'rgba(94,71,73,.2)' }}>
                          <span className="t-mono text-[9px] text-olive">✓ Selected</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-3 rounded-xl text-[12px] text-clay-muted"
                     style={{ background:'rgba(94,71,73,.07)', border:'1px solid rgba(94,71,73,.18)' }}>
                  ℹ️ Your subscription will only be activated once your store application has been <strong className="text-espresso">approved by a System Admin</strong>. No charges are made during the review period.
                </div>
              </div>
            )}

            {/* ── STEP 5: Payment ── */}
            {step === 5 && (
              <PaymentForm
                amount={payAmount}
                title={`${selectedPlan?.name} Plan · ${billing==='monthly' ? 'Monthly' : 'Annual'} Subscription`}
                onBack={back}
                onSuccess={next}
              />
            )}

            {/* Error */}
            {err && step !== 5 && (
              <div className="mt-4 px-4 py-3 rounded-xl text-[13px]"
                   style={{ background:'rgba(196,56,56,.08)', border:'1px solid rgba(196,56,56,.2)', color:'#9B2020' }}>
                ⚠️ {err}
              </div>
            )}

            {/* Nav buttons */}
            {step !== 5 && (
              <div className="flex gap-3 mt-6">
                {step > 0 && (
                  <button type="button" onClick={back} className="btn btn-outline flex-1 justify-center !py-3">← Back</button>
                )}
                <button type="button" onClick={next} className="btn btn-olive flex-1 justify-center !py-3">
                  {step === 4 ? 'Continue to Payment →' : 'Continue →'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── SUCCESS / PENDING REVIEW ── */}
        {step === 6 && (
          <div className="text-center py-16 px-8 rounded-3xl"
               style={{ background:'rgba(255,255,255,.75)', backdropFilter:'blur(12px)', border:'1px solid rgba(196,140,56,.3)' }}>

            {/* Pending icon */}
            <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mx-auto mb-6"
                 style={{ background:'rgba(196,140,56,.12)', border:'2px solid rgba(196,140,56,.3)' }}>⏳</div>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5"
                 style={{ background:'rgba(196,140,56,.1)', border:'1px solid rgba(196,140,56,.25)' }}>
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background:'#b87c2a' }} />
              <span className="text-[11px] font-mono tracking-widest uppercase" style={{ color:'#b87c2a' }}>
                Pending Review
              </span>
            </div>

            <h2 className="font-display font-black text-[2rem] text-espresso tracking-tight mb-3">
              Application Submitted!
            </h2>
            <p className="text-clay-muted text-[15px] max-w-md mx-auto mb-4">
              <strong className="text-espresso">{storeName || 'Your store'}</strong> has been submitted for review.
              Our team will verify your documents and contact you at <strong className="text-espresso">{ownerEmail || 'your email'}</strong>.
            </p>

            {/* What happens next */}
            <div className="max-w-md mx-auto mb-8 text-left rounded-2xl p-5 flex flex-col gap-3"
                 style={{ background:'rgba(94,71,73,.06)', border:'1px solid rgba(94,71,73,.18)' }}>
              <div className="font-bold text-[13px] text-espresso mb-1">📋 What happens next?</div>
              {[
                { step:'1', text:'Our team reviews your submitted documents (24–48 hours)' },
                { step:'2', text:'You receive an approval or feedback email from Purrfect Care' },
                { step:'3', text:'Once approved, your store goes live and you can start listing products' },
              ].map(s => (
                <div key={s.step} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                       style={{ background:'rgba(94,71,73,.15)', color:'#5e4749' }}>{s.step}</div>
                  <span className="text-[13px] text-clay-muted">{s.text}</span>
                </div>
              ))}
            </div>

            {/* Important notice */}
            <div className="max-w-md mx-auto mb-8 p-4 rounded-xl text-[12px] text-left"
                 style={{ background:'rgba(196,56,56,.06)', border:'1px solid rgba(196,56,56,.18)', color:'#9B2020' }}>
              🔒 <strong>Your store is NOT live yet.</strong> It will only be publicly visible on the marketplace after a System Admin explicitly approves your application.
            </div>

            <div className="flex flex-col gap-3 max-w-xs mx-auto">
              <Link to="/" className="btn btn-olive justify-center !py-3 w-full no-underline">
                ← Back to Purrfect Care
              </Link>
              <Link to="/login" className="text-[13px] font-semibold" style={{ color:"#5e4749" }}>
                Already have an account? Sign in
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
