/**
 * StoreDashboard — Full store management interface.
 * Accessible at /store/dashboard for users with role === 'store_owner'.
 * All data via direct Supabase client (same pattern as HospitalAdminDashboard).
 */
import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../lib/supabaseClient.js'

/* ── Design tokens ── */
const C = {
  bg:          '#dbe8d8',
  surface:     'rgba(255,255,255,.88)',
  border:      '#b8ceb5',
  text:        '#3a2c2d',
  textMuted:   '#7a5e60',
  olive:       '#5e4749',
  oliveBg:     'rgba(94,71,73,.09)',
  oliveBorder: 'rgba(94,71,73,.20)',
  amberBg:     'rgba(184,92,56,.08)',
  amberBorder: 'rgba(184,92,56,.22)',
  amberText:   '#7A4F10',
  dangerBg:    'rgba(184,56,56,.08)',
  dangerBorder:'rgba(184,56,56,.20)',
  dangerText:  '#7D1F1F',
  purpleBg:    'rgba(124,58,237,.08)',
  purpleBorder:'rgba(124,58,237,.22)',
  purpleText:  '#6D28D9',
}

const ORDER_STATUSES = [
  'pending','confirmed','preparing','out_for_delivery','delivered','cancelled'
]

const STATUS_STYLE = {
  pending:          { bg:'rgba(184,124,42,.10)', text:'#7A4F10', label:'Pending'          },
  confirmed:        { bg:'rgba(59,130,246,.10)', text:'#1D4ED8', label:'Confirmed'        },
  preparing:        { bg:'rgba(124,58,237,.10)', text:'#6D28D9', label:'Preparing'        },
  out_for_delivery: { bg:'rgba(15,118,110,.10)', text:'#0F766E', label:'Out for Delivery'  },
  delivered:        { bg:'rgba(45,90,39,.10)',   text:'#1E4D1C', label:'Delivered'        },
  cancelled:        { bg:'rgba(184,56,56,.09)',  text:'#7D1F1F', label:'Cancelled'        },
  refunded:         { bg:'rgba(100,100,100,.09)',text:'#444444', label:'Refunded'         },
}

function StatusPill({ status }) {
  const s = STATUS_STYLE[status] ?? { bg:'rgba(0,0,0,.06)', text:'#444', label: status }
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11.5px] font-semibold"
          style={{ background: s.bg, color: s.text }}>{s.label}</span>
  )
}

function Panel({ children, className = '' }) {
  return (
    <div className={`rounded-2xl p-5 ${className}`}
         style={{ background: C.surface, border: `1px solid ${C.border}` }}>
      {children}
    </div>
  )
}

function StatCard({ icon, label, value, sub, accentBg }) {
  return (
    <div className="rounded-2xl p-5" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
      <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl mb-3" style={{ background: accentBg }}>{icon}</div>
      <div className="font-display font-black text-[1.7rem] leading-none" style={{ color: C.text }}>{value}</div>
      <div className="text-[13px] font-medium mt-1" style={{ color: C.textMuted }}>{label}</div>
      {sub && <div className="text-[11.5px] mt-0.5" style={{ color: C.olive }}>{sub}</div>}
    </div>
  )
}

function fmtDate(iso) { return iso ? new Date(iso).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' }) : '—' }
function fmtMoney(n)  { return `₨${Number(n ?? 0).toLocaleString()}` }

const inputCls = 'w-full px-4 py-3 rounded-xl text-[14px] outline-none transition-all'
const inputSty = { background:'rgba(255,255,255,.9)', border:`1.5px solid ${C.border}`, color: C.text }
const fi = e => { e.target.style.borderColor = C.olive; e.target.style.boxShadow = '0 0 0 3px rgba(94,71,73,.12)' }
const fo = e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = 'none' }

