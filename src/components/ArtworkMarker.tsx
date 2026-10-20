import type { PointerEvent as ReactPointerEvent, MouseEvent as ReactMouseEvent } from 'react'
import { markerCenterY, PIN_BALL_SIZE, PIN_HEIGHT, PIN_WIDTH } from '../lib/markerGeometry'
import type { MarkerStyle } from '../styles/globeThemes'
import type { LocationGroup } from '../types/discovery'
import ArtworkPreview, { type PreviewPlacement } from './ArtworkPreview'

/** Where the pointer was, in viewport coordinates. */
export interface PointerPosition {
  clientX: number
  clientY: number
}

interface ArtworkMarkerProps {
  group: LocationGroup
  /** Theme-specific colours (e.g. red pins on the realistic globe, brass on the antique one). */
  appearance: MarkerStyle
  isSelected: boolean
  isHovered: boolean
  /** Hover preview: this marker's location, or every location under the pointer. */
  preview: { groups: LocationGroup[]; placement: PreviewPlacement } | null
  onActivate: (locationId: string, pointer: PointerPosition) => void
  onHoverStart: (locationId: string, target: HTMLElement, pointer: PointerPosition) => void
  onHoverEnd: () => void
}

interface GlyphProps {
  active: boolean
  appearance: MarkerStyle
}

/** A map push pin: a small spherical head on a thin needle, with a soft contact shadow. */
function PinGlyph({ active, appearance }: GlyphProps) {
  return (
    <div className="relative" style={{ width: PIN_WIDTH, height: PIN_HEIGHT }} aria-hidden="true">
      {/* Contact shadow where the needle meets the globe */}
      <div className="absolute bottom-[-1px] left-1/2 h-[3px] w-2 -translate-x-1/2 rounded-full bg-black/40 blur-[1px]" />
      <div
        className="absolute bottom-0 left-1/2 w-[1.5px] -translate-x-1/2 rounded-b-full"
        style={{ height: PIN_HEIGHT - PIN_BALL_SIZE / 2, background: appearance.pinNeedle }}
      />
      {/* Head: radial highlight so it reads as a sphere */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 rounded-full border"
        style={{
          width: PIN_BALL_SIZE,
          height: PIN_BALL_SIZE,
          background: active ? appearance.pinBallSelected : appearance.pinBall,
          borderColor: appearance.pinBallBorder,
          boxShadow: active ? `0 0 0 2px ${appearance.selectedRing}` : undefined,
        }}
      />
    </div>
  )
}

/** Dashed ring = approximate area. A dark backing keeps it legible on any texture. */
function RegionGlyph({ active, appearance }: GlyphProps) {
  return (
    <svg viewBox="0 0 32 32" className="size-8 overflow-visible" aria-hidden="true">
      <circle cx="16" cy="16" r="12" fill={appearance.regionBacking} stroke={appearance.regionBacking} strokeWidth="4.5" />
      <circle
        cx="16"
        cy="16"
        r="12"
        fill="none"
        stroke={appearance.regionRing}
        strokeWidth="2"
        strokeDasharray={active ? undefined : '4.2 3'}
      />
      <circle cx="16" cy="16" r="3.4" fill={appearance.regionDot} stroke="rgba(0, 0, 0, 0.6)" strokeWidth="1.3" />
    </svg>
  )
}

const pointerOf = (e: ReactPointerEvent | ReactMouseEvent): PointerPosition => ({
  clientX: e.clientX,
  clientY: e.clientY,
})

/**
 * A location marker on the globe, always drawn at its true position. Pins mark
 * specific sites; dashed rings mark broad regions. Hidden from assistive technology:
 * the panel's location list is the accessible path.
 */
export default function ArtworkMarker({
  group,
  appearance,
  isSelected,
  isHovered,
  preview,
  onActivate,
  onHoverStart,
  onHoverEnd,
}: ArtworkMarkerProps) {
  const { location, entries } = group
  const isRegion = location.precision === 'region'
  const centerY = markerCenterY(location.precision)
  const isActive = isSelected || isHovered

  return (
    <div className="relative" aria-hidden="true">
      <div
        className={`absolute transition-[scale,filter] duration-200 ${isActive ? 'scale-115' : ''}`}
        style={{
          ...(isRegion
            ? { left: -16, top: -16, transformOrigin: '50% 50%' }
            : { left: -PIN_WIDTH / 2, top: -PIN_HEIGHT, transformOrigin: '50% 100%' }),
          filter: isActive ? `drop-shadow(0 0 6px ${appearance.glow})` : undefined,
        }}
      >
        {isRegion ? (
          <RegionGlyph active={isSelected} appearance={appearance} />
        ) : (
          <PinGlyph active={isSelected} appearance={appearance} />
        )}
        {entries.length > 1 && (
          <span
            className={`absolute flex h-4 min-w-4 items-center justify-center rounded-full border border-brass/70 bg-sepia-ink px-1 text-[0.6rem] leading-none font-semibold text-brass-light ${
              isRegion ? '-top-1.5 -right-2.5' : '-top-2 left-2.5'
            }`}
          >
            {entries.length}
          </span>
        )}
      </div>

      {/* Generous, invisible hit area (44px) for comfortable mouse and touch use. */}
      <button
        type="button"
        tabIndex={-1}
        onPointerEnter={(e) => e.pointerType === 'mouse' && onHoverStart(location.id, e.currentTarget, pointerOf(e))}
        onPointerLeave={(e) => e.pointerType === 'mouse' && onHoverEnd()}
        onClick={(e) => onActivate(location.id, pointerOf(e))}
        className="pointer-events-auto absolute size-11 -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full"
        style={{ left: 0, top: centerY }}
      />

      {preview && <ArtworkPreview groups={preview.groups} placement={preview.placement} centerY={centerY} />}
    </div>
  )
}
