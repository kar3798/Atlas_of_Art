import { DEMO_ARTWORKS, DEMO_LOCATIONS } from '../data/demoDiscovery'
import type { SelectableCountryId } from '../types/country'
import type {
  ArtLocation,
  LocationGroup,
  LocationPrecision,
  LocationRelationship,
  MappedArtwork,
} from '../types/discovery'

const REQUIRED_PRECISION: Record<LocationRelationship, LocationPrecision> = {
  'created-in': 'site',
  'found-at': 'site',
  'associated-with-region': 'region',
}

/** Groups artworks by shared location ID, checking each relationship suits the location's precision. */
function buildGroups(locations: ArtLocation[], artworks: MappedArtwork[]): LocationGroup[] {
  return locations
    .map((location) => {
      const placed = artworks.filter((a) => a.placement.locationId === location.id)
      for (const artwork of placed) {
        const required = REQUIRED_PRECISION[artwork.placement.relationship]
        if (required !== location.precision) {
          throw new Error(
            `${artwork.id}: "${artwork.placement.relationship}" needs a ${required} location, but ${location.id} is a ${location.precision}`,
          )
        }
      }
      return { location, artworks: placed }
    })
    .filter((group) => group.artworks.length > 0)
}

const GROUPS = buildGroups(DEMO_LOCATIONS, DEMO_ARTWORKS)
const groupsByCountry = new Map<SelectableCountryId, LocationGroup[]>()

/** Location groups for a country; the same array is returned on every call. */
export function getLocationGroups(country: SelectableCountryId): LocationGroup[] {
  let groups = groupsByCountry.get(country)
  if (!groups) {
    groups = GROUPS.filter((group) => group.location.country === country)
    groupsByCountry.set(country, groups)
  }
  return groups
}

export function findGroup(locationId: string | null): LocationGroup | null {
  return GROUPS.find((group) => group.location.id === locationId) ?? null
}

export function findMappedArtwork(id: string | null): MappedArtwork | null {
  return DEMO_ARTWORKS.find((artwork) => artwork.id === id) ?? null
}

export const PRECISION_LABEL: Record<LocationPrecision, string> = {
  site: 'Specific location',
  region: 'Regional association',
}

export const PRECISION_NOTE: Record<LocationPrecision, string> = {
  site: 'The marker shows a documented site or city.',
  region: 'The marker shows a broad region, not an exact location.',
}

export function relationshipLabel(relationship: LocationRelationship, place: string): string {
  switch (relationship) {
    case 'created-in':
      return `Created in ${place}`
    case 'found-at':
      return `Found at ${place}`
    case 'associated-with-region':
      return `Associated with region: ${place}`
  }
}
