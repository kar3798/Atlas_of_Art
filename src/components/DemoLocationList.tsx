import { PRECISION_LABEL } from '../lib/discovery'
import { locationOptionId } from '../lib/elementIds'
import type { LocationGroup } from '../types/discovery'
import DemoBadge from './DemoBadge'
import PrecisionIcon from './PrecisionIcon'

interface DemoLocationListProps {
  groups: LocationGroup[]
  onSelectLocation: (locationId: string) => void
}

/** Accessible list of the locations marked on the globe; a keyboard-friendly alternative to the markers. */
export default function DemoLocationList({ groups, onSelectLocation }: DemoLocationListProps) {
  if (groups.length === 0) return null

  return (
    <section aria-labelledby="map-locations-title">
      <div className="flex items-center justify-between gap-3">
        <h3 id="map-locations-title" className="text-[0.7rem] tracking-[0.2em] text-ivory-muted uppercase">
          On the globe
        </h3>
        <DemoBadge />
      </div>
      <p className="mt-1.5 text-[0.7rem] leading-relaxed text-ivory-muted/70">
        Prototype markers. The places are real; the artworks are placeholders.
      </p>

      <ul className="mt-3 divide-y divide-ivory/10 rounded-md border border-ivory/10">
        {groups.map(({ location, artworks }) => (
          <li key={location.id}>
            <button
              id={locationOptionId(location.id)}
              type="button"
              onClick={() => onSelectLocation(location.id)}
              className="flex min-h-11 w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-ivory/5 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-gold"
            >
              <PrecisionIcon precision={location.precision} />
              <span className="min-w-0 flex-1">
                <span className="block text-sm text-ivory">{location.name}</span>
                <span className="block text-[0.7rem] text-ivory-muted">
                  {PRECISION_LABEL[location.precision]}
                </span>
              </span>
              <span className="text-xs text-ivory-muted">
                {artworks.length} {artworks.length === 1 ? 'artwork' : 'artworks'}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
