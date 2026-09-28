import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { useLocation } from 'react-router-dom'
import { me } from '../content/copy'
import { digits, useLang } from '../lib/lang'
import { gsap } from '../lib/motion'
import { lockScroll, restingY, scrollToY } from '../lib/scroll'
import { useTransition } from '../lib/transition'
import { useCopy } from '../lib/useCopy'
import { GhostPill } from './CTA'
import './Navigation.css'

export function useSectionLink() {
  const { pathname } = useLocation()
  const { go } = useTransition()
  return (e: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!href.startsWith('#')) return
    e.preventDefault()
    const id = href.slice(1)
    if (pathname !== '/') return go('/', { hash: id })
    const el = document.getElementById(id)
    if (!el) return
    scrollToY(id === 'top' ? 0 : restingY(el))
  }
}

function useActiveSection(ids: string[]) {
  const [active, setActive] = useState<string | null>(null)
  const { pathname } = useLocation()
  const key = ids.join(',')
  useEffect(() => {
    if (pathname !== '/') return setActive(null)
    const els = key
      .split(',')
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[]
    // the section crossing the middle band of the viewport; none at the hero
    const inBand = new Set<string>()
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) inBand.add(e.target.id)
          else inBand.delete(e.target.id)
        }
        const hit = els.find((el) => inBand.has(el.id))
        setActive(hit ? hit.id : null)
      },
      { rootMargin: '-45% 0px -50% 0px' },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [pathname, key])
  return active
}

/** EN ⇄ ع — shows the language you'd switch *to*, set in that language's own face. */
export function LangSwitch({ className = '' }: { className?: string }) {
  const t = useCopy()
  const { lang, toggle, switching } = useLang()
  const to = lang === 'en' ? 'ar' : 'en'
  return (
    <button type="button" className={`lang-switch ${className}`} data-to={to} lang={to} onClick={toggle} disabled={switching} aria-label={t.switchTo.aria}>
      <span className="lang-switch__glyph">{t.switchTo.label}</span>
    </button>
  )
}

interface Props {
  variant: 'hero' | 'floating'
}

const openMenu = () => window.dispatchEvent(new Event('menu:open'))

/** Thin, "printed-on" navigation: wordmark · four links · language · Let's Talk. No bar, no blur capsule. */
export function Navigation({ variant }: Props) {
  const t = useCopy()
  const { lang } = useLang()
  const link = useSectionLink()
  const active = useActiveSection(t.nav.map((n) => n.href.slice(1)))
  return (
    <nav className={`nav nav--${variant}`} aria-label={lang === 'ar' ? 'التنقل الرئيسي' : variant === 'hero' ? 'Primary' : 'Primary (sticky)'}>
      <a className="nav__logo" href="#top" onClick={(e) => link(e, '#top')} aria-label={t.fullName}>
        {lang === 'ar' ? t.name : t.name.toUpperCase()}
      </a>
      <ul className="nav__links">
        {t.nav.map((n) => (
          <li key={n.href}>
            <a href={n.href} onClick={(e) => link(e, n.href)} className={active === n.href.slice(1) ? 'is-active' : ''} data-nav>
              {n.label}
            </a>
          </li>
        ))}
      </ul>
      <div className="nav__end">
        <LangSwitch />
        <GhostPill className="nav__talk" href="#contact" onClick={(e) => link(e, '#contact')}>
          {t.talk}
        </GhostPill>
        <button className="nav__menu" onClick={openMenu} aria-label={t.menu.open}>
          <span />
          <span />
        </button>
      </div>
    </nav>
  )
}

/** Appears once the hero has gone; hides while reading down, returns on the way up. */
export function FloatingNav() {
  const ref = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => {
    const onOpen = () => setOpen(true)
    window.addEventListener('menu:open', onOpen)
    return () => window.removeEventListener('menu:open', onOpen)
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let lastY = window.scrollY
    let shown = false
    const set = (v: boolean) => {
      if (v === shown) return
      shown = v
      el.classList.toggle('is-shown', v)
    }
    const onScroll = () => {
      const y = window.scrollY
      const hero = document.getElementById('hero-end')
      const threshold = pathname === '/' && hero ? hero.getBoundingClientRect().top + y - window.innerHeight * 0.25 : 40
      if (pathname !== '/' && y < threshold) set(true)
      else if (y < threshold) set(false)
      else if (y < lastY - 4) set(true)
      else if (y > lastY + 6) set(false)
      lastY = y
    }
    onScroll()
    if (pathname !== '/') set(true)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [pathname])

  return (
    <>
      <div ref={ref} className="floating-nav">
        <Navigation variant="floating" />
      </div>
      <MobileMenu open={open} onClose={() => setOpen(false)} />
    </>
  )
}

export function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const link = useSectionLink()
  const t = useCopy()
  const { lang } = useLang()

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const items = el.querySelectorAll('.mmenu__item')
    if (open) {
      el.style.visibility = 'visible'
      lockScroll(true)
      gsap.fromTo(el, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 0.8, ease: 'auroraInOut' })
      gsap.fromTo(items, { yPercent: 110 }, { yPercent: 0, duration: 1, stagger: 0.06, delay: 0.25 })
      ;(el.querySelector('.mmenu__close') as HTMLElement)?.focus()
      const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
      window.addEventListener('keydown', onKey)
      return () => window.removeEventListener('keydown', onKey)
    } else {
      lockScroll(false)
      gsap.to(el, { clipPath: 'inset(0 0 100% 0)', duration: 0.6, ease: 'auroraInOut', onComplete: () => void (el.style.visibility = 'hidden') })
    }
  }, [open, onClose])

  return (
    <div ref={ref} className="mmenu" role="dialog" aria-modal="true" aria-label="Menu" aria-hidden={!open}>
      <div className="mmenu__top">
        <span className="nav__logo">{lang === 'ar' ? t.name : t.name.toUpperCase()}</span>
        <div className="mmenu__actions">
          <LangSwitch />
          <button className="mmenu__close label" onClick={onClose}>
            {t.menu.close}
          </button>
        </div>
      </div>
      <ul className="mmenu__list">
        {t.nav.map((n, i) => (
          <li key={n.href} className="rt-line">
            <a
              className="mmenu__item display"
              href={n.href}
              onClick={(e) => {
                onClose()
                link(e, n.href)
              }}
            >
              <span className="label">{digits(`0${i + 1}`, lang)}</span>
              {n.label}
            </a>
          </li>
        ))}
      </ul>
      <div className="mmenu__foot">
        <a href={me.resume} target="_blank" rel="noreferrer" className="label">
          {t.resume}
        </a>
        <a href={`mailto:${me.email}`} className="label">
          {t.contact.links.email}
        </a>
        <a href={me.linkedin} target="_blank" rel="noreferrer" className="label">
          {t.contact.links.linkedin}
        </a>
        <a href={me.github} target="_blank" rel="noreferrer" className="label">
          {t.contact.links.github}
        </a>
      </div>
    </div>
  )
}
