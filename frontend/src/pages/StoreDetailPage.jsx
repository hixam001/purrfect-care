import { useState, useEffect, useContext } from 'react'
import { useParams, Link, useNavigate }   from 'react-router-dom'
import { supabase }                        from '../lib/supabaseClient.js'
import { useFadeUp }                       from '../hooks/useScrollReveal.js'
import { Badge, BtnOlive, Pill, GlassCard } from '../components/ui/index.jsx'
import { useAuth }                           from '../context/AuthContext.jsx'

const API = import.meta.env.VITE_API_URL || 'https://server-vmvwkwachq-uc.a.run.app'

export default function StoreDetailPage() {
  const { storeId }  = useParams()
  const navigate     = useNavigate()
  const { user }     = useAuth()
  const headerRef    = useFadeUp(0)

  const [store,     setStore]     = useState(null)
  const [products,  setProducts]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [catFilter, setCatFilter] = useState('All')
  const [cart,      setCart]      = useState([])
  const [cartOpen,  setCartOpen]  = useState(false)

  /* ── Checkout flow state ─────────────────────── */
  const [checkoutOpen,    setCheckoutOpen]    = useState(false)
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [deliveryLat,     setDeliveryLat]     = useState(null)
  const [deliveryLng,     setDeliveryLng]     = useState(null)
  const [geoLoading,      setGeoLoading]      = useState(false)
  const [checkingOut,     setCheckingOut]     = useState(false)
  const [checkoutErr,     setCheckoutErr]     = useState('')

  useEffect(() => {
    async function load() {
      console.log('[StoreDetail] Loading for storeId:', storeId)

      // Load store
      const { data: s, error: storeErr } = await supabase
        .from('cat_stores')
        .select('*')
        .eq('id', storeId)
        .single()
      console.log('[StoreDetail] store result:', s?.name, '| error:', storeErr?.message)

      // Load products — explicit FK hint to avoid join ambiguity
      const { data: p, error: prodErr } = await supabase
        .from('products')
        .select(`
          id, name, description, price, discount_price, images,
          stock_quantity, brand, unit, rating, total_reviews, is_active,
          category_id,
          product_categories!products_category_id_fkey ( name )
        `)
        .eq('store_id', storeId)
        .eq('is_active', true)

      console.log('[StoreDetail] products result:', p?.length, 'items | error:', prodErr?.message)

      if (prodErr) {
        console.error('[StoreDetail] products error (falling back):', prodErr)
        // Fallback: plain query without join
        const { data: p2, error: p2Err } = await supabase
          .from('products')
          .select('id, name, description, price, discount_price, images, stock_quantity, brand, unit, rating, total_reviews, is_active, category_id')
          .eq('store_id', storeId)
          .eq('is_active', true)
        console.log('[StoreDetail] fallback result:', p2?.length, 'items | error:', p2Err?.message)
        setStore(s)
        setProducts(p2 ?? [])
        setLoading(false)
        return
      }

      setStore(s)
      setProducts(p ?? [])
      setLoading(false)
    }
    load()
  }, [storeId])

  /* ── Cart helpers ───────────────────────────── */
  function addToCart(p) {
    setCart(c => {
      const ex = c.find(x => x.id === p.id)
      if (ex) return c.map(x => x.id === p.id ? { ...x, qty: x.qty + 1 } : x)
      return [...c, { ...p, qty: 1 }]
    })
  }
  function removeFromCart(id) { setCart(c => c.filter(x => x.id !== id)) }
  function updateQty(id, delta) {
    setCart(c => c.map(x => x.id === id ? { ...x, qty: Math.max(1, x.qty + delta) } : x))
  }

  const totalItems = cart.reduce((s, x) => s + x.qty, 0)
  const subtotal   = cart.reduce((s, x) => s + (x.discount_price ?? x.price) * x.qty, 0)
  const total      = subtotal + (store?.delivery_fee ?? 0)

  const categories = ['All', ...new Set(products.map(p => p.product_categories?.name).filter(Boolean))]
  const filtered   = products.filter(p => {
    const q = search.toLowerCase()
    return p.name?.toLowerCase().includes(q) &&
           (catFilter === 'All' || p.product_categories?.name === catFilter)
  })

  /* ── Geolocation for delivery ───────────────── */
  function handleDeliveryLocation() {
    if (!navigator.geolocation) return
    setGeoLoading(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        setDeliveryLat(pos.coords.latitude)
        setDeliveryLng(pos.coords.longitude)
        setGeoLoading(false)
      },
      () => setGeoLoading(false),
      { timeout: 8000 }
    )
  }

  /* ── Checkout ────────────────────────────────── */
  async function handleCheckout() {
    if (!user) { navigate('/login'); return }
    if (!deliveryAddress.trim()) { setCheckoutErr('Please enter a delivery address.'); return }

    const token = localStorage.getItem('pc_token')
    if (!token) { navigate('/login'); return }

    setCheckingOut(true)
    setCheckoutErr('')

    try {
      // 1. Create order
      const orderBody = {
        store_id:           storeId,
        items:              cart.map(x => ({
          product_id: x.id,
          quantity:   x.qty,
          unit_price: x.discount_price ?? x.price,
        })),
        delivery_address:   deliveryAddress,
        delivery_fee:       store?.delivery_fee ?? 0,
        ...(deliveryLat !== null && { delivery_latitude: deliveryLat, delivery_longitude: deliveryLng }),
      }
      const orderRes = await fetch(`${API}/api/orders/`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify(orderBody),
      })
      const orderData = await orderRes.json()
      if (!orderRes.ok) throw new Error(orderData.detail || 'Failed to create order.')

      const orderId   = orderData.order.id
      const amountPkr = Math.ceil(total)

      // 2. Create Safepay payment session
      const origin    = window.location.origin
      const payRes    = await fetch(`${API}/api/payments/order-session`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          order_id:     orderId,
          amount_pkr:   amountPkr,
          redirect_url: `${origin}/orders/success?order_id=${orderId}`,
          cancel_url:   `${origin}/store/${storeId}`,
        }),
      })
      const payData = await payRes.json()
      if (!payRes.ok) throw new Error(payData.detail || 'Payment gateway error.')

      // 3. Redirect to Safepay checkout
      window.location.href = payData.checkout_url

    } catch (e) {
      setCheckoutErr(e.message)
      setCheckingOut(false)
    }
  }

  /* ── Guards ─────────────────────────────────── */
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

  /* ── Input style helpers ─────────────────────── */
  const iCls = "w-full px-4 py-3 rounded-xl text-[14px] text-espresso outline-none transition-all"
  const iSty = { background: 'rgba(255,255,255,.9)', border: '1.5px solid #b8ceb5' }
  const fi   = e => { e.target.style.borderColor = '#5e4749'; e.target.style.boxShadow = '0 0 0 3px rgba(85,107,47,.12)' }
  const fo   = e => { e.target.style.borderColor = '#b8ceb5'; e.target.style.boxShadow = 'none' }

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 py-16">

      {/* ── Cart sidebar ────────────────────────────── */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex" onClick={() => setCartOpen(false)}>
          <div className="flex-1" />
          <div className="w-full max-w-sm h-full flex flex-col overflow-hidden shadow-2xl"
               style={{ background: '#dbe8d8', borderLeft: '1px solid #b8ceb5' }}
               onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="px-6 py-5 flex items-center justify-between" style={{ borderBottom: '1px solid #b8ceb5' }}>
              <h2 className="font-display font-black text-[1.1rem] text-espresso">Cart ({totalItems})</h2>
              <button onClick={() => setCartOpen(false)} className="text-clay-muted hover:text-espresso text-xl">✕</button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3">
              {cart.length === 0
                ? <div className="text-center py-12 text-clay-muted">Your cart is empty</div>
                : cart.map(item => (
                  <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl"
                       style={{ background: 'rgba(255,255,255,.75)', border: '1px solid #b8ceb5' }}>
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl flex-shrink-0"
                         style={{ background: 'rgba(94,71,73,.08)' }}>
                      {item.images?.[0]
                        ? <img src={item.images[0]} alt={item.name} className="w-full h-full object-contain rounded-lg" />
                        : '📦'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-[13px] text-espresso truncate">{item.name}</div>
                      <div className="text-[11px] text-clay-muted">
                        ₨ {(item.discount_price ?? item.price).toLocaleString()}
                      </div>
                    </div>
                    {/* Qty controls */}
                    <div className="flex items-center gap-1">
                      <button onClick={() => updateQty(item.id, -1)}
                              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                              style={{ background: 'rgba(94,71,73,.12)', color: '#5e4749' }}>−</button>
                      <span className="text-[13px] font-bold text-espresso w-5 text-center">{item.qty}</span>
                      <button onClick={() => updateQty(item.id, +1)}
                              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                              style={{ background: 'rgba(94,71,73,.12)', color: '#5e4749' }}>+</button>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} className="text-clay-muted hover:text-espresso text-lg ml-1">✕</button>
                  </div>
                ))
              }
            </div>

            {/* Footer */}
            {cart.length > 0 && (
              <div className="p-5 border-t" style={{ borderColor: '#b8ceb5' }}>
                <div className="flex justify-between text-[13px] text-clay-muted mb-1">
                  <span>Subtotal</span><span>₨ {subtotal.toLocaleString()}</span>
                </div>
                {(store.delivery_fee ?? 0) > 0 && (
                  <div className="flex justify-between text-[13px] text-clay-muted mb-1">
                    <span>Delivery</span><span>₨ {store.delivery_fee.toLocaleString()}</span>
                  </div>
                )}
                {(store.delivery_fee === 0) && (
                  <div className="text-[11px] text-olive mb-1">🚚 Free delivery</div>
                )}
                <div className="flex justify-between font-bold text-[15px] text-espresso mb-4 mt-2 pt-2"
                     style={{ borderTop: '1px solid rgba(94,71,73,.12)' }}>
                  <span>Total</span>
                  <span>₨ {total.toLocaleString()}</span>
                </div>
                <button
                  id="btn-proceed-checkout"
                  className="btn btn-olive w-full justify-center !py-3"
                  onClick={() => { setCartOpen(false); setCheckoutOpen(true); setCheckoutErr('') }}>
                  Proceed to Checkout →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Checkout modal ───────────────────────────── */}
      {checkoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
             style={{ background: 'rgba(0,0,0,.45)', backdropFilter: 'blur(4px)' }}
             onClick={() => !checkingOut && setCheckoutOpen(false)}>
          <div className="w-full max-w-md rounded-3xl p-8 flex flex-col gap-5"
               style={{ background: '#EFE5DC', border: '1px solid #b8ceb5', boxShadow: '0 24px 64px rgba(0,0,0,.2)' }}
               onClick={e => e.stopPropagation()}>

            <div>
              <h2 className="font-display font-black text-[1.4rem] text-espresso mb-1">Confirm Order</h2>
              <p className="text-clay-muted text-[13px]">Where should we deliver?</p>
            </div>

            {/* Delivery address */}
            <div>
              <label className="t-mono text-[10px] text-espresso-soft block mb-1.5">Delivery Address *</label>
              <div className="flex gap-2 items-start">
                <input
                  value={deliveryAddress}
                  onChange={e => setDeliveryAddress(e.target.value)}
                  placeholder="House/Flat no., street, area, city"
                  className={iCls + ' flex-1'}
                  style={iSty} onFocus={fi} onBlur={fo}
                />
                <button
                  type="button"
                  onClick={handleDeliveryLocation}
                  disabled={geoLoading}
                  title="Use my current location"
                  className="flex-shrink-0 px-3 py-3 rounded-xl text-[12px] font-semibold transition-all"
                  style={{ background: deliveryLat ? 'rgba(85,107,47,.15)' : 'rgba(255,255,255,.8)',
                           border: deliveryLat ? '1.5px solid #5e4749' : '1.5px solid #b8ceb5',
                           color: deliveryLat ? '#5e4749' : '#4E342E', whiteSpace: 'nowrap' }}>
                  {geoLoading ? '⏳' : deliveryLat ? '📍 Pinned' : '📍 Pin'}
                </button>
              </div>
              {deliveryLat && (
                <p className="text-[10px] mt-1" style={{ color: '#5e4749' }}>
                  📍 Location captured ({deliveryLat.toFixed(4)}, {deliveryLng.toFixed(4)})
                </p>
              )}
            </div>

            {/* Order summary */}
            <div className="rounded-2xl p-4 flex flex-col gap-2"
                 style={{ background: 'rgba(255,255,255,.6)', border: '1px solid #b8ceb5' }}>
              <div className="font-bold text-[13px] text-espresso mb-1">Order Summary</div>
              {cart.map(item => (
                <div key={item.id} className="flex justify-between text-[12px] text-clay-muted">
                  <span className="truncate max-w-[200px]">{item.name} × {item.qty}</span>
                  <span className="flex-shrink-0 ml-2">₨ {((item.discount_price ?? item.price) * item.qty).toLocaleString()}</span>
                </div>
              ))}
              <div className="border-t mt-1 pt-2" style={{ borderColor: '#b8ceb5' }}>
                {(store.delivery_fee ?? 0) > 0 && (
                  <div className="flex justify-between text-[12px] text-clay-muted mb-1">
                    <span>Delivery fee</span><span>₨ {store.delivery_fee.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-[15px] text-espresso">
                  <span>Total</span><span>₨ {total.toLocaleString()}</span>
                </div>
                <div className="text-[10px] text-clay-muted mt-1">+1.5% platform fee applied at payment</div>
              </div>
            </div>

            {checkoutErr && (
              <div className="px-4 py-3 rounded-xl text-[13px]"
                   style={{ background: 'rgba(196,56,56,.08)', border: '1px solid rgba(196,56,56,.2)', color: '#9B2020' }}>
                ⚠️ {checkoutErr}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                disabled={checkingOut}
                onClick={() => setCheckoutOpen(false)}
                className="btn btn-outline flex-1 justify-center !py-3"
                style={{ opacity: checkingOut ? .5 : 1 }}>
                ← Back
              </button>
              <button
                id="btn-confirm-pay"
                type="button"
                disabled={checkingOut}
                onClick={handleCheckout}
                className="btn btn-olive flex-1 justify-center !py-3"
                style={{ opacity: checkingOut ? .7 : 1 }}>
                {checkingOut
                  ? <span className="flex items-center gap-2">
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity=".3"/>
                        <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                      </svg>
                      Processing…
                    </span>
                  : '💳 Pay Now →'
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Back ───────────────────────────────────── */}
      <Link to="/store"
            className="inline-flex items-center gap-1.5 no-underline mb-8 font-semibold text-[13px] px-4 py-2 rounded-xl w-fit"
            style={{ color: '#5e4749', background: 'rgba(94,71,73,.09)', border: '1px solid rgba(94,71,73,.18)' }}>
        ← Back to Stores
      </Link>

      {/* ── Store header ───────────────────────────── */}
      <div ref={headerRef} className="fade-up flex flex-wrap items-start justify-between gap-4 mb-8">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl flex-shrink-0"
               style={{ background: 'linear-gradient(135deg,rgba(196,140,56,.18),rgba(196,140,56,.08))' }}>
            🏪
          </div>
          <div>
            <Badge className="mb-2">Cat Store</Badge>
            <h1 className="font-display font-black text-espresso tracking-tight"
                style={{ fontSize: 'clamp(1.5rem,3vw,2rem)' }}>
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

        <button id="btn-open-cart" className="btn btn-olive relative" onClick={() => setCartOpen(true)}>
          🛒 Cart
          {totalItems > 0 && (
            <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center"
                  style={{ background: '#b87c2a' }}>
              {totalItems}
            </span>
          )}
        </button>
      </div>

      {/* ── Filters + Grid ─────────────────────────── */}
      <div>
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl min-w-[200px]"
               style={{ background: 'rgba(255,255,255,.8)', border: '1.5px solid #b8ceb5' }}>
            <span>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)}
                   placeholder="Search products…"
                   className="bg-transparent outline-none text-[14px] text-espresso flex-1" />
          </div>
          {categories.map(c => (
            <button key={c} onClick={() => setCatFilter(c)}
                    className="pill transition-all"
                    style={{
                      background: catFilter === c ? '#5e4749' : 'rgba(255,255,255,.7)',
                      color:      catFilter === c ? '#fff'    : '#4E342E',
                      border:     catFilter === c ? 'none'    : '1px solid #b8ceb5',
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
              {products.length === 0 ? "This store hasn't added products yet." : 'Try a different search.'}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map(p => {
              const finalPrice = p.discount_price ?? p.price
              const hasDiscount = p.discount_price && p.discount_price < p.price
              const imgSrc = p.images?.[0] ?? null
              const stars  = Math.round(p.rating ?? 0)
              const inCart = cart.find(x => x.id === p.id)

              return (
                <GlassCard key={p.id} className="p-4 flex flex-col group cursor-pointer">
                  {/* Image */}
                  <div className="w-full h-[130px] rounded-2xl overflow-hidden mb-3 flex items-center justify-center"
                       style={{ background: 'linear-gradient(135deg,rgba(94,71,73,.07),rgba(94,71,73,.03))' }}>
                    {imgSrc
                      ? <img src={imgSrc} alt={p.name} className="w-full h-full object-contain p-3 transition-transform duration-300 group-hover:scale-105" />
                      : <span className="text-5xl">📦</span>
                    }
                  </div>

                  {p.product_categories?.name && (
                    <Pill variant="clay" className="mb-1.5">
                      <span style={{ fontSize: 9 }}>{p.product_categories.name}</span>
                    </Pill>
                  )}

                  <div className="font-bold text-[13px] text-espresso mt-1 mb-1 flex-1">{p.name}</div>
                  {p.brand && <div className="text-[11px] text-clay-muted mb-1">{p.brand}{p.unit ? ` · ${p.unit}` : ''}</div>}

                  {p.total_reviews > 0 && (
                    <div className="flex items-center gap-1 mb-2">
                      <span className="text-amber-500 text-[10px]">{'★'.repeat(stars)}{'☆'.repeat(5 - stars)}</span>
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
                    <button
                      onClick={() => addToCart(p)}
                      disabled={p.stock_quantity === 0}
                      className="btn btn-olive !py-1.5 !px-3 !text-[10px] transition-all"
                      style={{ opacity: p.stock_quantity === 0 ? .4 : 1,
                               background: inCart ? '#5e4749' : undefined }}>
                      {p.stock_quantity === 0 ? 'Out' : inCart ? `In Cart (${inCart.qty})` : 'Add'}
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
