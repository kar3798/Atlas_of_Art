import type { LocationPrecision } from '../types/discovery'

/** Small inline version of the globe markers: a pin for sites and cities, a dashed ring for regions. */
export default function PrecisionIcon({ precision }: { precision: LocationPrecision }) {
  return precision !== 'region' ? (
    <svg viewBox="0 0 12 22" className="h-4 w-3 shrink-0" aria-hidden="true">
      <line x1="6" y1="9" x2="6" y2="21.5" className="stroke-ivory-muted" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="6" cy="5.5" r="4.6" className="fill-brass-light stroke-sepia-ink" strokeWidth="1.1" />
      <circle cx="4.6" cy="4.2" r="1.3" className="fill-ivory/80" />
    </svg>
  ) : (
    <svg viewBox="0 0 20 20" className="size-4 shrink-0" aria-hidden="true">
      <circle cx="10" cy="10" r="7.5" className="fill-sepia-ink/45 stroke-brass-light" strokeWidth="1.6" strokeDasharray="3 2.2" />
      <circle cx="10" cy="10" r="2.2" className="fill-brass-light" />
    </svg>
  )
}
