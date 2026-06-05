import { useState } from 'react'
import { useFadeUp } from '../hooks/useScrollReveal.js'
import { Badge, BtnOlive, Pill, GlassCard } from '../components/ui/index.jsx'

const CATS = [
  { cat:'All' },
  { cat:'Food & Treats' },
  { cat:'Beds & Furniture' },
  { cat:'Wellness' },
  { cat:'Grooming' },
  { cat:'Toys' },
  { cat:'Supplements' },
]

const PRODUCTS = [
  { img:'/products/product_chicken_food.png',  label:'Organic',        lv:'badge',  name:'Raw Freeze-Dried Chicken',  sub:'MeowNaturals · 250g',  price:'₨ 890',   old:null,    cat:'Food & Treats',    bg:'linear-gradient(135deg,rgba(107,142,35,.07),rgba(107,142,35,.03))' },
  { img:'/products/product_cat_bed.png',       label:'Best Seller',    lv:'amber',  name:'Orthopedic Cat Bed',         sub:'PurrComfort · Large',  price:'₨ 2,400', old:'3,200', cat:'Beds & Furniture', bg:'linear-gradient(135deg,rgba(196,140,56,.07),rgba(196,140,56,.03))' },
  { img:'/products/product_calming_spray.png', label:'✓ Vet Approved', lv:'green',  name:'Catnip Calming Spray',       sub:'ZenPaws · 100ml',      price:'₨ 650',   old:null,    cat:'Wellness',         bg:'linear-gradient(135deg,rgba(107,142,35,.06),rgba(85,107,47,.03))'  },
  { img:'/products/product_shampoo.png',       label:'New',            lv:'badge',  name:'Hypoallergenic Shampoo',     sub:'CleanPaws · 200ml',    price:'₨ 480',   old:null,    cat:'Grooming',         bg:'linear-gradient(135deg,rgba(160,140,125,.08),rgba(160,140,125,.04))' },
  { img:'/products/product_toy_bundle.png',    label:'20% OFF',        lv:'amber',  name:'Premium Toy Bundle',         sub:'FunKitty · 6 pcs',     price:'₨ 1,120', old:'1,400', cat:'Toys',             bg:'linear-gradient(135deg,rgba(107,142,35,.07),rgba(85,107,47,.04))'  },
  { img:'/products/product_fish_oil.png',      label:'Vet Approved',   lv:'green',  name:'Omega-3 Fish Oil Supplement',sub:'PurrHealth · 60 caps', price:'₨ 720',   old:null,    cat:'Supplements',      bg:'linear-gradient(135deg,rgba(196,140,56,.07),rgba(196,140,56,.04))' },
  { img:'/products/product_wet_food.png',      label:'Grain-Free',     lv:'badge',  name:'Wet Food Variety Pack',      sub:'WildCat · 12 cans',    price:'₨ 1,650', old:'2,000', cat:'Food & Treats',    bg:'linear-gradient(135deg,rgba(107,142,35,.06),rgba(107,142,35,.03))' },
  { img:'/products/product_feather_wand.png',  label:'Interactive',    lv:'green',  name:'Feather Wand Toy',           sub:'PlayPaw · Premium',    price:'₨ 350',   old:null,    cat:'Toys',             bg:'linear-gradient(135deg,rgba(160,140,125,.06),rgba(160,140,125,.03))' },
]

