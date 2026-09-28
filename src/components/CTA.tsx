import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from 'react'
import './CTA.css'

export function Arrow({ className = '' }: { className?: string }) {
  return (
    <svg className={`arrow ${className}`} viewBox="0 0 16 16" aria-hidden="true">
      <path d="M2.5 8h10.6M9 3.9 13.1 8 9 12.1" fill="none" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

type Dir = 'right' | 'down' | 'up-right' | 'left'

/** The board's circular arrow control. Decorative (aria-hidden) — always nested in a link or button. */
export function ArrowCircle({ size = 'md', dir = 'right', className = '' }: { size?: 'sm' | 'md' | 'lg'; dir?: Dir; className?: string }) {
  return (
    <span className={`arrow-circle arrow-circle--${size} arrow-circle--${dir} ${className}`} aria-hidden="true">
      <span className="arrow-circle__track">
        <Arrow />
        <Arrow />
      </span>
    </span>
  )
}

interface PillProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  children: ReactNode
  arrow?: Dir
  onNavigate?: (e: MouseEvent<HTMLAnchorElement>) => void
}

/** "View My Work  ( → )" — pill with an attached arrow circle, exactly as in the hero. */
export function PillCTA({ children, arrow = 'right', className = '', onNavigate, onClick, ...rest }: PillProps) {
  return (
    <a
      className={`pill-cta ${className}`}
      onClick={(e) => {
        onClick?.(e)
        onNavigate?.(e)
      }}
      {...rest}
    >
      <span className="pill-cta__label">{children}</span>
      <ArrowCircle size="md" dir={arrow} className="pill-cta__circle" />
    </a>
  )
}

/** Thin outline pill, e.g. "Let's Talk". */
export function GhostPill({ children, className = '', ...rest }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a className={`ghost-pill ${className}`} {...rest}>
      <span>{children}</span>
    </a>
  )
}
