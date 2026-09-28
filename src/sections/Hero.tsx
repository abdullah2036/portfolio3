import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { me } from '../content/copy'
import { media, src, srcSet } from '../content/media'
import { AuroraPlate } from '../gl/auroraPlate'
import { gsap, isIntroDone, isMobile, markIntroDone, prefersReducedMotion } from '../lib/motion'
import { Navigation, useSectionLink } from '../components/Navigation'
import { GhostPill, PillCTA } from '../components/CTA'
import { SectionLabel } from '../components/SectionLabel'
import { useLang } from '../lib/lang'
import { rich } from '../lib/text'
import { useCopy } from '../lib/useCopy'
import './Hero.css'

const HERO = media.heroAurora
/** focal point of the plate — the figure on the horizon (phones centre on the figure) */
const FOCUS_DESKTOP: [number, number] = [0.3, 0.5]
const FOCUS_MOBILE: [number, number] = [0.46, 0.5]
/** the ice line in the plate, as a fraction of its height (drives the reflection in the shader) */
const HORIZON = 0.622

/** reuse whatever the <img> already chose from its srcset, so the plate downloads once */
async function heroUrl(img: HTMLImageElement | null) {
  if (img) {
    if (!img.complete) await new Promise((r) => img.addEventListener('load', r, { once: true }))
    if (img.currentSrc) return img.currentSrc
  }
  return src(HERO, 1672)
}

