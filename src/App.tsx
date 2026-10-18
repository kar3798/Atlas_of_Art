import { lazy, Suspense } from 'react'
import Footer from './components/Footer'
import Header from './components/Header'

// three.js is large, so the globe loads in its own chunk after the page shell renders.
const GlobeView = lazy(() => import('./components/GlobeView'))

function App() {
  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-[radial-gradient(ellipse_at_center,var(--color-ink-soft)_0%,var(--color-ink)_70%)]">
      <main className="absolute inset-0">
        <Suspense
          fallback={
            <p className="flex h-full items-center justify-center text-xs tracking-[0.3em] text-ivory-muted/60 uppercase">
              Loading globe…
            </p>
          }
        >
          <GlobeView />
        </Suspense>
      </main>

      {/* Overlays let pointer events pass through to the globe beneath. */}
      <div className="relative z-10">
        <Header />
      </div>
      <div className="relative z-10 mt-auto">
        <Footer />
      </div>
    </div>
  )
}

export default App
