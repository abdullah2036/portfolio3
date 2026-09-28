import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react'
import type { MediaKey } from '../content/media'
import { gsap, isFinePointer, useGsap } from '../lib/motion'
import { AuroraMedia } from './AuroraMedia'
import './AnimatedImage.css'

interface Props {
  k: MediaKey
  sizes?: string
  focus?: string
  className?: string
  style?: CSSProperties
  /** scroll parallax travel inside the frame, in % of height (0 = still) */
  parallax?: number
  /** cursor-relative drift in px (kept under 5 — physical depth, not a demo) */
  drift?: number
  /** clip-path reveal when it enters the viewport */
  reveal?: boolean
  /** extra light layer that shifts on hover */
  sheen?: boolean
  priority?: boolean
  /** let the shared scene transition settle this image (lib/frames.ts) */
  frameMedia?: boolean
  /** UI screenshots: no overscan, so the top edge is never cropped */
  screenshot?: boolean
  children?: ReactNode
}

export function AnimatedImage({ k, sizes, focus, className = '', style, parallax = 8, drift = 0, reveal = true, sheen = true, priority, frameMedia, screenshot, children }: Props) {
  const moverRef = useRef<HTMLDivElement>(null)

  const ref = useGsap<HTMLDivElement>(({ root, reduced }) => {
    const img = root.querySelector('.animated-image__img')
    if (reduced) return
    if (reveal) {
      gsap.fromTo(
        root,
        { clipPath: 'inset(14% 8% 14% 8% round 14px)' },
        {
          clipPath: 'inset(0% 0% 0% 0% round 14px)',
          duration: 1.6,
          ease: 'aurora',
          scrollTrigger: { trigger: root, start: 'top 88%' },
          clearProps: 'clipPath',
        },
      )
      if (!screenshot) gsap.fromTo(img, { scale: 1.22 }, { scale: 1.08, duration: 2, ease: 'aurora', scrollTrigger: { trigger: root, start: 'top 88%' } })
    }
    if (parallax && !screenshot) {
      gsap.fromTo(
        root.querySelector('.animated-image__plx'),
        { yPercent: -parallax / 2 },
        { yPercent: parallax / 2, ease: 'none', scrollTrigger: { trigger: root, start: 'top bottom', end: 'bottom top', scrub: 0.6 } },
      )
    }
  })

  useEffect(() => {
    const root = ref.current
    const mover = moverRef.current
    if (!root || !mover || !drift || !isFinePointer()) return
    const xTo = gsap.quickTo(mover, 'x', { duration: 1.4, ease: 'power3.out' })
    const yTo = gsap.quickTo(mover, 'y', { duration: 1.4, ease: 'power3.out' })
    const move = (e: PointerEvent) => {
      const r = root.getBoundingClientRect()
      const nx = (e.clientX - r.left) / r.width - 0.5
      const ny = (e.clientY - r.top) / r.height - 0.5
      xTo(-nx * drift * 2)
      yTo(-ny * drift * 2)
      root.style.setProperty('--mx', `${(nx + 0.5) * 100}%`)
      root.style.setProperty('--my', `${(ny + 0.5) * 100}%`)
    }
    const leave = () => {
      xTo(0)
      yTo(0)
    }
    root.addEventListener('pointermove', move)
    root.addEventListener('pointerleave', leave)
    return () => {
      root.removeEventListener('pointermove', move)
      root.removeEventListener('pointerleave', leave)
    }
  }, [drift, ref])

  return (
    <div ref={ref} className={`animated-image ${screenshot ? 'is-shot' : ''} ${className}`} style={style}>
      <div className="animated-image__plx">
        <div ref={moverRef} className="animated-image__mover" data-frame-media={frameMedia || undefined}>
          <AuroraMedia k={k} sizes={sizes} focus={focus} priority={priority} className="animated-image__img" />
        </div>
      </div>
      {sheen && <span className="animated-image__sheen" aria-hidden />}
      {children}
    </div>
  )
}
