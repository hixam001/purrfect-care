// AppLayout — shared shell used by all inner pages (not auth pages). | Renders the Navbar + main content + Footer.
import { Link, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import Footer from '../components/Footer.jsx'

const NAV_LINKS = [
  { label: 'Platform',    href: '/#features' },
  { label: 'Find Vets',   href: '/find-vets' },
  { label: 'Cat Store',   href: '/store'     },
  { label: 'AI Companion',href: '/ai-companion' },
  { label: 'Medicines',   href: '/medicines' },
]

export default function AppLayout() {
  const { isLoggedIn, logout, user } = useAuth()
  const { pathname } = useLocation()

  return (
    <div className="relative overflow-x-hidden" style={{ backgroundColor: '#dbe8d8' }}>
      {/* Ambient blobs */}
      <div className="fixed top-0 right-0 pointer-events-none" style={{ width:600, height:600, borderRadius:'50%',
           background:'radial-gradient(circle, rgba(94,71,73,.13), transparent 70%)', transform:'translate(30%,-30%)', zIndex:0 }} />
      <div className="fixed bottom-0 left-0 pointer-events-none" style={{ width:500, height:500, borderRadius:'50%',
           background:'radial-gradient(circle, rgba(196,140,56,.1), transparent 70%)', transform:'translate(-30%,30%)', zIndex:0 }} />

      <div className="relative z-10">
        {/* ── Navbar ── */}
        <header id="navbar" className="sticky top-0 z-50"
                style={{ background:'rgba(219,232,216,.92)', backdropFilter:'blur(18px)',
                         WebkitBackdropFilter:'blur(18px)', borderBottom:'1px solid #b8ceb5',
                         boxShadow:'0 1px 0 rgba(94,71,73,.06)' }}>
          <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-6">

            <Link to="/" className="flex items-center gap-2.5 no-underline flex-shrink-0">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                   style={{ background:'linear-gradient(135deg,#5e4749,#4a373a)' }}>🐱</div>
              <span className="font-display font-black text-[18px] tracking-tight text-espresso">
                Purrfect<span className="text-olive">Care</span>
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-0.5">
              {NAV_LINKS.map(({ label, href }) => (
                <Link key={href} to={href}
                      className={`nav-a ${pathname === href ? 'active' : ''}`}>
                  {label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-3">

              {isLoggedIn ? (
                <>
                  <Link to="/dashboard" className="nav-a text-olive font-semibold">Dashboard</Link>
                  <Link
                    to="/settings"
                    className="btn btn-outline !py-2 !px-4 !text-[11px]"
                    title="Settings"
                  >
                    Settings
                  </Link>
                  <button onClick={logout} className="btn btn-outline !py-2 !px-4 !text-[11px]">Log out</button>
                </>
              ) : (
                <>
                  <Link to="/login" className="nav-a text-olive font-semibold">Log in</Link>
                  <Link to="/register" className="btn btn-olive !py-2 !px-4 !text-[11px]">
                    Get Started →
                  </Link>
                </>
              )}
            </div>
          </div>
        </header>

        {/* ── Page content ── */}
        <main><Outlet /></main>

        <Footer />
      </div>
    </div>
  )
}
