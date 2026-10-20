/**
 * Validates the public artwork data and the curated geographic placements.
 *
 *   npm run validate:data      (also runs automatically before `npm run build`)
 *
 * Checks src/data/artworks.json (museum records) against
 * src/data/artworkPlacements.json (researched locations) and exits non-zero on
 * any problem. No network access; no dependencies.
 */
import { readFile } from 'node:fs/promises'

const read = async (path) => JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'))
const { artworks } = await read('../src/data/artworks.json')
const { locations, placements } = await read('../src/data/artworkPlacements.json')

const COUNTRIES = ['IND', 'CHN']
const CERTAINTIES = ['stated', 'probable', 'possible', 'reported']
const QUALIFIERS = { probable: 'probably', possible: 'possibly', reported: 'reportedly' }
// Mirrors ALLOWED_PRECISION in src/lib/discovery.ts.
const ALLOWED_PRECISION = {
  'created-in': ['site', 'city'],
  'found-at': ['site', 'city'],
  'associated-with': ['site', 'city', 'region'],
}

const errors = []
const fail = (subject, message) => errors.push(`${subject}: ${message}`)
const isHttps = (url) => typeof url === 'string' && url.startsWith('https://')

// Public artwork dataset: only verified CC0 records with official URLs and images.
for (const artwork of artworks) {
  const subject = `artwork ${artwork.id}`
  if (artwork.image?.license !== 'CC0') fail(subject, 'image is not marked CC0')
  if (!artwork.image?.url?.startsWith('https://openaccess-cdn.clevelandart.org/')) {
    fail(subject, `unexpected image URL ${artwork.image?.url}`)
  }
  if (!artwork.source?.recordUrl?.startsWith('https://clevelandart.org/art/')) {
    fail(subject, `unexpected record URL ${artwork.source?.recordUrl}`)
  }
}

// Locations.
const locationsById = new Map()
for (const location of locations) {
  const subject = `location ${location.id ?? '(no id)'}`
  if (!/^[a-z]{3}-[a-z0-9-]+$/.test(location.id ?? '')) fail(subject, 'invalid id')
  if (locationsById.has(location.id)) fail(subject, 'duplicate id')
  locationsById.set(location.id, location)

  if (!location.name) fail(subject, 'missing name')
  if (!COUNTRIES.includes(location.country)) fail(subject, `unknown country ${location.country}`)
  if (!['site', 'city', 'region'].includes(location.precision)) fail(subject, `unknown precision ${location.precision}`)
  if (!Number.isFinite(location.lat) || Math.abs(location.lat) > 90) fail(subject, `invalid latitude ${location.lat}`)
  if (!Number.isFinite(location.lng) || Math.abs(location.lng) > 180) fail(subject, `invalid longitude ${location.lng}`)
  if (location.precision === 'region') {
    if (!(location.regionRadiusDeg > 0 && location.regionRadiusDeg <= 15)) fail(subject, 'region needs a radius between 0 and 15 degrees')
  } else if (location.regionRadiusDeg !== undefined) {
    fail(subject, 'only regions may have a radius')
  }
  if (!isHttps(location.coordinateSource)) fail(subject, 'missing https coordinate source')
  if (!location.coordinateNote) fail(subject, 'missing coordinate note')
}

// Placements.
const artworksById = new Map(artworks.map((a) => [a.id, a]))
const placedArtworks = new Set()
const usedLocations = new Set()

for (const placement of placements) {
  const subject = `placement ${placement.artworkId}`
  const artwork = artworksById.get(placement.artworkId)
  const location = locationsById.get(placement.locationId)

  if (!artwork) {
    fail(subject, 'refers to an artwork that is not in artworks.json')
    continue
  }
  if (placedArtworks.has(placement.artworkId)) fail(subject, 'artwork is placed more than once')
  placedArtworks.add(placement.artworkId)
  if (placement.accessionNumber !== artwork.source.accessionNumber) {
    fail(subject, `accession ${placement.accessionNumber} does not match ${artwork.source.accessionNumber}`)
  }

  if (!location) {
    fail(subject, `refers to unknown location ${placement.locationId}`)
  } else {
    usedLocations.add(location.id)
    if (location.country !== artwork.origin.country) {
      fail(subject, `location country ${location.country} differs from artwork country ${artwork.origin.country}`)
    }
    const allowed = ALLOWED_PRECISION[placement.relationship]
    if (!allowed) fail(subject, `unknown relationship ${placement.relationship}`)
    else if (!allowed.includes(location.precision)) {
      fail(subject, `"${placement.relationship}" cannot use a ${location.precision} location`)
    }
  }

  // Evidence must be sourced, and quoted text must really appear in the museum record.
  const { evidence } = placement
  if (!evidence?.text) fail(subject, 'missing evidence text')
  if (!isHttps(evidence?.sourceUrl)) fail(subject, 'missing https evidence source')
  if (evidence?.field === 'culture' && !artwork.culture.includes(evidence.text)) {
    fail(subject, 'evidence text not found in the record’s culture field')
  }
  if (evidence?.field === 'description' && !artwork.description.some((p) => p.includes(evidence.text))) {
    fail(subject, 'evidence text not found in the record’s description')
  }

  // Certainty must mirror the source's own wording.
  if (!CERTAINTIES.includes(placement.certainty)) fail(subject, `unknown certainty ${placement.certainty}`)
  const text = (evidence?.text ?? '').toLowerCase()
  const qualifier = QUALIFIERS[placement.certainty]
  if (qualifier && !text.includes(qualifier)) fail(subject, `certainty "${placement.certainty}" but evidence lacks "${qualifier}"`)
  if (placement.certainty === 'stated') {
    const found = Object.values(QUALIFIERS).filter((q) => text.includes(q))
    if (found.length) fail(subject, `evidence is qualified ("${found.join('", "')}") but certainty is "stated"`)
  }

  if (!placement.note) fail(subject, 'missing note')
}

for (const id of locationsById.keys()) {
  if (!usedLocations.has(id)) fail(`location ${id}`, 'is not used by any placement')
}

// Report.
for (const country of COUNTRIES) {
  const inCountry = artworks.filter((a) => a.origin.country === country)
  const placed = inCountry.filter((a) => placedArtworks.has(a.id))
  console.log(`${country}: ${placed.length}/${inCountry.length} artworks placed on the globe`)
  for (const artwork of inCountry.filter((a) => !placedArtworks.has(a.id))) {
    console.log(`  unplaced (gallery only): ${artwork.source.accessionNumber} ${artwork.title}`)
  }
}

if (errors.length) {
  console.error(`\n${errors.length} problem(s):`)
  for (const error of errors) console.error(`  ✗ ${error}`)
  process.exit(1)
}
console.log('✓ Artwork and placement data are valid.')
