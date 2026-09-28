import { copy } from '../content/copy'
import { useLang } from './lang'

/** The page's copy in the current language. */
export function useCopy() {
  const { lang } = useLang()
  return copy[lang]
}
