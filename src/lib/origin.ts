import { getSelectableCountry } from '../data/selectableCountries'
import type { ArtworkOrigin, OriginCertainty } from '../types/artwork'

const CERTAINTY_PREFIX: Record<OriginCertainty, string> = {
  stated: '',
  probable: 'Probably ',
  possible: 'Possibly ',
  reported: 'Reportedly ',
}

/** Short origin label for cards, e.g. "Probably Henan province, China". */
export function originLabel(origin: ArtworkOrigin): string {
  const country = getSelectableCountry(origin.country).name
  const place = origin.place ? `${origin.place}, ${country}` : country
  const prefix = origin.relationship === 'find-site' ? 'Found at ' : CERTAINTY_PREFIX[origin.certainty]
  return prefix ? prefix + place : place
}

const CERTAINTY_NOTE: Record<OriginCertainty, string> = {
  stated: 'Stated in the museum record',
  probable: 'The museum record says “probably”',
  possible: 'The museum record says “possibly”',
  reported: 'The museum record says “reportedly”',
}

/** Explains the basis and certainty of an origin, for the detail view. */
export function originNote(origin: ArtworkOrigin): string {
  const basis =
    origin.relationship === 'find-site' ? 'Find site recorded by the museum' : 'Attributed by the museum'
  return `${basis}. ${CERTAINTY_NOTE[origin.certainty]}.`
}
