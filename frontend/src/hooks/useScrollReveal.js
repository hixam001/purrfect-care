import { useEffect, useRef } from 'react'

// Attach IntersectionObserver to elements with className "fade-up". | Adds "visible" class when element enters the viewport.
export function useScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    )

    const targets = document.querySelectorAll('.fade-up')
    targets.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [])
}

// Returns a ref that when attached, adds the fade-up class and | self-observes for the visible trigger.
export function useFadeUp(delay = 0) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    el.style.transitionDelay = `${delay}s`

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('visible')
          observer.disconnect()
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [delay])

  return ref
}
