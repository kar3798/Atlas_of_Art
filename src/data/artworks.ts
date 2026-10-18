import type { Artwork } from '../types/artwork'
import type { SelectableCountryId } from '../types/country'
import dataset from './artworks.json'

/**
 * Curated artworks from the Cleveland Museum of Art Open Access API.
 * Generated and validated by scripts/fetch-artworks.mjs; do not edit by hand.
 */
export const ARTWORKS = dataset.artworks as Artwork[]
export const ARTWORKS_RETRIEVED_AT = dataset.retrievedAt

export function getArtworksForCountry(id: SelectableCountryId): Artwork[] {
  return ARTWORKS.filter((artwork) => artwork.origin.country === id)
}
