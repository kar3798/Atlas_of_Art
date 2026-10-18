import { useEffect, useRef, useState } from 'react'
import { ARTWORKS_RETRIEVED_AT, getArtworksForCountry } from '../data/artworks'
import { findGroup, findMappedArtwork } from '../lib/discovery'
import { artworkOptionId, locationOptionId } from '../lib/elementIds'
import type { Artwork } from '../types/artwork'
import type { SelectableCountry } from '../types/country'
import type { LocationGroup } from '../types/discovery'
import ArtworkCard from './ArtworkCard'
import ArtworkDetail from './ArtworkDetail'
import ArtworkDetailPanel from './ArtworkDetailPanel'
import DemoLocationList from './DemoLocationList'
import LocationArtworkList from './LocationArtworkList'

interface CountryPanelProps {
  country: SelectableCountry
  onClear: () => void
  locationGroups: LocationGroup[]
  selectedLocationId: string | null
  selectedArtworkId: string | null
  onSelectLocation: (locationId: string) => void
  onSelectArtwork: (artworkId: string) => void
  /** One step back: artwork → its location list (if shared) or overview; location → overview. */
  onStepBack: () => void
  /** Straight back to the overview. */
  onCloseDetail: () => void
}

type View = 'overview' | 'location' | 'artwork'
const VIEW_DEPTH: Record<View, number> = { overview: 0, location: 1, artwork: 2 }
const VIEW_HEADING_ID = 'panel-view-heading'

/**
 * The selected country's panel: a side panel on desktop, a bottom sheet on mobile.
 * Shows an overview (map locations and museum artworks), the artworks at one
 * location, or one artwork's details.
 */
export default function CountryPanel({
  country,
  onClear,
  locationGroups,
  selectedLocationId,
  selectedArtworkId,
  onSelectLocation,
  onSelectArtwork,
  onStepBack,
  onCloseDetail,
}: CountryPanelProps) {
  const museumArtworks = getArtworksForCountry(country.id)
  const [openMuseumArtwork, setOpenMuseumArtwork] = useState<Artwork | null>(null)

  const group = findGroup(selectedLocationId)
  const artwork = findMappedArtwork(selectedArtworkId)
  const view: View = artwork && group ? 'artwork' : group ? 'location' : 'overview'

  // Move focus with the view: into a newly opened view, or back to the item that opened it.
  const previous = useRef({ view, locationId: selectedLocationId, artworkId: selectedArtworkId })
  useEffect(() => {
    const prev = previous.current
    previous.current = { view, locationId: selectedLocationId, artworkId: selectedArtworkId }
    if (
      prev.view === view &&
      prev.locationId === selectedLocationId &&
      prev.artworkId === selectedArtworkId
    ) {
      return
    }
    const target =
      VIEW_DEPTH[view] >= VIEW_DEPTH[prev.view]
        ? VIEW_HEADING_ID
        : view === 'location' && prev.artworkId
          ? artworkOptionId(prev.artworkId)
          : prev.locationId && locationOptionId(prev.locationId)
    if (target) document.getElementById(target)?.focus({ preventScroll: view !== 'overview' })
  }, [view, selectedLocationId, selectedArtworkId])

  return (
    <aside
      aria-labelledby="country-panel-title"
      className="relative z-10 flex h-[50dvh] shrink-0 flex-col border-t border-gold/20 bg-ink/80 backdrop-blur-md lg:h-auto lg:w-[26rem] lg:border-t-0 lg:border-l"
    >
      <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-4 sm:px-6 lg:pt-8">
        <div>
          <p className="text-[0.65rem] tracking-[0.3em] text-gold uppercase">Selected region</p>
          <h2 id="country-panel-title" className="mt-1.5 font-display text-2xl text-ivory lg:text-3xl">
            {country.name}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear country selection"
          title="Clear selection (Esc)"
          className="-mt-1 -mr-2 flex size-11 shrink-0 items-center justify-center rounded-full text-ivory-muted transition-colors hover:text-ivory focus-visible:outline-2 focus-visible:outline-gold"
        >
          <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden="true">
            <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
      </div>

      {/* Keyed by view so each view starts scrolled to the top. */}
      <div
        key={`${view}-${selectedLocationId}-${selectedArtworkId}`}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-6 sm:px-6"
      >
        {view === 'artwork' && artwork && group && (
          <ArtworkDetailPanel
            artwork={artwork}
            group={group}
            headingId={VIEW_HEADING_ID}
            backLabel={group.artworks.length > 1 ? `All at ${group.location.name}` : 'All locations'}
            onBack={onStepBack}
            onClose={onCloseDetail}
          />
        )}

        {view === 'location' && group && (
          <LocationArtworkList
            group={group}
            headingId={VIEW_HEADING_ID}
            onSelectArtwork={onSelectArtwork}
            onBack={onStepBack}
          />
        )}

        {view === 'overview' && (
          <>
            <DemoLocationList groups={locationGroups} onSelectLocation={onSelectLocation} />

            <section aria-labelledby="museum-artworks-title" className="mt-7">
              <h3
                id="museum-artworks-title"
                className="text-[0.7rem] tracking-[0.2em] text-ivory-muted uppercase"
              >
                From the Cleveland Museum of Art
              </h3>
              <p className="mt-1.5 text-[0.7rem] text-ivory-muted/70">
                {museumArtworks.length} {museumArtworks.length === 1 ? 'artwork' : 'artworks'} ·
                verified CC0 records
              </p>
              {museumArtworks.length > 0 ? (
                <ul className="mt-3 grid grid-cols-2 gap-3" aria-label={`Museum artworks associated with ${country.name}`}>
                  {museumArtworks.map((museumArtwork) => (
                    <ArtworkCard key={museumArtwork.id} artwork={museumArtwork} onOpen={setOpenMuseumArtwork} />
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-ivory-muted">
                  No artworks have been curated for this region yet.
                </p>
              )}
            </section>

            <div className="mt-6 space-y-2 border-t border-ivory/10 pt-4 text-[0.7rem] leading-relaxed text-ivory-muted/70">
              <p>
                Modern borders are shown for navigation only. Historical cultures and artistic
                traditions do not always align with them; origins are given as recorded by the museum.
              </p>
              <p>
                Data and images: Cleveland Museum of Art Open Access, CC0. Retrieved{' '}
                {ARTWORKS_RETRIEVED_AT}.
              </p>
            </div>
          </>
        )}
      </div>

      {openMuseumArtwork && (
        <ArtworkDetail artwork={openMuseumArtwork} onClose={() => setOpenMuseumArtwork(null)} />
      )}
    </aside>
  )
}
