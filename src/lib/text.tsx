import { Fragment, type ReactNode } from 'react'

/**
 * `*words*` in copy become the accent voice: Instrument Serif italic in English,
 * Aref Ruqaa calligraphy in Arabic — the "hand" beside the engineered grotesk.
 */
export function rich(text: string, accentClass = 'accent-hand'): ReactNode {
  const parts = text.split(/(\*[^*]+\*)/g).filter(Boolean)
  if (parts.length === 1 && !parts[0].startsWith('*')) return text
  return parts.map((p, i) =>
    p.startsWith('*') && p.endsWith('*') ? (
      <em key={i} className={accentClass}>
        {p.slice(1, -1)}
      </em>
    ) : (
      <Fragment key={i}>{p}</Fragment>
    ),
  )
}

/** plain text (accent markers removed), for aria labels and titles */
export function plain(text: string) {
  return text.replace(/\*/g, '')
}
