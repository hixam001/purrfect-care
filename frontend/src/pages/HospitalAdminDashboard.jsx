/**
 * HospitalAdminDashboard — Enhanced with Services, Slots, Stats, editable Settings.
 */
import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../lib/supabaseClient.js'

const API = import.meta.env.VITE_API_URL || 'https://us-central1-purrfect-care-app.cloudfunctions.net/server'


const SPECIALTIES = [
  'Feline Internist','Feline Surgeon','Dermatologist','Ophthalmologist',
  'Nutritionist','Cardiologist','Neurologist','Emergency Medicine','Dentistry',
]

const SERVICE_CATEGORIES = ['General','Surgery','Dentistry','Dermatology','Cardiology','Nutrition','Ophthalmology','Emergency']

/* ── Design tokens ── */
const C = {
  bg:          '#dbe8d8',
  surface:     'rgba(255,255,255,.88)',
  border:      '#b8ceb5',
  text:        '#3a2c2d',
  textMuted:   '#7a5e60',
  olive:       '#5e4749',
  oliveBg:     'rgba(94,71,73,.09)',
  oliveBorder: 'rgba(94,71,73,.20)',
  amberBg:     'rgba(184,92,56,.08)',
  amberBorder: 'rgba(184,92,56,.22)',
  amberText:   '#7A4F10',
  dangerBg:    'rgba(184,56,56,.08)',
  dangerBorder:'rgba(184,56,56,.20)',
  dangerText:  '#7D1F1F',
  blueBg:      'rgba(59,130,246,.08)',
  blueBorder:  'rgba(59,130,246,.20)',
  blueText:    '#1D4ED8',
}

function Panel({ children, className = '' }) {
  return (
    <div className={`rounded-2xl p-5 ${className}`}
         style={{ background: C.surface, border: `1px solid ${C.border}` }}>
      {children}
    </div>
  )
}

function StatCard({ icon, label, value, accentBg }) {
  return (
    <div className="rounded-2xl p-5" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
      <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl mb-3" style={{ background: accentBg }}>{icon}</div>
      <div className="font-display font-black text-[1.7rem] leading-none" style={{ color: C.text }}>{value}</div>
      <div className="text-[13px] font-medium mt-1" style={{ color: C.textMuted }}>{label}</div>
    </div>
  )
}

const STATUS_PILL = {
  confirmed: { bg:'rgba(94,71,73,.10)', text:'#4a373a',  label:'Confirmed' },
  pending:   { bg:'rgba(184,124,42,.10)',text:'#7A4F10', label:'Pending'   },
  cancelled: { bg:'rgba(184,56,56,.09)',text:'#7D1F1F',  label:'Cancelled' },
  completed: { bg:'rgba(45,90,39,.10)', text:'#1E4D1C',  label:'Completed' },
}

function ApptPill({ status }) {
  const s = STATUS_PILL[status] ?? { bg:'rgba(0,0,0,.06)', text:'#444', label: status }
  return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11.5px] font-semibold"
               style={{ background: s.bg, color: s.text }}>{s.label}</span>
}

function fmtDate(iso) { return iso ? new Date(iso).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' }) : '—' }
function fmtMoney(n)  { return `₨${Number(n ?? 0).toLocaleString()}` }

const inputCls = 'w-full px-4 py-3 rounded-xl text-[14px] outline-none transition-all'
const inputSty = { background:'rgba(255,255,255,.9)', border:`1.5px solid ${C.border}`, color: C.text }
const fi = e => { e.target.style.borderColor = C.olive; e.target.style.boxShadow = '0 0 0 3px rgba(94,71,73,.12)' }
const fo = e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = 'none' }

