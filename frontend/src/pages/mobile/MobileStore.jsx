import { useEffect, useState } from 'react'
import MobileLayout from '../../layouts/MobileLayout'
import { supabase } from '../../lib/supabaseClient'

const CATEGORIES = ['All','Food','Treats','Toys','Grooming','Health','Accessories']

function ProductCard({ item }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ backgroundColor:'#ffffff', border:'1px solid #b8ceb5', boxShadow:'0 2px 8px rgba(45,27,14,0.06)' }}>
      <div className="relative h-32 flex items-center justify-center" style={{ backgroundColor:'#eef4ec' }}>
        {item.image_url
          ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
          : <span className="text-4xl">🐾</span>
        }
        {item.is_featured && (
          <span className="absolute top-2 right-2 text-[9px] font-bold px-2 py-0.5 rounded-full text-white"
            style={{ backgroundColor:'#B87C2A', fontFamily:'Plus Jakarta Sans, sans-serif' }}>Featured</span>
        )}
      </div>
      <div className="p-3 space-y-1">
        <p className="font-bold text-sm leading-tight line-clamp-2" style={{ color:'#3a2c2d', fontFamily:'Plus Jakarta Sans, sans-serif' }}>{item.name}</p>
        {item.brand && <p className="text-xs" style={{ color:'#7a5e60', fontFamily:'Plus Jakarta Sans, sans-serif' }}>{item.brand}</p>}
        <div className="flex items-center justify-between">
          <span className="font-bold text-sm" style={{ color:'#5e4749', fontFamily:'Plus Jakarta Sans, sans-serif' }}>
            Rs {parseFloat(item.price).toLocaleString()}
          </span>
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${item.stock_quantity>0?'':'opacity-70'}`}
            style={{ backgroundColor:item.stock_quantity>0?'rgba(94,71,73,0.09)':'rgba(184,56,56,0.09)', color:item.stock_quantity>0?'#4a373a':'#7D1F1F', border:`1px solid ${item.stock_quantity>0?'rgba(94,71,73,0.18)':'rgba(184,56,56,0.22)'}`, fontFamily:'Plus Jakarta Sans, sans-serif' }}>
            {item.stock_quantity>0?'In stock':'Out of stock'}
          </span>
        </div>
      </div>
    </div>
  )
}

export default function MobileStore() {
  const [products,  setProducts]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [category,  setCategory]  = useState('All')
  const [query,     setQuery]     = useState('')

  async function load(cat, q) {
    setLoading(true)
    let req = supabase.from('products').select('id,name,price,category,brand,image_url,is_featured,stock_quantity').eq('is_active',true)
    if (cat && cat!=='All') req = req.eq('category', cat)
    if (q) req = req.ilike('name', `%${q}%`)
    const { data } = await req.order('is_featured',{ascending:false}).order('name')
    if (data) setProducts(data)
    setLoading(false)
  }

  useEffect(()=>{ load(category, query) },[category])

  let timer
  function handleSearch(e) {
    const v = e.target.value; setQuery(v)
    clearTimeout(timer); timer = setTimeout(()=>load(category,v.trim()),350)
  }

  return (
    <MobileLayout title="Cat Store">
      {/* Sticky search + filter */}
      <div className="sticky top-0 z-30 space-y-2 px-4 py-3"
        style={{ backgroundColor:'#ffffff', borderBottom:'1px solid #b8ceb5' }}>
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl"
          style={{ backgroundColor:'#eef4ec', border:'1.5px solid #b8ceb5' }}>
          <span className="text-base">🔍</span>
          <input className="flex-1 text-sm bg-transparent outline-none"
            style={{ color:'#3a2c2d', fontFamily:'Plus Jakarta Sans, sans-serif' }}
            placeholder="Search products…" value={query} onChange={handleSearch} />
          {query && <button onClick={()=>{ setQuery(''); load(category,'') }} style={{ color:'#7a5e60' }}>✕ Close</button>}
        </div>
        {/* Category chips */}
        <div className="flex gap-2 overflow-x-auto pb-0.5 -mx-4 px-4">
          {CATEGORIES.map(c => (
            <button key={c} onClick={()=>setCategory(c)}
              className="flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full transition-all"
              style={{ backgroundColor:category===c?'#5e4749':'#ffffff', color:category===c?'#ffffff':'#7a5e60', border:'1px solid', borderColor:category===c?'#5e4749':'#b8ceb5', fontFamily:'Plus Jakarta Sans, sans-serif' }}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="p-4">
        {loading ? (
          <div className="text-center py-16 text-4xl animate-pulse">🛍</div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 space-y-2">
            <div className="text-5xl">🛍</div>
            <p className="font-semibold" style={{ color:'#7a5e60', fontFamily:'Plus Jakarta Sans, sans-serif' }}>No products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {products.map(p => <ProductCard key={p.id} item={p} />)}
          </div>
        )}
      </div>
    </MobileLayout>
  )
}
