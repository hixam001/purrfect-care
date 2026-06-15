import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import MobileLayout from '../../layouts/MobileLayout'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'

// ─── helpers ───
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

// ─── Store list card ───
function StoreCard({ st, onClick }) {
  const fee = parseFloat(st.delivery_fee) || 0
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 16px', borderRadius: 18, textAlign: 'left',
        background: '#fff', border: '1px solid #b8ceb5',
        boxShadow: '0 2px 8px rgba(45,27,14,.06)', cursor: 'pointer',
      }}
    >
      <div style={{
        width: 48, height: 48, borderRadius: 14, flexShrink: 0,
        background: 'rgba(184,124,42,.10)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 24,
      }}>🏪</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, fontSize: 14, color: '#3a2c2d', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {st.name}
        </p>
        {st.city && (
          <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 11, color: '#7a5e60', marginBottom: 2 }}>
            📍 {[st.city, st.address].filter(Boolean).join(', ')}
          </p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {(st.rating > 0 || st.total_reviews > 0) && <StarRow rating={st.rating} total={st.total_reviews} />}
          <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 11, color: '#7a5e60' }}>
            🚴 {fee === 0 ? 'Free delivery' : `Rs ${fee.toFixed(0)} delivery`}
          </span>
        </div>
      </div>
      <span style={{ color: '#b8ceb5', fontSize: 20, flexShrink: 0 }}>›</span>
    </button>
  )
}

