import { ARTWORKS } from '../data/artworks'
import placementData from '../data/artworkPlacements.json'
import type { OriginCertainty } from '../types/artwork'
import type { SelectableCountryId } from '../types/country'
import type {
  ArtLocation,
  ArtworkPlacement,
  LocationGroup,
  LocationPrecision,
  LocationRelationship,
} from '../types/discovery'

/** Precisions each relationship may use. Mirrored in scripts/validate-data.mjs. */
const ALLOWED_PRECISION: Record<LocationRelationship, LocationPrecision[]> = {
  'created-in': ['site', 'city'],
  'found-at': ['site', 'city'],
  'associated-with': ['site', 'city', 'region'],
}

const LOCATIONS = placementData.locations as ArtLocation[]
const PLACEMENTS = placementData.placements as ArtworkPlacement[]

/**
 * Joins curated placements to museum artworks and groups them by location.
 * Inconsistent data fails loudly here as well as in `npm run validate:data`.
 */
function buildGroups(): LocationGroup[] {
  return LOCATIONS.map((location) => {
    const entries = PLACEMENTS.filter((p) => p.locationId === location.id).map((placement) => {
      const artwork = ARTWORKS.find((a) => a.id === placement.artworkId)
      if (!artwork) throw new Error(`Placement refers to unknown artwork ${placement.artworkId}`)
      if (!ALLOWED_PRECISION[placement.relationship].includes(location.precision)) {
        throw new Error(
          `${placement.artworkId}: "${placement.relationship}" cannot use a ${location.precision} location (${location.id})`,
        )
      }
      return { artwork, placement }
    })
    return { location, entries }
  }).filter((group) => group.entries.length > 0)
}

const GROUPS = buildGroups()
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

/** The researched placement of an artwork, or null if it is not placed on the globe. */
export function findPlacement(artworkId: string | null): ArtworkPlacement | null {
  return PLACEMENTS.find((placement) => placement.artworkId === artworkId) ?? null
}

export const PRECISION_LABEL: Record<LocationPrecision, string> = {
  site: 'Specific site',
  city: 'City or town',
  region: 'Regional association',
}

export const PRECISION_NOTE: Record<LocationPrecision, string> = {
  site: 'The marker shows a documented site.',
  city: 'The marker shows the city or town; the exact spot within it is not known.',
  region: 'The marker is a visual anchor for a broad region, not an exact location.',
}

const CERTAINTY_PREFIX: Record<OriginCertainty, string> = {
  stated: '',
  probable: 'Probably',
  possible: 'Possibly',
  reported: 'Reportedly',
}

/** e.g. "Created in Ye", "Reportedly found at Changsha", "Probably associated with region: Henan". */
export function relationshipLabel(placement: ArtworkPlacement, location: ArtLocation): string {
  const base =
    placement.relationship === 'created-in'
      ? `Created in ${location.name}`
      : placement.relationship === 'found-at'
        ? `Found at ${location.name}`
        : location.precision === 'region'
          ? `Associated with region: ${location.name}`
          : `Associated with ${location.name}`
  const prefix = CERTAINTY_PREFIX[placement.certainty]
  return prefix ? `${prefix} ${base.charAt(0).toLowerCase()}${base.slice(1)}` : base
}

export const UNPLACED_LABEL = 'Exact origin unknown'
export const UNPLACED_NOTE =
  'The museum record does not document a location precise enough to show on the globe.'
