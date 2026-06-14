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
      className="text-[13px] no-underline transition-colors duration-200"
      style={{ color: 'rgba(58,44,45,.65)' }}
      onMouseOver={e => { e.currentTarget.style.color = '#5e4749' }}
      onMouseOut={e  => { e.currentTarget.style.color = 'rgba(58,44,45,.65)' }}
    >
      {label}
    </a>
  )
}

export default function Footer() {
  return (
    <footer
      style={{ background: '#c9dbc6', borderTop: '1px solid #b8ceb5' }}
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
                style={{ background: 'linear-gradient(135deg,#5e4749,#4a373a)' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dbe8d8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 7c0 3-2 5-5 6.5V20a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-6.5C6 12 4 10 4 7a4 4 0 0 1 8 0 4 4 0 0 1 8 0z"/>
                </svg>
              </div>
              <span className="font-display font-black text-[18px] tracking-tight" style={{ color:'#3a2c2d' }}>
                Purrfect<span style={{ color:'#5e4749' }}>Care</span>
              </span>
            </a>
            <p className="text-[13px] leading-[1.7] max-w-[220px] mb-5" style={{ color:'rgba(58,44,45,.70)' }}>
              All-in-one cat health platform — veterinary care, AI companion, and curated store, built with love.
            </p>
            <div className="flex gap-2 flex-wrap">
              {['Supabase','FastAPI','Gemini AI'].map(t => (
                <span key={t}
                  className="text-[11px] font-semibold px-3 py-1 rounded-full"
                  style={{ background:'rgba(94,71,73,.10)', border:'1px solid rgba(94,71,73,.20)', color:'#5e4749' }}>
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {COLS.map(col => (
            <div key={col.heading}>
              <div className="font-mono text-[10px] uppercase tracking-widest mb-4 font-semibold" style={{ color:'#5e4749' }}>{col.heading}</div>
              <div className="flex flex-col gap-2.5">
                {col.links.map(l => <FooterLink key={l} label={l} />)}
              </div>
            </div>
          ))}

        </div>

        {/* Divider */}
        <hr style={{ border:'0', borderTop:'1px solid #b8ceb5', marginBottom:'1.5rem' }} />

        {/* Bottom row */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-[12px]" style={{ color:'rgba(58,44,45,.60)' }}>
            © 2024 Purrfect Care. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            {['Privacy','Terms','Contact'].map(l => (
              <a key={l} href="#" className="text-[12px] no-underline transition-colors"
                style={{ color:'rgba(58,44,45,.55)' }}
                onMouseOver={e => { e.currentTarget.style.color = '#5e4749' }}
                onMouseOut={e  => { e.currentTarget.style.color = 'rgba(58,44,45,.55)' }}>
                {l}
              </a>
            ))}
          </div>
        </div>

      </div>
    </footer>
  )
}
