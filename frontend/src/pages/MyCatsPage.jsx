// MyCatsPage — cat profile manager for the logged-in user. | Features: | - Lists all cats belonging to the user (real Supabase data) | - "Add Cat" slide-in drawer with a rich form | - Fields: name, breed (text), age, weight, color, gender, | neutered toggle, microchip ID, photo upload (optional) | - Edit & delete actions on each card
import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { Badge, BtnOlive, BtnOutline, Pill, Card, GlassCard } from '../components/ui/index.jsx'
import { useFadeUp } from '../hooks/useScrollReveal.js'

// ─── helpers ────────────────────────────────────────────────
const GENDERS = ['male', 'female']

function fmtAge(months) {
  if (!months && months !== 0) return '—'
  if (months < 12) return `${months}mo`
  const y = Math.floor(months / 12)
  const m = months % 12
  return m ? `${y}y ${m}mo` : `${y}y`
}

const EMPTY_FORM = {
  name: '', breed: '', age_months: '', weight_kg: '',
  color: '', gender: 'male', is_neutered: false, microchip_id: '', photo_url: '',
}

// ─── Add / Edit drawer ───────────────────────────────────────
function CatDrawer({ open, onClose, onSaved, editing }) {
  const { user } = useAuth()
  const [form,    setForm]    = useState(EMPTY_FORM)
  const [saving,  setSaving]  = useState(false)
  const [err,     setErr]     = useState('')
  const [preview, setPreview] = useState(null)
  const fileRef = useRef()

  // Pre-fill when editing
  useEffect(() => {
    if (editing) {
      setForm({
        name:         editing.name         ?? '',
        breed:        editing.breed        ?? '',
        age_months:   editing.age_months   ?? '',
        weight_kg:    editing.weight_kg    ?? '',
        color:        editing.color        ?? '',
        gender:       editing.gender       ?? 'male',
        is_neutered:  editing.is_neutered  ?? false,
        microchip_id: editing.microchip_id ?? '',
        photo_url:    editing.photo_url    ?? '',
      })
      setPreview(editing.photo_url ?? null)
    } else {
      setForm(EMPTY_FORM)
      setPreview(null)
    }
    setErr('')
  }, [editing, open])

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function handlePhoto(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setPreview(URL.createObjectURL(file))
    // Upload to Supabase storage
    const path = `cats/${user.id}/${Date.now()}_${file.name}`
    const { data, error } = await supabase.storage
      .from('cat-photos')
      .upload(path, file, { upsert: true })
    if (error) { setErr('Photo upload failed: ' + error.message); return }
    const { data: { publicUrl } } = supabase.storage
      .from('cat-photos')
      .getPublicUrl(data.path)
    set('photo_url', publicUrl)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) { setErr('Cat name is required.'); return }
    setSaving(true); setErr('')

    const payload = {
      owner_id:     user.id,        // user_profiles.id returned directly by auth service
      name:         form.name.trim(),
      breed:        form.breed.trim() || null,
      age_months:   form.age_months !== '' ? parseInt(form.age_months) : null,
      weight_kg:    form.weight_kg  !== '' ? parseFloat(form.weight_kg) : null,
      color:        form.color.trim()  || null,
      gender:       form.gender,
      is_neutered:  form.is_neutered,
      microchip_id: form.microchip_id.trim() || null,
      photo_url:    form.photo_url || null,
    }

    let error
    if (editing) {
      ;({ error } = await supabase.from('cats').update(payload).eq('id', editing.id))
    } else {
      ;({ error } = await supabase.from('cats').insert([payload]))
    }

    if (error) { setErr(error.message); setSaving(false); return }
    onSaved()
    onClose()
    setSaving(false)
  }

  // Input styling helpers
  const inputCls = `w-full px-4 py-3 rounded-xl text-[14px] outline-none transition-all`
  const inputStyle = {
    background: 'rgba(255,255,255,.9)',
    border: '1.5px solid #b8ceb5',
    color: '#2C1810',
  }
  const focusIn  = e => { e.target.style.borderColor = '#5e4749'; e.target.style.boxShadow = '0 0 0 3px rgba(85,107,47,.12)' }
  const focusOut = e => { e.target.style.borderColor = '#b8ceb5'; e.target.style.boxShadow = 'none' }

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-40 transition-opacity duration-300"
        style={{
          background: 'rgba(44,24,16,.45)',
          backdropFilter: 'blur(4px)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
        }}
      />

      {/* Drawer panel */}
      <div
        className="fixed top-0 right-0 h-full z-50 overflow-y-auto transition-transform duration-300 ease-out"
        style={{
          width: 'min(480px, 100vw)',
          background: '#FBF5F0',
          boxShadow: '-8px 0 40px rgba(44,24,16,.15)',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          borderLeft: '1px solid #b8ceb5',
        }}
      >
        {/* Drawer header */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between px-6 py-4"
          style={{ background: 'rgba(251,245,240,.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #b8ceb5' }}
        >
          <div>
            <div className="font-display font-bold text-[17px] text-espresso">
              {editing ? 'Edit Cat Profile' : 'Add a New Cat'}
            </div>
            <div className="text-[12px] text-clay-muted mt-0.5">
              {editing ? 'Update your cat\'s information' : 'Tell us about your furry family member'}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[18px] transition-all"
            style={{ background: 'rgba(0,0,0,.06)' }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6 flex flex-col gap-5">

          {/* Photo picker */}
          <div
            onClick={() => fileRef.current?.click()}
            className="relative mx-auto w-28 h-28 rounded-3xl flex items-center justify-center cursor-pointer overflow-hidden transition-all group"
            style={{ background: preview ? 'transparent' : 'rgba(94,71,73,.1)', border: '2px dashed rgba(94,71,73,.4)' }}
          >
            {preview
              ? <img src={preview} alt="cat" className="w-full h-full object-cover rounded-3xl" />
              : (
                <div className="text-center">
                  <div className="text-3xl mb-1">📷</div>
                  <div className="text-[10px] text-clay-muted font-mono">optional</div>
                </div>
              )
            }
            <div
              className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl"
              style={{ background: 'rgba(0,0,0,.35)' }}
            >
              <span className="text-white text-[11px] font-bold">Change</span>
            </div>
            <input ref={fileRef} type="file" accept="image// " className="hidden" onChange={handlePhoto} /> | </div> | {/* Name}
          <div>
            <label className="t-mono text-[10px] block mb-1.5 uppercase tracking-widest text-clay-muted">Cat Name *</label>
            <input
              id="cat-name"
              required
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="e.g. Luna, Mochi, Simba"
              className={inputCls}
              style={inputStyle}
              onFocus={focusIn} onBlur={focusOut}
            />
          </div>

          {/* Breed */}
          <div>
            <label className="t-mono text-[10px] block mb-1.5 uppercase tracking-widest text-clay-muted">Breed</label>
            <input
              id="cat-breed"
              value={form.breed}
              onChange={e => set('breed', e.target.value)}
              placeholder="e.g. Persian, Siamese, Mixed"
              className={inputCls}
              style={inputStyle}
              onFocus={focusIn} onBlur={focusOut}
            />
          </div>

          {/* Age + Weight row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="t-mono text-[10px] block mb-1.5 uppercase tracking-widest text-clay-muted">Age (months)</label>
              <input
                id="cat-age"
                type="number"
                min="0"
                max="300"
                value={form.age_months}
                onChange={e => set('age_months', e.target.value)}
                placeholder="e.g. 24"
                className={inputCls}
                style={inputStyle}
                onFocus={focusIn} onBlur={focusOut}
              />
            </div>
            <div>
              <label className="t-mono text-[10px] block mb-1.5 uppercase tracking-widest text-clay-muted">Weight (kg)</label>
              <input
                id="cat-weight"
                type="number"
                step="0.1"
                min="0"
                value={form.weight_kg}
                onChange={e => set('weight_kg', e.target.value)}
                placeholder="e.g. 4.2"
                className={inputCls}
                style={inputStyle}
                onFocus={focusIn} onBlur={focusOut}
              />
            </div>
          </div>

          {/* Color + Gender row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="t-mono text-[10px] block mb-1.5 uppercase tracking-widest text-clay-muted">Color / Markings</label>
              <input
                id="cat-color"
                value={form.color}
                onChange={e => set('color', e.target.value)}
                placeholder="e.g. White & grey"
                className={inputCls}
                style={inputStyle}
                onFocus={focusIn} onBlur={focusOut}
              />
            </div>
            <div>
              <label className="t-mono text-[10px] block mb-1.5 uppercase tracking-widest text-clay-muted">Gender</label>
              <select
                id="cat-gender"
                value={form.gender}
                onChange={e => set('gender', e.target.value)}
                className={inputCls}
                style={{ ...inputStyle, cursor: 'pointer' }}
                onFocus={focusIn} onBlur={focusOut}
              >
                {GENDERS.map(g => <option key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</option>)}
              </select>
            </div>
          </div>

          {/* Microchip ID */}
          <div>
            <label className="t-mono text-[10px] block mb-1.5 uppercase tracking-widest text-clay-muted">Microchip ID</label>
            <input
              id="cat-microchip"
              value={form.microchip_id}
              onChange={e => set('microchip_id', e.target.value)}
              placeholder="Optional — 15-digit ISO chip number"
              className={inputCls}
              style={inputStyle}
              onFocus={focusIn} onBlur={focusOut}
            />
          </div>

          {/* Neutered toggle */}
          <div
            className="flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer"
            style={{ background: 'rgba(94,71,73,.08)', border: '1px solid rgba(94,71,73,.2)' }}
            onClick={() => set('is_neutered', !form.is_neutered)}
          >
            <div>
              <div className="font-semibold text-[14px] text-espresso">Spayed / Neutered</div>
              <div className="text-[11px] text-clay-muted">Has your cat been spayed or neutered?</div>
            </div>
            <div
              className="w-11 h-6 rounded-full relative transition-all flex-shrink-0"
              style={{ background: form.is_neutered ? '#5e4749' : '#b8ceb5' }}
            >
              <div
                className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all"
                style={{ left: form.is_neutered ? 'calc(100% - 22px)' : '2px' }}
              />
            </div>
          </div>

          {/* Error */}
          {err && (
            <div
              className="px-4 py-3 rounded-xl text-[13px]"
              style={{ background: 'rgba(220,80,80,.08)', border: '1px solid rgba(220,80,80,.2)', color: '#C0392B' }}
            >
              {err}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            id="cat-form-submit"
            disabled={saving}
            className="w-full py-3.5 rounded-xl font-bold text-[14px] tracking-wide transition-all"
            style={{
              background: saving ? 'rgba(85,107,47,.5)' : 'linear-gradient(135deg,#5e4749,#4a373a)',
              color: '#fff',
              border: 'none',
              cursor: saving ? 'not-allowed' : 'pointer',
              boxShadow: saving ? 'none' : '0 4px 20px rgba(85,107,47,.3)',
            }}
          >
            {saving ? '⏳ Saving…' : editing ? '✓ Save Changes' : '🐱 Add Cat'}
          </button>
        </form>
      </div>
    </>
  )
}

// ─── Cat card ───────────────────────────────────────────────
function CatCard({ cat, onEdit, onDelete }) {
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!window.confirm(`Remove ${cat.name} from your profile?`)) return
    setDeleting(true)
    await supabase.from('cats').delete().eq('id', cat.id)
    onDelete(cat.id)
  }

  const genderIcon  = cat.gender === 'female' ? '♀' : '♂'
  const genderColor = cat.gender === 'female' ? '#C47F6A' : '#5e4749'

  return (
    <GlassCard className="p-5 flex flex-col group">
      {/* Photo */}
      <div
        className="w-full h-40 rounded-2xl mb-4 flex items-center justify-center overflow-hidden flex-shrink-0"
        style={{ background: 'linear-gradient(135deg,rgba(94,71,73,.12),rgba(196,140,56,.08))' }}
      >
        {cat.photo_url
          ? <img src={cat.photo_url} alt={cat.name} className="w-full h-full object-cover" />
          : <span className="text-6xl">🐱</span>
        }
      </div>

      {/* Name + gender */}
      <div className="flex items-center gap-2 mb-1">
        <div className="font-display font-bold text-[16px] text-espresso flex-1 truncate">{cat.name}</div>
        <span className="font-bold text-[15px]" style={{ color: genderColor }}>{genderIcon}</span>
      </div>

      {/* Breed */}
      {cat.breed && (
        <div className="t-mono text-[10px] text-olive mb-3">{cat.breed}</div>
      )}

      {/* Pills row */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {cat.age_months != null && (
          <Pill variant="clay"><span className="text-[9px]">⏱ {fmtAge(cat.age_months)}</span></Pill>
        )}
        {cat.weight_kg != null && (
          <Pill variant="green"><span className="text-[9px]">⚖ {cat.weight_kg} kg</span></Pill>
        )}
        {cat.is_neutered && (
          <Pill variant="amber"><span className="text-[9px]">✂ Neutered</span></Pill>
        )}
        {cat.color && (
          <Pill variant="clay"><span className="text-[9px]">🎨 {cat.color}</span></Pill>
        )}
      </div>

      {/* Microchip */}
      {cat.microchip_id && (
        <div className="text-[11px] text-clay-muted mb-4 font-mono truncate">
          📡 {cat.microchip_id}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-auto">
        <button
          onClick={() => onEdit(cat)}
          className="flex-1 py-2 rounded-xl text-[12px] font-bold transition-all"
          style={{ background: 'rgba(85,107,47,.1)', color: '#5e4749', border: '1px solid rgba(85,107,47,.25)' }}
        >
          Edit
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="flex-1 py-2 rounded-xl text-[12px] font-bold transition-all"
          style={{ background: 'rgba(220,80,80,.08)', color: '#C0392B', border: '1px solid rgba(220,80,80,.2)' }}
        >
          {deleting ? '…' : 'Remove'}
        </button>
      </div>
    </GlassCard>
  )
}

// ─── Main page ───────────────────────────────────────────────
export default function MyCatsPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const headerRef = useFadeUp(0)

  const [cats,    setCats]    = useState([])
  const [loading, setLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing,    setEditing]    = useState(null)

  const displayName = user?.full_name ?? user?.email ?? 'Cat Parent'

  // Load cats
  function loadCats() {
    if (!user?.id) { setLoading(false); return }
    supabase
      .from('cats')
      .select('*')
      .eq('owner_id', user.id)
      .order('registered_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) setCats(data)
        setLoading(false)
      })
  }
  useEffect(() => { loadCats() }, [user?.id])

  // Reload cats when Supabase session is restored (after page refresh)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => { if (session && user?.id) loadCats() }
    )
    return () => subscription.unsubscribe()
  }, [user?.id])

  function openAdd()          { setEditing(null); setDrawerOpen(true) }
  function openEdit(cat)      { setEditing(cat);  setDrawerOpen(true) }
  function closeDrawer()      { setDrawerOpen(false) }

  function handleSaved() { loadCats() }

  function handleDelete(id) {
    setCats(prev => prev.filter(c => c.id !== id))
  }

  return (
    <div className="min-h-screen">

      {/* ── Main ── */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-10">

        {/* Header row */}
        <div ref={headerRef} className="fade-up flex items-end justify-between flex-wrap gap-4 mb-8">
          <div>
            <Badge className="mb-3">My Cats</Badge>
            <h1 className="font-display font-black text-espresso tracking-tight mb-2"
                style={{ fontSize: 'clamp(1.8rem,3vw,2.6rem)' }}>
              Your fur family 🐾
            </h1>
            <p className="text-clay-muted text-[15px]">
              {loading
                ? 'Loading your cats…'
                : cats.length === 0
                  ? 'You haven\'t added any cats yet. Add one below!'
                  : `${cats.length} cat${cats.length !== 1 ? 's' : ''} in your family`
              }
            </p>
          </div>
          <BtnOlive onClick={openAdd}>+ Add a Cat</BtnOlive>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1,2,3].map(i => (
              <div key={i} className="card p-5 animate-pulse">
                <div className="w-full h-40 rounded-2xl bg-clay mb-4" />
                <div className="h-4 bg-clay rounded w-3/4 mb-2" />
                <div className="h-3 bg-clay rounded w-1/2" />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && cats.length === 0 && (
          <div>
            <Card className="py-20 text-center max-w-md mx-auto">
              <div className="text-7xl mb-4">🐱</div>
              <div className="font-display font-bold text-[1.2rem] text-espresso mb-2">No cats yet</div>
              <p className="text-clay-muted text-[14px] mb-6 leading-relaxed">
                Add your cat's profile to keep their health records, book vet appointments,
                and get personalised AI health advice.
              </p>
              <BtnOlive onClick={openAdd}>🐾 Add your first cat</BtnOlive>
            </Card>
          </div>
        )}

        {/* Cats grid */}
        {!loading && cats.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {cats.map(cat => (
              <CatCard
                key={cat.id}
                cat={cat}
                onEdit={openEdit}
                onDelete={handleDelete}
              />
            ))}

            {/* "Add another" card */}
            <button
              onClick={openAdd}
              className="card p-5 border-2 border-dashed flex flex-col items-center justify-center text-center transition-all cursor-pointer group min-h-[220px]"
              style={{ borderColor: 'rgba(94,71,73,.35)', background: 'rgba(94,71,73,.04)' }}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-3 transition-transform group-hover:scale-110"
                style={{ background: 'rgba(94,71,73,.12)' }}
              >
                ➕
              </div>
              <div className="font-bold text-[14px] text-olive">Add another cat</div>
              <div className="text-[11px] text-clay-muted mt-1">Keep all your fur family in one place</div>
            </button>
          </div>
        )}
      </main>

      {/* Drawer */}
      <CatDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        onSaved={handleSaved}
        editing={editing}
      />
    </div>
  )
}