/* ═══════════════════════════════════════════
   VET REGISTER MODAL
═══════════════════════════════════════════ */
function VetRegisterModal({ onClose, onDone }) {
  const [form, setForm] = useState({ name:'', email:'', password:'', phone:'', spec:'', license:'', exp:'', fee:'', bio:'' })
  const [saving,   setSaving]   = useState(false)
  const [success,  setSuccess]  = useState(false)
  const [err,      setErr]      = useState('')
  const [showPwd,  setShowPwd]  = useState(false)

  function set(k) { return e => setForm(f => ({ ...f, [k]: e.target.value })) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name || !form.email || !form.password || !form.spec || !form.license) {
      setErr('Name, email, password, specialty and license are required.')
      return
    }
    if (form.password.length < 8) {
      setErr('Password must be at least 8 characters.')
      return
    }
    setSaving(true); setErr('')
    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || ''
      const res = await fetch(`${API}/api/hospitals/vets`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name:             form.name,
          email:            form.email,
          password:         form.password,
          phone:            form.phone || null,
          specialization:   form.spec,
          license_number:   form.license,
          experience_years: form.exp ? parseInt(form.exp, 10) : null,
          bio:              form.bio || null,
          consultation_fee: form.fee ? parseFloat(form.fee) : null,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.detail ?? `Error ${res.status}`)
      setSuccess(true)
      setTimeout(() => { onDone() }, 1800)
    } catch(e) {
      setErr(e.message)
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background:'rgba(58,44,45,.5)', backdropFilter:'blur(8px)' }}>
      <div className="w-full max-w-lg rounded-3xl overflow-hidden"
           style={{ background: C.bg, maxHeight:'92vh', overflowY:'auto' }}>
        <div className="px-6 py-4 flex items-center justify-between"
             style={{ borderBottom:`1px solid ${C.border}`, background:'rgba(255,255,255,.6)' }}>
          <div className="font-display font-black text-[1.15rem]" style={{ color: C.text }}>Register New Vet</div>
          <button onClick={onClose} style={{ color: C.textMuted }}>✕</button>
        </div>
        <div className="p-6">
          {success ? (
            <div className="text-center py-8">
              <div className="text-5xl mb-4">✅</div>
              <div className="font-bold text-[1.1rem]" style={{ color: C.text }}>Vet Registered!</div>
              <p className="text-[13px] mt-2" style={{ color: C.textMuted }}>The vet can now log in using their email and the password you set.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: C.textMuted }}>Full Name *</label>
                  <input value={form.name} onChange={set('name')} placeholder="Dr. Jane Doe" className={inputCls} style={inputSty} onFocus={fi} onBlur={fo} />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: C.textMuted }}>Email *</label>
                  <input type="email" value={form.email} onChange={set('email')} placeholder="vet@hospital.com" className={inputCls} style={inputSty} onFocus={fi} onBlur={fo} />
                </div>
              </div>
              {/* Password field */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: C.textMuted }}>Login Password * <span style={{ color: C.amberText }}>(share this with the vet)</span></label>
                <div className="relative">
                  <input type={showPwd ? 'text' : 'password'} value={form.password} onChange={set('password')}
                         placeholder="Min. 8 characters" className={inputCls} style={{ ...inputSty, paddingRight: '3rem' }}
                         onFocus={fi} onBlur={fo} />
                  <button type="button" onClick={() => setShowPwd(v => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px]"
                          style={{ color: C.textMuted }}>{showPwd ? '🙈' : '👁️'}</button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: C.textMuted }}>Specialty *</label>
                  <select value={form.spec} onChange={set('spec')} className={inputCls} style={inputSty}>
                    <option value="">Select specialty</option>
                    {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: C.textMuted }}>PVMC License *</label>
                  <input value={form.license} onChange={set('license')} placeholder="PVMC-2024-XXXX" className={inputCls} style={inputSty} onFocus={fi} onBlur={fo} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: C.textMuted }}>Experience (years)</label>
                  <input type="number" min="0" value={form.exp} onChange={set('exp')} placeholder="e.g. 5" className={inputCls} style={inputSty} onFocus={fi} onBlur={fo} />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: C.textMuted }}>Phone</label>
                  <input value={form.phone} onChange={set('phone')} placeholder="03XX-XXXXXXX" className={inputCls} style={inputSty} onFocus={fi} onBlur={fo} />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: C.textMuted }}>Short Bio</label>
                <textarea value={form.bio} onChange={set('bio')} rows={2} placeholder="Brief professional background…"
                          className={inputCls} style={{ ...inputSty, resize:'none' }} onFocus={fi} onBlur={fo} />
              </div>
              {err && (
                <div className="px-4 py-3 rounded-xl text-[13px]"
                     style={{ background: C.dangerBg, border:`1px solid ${C.dangerBorder}`, color: C.dangerText }}>
                  ⚠️ {err}
                </div>
              )}
              <div className="flex gap-3">
                <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl font-semibold text-[13.5px]"
                        style={{ border:`1px solid ${C.border}`, color: C.textMuted }}>Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-3 rounded-xl font-semibold text-[13.5px]"
                        style={{ background:`linear-gradient(135deg,${C.olive},#4a373a)`, color:'#fff' }}>
                  {saving ? 'Registering…' : 'Register Vet'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════
   SERVICE MODAL (Add / Edit treatment)
═══════════════════════════════════════════ */
function ServiceModal({ hospitalId, service, onClose, onSaved }) {
  const editing = !!service
  const [form, setForm] = useState({
    name:             service?.name             ?? '',
    description:      service?.description      ?? '',
    category:         service?.category         ?? 'General',
    price:            service?.price            ?? '',
    duration_minutes: service?.duration_minutes ?? 30,
    is_active:        service?.is_active        ?? true,
  })
  const [saving, setSaving] = useState(false)
  const [err,    setErr]    = useState('')

  function set(k) { return e => setForm(f => ({ ...f, [k]: e.target.value })) }

  async function handleSave() {
    if (!form.name || !form.price) { setErr('Name and price are required.'); return }
    setSaving(true); setErr('')
    const payload = {
      name:             form.name,
      description:      form.description || null,
      category:         form.category,
      price:            parseFloat(form.price),
      duration_minutes: parseInt(form.duration_minutes, 10),
      is_active:        form.is_active,
    }
    try {
      if (editing) {
        const { error } = await supabase.from('hospital_services').update(payload).eq('id', service.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('hospital_services').insert({ ...payload, hospital_id: hospitalId })
        if (error) throw error
      }
      onSaved()
    } catch(e) { setErr(e.message) }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background:'rgba(58,44,45,.5)', backdropFilter:'blur(8px)' }}>
      <div className="w-full max-w-md rounded-3xl overflow-hidden" style={{ background: C.bg }}>
        <div className="px-6 py-4 flex items-center justify-between"
             style={{ borderBottom:`1px solid ${C.border}`, background:'rgba(255,255,255,.6)' }}>
          <div className="font-display font-black text-[1.1rem]" style={{ color: C.text }}>
            {editing ? 'Edit Service' : 'Add Treatment / Service'}
          </div>
          <button onClick={onClose} style={{ color: C.textMuted }}>✕</button>
        </div>
        <div className="p-6 flex flex-col gap-4">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: C.textMuted }}>Service Name *</label>
            <input value={form.name} onChange={set('name')} placeholder="e.g. Annual Vaccination" className={inputCls} style={inputSty} onFocus={fi} onBlur={fo} />
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: C.textMuted }}>Description</label>
            <textarea value={form.description} onChange={set('description')} rows={2} placeholder="Brief description…"
                      className={inputCls} style={{ ...inputSty, resize:'none' }} onFocus={fi} onBlur={fo} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: C.textMuted }}>Category</label>
              <select value={form.category} onChange={set('category')} className={inputCls} style={inputSty}>
                {SERVICE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: C.textMuted }}>Duration (min)</label>
              <input type="number" min="5" step="5" value={form.duration_minutes} onChange={set('duration_minutes')} className={inputCls} style={inputSty} onFocus={fi} onBlur={fo} />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: C.textMuted }}>Price (₨) *</label>
            <input type="number" min="0" value={form.price} onChange={set('price')} placeholder="0" className={inputCls} style={inputSty} onFocus={fi} onBlur={fo} />
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" id="svcActive" checked={form.is_active}
                   onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="w-4 h-4" />
            <label htmlFor="svcActive" className="text-[13.5px] font-medium" style={{ color: C.text }}>Visible to patients</label>
          </div>
          {err && <div className="px-4 py-3 rounded-xl text-[13px]" style={{ background: C.dangerBg, border:`1px solid ${C.dangerBorder}`, color: C.dangerText }}>⚠️ {err}</div>}
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl font-semibold text-[13.5px]"
                    style={{ border:`1px solid ${C.border}`, color: C.textMuted }}>Cancel</button>
            <button onClick={handleSave} disabled={saving} className="flex-1 py-3 rounded-xl font-semibold text-[13.5px]"
                    style={{ background:`linear-gradient(135deg,${C.olive},#4a373a)`, color:'#fff' }}>
              {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Service'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════
   SLOT GENERATOR
═══════════════════════════════════════════ */
function SlotGenerator({ hospitalId, vets, onDone }) {
  const [vetId,     setVetId]     = useState('')
  const [slotDate,  setSlotDate]  = useState('')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime,   setEndTime]   = useState('17:00')
  const [duration,  setDuration]  = useState(30)
  const [saving,    setSaving]    = useState(false)
  const [msg,       setMsg]       = useState('')

  async function generate() {
    if (!vetId || !slotDate) { setMsg('Select a vet and date.'); return }
    setSaving(true); setMsg('')
    // Generate time slots between startTime and endTime
    const slots = []
    let [sh, sm] = startTime.split(':').map(Number)
    const [eh, em] = endTime.split(':').map(Number)
    const endMins = eh * 60 + em
    while (sh * 60 + sm + duration <= endMins) {
      const s = `${String(sh).padStart(2,'0')}:${String(sm).padStart(2,'0')}`
      const nm = sm + duration
      const nh = sh + Math.floor(nm / 60)
      const nm2 = nm % 60
      const e = `${String(nh).padStart(2,'0')}:${String(nm2).padStart(2,'0')}`
      slots.push({ hospital_id: hospitalId, vet_id: vetId, slot_date: slotDate, start_time: s, end_time: e, is_booked: false })
      sh = nh; sm = nm2
    }
    if (slots.length === 0) { setMsg('No slots generated — check times.'); setSaving(false); return }
    const { error } = await supabase.from('appointment_slots').insert(slots)
    if (error) setMsg('Error: ' + error.message)
    else { setMsg(`${slots.length} slot${slots.length !== 1 ? 's' : ''} created.`); onDone() }
    setSaving(false)
  }

  return (
    <Panel className="mb-6">
      <h3 className="font-display font-bold text-[1rem] mb-4" style={{ color: C.text }}>Generate Availability Slots</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: C.textMuted }}>Veterinarian</label>
          <select value={vetId} onChange={e => setVetId(e.target.value)} className={inputCls} style={inputSty}>
            <option value="">Select vet</option>
            {vets.map(v => <option key={v.id} value={v.id}>{v.user_profiles?.name ?? v.id}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: C.textMuted }}>Date</label>
          <input type="date" value={slotDate} min={new Date().toISOString().slice(0,10)}
                 onChange={e => setSlotDate(e.target.value)} className={inputCls} style={inputSty} onFocus={fi} onBlur={fo} />
        </div>
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: C.textMuted }}>Slot Duration (min)</label>
          <select value={duration} onChange={e => setDuration(parseInt(e.target.value))} className={inputCls} style={inputSty}>
            {[15,20,30,45,60].map(d => <option key={d} value={d}>{d} min</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: C.textMuted }}>Start Time</label>
          <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className={inputCls} style={inputSty} onFocus={fi} onBlur={fo} />
        </div>
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: C.textMuted }}>End Time</label>
          <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className={inputCls} style={inputSty} onFocus={fi} onBlur={fo} />
        </div>
        <div className="flex items-end">
          <button onClick={generate} disabled={saving}
                  className="w-full py-3 rounded-xl font-semibold text-[13.5px]"
                  style={{ background:`linear-gradient(135deg,${C.olive},#4a373a)`, color:'#fff' }}>
            {saving ? 'Creating…' : '⚡ Generate Slots'}
          </button>
        </div>
      </div>
      {msg && <p className="text-[13px] font-semibold" style={{ color: C.olive }}>{msg}</p>}
    </Panel>
  )
}

