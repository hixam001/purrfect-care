// Stepper — reusable multi-step progress indicator. | Props: | steps   : string[]   — step labels | current : number     — 0-indexed active step
export default function Stepper({ steps, current }) {
  return (
    <div className="w-full mb-8">
      <div className="flex items-center">
        {steps.map((label, i) => {
          const done    = i < current
          const active  = i === current
          const last    = i === steps.length - 1

          return (
            <div key={i} className="flex items-center flex-1 last:flex-none">
              {/* Circle */}
              <div className="flex flex-col items-center flex-shrink-0">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold transition-all duration-300"
                  style={{
                    background: done
                      ? '#5e4749'
                      : active
                        ? 'linear-gradient(135deg,#5e4749,#4a373a)'
                        : 'rgba(215,201,189,.5)',
                    color:      done || active ? '#fff' : '#A08C7D',
                    boxShadow:  active ? '0 0 0 4px rgba(85,107,47,.18)' : 'none',
                  }}
                >
                  {done ? '✓' : i + 1}
                </div>
                <span
                  className="mt-1.5 text-[10px] font-mono font-bold uppercase tracking-wide whitespace-nowrap"
                  style={{ color: active ? '#5e4749' : done ? '#5e4749' : '#A08C7D' }}
                >
                  {label}
                </span>
              </div>

              {/* Connector line */}
              {!last && (
                <div
                  className="flex-1 h-0.5 mx-2 rounded-full transition-all duration-500"
                  style={{ background: done ? '#5e4749' : 'rgba(215,201,189,.6)' }}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
