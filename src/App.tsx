import { lazy, Suspense, useEffect } from 'react'
import { Route, Routes } from 'react-router-dom'
import { FloatingNav } from './components/Navigation'
import { TransitionProvider } from './lib/transition'
import { useLang } from './lib/lang'
import { useCopy } from './lib/useCopy'
import { Home } from './pages/Home'
import './styles/app.css'

const ProjectPage = lazy(() => import('./pages/ProjectPage'))

export function App() {
  const t = useCopy()
  const { lang } = useLang()

  useEffect(() => {
    document.title = t.meta.title
    document.querySelector('meta[name="description"]')?.setAttribute('content', t.meta.description)
  }, [t])

  return (
    <TransitionProvider>
      <a className="skip-link" href="#main">
        {lang === 'ar' ? 'انتقل إلى المحتوى' : 'Skip to content'}
      </a>
      <FloatingNav />
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/work/:slug" element={<ProjectPage />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </Suspense>
    </TransitionProvider>
  )
}
