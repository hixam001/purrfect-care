/**
 * SettingsPage — user account & app settings.
 *
 * Sections:
 *  1. Profile — name, phone, city, avatar URL
 *  2. Password — change password via Supabase Auth
 *  3. Notifications — notification preferences
 *  4. Privacy — account visibility preferences
 *  5. Danger zone — delete account link
 */
import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { Badge, BtnOlive, BtnOutline, Card, GlassCard } from '../components/ui/index.jsx'
import { useFadeUp } from '../hooks/useScrollReveal.js'

/* ─── section tab list ─────────────────────────────────────── */
const TABS = [
  { id: 'profile',       icon: '👤', label: 'Profile'       },
  { id: 'security',      icon: '🔐', label: 'Security'      },
  { id: 'notifications', icon: '🔔', label: 'Notifications'  },
  { id: 'privacy',       icon: '🛡',  label: 'Privacy'       },
]

/* ─── reusable field row ─────────────────────────────────────── */
function FieldLabel({ children }) {
  return (
    <label className="t-mono text-[10px] block mb-1.5 uppercase tracking-widest text-clay-muted">
      {children}
    </label>
  )
}

function InputField({ id, type = 'text', value, onChange, placeholder, disabled }) {
  const focusIn  = e => { e.target.style.borderColor = '#556B2F'; e.target.style.boxShadow = '0 0 0 3px rgba(85,107,47,.12)' }
  const focusOut = e => { e.target.style.borderColor = '#D7C9BD'; e.target.style.boxShadow = 'none' }
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full px-4 py-3 rounded-xl text-[14px] outline-none transition-all"
      style={{
        background:  disabled ? 'rgba(0,0,0,.03)' : 'rgba(255,255,255,.9)',
        border:      '1.5px solid #D7C9BD',
        color:       disabled ? '#A08C7D' : '#2C1810',
        cursor:      disabled ? 'not-allowed' : 'text',
      }}
      onFocus={disabled ? undefined : focusIn}
      onBlur={disabled  ? undefined : focusOut}
    />
  )
}

/* ─── toast helper ──────────────────────────────────────────── */
function Toast({ message, type = 'success', onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3500)
    return () => clearTimeout(t)
  }, [])
  const bg = type === 'success'
    ? 'rgba(85,107,47,.12)'
    : 'rgba(220,80,80,.1)'
  const border = type === 'success'
    ? 'rgba(85,107,47,.3)'
    : 'rgba(220,80,80,.3)'
  const color = type === 'success' ? '#3D4F21' : '#C0392B'

  return (
    <div
      className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-lg text-[13px] font-semibold flex items-center gap-2"
      style={{ background: bg, border: `1px solid ${border}`, color, backdropFilter: 'blur(12px)' }}
    >
      {type === 'success' ? '✓' : '✗'} {message}
    </div>
  )
}

