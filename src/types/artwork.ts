import type { SelectableCountryId } from './country'

/**
 * How the artwork relates to its place of origin, per the museum record:
 * - `attributed`: the museum attributes the work to a place or culture (CMA `culture` field).
 * - `find-site`: the museum documents where the work was excavated or found (CMA `find_spot`).
 */
export type OriginRelationship = 'attributed' | 'find-site'

/**
 * How firmly the museum record states the origin. Anything other than `stated`
 * mirrors a qualifier in the record itself ("probably", "possibly", "reportedly").
 */
export type OriginCertainty = 'stated' | 'probable' | 'possible' | 'reported'

/**
 * Where an artwork comes from. This describes the object's geographical origin
 * only; it is distinct from the culture it is associated with, the artist's
 * nationality, and any place the artwork depicts.
 */
export interface ArtworkOrigin {
  /** Modern country, used only to place the artwork on the globe. */
  country: SelectableCountryId
  /** Most specific place documented in the museum record, or null if none. */
  place: string | null
  /** Historical polity or region named in the record (e.g. "State of Chu"), if any. */
  historicalRegion: string | null
  relationship: OriginRelationship
  certainty: OriginCertainty
  /** The museum field and verbatim text that support this origin. */
  evidence: { field: 'culture' | 'find_spot'; text: string }
}

export interface Artwork {
  /** Stable ID: museum prefix plus the museum's record ID (e.g. "cma-111811"). */
  id: string
  title: string
  /** Artist as recorded by the museum (may include nationality and dates), or null if unrecorded. */
  creator: string | null
  date: {
    /** Display text as recorded (e.g. "c. 120 CE", "1000s"). */
    display: string
    /** Earliest and latest possible years; negative years are BCE. */
    earliest: number | null
    latest: number | null
  }
  type: string
  medium: string
  /** Cultural association as recorded by the museum (verbatim CMA `culture`). */
  culture: string
  origin: ArtworkOrigin
  image: {
    url: string
    width: number
    height: number
    /** Reuse status as designated by the museum for this specific record. */
    license: 'CC0'
  }
  /** The museum's own description, as plain-text paragraphs; empty if none. */
  description: string[]
  source: {
    museum: string
    accessionNumber: string
    /** Official record on the museum's website. */
    recordUrl: string
    apiUrl: string
    creditLine: string
  }
}
