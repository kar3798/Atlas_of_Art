import { useEffect, useRef } from 'react'
import { ARTWORKS, ARTWORKS_RETRIEVED_AT, getArtworksForCountry } from '../data/artworks'
import { findGroup, findPlacement } from '../lib/discovery'
import { artworkOptionId, galleryCardId, locationOptionId } from '../lib/elementIds'
import type { SelectableCountry } from '../types/country'
import type { LocationGroup } from '../types/discovery'
import ArtworkCard from './ArtworkCard'
import ArtworkDetailPanel from './ArtworkDetailPanel'
import LocationArtworkList from './LocationArtworkList'
import LocationList from './LocationList'

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

/** Focuses the first of the given element IDs that exists. */
function focusFirst(ids: (string | null)[], preventScroll: boolean) {
  for (const id of ids) {
    const element = id ? document.getElementById(id) : null
    if (element) return element.focus({ preventScroll })
  }
}

/**
 * The selected country's panel: a side panel on desktop, a bottom sheet on mobile.
 * Shows an overview (globe locations and the museum gallery), the artworks at one
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
  const galleryArtworks = getArtworksForCountry(country.id)
  const artwork = ARTWORKS.find((a) => a.id === selectedArtworkId) ?? null
  const group = findGroup(selectedLocationId)
  const view: View = artwork ? 'artwork' : group ? 'location' : 'overview'

  // Move focus with the view: into a newly opened view, or back to whatever opened it.
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
    if (VIEW_DEPTH[view] >= VIEW_DEPTH[prev.view]) {
      focusFirst([VIEW_HEADING_ID], true)
    } else if (view === 'location') {
      focusFirst([prev.artworkId && artworkOptionId(prev.artworkId)], true)
    } else {
      focusFirst(
        [
          prev.artworkId && galleryCardId(prev.artworkId),
          prev.locationId && locationOptionId(prev.locationId),
        ],
        false,
      )
    }
  }, [view, selectedLocationId, selectedArtworkId])

  const placement = artwork ? findPlacement(artwork.id) : null
  const placementLocation = placement ? (findGroup(placement.locationId)?.location ?? null) : null

  return (
    <aside
      aria-labelledby="country-panel-title"
      className="relative z-10 flex h-[50dvh] shrink-0 flex-col border-t border-gold/20 bg-ink/80 backdrop-blur-md lg:h-auto lg:w-[26rem] lg:border-t-0 lg:border-l"
    >
      <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-4 sm:px-6">
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
        {view === 'artwork' && artwork && (
          <ArtworkDetailPanel
            artwork={artwork}
            placement={placement}
            location={placementLocation}
            headingId={VIEW_HEADING_ID}
            backLabel={
              group && group.entries.length > 1 ? `All at ${group.location.name}` : 'Overview'
            }
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
            <LocationList groups={locationGroups} onSelectLocation={onSelectLocation} />

            <section aria-labelledby="museum-artworks-title" className="mt-7">
              <h3
                id="museum-artworks-title"
                className="text-[0.7rem] tracking-[0.2em] text-ivory-muted uppercase"
              >
                From the Cleveland Museum of Art
              </h3>
              <p className="mt-1.5 text-[0.7rem] text-ivory-muted/70">
                {galleryArtworks.length} {galleryArtworks.length === 1 ? 'artwork' : 'artworks'} ·
                verified CC0 records
              </p>
              {galleryArtworks.length > 0 ? (
                <ul className="mt-3 grid grid-cols-2 gap-3" aria-label={`Museum artworks associated with ${country.name}`}>
                  {galleryArtworks.map((galleryArtwork) => (
                    <ArtworkCard key={galleryArtwork.id} artwork={galleryArtwork} onOpen={onSelectArtwork} />
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
                traditions do not always align with them; locations are given as documented in the
                museum records.
              </p>
              <p>
                Data and images: Cleveland Museum of Art Open Access, CC0. Retrieved{' '}
                {ARTWORKS_RETRIEVED_AT}.
              </p>
            </div>
          </>
        )}
      </div>
    </aside>
  )
}
