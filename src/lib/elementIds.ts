import type { SelectableCountryId } from '../types/country'

/** DOM id of a country's picker button, used to return focus after clearing. */
export const countryOptionId = (id: SelectableCountryId) => `country-option-${id}`
