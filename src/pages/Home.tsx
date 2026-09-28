import { useLayoutEffect } from 'react'
import { Hero } from '../sections/Hero'
import { About } from '../sections/About'
import { SelectedWork } from '../sections/SelectedWork'
import { Series } from '../sections/Series'
import { Certifications } from '../sections/Certifications'
import { Philosophy } from '../sections/Philosophy'
import { Contact } from '../sections/Contact'
import { gsap, onIntroDone, ScrollTrigger } from '../lib/motion'
import { clearArrival, peekHomeScroll, peekPendingHash } from '../lib/transition'
import { restingY, scrollToY } from '../lib/scroll'

export function Home() {
  // the page slowly deepens toward the end, as the light runs out
  useLayoutEffect(() => {
    const atm = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: '#main', start: 'top top', end: 'bottom bottom', scrub: 1.2 },
    })
    // the board's edge light drifts slowly across the whole scroll, then fades out before the contact scene
    atm.fromTo('.atmosphere', { backgroundPosition: '30% 20%', opacity: 0.5 }, { backgroundPosition: '70% 80%', opacity: 1, duration: 0.6 })
      .to('.atmosphere', { opacity: 0, duration: 0.4 })

    const tw = gsap.fromTo(
      document.body,
      { backgroundColor: '#060a1c' },
      {
        backgroundColor: '#020309',
        ease: 'none',
        scrollTrigger: { trigger: '#philosophy', start: 'top bottom', endTrigger: '#contact', end: 'bottom bottom', scrub: true },
      },
    )
    return () => {
      atm.scrollTrigger?.kill()
      atm.kill()
      tw.scrollTrigger?.kill()
      tw.kill()
      gsap.set(document.body, { clearProps: 'backgroundColor' })
    }
  }, [])

  // late-loading fonts change text heights; re-measure once they're in
  useLayoutEffect(() => {
    let alive = true
    document.fonts?.ready.then(() => alive && ScrollTrigger.refresh())
    return () => {
      alive = false
    }
  }, [])

  // arriving from a project: go to the requested section, or restore the reading position.
  // Pin-spacers settle over the first few refreshes, so re-apply the target on each one briefly.
  useLayoutEffect(() => {
    // peek, don't take: StrictMode mounts effects twice in development
    const hash = peekPendingHash()
    const saved = peekHomeScroll()
    if (!hash && saved == null) return
    const target = () => {
      const el = hash ? document.getElementById(hash) : null
      return el ? restingY(el) : (saved ?? 0)
    }
    const apply = () => scrollToY(target(), { immediate: true })
    let raf = 0
    ScrollTrigger.addEventListener('refresh', apply)
    const stop = window.setTimeout(() => {
      ScrollTrigger.removeEventListener('refresh', apply)
      clearArrival()
    }, 1500)
    const off = onIntroDone(() => {
      raf = requestAnimationFrame(() => {
        ScrollTrigger.refresh()
        apply()
      })
    })
    return () => {
      off()
      cancelAnimationFrame(raf)
      clearTimeout(stop)
      ScrollTrigger.removeEventListener('refresh', apply)
    }
  }, [])

  return (
    <main id="main">
      <div className="atmosphere" aria-hidden style={{ backgroundImage: 'url(/media/hero-ambient-480.webp)' }} />
      <Hero />
      <SelectedWork />
      <Series />
      <About />
      <Certifications />
      <Philosophy />
      <Contact />
    </main>
  )
}
