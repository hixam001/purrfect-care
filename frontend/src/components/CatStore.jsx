import { Link } from 'react-router-dom'
import { useFadeUp } from '../hooks/useScrollReveal.js'
import { Badge, GlassCard, Card, BtnOlive, Pill } from './ui/index.jsx'

const PRODUCTS = [
  {
    emoji: '🥩',
    label: { text: 'Organic', variant: 'label' },
    name:  'Raw Freeze-Dried Chicken',
    sub:   'MeowNaturals · 250g',
    price: '₨ 890',
    oldPrice: null,
    bg: 'linear-gradient(135deg,rgba(107,142,35,.1),rgba(107,142,35,.05))',
  },
  {
    emoji: '🛏️',
    label: { text: 'Best Seller', variant: 'amber' },
    name:  'Orthopedic Cat Bed',
    sub:   'PurrComfort · Large',
    price: '₨ 2,400',
    oldPrice: '3,200',
    bg: 'linear-gradient(135deg,rgba(196,140,56,.1),rgba(196,140,56,.05))',
  },
  {
    emoji: '🌿',
    label: { text: '✓ Vet Approved', variant: 'green' },
    name:  'Catnip Calming Spray',
    sub:   'ZenPaws · 100ml',
    price: '₨ 650',
    oldPrice: null,
    bg: 'linear-gradient(135deg,rgba(107,142,35,.08),rgba(85,107,47,.04))',
  },
  {
    emoji: '🧴',
    label: { text: 'New', variant: 'label' },
    name:  'Hypoallergenic Shampoo',
    sub:   'CleanPaws · 200ml',
    price: '₨ 480',
    oldPrice: null,
    bg: 'linear-gradient(135deg,rgba(160,140,125,.1),rgba(160,140,125,.05))',
  },
  {
    emoji: '🎁',
    label: { text: '20% OFF', variant: 'amber' },
    name:  'Premium Toy Bundle',
    sub:   'FunKitty · 6 pcs',
    price: '₨ 1,120',
    oldPrice: '1,400',
    bg: 'linear-gradient(135deg,rgba(107,142,35,.1),rgba(85,107,47,.06))',
  },
]

function ProductCard({ p }) {
  return (
    <GlassCard className="p-4">
      <div className="prod-img" style={{ background: p.bg }}>{p.emoji}</div>

      {p.label.variant === 'label'
        ? <span className="t-label text-[9px]">{p.label.text}</span>
        : <Pill variant={p.label.variant} className="text-[9px]">{p.label.text}</Pill>
      }

      <div className="font-bold text-[13px] text-espresso mt-1.5 mb-0.5">{p.name}</div>
      <div className="text-[11px] text-clay-muted mb-3">{p.sub}</div>

      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-1.5">
          <span className="font-black text-[15px] text-espresso">{p.price}</span>
          {p.oldPrice && (
            <span className="text-[11px] text-clay-muted line-through">₨ {p.oldPrice}</span>
          )}
        </div>
        <button className="btn btn-olive !py-1.5 !px-3 !text-[10px]">Add</button>
      </div>
    </GlassCard>
  )
}

export default function CatStore() {
  const leftRef  = useFadeUp(0)
  const rightRef = useFadeUp(0.1)

  return (
    <section id="store" className="max-w-7xl mx-auto px-4 md:px-8 py-24">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">

        {/* ── Left sticky info ──────────────────── */}
        <div ref={leftRef} className="fade-up lg:col-span-4 lg:sticky lg:top-24">
          <Badge className="mb-4">UC-1.8 · Cat Store</Badge>
          <h2
            className="font-display font-black tracking-tight text-espresso mt-3 mb-4 leading-tight"
            style={{ fontSize: 'clamp(1.8rem,3vw,2.6rem)' }}
          >
            Shop for your<br />feline companion.
          </h2>
          <p className="text-[15px] leading-[1.75] text-espresso-soft opacity-85 mb-7">
            Curated organic food, natural remedies, and premium accessories from verified local stores. Vet-approved. Delivered to your door.
          </p>

          {/* Feature list */}
          <div className="flex flex-col gap-3 mb-7">
            {[
              'Vet-approved product listings',
              'Allergy-aware recommendations for your cat',
              'Real-time order tracking',
            ].map(t => (
              <div key={t} className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-[15px] flex-shrink-0"
                  style={{ background: 'rgba(107,142,35,.12)' }}
                >✓</div>
                <span className="text-[14px] text-espresso-soft">{t}</span>
              </div>
            ))}
          </div>

          <Link to="/store"><BtnOlive>Browse all products →</BtnOlive></Link>
        </div>

        {/* ── Right: product grid ───────────────── */}
        <div
          ref={rightRef}
          className="fade-up lg:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-4"
        >
          {PRODUCTS.map(p => <ProductCard key={p.name} p={p} />)}

          {/* "View all" card */}
          <Card className="p-6 flex flex-col items-center justify-center text-center" style={{ minHeight: 200 }}>
            <div className="text-[36px] mb-2.5">🛒</div>
            <div className="font-display font-black text-[1rem] text-espresso mb-1">130+ more</div>
            <div className="text-[12px] text-clay-muted mb-4">From 20+ local stores</div>
            <Link to="/store"><BtnOlive className="!py-2 !px-4 !text-[10px]">View All</BtnOlive></Link>
          </Card>
        </div>

      </div>
    </section>
  )
}
