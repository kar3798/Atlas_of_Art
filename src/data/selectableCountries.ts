import type {
  CountryCode,
  SelectableCountry,
  SelectableCountryId,
} from '../types/country'

/**
 * Countries that can be selected. Each entry is the place to attach future
 * collection details (e.g. museum API queries) for that country.
 */
export const SELECTABLE_COUNTRIES: readonly SelectableCountry[] = [
  { id: 'IND', name: 'India' },
  { id: 'CHN', name: 'China' },
]

export function isSelectableCountry(id: CountryCode): id is SelectableCountryId {
  return SELECTABLE_COUNTRIES.some((country) => country.id === id)
}

export function getSelectableCountry(id: SelectableCountryId): SelectableCountry {
  return SELECTABLE_COUNTRIES.find((country) => country.id === id)!
}
