import { AuroraMedia } from '../components/AuroraMedia'
import { RevealText } from '../components/RevealText'
import { SectionLabel } from '../components/SectionLabel'
import { gsap, useGsap } from '../lib/motion'
import { sceneTransition } from '../lib/frames'
import { digits, useLang } from '../lib/lang'
import { rich } from '../lib/text'
import { useCopy } from '../lib/useCopy'
import './Philosophy.css'

/**
 * 05 — Philosophy. The quiet one: huge type, very little copy, and the hero's
 * horizon returning as a thin band of cropped light — the same place, seen
 * from much further away.
 */
export function Philosophy() {
  const t = useCopy()
  const { lang } = useLang()
  // the accented word carries the aurora mint as well as the hand
  const lines = t.philosophy.title.map((l) => rich(l, 'accent-hand accent'))

  const ref = useGsap<HTMLElement>(({ root, reduced }) => {
    const q = gsap.utils.selector(root)
    gsap.fromTo(q('.philo__body'), { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 1.3, scrollTrigger: { trigger: q('.philo__body')[0], start: 'top 85%' } })
    gsap.fromTo(q('.philo__p'), { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 1.2, stagger: 0.12, scrollTrigger: { trigger: q('.philo__principles')[0], start: 'top 85%' } })
    gsap.fromTo(q('.philo__p-rule'), { scaleX: 0 }, { scaleX: 1, duration: 1.6, stagger: 0.12, scrollTrigger: { trigger: q('.philo__principles')[0], start: 'top 85%' } })
    if (reduced) return
    q('.philo__scene').forEach((scene) => sceneTransition(scene as HTMLElement))
    // the horizon opens from a sliver to the full band, complete as its scene comes to rest
    const tl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: q('.philo__b')[0], start: 'top bottom', end: 'top 10%', scrub: 0.7 } })
    tl.fromTo(q('.philo__horizon-mask'), { clipPath: 'inset(46% 30% 46% 30% round 999px)' }, { clipPath: 'inset(0% 0% 0% 0% round 0px)' }, 0)
      .fromTo(q('.philo__horizon-img'), { scale: 1.45 }, { scale: 1.08 }, 0)
      .fromTo(q('.philo__horizon-glow'), { opacity: 0, scaleX: 0.3 }, { opacity: 1, scaleX: 1 }, 0)
  })

  return (
    <section ref={ref} className="philo" id="philosophy" aria-labelledby="philo-title">
      <div className="scene philo__scene" data-stop>
        <div className="scene-content philo__a">
          <SectionLabel index={digits('06', lang)} rule>
            {t.philosophy.label}
          </SectionLabel>
          <div className="philo__head grid">
            <RevealText id="philo-title" lines={lines} className="philo__title display" stagger={0.14} />
            <p className="philo__body body">{t.philosophy.body}</p>
          </div>
        </div>
      </div>

      <div className="scene philo__scene" data-stop>
        <div className="scene-content philo__b">
          <div className="philo__horizon" aria-hidden>
            <div className="philo__horizon-mask">
              <AuroraMedia k="heroAurora" className="philo__horizon-img" sizes="100vw" focus="46% 64%" alt="" />
            </div>
            <span className="philo__horizon-glow" />
          </div>
          <ol className="philo__principles grid">
            {t.philosophy.principles.map((p, i) => (
              <li className="philo__p" key={i}>
                <span className="philo__p-rule" aria-hidden />
                <span className="label">{digits(`0${i + 1}`, lang)}</span>
                <h3 className="philo__p-title display">{p.t}</h3>
                <p className="body">{p.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
