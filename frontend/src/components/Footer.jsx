import { Badge } from './ui/index.jsx'

const COLS = [
  {
    heading: 'Platform',
    links: ['Find a Vet','Book Appointment','AI Companion','Cat Store','Medicine Database'],
  },
  {
    heading: 'For Providers',
    links: ['Register Hospital','Vet Dashboard','Store Dashboard','API Docs'],
  },
  {
    heading: 'Company',
    links: ['About','Blog','Careers','Privacy Policy','Terms of Service'],
  },
]

function FooterLink({ label }) {
  return (
    <a
      href="#"
      className="text-[13px] text-clay-muted no-underline transition-colors duration-200"
      onMouseOver={e => { e.currentTarget.style.color = '#556B2F' }}
      onMouseOut={e  => { e.currentTarget.style.color = '#A08C7D' }}
    >
      {label}
    </a>
  )
}

export default function Footer() {
  return (
    <footer
      style={{ background: '#EFE5DC', borderTop: '1px solid #D7C9BD' }}
      className="py-16 px-4 md:px-8"
    >
      <div className="max-w-7xl mx-auto">

        {/* Main grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-12">

          {/* Brand */}
          <div className="col-span-2">
            <a href="#" className="flex items-center gap-2.5 no-underline mb-4">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                style={{ background: 'linear-gradient(135deg,#556B2F,#3D4F21)' }}
              >
                🐱
              </div>
              <span className="font-display font-black text-[18px] tracking-tight text-espresso">
                Purrfect<span className="text-olive">Care</span>
              </span>
            </a>
            <p className="text-[13px] text-clay-muted leading-[1.7] max-w-[220px] mb-5">
              Organic apothecary meets feline sanctuary. All-in-one cat health platform built with love.
            </p>
            <div className="flex gap-2">
              <Badge>v1.0.0</Badge>
              <Badge>Beta</Badge>
            </div>
          </div>

          {/* Link columns */}
          {COLS.map(col => (
            <div key={col.heading}>
              <div className="t-mono text-[10px] text-olive mb-4">{col.heading}</div>
              <div className="flex flex-col gap-2.5">
                {col.links.map(l => <FooterLink key={l} label={l} />)}
              </div>
            </div>
          ))}

        </div>

        {/* Divider */}
        <hr className="section-divider mb-6" />

        {/* Bottom row */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-[12px] text-clay-muted">
            © 2024 Purrfect Care. Built with 🐾 and therapeutic olive.
          </p>
          <div className="flex items-center gap-2">
            <span className="t-mono text-[10px] text-clay-muted">Powered by</span>
            <Badge>Supabase</Badge>
            <Badge>FastAPI</Badge>
            <Badge>OpenAI</Badge>
          </div>
        </div>

      </div>
    </footer>
  )
}