// ─── Product card ───
function ProductCard({ p, qty, onAdd, onRemove }) {
  const price = parseFloat(p.discount_price ?? p.price)
  const orig  = p.discount_price ? parseFloat(p.price) : null
  const img   = p.images?.[0]
  const inStock = (p.stock_quantity ?? 1) > 0

  return (
    <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #b8ceb5', overflow: 'hidden', boxShadow: '0 2px 8px rgba(45,27,14,.06)' }}>
      <div style={{ height: 120, background: '#eef4ec', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        {img
          ? <img src={img} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ fontSize: 36 }}>🐾</span>
        }
        {p.discount_price && (
          <span style={{ position: 'absolute', top: 6, left: 6, background: '#b83838', color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 99, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>SALE</span>
        )}
      </div>
      <div style={{ padding: '8px 10px 10px' }}>
        <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, fontSize: 12, color: '#3a2c2d', marginBottom: 2, lineHeight: 1.3 }}>{p.name}</p>
        {p.brand && <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 10, color: '#7a5e60', marginBottom: 3 }}>{p.brand}</p>}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
          <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, fontSize: 13, color: '#5e4749' }}>Rs {price.toLocaleString()}</span>
          {orig && <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 10, color: '#7a5e60', textDecoration: 'line-through' }}>Rs {orig.toLocaleString()}</span>}
        </div>
        {!inStock ? (
          <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 10, color: '#7D1F1F', background: 'rgba(184,56,56,.09)', border: '1px solid rgba(184,56,56,.22)', borderRadius: 99, padding: '2px 8px' }}>Out of stock</span>
        ) : qty > 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(94,71,73,.07)', borderRadius: 10, padding: '3px 6px' }}>
            <button onClick={onRemove} style={{ width: 24, height: 24, borderRadius: 8, background: '#fff', border: '1px solid #b8ceb5', fontWeight: 800, color: '#5e4749', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>−</button>
            <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, fontSize: 14, color: '#5e4749', minWidth: 22, textAlign: 'center' }}>{qty}</span>
            <button onClick={onAdd} style={{ width: 24, height: 24, borderRadius: 8, background: '#5e4749', border: 'none', fontWeight: 800, color: '#fff', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>+</button>
          </div>
        ) : (
          <button onClick={onAdd} style={{ width: '100%', background: '#5e4749', color: '#fff', border: 'none', borderRadius: 10, padding: '6px 0', fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
            + Add
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Cart sheet ───
function CartSheet({ cart, store, onClose, onAdd, onRemove, onPlace, placing }) {
  const subtotal = cart.reduce((s, x) => s + parseFloat(x.discount_price ?? x.price) * x.qty, 0)
  const fee = parseFloat(store?.delivery_fee ?? 0)
  const total = subtotal + fee

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,.45)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: '20px 20px 36px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: '#b8ceb5', margin: '0 auto 16px' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, fontSize: 17, color: '#3a2c2d' }}>Your Cart</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, color: '#7a5e60', cursor: 'pointer', lineHeight: 1 }}>✕</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', marginBottom: 14 }}>
          {cart.map(item => {
            const lp = parseFloat(item.discount_price ?? item.price) * item.qty
            return (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 12, marginBottom: 12, borderBottom: '1px solid #eef4ec' }}>
                <span style={{ flex: 1, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 600, fontSize: 13, color: '#3a2c2d', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button onClick={() => onRemove(item)} style={{ width: 22, height: 22, borderRadius: 6, background: 'rgba(94,71,73,.09)', border: '1px solid #b8ceb5', color: '#5e4749', fontWeight: 800, cursor: 'pointer', fontSize: 14, lineHeight: 1 }}>−</button>
                  <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, fontSize: 13, color: '#5e4749', minWidth: 18, textAlign: 'center' }}>{item.qty}</span>
                  <button onClick={() => onAdd(item)} style={{ width: 22, height: 22, borderRadius: 6, background: '#5e4749', border: 'none', color: '#fff', fontWeight: 800, cursor: 'pointer', fontSize: 14, lineHeight: 1 }}>+</button>
                </div>
                <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, fontSize: 13, color: '#3a2c2d', minWidth: 64, textAlign: 'right' }}>Rs {lp.toLocaleString()}</span>
              </div>
            )
          })}
        </div>
        <div style={{ borderTop: '1px solid #b8ceb5', paddingTop: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 13, color: '#7a5e60' }}>Subtotal</span>
            <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 13, color: '#3a2c2d' }}>Rs {subtotal.toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 13, color: '#7a5e60' }}>Delivery</span>
            <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 13, color: fee === 0 ? '#5e8c5a' : '#3a2c2d' }}>{fee === 0 ? 'Free' : `Rs ${fee.toFixed(0)}`}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, fontSize: 15, color: '#3a2c2d' }}>Total</span>
            <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, fontSize: 15, color: '#3a2c2d' }}>Rs {total.toLocaleString()}</span>
          </div>
          <button onClick={onPlace} disabled={placing} style={{ width: '100%', background: placing ? '#a08080' : '#5e4749', color: '#fff', border: 'none', borderRadius: 14, padding: '14px 0', fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, fontSize: 15, cursor: placing ? 'not-allowed' : 'pointer' }}>
            {placing ? 'Placing order…' : 'Place Order'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Store detail view ───
function StoreDetailView({ storeId, storeName, onBack }) {
  const { user } = useAuth()
  const [store,    setStore]    = useState(null)
  const [products, setProducts] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [query,    setQuery]    = useState('')
  const [cart,     setCart]     = useState([])
  const [cartOpen, setCartOpen] = useState(false)
  const [placing,  setPlacing]  = useState(false)
  const [success,  setSuccess]  = useState(null)

  useEffect(() => {
    async function load() {
      const [{ data: s }, { data: p }] = await Promise.all([
        supabase.from('cat_stores').select('*').eq('id', storeId).single(),
        supabase.from('products')
          .select('id,name,description,price,discount_price,images,stock_quantity,brand,unit,rating,total_reviews,is_active,product_categories(name)')
          .eq('store_id', storeId).eq('is_active', true),
      ])
      setStore(s)
      setProducts(p ?? [])
      setLoading(false)
    }
    load()
  }, [storeId])

  const addToCart = useCallback((p) => {
    setCart(c => {
      const ex = c.find(x => x.id === p.id)
      if (ex) return c.map(x => x.id === p.id ? { ...x, qty: x.qty + 1 } : x)
      return [...c, { ...p, qty: 1 }]
    })
  }, [])

  const removeFromCart = useCallback((p) => {
    setCart(c => {
      const ex = c.find(x => x.id === p.id)
      if (!ex) return c
      if (ex.qty <= 1) return c.filter(x => x.id !== p.id)
      return c.map(x => x.id === p.id ? { ...x, qty: x.qty - 1 } : x)
    })
  }, [])

  const cartQty = (id) => cart.find(x => x.id === id)?.qty ?? 0
  const totalItems = cart.reduce((s, x) => s + x.qty, 0)

  async function handlePlaceOrder() {
    if (!user?.id) {
      alert('Please sign in to place an order.')
      return
    }
    setPlacing(true)
    try {
      const subtotal    = cart.reduce((s, x) => s + parseFloat(x.discount_price ?? x.price) * x.qty, 0)
      const deliveryFee = parseFloat(store?.delivery_fee ?? 0)
      const total       = subtotal + deliveryFee

      const { data: order, error: oErr } = await supabase.from('orders').insert({
        user_id:          user.id,
        store_id:         storeId,
        subtotal:         subtotal.toFixed(2),
        delivery_fee:     deliveryFee.toFixed(2),
        total:            total.toFixed(2),
        status:           'pending',
        delivery_address: user.address ?? user.city ?? 'Address pending',
      }).select('id').single()
      if (oErr) throw oErr

      const items = cart.map(x => ({
        order_id:    order.id,
        product_id:  x.id,
        quantity:    x.qty,
        unit_price:  parseFloat(x.discount_price ?? x.price),
        total_price: parseFloat(x.discount_price ?? x.price) * x.qty,
      }))
      const { error: iErr } = await supabase.from('order_items').insert(items)
      if (iErr) throw iErr

      setCart([])
      setCartOpen(false)
      setSuccess(`Order #${order.id.slice(0, 8).toUpperCase()} placed!`)
      setTimeout(() => setSuccess(null), 4000)
    } catch (err) {
      alert(err.message ?? 'Order failed. Please try again.')
    } finally {
      setPlacing(false)
    }
  }

  const filtered = products.filter(p => p.name?.toLowerCase().includes(query.toLowerCase()))

  if (loading) {
    return (
      <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', color: '#7a5e60', fontSize: 14 }}>Loading…</div>
      </div>
    )
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      {/* Store top bar */}
      <div style={{ position: 'sticky', top: 0, zIndex: 30, background: '#fff', borderBottom: '1px solid #b8ceb5', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={onBack} style={{ background: 'rgba(94,71,73,.09)', border: '1px solid rgba(94,71,73,.18)', borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#5e4749', fontSize: 18, flexShrink: 0 }}>←</button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, fontSize: 15, color: '#3a2c2d', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{store?.name}</p>
          {store?.city && <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 11, color: '#7a5e60' }}>📍 {store.city} · {parseFloat(store.delivery_fee) === 0 ? 'Free delivery' : `Rs ${parseFloat(store.delivery_fee).toFixed(0)} delivery`}</p>}
        </div>
        <button onClick={() => totalItems > 0 && setCartOpen(true)} style={{ position: 'relative', background: totalItems > 0 ? '#5e4749' : 'rgba(94,71,73,.09)', border: 'none', borderRadius: 12, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', color: totalItems > 0 ? '#fff' : '#7a5e60' }}>
          <span style={{ fontSize: 16 }}>🛒</span>
          {totalItems > 0 && <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, fontSize: 13 }}>{totalItems}</span>}
        </button>
      </div>

      {/* Success banner */}
      {success && (
        <div style={{ background: '#eef4ec', border: '1px solid #b8ceb5', borderRadius: 14, margin: '10px 16px', padding: '10px 14px', fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 13, fontWeight: 700, color: '#3a6633' }}>
          ✅ {success}
        </div>
      )}

      {/* Search */}
      <div style={{ margin: '12px 16px 6px', display: 'flex', alignItems: 'center', gap: 8, background: '#eef4ec', border: '1.5px solid #b8ceb5', borderRadius: 16, padding: '8px 14px' }}>
        <span style={{ fontSize: 14 }}>🔍</span>
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search products…"
          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 13, color: '#3a2c2d' }} />
        {query && <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', color: '#7a5e60', cursor: 'pointer', fontSize: 14 }}>✕</button>}
      </div>

      {/* Products grid */}
      <div style={{ padding: '8px 16px 100px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {filtered.length === 0 ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', paddingTop: 48 }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🛍</div>
            <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 600, fontSize: 14, color: '#7a5e60' }}>
              {query ? `No products match "${query}"` : 'No products in this store yet'}
            </p>
          </div>
        ) : filtered.map(p => (
          <ProductCard
            key={p.id} p={p} qty={cartQty(p.id)}
            onAdd={() => addToCart(p)} onRemove={() => removeFromCart(p)}
          />
        ))}
      </div>

      {/* Floating cart FAB */}
      {totalItems > 0 && (
        <button onClick={() => setCartOpen(true)} style={{ position: 'fixed', bottom: 80, left: 16, right: 16, background: '#5e4749', color: '#fff', border: 'none', borderRadius: 50, padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 20px rgba(94,71,73,.4)', zIndex: 40 }}>
          🛒 {totalItems} item{totalItems !== 1 ? 's' : ''} · View Cart
        </button>
      )}

      {/* Cart sheet */}
      {cartOpen && (
        <CartSheet cart={cart} store={store} onClose={() => setCartOpen(false)} onAdd={addToCart} onRemove={removeFromCart} onPlace={handlePlaceOrder} placing={placing} />
      )}
    </div>
  )
}

// ─── Main screen ───
export default function MobileStore() {
  const [stores,    setStores]   = useState([])
  const [loading,   setLoading]  = useState(true)
  const [query,     setQuery]    = useState('')
  const [selected,  setSelected] = useState(null)  // { id, name }

  const load = useCallback(async (q = '') => {
    setLoading(true)
    let req = supabase
      .from('cat_stores')
      .select('id,name,city,address,phone,rating,total_reviews,delivery_fee,is_active,is_approved')
      .eq('is_active', true).eq('is_approved', true)
    if (q) req = req.ilike('name', `%${q}%`)
    const { data } = await req.order('name')
    if (data) setStores(data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  let debounce
  function handleSearch(e) {
    const v = e.target.value; setQuery(v)
    clearTimeout(debounce); debounce = setTimeout(() => load(v.trim()), 350)
  }

  // If a store is selected, show its product view
  if (selected) {
    return (
      <MobileLayout title={selected.name}>
        <StoreDetailView storeId={selected.id} storeName={selected.name} onBack={() => setSelected(null)} />
      </MobileLayout>
    )
  }

  // Otherwise show store list
  return (
    <MobileLayout title="Cat Stores">
      {/* Search */}
      <div style={{ position: 'sticky', top: 0, zIndex: 30, background: '#fff', borderBottom: '1px solid #b8ceb5', padding: '12px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#eef4ec', border: '1.5px solid #b8ceb5', borderRadius: 16, padding: '8px 14px' }}>
          <span style={{ fontSize: 14 }}>🔍</span>
          <input value={query} onChange={handleSearch} placeholder="Search stores or cities…"
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 13, color: '#3a2c2d' }} />
          {query && (
            <button onClick={() => { setQuery(''); load('') }} style={{ background: 'none', border: 'none', color: '#7a5e60', cursor: 'pointer', fontSize: 14 }}>✕</button>
          )}
        </div>
        <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 11, color: '#7a5e60', marginTop: 6 }}>
          {loading ? 'Loading…' : `${stores.length} store${stores.length !== 1 ? 's' : ''} available`}
        </p>
      </div>

      <div style={{ padding: '14px 16px 100px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading ? (
          <div style={{ textAlign: 'center', paddingTop: 60, fontSize: 40 }}>🏪</div>
        ) : stores.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🏪</div>
            <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 600, fontSize: 14, color: '#7a5e60' }}>
              {query ? `No stores found for "${query}"` : 'No stores available'}
            </p>
            <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 12, color: '#7a5e60', marginTop: 4 }}>Stores appear here after admin approval</p>
          </div>
        ) : stores.map(st => (
          <StoreCard key={st.id} st={st} onClick={() => setSelected({ id: st.id, name: st.name })} />
        ))}
      </div>
    </MobileLayout>
  )
}
