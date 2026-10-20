import type { SelectableCountryId } from '../types/country'

/** DOM id of a country's picker button, used to return focus after clearing. */
export const countryOptionId = (id: SelectableCountryId) => `country-option-${id}`

/** DOM ids of panel list buttons, used to return focus when stepping back from a detail view. */
export const locationOptionId = (id: string) => `location-option-${id}`
export const artworkOptionId = (id: string) => `artwork-option-${id}`
export const galleryCardId = (id: string) => `gallery-card-${id}`
