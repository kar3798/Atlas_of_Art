import { PRECISION_LABEL, PRECISION_NOTE, relationshipLabel } from '../lib/discovery'
import { artworkOptionId } from '../lib/elementIds'
import type { LocationGroup } from '../types/discovery'
import ArtworkPlaceholder from './ArtworkPlaceholder'
import DemoBadge from './DemoBadge'
import PanelNav from './PanelNav'
import PrecisionIcon from './PrecisionIcon'

interface LocationArtworkListProps {
  group: LocationGroup
  headingId: string
  onSelectArtwork: (artworkId: string) => void
  onBack: () => void
}

/** Artworks sharing one location marker. */
export default function LocationArtworkList({
  group,
  headingId,
  onSelectArtwork,
  onBack,
}: LocationArtworkListProps) {
  const { location, artworks } = group

  return (
    <section aria-labelledby={headingId}>
      <PanelNav backLabel="All locations" onBack={onBack} />

      <div className="mt-4 flex items-center gap-2">
        <PrecisionIcon precision={location.precision} />
        <h3 id={headingId} tabIndex={-1} className="font-display text-xl text-ivory outline-none">
          {location.name}
        </h3>
      </div>
      <p className="mt-1 text-xs text-ivory-muted">
        {PRECISION_LABEL[location.precision]}. {PRECISION_NOTE[location.precision]}
      </p>

      <ul className="mt-4 space-y-2">
        {artworks.map((artwork) => (
          <li key={artwork.id}>
            <button
              id={artworkOptionId(artwork.id)}
              type="button"
              onClick={() => onSelectArtwork(artwork.id)}
              className="flex min-h-11 w-full items-center gap-3 rounded-md border border-ivory/10 bg-ink/40 p-2 text-left transition-colors hover:border-gold/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            >
              <ArtworkPlaceholder size="sm" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm leading-snug text-ivory">{artwork.title}</span>
                <span className="mt-0.5 block text-[0.7rem] text-ivory-muted">
                  {relationshipLabel(artwork.placement.relationship, location.name)}
                </span>
              </span>
              {artwork.isDemo && <DemoBadge />}
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
