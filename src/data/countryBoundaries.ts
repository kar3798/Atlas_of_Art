import type { CountryCode, CountryFeature } from '../types/country'
import boundaries from './ne_110m_admin_0_countries.json'

/**
 * Natural Earth 1:110m admin-0 country boundaries (public domain), reduced to
 * the fields this app uses. Modern borders are a navigational aid only.
 */
export const COUNTRY_FEATURES = boundaries.features as unknown as CountryFeature[]

const featuresById = new Map(
  COUNTRY_FEATURES.map((feature) => [feature.properties.id, feature]),
)

export function getCountryFeature(id: CountryCode): CountryFeature | undefined {
  return featuresById.get(id)
}