export function Hero() {
  const root = useRef<HTMLElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const [gl, setGl] = useState<'pending' | 'on' | 'off'>('pending')
  // decided once, before first paint, so nothing flashes ahead of the intro
  const [intro] = useState(() => !isIntroDone() && !prefersReducedMotion() && window.scrollY < 40)
  const link = useSectionLink()
  const t = useCopy()
  const { lang } = useLang()
  const [FOCUS] = useState<[number, number]>(() => (isMobile() ? FOCUS_MOBILE : FOCUS_DESKTOP))

  // ── WebGL plate ─────────────────────────────────────────
  const plateRef = useRef<AuroraPlate | null>(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let plate: AuroraPlate | null = null
    let cancelled = false
    try {
      plate = new AuroraPlate(canvas, { horizon: HORIZON, position: FOCUS, maxDpr: 1.5 })
      plate.frozen = prefersReducedMotion()
      plate.reveal = isIntroDone() || prefersReducedMotion() || window.scrollY > 40 ? 1 : 0
      plateRef.current = plate
      const timeout = new Promise<never>((_, reject) => setTimeout(() => reject(new Error('plate timeout')), 3500))
      Promise.race([heroUrl(imgRef.current).then((url) => plate!.load(url)), timeout])
        .then(() => {
          if (cancelled) return
          setGl('on')
          plate!.play()
        })
        .catch(() => !cancelled && setGl('off'))
    } catch {
      setGl('off')
    }
    return () => {
      cancelled = true
      plate?.dispose()
      plateRef.current = null
    }
  }, [FOCUS])

  // ── scroll: no pin, no framing — the scene simply drifts away with the page.
  //    The plate falls behind (parallax) while the type lifts off it and fades,
  //    and the plate's feathered lower edge carries on underneath the next section.
  useLayoutEffect(() => {
    const el = root.current
    if (!el || prefersReducedMotion()) return
    const q = gsap.utils.selector(el)
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: el, start: 'top top', end: 'bottom top', scrub: 0.7 },
      })
      tl.to(q('.hero__media'), { yPercent: 16, scale: 1.06, duration: 1 }, 0)
        .to(q('.hero__content'), { y: -90, opacity: 0, duration: 0.6, ease: 'power1.in' }, 0)
        .to(q('.hero__index'), { opacity: 0, duration: 0.25 }, 0)
        .to(q('.nav--hero'), { opacity: 0, duration: 0.3 }, 0.05)
        .to(q('.hero__dim'), { opacity: 0.45, duration: 1 }, 0)
        .to(q('.hero__index-line b'), { scaleX: 1, duration: 0.5 }, 0)
    }, el)
    return () => ctx.revert()
  }, [])

  // ── intro: wait for the plate so the light can be revealed properly
  useEffect(() => {
    const el = root.current
    if (!el || gl === 'pending') return
    const plate = plateRef.current
    const q = gsap.utils.selector(el)

    const ctx = gsap.context(() => {
      const playIntro = intro && !isIntroDone()

      // ── intro: black → stars → light rises → frame → nav → headline → copy → CTA
      if (playIntro) {
        const tl = gsap.timeline({
          defaults: { ease: 'aurora' },
          onComplete: () => {
            el.classList.remove('is-intro')
            markIntroDone()
          },
        })
        const reveal = { v: 0 }
        gsap.set(q('[data-intro]'), { opacity: 0 })
        gsap.set(q('.hero__title .rt-inner'), { y: 0, yPercent: 112 })
        el.classList.remove('is-intro')

        if (gl === 'on' && plate) {
          tl.to(reveal, { v: 1, duration: 3.6, ease: 'power1.inOut', onUpdate: () => void (plate.reveal = reveal.v) }, 0.15)
        } else {
          tl.fromTo(q('.hero__img'), { opacity: 0, scale: 1.06 }, { opacity: 1, scale: 1, duration: 3, ease: 'power2.out' }, 0.1)
        }
        tl.fromTo(q('.nav--hero .nav__logo'), { opacity: 0, letterSpacing: '0.9em' }, { opacity: 1, letterSpacing: '0.46em', duration: 1.8 }, 1.55)
          .fromTo(q('.nav--hero [data-nav], .nav--hero .nav__talk, .nav--hero .nav__menu'), { opacity: 0, y: -6 }, { opacity: 1, y: 0, duration: 1.2, stagger: 0.07 }, 1.7)
          .to(q('.hero__title .rt-inner'), { yPercent: 0, duration: 1.6, stagger: 0.14 }, 1.95)
          .fromTo(q('.hero__eyebrow'), { opacity: 0, letterSpacing: '0.5em' }, { opacity: 1, letterSpacing: '0.32em', duration: 1.6 }, 2.15)
          .fromTo(q('.hero__intro'), { opacity: 0, y: 10, filter: 'blur(6px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.4, clearProps: 'filter' }, 2.55)
          .fromTo(q('.hero__ctas'), { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 1.2 }, 2.95)
          .fromTo(q('.hero__index'), { opacity: 0 }, { opacity: 1, duration: 1.2 }, 3.1)
          .fromTo(q('.hero__index-line i'), { scaleX: 0 }, { scaleX: 1, duration: 1.6 }, 3.1)
          .set(q('[data-intro]'), { clearProps: 'opacity' })
      } else {
        if (plate) plate.reveal = 1
        el.classList.remove('is-intro')
        markIntroDone()
      }

    }, el)

    return () => {
      ctx.revert()
    }
  }, [gl, intro])

  const pos = `${FOCUS[0] * 100}% ${FOCUS[1] * 100}%`

  return (
    <section ref={root} className={`hero ${intro ? 'is-intro' : ''}`} id="top" data-stop="" aria-labelledby="hero-title">
      {/* full-bleed plate with a feathered lower edge that runs on beneath the next section */}
      <div className="hero__media">
        <img
          ref={imgRef}
          className="hero__img"
          src={src(HERO, 1672)}
          srcSet={srcSet(HERO)}
          sizes="(orientation: portrait) 170vh, 100vw"
          width={HERO.width}
          height={HERO.height}
          alt={HERO.alt[lang]}
          fetchPriority="high"
          decoding="async"
          style={{ objectPosition: pos, opacity: gl === 'on' ? 0 : undefined }}
        />
        <canvas ref={canvasRef} className={`hero__gl ${gl === 'on' ? 'is-on' : ''}`} aria-hidden />
        <div className="hero__dim" aria-hidden />
      </div>
      <div className="hero__shade" aria-hidden />

      <div className="hero__inner page">
        <Navigation variant="hero" />

        <div className="hero__content">
          <div className="hero__eyebrow-wrap">
            <SectionLabel className="hero__eyebrow">{t.hero.eyebrow.join(' · ')}</SectionLabel>
          </div>
          <h1 id="hero-title" className="hero__title display">
            {t.hero.title.map((l, i) => (
              <span className="rt-line" key={i}>
                <span className="rt-inner">{rich(l)}</span>
              </span>
            ))}
          </h1>
          <div className="hero__intro-wrap">
            <p className="hero__intro">{t.hero.intro}</p>
          </div>
          <div className="hero__cta-wrap">
            <div className="hero__ctas">
              <PillCTA className="hero__cta" href="#work" onClick={(e) => link(e, '#work')}>
                {t.hero.cta}
              </PillCTA>
              <GhostPill className="hero__resume" href={me.resume} target="_blank" rel="noreferrer">
                {t.hero.resume}
                <span className="hero__resume-arrow" aria-hidden>
                  ↗
                </span>
              </GhostPill>
            </div>
          </div>
        </div>

        <div className="hero__index label" aria-hidden>
          <span>{lang === 'ar' ? '٠١' : '01'}</span>
          <span className="hero__index-line">
            <i />
            <b />
          </span>
          <span>{lang === 'ar' ? '٠٣' : '03'}</span>
        </div>
      </div>
      <div id="hero-end" />
    </section>
  )
}
