import { useState } from 'react'
import { ARTWORKS_RETRIEVED_AT, getArtworksForCountry } from '../data/artworks'
import type { Artwork } from '../types/artwork'
import type { SelectableCountry } from '../types/country'
import ArtworkCard from './ArtworkCard'
import ArtworkDetail from './ArtworkDetail'

interface CountryPanelProps {
  country: SelectableCountry
  onClear: () => void
}

/** Gallery for the selected country: a side panel on desktop, a bottom sheet on mobile. */
export default function CountryPanel({ country, onClear }: CountryPanelProps) {
  const artworks = getArtworksForCountry(country.id)
  const [openArtwork, setOpenArtwork] = useState<Artwork | null>(null)

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
          <p className="mt-1 text-xs text-ivory-muted">
            {artworks.length} {artworks.length === 1 ? 'artwork' : 'artworks'} from the Cleveland
            Museum of Art
          </p>
        </div>
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear selection"
          title="Clear selection (Esc)"
          className="-mt-1 -mr-2 flex size-11 shrink-0 items-center justify-center rounded-full text-ivory-muted transition-colors hover:text-ivory focus-visible:outline-2 focus-visible:outline-gold"
        >
          <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden="true">
            <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6 sm:px-6">
        {artworks.length > 0 ? (
          <ul className="grid grid-cols-2 gap-3" aria-label={`Artworks associated with ${country.name}`}>
            {artworks.map((artwork) => (
              <ArtworkCard key={artwork.id} artwork={artwork} onOpen={setOpenArtwork} />
            ))}
          </ul>
        ) : (
          <p className="text-sm text-ivory-muted">No artworks have been curated for this region yet.</p>
        )}

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
      </div>

      {openArtwork && (
        <ArtworkDetail artwork={openArtwork} onClose={() => setOpenArtwork(null)} />
      )}
    </aside>
  )
}
