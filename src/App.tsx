import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import CountryPanel from './components/CountryPanel'
import CountryPicker from './components/CountryPicker'
import Footer from './components/Footer'
import GlobeThemeSwitch from './components/GlobeThemeSwitch'
import Header from './components/Header'
import { getArtworksForCountry } from './data/artworks'
import { getSelectableCountry } from './data/selectableCountries'
import { findGroup, findMappedArtwork, getLocationGroups } from './lib/discovery'
import { countryOptionId } from './lib/elementIds'
import { DEFAULT_GLOBE_THEME, GLOBE_THEMES, type GlobeThemeId } from './styles/globeThemes'
import type { CountrySelection, SelectableCountryId } from './types/country'
import type { LocationGroup } from './types/discovery'

// three.js is large, so the globe loads in its own chunk after the page shell renders.
const GlobeView = lazy(() => import('./components/GlobeView'))

const NO_GROUPS: LocationGroup[] = []

function App() {
  const [globeThemeId, setGlobeThemeId] = useState<GlobeThemeId>(DEFAULT_GLOBE_THEME)
  const [selection, setSelection] = useState<CountrySelection | null>(null)
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null)
  const [selectedArtworkId, setSelectedArtworkId] = useState<string | null>(null)
  const globeTheme = GLOBE_THEMES[globeThemeId]
  const selectedId = selection?.countryId ?? null
  const selectedCountry = selectedId ? getSelectableCountry(selectedId) : null
  const locationGroups = selectedId ? getLocationGroups(selectedId) : NO_GROUPS

  const closeDiscovery = useCallback(() => {
    setSelectedLocationId(null)
    setSelectedArtworkId(null)
  }, [])

  const selectCountry = useCallback(
    (countryId: SelectableCountryId) => {
      setSelection({ countryId })
      if (countryId !== selectedId) closeDiscovery()
    },
    [selectedId, closeDiscovery],
  )

  const clearSelection = useCallback(() => {
    if (selectedId) document.getElementById(countryOptionId(selectedId))?.focus()
    setSelection(null)
    closeDiscovery()
  }, [selectedId, closeDiscovery])

  // A location with a single artwork opens that artwork directly; otherwise its list.
  const selectLocation = useCallback((locationId: string) => {
    const group = findGroup(locationId)
    setSelectedLocationId(locationId)
    setSelectedArtworkId(group?.artworks.length === 1 ? group.artworks[0].id : null)
  }, [])

  const selectArtwork = useCallback((artworkId: string) => {
    const artwork = findMappedArtwork(artworkId)
    if (!artwork) return
    setSelectedLocationId(artwork.placement.locationId)
    setSelectedArtworkId(artworkId)
  }, [])

  const stepBack = useCallback(() => {
    if (selectedArtworkId && (findGroup(selectedLocationId)?.artworks.length ?? 0) > 1) {
      setSelectedArtworkId(null)
    } else {
      closeDiscovery()
    }
  }, [selectedArtworkId, selectedLocationId, closeDiscovery])

  // Escape steps back out of artwork details first, then clears the country.
  useEffect(() => {
    if (!selectedId) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (selectedLocationId) stepBack()
      else clearSelection()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedId, selectedLocationId, stepBack, clearSelection])

  return (
    <div
      className="flex h-dvh flex-col overflow-hidden"
      style={{ background: globeTheme.pageBackground }}
    >
      <Header>
        {import.meta.env.DEV && (
          <GlobeThemeSwitch themeId={globeThemeId} onChange={setGlobeThemeId} />
        )}
      </Header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* The globe stage shrinks when the gallery opens, so the globe re-centers beside it. */}
        <div className="relative flex min-h-0 flex-1 flex-col">
          {/* The globe fills everything between the top bar and the footer bar. */}
          <main className="relative min-h-0 flex-1">
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
                markerGroups={locationGroups}
                selectedLocationId={selectedLocationId}
                onSelectLocation={selectLocation}
              />
            </Suspense>

            {/* Country buttons float over the bottom of the globe; drags pass through around them. */}
            <div className="pointer-events-none absolute inset-x-0 bottom-4 z-10 flex justify-center px-4">
              <CountryPicker selectedId={selectedId} onSelect={selectCountry} />
            </div>
          </main>

          {/* On mobile the gallery sheet sits below, so the footer gives way to it. */}
          <div className={selectedCountry ? 'max-lg:hidden' : undefined}>
            <Footer />
          </div>
        </div>

        {selectedCountry && (
          <CountryPanel
            key={selectedCountry.id}
            country={selectedCountry}
            onClear={clearSelection}
            locationGroups={locationGroups}
            selectedLocationId={selectedLocationId}
            selectedArtworkId={selectedArtworkId}
            onSelectLocation={selectLocation}
            onSelectArtwork={selectArtwork}
            onStepBack={stepBack}
            onCloseDetail={closeDiscovery}
          />
        )}
      </div>

      <p aria-live="polite" className="sr-only">
        {selectedCountry
          ? `${selectedCountry.name} selected. ${getArtworksForCountry(selectedCountry.id).length} artworks.`
          : ''}
      </p>
    </div>
  )
}

export default App
