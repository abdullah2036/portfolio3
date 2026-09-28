import { forwardRef, type CSSProperties } from 'react'
import { media, srcSet, src, type MediaKey } from '../content/media'
import { useLang } from '../lib/lang'

interface Props {
  k: MediaKey
  sizes?: string
  priority?: boolean
  className?: string
  style?: CSSProperties
  /** object-position, e.g. "50% 40%" */
  focus?: string
  alt?: string
  /** marks the image the shared scene transition settles (see lib/frames.ts) */
  'data-frame-media'?: boolean
}

/** Responsive, lazy-by-default image from the media registry. */
export const AuroraMedia = forwardRef<HTMLImageElement, Props>(function AuroraMedia(
  { k, sizes = '100vw', priority, className = '', style, focus, alt, ...data },
  ref,
) {
  const m = media[k]
  const { lang } = useLang()
  return (
    <img
      ref={ref}
      className={`aurora-media ${className}`}
      src={src(m, m.widths[0])}
      srcSet={srcSet(m)}
      sizes={sizes}
      width={m.width}
      height={m.height}
      alt={alt ?? m.alt[lang]}
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      fetchPriority={priority ? 'high' : 'auto'}
      draggable={false}
      {...data}
      style={{ objectPosition: focus ?? m.focus, ...style }}
    />
  )
})
