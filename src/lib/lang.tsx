import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { gsap, prefersReducedMotion, ScrollTrigger } from './motion'
import { restingY } from './scroll'

/**
 * Two languages, one page.
 *
 * Switching is a small scene of its own: a curtain of night sweeps across in the
 * direction the new language is read (towards the left for Arabic, the right for
 * English), its leading edge a thin line of aurora light. Behind it the document
 * flips language and direction; the reader stays on the same section.
 */

export type Lang = 'en' | 'ar'
export type Dir = 'ltr' | 'rtl'

const KEY = 'lang'

function initialLang(): Lang {
  try {
    const q = new URLSearchParams(location.search).get('lang')
    if (q === 'ar' || q === 'en') return q
    const saved = localStorage.getItem(KEY)
    if (saved === 'ar' || saved === 'en') return saved
  } catch {
    /* storage unavailable */
  }
  return navigator.language?.toLowerCase().startsWith('ar') ? 'ar' : 'en'
}

function applyDocument(lang: Lang) {
  const el = document.documentElement
  el.lang = lang
  el.dir = lang === 'ar' ? 'rtl' : 'ltr'
}

/** Western → Arabic-Indic digits, for numbers that belong to the Arabic text. */
export function digits(s: string | number, lang: Lang) {
  const str = String(s)
  return lang === 'ar' ? str.replace(/[0-9]/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)]) : str
}

interface Ctx {
  lang: Lang
  dir: Dir
  switching: boolean
  setLang: (next: Lang) => void
  toggle: () => void
}

const LangContext = createContext<Ctx | null>(null)

/** the section currently in view, and how far into it the reader is */
function scrollAnchor() {
  const y = window.scrollY
  let best: HTMLElement | null = null
  let bestY = -Infinity
  document.querySelectorAll<HTMLElement>('[data-stop]').forEach((el) => {
    const r = restingY(el)
    if (r <= y + 4 && r > bestY) {
      best = el
      bestY = r
    }
  })
  return best ? { el: best as HTMLElement, offset: y - bestY } : null
}

async function fontsFor(lang: Lang) {
  if (!document.fonts) return
  const faces =
    lang === 'ar'
      ? ['300 40px "Alexandria Variable"', '400 40px "Aref Ruqaa"', '400 16px "IBM Plex Sans Arabic"', '500 16px "IBM Plex Sans Arabic"']
      : ['300 40px "Bricolage Grotesque Variable"', 'italic 400 40px "Instrument Serif"', '400 16px "Instrument Sans Variable"', '400 12px "JetBrains Mono Variable"']
  const sample = lang === 'ar' ? 'أبجد هوز' : 'Aa'
  await Promise.race([Promise.all(faces.map((f) => document.fonts.load(f, sample))), new Promise((r) => setTimeout(r, 1200))])
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const l = initialLang()
    applyDocument(l)
    return l
  })
  const [switching, setSwitching] = useState(false)
  const [target, setTarget] = useState<Lang>(lang === 'en' ? 'ar' : 'en')
  const veilRef = useRef<HTMLDivElement>(null)
  const busy = useRef(false)

  useEffect(() => {
    applyDocument(lang)
    try {
      localStorage.setItem(KEY, lang)
    } catch {
      /* storage unavailable */
    }
  }, [lang])

  const setLang = useCallback(
    async (next: Lang) => {
      if (next === lang || busy.current) return
      busy.current = true
      const veil = veilRef.current
      const anchor = scrollAnchor()
      const swap = async () => {
        setLangState(next)
        await fontsFor(next)
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
        // direction-aware scenes rebuild their pins on switch; re-order by position before measuring
        ScrollTrigger.sort()
        ScrollTrigger.refresh()
        if (anchor) window.scrollTo({ top: restingY(anchor.el) + anchor.offset, behavior: 'auto' })
      }

      if (!veil || prefersReducedMotion()) {
        await swap()
        busy.current = false
        return
      }

      setTarget(next)
      setSwitching(true)
      // Arabic is read from the right: the curtain travels right → left. English: left → right.
      const toRtl = next === 'ar'
      const edge = veil.querySelector('.lang-veil__edge')
      const word = veil.querySelector('.lang-veil__word')
      veil.style.visibility = 'visible'
      const cover = gsap.timeline()
      cover
        .fromTo(
          veil,
          { clipPath: toRtl ? 'inset(0 0 0 100%)' : 'inset(0 100% 0 0)' },
          { clipPath: 'inset(0 0% 0 0%)', duration: 0.62, ease: 'auroraInOut' },
          0,
        )
        .fromTo(edge, { left: toRtl ? '100%' : '0%' }, { left: toRtl ? '0%' : '100%', duration: 0.62, ease: 'auroraInOut' }, 0)
        .fromTo(word, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.5, ease: 'aurora' }, 0.28)
      await cover.then()
      await swap()
      const reveal = gsap.timeline({
        onComplete: () => {
          veil.style.visibility = 'hidden'
          setSwitching(false)
          busy.current = false
        },
      })
      reveal
        .to(word, { opacity: 0, y: -10, duration: 0.35, ease: 'aurora' }, 0)
        .fromTo(
          veil,
          { clipPath: 'inset(0 0% 0 0%)' },
          { clipPath: toRtl ? 'inset(0 100% 0 0)' : 'inset(0 0 0 100%)', duration: 0.72, ease: 'auroraInOut' },
          0.12,
        )
        .fromTo(edge, { left: toRtl ? '100%' : '0%' }, { left: toRtl ? '0%' : '100%', duration: 0.72, ease: 'auroraInOut' }, 0.12)
    },
    [lang],
  )

  const toggle = useCallback(() => setLang(lang === 'en' ? 'ar' : 'en'), [lang, setLang])

  const value = useMemo<Ctx>(() => ({ lang, dir: lang === 'ar' ? 'rtl' : 'ltr', switching, setLang, toggle }), [lang, switching, setLang, toggle])

  return (
    <LangContext.Provider value={value}>
      {children}
      <div ref={veilRef} className="lang-veil" aria-hidden>
        <span className="lang-veil__edge" />
        <span className="lang-veil__word" lang={target} dir={target === 'ar' ? 'rtl' : 'ltr'}>
          {target === 'ar' ? 'العربية' : 'English'}
        </span>
      </div>
    </LangContext.Provider>
  )
}

export function useLang() {
  const ctx = useContext(LangContext)
  if (!ctx) throw new Error('useLang must be used inside LangProvider')
  return ctx
}
