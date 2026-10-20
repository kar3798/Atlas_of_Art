import type { Artwork, OriginCertainty } from './artwork'
import type { SelectableCountryId } from './country'

/**
 * How precisely a location is known:
 * - `site`: a specific documented site (e.g. a cave temple complex); shown as a pin.
 * - `city`: a documented city, town or village; shown as a pin, but the exact
 *   spot within it is not known.
 * - `region`: a broad area; shown as a dashed ring and outline. Its coordinates
 *   are only a visual anchor and never an artwork's exact location.
 */
export type LocationPrecision = 'site' | 'city' | 'region'

export interface ArtLocation {
  /** Stable ID shared by every artwork placed here (used for grouping). */
  id: string
  name: string
  /** Modern country, used only for navigation on the globe. */
  country: SelectableCountryId
  lat: number
  lng: number
  precision: LocationPrecision
  /** Approximate radius of a region's outline, in degrees of arc. Regions only. */
  regionRadiusDeg?: number
  /** Where the coordinates come from. */
  coordinateSource: string
  /** How the coordinates should be read (approximations, visual anchors). */
  coordinateNote: string
}

/**
 * How an artwork relates to a location, according to the cited evidence.
 * Kept separate from cultural association, artist nationality and depicted subject.
 * - `created-in` / `found-at` need a `site` or `city`.
 * - `associated-with` is a documented attribution without a stated place of
 *   creation or discovery; it is the only relationship allowed for a `region`.
 */
export type LocationRelationship = 'created-in' | 'found-at' | 'associated-with'

/** Researched geographic placement of one museum artwork. */
export interface ArtworkPlacement {
  /** Matches `Artwork.id` in artworks.json. */
  artworkId: string
  /** Matches `Artwork.source.accessionNumber`; checked by the validator. */
  accessionNumber: string
  locationId: string
  relationship: LocationRelationship
  /** Mirrors the source's own qualifier ("probably", "reportedly", …). */
  certainty: OriginCertainty
  /** The evidence for the placement: which source field, what it says, and where. */
  evidence: { field: 'culture' | 'description' | 'citations'; text: string; sourceUrl: string }
  /** Short explanation of uncertainty or approximation. */
  note: string
}

/** An artwork together with its researched placement. */
export interface PlacedArtwork {
  artwork: Artwork
  placement: ArtworkPlacement
}

/** One marker on the globe: a location with every artwork placed there. */
export interface LocationGroup {
  location: ArtLocation
  entries: PlacedArtwork[]
}
