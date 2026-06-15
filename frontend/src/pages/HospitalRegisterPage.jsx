import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Stepper from '../components/ui/Stepper.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { uploadAllDocs } from '../lib/uploadDocs.js'

const API   = import.meta.env.VITE_API_URL || 'https://server-vmvwkwachq-uc.a.run.app'
const STEPS = ['Hospital Info', 'Admin Account', 'Documents', 'Done']

const HOSPITAL_TYPES = [
  { value:'general',    label:'General Veterinary Clinic',   icon:'🏥' },
  { value:'specialist', label:'Specialist Feline Hospital',  icon:'⚕️' },
  { value:'emergency',  label:'Emergency & Critical Care',   icon:'🚨' },
  { value:'wellness',   label:'Wellness & Preventive Care',  icon:'🌿' },
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

export default function HospitalRegisterPage() {
  const navigate = useNavigate()
  const [step, setStep]         = useState(0)

  /* Step 0 — Hospital Info */
  const [hospName, setHospName]   = useState('')
  const [hospType, setHospType]   = useState('')
  const [license,  setLicense]    = useState('')
  const [city,     setCity]       = useState('')
  const [address,  setAddress]    = useState('')
  const [phone,    setPhone]      = useState('')

  /* Step 1 — Admin Account */
  const [adminName,  setAdminName]  = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [adminCnic,  setAdminCnic]  = useState('')
  const [password,   setPassword]   = useState('')
  const [confirm,    setConfirm]    = useState('')

  /* Step 2 — Documents */
  const [hospDocs, setHospDocs] = useState({})

  const [err,        setErr]        = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [lat,        setLat]        = useState(null)
  const [lng,        setLng]        = useState(null)
  const [geoLoading, setGeoLoading] = useState(false)

  function handleGetLocation() {
    if (!navigator.geolocation) return
    setGeoLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude)
        setLng(pos.coords.longitude)
        setGeoLoading(false)
      },
      () => setGeoLoading(false),
      { timeout: 8000 }
    )
  }

  function handleDocFile(label, file) {
    if (!file) return
    setHospDocs(prev => ({ ...prev, [label]: file }))
  }

  function next() { setErr(''); setStep(s => s + 1) }
  function back() { setErr(''); setStep(s => s - 1) }

  /* Auto-request location when the form first loads (step 0 is hospital info) */
  useEffect(() => {
    if (step === 0 && lat === null && !geoLoading) {
      handleGetLocation()
    }
  }, [step]) // eslint-disable-line react-hooks/exhaustive-deps

  function validateStep() {
    if (step === 0) {
      if (!hospName || !hospType || !license || !city) {
        setErr('Please fill all required fields.'); return false
      }
    }
    if (step === 1) {
      if (!adminName || !adminEmail || !password) {
        setErr('Please fill all required fields.'); return false
      }
      if (password !== confirm)  { setErr('Passwords do not match.'); return false }
      if (password.length < 8)   { setErr('Password must be at least 8 characters.'); return false }
    }
    return true
  }

  /**
   * Step 2 (Documents) → Done: register the account + upload docs.
   * All earlier steps: just validate and advance.
   */
  async function handleNext() {
    setErr('')
    if (!validateStep()) return

    if (step === 2) {
      setSubmitting(true)
      try {
        const regRes = await fetch(`${API}/api/auth/register`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name:          adminName,
            email:         adminEmail,
            phone:         phone,
            password:      password,
            role:          'hospital_admin',
            city:          city,
            address:       address,
            business_name: hospName,
            latitude:      lat,
            longitude:     lng,
          }),
        })
        const regData = await regRes.json()
        if (!regRes.ok) {
          const msg = Array.isArray(regData.detail)
            ? regData.detail.map(d => d.msg || d.message || JSON.stringify(d)).join('; ')
            : regData.message || regData.detail || 'Registration failed. Please check your details and try again.'
          throw new Error(msg)
        }

        const userId       = regData.user?.user_id   // Supabase auth UID
        const profId       = regData.user?.id         // profile PK
        const accessToken  = regData.access_token  || ''
        const refreshToken = regData.refresh_token || ''

        if (userId && Object.keys(hospDocs).length > 0) {
          try {
            const paths = await uploadAllDocs(supabase, userId, hospDocs, accessToken, refreshToken)
            if (profId && accessToken) {
              await fetch(`${API}/api/users/me/docs`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
                body: JSON.stringify({ verification_docs: paths }),
              }).catch(() => {})
            }
          } catch (uploadErr) {
            console.warn('Doc upload error (non-fatal):', uploadErr.message)
          }
        }

        next()  // advance to Done step
      } catch (e) {
        setErr(e.message)
      } finally {
        setSubmitting(false)
      }
      return
    }

    next()
  }

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
        {step < 3 && (
          <div className="mb-8">
            <span className="t-label mb-3 inline-block">Hospital / Clinic Registration</span>
            <h1 className="font-display font-black text-espresso tracking-tight mb-2"
                style={{ fontSize:'clamp(1.6rem,3vw,2.2rem)' }}>
              Register Your Veterinary Hospital
            </h1>
            <p className="text-clay-muted text-[14px]">
              Set up your hospital profile. Our team reviews and approves your application within 24–48 hours.
              You will choose your subscription plan after approval.
            </p>
          </div>
        )}

        {/* Stepper */}
        {step < 3 && <Stepper steps={STEPS} current={step} />}

        {/* Card */}
        {step < 3 && (
          <div className="rounded-3xl p-8" style={{ background:'rgba(255,255,255,.75)', backdropFilter:'blur(12px)', border:'1px solid #b8ceb5' }}>

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
                                border:     hospType===t.value ? '2px solid #5e4749'  : '1.5px solid #b8ceb5',
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

                {/* ── Location capture card ── */}
                <div className="rounded-2xl p-4 flex flex-col gap-3"
                     style={{ background: lat ? 'rgba(85,107,47,.08)' : 'rgba(196,140,56,.06)',
                              border: lat ? '1.5px solid rgba(85,107,47,.35)' : '1.5px solid rgba(196,140,56,.3)' }}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl flex-shrink-0">{lat ? '📍' : '🗺️'}</span>
                      <div>
                        <div className="font-bold text-[13px] text-espresso">
                          {lat ? 'Location pinned ✓' : 'Pin your hospital location'}
                        </div>
                        <div className="text-[11px] text-clay-muted mt-0.5">
                          {lat
                            ? `Coordinates: ${lat.toFixed(5)}, ${lng.toFixed(5)}`
                            : 'Helps cat owners find you in nearby searches. Tap to allow location access.'}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleGetLocation}
                      disabled={geoLoading}
                      className="flex-shrink-0 btn btn-outline !py-2 !px-4 !text-[12px]"
                      style={lat ? { borderColor: '#5e4749', color: '#5e4749' } : {}}>
                      {geoLoading ? '⏳ Locating…' : lat ? '📍 Re-pin' : '📍 Allow Location'}
                    </button>
                  </div>
                  {!lat && !geoLoading && (
                    <p className="text-[10px] text-clay-muted">
                      Optional — hospitals with a pinned location appear in radius searches on the app.
                    </p>
                  )}
                </div>

                <Field label="Street Address">
                  <input value={address} onChange={e=>setAddress(e.target.value)}
                         placeholder="Shop no., street, area"
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
                <p className="text-clay-muted text-[13px] -mt-2">Upload required documents for verification. Accepted formats: PDF, JPG, PNG (max 5 MB each).</p>

                {[
                  { label:'Hospital Registration Certificate *', hint:'Issued by Provincial Veterinary Council' },
                  { label:'Veterinary License *',                hint:'Valid license from Pakistan Veterinary Medical Council (PVMC)' },
                  { label:'Owner / Director CNIC',               hint:'Front side of CNIC/Passport' },
                  { label:'Proof of Address',                    hint:'Utility bill or tenancy agreement (last 3 months)' },
                ].map(doc => {
                  const uploaded = hospDocs[doc.label]
                  return (
                    <label key={doc.label} className="p-5 rounded-2xl cursor-pointer transition-all block"
                           style={{ background: uploaded ? 'rgba(94,71,73,.07)' : 'rgba(255,255,255,.6)',
                                    border: uploaded ? '2px solid #5e4749' : '2px dashed #b8ceb5' }}
                           onMouseOver={e => { if (!uploaded) e.currentTarget.style.borderColor='#5e4749' }}
                           onMouseOut={e  => { if (!uploaded) e.currentTarget.style.borderColor='#b8ceb5' }}>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                             style={{ background: uploaded ? 'rgba(94,71,73,.15)' : 'rgba(94,71,73,.1)' }}>
                          {uploaded ? '✅' : '📄'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-[14px] text-espresso">{doc.label}</div>
                          {uploaded
                            ? <div className="text-[12px] font-medium truncate" style={{ color:'#5e4749' }}>📎 {uploaded.name}</div>
                            : <div className="text-[12px] text-clay-muted">{doc.hint}</div>
                          }
                        </div>
                        <div className="btn btn-outline !py-2 !px-4 !text-[10px] flex-shrink-0">
                          {uploaded ? 'Change' : 'Upload'}
                        </div>
                      </div>
                      <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="sr-only"
                             onChange={e => handleDocFile(doc.label, e.target.files?.[0])} />
                    </label>
                  )
                })}

                <div className="p-4 rounded-xl text-[12px]"
                     style={{ background:'rgba(196,140,56,.08)', border:'1px solid rgba(196,140,56,.2)', color:'#7A4F10' }}>
                  Your subscription plan will be selected after our team approves your application (24–48 hours).
                  Payment is only required post-approval.
                </div>
              </div>
            )}

            {/* Error */}
            {err && (
              <div className="mt-4 px-4 py-3 rounded-xl text-[13px]"
                   style={{ background:'rgba(196,56,56,.08)', border:'1px solid rgba(196,56,56,.2)', color:'#9B2020' }}>
                ⚠️ {err}
              </div>
            )}

            {/* Nav */}
            <div className="flex gap-3 mt-6">
              {step > 0 && (
                <button type="button" onClick={back} className="btn btn-outline flex-1 justify-center !py-3">
                  ← Back
                </button>
              )}
              <button type="button" onClick={handleNext} disabled={submitting}
                      className="btn btn-olive flex-1 justify-center !py-3"
                      style={{ opacity: submitting ? .7 : 1 }}>
                {submitting
                  ? <span className="flex items-center gap-2">
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity=".3"/>
                        <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                      </svg>
                      Submitting application…
                    </span>
                  : step === 2 ? 'Submit Application →' : 'Continue →'
                }
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Done ── */}
        {step === 3 && (
          <div className="text-center py-16 px-8 rounded-3xl"
               style={{ background:'rgba(255,255,255,.75)', backdropFilter:'blur(12px)', border:'1px solid rgba(94,71,73,.25)' }}>
            <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mx-auto mb-6"
                 style={{ background:'rgba(94,71,73,.15)', border:'2px solid rgba(94,71,73,.3)' }}>🏥</div>

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
            <p className="text-clay-muted text-[15px] max-w-md mx-auto mb-2">
              <strong className="text-espresso">{hospName}</strong> has been registered successfully.
            </p>
            <p className="text-clay-muted text-[14px] max-w-md mx-auto mb-6">
              Our team will verify your documents within <strong className="text-espresso">24–48 hours</strong>.
              Once approved, you will be able to log in and choose your subscription plan to activate your dashboard.
            </p>

            <div className="p-4 rounded-xl text-[13px] mb-6 max-w-sm mx-auto"
                 style={{ background:'rgba(94,71,73,.06)', border:'1px solid rgba(94,71,73,.15)', color:'#5e4749' }}>
              You will receive an email confirmation once your application is approved.
            </div>

            <Link to="/" className="btn btn-olive justify-center !py-3 no-underline inline-flex">
              ← Return to Home
            </Link>
          </div>
        )}

      </div>
    </div>
  )
}
