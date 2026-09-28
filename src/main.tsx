import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

// English — structure, hand, text, code
import '@fontsource-variable/bricolage-grotesque/opsz.css'
import '@fontsource/instrument-serif/400-italic.css'
import '@fontsource/instrument-serif/400.css'
import '@fontsource-variable/instrument-sans'
import '@fontsource-variable/jetbrains-mono'
// Arabic — structure, hand, text (unicode-range: only fetched when Arabic is on screen)
import '@fontsource-variable/alexandria'
import '@fontsource/aref-ruqaa/arabic-400.css'
import '@fontsource/aref-ruqaa/arabic-700.css'
import '@fontsource/ibm-plex-sans-arabic/arabic-300.css'
import '@fontsource/ibm-plex-sans-arabic/arabic-400.css'
import '@fontsource/ibm-plex-sans-arabic/arabic-500.css'

import './styles/global.css'
import { App } from './App'
import { LangProvider } from './lib/lang'

if ('scrollRestoration' in history) history.scrollRestoration = 'manual'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <LangProvider>
        <App />
      </LangProvider>
    </BrowserRouter>
  </StrictMode>,
)
