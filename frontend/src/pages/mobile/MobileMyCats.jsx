import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import MobileLayout from '../../layouts/MobileLayout'
import { supabase } from '../../lib/supabaseClient'

const GENDERS = ['male','female']
const EMPTY = { name:'', breed:'', age_months:'', weight_kg:'', color:'', gender:'male', is_neutered:false, microchip_id:'', photo_url:'' }

function fmtAge(m) {
  if (!m && m !== 0) return null
  if (m < 12) return `${m} mo`
  const y = Math.floor(m/12); const r = m%12
  return r ? `${y}y ${r}mo` : `${y} yr`
}

// ── Modal ──
function CatModal({ open, onClose, onSaved, editing }) {
  const { user } = useAuth()
  const [form, setForm]   = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [err, setErr]     = useState('')

  useEffect(() => {
    if (editing) setForm({ name:editing.name??'', breed:editing.breed??'', age_months:editing.age_months??'', weight_kg:editing.weight_kg??'', color:editing.color??'', gender:editing.gender??'male', is_neutered:editing.is_neutered??false, microchip_id:editing.microchip_id??'', photo_url:editing.photo_url??'' })
    else setForm(EMPTY)
    setErr('')
  }, [editing, open])

  function set(k,v){ setForm(f=>({...f,[k]:v})) }

  async function handlePhoto(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5*1024*1024) { setErr('Max file size 5 MB'); return }
    const path = `cats/${user.id}/${Date.now()}_${file.name}`
    const { data, error } = await supabase.storage.from('cat-photos').upload(path, file, { upsert:true })
    if (error) { setErr('Upload failed'); return }
    const { data:{ publicUrl } } = supabase.storage.from('cat-photos').getPublicUrl(data.path)
    set('photo_url', publicUrl)
  }

  async function submit() {
    if (!form.name.trim()) { setErr('Cat name is required'); return }
    setSaving(true); setErr('')
    const payload = { owner_id:user.id, name:form.name.trim(), breed:form.breed||null, gender:form.gender, age_months:form.age_months!==''?parseInt(form.age_months):null, weight_kg:form.weight_kg!==''?parseFloat(form.weight_kg):null, color:form.color||null, is_neutered:form.is_neutered, microchip_id:form.microchip_id||null, photo_url:form.photo_url||null }
    const { error } = editing ? await supabase.from('cats').update(payload).eq('id',editing.id) : await supabase.from('cats').insert([payload])
    setSaving(false)
    if (error) { setErr(error.message); return }
    onSaved(); onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor:'#dbe8d8' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 sticky top-0"
        style={{ backgroundColor:'#ffffff', borderBottom:'1px solid #b8ceb5' }}>
        <button onClick={onClose} className="text-2xl leading-none" style={{ color:'#7a5e60' }}>✕ Close</button>
        <p className="font-display font-bold text-lg" style={{ color:'#3a2c2d' }}>{editing?'Edit Cat':'Add a Cat'}</p>
        <button onClick={submit} disabled={saving} className="font-bold text-sm disabled:opacity-50" style={{ color:'#5e4749', fontFamily:'Plus Jakarta Sans, sans-serif' }}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Photo */}
        <label className="block">
          <div className="w-24 h-24 mx-auto rounded-2xl overflow-hidden flex items-center justify-center cursor-pointer"
            style={{ backgroundColor:'rgba(94,71,73,0.09)', border:'2px dashed #5e4749' }}>
            {form.photo_url
              ? <img src={form.photo_url} alt="" className="w-full h-full object-cover" />
              : <div className="text-center"><div className="text-3xl">📸</div><div className="text-xs mt-1 font-semibold" style={{ color:'#5e4749', fontFamily:'Plus Jakarta Sans, sans-serif' }}>Add photo</div></div>
            }
          </div>
          <input type="file" accept="image// " className="sr-only" onChange={handlePhoto} /> | </label> | {/* Fields}
        {[{label:'Cat name *',key:'name',placeholder:'e.g. Luna, Mochi'},{label:'Breed',key:'breed',placeholder:'e.g. Persian, Siamese'}].map(f => (
          <div key={f.key}>
            <label className="block text-xs font-semibold mb-1" style={{ color:'#3a2c2d', fontFamily:'Plus Jakarta Sans, sans-serif' }}>{f.label}</label>
            <input className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={{ backgroundColor:'#eef4ec', border:'1.5px solid #b8ceb5', color:'#3a2c2d', fontFamily:'Plus Jakarta Sans, sans-serif' }}
              placeholder={f.placeholder} value={form[f.key]} onChange={e=>set(f.key,e.target.value)} />
          </div>
        ))}

        <div className="grid grid-cols-2 gap-3">
          {[{label:'Age (months)',key:'age_months',ph:'24'},{label:'Weight (kg)',key:'weight_kg',ph:'4.2'}].map(f=>(
            <div key={f.key}>
              <label className="block text-xs font-semibold mb-1" style={{ color:'#3a2c2d', fontFamily:'Plus Jakarta Sans, sans-serif' }}>{f.label}</label>
              <input type="number" className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={{ backgroundColor:'#eef4ec', border:'1.5px solid #b8ceb5', color:'#3a2c2d', fontFamily:'Plus Jakarta Sans, sans-serif' }}
                placeholder={f.ph} value={form[f.key]} onChange={e=>set(f.key,e.target.value)} />
            </div>
          ))}
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1" style={{ color:'#3a2c2d', fontFamily:'Plus Jakarta Sans, sans-serif' }}>Color / Markings</label>
          <input className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={{ backgroundColor:'#eef4ec', border:'1.5px solid #b8ceb5', color:'#3a2c2d', fontFamily:'Plus Jakarta Sans, sans-serif' }}
            placeholder="e.g. White & grey" value={form.color} onChange={e=>set('color',e.target.value)} />
        </div>

        {/* Gender */}
        <div>
          <label className="block text-xs font-semibold mb-2" style={{ color:'#3a2c2d', fontFamily:'Plus Jakarta Sans, sans-serif' }}>Gender</label>
          <div className="flex gap-2">
            {GENDERS.map(g=>(
              <button key={g} onClick={()=>set('gender',g)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{ backgroundColor:form.gender===g?'#5e4749':'#ffffff', color:form.gender===g?'#ffffff':'#7a5e60', border:'1.5px solid', borderColor:form.gender===g?'#5e4749':'#b8ceb5', fontFamily:'Plus Jakarta Sans, sans-serif' }}>
                {g==='male'?'♂ Male':'♀ Female'}
              </button>
            ))}
          </div>
        </div>

        {/* Neutered toggle */}
        <div className="flex items-center justify-between px-4 py-3 rounded-xl"
          style={{ backgroundColor:'rgba(94,71,73,0.07)', border:'1px solid rgba(94,71,73,0.18)' }}>
          <div>
            <p className="font-semibold text-sm" style={{ color:'#3a2c2d', fontFamily:'Plus Jakarta Sans, sans-serif' }}>Spayed / Neutered</p>
            <p className="text-xs" style={{ color:'#7a5e60', fontFamily:'Plus Jakarta Sans, sans-serif' }}>Has your cat been spayed or neutered?</p>
          </div>
          <button onClick={()=>set('is_neutered',!form.is_neutered)}
            className="w-12 h-6 rounded-full transition-colors relative"
            style={{ backgroundColor:form.is_neutered?'#5e4749':'#b8ceb5' }}>
            <span className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
              style={{ left:form.is_neutered?'calc(100% - 1.375rem)':'0.125rem' }} />
          </button>
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1" style={{ color:'#3a2c2d', fontFamily:'Plus Jakarta Sans, sans-serif' }}>Microchip ID</label>
          <input className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={{ backgroundColor:'#eef4ec', border:'1.5px solid #b8ceb5', color:'#3a2c2d', fontFamily:'Plus Jakarta Sans, sans-serif' }}
            placeholder="Optional — 15-digit ISO number" value={form.microchip_id} onChange={e=>set('microchip_id',e.target.value)} />
        </div>

        {err && <div className="px-4 py-3 rounded-xl text-sm font-medium" style={{ backgroundColor:'rgba(184,56,56,0.09)', border:'1px solid rgba(184,56,56,0.22)', color:'#7D1F1F', fontFamily:'Plus Jakarta Sans, sans-serif' }}>⚠ {err}</div>}
      </div>
    </div>
  )
}

