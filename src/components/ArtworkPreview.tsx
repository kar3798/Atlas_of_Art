import type { CSSProperties } from 'react'
import { PRECISION_LABEL, relationshipLabel } from '../lib/discovery'
import type { LocationGroup } from '../types/discovery'
import ArtworkThumb from './ArtworkThumb'
import PrecisionIcon from './PrecisionIcon'

/** Which side of the marker the preview opens on, chosen to keep it inside the viewport. */
export interface PreviewPlacement {
  side: 'left' | 'right'
  align: 'center' | 'top' | 'bottom'
}

interface ArtworkPreviewProps {
  /** The location under the pointer, or several when their markers overlap. */
  groups: LocationGroup[]
  placement: PreviewPlacement
  /** Vertical offset of the marker's visual centre from its anchor point, in px. */
  centerY: number
}

const GAP = 22

function placementStyle({ side, align }: PreviewPlacement, centerY: number): CSSProperties {
  const style: CSSProperties = side === 'right' ? { left: GAP } : { right: GAP }
  if (align === 'center') return { ...style, top: centerY, transform: 'translateY(-50%)' }
  if (align === 'top') return { ...style, top: centerY - GAP }
  return { ...style, bottom: -centerY - GAP }
}

/**
 * Desktop hover preview. Rendered inside the marker so it moves with the globe;
 * it ignores the pointer so it never blocks dragging or zooming.
 */
export default function ArtworkPreview({ groups, placement, centerY }: ArtworkPreviewProps) {
  const className =
    'pointer-events-none absolute w-64 rounded-md border border-gold/30 bg-ink/90 p-3 text-left shadow-xl backdrop-blur-sm transition-opacity duration-150 starting:opacity-0'

  if (groups.length > 1) {
    return (
      <div className={className} style={placementStyle(placement, centerY)}>
        <p className="font-display text-sm text-ivory">{groups.length} places here</p>
        <p className="mt-0.5 text-[0.7rem] text-ivory-muted">Separate locations, close together at this zoom.</p>
        <ul className="mt-2.5 space-y-1.5 border-t border-ivory/10 pt-2 text-[0.7rem] leading-snug">
          {groups.map(({ location, entries }) => (
            <li key={location.id} className="flex items-center gap-1.5 text-ivory">
              <PrecisionIcon precision={location.precision} />
              <span className="min-w-0 flex-1 truncate">{location.name}</span>
              <span className="text-ivory-muted">{entries.length}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-right text-[0.65rem] text-ivory-muted/70">Click to choose</p>
      </div>
    )
  }

  const { location, entries } = groups[0]
  const single = entries.length === 1 ? entries[0] : null

  return (
    <div className={className} style={placementStyle(placement, centerY)}>
      <div className="flex gap-3">
        <ArtworkThumb artwork={(single ?? entries[0]).artwork} />
        <div className="min-w-0">
          <p className="line-clamp-2 font-display text-sm leading-snug text-ivory">
            {single ? single.artwork.title : location.name}
          </p>
          <p className="mt-0.5 text-xs text-ivory-muted">
            {single ? single.artwork.date.display : `${entries.length} artworks`}
          </p>
        </div>
      </div>

      <div className="mt-2.5 space-y-1 border-t border-ivory/10 pt-2 text-[0.7rem] leading-snug">
        <p className="flex items-center gap-1.5 text-ivory">
          <PrecisionIcon precision={location.precision} />
          {single ? relationshipLabel(single.placement, location) : location.name}
        </p>
        <p className="text-ivory-muted">
          {PRECISION_LABEL[location.precision]}
          {location.precision === 'region' && ' · approximate area'}
        </p>
      </div>

      <p className="mt-2 text-right text-[0.65rem] text-ivory-muted/70">Click to open</p>
    </div>
  )
}
