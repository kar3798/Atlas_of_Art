/**
 * Natural Earth `ADM0_A3` code (e.g. "IND", "CHN"). Used as a stable identifier
 * instead of display names, which can vary by language or convention.
 */
export type CountryCode = string

export interface CountryProperties {
  id: CountryCode
  name: string
  /** Natural Earth's suggested label point, used to focus the camera. */
  labelLat: number
  labelLng: number
}

export interface CountryFeature {
  type: 'Feature'
  properties: CountryProperties
  geometry: {
    type: 'Polygon' | 'MultiPolygon'
    coordinates: number[][][] | number[][][][]
  }
}

/** Countries that can currently be selected to explore artworks. */
export type SelectableCountryId = 'IND' | 'CHN'

export interface SelectableCountry {
  id: SelectableCountryId
  name: string
}

/**
 * The current country selection; `null` in state means nothing is selected.
 * A new object is created on every selection, so re-selecting the same
 * country refocuses the globe.
 */
export interface CountrySelection {
  countryId: SelectableCountryId
}
