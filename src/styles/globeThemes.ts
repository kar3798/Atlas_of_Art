/**
 * Visual styles for the globe. Each theme only describes appearance; all
 * interaction logic in GlobeView is shared between themes.
 */
export type GlobeThemeId = 'realistic' | 'antique'

export interface GlobeTheme {
  label: string
  textureUrl: string
  atmosphere: { color: string; altitude: number }
  /** Applied to globe.gl's default ambient and directional lights. */
  lights: {
    ambientColor: string
    ambientIntensity: number
    directionalColor: string
    directionalIntensity: number
  }
  countries: {
    stroke: string
    selectableStroke: string
    selectedStroke: string
    hoverFill: string
    selectableHoverFill: string
    selectedFill: string
    selectedSide: string
  }
  /** Latitude/longitude lines; `null` hides them. */
  graticule: { step: number; color: string; equatorColor: string } | null
  /** Surface finish (Phong specular highlight); `null` keeps globe.gl's default material. */
  varnish: { specularColor: string; shininess: number } | null
}

// Theme colors as RGB triplets so opacity can vary per state.
const GOLD = '201, 169, 110'
const IVORY = '243, 236, 224'
const INK = '52, 36, 20'
const WARM_GOLD = '214, 166, 72'

export const GLOBE_THEMES: Record<GlobeThemeId, GlobeTheme> = {
  realistic: {
    label: 'Realistic',
    textureUrl: '/textures/earth-blue-marble.jpg',
    atmosphere: { color: '#e9d8b4', altitude: 0.16 },
    // globe.gl defaults
    lights: {
      ambientColor: '#cccccc',
      ambientIntensity: Math.PI,
      directionalColor: '#ffffff',
      directionalIntensity: 0.6 * Math.PI,
    },
    countries: {
      stroke: `rgba(${IVORY}, 0.22)`,
      selectableStroke: `rgba(${GOLD}, 0.55)`,
      selectedStroke: `rgba(${GOLD}, 0.95)`,
      hoverFill: `rgba(${IVORY}, 0.1)`,
      selectableHoverFill: `rgba(${GOLD}, 0.22)`,
      selectedFill: `rgba(${GOLD}, 0.38)`,
      selectedSide: `rgba(${GOLD}, 0.25)`,
    },
    graticule: null,
    varnish: null,
  },
  antique: {
    label: 'Antique',
    textureUrl: '/textures/earth-antique.jpg',
    atmosphere: { color: '#d8b679', altitude: 0.12 },
    // Warm, slightly softer light, like a globe under lamplight.
    lights: {
      ambientColor: '#e6d6b8',
      ambientIntensity: 0.95 * Math.PI,
      directionalColor: '#fff0d4',
      directionalIntensity: 0.5 * Math.PI,
    },
    countries: {
      stroke: `rgba(${INK}, 0.5)`,
      selectableStroke: `rgba(${INK}, 0.85)`,
      selectedStroke: 'rgba(120, 78, 20, 1)',
      hoverFill: `rgba(${WARM_GOLD}, 0.2)`,
      selectableHoverFill: `rgba(${WARM_GOLD}, 0.32)`,
      selectedFill: `rgba(${WARM_GOLD}, 0.5)`,
      selectedSide: 'rgba(140, 96, 30, 0.4)',
    },
    graticule: {
      step: 30,
      color: `rgba(${INK}, 0.28)`,
      equatorColor: `rgba(${INK}, 0.6)`,
    },
    // A dim, warm, broad highlight: aged shellac rather than glossy plastic.
    varnish: { specularColor: '#3d2f1c', shininess: 12 },
  },
}

export const DEFAULT_GLOBE_THEME: GlobeThemeId = 'realistic'