// ── Cat card ──
function CatCard({ cat, onEdit, onDelete }) {
  return (
    <div className="flex gap-3 p-4 rounded-2xl" style={{ backgroundColor:'#ffffff', border:'1px solid #b8ceb5', boxShadow:'0 2px 8px rgba(45,27,14,0.06)' }}>
      <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center"
        style={{ backgroundColor:'rgba(94,71,73,0.09)' }}>
        {cat.photo_url ? <img src={cat.photo_url} alt={cat.name} className="w-full h-full object-cover" /> : <span className="text-3xl">🐱</span>}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-base" style={{ color:'#3a2c2d', fontFamily:'Plus Jakarta Sans, sans-serif' }}>{cat.name}</span>
          <span style={{ color:cat.gender==='female'?'#B85C38':'#5e4749', fontWeight:'bold' }}>{cat.gender==='female'?'♀':'♂'}</span>
        </div>
        {cat.breed && <p className="text-sm font-medium" style={{ color:'#5e4749', fontFamily:'Plus Jakarta Sans, sans-serif' }}>{cat.breed}</p>}
        <div className="flex flex-wrap gap-1 mt-1.5">
          {cat.age_months!=null && <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor:'rgba(94,71,73,0.09)', color:'#5e4749', fontFamily:'Plus Jakarta Sans, sans-serif' }}>⏱ {fmtAge(cat.age_months)}</span>}
          {cat.weight_kg!=null  && <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor:'rgba(94,71,73,0.09)', color:'#5e4749', fontFamily:'Plus Jakarta Sans, sans-serif' }}>⚖ {cat.weight_kg} kg</span>}
          {cat.is_neutered      && <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor:'rgba(94,71,73,0.09)', color:'#5e4749', fontFamily:'Plus Jakarta Sans, sans-serif' }}>✂ Neutered</span>}
        </div>
      </div>
      <div className="flex flex-col gap-2 justify-center">
        <button onClick={()=>onEdit(cat)} className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ backgroundColor:'rgba(94,71,73,0.09)' }}> Edit</button>
        <button onClick={()=>onDelete(cat)} className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ backgroundColor:'rgba(184,56,56,0.09)' }}> Delete</button>
      </div>
    </div>
  )
}

