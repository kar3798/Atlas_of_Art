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
import { createGraticule, type GraticuleLine } from '../lib/graticule'
import { useElementSize } from '../lib/useElementSize'
import type { GlobeTheme } from '../styles/globeThemes'
import type {
  CountryFeature,
  CountrySelection,
  SelectableCountryId,
} from '../types/country'

// Globe radius is 100 scene units; these bound the camera distance from the center.
const MIN_DISTANCE = 140
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

interface GlobeViewProps {
  theme: GlobeTheme
  selection: CountrySelection | null
  onSelect: (id: SelectableCountryId) => void
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

function countryTooltip(obj: object) {
  const { id, name } = asCountry(obj).properties
  const hint = isSelectableCountry(id)
    ? '<span class="globe-tooltip-hint">Select to explore</span>'
    : ''
  return `<div class="globe-tooltip">${name}${hint}</div>`
}

export default function GlobeView({ theme, selection, onSelect }: GlobeViewProps) {
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
  const graticuleColor = useCallback(
    (obj: object) => {
      if (!graticuleStyle) return TRANSPARENT
      return (obj as GraticuleLine).isEquator
        ? graticuleStyle.equatorColor
        : graticuleStyle.color
    },
    [graticuleStyle],
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

  const handleCountryClick = (obj: object) => {
    const { id } = asCountry(obj).properties
    if (isSelectableCountry(id)) onSelect(id)
  }

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 cursor-grab touch-none active:cursor-grabbing"
      aria-label="Interactive 3D globe. Drag to rotate, scroll or pinch to zoom."
      role="img"
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
          polygonLabel={countryTooltip}
          onPolygonHover={(obj) => setHovered(obj ? asCountry(obj) : null)}
          onPolygonClick={handleCountryClick}
          showPointerCursor={(type, obj) =>
            type === 'polygon' && isSelectableCountry(asCountry(obj).properties.id)
          }
          pathsData={graticule}
          pathPoints="points"
          pathColor={graticuleColor}
          pathPointAlt={GRATICULE_ALTITUDE}
          pathTransitionDuration={0}
          pointerEventsFilter={isInteractive}
        />
      )}
    </div>
  )
}