/* ══════════════════════════════════════════════════════════════
   PRODUCT MODAL (Add / Edit)
══════════════════════════════════════════════════════════════ */
function ProductModal({ storeId, product, onClose, onSaved }) {
  const editing = !!product
  const [form, setForm] = useState({
    name:           product?.name           ?? '',
    description:    product?.description    ?? '',
    price:          product?.price          ?? '',
    discount_price: product?.discount_price ?? '',
    stock_quantity: product?.stock_quantity ?? '',
    brand:          product?.brand          ?? '',
    unit:           product?.unit           ?? 'item',
    is_active:      product?.is_active      ?? true,
  })
  const [saving, setSaving] = useState(false)
  const [err,    setErr]    = useState('')

  function set(k) { return e => setForm(f => ({ ...f, [k]: e.target.value })) }

  async function handleSave() {
    if (!form.name || !form.price || form.stock_quantity === '') { setErr('Name, price and quantity are required.'); return }
    setSaving(true); setErr('')
    const payload = {
      name:           form.name,
      description:    form.description || null,
      price:          parseFloat(form.price),
      discount_price: form.discount_price ? parseFloat(form.discount_price) : null,
      stock_quantity: parseInt(form.stock_quantity, 10),
      brand:          form.brand || null,
      unit:           form.unit,
      is_active:      form.is_active,
    }
    try {
      if (editing) {
        const { error } = await supabase.from('products').update(payload).eq('id', product.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('products').insert({ ...payload, store_id: storeId })
        if (error) throw error
      }
      onSaved()
    } catch(e) {
      setErr(e.message)
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background:'rgba(58,44,45,.5)', backdropFilter:'blur(8px)' }}>
      <div className="w-full max-w-lg rounded-3xl overflow-hidden"
           style={{ background: C.bg, maxHeight:'90vh', overflowY:'auto' }}>
        <div className="px-6 py-4 flex items-center justify-between"
             style={{ borderBottom:`1px solid ${C.border}`, background:'rgba(255,255,255,.6)' }}>
          <div className="font-display font-black text-[1.15rem]" style={{ color: C.text }}>
            {editing ? 'Edit Product' : 'Add New Product'}
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ color: C.textMuted }}>✕</button>
        </div>
        <div className="p-6 flex flex-col gap-4">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: C.textMuted }}>Product Name *</label>
            <input value={form.name} onChange={set('name')} placeholder="e.g. Royal Canin Indoor 2kg"
                   className={inputCls} style={inputSty} onFocus={fi} onBlur={fo} />
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: C.textMuted }}>Description</label>
            <textarea value={form.description} onChange={set('description')} rows={2} placeholder="Brief product description…"
                      className={inputCls} style={{ ...inputSty, resize:'none' }} onFocus={fi} onBlur={fo} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: C.textMuted }}>Price (₨) *</label>
              <input type="number" min="0" step="0.01" value={form.price} onChange={set('price')} placeholder="0"
                     className={inputCls} style={inputSty} onFocus={fi} onBlur={fo} />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: C.textMuted }}>Discount Price (₨)</label>
              <input type="number" min="0" step="0.01" value={form.discount_price} onChange={set('discount_price')} placeholder="Leave blank if none"
                     className={inputCls} style={inputSty} onFocus={fi} onBlur={fo} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: C.textMuted }}>Stock Quantity *</label>
              <input type="number" min="0" value={form.stock_quantity} onChange={set('stock_quantity')} placeholder="0"
                     className={inputCls} style={inputSty} onFocus={fi} onBlur={fo} />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: C.textMuted }}>Unit</label>
              <select value={form.unit} onChange={set('unit')} className={inputCls} style={inputSty}>
                {['item','kg','g','ml','L','pack','box','bag'].map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: C.textMuted }}>Brand</label>
            <input value={form.brand} onChange={set('brand')} placeholder="e.g. Royal Canin"
                   className={inputCls} style={inputSty} onFocus={fi} onBlur={fo} />
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" id="isActive" checked={form.is_active}
                   onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="w-4 h-4" />
            <label htmlFor="isActive" className="text-[13.5px] font-medium" style={{ color: C.text }}>Listed publicly (visible to customers)</label>
          </div>
          {err && (
            <div className="px-4 py-3 rounded-xl text-[13px]"
                 style={{ background: C.dangerBg, border:`1px solid ${C.dangerBorder}`, color: C.dangerText }}>
              ⚠️ {err}
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl font-semibold text-[13.5px]"
                    style={{ border:`1px solid ${C.border}`, color: C.textMuted, background:'transparent' }}>Cancel</button>
            <button onClick={handleSave} disabled={saving}
                    className="flex-1 py-3 rounded-xl font-semibold text-[13.5px]"
                    style={{ background:`linear-gradient(135deg,${C.olive},#4a373a)`, color:'#fff' }}>
              {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Product'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   MAIN DASHBOARD
══════════════════════════════════════════════════════════════ */
export default function StoreDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [tab,      setTab]      = useState('overview')
  const [store,    setStore]    = useState(null)
  const [products, setProducts] = useState([])
  const [orders,   setOrders]   = useState([])
  const [plan,     setPlan]     = useState(null)   // active subscription_plans row
  const [loading,  setLoading]  = useState(true)
  const [modal,    setModal]    = useState(null)   // null | 'add' | product object (edit)
  const [actionMsg,setActionMsg]= useState('')
  const [settingsForm, setSettingsForm] = useState(null)
  const [saving,   setSaving]   = useState(false)

  async function handleLogout() { await logout(); navigate('/login') }

  function flash(msg) { setActionMsg(msg); setTimeout(() => setActionMsg(''), 4000) }

  /* ── Load store data ── */
  const loadData = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      // Get store
      const { data: s } = await supabase
        .from('cat_stores')
        .select('*')
        .eq('owner_user_id', user.id)
        .single()

      if (!s) { setLoading(false); return }
      setStore(s)
      setSettingsForm({
        name:           s.name,
        description:    s.description    ?? '',
        phone:          s.phone          ?? '',
        email:          s.email          ?? '',
        address:        s.address,
        city:           s.city           ?? '',
        delivery_fee:   s.delivery_fee   ?? 0,
        operating_hours: JSON.stringify(s.operating_hours ?? {}, null, 2),
      })

      // Get products
      const { data: p } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', s.id)
        .order('created_at', { ascending: false })

      setProducts(p ?? [])

      // Get active subscription plan (for product limit enforcement)
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('subscription_plans ( name, max_products )')
        .eq('profile_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      setPlan(sub?.subscription_plans ?? null)

      // Get orders with items
      const { data: o } = await supabase
        .from('orders')
        .select(`
          *,
          order_items ( id, quantity, unit_price, total_price, products ( name, unit ) ),
          user_profiles ( name, phone )
        `)
        .eq('store_id', s.id)
        .order('ordered_at', { ascending: false })

      setOrders(o ?? [])
    } catch(e) { console.warn(e) }
    setLoading(false)
  }, [user?.id])

  useEffect(() => { loadData() }, [loadData])

  /* ── Computed stats ── */
  const deliveredOrders  = orders.filter(o => o.status === 'delivered')
  const totalRevenue     = deliveredOrders.reduce((sum, o) => sum + (o.total ?? 0), 0)
  const pendingOrders    = orders.filter(o => o.status === 'pending').length
  const lowStockProducts = products.filter(p => p.stock_quantity <= 5 && p.is_active)

  // Plan limit: null max_products = unlimited
  const maxProducts  = plan?.max_products ?? null
  const canAddProduct = maxProducts === null || products.length < maxProducts

  // Monthly revenue for simple bar chart
  const monthlyRevenue = (() => {
    const map = {}
    deliveredOrders.forEach(o => {
      const key = new Date(o.ordered_at).toLocaleDateString('en-GB', { month:'short', year:'2-digit' })
      map[key] = (map[key] ?? 0) + (o.total ?? 0)
    })
    return Object.entries(map).slice(-6)
  })()
  const maxRevenue = Math.max(...monthlyRevenue.map(([,v]) => v), 1)

  // Top products by quantity sold
  const topProducts = (() => {
    const map = {}
    orders.forEach(o => {
      if (o.status === 'cancelled') return
      o.order_items?.forEach(i => {
        const name = i.products?.name ?? 'Unknown'
        map[name] = (map[name] ?? 0) + i.quantity
      })
    })
    return Object.entries(map).sort((a,b) => b[1]-a[1]).slice(0,5)
  })()

  /* ── Order status update ── */
  async function updateOrderStatus(orderId, newStatus) {
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId)
    if (!error) {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
      flash(`Order status updated to ${newStatus}.`)
    }
  }

  /* ── Toggle product active ── */
  async function toggleProduct(pid, current) {
    await supabase.from('products').update({ is_active: !current }).eq('id', pid)
    setProducts(prev => prev.map(p => p.id === pid ? { ...p, is_active: !current } : p))
  }

  /* ── Save settings ── */
  async function saveSettings() {
    if (!store) return
    setSaving(true)
    let operating_hours = null
    try { operating_hours = JSON.parse(settingsForm.operating_hours) } catch { /* keep null */ }
    const { error } = await supabase.from('cat_stores').update({
      name:           settingsForm.name,
      description:    settingsForm.description || null,
      phone:          settingsForm.phone || null,
      email:          settingsForm.email || null,
      address:        settingsForm.address,
      city:           settingsForm.city || null,
      delivery_fee:   parseFloat(settingsForm.delivery_fee) || 0,
      operating_hours,
    }).eq('id', store.id)
    if (!error) {
      setStore(s => ({ ...s, ...settingsForm }))
      flash('Store settings saved.')
    } else {
      flash('Save failed: ' + error.message)
    }
    setSaving(false)
  }

  const TABS = [
    { id:'overview',  label:'Overview',                              icon:'📊' },
    { id:'products',  label:`Products (${products.length})`,        icon:'📦' },
    { id:'orders',    label:`Orders (${orders.length})`,            icon:'🛍️' },
    { id:'stats',     label:'Statistics',                           icon:'📈' },
    { id:'settings',  label:'Settings',                             icon:'⚙️' },
  ]

  /* ════════════════════════════════════════════ */
  return (
    <div className="min-h-screen" style={{ background: C.bg }}>

      {/* Action banner */}
      {actionMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-lg text-[13px] font-semibold"
             style={{ background: C.surface, border:`1px solid ${C.oliveBorder}`, color: C.olive }}>
          {actionMsg}
        </div>
      )}

      {/* Product modal */}
      {modal !== null && (
        <ProductModal
          storeId={store?.id}
          product={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); loadData(); flash('Product saved.') }}
        />
      )}

      {/* ── Header ── */}
      <header className="sticky top-0 z-40"
              style={{ background:'rgba(219,232,216,.93)', backdropFilter:'blur(18px)',
                       WebkitBackdropFilter:'blur(18px)', borderBottom:`1px solid ${C.border}` }}>
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5 no-underline flex-shrink-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                 style={{ background:'linear-gradient(135deg,#5e4749,#4a373a)' }}>🐱</div>
            <div>
              <span className="font-display font-black text-[17px] tracking-tight" style={{ color: C.text }}>
                Purrfect<span style={{ color: C.olive }}>Care</span>
              </span>
              <span className="text-[11px] font-semibold ml-2 px-2 py-0.5 rounded-full"
                    style={{ background: C.purpleBg, border:`1px solid ${C.purpleBorder}`, color: C.purpleText }}>
                Store
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-0.5 overflow-x-auto">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                      className="px-3.5 py-2 rounded-xl text-[12.5px] font-medium whitespace-nowrap transition-all"
                      style={{
                        background: tab===t.id ? C.oliveBg   : 'transparent',
                        color:      tab===t.id ? C.olive     : C.textMuted,
                        border:     tab===t.id ? `1px solid ${C.oliveBorder}` : '1px solid transparent',
                      }}>
                {t.icon} {t.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3 flex-shrink-0">
            {pendingOrders > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                   style={{ background: C.amberBg, border:`1px solid ${C.amberBorder}` }}>
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background:'#B87C2A' }} />
                <span className="text-[12px] font-semibold" style={{ color: C.amberText }}>{pendingOrders} orders</span>
              </div>
            )}
            <button onClick={handleLogout} className="btn btn-outline !text-[12px] !py-2">Log out</button>
          </div>
        </div>
      </header>

      {/* ── Mobile tab strip (md:hidden) ── */}
      <div className="md:hidden sticky z-30 overflow-x-auto" style={{ top:64, background:'rgba(219,232,216,.95)', borderBottom:`1px solid ${C.border}` }}>
        <div className="flex gap-1 px-3 py-2" style={{ minWidth:'max-content' }}>
          {[
            { id:'overview', icon:'📊', label:'Overview' },
            { id:'products', icon:'📦', label:'Products' },
            { id:'orders',   icon:'🛍️', label:'Orders'  },
            { id:'stats',    icon:'📈', label:'Stats'   },
            { id:'settings', icon:'⚙️', label:'Settings'},
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold whitespace-nowrap flex-shrink-0"
                    style={{
                      background: tab===t.id ? C.oliveBg   : 'transparent',
                      color:      tab===t.id ? C.olive     : C.textMuted,
                      border:     tab===t.id ? `1px solid ${C.oliveBorder}` : '1px solid transparent',
                    }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-10">

        {/* Page heading */}
        <div className="mb-8">
          <h1 className="font-display font-black tracking-tight mb-1"
              style={{ fontSize:'clamp(1.5rem,3vw,2rem)', color: C.text }}>
            {store?.name ?? 'Store Dashboard'}
          </h1>
          <p className="text-[14px]" style={{ color: C.textMuted }}>
            {store?.city ?? ''}{store?.city ? ' · ' : ''}{store?.is_approved ? '✓ Approved' : '⏳ Pending approval'}
          </p>
        </div>

        {loading ? (
          <Panel className="py-20 text-center">
            <div className="text-3xl mb-3">⏳</div>
            <div className="font-display font-bold" style={{ color: C.text }}>Loading store data…</div>
          </Panel>
        ) : !store ? (
          <Panel className="py-20 text-center">
            <div className="text-4xl mb-4">🏪</div>
            <div className="font-display font-bold text-[1.15rem] mb-2" style={{ color: C.text }}>Store not registered</div>
            <p className="text-[14px] max-w-sm mx-auto" style={{ color: C.textMuted }}>
              Your account is not linked to a store. Complete the store registration process or contact support.
            </p>
          </Panel>
        ) : !store.is_approved ? (
          <Panel className="py-20 text-center" style={{ border: `1px solid ${C.amberBorder}` }}>
            <div className="text-5xl mb-5">⏳</div>
            <div className="font-display font-black text-[1.3rem] mb-2" style={{ color: C.text }}>Awaiting Admin Approval</div>
            <p className="text-[14px] max-w-md mx-auto mb-6" style={{ color: C.textMuted }}>
              Your store <strong style={{ color: C.text }}>{store.name}</strong> has been registered and is being reviewed by the Purrfect Care team.
              You will be able to manage products and view orders once your store is approved.
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold"
                 style={{ background: C.amberBg, border: `1px solid ${C.amberBorder}`, color: C.amberText }}>
              ⏱ Approval usually takes 1–2 business days
            </div>
          </Panel>
        ) : (
          <>

            {/* ══ OVERVIEW ══ */}
            {tab === 'overview' && (
              <div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <StatCard icon="📦" label="Total Products"
                            value={maxProducts !== null ? `${products.length}/${maxProducts}` : products.length}
                            accentBg="rgba(124,58,237,.10)" />
                  <StatCard icon="🛍️" label="Total Orders"    value={orders.length}            accentBg="rgba(184,92,56,.10)"  />
                  <StatCard icon="💰" label="Total Revenue"    value={fmtMoney(totalRevenue)}   accentBg="rgba(45,90,39,.10)"   />
                  <StatCard icon="⚠️" label="Low Stock"        value={lowStockProducts.length}
                            sub={lowStockProducts.length > 0 ? 'Needs restocking' : 'All good'}
                            accentBg={lowStockProducts.length > 0 ? C.dangerBg : C.oliveBg} />
                </div>

                {/* Recent orders */}
                <Panel className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-display font-bold text-[1.05rem]" style={{ color: C.text }}>Recent Orders</h2>
                    <button onClick={() => setTab('orders')} style={{ color: C.olive, background:'none', border:'none', cursor:'pointer', fontSize:13, fontWeight:600 }}>
                      View all →
                    </button>
                  </div>
                  {orders.length === 0 ? (
                    <div className="text-center py-8 text-[13px]" style={{ color: C.textMuted }}>No orders yet.</div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {orders.slice(0, 5).map(o => (
                        <div key={o.id} className="flex items-center gap-4 p-3 rounded-xl"
                             style={{ background: C.oliveBg }}>
                          <div className="flex-1 min-w-0">
                            <div className="text-[13.5px] font-semibold" style={{ color: C.text }}>
                              {o.user_profiles?.name ?? 'Customer'}
                            </div>
                            <div className="text-[12px]" style={{ color: C.textMuted }}>
                              {o.order_items?.length ?? 0} item{(o.order_items?.length ?? 0) !== 1 ? 's' : ''} · {fmtDate(o.ordered_at)}
                            </div>
                          </div>
                          <StatusPill status={o.status} />
                          <span className="font-bold text-[13px]" style={{ color: C.olive }}>{fmtMoney(o.total)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </Panel>

                {/* Low stock alert */}
                {lowStockProducts.length > 0 && (
                  <Panel style={{ border:`1px solid ${C.dangerBorder}` }}>
                    <h2 className="font-display font-bold text-[1rem] mb-3" style={{ color: C.dangerText }}>⚠️ Low Stock Alert</h2>
                    <div className="flex flex-col gap-2">
                      {lowStockProducts.map(p => (
                        <div key={p.id} className="flex items-center justify-between p-2.5 rounded-xl"
                             style={{ background: C.dangerBg }}>
                          <span className="text-[13.5px] font-medium" style={{ color: C.text }}>{p.name}</span>
                          <span className="text-[12.5px] font-bold" style={{ color: C.dangerText }}>
                            {p.stock_quantity} {p.unit ?? 'left'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </Panel>
                )}
              </div>
            )}

            {/* ══ PRODUCTS ══ */}
            {tab === 'products' && (
              <div>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-display font-bold text-[1.1rem]" style={{ color: C.text }}>
                    Products ({products.length}{maxProducts !== null ? `/${maxProducts}` : ''})
                  </h2>
                  <div className="flex items-center gap-3">
                    {maxProducts !== null && (
                      <span className="text-[12px] font-semibold px-2.5 py-1 rounded-full"
                            style={{
                              background: canAddProduct ? C.oliveBg   : C.dangerBg,
                              color:      canAddProduct ? C.olive     : C.dangerText,
                              border:     `1px solid ${canAddProduct ? C.oliveBorder : C.dangerBorder}`,
                            }}>
                        {plan?.name} plan · {maxProducts - products.length} remaining
                      </span>
                    )}
                    <button onClick={() => canAddProduct && setModal('add')}
                            disabled={!canAddProduct}
                            title={!canAddProduct ? `Your ${plan?.name} plan allows ${maxProducts} products. Upgrade to add more.` : ''}
                            className="px-4 py-2 rounded-xl font-semibold text-[13px]"
                            style={{
                              background: canAddProduct
                                ? `linear-gradient(135deg,${C.olive},#4a373a)`
                                : C.dangerBg,
                              color:      canAddProduct ? '#fff' : C.dangerText,
                              cursor:     canAddProduct ? 'pointer' : 'not-allowed',
                              opacity:    canAddProduct ? 1 : 0.8,
                            }}>
                      {canAddProduct ? '+ Add Product' : `Limit reached (${maxProducts})`}
                    </button>
                  </div>
                </div>

                {products.length === 0 ? (
                  <Panel className="py-20 text-center">
                    <div className="text-4xl mb-3">📦</div>
                    <div className="font-display font-bold text-[1.1rem] mb-2" style={{ color: C.text }}>No products yet</div>
                    <p className="text-[13.5px] mb-4" style={{ color: C.textMuted }}>Add your first product to start selling.</p>
                    <button onClick={() => canAddProduct && setModal('add')}
                            disabled={!canAddProduct}
                            className="px-5 py-2.5 rounded-xl font-semibold text-[13px]"
                            style={{ background:`linear-gradient(135deg,${C.olive},#4a373a)`, color:'#fff' }}>
                      + Add First Product
                    </button>
                  </Panel>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {products.map(p => (
                      <div key={p.id} className="rounded-2xl overflow-hidden"
                           style={{ background: C.surface, border:`1px solid ${p.is_active ? C.border : C.dangerBorder}`,
                                    opacity: p.is_active ? 1 : 0.7 }}>
                        {/* Product image placeholder */}
                        <div className="h-36 flex items-center justify-center text-5xl"
                             style={{ background: p.is_active ? C.oliveBg : C.dangerBg }}>📦</div>
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div className="font-semibold text-[14.5px]" style={{ color: C.text }}>{p.name}</div>
                            {!p.is_active && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                                    style={{ background: C.dangerBg, color: C.dangerText }}>Hidden</span>
                            )}
                          </div>
                          {p.brand && <div className="text-[12px] mb-2" style={{ color: C.textMuted }}>{p.brand}</div>}
                          <div className="flex items-center gap-2 mb-3">
                            {p.discount_price ? (
                              <>
                                <span className="font-black text-[15px]" style={{ color: C.olive }}>{fmtMoney(p.discount_price)}</span>
                                <span className="text-[12px] line-through" style={{ color: C.textMuted }}>{fmtMoney(p.price)}</span>
                              </>
                            ) : (
                              <span className="font-black text-[15px]" style={{ color: C.olive }}>{fmtMoney(p.price)}</span>
                            )}
                            <span className="ml-auto text-[11.5px] font-semibold px-2.5 py-1 rounded-full"
                                  style={{
                                    background: p.stock_quantity <= 5 ? C.dangerBg : C.oliveBg,
                                    color:      p.stock_quantity <= 5 ? C.dangerText : C.olive,
                                  }}>
                              {p.stock_quantity} {p.unit ?? 'in stock'}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => setModal(p)}
                                    className="flex-1 py-2 rounded-xl text-[12px] font-semibold"
                                    style={{ background: C.oliveBg, color: C.olive, border:`1px solid ${C.oliveBorder}` }}>
                              Edit
                            </button>
                            <button onClick={() => toggleProduct(p.id, p.is_active)}
                                    className="flex-1 py-2 rounded-xl text-[12px] font-semibold"
                                    style={{
                                      background: p.is_active ? C.dangerBg   : C.oliveBg,
                                      color:      p.is_active ? C.dangerText : C.olive,
                                      border:     p.is_active ? `1px solid ${C.dangerBorder}` : `1px solid ${C.oliveBorder}`,
                                    }}>
                              {p.is_active ? 'Hide' : 'Show'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ══ ORDERS ══ */}
            {tab === 'orders' && (
              <div>
                <h2 className="font-display font-bold text-[1.1rem] mb-5" style={{ color: C.text }}>
                  All Orders ({orders.length})
                </h2>
                {orders.length === 0 ? (
                  <Panel className="py-20 text-center">
                    <div className="text-4xl mb-3">🛍️</div>
                    <div className="font-display font-bold text-[1.1rem]" style={{ color: C.text }}>No orders yet</div>
                  </Panel>
                ) : (
                  <div className="flex flex-col gap-4">
                    {orders.map(o => (
                      <Panel key={o.id}>
                        <div className="flex flex-wrap items-start gap-4 mb-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="font-semibold text-[15px]" style={{ color: C.text }}>
                                {o.user_profiles?.name ?? 'Customer'}
                              </div>
                              <StatusPill status={o.status} />
                            </div>
                            <div className="text-[13px]" style={{ color: C.textMuted }}>
                              {fmtDate(o.ordered_at)} · {o.delivery_address}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="font-black text-[17px]" style={{ color: C.olive }}>{fmtMoney(o.total)}</div>
                            <div className="text-[12px]" style={{ color: C.textMuted }}>
                              incl. {fmtMoney(o.delivery_fee)} delivery
                            </div>
                          </div>
                        </div>

                        {/* Order items */}
                        <div className="flex flex-col gap-2 mb-4">
                          {o.order_items?.map(item => (
                            <div key={item.id} className="flex items-center justify-between p-2.5 rounded-xl"
                                 style={{ background: C.oliveBg }}>
                              <span className="text-[13px] font-medium" style={{ color: C.text }}>
                                {item.products?.name} × {item.quantity}
                              </span>
                              <span className="text-[13px] font-bold" style={{ color: C.olive }}>
                                {fmtMoney(item.total_price)}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Status actions */}
                        {o.status !== 'delivered' && o.status !== 'cancelled' && (
                          <div className="flex flex-wrap gap-2">
                            {ORDER_STATUSES.filter(s => s !== o.status && s !== 'pending').map(s => (
                              <button key={s} onClick={() => updateOrderStatus(o.id, s)}
                                      className="px-3 py-1.5 rounded-lg text-[12px] font-semibold capitalize"
                                      style={{ background: STATUS_STYLE[s]?.bg, color: STATUS_STYLE[s]?.text,
                                               border:`1px solid ${STATUS_STYLE[s]?.bg}` }}>
                                → {STATUS_STYLE[s]?.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </Panel>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ══ STATISTICS ══ */}
            {tab === 'stats' && (
              <div>
                <h2 className="font-display font-bold text-[1.1rem] mb-6" style={{ color: C.text }}>Sales Statistics</h2>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <StatCard icon="💰" label="Total Revenue"      value={fmtMoney(totalRevenue)}      accentBg="rgba(45,90,39,.10)" />
                  <StatCard icon="✅" label="Delivered Orders"   value={deliveredOrders.length}       accentBg="rgba(45,90,39,.10)" />
                  <StatCard icon="🛍️" label="All Orders"        value={orders.length}                accentBg="rgba(184,92,56,.10)" />
                  <StatCard icon="⭐" label="Avg Order Value"
                            value={deliveredOrders.length ? fmtMoney(totalRevenue / deliveredOrders.length) : '—'}
                            accentBg="rgba(124,58,237,.10)" />
                </div>

                {/* Order status breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <Panel>
                    <h3 className="font-display font-bold text-[1rem] mb-4" style={{ color: C.text }}>Order Status Breakdown</h3>
                    {ORDER_STATUSES.map(s => {
                      const count = orders.filter(o => o.status === s).length
                      const pct   = orders.length ? (count / orders.length) * 100 : 0
                      const style = STATUS_STYLE[s]
                      return (
                        <div key={s} className="flex items-center gap-3 mb-3">
                          <span className="text-[12px] font-semibold w-20 flex-shrink-0 capitalize" style={{ color: style?.text }}>{s}</span>
                          <div className="flex-1 h-2 rounded-full" style={{ background: C.oliveBg }}>
                            <div className="h-2 rounded-full transition-all" style={{ width:`${pct}%`, background: style?.text }} />
                          </div>
                          <span className="text-[12px] font-bold w-6 text-right" style={{ color: C.text }}>{count}</span>
                        </div>
                      )
                    })}
                  </Panel>

                  <Panel>
                    <h3 className="font-display font-bold text-[1rem] mb-4" style={{ color: C.text }}>Top Selling Products</h3>
                    {topProducts.length === 0 ? (
                      <div className="text-center py-6 text-[13px]" style={{ color: C.textMuted }}>No sales data yet.</div>
                    ) : (
                      topProducts.map(([name, qty], i) => (
                        <div key={name} className="flex items-center gap-3 mb-3">
                          <span className="text-[12px] font-bold w-5" style={{ color: C.textMuted }}>#{i+1}</span>
                          <span className="text-[13px] font-medium flex-1" style={{ color: C.text }}>{name}</span>
                          <span className="text-[12.5px] font-bold px-2.5 py-1 rounded-full"
                                style={{ background: C.oliveBg, color: C.olive }}>{qty} sold</span>
                        </div>
                      ))
                    )}
                  </Panel>
                </div>

                {/* Monthly revenue bars */}
                {monthlyRevenue.length > 0 && (
                  <Panel>
                    <h3 className="font-display font-bold text-[1rem] mb-5" style={{ color: C.text }}>Monthly Revenue (Delivered Orders)</h3>
                    <div className="flex items-end gap-3 h-40">
                      {monthlyRevenue.map(([month, revenue]) => (
                        <div key={month} className="flex-1 flex flex-col items-center gap-1.5">
                          <div className="text-[11px] font-bold" style={{ color: C.olive }}>
                            {fmtMoney(revenue).replace('₨','₨')}
                          </div>
                          <div className="w-full rounded-t-lg transition-all"
                               style={{ height:`${(revenue / maxRevenue) * 120}px`, background:`linear-gradient(180deg,${C.olive},#4a373a)`, minHeight:4 }} />
                          <div className="text-[10px] font-semibold" style={{ color: C.textMuted }}>{month}</div>
                        </div>
                      ))}
                    </div>
                  </Panel>
                )}
              </div>
            )}

            {/* ══ SETTINGS ══ */}
            {tab === 'settings' && settingsForm && (
              <div className="max-w-2xl">
                <h2 className="font-display font-bold text-[1.1rem] mb-5" style={{ color: C.text }}>Store Settings</h2>
                <Panel className="flex flex-col gap-4">
                  {[
                    { k:'name',         label:'Store Name',     type:'text'   },
                    { k:'phone',        label:'Phone',          type:'text'   },
                    { k:'email',        label:'Email',          type:'email'  },
                    { k:'city',         label:'City',           type:'text'   },
                    { k:'address',      label:'Address',        type:'text'   },
                    { k:'delivery_fee', label:'Delivery Fee (₨)', type:'number' },
                  ].map(({ k, label, type }) => (
                    <div key={k}>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: C.textMuted }}>{label}</label>
                      <input type={type} value={settingsForm[k]}
                             onChange={e => setSettingsForm(f => ({ ...f, [k]: e.target.value }))}
                             className={inputCls} style={inputSty} onFocus={fi} onBlur={fo} />
                    </div>
                  ))}
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: C.textMuted }}>Description</label>
                    <textarea value={settingsForm.description} rows={3}
                              onChange={e => setSettingsForm(f => ({ ...f, description: e.target.value }))}
                              className={inputCls} style={{ ...inputSty, resize:'none' }} onFocus={fi} onBlur={fo} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: C.textMuted }}>
                      Operating Hours (JSON)
                    </label>
                    <textarea value={settingsForm.operating_hours} rows={4}
                              onChange={e => setSettingsForm(f => ({ ...f, operating_hours: e.target.value }))}
                              className={`${inputCls} font-mono text-[12px]`} style={{ ...inputSty, resize:'vertical' }} />
                    <p className="text-[11px] mt-1" style={{ color: C.textMuted }}>
                      Example: {`{"Mon-Fri":"9am-9pm","Sat-Sun":"10am-6pm"}`}
                    </p>
                  </div>
                  <button onClick={saveSettings} disabled={saving}
                          className="w-full py-3 rounded-xl font-semibold text-[14px]"
                          style={{ background:`linear-gradient(135deg,${C.olive},#4a373a)`, color:'#fff' }}>
                    {saving ? 'Saving…' : 'Save Settings'}
                  </button>
                </Panel>
              </div>
            )}

          </>
        )}
      </main>
    </div>
  )
}
