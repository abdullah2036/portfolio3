import { AuroraMedia } from '../components/AuroraMedia'
import { ArrowCircle } from '../components/CTA'
import { useSectionLink } from '../components/Navigation'
import { RevealText } from '../components/RevealText'
import { SectionLabel } from '../components/SectionLabel'
import { gsap, useGsap } from '../lib/motion'
import { sceneTransition } from '../lib/frames'
import { digits, useLang } from '../lib/lang'
import { rich } from '../lib/text'
import { useCopy } from '../lib/useCopy'
import './About.css'

/**
 * 02 — About. The board's portrait card, scaled into a scene.
 * Enters through a large mask while the ribbon from the hero dissolves into
 * the portrait's own light; pins briefly while that light drifts, then settles.
 */
export function About() {
  const link = useSectionLink()
  const t = useCopy()
  const { lang } = useLang()

  const ref = useGsap<HTMLElement>(({ root, reduced, mobile }) => {
    const q = gsap.utils.selector(root)
    const visual = q('.about__visual')[0]

    if (reduced) {
      gsap.from(q('.about__copy > *'), { opacity: 0, duration: 1, stagger: 0.1, scrollTrigger: { trigger: root, start: 'top 70%' } })
      return
    }

    // brief hold (desktop): the scene is pinned while the portrait's light drifts across it.
    // Created first so the shared transitions below measure around the pin.
    if (!mobile) {
      const hold = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { id: 'about-pin', trigger: q('.about__stage')[0], start: 'top top', end: '+=55%', scrub: 0.7, pin: true, anticipatePin: 1 },
      })
      hold.fromTo(q('.about__light'), { xPercent: 0, yPercent: 0, opacity: 0.75 }, { xPercent: 16, yPercent: -12, opacity: 0.55 }, 0).to(q('.about__copy'), { y: -20, duration: 1 }, 0)
    }

    // the same enter / exit as every scene, plus the light arriving with the portrait
    sceneTransition(root)
    gsap.fromTo(
      q('.about__light'),
      { xPercent: -22, yPercent: 18, opacity: 0.2 },
      { xPercent: 0, yPercent: 0, opacity: 0.75, ease: 'none', immediateRender: false, scrollTrigger: { trigger: root, start: 'top bottom', end: 'top top', scrub: 0.7 } },
    )

    // copy settles independently of the image
    gsap.fromTo(
      q('.about__statement .rt-inner'),
      { yPercent: 105, opacity: 0 },
      { yPercent: 0, opacity: 1, duration: 1.3, stagger: 0.07, scrollTrigger: { trigger: q('.about__copy')[0], start: 'top 80%' } },
    )
    gsap.fromTo(q('.about__fact'), { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 1.1, stagger: 0.1, scrollTrigger: { trigger: q('.about__facts')[0], start: 'top 88%' } })
    gsap.fromTo(q('.about__fact-rule'), { scaleX: 0 }, { scaleX: 1, duration: 1.4, stagger: 0.1, scrollTrigger: { trigger: q('.about__facts')[0], start: 'top 88%' } })
    gsap.fromTo(q('.about__caption, .about__visual .arrow-circle'), { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 1.1, stagger: 0.1, scrollTrigger: { trigger: visual, start: 'top 30%' } })

  })

  return (
    <section ref={ref} className="about" id="about" data-stop="about-pin" aria-labelledby="about-title">
      <div className="about__stage">
        <div className="scene-content about__inner grid">
        <div className="about__visual" data-frame>
          <div className="about__media">
            <AuroraMedia k="aboutPortrait" className="about__img" sizes="(max-width: 767px) 100vw, 50vw" data-frame-media />
          </div>
          <AuroraMedia k="lightRibbons" className="about__light" sizes="40vw" alt="" />
          <div className="about__shade" aria-hidden />
          <SectionLabel className="about__tag">{t.about.label}</SectionLabel>
          <div className="about__overlay">
            <RevealText id="about-title" lines={t.about.title.map((l) => rich(l))} className="about__title display" start="top 75%" />
            <p className="about__caption body">{t.about.caption}</p>
            <a href="#philosophy" className="about__more" onClick={(e) => link(e, '#philosophy')} aria-label={t.about.more}>
              <ArrowCircle />
            </a>
          </div>
        </div>

        <div className="about__copy">
          <SectionLabel index={digits('04', lang)} rule>
            {t.about.index}
          </SectionLabel>
          <p className="about__statement display">
            {t.about.statement.map((s, i) => (
              <span className="rt-line" key={i}>
                <span className="rt-inner">{s} </span>
              </span>
            ))}
          </p>
          <dl className="about__facts">
            {t.about.facts.map((f) => (
              <div className="about__fact" key={f.k}>
                <span className="about__fact-rule" aria-hidden />
                <dt className="label">{f.k}</dt>
                <dd>{f.v}</dd>
              </div>
            ))}
          </dl>
        </div>
        </div>
      </div>
    </section>
  )
}
