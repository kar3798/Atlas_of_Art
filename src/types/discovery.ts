import type { SelectableCountryId } from './country'

/**
 * How precisely a location is known:
 * - `site`: a documented site or city; shown as a pin.
 * - `region`: a broad area; shown as an outlined area. Its coordinates are only
 *   an approximate centre for display and never identify an exact location.
 */
export type LocationPrecision = 'site' | 'region'

export interface ArtLocation {
  /** Stable ID shared by every artwork at this location (used for grouping). */
  id: string
  name: string
  /** Modern country, used only for navigation on the globe. */
  country: SelectableCountryId
  lat: number
  lng: number
  precision: LocationPrecision
  /** Approximate radius of a region, in degrees of arc. Regions only. */
  regionRadiusDeg?: number
  /** Where the coordinates come from, so they can be checked or replaced. */
  coordinateNote: string
}

/**
 * How an artwork relates to a location. Kept separate from cultural association,
 * artist nationality and depicted subject, which are different concepts.
 * - `created-in` and `found-at` require a `site` location.
 * - `associated-with-region` requires a `region` location.
 */
export type LocationRelationship = 'created-in' | 'found-at' | 'associated-with-region'

/** An artwork placed on the globe. Demo records and verified museum records share this shape. */
export interface MappedArtwork {
  id: string
  title: string
  /** Date or period as recorded, or null if unknown. */
  date: string | null
  /** Artist, if known. */
  creator: string | null
  /** Cultural association, if recorded. */
  culture: string | null
  /** Medium or artwork category. */
  category: string | null
  placement: { locationId: string; relationship: LocationRelationship }
  /** Short description from a verified source; null shows a placeholder. */
  description: string | null
  /** Licensed image; null shows a CSS placeholder. */
  image: { url: string; alt: string; license: string } | null
  /** Official museum source; null for demo records (no links are invented). */
  source: { museum: string; recordUrl: string; accessionNumber: string; creditLine: string } | null
  /** True for synthetic demonstration content. */
  isDemo: boolean
}

/** One marker on the globe: a location with every artwork placed there. */
export interface LocationGroup {
  location: ArtLocation
  artworks: MappedArtwork[]
}
