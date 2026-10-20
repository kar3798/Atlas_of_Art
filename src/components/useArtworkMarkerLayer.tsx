import { useCallback, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { GlobeMethods } from 'react-globe.gl'
import { markersAt } from '../lib/markerHitTest'
import { markerCenterY } from '../lib/markerGeometry'
import type { MarkerStyle } from '../styles/globeThemes'
import type { LocationGroup } from '../types/discovery'
import ArtworkMarker, { type PointerPosition } from './ArtworkMarker'
import type { PreviewPlacement } from './ArtworkPreview'
import PlaceChooser from './PlaceChooser'

// Above the selected (raised) country polygon, so markers are never hidden by it.
const MARKER_ALTITUDE = 0.025
const PREVIEW_WIDTH = 260
const PREVIEW_EDGE_MARGIN = 140
const HOVER_END_DELAY_MS = 80
// Radius of a marker's hit area (the 44px button in ArtworkMarker).
const HIT_RADIUS = 22

interface MarkerLayerOptions {
  groups: LocationGroup[]
  appearance: MarkerStyle
  selectedLocationId: string | null
  onSelectLocation: (locationId: string) => void
  getGlobe: () => GlobeMethods | undefined
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

interface Chooser {
  /** The groups this chooser was opened for; it closes when they change (new country, filters). */
  groups: LocationGroup[]
  locationIds: string[]
  x: number
  y: number
  areaWidth: number
  areaHeight: number
}

/**
 * Marker-layer props for react-globe.gl, the React portals that render the markers,
 * and the place chooser overlay.
 *
 * Markers always sit at their true positions. Where several markers overlap on screen
 * (e.g. two sites 36 km apart), hovering lists every place under the pointer and
 * clicking opens a chooser, so each stays reachable without moving any marker.
 */
export function useArtworkMarkerLayer({
  groups,
  appearance,
  selectedLocationId,
  onSelectLocation,
  getGlobe,
}: MarkerLayerOptions) {
  const [hover, setHover] = useState<{
    locationId: string
    locationIds: string[]
    placement: PreviewPlacement
  } | null>(null)
  const hoverEndTimer = useRef<number | undefined>(undefined)
  const [chooserState, setChooserState] = useState<Chooser | null>(null)
  const chooser = chooserState?.groups === groups ? chooserState : null

  const groupById = useMemo(() => new Map(groups.map((group) => [group.location.id, group])), [groups])

  const anchors = useMemo(() => {
    const getCanvas = () => getGlobe()?.renderer().domElement
    return new Map(groups.map((group) => [group.location.id, createMarkerAnchor(getCanvas)]))
  }, [groups, getGlobe])

  /**
   * Every location whose marker's hit area contains the pointer, in list order, with
   * the pointer's position in the globe area. Always includes `locationId`.
   */
  const locationsUnder = useCallback(
    (locationId: string, { clientX, clientY }: PointerPosition) => {
      const globe = getGlobe()
      const canvas = globe?.renderer().domElement
      if (!globe || !canvas) return null
      const area = canvas.getBoundingClientRect()
      const point = { x: clientX - area.left, y: clientY - area.top }
      const hits = new Set(
        markersAt(
          point,
          groups
            // Markers on the far side of the globe are hidden (display: none) by globe.gl.
            .filter((group) => anchors.get(group.location.id)!.style.display !== 'none')
            .map(({ location }) => {
              const screen = globe.getScreenCoords(location.lat, location.lng, MARKER_ALTITUDE)
              return { id: location.id, x: screen.x, y: screen.y + markerCenterY(location.precision) }
            }),
          HIT_RADIUS,
        ),
      )
      hits.add(locationId)
      return {
        locationIds: groups.map((group) => group.location.id).filter((id) => hits.has(id)),
        point,
        area,
      }
    },
    [groups, anchors, getGlobe],
  )

  const startHover = useCallback(
    (locationId: string, target: HTMLElement, pointer: PointerPosition) => {
      window.clearTimeout(hoverEndTimer.current)
      const under = locationsUnder(locationId, pointer)
      setHover({
        locationId,
        locationIds: under?.locationIds ?? [locationId],
        placement: choosePlacement(target),
      })
    },
    [locationsUnder],
  )

  // A short delay avoids flicker when the pointer brushes the edge of the hit area.
  const endHover = useCallback(() => {
    window.clearTimeout(hoverEndTimer.current)
    hoverEndTimer.current = window.setTimeout(() => setHover(null), HOVER_END_DELAY_MS)
  }, [])

  const closeChooser = useCallback(() => setChooserState(null), [])

  /** Called when the user starts rotating or zooming the globe. */
  const interrupt = useCallback(() => {
    window.clearTimeout(hoverEndTimer.current)
    setHover(null)
    setChooserState(null)
  }, [])

  const selectLocation = useCallback(
    (locationId: string) => {
      interrupt()
      onSelectLocation(locationId)
    },
    [interrupt, onSelectLocation],
  )

  // A click where several markers overlap opens the chooser; otherwise it selects directly.
  const activate = useCallback(
    (locationId: string, pointer: PointerPosition) => {
      const under = locationsUnder(locationId, pointer)
      if (!under || under.locationIds.length < 2) {
        selectLocation(locationId)
        return
      }
      window.clearTimeout(hoverEndTimer.current)
      setHover(null)
      setChooserState({
        groups,
        locationIds: under.locationIds,
        x: under.point.x,
        y: under.point.y,
        areaWidth: under.area.width,
        areaHeight: under.area.height,
      })
    },
    [groups, locationsUnder, selectLocation],
  )

  // No hover previews while the chooser is open.
  const activeHover = hover && !chooser && anchors.has(hover.locationId) ? hover : null

  const portals = groups.map((group) => {
    const id = group.location.id
    return createPortal(
      <ArtworkMarker
        group={group}
        appearance={appearance}
        isSelected={id === selectedLocationId}
        isHovered={
          !!activeHover?.locationIds.includes(id) || !!chooser?.locationIds.includes(id)
        }
        preview={
          activeHover?.locationId === id
            ? {
                groups: activeHover.locationIds.map((hoveredId) => groupById.get(hoveredId)!),
                placement: activeHover.placement,
              }
            : null
        }
        onActivate={activate}
        onHoverStart={startHover}
        onHoverEnd={endHover}
      />,
      anchors.get(id)!,
      id,
    )
  })

  const overlay = chooser && (
    <PlaceChooser
      groups={chooser.locationIds.map((id) => groupById.get(id)!)}
      x={chooser.x}
      y={chooser.y}
      areaWidth={chooser.areaWidth}
      areaHeight={chooser.areaHeight}
      selectedLocationId={selectedLocationId}
      onSelect={selectLocation}
      onClose={closeChooser}
    />
  )

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

  return { globeProps, portals, overlay, isHovering: activeHover !== null, interrupt }
}
