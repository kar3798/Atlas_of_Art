import { useCallback, useEffect, useRef, useState } from 'react'
import Globe, { type GlobeMethods } from 'react-globe.gl'
import { COUNTRY_FEATURES, getCountryFeature } from '../data/countryBoundaries'
import { isSelectableCountry } from '../data/selectableCountries'
import { useElementSize } from '../lib/useElementSize'
import type {
  CountryFeature,
  CountrySelection,
  SelectableCountryId,
} from '../types/country'

const EARTH_TEXTURE = '/textures/earth-blue-marble.jpg'

// Globe radius is 100 scene units; these bound the camera distance from the center.
const MIN_DISTANCE = 140
const MAX_DISTANCE = 600

const AUTO_ROTATE_SPEED = 0.35
const RESUME_ROTATION_DELAY_MS = 4000

// Initial view centered between India and China.
const INITIAL_VIEW = { lat: 24, lng: 88, altitude: 2.4 }

const FOCUS_ALTITUDE = 1.8
const FOCUS_TRANSITION_MS = 1200

// Theme colors as RGB triplets so opacity can vary per state.
const GOLD = '201, 169, 110'
const IVORY = '243, 236, 224'
const TRANSPARENT = 'rgba(0, 0, 0, 0)'

interface GlobeViewProps {
  selection: CountrySelection | null
  onSelect: (id: SelectableCountryId) => void
}

const asCountry = (obj: object) => obj as CountryFeature

function countryTooltip(obj: object) {
  const { id, name } = asCountry(obj).properties
  const hint = isSelectableCountry(id)
    ? '<span class="globe-tooltip-hint">Select to explore</span>'
    : ''
  return `<div class="globe-tooltip">${name}${hint}</div>`
}

export default function GlobeView({ selection, onSelect }: GlobeViewProps) {
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

  const handleGlobeReady = () => {
    const globe = globeRef.current
    if (!globe) return

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

  const capColor = useCallback(
    (obj: object) => {
      const country = asCountry(obj)
      const { id } = country.properties
      if (id === selectedId) return `rgba(${GOLD}, 0.38)`
      if (country !== hovered) return TRANSPARENT
      return isSelectableCountry(id) ? `rgba(${GOLD}, 0.22)` : `rgba(${IVORY}, 0.1)`
    },
    [selectedId, hovered],
  )

  const sideColor = useCallback(
    (obj: object) =>
      asCountry(obj).properties.id === selectedId ? `rgba(${GOLD}, 0.25)` : TRANSPARENT,
    [selectedId],
  )

  const strokeColor = useCallback(
    (obj: object) => {
      const { id } = asCountry(obj).properties
      if (id === selectedId) return `rgba(${GOLD}, 0.95)`
      return isSelectableCountry(id) ? `rgba(${GOLD}, 0.55)` : `rgba(${IVORY}, 0.22)`
    },
    [selectedId],
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
          globeImageUrl={EARTH_TEXTURE}
          showAtmosphere
          atmosphereColor="#e9d8b4"
          atmosphereAltitude={0.16}
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
        />
      )}
    </div>
  )
}
