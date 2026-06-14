import { useState, useEffect } from 'react'
import { useParams, Link }     from 'react-router-dom'
import { supabase }            from '../lib/supabaseClient.js'
import { useFadeUp }           from '../hooks/useScrollReveal.js'
import { Badge, BtnOlive, Pill, GlassCard, Card } from '../components/ui/index.jsx'

export default function StoreDetailPage() {
  const { storeId } = useParams()
  const headerRef   = useFadeUp(0)
  const gridRef     = useFadeUp(0.1)

  const [store,     setStore]     = useState(null)
  const [products,  setProducts]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [catFilter, setCatFilter] = useState('All')
  const [cart,      setCart]      = useState([])
  const [cartOpen,  setCartOpen]  = useState(false)

  useEffect(() => {
    async function load() {
      const [{ data: s }, { data: p }] = await Promise.all([
        supabase.from('cat_stores').select('*').eq('id', storeId).single(),
        supabase.from('products')
          .select(`
            id, name, description, price, discount_price, images,
            stock_quantity, brand, unit, rating, total_reviews, is_active,
            product_categories ( name )
          `)
          .eq('store_id', storeId)
          .eq('is_active', true),
      ])
      setStore(s)
      setProducts(p ?? [])
      setLoading(false)
    }
    load()
  }, [storeId])

  function addToCart(p) {
    setCart(c => {
      const ex = c.find(x => x.id === p.id)
      if (ex) return c.map(x => x.id === p.id ? { ...x, qty: x.qty + 1 } : x)
      return [...c, { ...p, qty: 1 }]
    })
  }

  const totalItems = cart.reduce((s, x) => s + x.qty, 0)
  const totalPrice = cart.reduce((s, x) => s + (x.discount_price ?? x.price) * x.qty, 0)

  const categories = ['All', ...new Set(products.map(p => p.product_categories?.name).filter(Boolean))]

  const filtered = products.filter(p => {
    const q = search.toLowerCase()
    const matchSearch = p.name?.toLowerCase().includes(q)
    const matchCat    = catFilter === 'All' || p.product_categories?.name === catFilter
    return matchSearch && matchCat
  })

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 py-16 text-center">
      <div className="text-clay-muted">Loading store…</div>
    </div>
  )

  if (!store) return (
    <div className="max-w-7xl mx-auto px-4 py-16 text-center">
      <div className="text-4xl mb-3">🏪</div>
      <div className="font-bold text-espresso mb-2">Store not found</div>
      <Link to="/store"><BtnOlive>← Back to Stores</BtnOlive></Link>
    </div>
  )

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 py-16">

      {/* Cart sidebar */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex" onClick={() => setCartOpen(false)}>
          <div className="flex-1" />
          <div className="w-full max-w-sm h-full flex flex-col overflow-hidden"
               style={{ background:'#F5EBE6', borderLeft:'1px solid #D7C9BD' }}
               onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 flex items-center justify-between" style={{ borderBottom:'1px solid #D7C9BD' }}>
              <h2 className="font-display font-black text-[1.1rem] text-espresso">Cart ({totalItems})</h2>
              <button onClick={() => setCartOpen(false)} className="text-clay-muted text-xl">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3">
              {cart.length === 0
                ? <div className="text-center py-12 text-clay-muted">Your cart is empty</div>
                : cart.map(item => (
                  <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl"
                       style={{ background:'rgba(255,255,255,.7)', border:'1px solid #D7C9BD' }}>
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl flex-shrink-0"
                         style={{ background:'rgba(107,142,35,.08)' }}>📦</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-[13px] text-espresso truncate">{item.name}</div>
                      <div className="text-[11px] text-clay-muted">
                        ₨ {(item.discount_price ?? item.price).toLocaleString()} × {item.qty}
                      </div>
                    </div>
                    <button onClick={() => setCart(c => c.filter(x => x.id !== item.id))}
                            className="text-clay-muted hover:text-espresso text-lg">✕</button>
                  </div>
                ))
              }
            </div>
            {cart.length > 0 && (
              <div className="p-5 border-t" style={{ borderColor:'#D7C9BD' }}>
                <div className="flex justify-between font-bold text-[15px] text-espresso mb-4">
                  <span>Total</span>
                  <span>₨ {totalPrice.toLocaleString()}</span>
                </div>
                {store.delivery_fee > 0 && (
                  <div className="text-[11px] text-clay-muted mb-3">
                    + ₨ {store.delivery_fee} delivery fee
                  </div>
                )}
                <button className="btn btn-olive w-full justify-center !py-3">
                  Proceed to Checkout →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Back */}
      <Link to="/store" className="flex items-center gap-2 no-underline mb-8 text-clay-muted hover:text-olive text-[13px] w-fit">
        ← Back to Stores
      </Link>

      {/* Store header */}
      <div ref={headerRef} className="fade-up flex flex-wrap items-start justify-between gap-4 mb-8">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl flex-shrink-0"
               style={{ background:'linear-gradient(135deg,rgba(196,140,56,.18),rgba(196,140,56,.08))' }}>
            🏪
          </div>
          <div>
            <Badge className="mb-2">Cat Store</Badge>
            <h1 className="font-display font-black text-espresso tracking-tight"
                style={{ fontSize:'clamp(1.5rem,3vw,2rem)' }}>
              {store.name}
            </h1>
            <p className="text-clay-muted text-[13px] mt-1">
              📍 {store.address}{store.city ? `, ${store.city}` : ''}
              {store.delivery_fee === 0
                ? ' · 🚚 Free delivery'
                : store.delivery_fee > 0 ? ` · 🚚 ₨ ${store.delivery_fee} delivery` : ''}
            </p>
          </div>
        </div>

        <button className="btn btn-olive relative" onClick={() => setCartOpen(true)}>
          🛒 Cart
          {totalItems > 0 && (
            <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center"
                  style={{ background:'#C48C38' }}>
              {totalItems}
            </span>
          )}
        </button>
      </div>

      {/* Filters */}
      <div ref={gridRef} className="fade-up">
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl min-w-[200px]"
               style={{ background:'rgba(255,255,255,.8)', border:'1.5px solid #D7C9BD' }}>
            <span>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)}
                   placeholder="Search products…"
                   className="bg-transparent outline-none text-[14px] text-espresso flex-1" />
          </div>
          {categories.map(c => (
            <button key={c} onClick={() => setCatFilter(c)}
                    className="pill transition-all"
                    style={{
                      background: catFilter===c ? '#556B2F' : 'rgba(255,255,255,.7)',
                      color:      catFilter===c ? '#fff'    : '#4E342E',
                      border:     catFilter===c ? 'none'    : '1px solid #D7C9BD',
                    }}>
              {c}
            </button>
          ))}
        </div>

        {/* Products grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-3">🛒</div>
            <div className="font-bold text-espresso">
              {products.length === 0 ? 'No products yet' : 'No products found'}
            </div>
            <div className="text-clay-muted text-[13px] mt-1">
              {products.length === 0 ? 'This store hasn\'t added products yet.' : 'Try a different search.'}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map(p => {
              const finalPrice = p.discount_price ?? p.price
              const hasDiscount = p.discount_price && p.discount_price < p.price
              const imgSrc = p.images?.[0] ?? null
              const stars = Math.round(p.rating ?? 0)

              return (
                <GlassCard key={p.id} className="p-4 flex flex-col group cursor-pointer">
                  {/* Image */}
                  <div className="w-full h-[130px] rounded-2xl overflow-hidden mb-3 flex items-center justify-center"
                       style={{ background:'linear-gradient(135deg,rgba(107,142,35,.07),rgba(107,142,35,.03))' }}>
                    {imgSrc
                      ? <img src={imgSrc} alt={p.name} className="w-full h-full object-contain p-3 transition-transform duration-300 group-hover:scale-105" />
                      : <span className="text-5xl">📦</span>
                    }
                  </div>

                  {p.product_categories?.name && (
                    <Pill variant="clay" className="mb-1.5">
                      <span style={{ fontSize:9 }}>{p.product_categories.name}</span>
                    </Pill>
                  )}

                  <div className="font-bold text-[13px] text-espresso mt-1 mb-1 flex-1">{p.name}</div>
                  {p.brand && <div className="text-[11px] text-clay-muted mb-1">{p.brand}{p.unit ? ` · ${p.unit}` : ''}</div>}

                  {p.total_reviews > 0 && (
                    <div className="flex items-center gap-1 mb-2">
                      <span className="text-amber-500 text-[10px]">{'★'.repeat(stars)}{'☆'.repeat(5-stars)}</span>
                      <span className="text-[9px] text-clay-muted">({p.total_reviews})</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-auto">
                    <div>
                      <span className="font-black text-[15px] text-espresso">₨ {finalPrice.toLocaleString()}</span>
                      {hasDiscount && (
                        <span className="text-[11px] text-clay-muted line-through ml-1">₨ {p.price.toLocaleString()}</span>
                      )}
                    </div>
                    <button onClick={() => addToCart(p)}
                            disabled={p.stock_quantity === 0}
                            className="btn btn-olive !py-1.5 !px-3 !text-[10px]"
                            style={{ opacity: p.stock_quantity === 0 ? .4 : 1 }}>
                      {p.stock_quantity === 0 ? 'Out' : 'Add'}
                    </button>
                  </div>
                </GlassCard>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
