import { createContext, useCallback, useContext, useMemo, useRef, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { gsap, prefersReducedMotion } from './motion'

/**
 * Page transitions.
 *  - `go(path)`         : a slow dark crossfade between routes
 *  - `openProject(...)` : the clicked project image lifts off the card and
 *                         expands into the detail page's hero frame (shared element)
 */

interface Ctx {
  go: (to: string, opts?: { hash?: string }) => void
  openProject: (slug: string, image: HTMLImageElement | null) => void
  /** detail page calls this once its hero image is in place */
  land: (target: HTMLElement | null) => void
}

const TransitionContext = createContext<Ctx | null>(null)

const HOME_SCROLL_KEY = 'home-scroll'

export function saveHomeScroll() {
  try {
    sessionStorage.setItem(HOME_SCROLL_KEY, String(window.scrollY))
  } catch {
    /* storage unavailable */
  }
}
export function peekHomeScroll(): number | null {
  try {
    const v = sessionStorage.getItem(HOME_SCROLL_KEY)
    return v == null ? null : Number(v)
  } catch {
    return null
  }
}

/**
 * Section to scroll to once the home page has mounted. Navigations render in a
 * React transition, so the destination can't be measured from here.
 */
let pendingHash: string | null = null
export function peekPendingHash() {
  return pendingHash
}

/** Called once the home page has honoured the pending hash / saved position. */
export function clearArrival() {
  pendingHash = null
  try {
    sessionStorage.removeItem(HOME_SCROLL_KEY)
  } catch {
    /* storage unavailable */
  }
}

function pageX() {
  return Math.min(72, Math.max(16, window.innerWidth * 0.044))
}

/** Must match .proj__bar / .proj__hero in ProjectPage.css */
export function detailHeroRect() {
  const x = pageX()
  const top = window.innerWidth < 768 ? 76 : 96
  const h = Math.min(window.innerHeight * (window.innerWidth < 768 ? 0.58 : 0.74), 860)
  return { left: x, top, width: window.innerWidth - x * 2, height: h }
}

export function TransitionProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const veilRef = useRef<HTMLDivElement>(null)
  const cloneRef = useRef<HTMLDivElement | null>(null)
  const busy = useRef(false)

  const go = useCallback<Ctx['go']>(
    (to, opts) => {
      const veil = veilRef.current
      const finish = () => {
        pendingHash = opts?.hash ?? null
        navigate(to)
        if (veil) gsap.to(veil, { opacity: 0, duration: 0.9, delay: 0.25, ease: 'aurora', onComplete: () => void (veil.style.visibility = 'hidden') })
      }
      if (!veil || prefersReducedMotion()) return finish()
      if (busy.current) return
      veil.style.visibility = 'visible'
      gsap.fromTo(veil, { opacity: 0 }, { opacity: 1, duration: 0.55, ease: 'auroraInOut', onComplete: finish })
    },
    [navigate],
  )

  const openProject = useCallback<Ctx['openProject']>(
    (slug, image) => {
      const to = `/work/${slug}`
      if (location.pathname === '/') saveHomeScroll()
      if (!image || prefersReducedMotion() || busy.current) return go(to)
      busy.current = true
      const r = image.parentElement?.parentElement?.getBoundingClientRect() ?? image.getBoundingClientRect()
      const frame = image.closest('.animated-image') as HTMLElement | null
      const fr = frame?.getBoundingClientRect() ?? r
      const radius = frame ? getComputedStyle(frame).borderRadius : '16px'

      const clone = document.createElement('div')
      clone.className = 'transition-clone'
      const img = image.cloneNode() as HTMLImageElement
      const focus = getComputedStyle(image).objectPosition
      img.removeAttribute('style')
      img.style.objectPosition = focus
      img.loading = 'eager'
      clone.appendChild(img)
      Object.assign(clone.style, {
        left: `${fr.left}px`,
        top: `${fr.top}px`,
        width: `${fr.width}px`,
        height: `${fr.height}px`,
        borderRadius: radius,
      })
      document.body.appendChild(clone)
      cloneRef.current = clone

      const t = detailHeroRect()
      const main = document.getElementById('main')
      const tl = gsap.timeline({
        onComplete: () => navigate(to),
      })
      tl.to(main, { opacity: 0, duration: 0.5, ease: 'auroraInOut' }, 0)
      tl.to(document.querySelector('.floating-nav'), { opacity: 0, duration: 0.3 }, 0)
      tl.to(clone, { left: t.left, top: t.top, width: t.width, height: t.height, duration: 1.05, ease: 'auroraInOut' }, 0.05)
      tl.fromTo(img, { scale: 1.08 }, { scale: 1, duration: 1.05, ease: 'auroraInOut' }, 0.05)
    },
    [go, navigate],
  )

  const land = useCallback<Ctx['land']>((target) => {
    const clone = cloneRef.current
    busy.current = false
    gsap.set(document.getElementById('main'), { opacity: 1 })
    gsap.set(document.querySelector('.floating-nav'), { clearProps: 'opacity' })
    if (!clone) return
    cloneRef.current = null
    const r = target?.getBoundingClientRect()
    const tl = gsap.timeline({ onComplete: () => clone.remove() })
    if (r) tl.to(clone, { left: r.left, top: r.top, width: r.width, height: r.height, duration: 0.35, ease: 'aurora' })
    tl.to(clone, { opacity: 0, duration: 0.6, ease: 'aurora' }, '+=0.05')
  }, [])

  const value = useMemo(() => ({ go, openProject, land }), [go, openProject, land])

  return (
    <TransitionContext.Provider value={value}>
      {children}
      <div ref={veilRef} className="transition-veil" aria-hidden />
    </TransitionContext.Provider>
  )
}

export function useTransition() {
  const ctx = useContext(TransitionContext)
  if (!ctx) throw new Error('useTransition must be used inside TransitionProvider')
  return ctx
}
