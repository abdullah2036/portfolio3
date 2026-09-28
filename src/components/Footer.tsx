import { useCopy } from '../lib/useCopy'
import { ArrowCircle } from './CTA'
import { useSectionLink } from './Navigation'
import './Footer.css'

export function Footer() {
  const link = useSectionLink()
  const t = useCopy()
  return (
    <footer className="footer page">
      <p className="label">{t.footer.rights}</p>
      <p className="label footer__mid">{t.footer.made}</p>
      <a href="#top" className="label footer__top" onClick={(e) => link(e, '#top')}>
        {t.footer.top}
        <ArrowCircle size="sm" className="footer__arrow" />
      </a>
    </footer>
  )
}
