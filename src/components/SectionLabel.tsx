import type { ReactNode } from 'react'
import './SectionLabel.css'

interface Props {
  index?: string
  children: ReactNode
  /** trailing hairline, as on the board's "MOTION & ANIMATION INSPIRATION ———" */
  rule?: boolean
  className?: string
}

export function SectionLabel({ index, children, rule, className = '' }: Props) {
  return (
    <p className={`label section-label ${rule ? 'has-rule' : ''} ${className}`}>
      {index && <span className="section-label__idx">{index}</span>}
      <span className="section-label__text">{children}</span>
      {rule && <span className="section-label__rule" aria-hidden />}
    </p>
  )
}
