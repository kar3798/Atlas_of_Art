import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Globe, { type GlobeMethods } from 'react-globe.gl'
import {
  AmbientLight,
  DirectionalLight,
  MeshPhongMaterial,
  type Material,
  type Object3D,
} from 'three'
import { COUNTRY_FEATURES, getCountryFeature } from '../data/countryBoundaries'
import { isSelectableCountry } from '../data/selectableCountries'
import { sphericalCircle } from '../lib/geo'
import { createGraticule, type GraticuleLine } from '../lib/graticule'
import { useElementSize } from '../lib/useElementSize'
import type { GlobeTheme } from '../styles/globeThemes'
import type {
  CountryFeature,
  CountrySelection,
  SelectableCountryId,
} from '../types/country'
import type { LocationGroup } from '../types/discovery'
import { useArtworkMarkerLayer } from './useArtworkMarkerLayer'

// Globe radius is 100 scene units; these bound the camera distance from the center.
// The closest zoom (15 units above the surface) lets sites tens of kilometres apart,
// such as Ye and Xiangtangshan (36 km), show as distinct pins. Earlier limit: 140.
const MIN_DISTANCE = 115
const MAX_DISTANCE = 600

const AUTO_ROTATE_SPEED = 0.35
const RESUME_ROTATION_DELAY_MS = 4000

// Initial view centered between India and China.
const INITIAL_VIEW = { lat: 24, lng: 88, altitude: 2.4 }

const FOCUS_ALTITUDE = 1.8
const FOCUS_TRANSITION_MS = 1200

const TRANSPARENT = 'rgba(0, 0, 0, 0)'

// Just above unhighlighted country polygons (altitude 0.005) so lines aren't hidden by them.
const GRATICULE_ALTITUDE = 0.006
// Region outlines sit above the raised selected country (0.02) so they stay crisp.
const REGION_OUTLINE_ALTITUDE = 0.022

// Closer for documented sites than for broad regions.
const LOCATION_FOCUS_ALTITUDE = { site: 1.35, city: 1.35, region: 1.6 }
const LOCATION_FOCUS_TRANSITION_MS = 1000

/** Dashed outline of a broad region; its points carry their own altitude. */
interface RegionOutline {
  regionId: string
  points: [number, number, number][]
}

type GlobePath = GraticuleLine | RegionOutline
const isRegionOutline = (obj: object): obj is RegionOutline => 'regionId' in obj

// Layer accessors live at module level: globe.gl rebuilds a layer whenever an
// accessor prop changes identity, so inline functions would rebuild it on every render.
const pathPointAlt = (point: object) => (point as number[])[2] ?? GRATICULE_ALTITUDE
const pathDashLength = (obj: object) => (isRegionOutline(obj) ? 0.018 : 1)
const pathDashGap = (obj: object) => (isRegionOutline(obj) ? 0.012 : 0)

interface GlobeViewProps {
  theme: GlobeTheme
  selection: CountrySelection | null
  onSelect: (id: SelectableCountryId) => void
  /** Artwork locations to mark on the globe (empty when no country is selected). */
  markerGroups: LocationGroup[]
  selectedLocationId: string | null
  onSelectLocation: (locationId: string) => void
}

/** Recolors globe.gl's default ambient and directional lights to match the theme. */
function applyLights(globe: GlobeMethods, { lights }: GlobeTheme) {
  for (const light of globe.lights()) {
    if (light instanceof AmbientLight) {
      light.color.set(lights.ambientColor)
      light.intensity = lights.ambientIntensity
    } else if (light instanceof DirectionalLight) {
      light.color.set(lights.directionalColor)
      light.intensity = lights.directionalIntensity
    }
  }
}

// One material per theme, created on first use and reused across theme switches.
const varnishMaterials = new WeakMap<GlobeTheme, Material>()

/** The theme's globe material, or `null` to restore globe.gl's default material. */
function globeMaterialFor(theme: GlobeTheme): Material | null {
  if (!theme.varnish) return null
  let material = varnishMaterials.get(theme)
  if (!material) {
    material = new MeshPhongMaterial({
      color: 0x000000, // Matches globe.gl's default; replaced by the texture once loaded.
      specular: theme.varnish.specularColor,
      shininess: theme.varnish.shininess,
    })
    varnishMaterials.set(theme, material)
  }
  return material
}

// Graticule lines are decorative and must not intercept country hover or clicks.
const isInteractive = (obj: Object3D) =>
  (obj as Object3D & { __globeObjType?: string }).__globeObjType !== 'path'

const asCountry = (obj: object) => obj as CountryFeature

