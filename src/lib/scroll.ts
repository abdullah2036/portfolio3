import { prefersReducedMotion, ScrollTrigger } from './motion'

/**
 * Scrolling is native: the wheel, trackpad and touch behave exactly as the
 * reader's device intends. Motion is attached to scroll with a short scrub
 * lag instead (see lib/frames.ts), so transitions still feel smooth without
 * ever moving the page on their own.
 *
 * `data-stop` marks where a section's composed frame rests; nav links scroll
 * there. `data-stop="<id>"` refers to a pinned ScrollTrigger (its pin start).
 */

function clampScroll(y: number) {
  return Math.max(0, Math.min(y, ScrollTrigger.maxScroll(window)))
}

/** Scroll position at which an element's section is composed. */
export function restingY(el: HTMLElement) {
  const host = el.matches('[data-stop]') ? el : (el.querySelector<HTMLElement>('[data-stop]') ?? el.closest<HTMLElement>('[data-stop]') ?? el)
  const id = host.dataset.stop
  const st = id ? ScrollTrigger.getById(id) : undefined
  return clampScroll(st ? st.start : host.getBoundingClientRect().top + window.scrollY)
}

export function scrollToY(y: number, opts: { immediate?: boolean } = {}) {
  window.scrollTo({ top: y, behavior: opts.immediate || prefersReducedMotion() ? 'auto' : 'smooth' })
}

export function lockScroll(locked: boolean) {
  document.documentElement.style.overflow = locked ? 'hidden' : ''
}
