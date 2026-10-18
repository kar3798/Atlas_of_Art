import { useCallback, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { MarkerStyle } from '../styles/globeThemes'
import type { LocationGroup } from '../types/discovery'
import ArtworkMarker from './ArtworkMarker'
import type { PreviewPlacement } from './ArtworkPreview'

// Above the selected (raised) country polygon, so markers are never hidden by it.
const MARKER_ALTITUDE = 0.025
const PREVIEW_WIDTH = 260
const PREVIEW_EDGE_MARGIN = 140
const HOVER_END_DELAY_MS = 80

interface MarkerLayerOptions {
  groups: LocationGroup[]
  appearance: MarkerStyle
  selectedLocationId: string | null
  onSelectLocation: (locationId: string) => void
  /** The globe's canvas, for forwarding mouse-wheel zoom from markers. */
  getCanvas: () => HTMLCanvasElement | undefined
}

/**
 * Creates the DOM element globe.gl positions for one marker. globe.gl listens for
 * pointer events on its container, so events are stopped here; otherwise a click on
 * a marker would also count as a click on the country beneath it.
 */
function createMarkerAnchor(getCanvas: () => HTMLCanvasElement | undefined) {
  const anchor = document.createElement('div')
  anchor.style.pointerEvents = 'none'
  for (const type of ['pointerdown', 'pointerup', 'pointermove', 'click', 'dblclick', 'contextmenu']) {
    anchor.addEventListener(type, (event) => event.stopPropagation())
  }
  // Keep scroll-to-zoom working while the pointer is over a marker.
  anchor.addEventListener(
    'wheel',
    (event) => {
      event.preventDefault()
      getCanvas()?.dispatchEvent(new WheelEvent('wheel', event))
    },
    { passive: false },
  )
  return anchor
}

/** Opens the preview toward the side with more room inside the globe area. */
function choosePlacement(target: HTMLElement): PreviewPlacement {
  const rect = target.getBoundingClientRect()
  const area = target.closest('[data-globe-area]')?.getBoundingClientRect() ?? {
    top: 0,
    right: window.innerWidth,
    bottom: window.innerHeight,
  }
  return {
    side: rect.right + PREVIEW_WIDTH > area.right ? 'left' : 'right',
    align:
      rect.top - area.top < PREVIEW_EDGE_MARGIN
        ? 'top'
        : area.bottom - rect.bottom < PREVIEW_EDGE_MARGIN
          ? 'bottom'
          : 'center',
  }
}

// Module-level so their identity never changes between renders.
const markerLat = (d: object) => (d as LocationGroup).location.lat
const markerLng = (d: object) => (d as LocationGroup).location.lng

/** Marker-layer props for react-globe.gl, plus the React portals that render the markers. */
export function useArtworkMarkerLayer({
  groups,
  appearance,
  selectedLocationId,
  onSelectLocation,
  getCanvas,
}: MarkerLayerOptions) {
  const [hover, setHover] = useState<{ locationId: string; placement: PreviewPlacement } | null>(null)
  const hoverEndTimer = useRef<number | undefined>(undefined)

  const anchors = useMemo(
    () => new Map(groups.map((group) => [group.location.id, createMarkerAnchor(getCanvas)])),
    [groups, getCanvas],
  )

  const startHover = useCallback((locationId: string, target: HTMLElement) => {
    window.clearTimeout(hoverEndTimer.current)
    setHover({ locationId, placement: choosePlacement(target) })
  }, [])

  // A short delay avoids flicker when the pointer brushes the edge of the hit area.
  const endHover = useCallback(() => {
    window.clearTimeout(hoverEndTimer.current)
    hoverEndTimer.current = window.setTimeout(() => setHover(null), HOVER_END_DELAY_MS)
  }, [])

  const clearHover = useCallback(() => {
    window.clearTimeout(hoverEndTimer.current)
    setHover(null)
  }, [])

  const selectLocation = useCallback(
    (locationId: string) => {
      clearHover()
      onSelectLocation(locationId)
    },
    [clearHover, onSelectLocation],
  )

  const hoveredId = hover && anchors.has(hover.locationId) ? hover.locationId : null

  const portals = groups.map((group) => {
    const id = group.location.id
    return createPortal(
      <ArtworkMarker
        group={group}
        appearance={appearance}
        isSelected={id === selectedLocationId}
        isHovered={id === hoveredId}
        placement={id === hoveredId ? hover!.placement : null}
        onSelect={selectLocation}
        onHoverStart={startHover}
        onHoverEnd={endHover}
      />,
      anchors.get(id)!,
      id,
    )
  })

  // These props must keep the same identity across renders: globe.gl destroys and
  // recreates every marker whenever `htmlElement` changes, which would detach the
  // marker under the pointer on each hover update (flicker) and swallow clicks.
  const globeProps = useMemo(
    () => ({
      htmlElementsData: groups,
      htmlLat: markerLat,
      htmlLng: markerLng,
      htmlAltitude: MARKER_ALTITUDE,
      htmlElement: (d: object) => anchors.get((d as LocationGroup).location.id)!,
      htmlTransitionDuration: 0,
    }),
    [groups, anchors],
  )

  return { globeProps, portals, isHovering: hoveredId !== null, clearHover }
}
