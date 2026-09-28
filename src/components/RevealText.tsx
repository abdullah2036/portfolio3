import { createElement, type CSSProperties, type ReactNode } from 'react'
import { gsap, useGsap } from '../lib/motion'

type Tag = 'h1' | 'h2' | 'h3' | 'p' | 'div' | 'span'

interface Props {
  lines: readonly ReactNode[]
  as?: Tag
  className?: string
  style?: CSSProperties
  /** 'scroll' animates itself when it enters; 'manual' leaves `.rt-inner` to a parent timeline */
  mode?: 'scroll' | 'manual'
  delay?: number
  stagger?: number
  start?: string
  id?: string
}

/**
 * Line-masked headline. Each line slides up out of its own clipping mask —
 * the "printed, then revealed" feel of the board's display type.
 */
export function RevealText({ lines, as = 'h2', className = '', style, mode = 'scroll', delay = 0, stagger = 0.09, start = 'top 86%', id }: Props) {
  const ref = useGsap<HTMLElement>(({ root, reduced }) => {
    if (mode !== 'scroll') return
    const inner = root.querySelectorAll('.rt-inner')
    if (reduced) {
      gsap.from(root, { opacity: 0, duration: 0.8, scrollTrigger: { trigger: root, start } })
      return
    }
    gsap.fromTo(
      inner,
      { yPercent: 112 },
      { yPercent: 0, duration: 1.35, stagger, delay, ease: 'aurora', scrollTrigger: { trigger: root, start } },
    )
  })

  return createElement(
    as,
    { ref, className: `reveal-text ${className}`, style, id },
    lines.map((l, i) => (
      <span className="rt-line" key={i}>
        <span className="rt-inner">{l}</span>
      </span>
    )),
  )
}
