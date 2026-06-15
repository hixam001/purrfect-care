// Shared UI primitives for the Purrfect Care design system

// Badge/label using JetBrains Mono
export function Badge({ children, className = '' }) {
  return <span className={`t-label ${className}`}>{children}</span>
}

// Coloured pill
export function Pill({ children, variant = 'green', className = '' }) {
  const variants = {
    green: 'pill-green',
    amber: 'pill-amber',
    clay:  'pill-clay',
  }
  return (
    <span className={`pill ${variants[variant] ?? 'pill-green'} ${className}`}>
      {children}
    </span>
  )
}

// Primary olive button
export function BtnOlive({ children, href = '#', className = '', onClick }) {
  const base = `btn btn-olive ${className}`
  return href !== '#'
    ? <a href={href} className={base}>{children}</a>
    : <button className={base} onClick={onClick}>{children}</button>
}

// Outline button
export function BtnOutline({ children, href = '#', className = '', onClick }) {
  const base = `btn btn-outline ${className}`
  return href !== '#'
    ? <a href={href} className={base}>{children}</a>
    : <button className={base} onClick={onClick}>{children}</button>
}

// Ghost light button (for dark backgrounds)
export function BtnGhostLight({ children, href = '#', className = '' }) {
  return (
    <a href={href} className={`btn btn-ghost-light ${className}`}>{children}</a>
  )
}

// Animated pulse dot (online indicator)
export function PulseDot({ size = 'md', className = '' }) {
  const sz = size === 'sm' ? 'w-[7px] h-[7px]' : 'w-2 h-2'
  return <span className={`pulse-dot ${sz} ${className}`} />
}

// Progress bar with olive fill
export function ProgressBar({ pct = 50, colorClass = '', className = '' }) {
  return (
    <div className={`prog-track ${className}`}>
      <div
        className={`prog-fill ${colorClass}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

// Star rating
export function Stars({ rating = 5, count, className = '' }) {
  const full  = Math.floor(rating)
  const empty = 5 - full
  return (
    <span className={`stars ${className}`}>
      {'★'.repeat(full)}{'☆'.repeat(empty)}
      {count && <span className="text-clay-muted font-sans not-italic ml-1">({count})</span>}
    </span>
  )
}

// Card (oat background)
export function Card({ children, className = '', style }) {
  return (
    <div className={`card ${className}`} style={style}>
      {children}
    </div>
  )
}

// Frosted-glass card
export function GlassCard({ children, className = '', style }) {
  return (
    <div className={`card-glass ${className}`} style={style}>
      {children}
    </div>
  )
}

// Feature icon box
export function FeatIcon({ children, className = '' }) {
  return <div className={`feat-icon ${className}`}>{children}</div>
}

// Chat bubble — vet side
export function BubbleVet({ children }) {
  return <div className="bubble-vet">{children}</div>
}

// Chat bubble — user side
export function BubbleUser({ children }) {
  return <div className="bubble-user">{children}</div>
}

// Stat chip (rounded pill with blur)
export function StatChip({ children, className = '' }) {
  return <div className={`stat-chip ${className}`}>{children}</div>
}
