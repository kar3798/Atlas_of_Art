import type { CSSProperties } from 'react'
import { PRECISION_LABEL, relationshipLabel } from '../lib/discovery'
import type { LocationGroup } from '../types/discovery'
import ArtworkPlaceholder from './ArtworkPlaceholder'
import DemoBadge from './DemoBadge'
import PrecisionIcon from './PrecisionIcon'

/** Which side of the marker the preview opens on, chosen to keep it inside the viewport. */
export interface PreviewPlacement {
  side: 'left' | 'right'
  align: 'center' | 'top' | 'bottom'
}

interface ArtworkPreviewProps {
  group: LocationGroup
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
export default function ArtworkPreview({ group, placement, centerY }: ArtworkPreviewProps) {
  const { location, artworks } = group
  const single = artworks.length === 1 ? artworks[0] : null

  return (
    <div
      className="pointer-events-none absolute w-60 rounded-md border border-gold/30 bg-ink/90 p-3 text-left shadow-xl backdrop-blur-sm transition-opacity duration-150 starting:opacity-0"
      style={placementStyle(placement, centerY)}
    >
      <div className="flex gap-3">
        <ArtworkPlaceholder size="sm" />
        <div className="min-w-0">
          <p className="font-display text-sm leading-snug text-ivory">
            {single ? single.title : location.name}
          </p>
          <p className="mt-0.5 text-xs text-ivory-muted">
            {single ? (single.date ?? 'Date not recorded') : `${artworks.length} artworks`}
          </p>
        </div>
      </div>

      <div className="mt-2.5 space-y-1 border-t border-ivory/10 pt-2 text-[0.7rem] leading-snug">
        <p className="flex items-center gap-1.5 text-ivory">
          <PrecisionIcon precision={location.precision} />
          {single ? relationshipLabel(single.placement.relationship, location.name) : location.name}
        </p>
        <p className="text-ivory-muted">
          {PRECISION_LABEL[location.precision]}
          {location.precision === 'region' && ' · approximate area'}
        </p>
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-2">
        {artworks.some((artwork) => artwork.isDemo) && <DemoBadge />}
        <span className="text-[0.65rem] text-ivory-muted/70">Click to open</span>
      </div>
    </div>
  )
}
