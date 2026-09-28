import { certs } from '../content/projects'
import { media, src } from '../content/media'
import { AuroraMedia } from '../components/AuroraMedia'
import { ArrowCircle } from '../components/CTA'
import { RevealText } from '../components/RevealText'
import { SectionLabel } from '../components/SectionLabel'
import { sceneTransition } from '../lib/frames'
import { digits, useLang } from '../lib/lang'
import { gsap, useGsap } from '../lib/motion'
import { rich } from '../lib/text'
import { useCopy } from '../lib/useCopy'
import './Certifications.css'

/** 05 — Certifications: the two credentials, shown as the documents themselves. */
export function Certifications() {
  const t = useCopy()
  const { lang } = useLang()

  const ref = useGsap<HTMLElement>(({ root, reduced }) => {
    const q = gsap.utils.selector(root)
    gsap.fromTo(q('.certs__intro, .certs__progress'), { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 1.2, stagger: 0.12, scrollTrigger: { trigger: root, start: 'top 70%' } })
    gsap.fromTo(q('.cert__meta > *'), { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 1, stagger: 0.05, scrollTrigger: { trigger: q('.certs__cards')[0], start: 'top 60%' } })
    if (!reduced) sceneTransition(root)
  })

  return (
    <section ref={ref} className="certs scene" id="certifications" data-stop aria-labelledby="certs-title">
      <div className="scene-content certs__grid grid">
        <div className="certs__head">
          <SectionLabel index={digits('05', lang)} rule>
            {t.certs.label}
          </SectionLabel>
          <RevealText id="certs-title" lines={t.certs.title.map((l) => rich(l))} className="certs__title display" />
          <p className="certs__intro body">{t.certs.intro}</p>
          <p className="certs__progress label">
            <span className="certs__dot" aria-hidden />
            {t.certs.inProgress}
          </p>
        </div>

        <ul className="certs__cards">
          {certs.map((c) => {
            const it = t.certs.items[c.key]
            const img = media[c.image]
            return (
              <li className="cert" key={c.key} data-frame>
                <article className="cert__card frame">
                  <a className="cert__doc" href={src(img)} target="_blank" rel="noreferrer" aria-label={`${t.certs.view}: ${it.name}`}>
                    <AuroraMedia k={c.image} sizes="(max-width: 767px) 92vw, 34vw" className="cert__img" data-frame-media />
                  </a>
                  <div className="cert__meta">
                    <p className="label cert__issuer">{it.issuer}</p>
                    <h3 className="cert__name display">{it.name}</h3>
                    <p className="cert__detail">{it.detail}</p>
                    <dl className="cert__facts">
                      <div>
                        <dt className="label">{t.certs.issued}</dt>
                        <dd>{it.date}</dd>
                      </div>
                      {c.credentialId && (
                        <div>
                          <dt className="label">{t.certs.id}</dt>
                          <dd className="latin">{c.credentialId}</dd>
                        </div>
                      )}
                    </dl>
                    <div className="cert__links">
                      <a href={src(img)} target="_blank" rel="noreferrer" className="cert__link label">
                        {t.certs.view}
                      </a>
                      {c.verify && (
                        <a href={c.verify} target="_blank" rel="noreferrer" className="cert__verify is-hoverable">
                          <span>{t.certs.verify}</span>
                          <ArrowCircle size="sm" dir="up-right" />
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
