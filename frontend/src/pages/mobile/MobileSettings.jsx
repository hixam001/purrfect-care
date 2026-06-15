import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabaseClient'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
const TABS = ['Profile', 'Security', 'Notifications']

export default function MobileSettings() {
  const { user, token, logout } = useAuth()
  const navigate = useNavigate()
  const [tab,       setTab]     = useState('Profile')
  const [city,      setCity]    = useState('')
  const [avatarUrl, setAvatarUrl] = useState(null)
  const [saving,    setSaving]  = useState(false)
  const [newPw,     setNewPw]   = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [savingPw,  setSavingPw] = useState(false)
  const [msg,       setMsg]     = useState('')
  const [notifAppt,   setNotifAppt]   = useState(true)
  const [notifHealth, setNotifHealth] = useState(true)
  const [notifStore,  setNotifStore]  = useState(false)

  useEffect(() => {
    if (user) { setCity(user.city ?? ''); setAvatarUrl(user.avatar_url ?? null) }
  }, [user])

  async function handleAvatar(e) {
    const file = e.target.files?.[0]
    if (!file || file.size > 3*1024*1024) { setMsg('Max 3 MB'); return }
    const path = `avatars/${user.id}/${Date.now()}_${file.name}`
    const { data, error } = await supabase.storage.from('avatars').upload(path, file, { upsert:true })
    if (error) { setMsg('Upload failed'); return }
    const { data:{ publicUrl } } = supabase.storage.from('avatars').getPublicUrl(data.path)
    setAvatarUrl(publicUrl)
  }

  async function saveProfile() {
    setSaving(true); setMsg('')
    try {
      const res = await fetch(`${API}/api/users/profile`, {
        method:'PUT', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
        body: JSON.stringify({ city: city || null }),
      })
      setMsg(res.ok ? '✅ City saved!' : '❌ Could not save.')
    } catch { setMsg('❌ Network error.') }
    finally { setSaving(false) }
  }

  async function changePw() {
    if (newPw !== confirmPw) { setMsg('Passwords do not match'); return }
    if (newPw.length < 8) { setMsg('Password must be at least 8 characters'); return }
    setSavingPw(true); setMsg('')
    const { error } = await supabase.auth.updateUser({ password: newPw })
    setSavingPw(false)
    setMsg(error ? `❌ ${error.message}` : '✅ Password updated!')
    if (!error) { setNewPw(''); setConfirmPw('') }
  }

  return (
    <div className="min-h-screen pb-8" style={{ backgroundColor:'#dbe8d8' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-5 pb-3 sticky top-0 z-40"
        style={{ backgroundColor:'#ffffff', borderBottom:'1px solid #b8ceb5' }}>
        <button onClick={()=>navigate(-1)} className="px-3 py-2 rounded-xl text-sm font-semibold"
          style={{ backgroundColor:'rgba(94,71,73,0.09)' }}>Back</button>
        <p className="font-display font-bold text-lg flex-1" style={{ color:'#3a2c2d' }}>Settings</p>
        <button onClick={()=>{ logout(); navigate('/login') }}
          className="text-xs font-semibold px-3 py-1.5 rounded-xl"
          style={{ backgroundColor:'rgba(184,56,56,0.09)', color:'#7D1F1F', border:'1px solid rgba(184,56,56,0.22)', fontFamily:'Plus Jakarta Sans, sans-serif' }}>
          Sign out
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex sticky top-[57px] z-30" style={{ backgroundColor:'#ffffff', borderBottom:'1px solid #b8ceb5' }}>
        {TABS.map(t => (
          <button key={t} onClick={()=>{ setTab(t); setMsg('') }}
            className="flex-1 py-3 text-sm font-semibold transition-colors relative"
            style={{ color:tab===t?'#5e4749':'#7a5e60', fontFamily:'Plus Jakarta Sans, sans-serif', borderBottom:tab===t?'2px solid #5e4749':'2px solid transparent' }}>
            {t}
          </button>
        ))}
      </div>

      <div className="p-4 space-y-4">
        {/* ── Profile tab ── */}
        {tab==='Profile' && (
          <>
            {/* Avatar — editable */}
            <label className="flex flex-col items-center gap-2 cursor-pointer">
              <div className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center relative"
                style={{ border:'3px solid #5e4749', backgroundColor:'rgba(94,71,73,0.09)' }}>
                {avatarUrl ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" /> : <span className="text-3xl">👤</span>}
                <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full flex items-center justify-center text-xs"
                  style={{ backgroundColor:'#5e4749' }}>📷</div>
              </div>
              <span className="text-xs font-semibold" style={{ color:'#5e4749', fontFamily:'Plus Jakarta Sans, sans-serif' }}>Change photo</span>
              <input type="file" accept="image// " className="sr-only" onChange={handleAvatar} /> | </label> | {/* Read-only fields from registration}
            {[
              { label:'Full name',    value: user?.name  ?? '', hint:'Set at registration' },
              { label:'Email',        value: user?.email ?? '', hint:'Cannot be changed'   },
              { label:'Phone number', value: user?.phone ?? '', hint:'Set at registration' },
            ].map(f => (
              <div key={f.label}>
                <label className="block text-xs font-semibold mb-1" style={{ color:'#3a2c2d', fontFamily:'Plus Jakarta Sans, sans-serif' }}>{f.label}</label>
                <div className="w-full px-4 py-3 rounded-xl text-sm" style={{ backgroundColor:'rgba(0,0,0,0.04)', border:'1.5px solid #b8ceb5', color:'#7a5e60', fontFamily:'Plus Jakarta Sans, sans-serif' }}>
                  {f.value || '—'}
                </div>
                <p className="text-xs mt-1" style={{ color:'#a08c7d', fontFamily:'Plus Jakarta Sans, sans-serif' }}>{f.hint}</p>
              </div>
            ))}

            {/* City — editable */}
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color:'#3a2c2d', fontFamily:'Plus Jakarta Sans, sans-serif' }}>City</label>
              <input className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={{ backgroundColor:'#eef4ec', border:'1.5px solid #b8ceb5', color:'#3a2c2d', fontFamily:'Plus Jakarta Sans, sans-serif' }}
                placeholder="Lahore, Karachi…" value={city} onChange={e => setCity(e.target.value)} />
            </div>

            <button onClick={saveProfile} disabled={saving}
              className="w-full py-3.5 rounded-xl font-bold text-white disabled:opacity-50"
              style={{ backgroundColor:'#5e4749', fontFamily:'Plus Jakarta Sans, sans-serif' }}>
              {saving ? 'Saving…' : 'Save City'}
            </button>
          </>
        )}

        {/* ── Security tab ── */}
        {tab==='Security' && (
          <>
            <div className="p-4 rounded-2xl space-y-3" style={{ backgroundColor:'#ffffff', border:'1px solid #b8ceb5' }}>
              <p className="font-display font-bold text-base" style={{ color:'#3a2c2d' }}>Change Password</p>
              {[{label:'New password',val:newPw,set:setNewPw},{label:'Confirm password',val:confirmPw,set:setConfirmPw}].map(f=>(
                <div key={f.label}>
                  <label className="block text-xs font-semibold mb-1" style={{ color:'#3a2c2d', fontFamily:'Plus Jakarta Sans, sans-serif' }}>{f.label}</label>
                  <input type="password" className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                    style={{ backgroundColor:'#eef4ec', border:'1.5px solid #b8ceb5', color:'#3a2c2d', fontFamily:'Plus Jakarta Sans, sans-serif' }}
                    placeholder="Min. 8 characters" value={f.val} onChange={e=>f.set(e.target.value)} />
                </div>
              ))}
              <button onClick={changePw} disabled={savingPw}
                className="w-full py-3 rounded-xl font-bold text-white disabled:opacity-50"
                style={{ backgroundColor:'#5e4749', fontFamily:'Plus Jakarta Sans, sans-serif' }}>
                {savingPw ? 'Updating…' : 'Update Password'}
              </button>
            </div>
            <div className="p-4 rounded-2xl space-y-3" style={{ backgroundColor:'#ffffff', border:'1.5px solid rgba(184,56,56,0.30)' }}>
              <p className="font-display font-bold text-base" style={{ color:'#7D1F1F' }}>⚠ Danger Zone</p>
              <p className="text-sm" style={{ color:'#7a5e60', fontFamily:'Plus Jakarta Sans, sans-serif' }}>Once deleted, your account cannot be recovered.</p>
              <button onClick={()=>{ if(confirm('Delete your account permanently?')){ logout(); navigate('/login') } }}
                className="w-full py-3 rounded-xl font-bold text-white"
                style={{ backgroundColor:'#7D1F1F', fontFamily:'Plus Jakarta Sans, sans-serif' }}>
                Delete Account
              </button>
            </div>
          </>
        )}

        {/* ── Notifications tab ── */}
        {tab==='Notifications' && (
          <div className="p-4 rounded-2xl divide-y" style={{ backgroundColor:'#ffffff', border:'1px solid #b8ceb5', divideColor:'#E5D9D0' }}>
            {[
              { label:'Appointment reminders', sub:'Upcoming vet visits',       val:notifAppt,   set:setNotifAppt   },
              { label:'Health alerts',          sub:'Cat health updates',         val:notifHealth, set:setNotifHealth },
              { label:'Store promotions',       sub:'Deals and new products',     val:notifStore,  set:setNotifStore  },
            ].map(n=>(
              <div key={n.label} className="flex items-center justify-between py-4">
                <div>
                  <p className="font-semibold text-sm" style={{ color:'#3a2c2d', fontFamily:'Plus Jakarta Sans, sans-serif' }}>{n.label}</p>
                  <p className="text-xs mt-0.5" style={{ color:'#7a5e60', fontFamily:'Plus Jakarta Sans, sans-serif' }}>{n.sub}</p>
                </div>
                <button onClick={()=>n.set(!n.val)}
                  className="w-12 h-6 rounded-full transition-colors relative flex-shrink-0"
                  style={{ backgroundColor:n.val?'#5e4749':'#b8ceb5' }}>
                  <span className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
                    style={{ left:n.val?'calc(100% - 1.375rem)':'0.125rem' }} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Status message */}
        {msg && (
          <div className="px-4 py-3 rounded-xl text-sm font-medium text-center"
            style={{ backgroundColor:msg.startsWith('✅')?'rgba(94,71,73,0.09)':'rgba(184,56,56,0.09)', color:msg.startsWith('✅')?'#4a373a':'#7D1F1F', border:`1px solid ${msg.startsWith('✅')?'rgba(94,71,73,0.20)':'rgba(184,56,56,0.22)'}`, fontFamily:'Plus Jakarta Sans, sans-serif' }}>
            {msg}
          </div>
        )}
      </div>
    </div>
  )
}
