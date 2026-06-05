import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { Badge, BtnOlive, BtnOutline, Pill, Card, GlassCard } from '../components/ui/index.jsx'
import { useFadeUp } from '../hooks/useScrollReveal.js'

/* ── Quick-access feature tiles ── */
const TILES = [
  { icon:'📅', label:'Appointments',  desc:'Book & manage vet visits',        href:'/find-vets',    color:'rgba(107,142,35,.1)'  },
  { icon:'🐱', label:'My Cats',       desc:'Cat profiles & health records',   href:'/my-cats',      color:'rgba(196,140,56,.1)'  },
  { icon:'💬', label:'Vet Chat',      desc:'Real-time vet messaging',         href:'/chat',         color:'rgba(107,142,35,.1)'  },
  { icon:'🤖', label:'AI Companion',  desc:'Instant symptom triage',          href:'/ai-companion', color:'rgba(160,140,125,.1)' },
  { icon:'🏪', label:'Cat Store',     desc:'Organic food & accessories',      href:'/store',        color:'rgba(196,140,56,.1)'  },
  { icon:'💊', label:'Medicine DB',   desc:'Drug info & dosage guides',       href:'/medicines',    color:'rgba(107,142,35,.1)'  },
]

const UPCOMING = [
  { date:'14 Jun', time:'10:30 AM', vet:'Dr. Aisha Mirza', clinic:'Green Paw Clinic', cat:'Luna', type:'Vaccination', status:'green' },
  { date:'22 Jun', time:'3:00 PM',  vet:'Dr. Omar Khalid', clinic:'Feline Care Centre', cat:'Mochi', type:'Checkup',     status:'amber' },
]

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const headerRef = useFadeUp(0)
  const tilesRef  = useFadeUp(0.1)
  const apptRef   = useFadeUp(0.2)

  const displayName = user?.full_name ?? user?.email ?? 'Cat Parent'

  return (
    <div className="min-h-screen" style={{ background: '#F5EBE6' }}>

      {/* ── Dashboard Navbar ── */}
      <header className="sticky top-0 z-50 transition-shadow"
              style={{ background: 'rgba(245,235,230,.92)', backdropFilter: 'blur(18px)',
                       borderBottom: '1px solid #D7C9BD' }}>
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-6">
          <Link to="/" className="flex items-center gap-2.5 no-underline flex-shrink-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                 style={{ background: 'linear-gradient(135deg,#556B2F,#3D4F21)' }}>🐱</div>
            <span className="font-display font-black text-[18px] tracking-tight text-espresso">
              Purrfect<span className="text-olive">Care</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {[
              { label:'Find Vets',    href:'/find-vets'    },
              { label:'Cat Store',    href:'/store'        },
              { label:'AI Companion', href:'/ai-companion' },
              { label:'Medicines',    href:'/medicines'    },
            ].map(l => (
              <Link key={l.href} to={l.href} className="nav-a">{l.label}</Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full"
                 style={{ background: 'rgba(107,142,35,.1)', border: '1px solid rgba(107,142,35,.2)' }}>
              <span className="text-[13px]">👤</span>
              <span className="text-[12px] font-semibold text-olive">{displayName.split(' ')[0]}</span>
            </div>
            <button onClick={logout}
                    className="btn btn-outline !py-2 !px-4 !text-[11px]">
              Log out
            </button>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-10">

        {/* Welcome header */}
        <div ref={headerRef} className="fade-up mb-10">
          <Badge className="mb-3">Dashboard</Badge>
          <h1 className="font-display font-black text-espresso tracking-tight mb-2"
              style={{ fontSize: 'clamp(1.8rem,3vw,2.6rem)' }}>
            Welcome back, {displayName.split(' ')[0]} 👋
          </h1>
          <p className="text-clay-muted text-[15px]">Here's everything happening with your fur family today.</p>
        </div>

        {/* Feature tiles */}
        <div ref={tilesRef} className="fade-up grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
          {TILES.map(t => (
            <Link key={t.href} to={t.href} className="no-underline">
              <div className="card p-5 cursor-pointer group">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-3 transition-transform group-hover:scale-110"
                     style={{ background: t.color }}>
                  {t.icon}
                </div>
                <div className="font-bold text-[14px] text-espresso mb-1">{t.label}</div>
                <div className="text-[12px] text-clay-muted">{t.desc}</div>
              </div>
            </Link>
          ))}
        </div>

        {/* Upcoming appointments */}
        <div ref={apptRef} className="fade-up">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-[1.2rem] text-espresso">Upcoming Appointments</h2>
            <Link to="/find-vets">
              <BtnOutline className="!py-1.5 !px-4 !text-[10px]">Book new →</BtnOutline>
            </Link>
          </div>

          {UPCOMING.length === 0 ? (
            <Card className="p-10 text-center">
              <div className="text-4xl mb-3">📅</div>
              <div className="font-bold text-espresso mb-1">No upcoming appointments</div>
              <div className="text-clay-muted text-[13px] mb-4">Book a vet visit to get started</div>
              <Link to="/find-vets"><BtnOlive>Find a Vet</BtnOlive></Link>
            </Card>
          ) : (
            <div className="flex flex-col gap-3">
              {UPCOMING.map((a, i) => (
                <GlassCard key={i} className="p-5 flex items-center gap-5">
                  {/* Date badge */}
                  <div className="text-center flex-shrink-0 w-14">
                    <div className="font-mono font-black text-2xl leading-none text-olive">
                      {a.date.split(' ')[0]}
                    </div>
                    <div className="t-mono text-[9px] text-clay-muted">{a.date.split(' ')[1]}</div>
                  </div>
                  <div className="w-px self-stretch" style={{ background: '#D7C9BD' }} />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[14px] text-espresso">{a.vet}</div>
                    <div className="text-[12px] text-clay-muted">{a.clinic} · {a.time}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <Pill variant={a.status === 'green' ? 'green' : 'amber'}>
                      <span className="text-[10px]">🐱 {a.cat}</span>
                    </Pill>
                    <Pill variant="clay">
                      <span className="text-[10px]">{a.type}</span>
                    </Pill>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  )
}
