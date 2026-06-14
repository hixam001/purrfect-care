const ITEMS = [
  'Veterinary Appointments',
  'AI Health Companion',
  '🏪 Curated Cat Store',
  'Medicine Database',
  '📋 Patient History',
  'Prescription Tracking',
  'Verified Partner Clinics',
  'Growing Cat Community',
  'Fully Verified Platform',
]

export default function MarqueeTicker() {
  const set = ITEMS.map((item, i) => (
    <span key={i} className="flex items-center gap-6 pr-6">
      <span className="t-mono text-[10px] text-clay-muted">{item}</span>
      <span className="text-clay text-[8px]">◆</span>
    </span>
  ))

  return (
    <div
      className="overflow-hidden py-3"
      style={{
        background:   'rgba(239,229,220,.6)',
        borderTop:    '1px solid #b8ceb5',
        borderBottom: '1px solid #b8ceb5',
      }}
    >
      {/* Double the set so the loop is seamless */}
      <div className="marquee-track">
        <div className="flex items-center whitespace-nowrap">{set}</div>
        <div className="flex items-center whitespace-nowrap" aria-hidden>{set}</div>
      </div>
    </div>
  )
}
