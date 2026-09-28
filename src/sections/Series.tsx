import { useRef } from 'react'
import { series } from '../content/projects'
import { AuroraMedia } from '../components/AuroraMedia'
import { ArrowCircle } from '../components/CTA'
import { RevealText } from '../components/RevealText'
import { SectionLabel } from '../components/SectionLabel'
import { sceneTransition } from '../lib/frames'
import { digits, useLang } from '../lib/lang'
import { gsap, useGsap } from '../lib/motion'
import { rich } from '../lib/text'
import { useCopy } from '../lib/useCopy'
import './Series.css'

/**
 * 03 — The Computerjy Maher series: one brand, four forms.
 *
 * Desktop: the section pins. The four versions arrive stacked like a dealt deck,
 * shuffle out into a row, then the row travels sideways — leftwards in English,
 * rightwards in Arabic — while a counter keeps your place.
 * Phones: a native swipe carousel, no pinning.
 */
export function Series() {
  const t = useCopy()
  const { lang, dir } = useLang()
  const counterRef = useRef<HTMLSpanElement>(null)
  const total = series.length

  const ref = useGsap<HTMLElement>(
    ({ root, reduced, mobile }) => {
      const q = gsap.utils.selector(root)
      gsap.fromTo(q('.series__intro, .series__hint'), { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 1.2, stagger: 0.1, scrollTrigger: { trigger: root, start: 'top 70%' } })
      if (reduced || mobile) return

      const track = q('.series__track')[0] as HTMLElement
      const cards = q('.series__card') as HTMLElement[]
      const sign = dir === 'rtl' ? 1 : -1 // the row travels against the reading direction
      // the last card's far edge lands on the page margin, exactly like the first card's did
      const travel = () => {
        const last = cards[cards.length - 1]
        if (!last) return 0
        // offsets ignore transforms, so this is the composed (un-dealt) layout
        const d = dir === 'rtl' ? -last.offsetLeft : last.offsetLeft + last.offsetWidth - track.clientWidth
        return Math.max(0, d)
      }
      const step = () => (cards[1] ? Math.abs(cards[1].offsetLeft - cards[0].offsetLeft) : 0)
      const tilt = [-5, 3.5, -2, 4.5]

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          id: 'series-pin',
          trigger: q('.series__stage')[0],
          start: 'top top',
          end: () => `+=${travel() + window.innerHeight * 0.75}`,
          scrub: 0.7,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            if (!counterRef.current) return
            const i = Math.min(total, 1 + Math.floor(Math.max(0, self.progress - 0.2) / 0.8 * total * 0.999))
            counterRef.current.textContent = digits(String(i).padStart(2, '0'), lang)
          },
        },
      })
      // the shuffle: from one stacked deck to a dealt row
      tl.fromTo(
        cards,
        {
          // every card gathers onto the first card's slot (left in English, right in Arabic)
          x: (i) => sign * i * step(),
          y: (i) => i * 10,
          rotate: (i) => tilt[i % tilt.length],
          scale: (i) => 1 - i * 0.03,
        },
        { x: 0, y: 0, rotate: 0, scale: 1, duration: 0.24, ease: 'power2.inOut', stagger: 0.02, immediateRender: true },
        0,
      )
        // only the top card of the deck is captioned; the rest reveal theirs as they're dealt
        .fromTo(q('.series__card:not(:first-child) .series__meta'), { opacity: 0 }, { opacity: 1, duration: 0.1, stagger: 0.03, immediateRender: true }, 0.14)
        // then the row travels
        .fromTo(track, { x: 0 }, { x: () => sign * travel(), duration: 0.76 }, 0.26)

      sceneTransition(root, { enter: false })
    },
    [dir],
  )

  return (
    <section ref={ref} className="series" id="series" data-stop="series-pin" aria-labelledby="series-title">
      <div className="series__stage">
        <div className="scene-content series__inner">
          <header className="series__head grid">
            <SectionLabel index={digits('03', lang)} rule className="series__label">
              {t.series.label}
            </SectionLabel>
            <RevealText id="series-title" lines={t.series.title.map((l) => rich(l))} className="series__title display" />
            <div className="series__aside">
              <p className="series__intro body">{t.series.intro}</p>
              <p className="series__hint label">
                <span>{t.series.hint}</span>
                <span className="series__counter">
                  <span ref={counterRef}>{digits('01', lang)}</span> / {digits(String(total).padStart(2, '0'), lang)}
                </span>
              </p>
            </div>
          </header>

          <div className="series__viewport">
            <ol className="series__track">
              {series.map((s, i) => {
                const tx = s.text[lang]
                const host = s.live.replace(/^https?:\/\//, '').replace(/\/$/, '')
                return (
                  <li className="series__card" key={s.v} style={{ zIndex: series.length - i }}>
                    <div className="series__window frame">
                      <div className="series__chrome" aria-hidden>
                        <i />
                        <i />
                        <i />
                        <span className="series__url" dir="ltr">
                          {host}
                        </span>
                      </div>
                      <div className="series__shot">
                        <AuroraMedia k={s.image} sizes="(max-width: 767px) 86vw, 52vw" className="series__img" />
                      </div>
                    </div>
                    <div className="series__meta">
                      <p className="series__v display" aria-hidden>
                        {lang === 'ar' ? digits(s.v, lang) : `V${s.v}`}
                      </p>
                      <div className="series__text">
                        <h3 className="series__name display">
                          <span className="sr-only">
                            {t.series.version} {s.v}:{' '}
                          </span>
                          {tx.name}
                        </h3>
                        <p className="series__idea">{tx.idea}</p>
                        <p className="series__stack label latin">{s.stack}</p>
                      </div>
                      <div className="series__links">
                        <a href={s.live} target="_blank" rel="noreferrer" className="series__link is-hoverable">
                          <span>{t.series.live}</span>
                          <ArrowCircle size="sm" dir="up-right" />
                        </a>
                        <a href={s.code} target="_blank" rel="noreferrer" className="series__code label">
                          {t.series.code}
                        </a>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ol>
          </div>
        </div>
      </div>
    </section>
  )
}
