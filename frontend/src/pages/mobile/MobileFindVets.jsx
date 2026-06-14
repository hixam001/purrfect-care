import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import MobileLayout from '../../layouts/MobileLayout'
import { supabase } from '../../lib/supabaseClient'

function StarRow({ rating, total }) {
  const r = parseFloat(rating) || 0
  const stars = Math.round(r)
  return (
    <span style={{ fontSize: 11, color: '#B87C2A', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
      {'★'.repeat(stars)}{'☆'.repeat(5 - stars)}
      {total > 0 && <span style={{ color: '#7a5e60', marginLeft: 3 }}>({total})</span>}
    </span>
  )
}

export default function MobileFindVets() {
  const navigate     = useNavigate()
  const [query,      setQuery]      = useState('')
  const [hospitals,  setHospitals]  = useState([])
  const [loading,    setLoading]    = useState(true)

  const load = useCallback(async (q = '') => {
    setLoading(true)
    let req = supabase
      .from('hospitals')
      .select('id,name,city,address,phone,rating,total_reviews,is_active,is_approved')
      .eq('is_active',   true)
      .eq('is_approved', true)
    if (q) req = req.ilike('name', `%${q}%`)
    const { data } = await req.order('name')
    if (data) setHospitals(data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  let debounce
  function handleSearch(e) {
    const v = e.target.value; setQuery(v)
    clearTimeout(debounce); debounce = setTimeout(() => load(v.trim()), 350)
  }

  return (
    <MobileLayout title="Hospitals">
      {/* Search */}
      <div style={{ position: 'sticky', top: 0, zIndex: 30, background: '#fff', borderBottom: '1px solid #b8ceb5', padding: '12px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#eef4ec', border: '1.5px solid #b8ceb5', borderRadius: 16, padding: '8px 14px' }}>
          <span style={{ fontSize: 14 }}>🔍</span>
          <input
            value={query} onChange={handleSearch}
            placeholder="Search clinic name or city…"
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 13, color: '#3a2c2d' }}
          />
          {query && (
            <button onClick={() => { setQuery(''); load('') }} style={{ background: 'none', border: 'none', color: '#7a5e60', cursor: 'pointer', fontSize: 14 }}>✕</button>
          )}
        </div>
        <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 11, color: '#7a5e60', marginTop: 6 }}>
          {loading ? 'Searching…' : `${hospitals.length} approved hospital${hospitals.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      {/* List */}
      <div style={{ padding: '14px 16px 100px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading ? (
          <div style={{ textAlign: 'center', paddingTop: 60, fontSize: 40 }}>🏥</div>
        ) : hospitals.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🔍</div>
            <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 600, fontSize: 14, color: '#7a5e60' }}>
              {query ? `No hospitals found for "${query}"` : 'No hospitals available'}
            </p>
            <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 12, color: '#7a5e60', marginTop: 4 }}>
              Hospitals appear here after admin approval
            </p>
          </div>
        ) : hospitals.map(h => (
          <button
            key={h.id}
            onClick={() => navigate(`/hospital/${h.id}`)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 12,
              padding: '14px 16px', borderRadius: 18, textAlign: 'left',
              background: '#fff', border: '1px solid #b8ceb5',
              boxShadow: '0 2px 8px rgba(45,27,14,.06)', cursor: 'pointer',
            }}
          >
            <div style={{
              width: 48, height: 48, borderRadius: 14, flexShrink: 0,
              background: 'rgba(59,130,246,.09)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24,
            }}>🏥</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, fontSize: 14, color: '#3a2c2d', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {h.name}
              </p>
              <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 11, color: '#7a5e60', marginBottom: 3 }}>
                📍 {[h.city, h.address].filter(Boolean).join(', ')}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {(h.rating > 0 || h.total_reviews > 0) && <StarRow rating={h.rating} total={h.total_reviews} />}
                {h.phone && (
                  <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 11, color: '#7a5e60' }}>📞 {h.phone}</span>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
              <span style={{
                fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 10, fontWeight: 700,
                padding: '2px 8px', borderRadius: 99,
                background: 'rgba(94,71,73,.09)', color: '#4a373a', border: '1px solid rgba(94,71,73,.18)',
              }}>✓ Approved</span>
              <span style={{ color: '#b8ceb5', fontSize: 20 }}>›</span>
            </div>
          </button>
        ))}
      </div>
    </MobileLayout>
  )
}
