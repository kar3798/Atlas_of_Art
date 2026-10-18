import type { ArtLocation, MappedArtwork } from '../types/discovery'

/**
 * DEMONSTRATION DATA ONLY.
 *
 * Locations are real places with approximate published coordinates. The
 * artworks are synthetic placeholders: they make no claims about real objects,
 * findspots or museum collections, and have no images or source links. Replace
 * them with verified museum records (and verified coordinates) later.
 */
export const DEMO_LOCATIONS: ArtLocation[] = [
  {
    id: 'ind-mathura',
    name: 'Mathura',
    country: 'IND',
    lat: 27.49,
    lng: 77.67,
    precision: 'site',
    coordinateNote: 'Approximate city centre of Mathura, Uttar Pradesh.',
  },
  {
    id: 'ind-sarnath',
    name: 'Sarnath',
    country: 'IND',
    lat: 25.38,
    lng: 83.02,
    precision: 'site',
    coordinateNote: 'Approximate location of Sarnath, near Varanasi, Uttar Pradesh.',
  },
  {
    id: 'ind-deccan',
    name: 'Deccan Plateau',
    country: 'IND',
    lat: 17,
    lng: 77,
    precision: 'region',
    regionRadiusDeg: 5,
    coordinateNote: 'Approximate centre of the Deccan Plateau, for display only.',
  },
  {
    id: 'chn-xian',
    name: 'Xi’an',
    country: 'CHN',
    lat: 34.34,
    lng: 108.94,
    precision: 'site',
    coordinateNote: 'Approximate city centre of Xi’an, Shaanxi province.',
  },
  {
    id: 'chn-dunhuang',
    name: 'Dunhuang',
    country: 'CHN',
    lat: 40.14,
    lng: 94.66,
    precision: 'site',
    coordinateNote: 'Approximate city centre of Dunhuang, Gansu province.',
  },
  {
    id: 'chn-jiangnan',
    name: 'Jiangnan',
    country: 'CHN',
    lat: 31,
    lng: 120,
    precision: 'region',
    regionRadiusDeg: 2.5,
    coordinateNote: 'Approximate centre of the Jiangnan region, south of the lower Yangtze, for display only.',
  },
]

function demoArtwork(
  id: string,
  title: string,
  category: string,
  locationId: string,
  relationship: MappedArtwork['placement']['relationship'],
): MappedArtwork {
  return {
    id,
    title,
    date: 'Placeholder date',
    creator: null,
    culture: null,
    category,
    placement: { locationId, relationship },
    description: null,
    image: null,
    source: null,
    isDemo: true,
  }
}

export const DEMO_ARTWORKS: MappedArtwork[] = [
  demoArtwork('demo-ind-1', 'Demo artwork: seated figure', 'Sculpture (placeholder)', 'ind-mathura', 'created-in'),
  demoArtwork('demo-ind-2', 'Demo artwork: carved panel', 'Relief (placeholder)', 'ind-mathura', 'found-at'),
  demoArtwork('demo-ind-3', 'Demo artwork: standing figure', 'Sculpture (placeholder)', 'ind-sarnath', 'found-at'),
  demoArtwork('demo-ind-4', 'Demo artwork: temple fragment', 'Architectural fragment (placeholder)', 'ind-deccan', 'associated-with-region'),
  demoArtwork('demo-chn-1', 'Demo artwork: tomb figure', 'Ceramic (placeholder)', 'chn-xian', 'created-in'),
  demoArtwork('demo-chn-2', 'Demo artwork: bronze vessel', 'Metalwork (placeholder)', 'chn-xian', 'found-at'),
  demoArtwork('demo-chn-3', 'Demo artwork: painted scroll', 'Painting (placeholder)', 'chn-dunhuang', 'created-in'),
  demoArtwork('demo-chn-4', 'Demo artwork: lacquer box', 'Lacquerware (placeholder)', 'chn-jiangnan', 'associated-with-region'),
]
