import { useState, useEffect } from 'react'
import { Badge, BtnOlive } from './ui/index.jsx'

const NAV_LINKS = [
  { label: 'Platform',    href: '#features' },
  { label: 'How it works', href: '#how'     },
  { label: 'AI Companion', href: '#ai'       },
  { label: 'Cat Store',    href: '#store'    },
  { label: 'Find Vets',    href: '#vets'     },
]

export default function Navbar() {
  const [scrolled,       setScrolled]       = useState(false)
  const [activeSection,  setActiveSection]  = useState('')

  /* ── Navbar shadow on scroll ─────────────────── */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  /* ── Active section tracking ─────────────────── */
  useEffect(() => {
    const ids = NAV_LINKS.map(l => l.href.slice(1))
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(e => { if (e.isIntersecting) setActiveSection(e.target.id) })
      },
      { threshold: 0.4 }
    )
    ids.forEach(id => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])

  return (
    <header
      id="navbar"
      className="sticky top-0 z-50 transition-shadow duration-300"
      style={{
        background:      'rgba(219,232,216,.92)',
        backdropFilter:  'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        borderBottom:    '1px solid #b8ceb5',
        boxShadow:       scrolled ? '0 4px 24px rgba(61,38,22,.09)' : 'none',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-6">

        {/* Logo */}
        <a href="#" className="flex items-center gap-2.5 no-underline flex-shrink-0">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
               style={{ background: 'linear-gradient(135deg,#5e4749,#4a373a)' }}>
            🐱
          </div>
          <span className="font-display font-black text-[18px] tracking-tight text-espresso">
            Purrfect<span className="text-olive">Care</span>
          </span>
        </a>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-0.5">
          {NAV_LINKS.map(({ label, href }) => (
            <a
              key={href}
              href={href}
              className={`nav-a ${activeSection === href.slice(1) ? 'active' : ''}`}
            >
              {label}
            </a>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          
          <a href="#" className="nav-a text-olive font-semibold">Log in</a>
          <BtnOlive className="!py-2 !px-4 !text-[11px]">
            Get Started
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 6h8M6 2l4 4-4 4" stroke="currentColor" strokeWidth="1.6"
                    strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </BtnOlive>
        </div>

      </div>
    </header>
  )
}
