import { useEffect, useRef, type CSSProperties } from 'react'
import { PRECISION_LABEL } from '../lib/discovery'
import type { LocationGroup } from '../types/discovery'
import PrecisionIcon from './PrecisionIcon'

interface PlaceChooserProps {
  /** Locations whose markers overlap where the user clicked. */
  groups: LocationGroup[]
  /** Click position and globe area size, in px relative to the globe area. */
  x: number
  y: number
  areaWidth: number
  areaHeight: number
  selectedLocationId: string | null
  onSelect: (locationId: string) => void
  onClose: () => void
}

const WIDTH = 256
const GAP = 14
const EDGE = 8

/** Opens beside the click point, on whichever side keeps it inside the globe area. */
function positionStyle(x: number, y: number, areaWidth: number, areaHeight: number): CSSProperties {
  const left = x + GAP + WIDTH <= areaWidth - EDGE ? x + GAP : Math.max(EDGE, x - GAP - WIDTH)
  return y < areaHeight / 2
    ? { left, top: Math.max(EDGE, y - 20) }
    : { left, bottom: Math.max(EDGE, areaHeight - y - 20) }
}

/**
 * A small card listing the locations under a click where markers overlap, so each
 * can be chosen. The markers themselves never move from their true positions.
 */
export default function PlaceChooser({
  groups,
  x,
  y,
  areaWidth,
  areaHeight,
  selectedLocationId,
  onSelect,
  onClose,
}: PlaceChooserProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    ref.current?.querySelector('button')?.focus({ preventScroll: true })

    // Escape closes the chooser before panel navigation (bubble phase on window) sees it.
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.stopPropagation()
      onClose()
    }
    const handlePointerDown = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) onClose()
    }
    window.addEventListener('keydown', handleKeyDown, true)
    document.addEventListener('pointerdown', handlePointerDown, true)
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true)
      document.removeEventListener('pointerdown', handlePointerDown, true)
    }
  }, [onClose])

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label={`${groups.length} places here`}
      className="absolute z-20 cursor-auto rounded-md border border-gold/30 bg-ink/95 p-3 text-left shadow-xl backdrop-blur-sm transition-opacity duration-150 starting:opacity-0"
      style={{ width: WIDTH, ...positionStyle(x, y, areaWidth, areaHeight) }}
    >
      <p className="font-display text-sm text-ivory">{groups.length} places here</p>
      <p className="mt-0.5 text-[0.7rem] text-ivory-muted">
        Separate locations, close together at this zoom.
      </p>
      <ul className="mt-2 -mx-1">
        {groups.map(({ location, entries }) => (
          <li key={location.id}>
            <button
              type="button"
              onClick={() => onSelect(location.id)}
              aria-current={location.id === selectedLocationId ? 'true' : undefined}
              className="flex min-h-11 w-full items-center gap-2.5 rounded px-1.5 py-1.5 text-left transition-colors hover:bg-ivory/5 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-gold aria-[current]:bg-gold/10"
            >
              <PrecisionIcon precision={location.precision} />
              <span className="min-w-0 flex-1">
                <span className="block text-sm leading-snug text-ivory">{location.name}</span>
                <span className="block text-[0.7rem] text-ivory-muted">
                  {PRECISION_LABEL[location.precision]}
                </span>
              </span>
              <span className="text-xs text-ivory-muted">
                {entries.length} {entries.length === 1 ? 'artwork' : 'artworks'}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
