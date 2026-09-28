import { useRef, type MouseEvent } from 'react'
import type { Project } from '../content/projects'
import { media, src } from '../content/media'
import { useTransition } from '../lib/transition'
import { digits, useLang } from '../lib/lang'
import { useCopy } from '../lib/useCopy'
import { AnimatedImage } from './AnimatedImage'
import { ArrowCircle } from './CTA'
import './ProjectCard.css'

interface Props {
  project: Project
  index: number
  variant?: 'feature' | 'default'
  aspect?: string
  sizes?: string
  className?: string
}

/**
 * The board's PROJECTS card: a hairline frame, a label row, an inset image
 * with its own radius, then title, descriptor and the circular arrow.
 */
export function ProjectCard({ project: p, index, variant = 'default', aspect, sizes, className = '' }: Props) {
  const { openProject } = useTransition()
  const { lang } = useLang()
  const t = useCopy()
  const tx = p.text[lang]
  const cardRef = useRef<HTMLAnchorElement>(null)

  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
    e.preventDefault()
    const img = cardRef.current?.querySelector<HTMLImageElement>('.animated-image__img') ?? null
    openProject(p.slug, img)
  }

  const cover = media[p.cover]
  const n = digits(String(index + 1).padStart(2, '0'), lang)

  return (
    <article className={`pcard pcard--${variant} ${className}`} data-frame>
      <a ref={cardRef} href={`/work/${p.slug}`} onClick={onClick} className="pcard__link frame is-hoverable" aria-label={`${tx.title} — ${tx.category}, ${p.year}`}>
        <span className="pcard__spill" aria-hidden style={{ backgroundImage: `url(${src(cover, cover.widths[0])})` }} />
        <div className="pcard__top label">
          <span>
            <span className="pcard__n">{n}</span>
            {tx.category}
          </span>
          <span>{digits(p.year, lang)}</span>
        </div>
        <AnimatedImage k={p.cover} className="pcard__media" sizes={sizes} parallax={variant === 'feature' ? 8 : 6} drift={3} reveal={false} frameMedia screenshot style={{ aspectRatio: aspect }} />
        <div className="pcard__body">
          <div className="pcard__text">
            <h3 className="pcard__title display">{tx.title}</h3>
            <p className="pcard__desc">{tx.descriptor}</p>
          </div>
          {variant === 'feature' && (
            <dl className="pcard__meta">
              <div>
                <dt className="label">{t.project.role}</dt>
                <dd>{tx.role}</dd>
              </div>
              <div>
                <dt className="label">{t.project.stack}</dt>
                <dd className="latin">{p.stack}</dd>
              </div>
            </dl>
          )}
          <ArrowCircle size={variant === 'feature' ? 'lg' : 'md'} />
        </div>
      </a>
    </article>
  )
}