export default function MobileMyCats() {
  const { user } = useAuth()
  const [cats,    setCats]    = useState([])
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState(false)
  const [editing, setEditing] = useState(null)

  async function load() {
    if (!user?.id) { setLoading(false); return }
    const { data } = await supabase.from('cats').select('*').eq('owner_id',user.id).order('registered_at',{ascending:false})
    if (data) setCats(data)
    setLoading(false)
  }
  useEffect(() => { load() }, [user?.id])

  // Also reload when Supabase session is restored (e.g. after page refresh)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session && user?.id) load()
      }
    )
    return () => subscription.unsubscribe()
  }, [user?.id])


  async function handleDelete(cat) {
    if (!confirm(`Remove ${cat.name} from your profile?`)) return
    await supabase.from('cats').delete().eq('id',cat.id)
    setCats(p=>p.filter(c=>c.id!==cat.id))
  }

  return (
    <>
      <MobileLayout title="My Cats">
        {/* Sub-header */}
        <div className="sticky top-0 z-30 flex items-center justify-between px-4 py-3"
          style={{ backgroundColor:'#ffffff', borderBottom:'1px solid #b8ceb5' }}>
          <p className="text-sm" style={{ color:'#7a5e60', fontFamily:'Plus Jakarta Sans, sans-serif' }}>
            {loading ? 'Loading…' : `${cats.length} cat${cats.length!==1?'s':''}`}
          </p>
          <button onClick={()=>{ setEditing(null); setModal(true) }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold text-white"
            style={{ backgroundColor:'#5e4749', fontFamily:'Plus Jakarta Sans, sans-serif' }}>
            Add Cat
          </button>
        </div>

        <div className="p-4">
          {loading ? (
            <div className="text-center py-16"><div className="text-4xl animate-pulse">🐱</div></div>
          ) : cats.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <div className="text-6xl">🐱</div>
              <p className="font-display font-bold text-xl" style={{ color:'#3a2c2d' }}>No cats yet</p>
              <p className="text-sm" style={{ color:'#7a5e60', fontFamily:'Plus Jakarta Sans, sans-serif' }}>Add your cat's profile to book vet appointments and get AI health advice.</p>
              <button onClick={()=>{ setEditing(null); setModal(true) }}
                className="px-6 py-3 rounded-xl font-bold text-white"
                style={{ backgroundColor:'#5e4749', fontFamily:'Plus Jakarta Sans, sans-serif' }}>
                Add your first cat
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {cats.map(cat => (
                <CatCard key={cat.id} cat={cat}
                  onEdit={c=>{ setEditing(c); setModal(true) }}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      </MobileLayout>

      <CatModal
        open={modal}
        onClose={()=>setModal(false)}
        onSaved={load}
        editing={editing}
      />
    </>
  )
}
