import { useEffect, useRef } from 'react'
import { me } from '../content/copy'
import { AuroraMedia } from '../components/AuroraMedia'
import { ArrowCircle, GhostPill, PillCTA } from '../components/CTA'
import { RevealText } from '../components/RevealText'
import { SectionLabel } from '../components/SectionLabel'
import { Footer } from '../components/Footer'
import { Ribbon } from '../gl/ribbon'
import { gsap, prefersReducedMotion, useGsap } from '../lib/motion'
import { sceneTransition } from '../lib/frames'
import { digits, useLang } from '../lib/lang'
import { rich } from '../lib/text'
import { useCopy } from '../lib/useCopy'
import './Contact.css'

/**
 * 07 — Contact. The board's "Let's Create Together" card as the closing scene:
 * one enormous visual — the edge of a planet rising — then the light thins
 * to a single horizon line before the footer.
 */
export function Contact() {
  const horizonRef = useRef<HTMLCanvasElement>(null)
  const t = useCopy()
  const { lang } = useLang()
  const links = [
    { key: 'email', label: t.contact.links.email, value: me.email, href: `mailto:${me.email}` },
    { key: 'linkedin', label: t.contact.links.linkedin, value: '/in/abdullah-bokhary', href: me.linkedin },
    { key: 'github', label: t.contact.links.github, value: '@abdullah2036', href: me.github },
  ]

  const ref = useGsap<HTMLElement>(({ root, reduced }) => {
    const q = gsap.utils.selector(root)
    gsap.fromTo(q('.contact__body, .contact__cta, .contact__links li'), { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 1.2, stagger: 0.08, scrollTrigger: { trigger: q('.contact__title')[0], start: 'top 60%' } })
    if (reduced) return
    // the last scene: enters like every other, and never leaves
    sceneTransition(root, { exit: false })
    const tl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: root, start: 'top bottom', end: 'top top', scrub: 0.7 } })
    tl.fromTo(q('.contact__planet'), { yPercent: 16, xPercent: 6, rotate: -5, scale: 1.14 }, { yPercent: 0, xPercent: 0, rotate: 0, scale: 1 }, 0).fromTo(
      q('.contact__glow'),
      { opacity: 0 },
      { opacity: 1 },
      0.3,
    )
  })

  // the closing horizon: the aurora reduced to one thin line of light
  useEffect(() => {
    const canvas = horizonRef.current
    if (!canvas || prefersReducedMotion()) return
    let ribbon: Ribbon | null = null
    try {
      ribbon = new Ribbon(canvas, {
        points: [
          [-0.02, 0.62],
          [0.25, 0.52],
          [0.55, 0.5],
          [0.8, 0.48],
          [1.02, 0.4],
        ],
        width: 16,
        twist: 0.35,
        phase: 0.2,
        seed: 5.1,
        intensity: 0.9,
        glow: 0.55,
      })
      ribbon.head = 0
      ribbon.render()
    } catch {
      return
    }
    const r = ribbon
    const s = { v: 0 }
    const tw = gsap.to(s, {
      v: 1,
      ease: 'none',
      scrollTrigger: { trigger: canvas, start: 'top bottom', end: 'bottom bottom', scrub: 1 },
      onUpdate: () => {
        r.head = 0.08 + s.v * 0.95
        r.time = s.v * 3
        r.invalidate()
      },
    })
    return () => {
      tw.scrollTrigger?.kill()
      tw.kill()
      r.dispose()
    }
  }, [])

  return (
    <section ref={ref} className="contact" id="contact" data-stop aria-labelledby="contact-title">
      <div className="page contact__frame">
        <div className="contact__card" data-frame>
          <div className="contact__visual" aria-hidden>
            <span className="contact__glow" />
            <AuroraMedia k="contactPlanet" className="contact__planet" sizes="(max-width: 767px) 100vw, 60vw" focus="60% 40%" alt="" />
          </div>
          <div className="contact__shade" aria-hidden />

          <div className="contact__content">
            <SectionLabel index={digits('07', lang)}>{t.contact.label}</SectionLabel>
            <RevealText id="contact-title" lines={t.contact.title.map((l) => rich(l))} className="contact__title display" stagger={0.12} start="top 78%" />
            <div className="contact__foot">
              <div>
                <p className="contact__body body">{t.contact.body}</p>
                <div className="contact__ctas">
                  <PillCTA className="contact__cta" href={`mailto:${me.email}`} arrow="up-right">
                    {t.contact.cta}
                  </PillCTA>
                  <GhostPill className="contact__resume" href={me.resume} target="_blank" rel="noreferrer" download>
                    {t.contact.resume}
                  </GhostPill>
                </div>
              </div>
              <ul className="contact__links">
                {links.map((s) => (
                  <li key={s.key}>
                    <a href={s.href} target={s.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
                      <span className="label">{s.label}</span>
                      <span className="contact__link-v latin" dir="ltr">
                        {s.value}
                      </span>
                      <ArrowCircle size="sm" dir="up-right" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="contact__end">
        <div className="contact__horizon" aria-hidden>
          <canvas ref={horizonRef} />
        </div>
        <Footer />
      </div>
    </section>
  )
}
