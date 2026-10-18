import { useEffect, useRef } from 'react'
import Globe, { type GlobeMethods } from 'react-globe.gl'
import { useElementSize } from '../lib/useElementSize'

const EARTH_TEXTURE = '/textures/earth-blue-marble.jpg'

// Globe radius is 100 scene units; these bound the camera distance from the center.
const MIN_DISTANCE = 140
const MAX_DISTANCE = 600

const AUTO_ROTATE_SPEED = 0.35
const RESUME_ROTATION_DELAY_MS = 4000

// Initial view centered between India and China.
const INITIAL_VIEW = { lat: 24, lng: 88, altitude: 2.4 }

export default function GlobeView() {
  const [containerRef, { width, height }] = useElementSize<HTMLDivElement>()
  const globeRef = useRef<GlobeMethods | undefined>(undefined)
  const resumeTimer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(resumeTimer.current), [])

  const handleGlobeReady = () => {
    const globe = globeRef.current
    if (!globe) return

    globe.pointOfView(INITIAL_VIEW)

    const controls = globe.controls()
    controls.enableDamping = true
    controls.enablePan = false
    controls.minDistance = MIN_DISTANCE
    controls.maxDistance = MAX_DISTANCE
    controls.autoRotate = true
    controls.autoRotateSpeed = AUTO_ROTATE_SPEED

    // Pause auto-rotation while the user interacts; resume after a quiet period.
    controls.addEventListener('start', () => {
      window.clearTimeout(resumeTimer.current)
      controls.autoRotate = false
    })
    controls.addEventListener('end', () => {
      resumeTimer.current = window.setTimeout(() => {
        controls.autoRotate = true
      }, RESUME_ROTATION_DELAY_MS)
    })
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
        />
      )}
    </div>
  )
}
