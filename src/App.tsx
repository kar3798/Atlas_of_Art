import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import CountryPanel from './components/CountryPanel'
import CountryPicker from './components/CountryPicker'
import Footer from './components/Footer'
import GlobeThemeSwitch from './components/GlobeThemeSwitch'
import Header from './components/Header'
import { getArtworksForCountry } from './data/artworks'
import { getSelectableCountry } from './data/selectableCountries'
import { countryOptionId } from './lib/elementIds'
import { DEFAULT_GLOBE_THEME, GLOBE_THEMES, type GlobeThemeId } from './styles/globeThemes'
import type { CountrySelection, SelectableCountryId } from './types/country'

// three.js is large, so the globe loads in its own chunk after the page shell renders.
const GlobeView = lazy(() => import('./components/GlobeView'))

function App() {
  const [globeThemeId, setGlobeThemeId] = useState<GlobeThemeId>(DEFAULT_GLOBE_THEME)
  const [selection, setSelection] = useState<CountrySelection | null>(null)
  const globeTheme = GLOBE_THEMES[globeThemeId]
  const selectedId = selection?.countryId ?? null
  const selectedCountry = selectedId ? getSelectableCountry(selectedId) : null

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
    <div
      className="flex h-dvh flex-col overflow-hidden lg:flex-row"
      style={{ background: globeTheme.pageBackground }}
    >
      {/* The globe stage shrinks when the gallery opens, so the globe re-centers beside it. */}
      <div className="relative flex min-h-0 flex-1 flex-col">
        <main className="absolute inset-0">
          <Suspense
            fallback={
              <p className="flex h-full items-center justify-center text-xs tracking-[0.3em] text-ivory-muted/60 uppercase">
                Loading globe…
              </p>
            }
          >
            <GlobeView
              theme={globeTheme}
              selection={selection}
              onSelect={selectCountry}
            />
          </Suspense>
        </main>

        {import.meta.env.DEV && (
          <div className="absolute top-3 right-3 z-20">
            <GlobeThemeSwitch themeId={globeThemeId} onChange={setGlobeThemeId} />
          </div>
        )}

        {/* Overlays let pointer events pass through to the globe beneath. */}
        <div className="relative z-10">
          <Header />
        </div>
        <div
          className={`pointer-events-none relative z-10 mt-auto flex flex-col items-center gap-4 px-4 pt-4 ${
            selectedCountry ? 'max-lg:pb-4' : ''
          }`}
        >
          <CountryPicker selectedId={selectedId} onSelect={selectCountry} />
          {/* On mobile the gallery sits below, so the footer gives way to it. */}
          <div className={selectedCountry ? 'max-lg:hidden' : undefined}>
            <Footer />
          </div>
        </div>
      </div>

      {selectedCountry && (
        <CountryPanel key={selectedCountry.id} country={selectedCountry} onClear={clearSelection} />
      )}

      <p aria-live="polite" className="sr-only">
        {selectedCountry
          ? `${selectedCountry.name} selected. ${getArtworksForCountry(selectedCountry.id).length} artworks.`
          : ''}
      </p>
    </div>
  )
}

export default App