/** Country tooltip; the "Select to explore" hint is dropped once that country is selected. */
function countryTooltip(obj: object, selectedId: SelectableCountryId | null) {
  const { id, name } = asCountry(obj).properties
  const hint =
    isSelectableCountry(id) && id !== selectedId
      ? `<span class="globe-tooltip-hint" data-country="${id}">Select to explore</span>`
      : ''
  return `<div class="globe-tooltip">${name}${hint}</div>`
}

export default function GlobeView({
  theme,
  selection,
  onSelect,
  markerGroups,
  selectedLocationId,
  onSelectLocation,
}: GlobeViewProps) {
  const [containerRef, { width, height }] = useElementSize<HTMLDivElement>()
  const globeRef = useRef<GlobeMethods | undefined>(undefined)
  const resumeTimer = useRef<number | undefined>(undefined)
  const isInteracting = useRef(false)
  const selectionRef = useRef(selection)
  const [hovered, setHovered] = useState<CountryFeature | null>(null)

  const selectedId = selection?.countryId ?? null

  useEffect(() => () => window.clearTimeout(resumeTimer.current), [])

  // Rotate only when idle and nothing is selected, so a selected country stays in view.
  const updateAutoRotate = useCallback(() => {
    const globe = globeRef.current
    if (!globe) return
    globe.controls().autoRotate =
      !isInteracting.current && selectionRef.current === null
  }, [])

  const focusCountry = useCallback((id: SelectableCountryId) => {
    const feature = getCountryFeature(id)
    if (!feature) return
    const { labelLat, labelLng } = feature.properties
    globeRef.current?.pointOfView(
      { lat: labelLat, lng: labelLng, altitude: FOCUS_ALTITUDE },
      FOCUS_TRANSITION_MS,
    )
  }, [])

  useEffect(() => {
    selectionRef.current = selection
    updateAutoRotate()
    if (selection) focusCountry(selection.countryId)
  }, [selection, updateAutoRotate, focusCountry])

  useEffect(() => {
    if (globeRef.current) applyLights(globeRef.current, theme)
  }, [theme])

  const getGlobe = useCallback(() => globeRef.current, [])
  const markers = useArtworkMarkerLayer({
    groups: markerGroups,
    appearance: theme.markers,
    selectedLocationId,
    onSelectLocation,
    getGlobe,
  })
  const interruptMarkers = markers.interrupt

  // Gently turn toward a newly selected location. Manual gestures cancel this (see 'start' below).
  const selectedLocation =
    markerGroups.find((group) => group.location.id === selectedLocationId)?.location ?? null
  useEffect(() => {
    if (!selectedLocation) return
    const { lat, lng, precision } = selectedLocation
    globeRef.current?.pointOfView(
      { lat, lng, altitude: LOCATION_FOCUS_ALTITUDE[precision] },
      LOCATION_FOCUS_TRANSITION_MS,
    )
  }, [selectedLocation])

  const handleGlobeReady = () => {
    const globe = globeRef.current
    if (!globe) return

    applyLights(globe, theme)

    const controls = globe.controls()
    controls.enableDamping = true
    controls.enablePan = false
    controls.minDistance = MIN_DISTANCE
    controls.maxDistance = MAX_DISTANCE
    controls.autoRotateSpeed = AUTO_ROTATE_SPEED

    // Pause auto-rotation while the user interacts; resume after a quiet period.
    controls.addEventListener('start', () => {
      window.clearTimeout(resumeTimer.current)
      isInteracting.current = true
      controls.autoRotate = false
      // Hide marker previews and close the place chooser.
      interruptMarkers()
      // Stop any in-progress focus animation so it doesn't fight the gesture.
      globe.pointOfView(globe.pointOfView())
    })
    controls.addEventListener('end', () => {
      resumeTimer.current = window.setTimeout(() => {
        isInteracting.current = false
        updateAutoRotate()
      }, RESUME_ROTATION_DELAY_MS)
    })

    if (selectionRef.current) focusCountry(selectionRef.current.countryId)
    else globe.pointOfView(INITIAL_VIEW)
    updateAutoRotate()
  }

  const colors = theme.countries

  const graticuleStyle = theme.graticule
  const graticule = useMemo(
    () => (graticuleStyle ? createGraticule(graticuleStyle.step) : []),
    [graticuleStyle],
  )
  const regionOutlines = useMemo<RegionOutline[]>(
    () =>
      markerGroups
        .map((group) => group.location)
        .filter((location) => location.precision === 'region' && location.regionRadiusDeg)
        .map((location) => ({
          regionId: location.id,
          points: sphericalCircle(location.lat, location.lng, location.regionRadiusDeg!).map(
            ([lat, lng]): [number, number, number] => [lat, lng, REGION_OUTLINE_ALTITUDE],
          ),
        })),
    [markerGroups],
  )
  const paths = useMemo<GlobePath[]>(
    () => [...graticule, ...regionOutlines],
    [graticule, regionOutlines],
  )

  const pathColor = useCallback(
    (obj: object) => {
      if (isRegionOutline(obj)) {
        return obj.regionId === selectedLocationId
          ? theme.markers.regionOutlineSelected
          : theme.markers.regionOutline
      }
      if (!graticuleStyle) return TRANSPARENT
      return (obj as GraticuleLine).isEquator
        ? graticuleStyle.equatorColor
        : graticuleStyle.color
    },
    [graticuleStyle, selectedLocationId, theme.markers],
  )

  const capColor = useCallback(
    (obj: object) => {
      const country = asCountry(obj)
      const { id } = country.properties
      if (id === selectedId) return colors.selectedFill
      if (country !== hovered) return TRANSPARENT
      return isSelectableCountry(id) ? colors.selectableHoverFill : colors.hoverFill
    },
    [selectedId, hovered, colors],
  )

  const sideColor = useCallback(
    (obj: object) =>
      asCountry(obj).properties.id === selectedId ? colors.selectedSide : TRANSPARENT,
    [selectedId, colors],
  )

  const strokeColor = useCallback(
    (obj: object) => {
      const { id } = asCountry(obj).properties
      if (id === selectedId) return colors.selectedStroke
      return isSelectableCountry(id) ? colors.selectableStroke : colors.stroke
    },
    [selectedId, colors],
  )

  const altitude = useCallback(
    (obj: object) => {
      const country = asCountry(obj)
      if (country.properties.id === selectedId) return 0.02
      return country === hovered ? 0.01 : 0.005
    },
    [selectedId, hovered],
  )

  // Tooltip content only (not a layer accessor), so a new identity doesn't rebuild polygons.
  const polygonLabel = useCallback((obj: object) => countryTooltip(obj, selectedId), [selectedId])

  // globe.gl only recomputes tooltip text when the pointer moves to a different object,
  // so a tooltip already showing for the just-selected country keeps its old hint.
  // Remove that stale hint directly.
  useEffect(() => {
    if (!selectedId) return
    containerRef.current
      ?.querySelectorAll(`.globe-tooltip-hint[data-country="${selectedId}"]`)
      .forEach((hint) => hint.remove())
  }, [selectedId, containerRef])

  const handleCountryClick = (obj: object) => {
    const { id } = asCountry(obj).properties
    if (isSelectableCountry(id)) onSelect(id)
  }

  return (
    <>
      <div
        ref={containerRef}
        className="absolute inset-0 cursor-grab touch-none active:cursor-grabbing"
        aria-label="Interactive 3D globe. Drag to rotate, scroll or pinch to zoom."
        role="img"
        data-globe-area
        data-marker-hover={markers.isHovering ? '' : undefined}
      >
        {width > 0 && height > 0 && (
          <Globe
            ref={globeRef}
            width={width}
            height={height}
            backgroundColor="rgba(0, 0, 0, 0)"
            globeImageUrl={theme.textureUrl}
            // null (not undefined) is what tells globe.gl to restore its default material.
            globeMaterial={globeMaterialFor(theme) as Material}
            showAtmosphere
            atmosphereColor={theme.atmosphere.color}
            atmosphereAltitude={theme.atmosphere.altitude}
            onGlobeReady={handleGlobeReady}
            polygonsData={COUNTRY_FEATURES}
            polygonCapColor={capColor}
            polygonSideColor={sideColor}
            polygonStrokeColor={strokeColor}
            polygonAltitude={altitude}
            polygonsTransitionDuration={300}
            polygonLabel={polygonLabel}
            onPolygonHover={(obj) => setHovered(obj ? asCountry(obj) : null)}
            onPolygonClick={handleCountryClick}
            showPointerCursor={(type, obj) =>
              type === 'polygon' && isSelectableCountry(asCountry(obj).properties.id)
            }
            pathsData={paths}
            pathPoints="points"
            pathColor={pathColor}
            pathPointAlt={pathPointAlt}
            pathDashLength={pathDashLength}
            pathDashGap={pathDashGap}
            pathTransitionDuration={0}
            pointerEventsFilter={isInteractive}
            {...markers.globeProps}
          />
        )}
        {markers.portals}
      </div>
      {/* Outside the role="img" globe so assistive technology can reach it; covers the same area. */}
      {markers.overlay}
    </>
  )
}
