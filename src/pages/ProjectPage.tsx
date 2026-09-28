import { useEffect, useLayoutEffect, useRef } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { getProject, projects } from '../content/projects'
import { AuroraMedia } from '../components/AuroraMedia'
import { AnimatedImage } from '../components/AnimatedImage'
import { ArrowCircle, PillCTA } from '../components/CTA'
import { RevealText } from '../components/RevealText'
import { SectionLabel } from '../components/SectionLabel'
import { Footer } from '../components/Footer'
import { gsap, markIntroDone, ScrollTrigger, useGsap } from '../lib/motion'
import { useTransition } from '../lib/transition'
import { scrollToY } from '../lib/scroll'
import { digits, useLang } from '../lib/lang'
import { useCopy } from '../lib/useCopy'
import { media } from '../content/media'
import './ProjectPage.css'

export default function ProjectPage() {
  const { slug } = useParams()
  const project = getProject(slug)
  const { land, go, openProject } = useTransition()
  const heroRef = useRef<HTMLDivElement>(null)
  const t = useCopy()
  const { lang } = useLang()

  // arriving directly on a project URL shouldn't replay the home intro later
  useLayoutEffect(() => {
    markIntroDone()
  }, [])
  useLayoutEffect(() => {
    scrollToY(0, { immediate: true })
  }, [slug])

  // hand over from the flying card image once our own hero is decoded
  useEffect(() => {
    const frame = heroRef.current
    const img = frame?.querySelector('img')
    if (!frame || !img) return
    let done = false
    const finish = () => {
      if (done) return
      done = true
      land(frame)
      ScrollTrigger.refresh()
    }
    if (img.complete) finish()
    else {
      img.addEventListener('load', finish, { once: true })
      img.addEventListener('error', finish, { once: true })
    }
    const t = setTimeout(finish, 1500)
    return () => clearTimeout(t)
  }, [slug, land])

  const ref = useGsap<HTMLElement>(
    ({ root, reduced }) => {
      const q = gsap.utils.selector(root)
      gsap.fromTo(q('.proj__meta > div'), { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 1.1, stagger: 0.07, delay: 0.5 })
      gsap.fromTo(q('.proj__back'), { opacity: 0 }, { opacity: 1, duration: 1, delay: 0.3 })
      q('.proj__block').forEach((b) =>
        gsap.fromTo(b, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 1.2, scrollTrigger: { trigger: b, start: 'top 85%' } }),
      )
      if (reduced) return
      gsap.to(q('.proj__hero-img'), {
        yPercent: 10,
        scale: 1.06,
        ease: 'none',
        scrollTrigger: { trigger: heroRef.current, start: 'top top', end: 'bottom top', scrub: 0.6 },
      })
    },
    [slug],
  )

  if (!project) return <Navigate to="/" replace />

  const i = projects.indexOf(project)
  const next = projects[(i + 1) % projects.length]
  const tx = project.text[lang]
  const nx = next.text[lang]
  const pair = project.images.pair ?? []
  const n2 = (x: number) => digits(String(x).padStart(2, '0'), lang)

  return (
    <main id="main" ref={ref} className="proj" key={project.slug}>
      <div className="page">
        <div className="proj__bar" aria-hidden />

        <div ref={heroRef} className="proj__hero">
          <AuroraMedia k={project.cover} priority className="proj__hero-img" sizes="100vw" />
          <div className="proj__hero-shade" aria-hidden />
          <div className="proj__hero-text">
            <SectionLabel>
              {tx.category} · {digits(project.year, lang)}
            </SectionLabel>
            <RevealText as="h1" lines={[tx.title]} className="proj__title display" start="top 100%" delay={0.35} />
          </div>
        </div>

        <div className="proj__sub">
          <a
            href="/"
            className="proj__back label"
            onClick={(e) => {
              e.preventDefault()
              go('/', { hash: 'work' })
            }}
          >
            <ArrowCircle size="sm" dir="left" />
            {t.project.back}
          </a>
          <span className="label proj__count">
            {n2(i + 1)} / {n2(projects.length)}
          </span>
        </div>

        <dl className="proj__meta grid">
          <div>
            <dt className="label">{t.project.client}</dt>
            <dd>{tx.client}</dd>
          </div>
          <div>
            <dt className="label">{t.project.role}</dt>
            <dd>{tx.role}</dd>
          </div>
          <div>
            <dt className="label">{t.project.category}</dt>
            <dd>{tx.category}</dd>
          </div>
          <div>
            <dt className="label">{t.project.year}</dt>
            <dd>{digits(project.year, lang)}</dd>
          </div>
        </dl>

        <section className="proj__overview grid proj__block">
          <SectionLabel index={n2(1)} rule className="proj__ov-label">
            {t.project.overview}
          </SectionLabel>
          <p className="proj__lead display">{tx.overview}</p>
        </section>

        {project.images.wide && <AnimatedImage k={project.images.wide} className="proj__wide proj__block" sizes="100vw" screenshot />}

        <section className="proj__cols grid proj__block">
          <div>
            <SectionLabel index={n2(2)}>{t.project.challenge}</SectionLabel>
            <p className="body">{tx.challenge}</p>
          </div>
          <div>
            <SectionLabel index={n2(3)}>{t.project.approach}</SectionLabel>
            <p className="body">{tx.approach}</p>
          </div>
        </section>

        <section className={`proj__detail grid proj__block ${pair.length ? '' : 'is-solo'}`}>
          <div className="proj__stack">
            <SectionLabel index={n2(4)} rule>
              {t.project.stack}
            </SectionLabel>
            <p className="proj__stack-v display latin">{project.stack}</p>
            <div className="proj__links">
              {project.live && (
                <PillCTA href={project.live} target="_blank" rel="noreferrer" arrow="up-right">
                  {t.project.live}
                </PillCTA>
              )}
              {project.code && (
                <a href={project.code} target="_blank" rel="noreferrer" className="proj__code label">
                  {t.project.code}
                </a>
              )}
            </div>
          </div>
          {pair.length > 0 && (
            <div className="proj__shots">
              {pair.map((k) => (
                <AnimatedImage key={k} k={k} className="proj__shot" sizes="(max-width: 767px) 100vw, 40vw" drift={3} screenshot style={{ aspectRatio: `${media[k].width} / ${media[k].height}` }} />
              ))}
            </div>
          )}
        </section>

        <a
          href={`/work/${next.slug}`}
          className="proj__next frame is-hoverable"
          onClick={(e) => {
            e.preventDefault()
            openProject(next.slug, (e.currentTarget.querySelector('.animated-image__img') as HTMLImageElement) ?? null)
          }}
        >
          <div className="proj__next-text">
            <SectionLabel rule>{t.project.next}</SectionLabel>
            <p className="proj__next-title display">{nx.title}</p>
            <p className="body">{nx.descriptor}</p>
            <ArrowCircle size="lg" />
          </div>
          <AnimatedImage k={next.cover} className="proj__next-img" sizes="(max-width: 767px) 100vw, 50vw" drift={3} screenshot />
        </a>
      </div>
      <Footer />
    </main>
  )
}
