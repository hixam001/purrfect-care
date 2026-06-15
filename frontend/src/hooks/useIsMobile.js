import { useState, useEffect } from 'react'

// Returns true when the viewport width is < 768px (Tailwind's `md` breakpoint). | Reactive — updates on window resize.
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const handler = (e) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    setIsMobile(mq.matches)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return isMobile
}