/* ─── Profile section ──────────────────────────────────────── */
function ProfileSection({ user }) {
  const fileRef = useRef()
  const [form,      setForm]      = useState({ name: '', phone: '', city: '' })
  const [avatarSrc, setAvatarSrc] = useState(null)   // current display URL
  const [uploading, setUploading] = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [toast,     setToast]     = useState(null)

  /* Pre-fill from registration / login data */
  useEffect(() => {
    setForm({
      name:  user?.name  ?? '',
      phone: user?.phone ?? '',
      city:  user?.city  ?? '',
    })
    setAvatarSrc(user?.avatar_url ?? null)
  }, [user])

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  /* Photo picker → upload to Supabase Storage */
  async function handlePhoto(e) {
    const file = e.target.files?.[0]
    if (!file || !user?.id) return
    setUploading(true)
    const path = `avatars/${user.id}/${Date.now()}_${file.name}`
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true })
    if (error) {
      setToast({ msg: 'Photo upload failed: ' + error.message, type: 'error' })
      setUploading(false)
      return
    }
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(data.path)
    setAvatarSrc(publicUrl)
    /* Immediately persist the new avatar_url */
    await supabase
      .from('user_profiles')
      .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
      .eq('id', user.id)
    setUploading(false)
    setToast({ msg: 'Profile photo updated ✓', type: 'success' })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!user?.id) return
    setSaving(true)
    const { error } = await supabase
      .from('user_profiles')
      .update({
        name:       form.name.trim()  || null,
        phone:      form.phone.trim() || null,
        city:       form.city.trim()  || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
    setSaving(false)
    setToast(error
      ? { msg: error.message,     type: 'error'   }
      : { msg: 'Profile updated', type: 'success' }
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">

      {/* Photo picker */}
      <div className="flex items-center gap-5">
        <div
          onClick={() => fileRef.current?.click()}
          className="relative w-20 h-20 rounded-2xl flex items-center justify-center cursor-pointer overflow-hidden flex-shrink-0 group"
          style={{
            background: avatarSrc ? 'transparent' : 'rgba(107,142,35,.1)',
            border: '2px dashed rgba(107,142,35,.4)',
          }}
        >
          {avatarSrc
            ? <img src={avatarSrc} alt="avatar" className="w-full h-full object-cover" />
            : <span className="text-3xl">{uploading ? '⏳' : '📷'}</span>
          }
          <div
            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"
            style={{ background: 'rgba(0,0,0,.35)' }}
          >
            <span className="text-white text-[10px] font-bold">{uploading ? 'Uploading…' : 'Change'}</span>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
        </div>
        <div>
          <div className="font-semibold text-[14px] text-espresso">Profile Photo</div>
          <div className="text-[12px] text-clay-muted mt-0.5">Click to upload a new photo</div>
          <div className="text-[11px] text-clay-muted mt-1">JPG, PNG or WebP · max 5 MB</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <FieldLabel>Full Name</FieldLabel>
          <InputField id="settings-name" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Your name" />
        </div>
        <div>
          <FieldLabel>Phone Number</FieldLabel>
          <InputField id="settings-phone" type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+92 3XX XXXXXXX" />
        </div>
        <div>
          <FieldLabel>City</FieldLabel>
          <InputField id="settings-city" value={form.city} onChange={e => set('city', e.target.value)} placeholder="e.g. Lahore, Karachi" />
        </div>
      </div>

      {/* Email — read only, always pre-filled */}
      <div>
        <FieldLabel>Email Address</FieldLabel>
        <InputField id="settings-email" type="email" value={user?.email ?? ''} disabled />
        <p className="text-[11px] text-clay-muted mt-1.5">Email cannot be changed here. Contact support if needed.</p>
      </div>

      <div>
        <FieldLabel>Account Role</FieldLabel>
        <InputField id="settings-role" value={user?.role ?? 'cat_owner'} disabled />
      </div>

      <div className="pt-2">
        <BtnOlive onClick={() => {}}>
          {saving ? '⏳ Saving…' : '✓ Save Profile'}
        </BtnOlive>
      </div>

      {toast && <Toast message={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </form>
  )
}

/* ─── Security section ─────────────────────────────────────── */
function SecuritySection() {
  const [form,   setForm]   = useState({ current: '', next: '', confirm: '' })
  const [saving, setSaving] = useState(false)
  const [toast,  setToast]  = useState(null)

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (form.next.length < 8) {
      setToast({ msg: 'New password must be at least 8 characters.', type: 'error' })
      return
    }
    if (form.next !== form.confirm) {
      setToast({ msg: 'Passwords do not match.', type: 'error' })
      return
    }
    setSaving(true)
    const { error } = await supabase.auth.updateUser({ password: form.next })
    setSaving(false)
    setToast(error
      ? { msg: error.message,           type: 'error'   }
      : { msg: 'Password changed ✓',    type: 'success' }
    )
    if (!error) setForm({ current: '', next: '', confirm: '' })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 max-w-md">
      <div
        className="px-4 py-3 rounded-xl text-[13px] flex items-start gap-3"
        style={{ background: 'rgba(196,140,56,.1)', border: '1px solid rgba(196,140,56,.25)' }}
      >
        <span className="text-lg flex-shrink-0">ℹ</span>
        <p className="text-clay-muted leading-relaxed">
          You are signed in via Supabase Auth. Use the form below to change your password.
          You must be currently signed in with a valid session.
        </p>
      </div>

      <div>
        <FieldLabel>New Password</FieldLabel>
        <InputField
          id="settings-new-pw"
          type="password"
          value={form.next}
          onChange={e => set('next', e.target.value)}
          placeholder="At least 8 characters"
        />
      </div>
      <div>
        <FieldLabel>Confirm New Password</FieldLabel>
        <InputField
          id="settings-confirm-pw"
          type="password"
          value={form.confirm}
          onChange={e => set('confirm', e.target.value)}
          placeholder="Repeat new password"
        />
      </div>

      <div>
        <BtnOlive onClick={() => {}}>
          {saving ? '⏳ Updating…' : '🔐 Change Password'}
        </BtnOlive>
      </div>

      {toast && <Toast message={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </form>
  )
}

/* ─── Notifications section ────────────────────────────────── */
function NotificationsSection({ user }) {
  const prefs = user?.preferences ?? {}
  const [notif, setNotif] = useState({
    appointment_reminders: prefs.appointment_reminders ?? true,
    new_messages:          prefs.new_messages          ?? true,
    prescription_updates:  prefs.prescription_updates  ?? true,
    promotions:            prefs.promotions            ?? false,
  })
  const [saving, setSaving] = useState(false)
  const [toast,  setToast]  = useState(null)

  function toggle(k) { setNotif(n => ({ ...n, [k]: !n[k] })) }

  async function save() {
    if (!user?.id) return
    setSaving(true)
    const { error } = await supabase
      .from('user_profiles')
      .update({ preferences: { ...prefs, ...notif }, updated_at: new Date().toISOString() })
      .eq('id', user.id)
    setSaving(false)
    setToast(error
      ? { msg: error.message,             type: 'error'   }
      : { msg: 'Preferences saved ✓',     type: 'success' }
    )
  }

  const rows = [
    { key: 'appointment_reminders', label: 'Appointment Reminders', desc: 'Get reminded before your vet visits' },
    { key: 'new_messages',          label: 'New Messages',          desc: 'Notify when your vet sends a message' },
    { key: 'prescription_updates',  label: 'Prescription Updates',  desc: 'Updates on prescriptions issued for your cats' },
    { key: 'promotions',            label: 'Promotions & Offers',   desc: 'Store deals and platform announcements' },
  ]

  return (
    <div className="flex flex-col gap-4">
      {rows.map(r => (
        <div
          key={r.key}
          onClick={() => toggle(r.key)}
          className="flex items-center justify-between px-5 py-4 rounded-2xl cursor-pointer transition-all"
          style={{
            background: notif[r.key] ? 'rgba(107,142,35,.08)' : 'rgba(255,255,255,.7)',
            border: `1px solid ${notif[r.key] ? 'rgba(107,142,35,.25)' : '#D7C9BD'}`,
          }}
        >
          <div>
            <div className="font-semibold text-[14px] text-espresso">{r.label}</div>
            <div className="text-[12px] text-clay-muted mt-0.5">{r.desc}</div>
          </div>
          <div
            className="w-11 h-6 rounded-full relative transition-all flex-shrink-0 ml-4"
            style={{ background: notif[r.key] ? '#556B2F' : '#D7C9BD' }}
          >
            <div
              className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all"
              style={{ left: notif[r.key] ? 'calc(100% - 22px)' : '2px' }}
            />
          </div>
        </div>
      ))}
      <div className="pt-2">
        <BtnOlive onClick={save}>{saving ? '⏳ Saving…' : '✓ Save Preferences'}</BtnOlive>
      </div>
      {toast && <Toast message={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  )
}

/* ─── Privacy section ──────────────────────────────────────── */
function PrivacySection() {
  return (
    <div className="flex flex-col gap-5 max-w-lg">
      <div className="text-[14px] text-clay-muted leading-relaxed">
        Purrfect Care uses your data only to provide veterinary, AI health, and store services.
        We do not sell or share your personal information with third parties outside our service providers.
      </div>
      <div className="flex flex-col gap-3">
        {[
          { icon: '🗂', title: 'Data Storage',   desc: 'All data is stored securely in Supabase (PostgreSQL) hosted in the EU.' },
          { icon: '🔒', title: 'Encryption',      desc: 'Passwords are hashed using bcrypt. Connections are TLS-encrypted.' },
          { icon: '📍', title: 'Location Data',  desc: 'Location is used only for finding nearby hospitals. It is never stored permanently.' },
          { icon: '🤖', title: 'AI Interactions', desc: 'AI chat messages are processed by Google Gemini. Messages are not stored.' },
        ].map(p => (
          <Card key={p.title} className="p-4 flex items-start gap-4">
            <span className="text-2xl flex-shrink-0">{p.icon}</span>
            <div>
              <div className="font-bold text-[14px] text-espresso mb-0.5">{p.title}</div>
              <div className="text-[12px] text-clay-muted leading-relaxed">{p.desc}</div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

/* ─── Main page ─────────────────────────────────────────────── */
export default function SettingsPage() {
  const { user, logout } = useAuth()
  const headerRef = useFadeUp(0)
  const [activeTab, setActiveTab] = useState('profile')

  const displayName = user?.full_name ?? user?.email ?? 'Cat Parent'

  return (
    <div className="min-h-screen" style={{ background: '#F5EBE6' }}>

      {/* ── Navbar ── */}
      <header
        className="sticky top-0 z-30 transition-shadow"
        style={{ background: 'rgba(245,235,230,.92)', backdropFilter: 'blur(18px)', borderBottom: '1px solid #D7C9BD' }}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-6">
          <Link to="/dashboard" className="flex items-center gap-2.5 no-underline flex-shrink-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                 style={{ background: 'linear-gradient(135deg,#556B2F,#3D4F21)' }}>🐱</div>
            <span className="font-display font-black text-[18px] tracking-tight text-espresso">
              Purrfect<span className="text-olive">Care</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {[
              { label: 'Dashboard',     href: '/dashboard'    },
              { label: 'My Cats',       href: '/my-cats'      },
              { label: 'Find Hospitals',href: '/find-vets'    },
            ].map(l => (
              <Link key={l.href} to={l.href} className="nav-a">{l.label}</Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full"
                 style={{ background: 'rgba(107,142,35,.1)', border: '1px solid rgba(107,142,35,.2)' }}>
              <span className="text-[13px]">⚙</span>
              <span className="text-[12px] font-semibold text-olive">Settings</span>
            </div>
            <button onClick={logout} className="btn btn-outline !py-2 !px-4 !text-[11px]">Log out</button>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-10">

        {/* Page header */}
        <div ref={headerRef} className="fade-up mb-10">
          <Badge className="mb-3">Settings</Badge>
          <h1 className="font-display font-black text-espresso tracking-tight mb-2"
              style={{ fontSize: 'clamp(1.8rem,3vw,2.4rem)' }}>
            Account Settings
          </h1>
          <p className="text-clay-muted text-[15px]">Manage your profile, security, and preferences.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">

          {/* ── Sidebar tabs ── */}
          <aside className="lg:w-56 flex-shrink-0">
            <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0">
              {TABS.map(t => (
                <button
                  key={t.id}
                  id={`settings-tab-${t.id}`}
                  onClick={() => setActiveTab(t.id)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-semibold text-left transition-all whitespace-nowrap flex-shrink-0"
                  style={{
                    background: activeTab === t.id ? '#556B2F'             : 'rgba(255,255,255,.7)',
                    color:      activeTab === t.id ? '#fff'                : '#4E342E',
                    border:     activeTab === t.id ? 'none'                : '1px solid #D7C9BD',
                    boxShadow:  activeTab === t.id ? '0 4px 16px rgba(85,107,47,.25)' : 'none',
                  }}
                >
                  <span className="text-[16px]">{t.icon}</span>
                  {t.label}
                </button>
              ))}

              {/* Danger zone */}
              <button
                id="settings-tab-danger"
                onClick={() => setActiveTab('danger')}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-semibold text-left transition-all whitespace-nowrap flex-shrink-0 mt-auto"
                style={{
                  background: activeTab === 'danger' ? 'rgba(220,80,80,.12)' : 'transparent',
                  color:      '#C0392B',
                  border:     '1px solid rgba(220,80,80,.25)',
                }}
              >
                <span className="text-[16px]">⚠</span>
                Danger Zone
              </button>
            </div>
          </aside>

          {/* ── Content panel ── */}
          <section className="flex-1 min-w-0">
            <GlassCard className="p-6 lg:p-8">

              {activeTab === 'profile' && (
                <>
                  <h2 className="font-display font-bold text-[1.15rem] text-espresso mb-6">Profile Information</h2>
                  <ProfileSection user={user} />
                </>
              )}

              {activeTab === 'security' && (
                <>
                  <h2 className="font-display font-bold text-[1.15rem] text-espresso mb-6">Security & Password</h2>
                  <SecuritySection />
                </>
              )}

              {activeTab === 'notifications' && (
                <>
                  <h2 className="font-display font-bold text-[1.15rem] text-espresso mb-6">Notification Preferences</h2>
                  <NotificationsSection user={user} />
                </>
              )}

              {activeTab === 'privacy' && (
                <>
                  <h2 className="font-display font-bold text-[1.15rem] text-espresso mb-6">Privacy & Data</h2>
                  <PrivacySection />
                </>
              )}

              {activeTab === 'danger' && (
                <>
                  <h2 className="font-display font-bold text-[1.15rem] mb-2" style={{ color: '#C0392B' }}>
                    Danger Zone
                  </h2>
                  <p className="text-clay-muted text-[13px] mb-6">
                    These actions are permanent and cannot be undone. Please proceed carefully.
                  </p>
                  <div className="flex flex-col gap-4">
                    <div
                      className="p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                      style={{ background: 'rgba(220,80,80,.05)', border: '1px solid rgba(220,80,80,.2)' }}
                    >
                      <div>
                        <div className="font-bold text-[14px] text-espresso mb-0.5">Delete Account</div>
                        <div className="text-[12px] text-clay-muted">
                          Permanently deletes your account, cats, and all associated data.
                          This action is irreversible.
                        </div>
                      </div>
                      <button
                        id="settings-delete-account"
                        className="px-5 py-2.5 rounded-xl text-[13px] font-bold flex-shrink-0 transition-all"
                        style={{ background: 'rgba(220,80,80,.1)', color: '#C0392B', border: '1px solid rgba(220,80,80,.3)' }}
                        onClick={() => alert('Account deletion requires contacting support at support@purrfectcare.pk')}
                      >
                        Delete Account
                      </button>
                    </div>
                    <div
                      className="p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                      style={{ background: 'rgba(196,140,56,.05)', border: '1px solid rgba(196,140,56,.2)' }}
                    >
                      <div>
                        <div className="font-bold text-[14px] text-espresso mb-0.5">Export Data</div>
                        <div className="text-[12px] text-clay-muted">
                          Download a copy of your profile, cats, and appointment history.
                        </div>
                      </div>
                      <button
                        id="settings-export-data"
                        className="px-5 py-2.5 rounded-xl text-[13px] font-bold flex-shrink-0 transition-all"
                        style={{ background: 'rgba(196,140,56,.1)', color: '#8B6A14', border: '1px solid rgba(196,140,56,.3)' }}
                        onClick={() => alert('Data export is coming soon.')}
                      >
                        Export Data
                      </button>
                    </div>
                  </div>
                </>
              )}

            </GlassCard>
          </section>
        </div>
      </main>
    </div>
  )
}
