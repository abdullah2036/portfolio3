import { useLayoutEffect, useRef, useSyncExternalStore } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/** The house curve: long, quiet deceleration. No overshoot anywhere on the site. */
gsap.registerEase('aurora', (t) => 1 - Math.pow(1 - t, 3.6))
gsap.registerEase('auroraInOut', (t) => (t < 0.5 ? 8 * t ** 4 : 1 - Math.pow(-2 * t + 2, 4) / 2))
gsap.defaults({ ease: 'aurora', duration: 1.1 })

ScrollTrigger.config({ ignoreMobileResize: true })

export { gsap, ScrollTrigger }

const RM = '(prefers-reduced-motion: reduce)'
const MOBILE = '(max-width: 767px)'

function subscribeMQ(q: string) {
  return (cb: () => void) => {
    const mq = window.matchMedia(q)
    mq.addEventListener('change', cb)
    return () => mq.removeEventListener('change', cb)
  }
}

export const prefersReducedMotion = () => typeof window !== 'undefined' && window.matchMedia(RM).matches
export const isMobile = () => typeof window !== 'undefined' && window.matchMedia(MOBILE).matches
export const isFinePointer = () => typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches

export function useReducedMotion() {
  return useSyncExternalStore(subscribeMQ(RM), prefersReducedMotion, () => false)
}

/**
 * Scoped GSAP context bound to a React ref; everything created inside is
 * reverted on unmount (ScrollTriggers, tweens, inline styles).
 */
export function useGsap<T extends HTMLElement>(
  setup: (ctx: { root: T; reduced: boolean; mobile: boolean }) => void | (() => void),
  deps: unknown[] = [],
) {
  const ref = useRef<T>(null)
  useLayoutEffect(() => {
    const root = ref.current
    if (!root) return
    let cleanup: void | (() => void)
    const ctx = gsap.context(() => {
      cleanup = setup({ root, reduced: prefersReducedMotion(), mobile: isMobile() })
    }, root)
    return () => {
      cleanup?.()
      ctx.revert()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return ref
}

/** Resolves once the intro sequence has handed the stage to the page. */
let introDone = false
const introListeners = new Set<() => void>()
export function markIntroDone() {
  introDone = true
  introListeners.forEach((l) => l())
  introListeners.clear()
}
export function onIntroDone(cb: () => void) {
  if (introDone) cb()
  else introListeners.add(cb)
  return () => {
    introListeners.delete(cb)
  }
}
export function isIntroDone() {
  return introDone
}

