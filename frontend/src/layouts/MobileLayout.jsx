import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/* SVG icon components — no emoji */
const IconHome = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/>
    <polyline points="9 21 9 12 15 12 15 21"/>
  </svg>
)
const IconPaw = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="7" cy="8" r="2"/><circle cx="17" cy="8" r="2"/>
    <circle cx="4.5" cy="14" r="1.5"/><circle cx="19.5" cy="14" r="1.5"/>
    <path d="M12 17c-3 0-6 1.5-6 4h12c0-2.5-3-4-6-4z"/>
  </svg>
)
const IconHospital = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 21V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14"/>
    <path d="M3 21h18"/>
    <rect x="9" y="11" width="6" height="10" rx="1"/>
    <line x1="12" y1="7" x2="12" y2="7.01"/>
    <line x1="9" y1="7" x2="15" y2="7"/>
  </svg>
)
const IconAI = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    <circle cx="9" cy="10" r="1" fill="currentColor"/><circle cx="12" cy="10" r="1" fill="currentColor"/><circle cx="15" cy="10" r="1" fill="currentColor"/>
  </svg>
)
const IconStore = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <path d="M16 10a4 4 0 0 1-8 0"/>
  </svg>
)
const IconSettings = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
)

const TABS = [
  { to: '/dashboard',    Icon: IconHome,  label: 'Home'    },
  { to: '/my-cats',      Icon: IconPaw,   label: 'My Cats' },
  { to: '/find-vets',    Icon: IconHospital, label: 'Hospitals' },
  { to: '/ai-companion', Icon: IconAI,    label: 'AI Chat' },
  { to: '/store',        Icon: IconStore, label: 'Store'   },
]

/**
 * MobileLayout — wraps every authenticated mobile screen.
 * Sticky header + fixed 5-tab bottom nav bar.
 */
export default function MobileLayout({ children, title }) {
  const { user } = useAuth()
  const navigate  = useNavigate()
  const { pathname } = useLocation()
  const firstName = user?.name?.split(' ')[0] ?? 'there'

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: '#dbe8d8' }}>

      {/* ── Top header ── */}
      <header
        className="sticky top-0 z-40 flex items-center justify-between px-4 py-3"
        style={{ backgroundColor: 'rgba(219,232,216,.96)', borderBottom: '1px solid #b8ceb5' }}
      >
        <div>
          <p className="font-display font-bold text-lg leading-tight" style={{ color: '#3a2c2d' }}>
            {title ?? `Hello, ${firstName}`}
          </p>
          <p className="text-xs" style={{ color: '#7a5e60', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            Purrfect Care
          </p>
        </div>
        <button
          onClick={() => navigate('/settings')}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'rgba(94,71,73,0.09)', border: '1px solid rgba(94,71,73,0.20)', color: '#5e4749' }}
          aria-label="Settings"
        >
          <IconSettings />
        </button>
      </header>

      {/* ── Page content ── */}
      <main className="flex-1 overflow-y-auto" style={{ paddingBottom: 72 }}>
        {children}
      </main>

      {/* ── Bottom tab bar ── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 flex"
        style={{
          backgroundColor: 'rgba(219,232,216,.97)',
          borderTop: '1px solid #b8ceb5',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {TABS.map(t => {
          const active = pathname === t.to || (t.to !== '/' && pathname.startsWith(t.to))
          return (
            <NavLink
              key={t.to}
              to={t.to}
              className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 relative"
              style={{
                color: active ? '#5e4749' : '#7a5e60',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                textDecoration: 'none',
              }}
            >
              {/* Active indicator line */}
              {active && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full"
                  style={{ backgroundColor: '#5e4749' }}
                />
              )}
              <t.Icon />
              <span
                className="text-[10px] font-semibold leading-none"
                style={{ color: active ? '#5e4749' : '#7a5e60' }}
              >
                {t.label}
              </span>
            </NavLink>
          )
        })}
      </nav>
    </div>
  )
}
