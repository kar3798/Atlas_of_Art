/**
 * Refreshes src/data/artworks.json from the Cleveland Museum of Art Open Access API.
 *
 *   npm run data:artworks
 *
 * The artworks and their origin interpretation are curated by hand in
 * scripts/artwork-selection.json. This script fetches each record by accession
 * number and refuses to write anything unless every record:
 *   - has share_license_status "CC0",
 *   - has a web image and an official clevelandart.org record URL (both reachable),
 *   - supports the curated origin: the museum's `culture` text must contain the
 *     country name, every part of `place`, the `historicalRegion`, and the
 *     qualifier matching `certainty` (e.g. "probably" for "probable").
 *
 * API documentation: https://openaccess-api.clevelandart.org/
 */
import { readFile, writeFile } from 'node:fs/promises'

const API = 'https://openaccess-api.clevelandart.org/api/artworks'
const SELECTION = new URL('./artwork-selection.json', import.meta.url)
const OUTPUT = new URL('../src/data/artworks.json', import.meta.url)
const HEADERS = { 'User-Agent': 'AtlasOfArt/0.1 (open-source educational project)' }

const COUNTRY_NAMES = { IND: 'India', CHN: 'China' }
const QUALIFIERS = { probable: 'probably', possible: 'possibly', reported: 'reportedly' }

async function fetchRecord(accessionNumber) {
  const response = await fetch(`${API}/${encodeURIComponent(accessionNumber)}`, { headers: HEADERS })
  if (!response.ok) throw new Error(`API returned ${response.status}`)
  return (await response.json()).data
}

async function assertReachable(url) {
  const response = await fetch(url, { method: 'HEAD', headers: HEADERS, redirect: 'follow' })
  if (!response.ok) throw new Error(`${url} returned ${response.status}`)
}

/** Museum descriptions contain light HTML (<em>, <br>); keep plain-text paragraphs only. */
function toParagraphs(html) {
  if (!html) return []
  const entities = { '&amp;': '&', '&quot;': '"', '&#39;': "'", '&apos;': "'", '&nbsp;': ' ', '&lt;': '<', '&gt;': '>' }
  return html
    .split(/(?:<br\s*\/?>\s*){2,}|<\/p>\s*<p>/i)
    .map((part) =>
      part
        .replace(/<[^>]+>/g, '')
        .replace(/&[a-z#0-9]+;/gi, (e) => entities[e] ?? e)
        .replace(/\s+/g, ' ')
        .trim(),
    )
    .filter(Boolean)
}

function validate(record, curated) {
  const errors = []
  const culture = (record.culture ?? []).join('; ')
  const lower = culture.toLowerCase()

  if (record.share_license_status !== 'CC0') errors.push(`license is ${record.share_license_status}`)
  if (!record.images?.web?.url) errors.push('no web image')
  if (!record.url?.startsWith('https://clevelandart.org/art/')) errors.push(`unexpected record URL ${record.url}`)
  if (!culture) errors.push('no culture field to support an origin')

  const country = COUNTRY_NAMES[curated.country]
  if (!country) errors.push(`unknown country ${curated.country}`)
  else if (!culture.includes(country)) errors.push(`culture does not mention ${country}`)

  for (const part of (curated.place ?? '').split(',').map((p) => p.trim()).filter(Boolean)) {
    if (!culture.includes(part)) errors.push(`culture does not mention place "${part}"`)
  }
  if (curated.historicalRegion && !culture.includes(curated.historicalRegion)) {
    errors.push(`culture does not mention historical region "${curated.historicalRegion}"`)
  }

  const expected = QUALIFIERS[curated.certainty]
  const found = Object.values(QUALIFIERS).filter((q) => lower.includes(q))
  if (curated.certainty === 'stated' && found.length) errors.push(`culture is qualified ("${found.join('", "')}") but certainty is "stated"`)
  if (curated.certainty !== 'stated' && !lower.includes(expected)) errors.push(`culture lacks "${expected}" for certainty "${curated.certainty}"`)

  return errors
}

function toArtwork(record, curated) {
  const web = record.images.web
  return {
    id: `cma-${record.id}`,
    title: record.title,
    creator: record.creators?.length ? record.creators.map((c) => c.description).join('; ') : null,
    date: {
      display: record.creation_date,
      earliest: record.creation_date_earliest ?? null,
      latest: record.creation_date_latest ?? null,
    },
    type: record.type,
    medium: record.technique,
    culture: record.culture.join('; '),
    origin: {
      country: curated.country,
      place: curated.place,
      historicalRegion: curated.historicalRegion,
      relationship: curated.relationship,
      certainty: curated.certainty,
      evidence: { field: 'culture', text: record.culture.join('; ') },
    },
    image: { url: web.url, width: Number(web.width), height: Number(web.height), license: 'CC0' },
    description: toParagraphs(record.description),
    source: {
      museum: 'The Cleveland Museum of Art',
      accessionNumber: record.accession_number,
      recordUrl: record.url,
      apiUrl: `${API}/${record.accession_number}`,
      creditLine: record.creditline,
    },
  }
}

const { artworks: selection } = JSON.parse(await readFile(SELECTION, 'utf8'))
const artworks = []
let failed = false

for (const curated of selection) {
  try {
    const record = await fetchRecord(curated.accessionNumber)
    const errors = validate(record, curated)
    if (!errors.length) {
      await assertReachable(record.url)
      await assertReachable(record.images.web.url)
    }
    if (errors.length) throw new Error(errors.join('; '))
    artworks.push(toArtwork(record, curated))
    console.log(`✓ ${curated.accessionNumber}  ${record.title}`)
  } catch (error) {
    failed = true
    console.error(`✗ ${curated.accessionNumber}  ${error.message}`)
  }
}

if (failed) {
  console.error('\nNot writing artworks.json: fix or remove the records above.')
  process.exit(1)
}

const retrievedAt = new Date().toISOString().slice(0, 10)
await writeFile(OUTPUT, JSON.stringify({ source: API, retrievedAt, artworks }, null, 2) + '\n')
console.log(`\nWrote ${artworks.length} artworks to src/data/artworks.json`)
