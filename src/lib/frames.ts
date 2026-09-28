import { gsap } from './motion'

/**
 * The one scene transition used everywhere.
 *
 *  enter — each `[data-frame]` in the scene opens from an inset rounded mask while
 *          rising slightly; its image (`[data-frame-media]`) settles from 1.14 → 1.
 *          Complete just before the scene reaches its resting position.
 *  exit  — the scene's content (`.scene-content`) recedes: scales to 0.93, dims
 *          and trails a little behind the scroll, so the next scene reads as
 *          arriving in front of it.
 *
 * Everything is scrubbed to scroll (with a short lag that smooths native wheel
 * steps), so it plays forward and backward exactly and never moves the page itself.
 * `trigger` must be an element that is NOT itself pinned (for pinned scenes,
 * pass the section that wraps the pin-spacer).
 */
export function sceneTransition(
  trigger: HTMLElement,
  opts: { enter?: boolean; exit?: boolean; content?: Element | null } = {},
) {
  const { enter = true, exit = true } = opts
  const vh = window.innerHeight

  if (enter) {
    const frames = Array.from(trigger.querySelectorAll<HTMLElement>('[data-frame]'))
    frames.forEach((frame, i) => {
      const r = parseFloat(getComputedStyle(frame).borderTopLeftRadius) || 20
      const st = {
        trigger,
        start: `top ${100 - i * 6}%`,
        end: `top ${14 - i * 4}%`,
        scrub: 0.7,
      }
      gsap.fromTo(
        frame,
        { clipPath: `inset(9% 6% 0% 6% round ${r}px)`, y: vh * 0.08 },
        { clipPath: `inset(0% 0% 0% 0% round ${r}px)`, y: 0, ease: 'power2.out', immediateRender: true, scrollTrigger: st },
      )
      const media = frame.querySelectorAll('[data-frame-media]')
      if (media.length) gsap.fromTo(media, { scale: 1.14 }, { scale: 1, ease: 'power2.out', scrollTrigger: { ...st } })
    })
  }

  if (exit) {
    const content = opts.content ?? trigger.querySelector('.scene-content')
    if (content) {
      gsap.fromTo(
        content,
        { scale: 1, opacity: 1, y: 0 },
        {
          scale: 0.93,
          opacity: 0.2,
          y: vh * 0.12,
          ease: 'power1.in',
          immediateRender: false,
          scrollTrigger: { trigger, start: 'bottom bottom', end: 'bottom top', scrub: 0.7 },
        },
      )
    }
  }
}
