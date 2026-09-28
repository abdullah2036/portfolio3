import { projects } from '../content/projects'
import { ProjectCard } from '../components/ProjectCard'
import { RevealText } from '../components/RevealText'
import { SectionLabel } from '../components/SectionLabel'
import { sceneTransition } from '../lib/frames'
import { digits, useLang } from '../lib/lang'
import { gsap, useGsap } from '../lib/motion'
import { rich } from '../lib/text'
import { useCopy } from '../lib/useCopy'
import './SelectedWork.css'

/**
 * 02 — Selected Work. Three projects, two scenes:
 *   1. heading + the cinematic feature
 *   2. a wide card beside a shorter, bottom-aligned one
 */
export function SelectedWork() {
  const t = useCopy()
  const { lang } = useLang()
  const [feature, a, b] = projects
  const years = projects.map((p) => p.year)

  const ref = useGsap<HTMLElement>(({ root, reduced }) => {
    const q = gsap.utils.selector(root)
    gsap.fromTo(q('.work__intro-copy'), { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 1.2, scrollTrigger: { trigger: q('.work__head')[0], start: 'top 85%' } })
    if (reduced) return
    q('.work__scene').forEach((scene) => sceneTransition(scene as HTMLElement))
  })

  return (
    <section ref={ref} className="work" id="work" aria-labelledby="work-title">
      <div className="scene work__scene" data-stop>
        <div className="scene-content work__intro">
          <header className="work__head grid">
            <SectionLabel index={digits('02', lang)} rule className="work__label">
              {t.work.label}
            </SectionLabel>
            <RevealText id="work-title" lines={[rich(t.work.title)]} className="work__title display" />
            <div className="work__intro-copy">
              <p className="body">{t.work.intro}</p>
              <p className="label work__count">{t.work.count(projects.length, Math.min(...years), Math.max(...years))}</p>
            </div>
          </header>
          {feature && <ProjectCard project={feature} index={0} variant="feature" sizes="100vw" className="work__feature" />}
        </div>
      </div>

      {(a || b) && (
        <div className="scene work__scene" data-stop>
          <div className="scene-content work__row grid">
            {a && <ProjectCard project={a} index={1} className="work__a" sizes="(max-width: 767px) 100vw, 58vw" />}
            {b && <ProjectCard project={b} index={2} className="work__b" sizes="(max-width: 767px) 100vw, 40vw" />}
          </div>
        </div>
      )}
    </section>
  )
}
