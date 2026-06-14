import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MobileLayout from '../../layouts/MobileLayout'
import { supabase } from '../../lib/supabaseClient'

export default function MobileFindVets() {
  const navigate   = useNavigate()
  const [query,     setQuery]     = useState('')
  const [hospitals, setHospitals] = useState([])
  const [loading,   setLoading]   = useState(true)

  async function load(q='') {
    setLoading(true)
    let req = supabase.from('hospitals').select('id,name,city,address,phone,status').eq('status','verified')
    if (q) req = req.ilike('name', `%${q}%`)
    const { data } = await req.order('name')
    if (data) setHospitals(data)
    setLoading(false)
  }

  useEffect(()=>{ load() },[])

  let debounceTimer
  function handleSearch(e) {
    const v = e.target.value
    setQuery(v)
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(()=>load(v.trim()), 350)
  }

  return (
    <MobileLayout title="Find Vets">
      {/* Search */}
      <div className="sticky top-0 z-30 px-4 py-3" style={{ backgroundColor:'#ffffff', borderBottom:'1px solid #b8ceb5' }}>
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl"
          style={{ backgroundColor:'#eef4ec', border:'1.5px solid #b8ceb5' }}>
          <span className="text-base">🔍</span>
          <input
            className="flex-1 text-sm bg-transparent outline-none"
            style={{ color:'#3a2c2d', fontFamily:'Plus Jakarta Sans, sans-serif' }}
            placeholder="Search clinic or city…"
            value={query}
            onChange={handleSearch}
          />
          {query && (
            <button onClick={()=>{ setQuery(''); load('') }} className="text-sm" style={{ color:'#7a5e60' }}>✕ Close</button>
          )}
        </div>
        <p className="text-xs mt-2" style={{ color:'#7a5e60', fontFamily:'Plus Jakarta Sans, sans-serif' }}>
          {loading ? 'Searching…' : `${hospitals.length} verified clinic${hospitals.length!==1?'s':''}`}
        </p>
      </div>

      <div className="p-4 space-y-3">
        {loading ? (
          <div className="text-center py-16 text-4xl animate-pulse">🏥</div>
        ) : hospitals.length === 0 ? (
          <div className="text-center py-16 space-y-2">
            <div className="text-5xl">🔍</div>
            <p className="font-semibold" style={{ color:'#7a5e60', fontFamily:'Plus Jakarta Sans, sans-serif' }}>
              {query ? `No clinics found for "${query}"` : 'No clinics found'}
            </p>
          </div>
        ) : hospitals.map(h => (
          <button key={h.id} onClick={()=>navigate(`/hospital/${h.id}`)}
            className="w-full flex items-center gap-3 p-4 rounded-2xl text-left transition-all active:scale-[0.98]"
            style={{ backgroundColor:'#ffffff', border:'1px solid #b8ceb5', boxShadow:'0 2px 8px rgba(45,27,14,0.06)' }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{ backgroundColor:'rgba(59,130,246,0.09)' }}>🏥</div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm truncate" style={{ color:'#3a2c2d', fontFamily:'Plus Jakarta Sans, sans-serif' }}>{h.name}</p>
              <p className="text-xs mt-0.5" style={{ color:'#7a5e60', fontFamily:'Plus Jakarta Sans, sans-serif' }}>📍 {h.city}{h.address?`, ${h.address}`:''}</p>
              {h.phone && <p className="text-xs" style={{ color:'#7a5e60', fontFamily:'Plus Jakarta Sans, sans-serif' }}>📞 {h.phone}</p>}
            </div>
            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ backgroundColor:'rgba(94,71,73,0.09)', color:'#4a373a', border:'1px solid rgba(94,71,73,0.18)', fontFamily:'Plus Jakarta Sans, sans-serif' }}>
                ✓ Verified
              </span>
              <span style={{ color:'#b8ceb5', fontSize:18 }}>›</span>
            </div>
          </button>
        ))}
      </div>
    </MobileLayout>
  )
}