export default function StorePage() {
  const headerRef = useFadeUp(0)
  const gridRef   = useFadeUp(0.1)
  const [cat,    setCat]    = useState('All')
  const [search, setSearch] = useState('')
  const [cart,   setCart]   = useState([])
  const [cartOpen, setCartOpen] = useState(false)

  const filtered = PRODUCTS.filter(p =>
    (cat === 'All' || p.cat === cat) &&
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  function addToCart(p) {
    setCart(c => {
      const ex = c.find(x => x.name === p.name)
      if (ex) return c.map(x => x.name === p.name ? { ...x, qty: x.qty + 1 } : x)
      return [...c, { ...p, qty: 1 }]
    })
  }

  const totalItems = cart.reduce((s, x) => s + x.qty, 0)
  const totalPrice = cart.reduce((s, x) => {
    const n = parseInt(x.price.replace(/[^\d]/g,''))
    return s + n * x.qty
  }, 0)

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 py-16">

      {/* Cart sidebar */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex" onClick={() => setCartOpen(false)}>
          <div className="flex-1" />
          <div className="w-full max-w-sm h-full flex flex-col overflow-hidden"
               style={{ background:'#F5EBE6', borderLeft:'1px solid #D7C9BD' }}
               onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 flex items-center justify-between"
                 style={{ borderBottom:'1px solid #D7C9BD' }}>
              <h2 className="font-display font-black text-[1.1rem] text-espresso">Cart ({totalItems})</h2>
              <button onClick={() => setCartOpen(false)} className="text-clay-muted text-xl">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3">
              {cart.length === 0
                ? <div className="text-center py-12 text-clay-muted">Your cart is empty</div>
                : cart.map(item => (
                  <div key={item.name} className="flex items-center gap-3 p-3 rounded-xl"
                       style={{ background:'rgba(255,255,255,.7)', border:'1px solid #D7C9BD' }}>
                    <img src={item.img} alt={item.name} className="w-12 h-12 object-contain rounded-lg"
                         style={{ background:item.bg }} />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-[13px] text-espresso truncate">{item.name}</div>
                      <div className="text-[11px] text-clay-muted">{item.price} × {item.qty}</div>
                    </div>
                    <button onClick={() => setCart(c => c.filter(x=>x.name!==item.name))}
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
                <button className="btn btn-olive w-full justify-center !py-3">
                  Proceed to Checkout →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div ref={headerRef} className="fade-up flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <Badge className="mb-3">UC-1.8 · Cat Store</Badge>
          <h1 className="font-display font-black text-espresso tracking-tight"
              style={{ fontSize:'clamp(2rem,4vw,3rem)' }}>
            Shop for your<br />feline companion.
          </h1>
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
          {CATS.map(c => (
            <button key={c.cat} onClick={() => setCat(c.cat)}
                    className="pill transition-all"
                    style={{
                      background: cat === c.cat ? '#556B2F' : 'rgba(255,255,255,.7)',
                      color:      cat === c.cat ? '#fff'    : '#4E342E',
                      border:     cat === c.cat ? 'none'    : '1px solid #D7C9BD',
                    }}>
              {c.cat}
            </button>
          ))}
        </div>

        {/* Products grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(p => (
            <GlassCard key={p.name} className="p-4 flex flex-col group cursor-pointer">
              {/* Product image */}
              <div className="w-full h-[130px] rounded-2xl overflow-hidden mb-3 flex items-center justify-center"
                   style={{ background: p.bg }}>
                <img
                  src={p.img}
                  alt={p.name}
                  className="w-full h-full object-contain p-3 transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              {p.lv === 'badge'
                ? <Badge style={{ fontSize:9 }}>{p.label}</Badge>
                : <Pill variant={p.lv}><span style={{ fontSize:9 }}>{p.label}</span></Pill>}
              <div className="font-bold text-[13px] text-espresso mt-1.5 mb-1 flex-1">{p.name}</div>
              <div className="text-[11px] text-clay-muted mb-3">{p.sub}</div>
              <div className="flex items-center justify-between mt-auto">
                <div>
                  <span className="font-black text-[15px] text-espresso">{p.price}</span>
                  {p.old && <span className="text-[11px] text-clay-muted line-through ml-1">₨ {p.old}</span>}
                </div>
                <button onClick={() => addToCart(p)}
                        className="btn btn-olive !py-1.5 !px-3 !text-[10px]">Add</button>
              </div>
            </GlassCard>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20">
            <div className="text-5xl mb-3">🛒</div>
            <div className="font-bold text-espresso">No products found</div>
            <div className="text-clay-muted text-[13px] mt-1">Try a different search or category</div>
          </div>
        )}
      </div>
    </section>
  )
}