/* ═══════════════════════════════════════════
   MAIN DASHBOARD
═══════════════════════════════════════════ */
export default function HospitalAdminDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [tab,      setTab]      = useState('overview')
  const [hospital, setHospital] = useState(null)
  const [vets,     setVets]     = useState([])
  const [appts,    setAppts]    = useState([])
  const [services, setServices] = useState([])
  const [slots,    setSlots]    = useState([])
  const [plan,     setPlan]     = useState(null)   // active subscription_plans row
  const [loading,  setLoading]  = useState(true)
  const [showVetModal, setShowVetModal] = useState(false)
  const [serviceModal, setServiceModal] = useState(null)  // null | 'add' | service obj
  const [settingsForm, setSettingsForm] = useState(null)
  const [saving,   setSaving]   = useState(false)
  const [actionMsg,setActionMsg]= useState('')

  async function handleLogout() { await logout(); navigate('/login') }
  function flash(msg) { setActionMsg(msg); setTimeout(() => setActionMsg(''), 4000) }

  const loadData = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const { data: h } = await supabase
        .from('hospitals')
        .select('*')
        .eq('admin_user_id', user.id)
        .single()

      if (!h) { setLoading(false); return }
      setHospital(h)
      setSettingsForm({
        name:        h.name,
        description: h.description   ?? '',
        phone:       h.phone         ?? '',
        email:       h.email         ?? '',
        address:     h.address,
        city:        h.city          ?? '',
        operating_hours: JSON.stringify(h.operating_hours ?? {}, null, 2),
      })

      const [{ data: v }, { data: a }, { data: svc }, { data: sl }] = await Promise.all([
        supabase.from('vets')
          .select('id, specialization, experience_years, is_verified, rating, bio, user_profiles ( name, email, phone )')
          .eq('hospital_id', h.id),
        supabase.from('appointments')
          .select(`id, appointment_date, status, notes,
            cats ( name ),
            user_profiles ( name ),
            vets ( user_profiles ( name ) ),
            appointment_slots ( start_time, end_time )`)
          .eq('hospital_id', h.id)
          .order('appointment_date', { ascending: false })
          .limit(100),
        supabase.from('hospital_services')
          .select('*')
          .eq('hospital_id', h.id)
          .order('category'),
        supabase.from('appointment_slots')
          .select('*, vets ( user_profiles ( name ) )')
          .eq('hospital_id', h.id)
          .gte('slot_date', new Date().toISOString().slice(0,10))
          .order('slot_date')
          .order('start_time'),
      ])

      setVets(v ?? [])
      setAppts(a ?? [])
      setServices(svc ?? [])
      setSlots(sl ?? [])

      // Fetch active subscription plan for vet limit enforcement
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('subscription_plans ( name, max_vets )')
        .eq('profile_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      setPlan(sub?.subscription_plans ?? null)
    } catch(e) { console.warn(e) }
    setLoading(false)
  }, [user?.id])

  useEffect(() => { loadData() }, [loadData])

  /* ── Appointment actions ── */
  async function confirmAppt(id) {
    await supabase.from('appointments').update({ status:'confirmed' }).eq('id', id)
    setAppts(p => p.map(a => a.id === id ? { ...a, status:'confirmed' } : a))
  }
  async function cancelAppt(id) {
    await supabase.from('appointments').update({ status:'cancelled' }).eq('id', id)
    // Also free the slot
    const appt = appts.find(a => a.id === id)
    if (appt?.slot_id) {
      await supabase.from('appointment_slots').update({ is_booked: false }).eq('id', appt.slot_id)
    }
    setAppts(p => p.map(a => a.id === id ? { ...a, status:'cancelled' } : a))
    flash('Appointment cancelled and slot freed.')
  }

  /* ── Delete slot ── */
  async function deleteSlot(slotId) {
    await supabase.from('appointment_slots').delete().eq('id', slotId)
    setSlots(prev => prev.filter(s => s.id !== slotId))
  }

  /* ── Delete service ── */
  async function deleteService(sid) {
    await supabase.from('hospital_services').delete().eq('id', sid)
    setServices(prev => prev.filter(s => s.id !== sid))
    flash('Service removed.')
  }

  /* ── Save settings ── */
  async function saveSettings() {
    if (!hospital) return
    setSaving(true)
    let operating_hours = null
    try { operating_hours = JSON.parse(settingsForm.operating_hours) } catch { /* keep null */ }
    const { error } = await supabase.from('hospitals').update({
      name:        settingsForm.name,
      description: settingsForm.description || null,
      phone:       settingsForm.phone || null,
      email:       settingsForm.email || null,
      address:     settingsForm.address,
      city:        settingsForm.city || null,
      operating_hours,
    }).eq('id', hospital.id)
    if (!error) { setHospital(h => ({ ...h, ...settingsForm })); flash('Settings saved.') }
    else flash('Save failed: ' + error.message)
    setSaving(false)
  }

  /* ── Stats ── */
  const confirmedAppts  = appts.filter(a => a.status === 'confirmed').length
  const pendingAppts    = appts.filter(a => a.status === 'pending').length
  const bookedSlots     = slots.filter(s => s.is_booked).length
  const availableSlots  = slots.filter(s => !s.is_booked).length

  // Vet limit enforcement
  const maxVets    = plan?.max_vets ?? null
  const canAddVet  = maxVets === null || vets.length < maxVets

  const TABS = [
    { id:'overview',  label:'Overview',                            icon:'📊' },
    { id:'vets',      label:`Vets (${vets.length})`,              icon:'👩‍⚕️' },
    { id:'appts',     label:`Appointments (${appts.length})`,     icon:'📅' },
    { id:'services',  label:`Services (${services.length})`,      icon:'🏥' },
    { id:'slots',     label:`Slots (${slots.length})`,            icon:'🗓️' },
    { id:'stats',     label:'Statistics',                         icon:'📈' },
    { id:'settings',  label:'Settings',                           icon:'⚙️' },
  ]

  /* ── Group slots by date ── */
  const slotsByDate = slots.reduce((acc, s) => {
    acc[s.slot_date] = acc[s.slot_date] ?? []
    acc[s.slot_date].push(s)
    return acc
  }, {})

  return (
    <div className="min-h-screen" style={{ background: C.bg }}>

      {/* Action banner */}
      {actionMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-lg text-[13px] font-semibold"
             style={{ background: C.surface, border:`1px solid ${C.oliveBorder}`, color: C.olive }}>
          {actionMsg}
        </div>
      )}

      {showVetModal && (
        <VetRegisterModal hospitalId={hospital?.id} onClose={() => setShowVetModal(false)}
                          onDone={() => { setShowVetModal(false); loadData(); flash('Vet registered.') }} />
      )}
      {serviceModal !== null && (
        <ServiceModal hospitalId={hospital?.id} service={serviceModal === 'add' ? null : serviceModal}
                      onClose={() => setServiceModal(null)}
                      onSaved={() => { setServiceModal(null); loadData(); flash('Service saved.') }} />
      )}

      {/* ── Header ── */}
      <header className="sticky top-0 z-40"
              style={{ background:'rgba(219,232,216,.93)', backdropFilter:'blur(18px)',
                       WebkitBackdropFilter:'blur(18px)', borderBottom:`1px solid ${C.border}` }}>
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5 no-underline flex-shrink-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                 style={{ background:'linear-gradient(135deg,#5e4749,#4a373a)' }}>🐱</div>
            <div>
              <span className="font-display font-black text-[17px] tracking-tight" style={{ color: C.text }}>
                Purrfect<span style={{ color: C.olive }}>Care</span>
              </span>
              <span className="text-[11px] font-semibold ml-2 px-2 py-0.5 rounded-full"
                    style={{ background: C.blueBg, border:`1px solid ${C.blueBorder}`, color: C.blueText }}>
                Hospital
              </span>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-0.5 overflow-x-auto">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                      className="px-3 py-2 rounded-xl text-[12px] font-medium whitespace-nowrap transition-all"
                      style={{
                        background: tab===t.id ? C.oliveBg   : 'transparent',
                        color:      tab===t.id ? C.olive     : C.textMuted,
                        border:     tab===t.id ? `1px solid ${C.oliveBorder}` : '1px solid transparent',
                      }}>
                {t.icon} {t.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2 flex-shrink-0">
            {pendingAppts > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                   style={{ background: C.amberBg, border:`1px solid ${C.amberBorder}` }}>
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background:'#B87C2A' }} />
                <span className="text-[12px] font-semibold" style={{ color: C.amberText }}>{pendingAppts} pending</span>
              </div>
            )}
            <button onClick={() => canAddVet && setShowVetModal(true)}
                    disabled={!canAddVet}
                    title={!canAddVet ? `Your ${plan?.name} plan allows ${maxVets} vets. Upgrade to add more.` : ''}
                    className="px-3 py-2 rounded-xl text-[12px] font-semibold"
                    style={{
                      background: canAddVet
                        ? `linear-gradient(135deg,${C.olive},#4a373a)`
                        : C.dangerBg,
                      color:      canAddVet ? '#fff' : C.dangerText,
                      cursor:     canAddVet ? 'pointer' : 'not-allowed',
                    }}>
              {canAddVet ? '+ Vet' : `Vet limit (${maxVets})`}
            </button>
            <button onClick={handleLogout} className="btn btn-outline !text-[12px] !py-2">Log out</button>
          </div>
        </div>
      </header>

      {/* ── Mobile tab strip (lg:hidden) ── */}
      <div className="lg:hidden sticky z-30 overflow-x-auto" style={{ top:64, background:'rgba(219,232,216,.95)', borderBottom:`1px solid ${C.border}` }}>
        <div className="flex gap-1 px-3 py-2" style={{ minWidth:'max-content' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold whitespace-nowrap flex-shrink-0"
                    style={{
                      background: tab===t.id ? C.oliveBg   : 'transparent',
                      color:      tab===t.id ? C.olive     : C.textMuted,
                      border:     tab===t.id ? `1px solid ${C.oliveBorder}` : '1px solid transparent',
                    }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-10">
        <div className="mb-8">
          <h1 className="font-display font-black tracking-tight mb-1"
              style={{ fontSize:'clamp(1.5rem,3vw,2rem)', color: C.text }}>
            {hospital?.name ?? 'Hospital Dashboard'}
          </h1>
          <p className="text-[14px]" style={{ color: C.textMuted }}>
            {hospital?.city ?? ''}{hospital?.city ? ' · ' : ''}
            {hospital?.is_approved ? '✓ Verified' : '⏳ Pending approval'}
          </p>
        </div>

        {loading ? (
          <Panel className="py-20 text-center">
            <div className="text-3xl mb-3">⏳</div>
            <div className="font-display font-bold" style={{ color: C.text }}>Loading…</div>
          </Panel>
        ) : !hospital ? (
          <Panel className="py-20 text-center">
            <div className="text-4xl mb-4">🏥</div>
            <div className="font-display font-bold text-[1.1rem] mb-2" style={{ color: C.text }}>Hospital not registered</div>
            <p className="text-[13.5px] max-w-sm mx-auto" style={{ color: C.textMuted }}>Your account is not linked to a hospital. Complete the hospital registration process or contact support.</p>
          </Panel>
        ) : !hospital.is_approved ? (
          <Panel className="py-20 text-center" style={{ border: `1px solid ${C.amberBorder}` }}>
            <div className="text-5xl mb-5">⏳</div>
            <div className="font-display font-black text-[1.3rem] mb-2" style={{ color: C.text }}>Awaiting Admin Approval</div>
            <p className="text-[14px] max-w-md mx-auto mb-6" style={{ color: C.textMuted }}>
              Your hospital <strong style={{ color: C.text }}>{hospital.name}</strong> has been registered and is being reviewed by the Purrfect Care team.
              You will be able to manage vets, services, and slots once your hospital is approved.
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold"
                 style={{ background: C.amberBg, border: `1px solid ${C.amberBorder}`, color: C.amberText }}>
              ⏱ Approval usually takes 1–2 business days
            </div>
          </Panel>
        ) : (
          <>

          {/* ══ OVERVIEW ══ */}
          {tab === 'overview' && (
            <div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <StatCard icon="👩‍⚕️" label="Veterinarians"      value={vets.length}       accentBg="rgba(94,71,73,.10)" />
                <StatCard icon="📅"  label="Total Appointments" value={appts.length}      accentBg="rgba(184,92,56,.10)" />
                <StatCard icon="✅"  label="Confirmed"           value={confirmedAppts}    accentBg="rgba(45,90,39,.10)" />
                <StatCard icon="🗓️" label="Available Slots"     value={availableSlots}    accentBg="rgba(59,130,246,.10)" />
              </div>

              {/* Recent appointments */}
              <Panel className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display font-bold text-[1.05rem]" style={{ color: C.text }}>Recent Appointments</h2>
                  <button onClick={() => setTab('appts')} style={{ color: C.olive, background:'none', border:'none', cursor:'pointer', fontSize:13, fontWeight:600 }}>View all →</button>
                </div>
                {appts.length === 0 ? (
                  <div className="text-center py-8 text-[13px]" style={{ color: C.textMuted }}>No appointments yet.</div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {appts.slice(0,5).map(a => (
                      <div key={a.id} className="flex items-center gap-4 p-3 rounded-xl" style={{ background: C.oliveBg }}>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-[14px]" style={{ color: C.text }}>
                            {a.cats?.name} · {a.user_profiles?.name}
                          </div>
                          <div className="text-[12px]" style={{ color: C.textMuted }}>
                            {a.vets?.user_profiles?.name} · {fmtDate(a.appointment_date)}
                            {a.appointment_slots ? ` · ${a.appointment_slots.start_time?.slice(0,5)}` : ''}
                          </div>
                        </div>
                        <ApptPill status={a.status} />
                      </div>
                    ))}
                  </div>
                )}
              </Panel>

              {/* Services overview */}
              <Panel>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display font-bold text-[1.05rem]" style={{ color: C.text }}>Services / Treatments</h2>
                  <button onClick={() => setTab('services')} style={{ color: C.olive, background:'none', border:'none', cursor:'pointer', fontSize:13, fontWeight:600 }}>Manage →</button>
                </div>
                {services.length === 0 ? (
                  <div className="text-center py-6 text-[13px]" style={{ color: C.textMuted }}>No services added yet.</div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {services.filter(s => s.is_active).map(s => (
                      <span key={s.id} className="px-3 py-1.5 rounded-xl text-[12.5px] font-semibold"
                            style={{ background: C.oliveBg, border:`1px solid ${C.oliveBorder}`, color: C.olive }}>
                        {s.name} · ₨{s.price}
                      </span>
                    ))}
                  </div>
                )}
              </Panel>
            </div>
          )}

          {/* ══ VETS ══ */}
          {tab === 'vets' && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-display font-bold text-[1.1rem]" style={{ color: C.text }}>
                  Veterinary Team ({vets.length}{maxVets !== null ? `/${maxVets}` : ''})
                </h2>
                <div className="flex items-center gap-3">
                  {maxVets !== null && (
                    <span className="text-[12px] font-semibold px-2.5 py-1 rounded-full"
                          style={{
                            background: canAddVet ? C.oliveBg : C.dangerBg,
                            color:      canAddVet ? C.olive   : C.dangerText,
                            border:     `1px solid ${canAddVet ? C.oliveBorder : C.dangerBorder}`,
                          }}>
                      {plan?.name} plan · {maxVets - vets.length} slots left
                    </span>
                  )}
                  <button onClick={() => canAddVet && setShowVetModal(true)}
                          disabled={!canAddVet}
                          title={!canAddVet ? `Upgrade your plan to add more vets.` : ''}
                          className="px-4 py-2 rounded-xl font-semibold text-[13px]"
                          style={{
                            background: canAddVet
                              ? `linear-gradient(135deg,${C.olive},#4a373a)`
                              : C.dangerBg,
                            color:      canAddVet ? '#fff' : C.dangerText,
                            cursor:     canAddVet ? 'pointer' : 'not-allowed',
                          }}>
                    {canAddVet ? '+ Register Vet' : `Limit reached (${maxVets})`}
                  </button>
                </div>
              </div>
              {vets.length === 0 ? (
                <Panel className="py-20 text-center">
                  <div className="text-4xl mb-3">👩‍⚕️</div>
                  <div className="font-display font-bold text-[1.1rem] mb-2" style={{ color: C.text }}>No vets registered</div>
                  <p className="text-[13.5px] mb-4" style={{ color: C.textMuted }}>Register your first vet to start accepting appointments.</p>
                </Panel>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {vets.map(v => (
                    <Panel key={v.id} className="text-center">
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3"
                           style={{ background: C.oliveBg }}>👩‍⚕️</div>
                      <div className="font-bold text-[15px] mb-0.5" style={{ color: C.text }}>{v.user_profiles?.name}</div>
                      <div className="text-[12.5px] mb-2" style={{ color: C.textMuted }}>{v.specialization}</div>
                      <div className="text-[12px] mb-3" style={{ color: C.textMuted }}>
                        {v.experience_years ? `${v.experience_years} yrs experience` : ''}
                      </div>
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11.5px] font-semibold"
                            style={{ background: v.is_verified ? 'rgba(45,90,39,.10)' : C.amberBg,
                                     color: v.is_verified ? '#1E4D1C' : C.amberText }}>
                        {v.is_verified ? '✓ Verified' : '⏳ Pending'}
                      </span>
                      {v.bio && <p className="text-[12px] mt-3" style={{ color: C.textMuted }}>{v.bio}</p>}
                    </Panel>
                  ))}
                </div>
              )}
              <div className="mt-5 p-4 rounded-2xl text-[13px]" style={{ background: C.oliveBg, border:`1px solid ${C.oliveBorder}` }}>
                ℹ️ <span style={{ color: C.text }}>Vets registered here are linked exclusively to <strong>{hospital.name}</strong>. Each vet must hold a valid PVMC license.</span>
              </div>
            </div>
          )}

          {/* ══ APPOINTMENTS ══ */}
          {tab === 'appts' && (
            <div>
              <h2 className="font-display font-bold text-[1.1rem] mb-5" style={{ color: C.text }}>All Appointments ({appts.length})</h2>
              {appts.length === 0 ? (
                <Panel className="py-20 text-center">
                  <div className="text-4xl mb-3">📅</div>
                  <div className="font-display font-bold text-[1.1rem]" style={{ color: C.text }}>No appointments yet</div>
                </Panel>
              ) : (
                <div className="flex flex-col gap-3">
                  {appts.map(a => (
                    <Panel key={a.id}>
                      <div className="flex flex-wrap items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-[15px] mb-0.5" style={{ color: C.text }}>
                            {a.cats?.name} <span style={{ color: C.textMuted, fontWeight:400 }}>({a.user_profiles?.name})</span>
                          </div>
                          <div className="text-[13px]" style={{ color: C.textMuted }}>
                            {a.vets?.user_profiles?.name} · {fmtDate(a.appointment_date)}
                            {a.appointment_slots ? ` · ${a.appointment_slots.start_time?.slice(0,5)} – ${a.appointment_slots.end_time?.slice(0,5)}` : ''}
                          </div>
                          {a.notes && <p className="text-[12.5px] mt-1" style={{ color: C.textMuted }}>Notes: {a.notes}</p>}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <ApptPill status={a.status} />
                          {a.status === 'pending' && (
                            <>
                              <button onClick={() => confirmAppt(a.id)}
                                      className="px-3 py-1.5 rounded-lg text-[12px] font-semibold"
                                      style={{ background: C.oliveBg, color: C.olive, border:`1px solid ${C.oliveBorder}` }}>
                                ✓ Confirm
                              </button>
                              <button onClick={() => cancelAppt(a.id)}
                                      className="px-3 py-1.5 rounded-lg text-[12px] font-semibold"
                                      style={{ background: C.dangerBg, color: C.dangerText, border:`1px solid ${C.dangerBorder}` }}>
                                ✕ Cancel
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </Panel>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══ SERVICES ══ */}
          {tab === 'services' && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="font-display font-bold text-[1.1rem]" style={{ color: C.text }}>Services &amp; Treatments ({services.length})</h2>
                  <p className="text-[13px] mt-0.5" style={{ color: C.textMuted }}>These appear on your public hospital page visible to users.</p>
                </div>
                <button onClick={() => setServiceModal('add')}
                        className="px-4 py-2 rounded-xl font-semibold text-[13px]"
                        style={{ background:`linear-gradient(135deg,${C.olive},#4a373a)`, color:'#fff' }}>
                  + Add Service
                </button>
              </div>
              {services.length === 0 ? (
                <Panel className="py-20 text-center">
                  <div className="text-4xl mb-3">🏥</div>
                  <div className="font-display font-bold text-[1.1rem] mb-2" style={{ color: C.text }}>No services listed</div>
                  <p className="text-[13.5px] mb-4" style={{ color: C.textMuted }}>Add treatments to help patients know what you offer.</p>
                  <button onClick={() => setServiceModal('add')}
                          className="px-5 py-2.5 rounded-xl font-semibold text-[13px]"
                          style={{ background:`linear-gradient(135deg,${C.olive},#4a373a)`, color:'#fff' }}>
                    + Add First Service
                  </button>
                </Panel>
              ) : (
                <div className="flex flex-col gap-3">
                  {services.map(s => (
                    <Panel key={s.id} className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
                           style={{ background: s.is_active ? C.oliveBg : C.dangerBg }}>
                        {s.category === 'Surgery' ? '🔪' : s.category === 'Emergency' ? '🚨' : '🏥'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="font-semibold text-[14.5px]" style={{ color: C.text }}>{s.name}</div>
                          {!s.is_active && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                                  style={{ background: C.dangerBg, color: C.dangerText }}>Hidden</span>
                          )}
                        </div>
                        <div className="text-[13px]" style={{ color: C.textMuted }}>
                          {s.category} · {s.duration_minutes} min · {s.description ?? ''}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="font-black text-[16px]" style={{ color: C.olive }}>₨{s.price?.toLocaleString()}</div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button onClick={() => setServiceModal(s)}
                                className="px-3 py-1.5 rounded-lg text-[12px] font-semibold"
                                style={{ background: C.oliveBg, color: C.olive, border:`1px solid ${C.oliveBorder}` }}>Edit</button>
                        <button onClick={() => deleteService(s.id)}
                                className="px-3 py-1.5 rounded-lg text-[12px] font-semibold"
                                style={{ background: C.dangerBg, color: C.dangerText, border:`1px solid ${C.dangerBorder}` }}>Remove</button>
                      </div>
                    </Panel>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══ SLOTS ══ */}
          {tab === 'slots' && (
            <div>
              <div className="mb-5">
                <h2 className="font-display font-bold text-[1.1rem]" style={{ color: C.text }}>Appointment Slots</h2>
                <p className="text-[13px] mt-0.5" style={{ color: C.textMuted }}>
                  Create time slots for each vet. Booked slots are locked — cancelling an appointment frees the slot.
                </p>
              </div>

              <SlotGenerator hospitalId={hospital.id} vets={vets} onDone={loadData} />

              <div className="flex items-center gap-4 mb-4">
                <span className="flex items-center gap-1.5 text-[12.5px] font-semibold" style={{ color: C.olive }}>
                  <div className="w-3 h-3 rounded-full" style={{ background: C.olive }} /> Available
                </span>
                <span className="flex items-center gap-1.5 text-[12.5px] font-semibold" style={{ color: C.amberText }}>
                  <div className="w-3 h-3 rounded-full" style={{ background: '#B87C2A' }} /> Booked
                </span>
              </div>

              {Object.keys(slotsByDate).length === 0 ? (
                <Panel className="py-16 text-center">
                  <div className="text-4xl mb-3">🗓️</div>
                  <div className="font-display font-bold text-[1.1rem]" style={{ color: C.text }}>No upcoming slots</div>
                  <p className="text-[13.5px] mt-1" style={{ color: C.textMuted }}>Use the generator above to create availability.</p>
                </Panel>
              ) : (
                Object.entries(slotsByDate).map(([date, daySlots]) => (
                  <div key={date} className="mb-6">
                    <h3 className="font-display font-bold text-[0.95rem] mb-3" style={{ color: C.text }}>
                      {new Date(date + 'T00:00:00').toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long' })}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {daySlots.map(s => (
                        <div key={s.id} className="flex items-center gap-2 px-3 py-2 rounded-xl"
                             style={{
                               background: s.is_booked ? C.amberBg : C.oliveBg,
                               border: `1px solid ${s.is_booked ? C.amberBorder : C.oliveBorder}`,
                             }}>
                          <div>
                            <div className="text-[12.5px] font-bold" style={{ color: s.is_booked ? C.amberText : C.olive }}>
                              {s.start_time?.slice(0,5)} – {s.end_time?.slice(0,5)}
                            </div>
                            <div className="text-[10.5px]" style={{ color: C.textMuted }}>
                              {s.vets?.user_profiles?.name ?? ''}
                            </div>
                          </div>
                          {!s.is_booked && (
                            <button onClick={() => deleteSlot(s.id)}
                                    className="text-[11px] font-bold ml-1"
                                    style={{ color: C.dangerText, background:'none', border:'none', cursor:'pointer' }}>✕</button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ══ STATISTICS ══ */}
          {tab === 'stats' && (
            <div>
              <h2 className="font-display font-bold text-[1.1rem] mb-6" style={{ color: C.text }}>Hospital Statistics</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <StatCard icon="📅" label="Total Appointments"  value={appts.length}     accentBg="rgba(184,92,56,.10)" />
                <StatCard icon="✅" label="Confirmed"            value={confirmedAppts}   accentBg="rgba(45,90,39,.10)" />
                <StatCard icon="⏳" label="Pending"              value={pendingAppts}     accentBg="rgba(184,124,42,.10)" />
                <StatCard icon="🗓️" label="Booked Slots"        value={bookedSlots}      accentBg="rgba(59,130,246,.10)" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Vet utilisation */}
                <Panel>
                  <h3 className="font-display font-bold text-[1rem] mb-4" style={{ color: C.text }}>Appointments per Vet</h3>
                  {vets.length === 0 ? (
                    <div className="text-center py-6 text-[13px]" style={{ color: C.textMuted }}>No vets registered.</div>
                  ) : vets.map(v => {
                    const count = appts.filter(a => a.vets?.user_profiles?.name === v.user_profiles?.name).length
                    const pct   = appts.length ? (count / appts.length) * 100 : 0
                    return (
                      <div key={v.id} className="flex items-center gap-3 mb-3">
                        <span className="text-[12px] font-semibold w-28 truncate" style={{ color: C.textMuted }}>{v.user_profiles?.name}</span>
                        <div className="flex-1 h-2 rounded-full" style={{ background: C.oliveBg }}>
                          <div className="h-2 rounded-full" style={{ width:`${pct}%`, background:`linear-gradient(90deg,${C.olive},#4a373a)` }} />
                        </div>
                        <span className="text-[12px] font-bold w-6 text-right" style={{ color: C.text }}>{count}</span>
                      </div>
                    )
                  })}
                </Panel>

                {/* Appointment status */}
                <Panel>
                  <h3 className="font-display font-bold text-[1rem] mb-4" style={{ color: C.text }}>Appointment Status Breakdown</h3>
                  {['pending','confirmed','cancelled','completed'].map(s => {
                    const count = appts.filter(a => a.status === s).length
                    const pct   = appts.length ? (count / appts.length) * 100 : 0
                    const style = STATUS_PILL[s]
                    return (
                      <div key={s} className="flex items-center gap-3 mb-3">
                        <span className="text-[12px] font-semibold w-20 capitalize" style={{ color: style?.text }}>{s}</span>
                        <div className="flex-1 h-2 rounded-full" style={{ background: C.oliveBg }}>
                          <div className="h-2 rounded-full" style={{ width:`${pct}%`, background: style?.text }} />
                        </div>
                        <span className="text-[12px] font-bold w-6 text-right" style={{ color: C.text }}>{count}</span>
                      </div>
                    )
                  })}
                </Panel>

                {/* Services by category */}
                <Panel className="md:col-span-2">
                  <h3 className="font-display font-bold text-[1rem] mb-4" style={{ color: C.text }}>Services by Category</h3>
                  <div className="flex flex-wrap gap-3">
                    {SERVICE_CATEGORIES.map(cat => {
                      const count = services.filter(s => s.category === cat && s.is_active).length
                      if (!count) return null
                      return (
                        <div key={cat} className="flex items-center gap-2 px-3 py-2 rounded-xl"
                             style={{ background: C.oliveBg, border:`1px solid ${C.oliveBorder}` }}>
                          <span className="text-[13px] font-semibold" style={{ color: C.olive }}>{cat}</span>
                          <span className="text-[12px] font-bold px-2 py-0.5 rounded-full"
                                style={{ background: C.surface, color: C.text }}>{count}</span>
                        </div>
                      )
                    })}
                    {services.filter(s => s.is_active).length === 0 && (
                      <div className="text-[13px]" style={{ color: C.textMuted }}>No active services.</div>
                    )}
                  </div>
                </Panel>
              </div>
            </div>
          )}

          {/* ══ SETTINGS ══ */}
          {tab === 'settings' && settingsForm && (
            <div className="max-w-2xl">
              <h2 className="font-display font-bold text-[1.1rem] mb-5" style={{ color: C.text }}>Hospital Settings</h2>
              <Panel className="flex flex-col gap-4">
                {[
                  { k:'name',    label:'Hospital Name', type:'text' },
                  { k:'phone',   label:'Phone',         type:'text' },
                  { k:'email',   label:'Email',         type:'email' },
                  { k:'city',    label:'City',          type:'text' },
                  { k:'address', label:'Address',       type:'text' },
                ].map(({ k, label, type }) => (
                  <div key={k}>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: C.textMuted }}>{label}</label>
                    <input type={type} value={settingsForm[k]}
                           onChange={e => setSettingsForm(f => ({ ...f, [k]: e.target.value }))}
                           className={inputCls} style={inputSty} onFocus={fi} onBlur={fo} />
                  </div>
                ))}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: C.textMuted }}>Description (shown on public page)</label>
                  <textarea value={settingsForm.description} rows={3}
                            onChange={e => setSettingsForm(f => ({ ...f, description: e.target.value }))}
                            className={inputCls} style={{ ...inputSty, resize:'none' }} onFocus={fi} onBlur={fo} />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: C.textMuted }}>Operating Hours (JSON)</label>
                  <textarea value={settingsForm.operating_hours} rows={4}
                            onChange={e => setSettingsForm(f => ({ ...f, operating_hours: e.target.value }))}
                            className={`${inputCls} font-mono text-[12px]`} style={{ ...inputSty, resize:'vertical' }} />
                  <p className="text-[11px] mt-1" style={{ color: C.textMuted }}>
                    Example: {`{"Mon-Fri":"9am-6pm","Sat":"10am-3pm","Sun":"Closed"}`}
                  </p>
                </div>
                <button onClick={saveSettings} disabled={saving}
                        className="w-full py-3 rounded-xl font-semibold text-[14px]"
                        style={{ background:`linear-gradient(135deg,${C.olive},#4a373a)`, color:'#fff' }}>
                  {saving ? 'Saving…' : 'Save Settings'}
                </button>
              </Panel>
            </div>
          )}

        </>
        )}
      </main>
    </div>
  )
}
