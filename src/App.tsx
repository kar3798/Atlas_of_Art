import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import CountryPanel from './components/CountryPanel'
import CountryPicker from './components/CountryPicker'
import Footer from './components/Footer'
import Header from './components/Header'
import { getSelectableCountry } from './data/selectableCountries'
import { countryOptionId } from './lib/elementIds'
import type { CountrySelection, SelectableCountryId } from './types/country'

// three.js is large, so the globe loads in its own chunk after the page shell renders.
const GlobeView = lazy(() => import('./components/GlobeView'))

function App() {
  const [selection, setSelection] = useState<CountrySelection | null>(null)
  const selectedId = selection?.countryId ?? null

  const selectCountry = useCallback((countryId: SelectableCountryId) => {
    setSelection({ countryId })
  }, [])

  const clearSelection = useCallback(() => {
    if (selectedId) document.getElementById(countryOptionId(selectedId))?.focus()
    setSelection(null)
  }, [selectedId])

  useEffect(() => {
    if (!selectedId) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') clearSelection()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedId, clearSelection])

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
          <GlobeView selection={selection} onSelect={selectCountry} />
        </Suspense>
      </main>

      {/* Overlays let pointer events pass through to the globe beneath. */}
      <div className="relative z-10">
        <Header />
      </div>
      <div className="pointer-events-none relative z-10 mt-auto flex flex-col items-center gap-4 px-4 pt-4">
        <div aria-live="polite" className="flex w-full justify-center">
          {selectedId && (
            <CountryPanel
              country={getSelectableCountry(selectedId)}
              onClear={clearSelection}
            />
          )}
        </div>
        <CountryPicker selectedId={selectedId} onSelect={selectCountry} />
        <Footer />
      </div>
    </div>
  )
}

export default App
