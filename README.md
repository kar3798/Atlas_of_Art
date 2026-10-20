# Atlas of Art

An open-source educational web app for exploring artworks from around the world
through an interactive 3D globe. The initial focus is Indian and Chinese
sculpture and historical art, drawn from openly licensed museum collections.

> Status: interactive globe with country selection for India and China, and a
> small curated set of Cleveland Museum of Art artworks for each, placed on the
> globe wherever the museum records support a location.

## Getting started

Requires Node.js 20.19+ or 22.12+.

```bash
npm install
npm run dev      # start the dev server at http://localhost:5173
npm run build    # type-check and build for production into dist/
npm run preview  # serve the production build locally
npm run lint     # run ESLint
npm run data:artworks  # refresh the curated artwork dataset from the CMA API
npm run validate:data  # check artwork and placement data (also runs before build)
```

## Tech stack

- [Vite](https://vite.dev/) + [React](https://react.dev/) + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com/) via `@tailwindcss/vite`
- [react-globe.gl](https://github.com/vasturiano/react-globe.gl) (three.js) for the globe

## Project structure

```
src/
  components/   UI components (globe, country picker and panel, artwork cards and details)
  data/         Country boundaries, selectable countries and the curated artwork dataset
  lib/          Utilities and hooks
  styles/       Global styles, Tailwind theme tokens and globe themes
  types/        Shared TypeScript types
public/
  textures/     Locally served globe imagery
scripts/        Asset build scripts (not part of the app bundle)
```

### Globe styles

Globe appearance (texture, atmosphere, lighting and country colors) is defined
in `src/styles/globeThemes.ts`; interaction logic is shared. Two styles exist:
**Antique** parchment (default) and **Realistic**. In development
(`npm run dev`) a small switch in the top bar toggles between them; it is not
included in production builds.

The antique texture is generated from Natural Earth II imagery:

```bash
curl -LO https://naciscdn.org/naturalearth/50m/raster/NE2_50M_SR_W.zip
unzip NE2_50M_SR_W.zip
python3 scripts/build-antique-texture.py NE2_50M_SR_W/NE2_50M_SR_W.tif public/textures/earth-antique.jpg
```

This requires Python 3 with Pillow. The 175 MB source image is not committed.

To make another country selectable, add its Natural Earth `ADM0_A3` code to
`SelectableCountryId` in `src/types/country.ts` and an entry to
`src/data/selectableCountries.ts`.

Modern country borders are shown only as a navigational aid. Historical
cultures and artistic traditions often do not correspond to present-day
political boundaries, and some borders shown are disputed.

### Artwork data

Artworks come from the [Cleveland Museum of Art Open Access API](https://openaccess-api.clevelandart.org/)
and are stored locally in `src/data/artworks.json`; the app makes no API calls
at runtime (images load from the museum's CDN).

The selection is curated by hand in `scripts/artwork-selection.json`: each
entry gives an accession number, the modern country it is shown under, and how
its origin is read from the museum record (place, historical region,
relationship and certainty). `npm run data:artworks` fetches each record and
writes the dataset only if every record:

- has `share_license_status` of `CC0`, a web image, and an official
  `clevelandart.org/art/…` record URL (both checked to be reachable);
- supports the curated origin: the record's `culture` text must name the
  country, every part of the place and any historical region, and must contain
  the matching qualifier ("probably", "possibly", "reportedly") when the
  certainty is not `stated`.

Origins are never inferred from an artist's nationality or a work's subject.
Records whose origin is not documented, or whose recorded region spans
present-day borders (e.g. Kashmir, Bengal), are left out rather than guessed.

### Artwork locations on the globe

Where each artwork appears on the globe is researched by hand and stored in
`src/data/artworkPlacements.json`, separately from the museum data, so
`npm run data:artworks` never overwrites it. Each placement cites the museum
field it relies on (quoted verbatim) and explains any uncertainty; each
location cites where its coordinates come from.

Locations have a precision:

- **Specific site** (`site`), e.g. a cave temple complex — shown as a pin.
- **City or town** (`city`) — shown as a pin; the exact spot within it is not known.
- **Regional association** (`region`) — shown as a dashed ring and outline. Its
  coordinates are only a visual anchor, never an exact location.

And the artwork relates to it as **created in**, **found at** (both need a
site or city) or **associated with** (a documented attribution with no stated
place of creation or discovery; the only option for regions). Certainty
mirrors the source's own wording ("probably", "reportedly").

Rules followed: the museum's `culture` field is treated as an attribution, not
proof of an exact location; nothing is inferred from artist nationality,
subject or the museum's own location; places that cannot be located from a
reliable source are not guessed. Artworks without a supportable placement stay
in the gallery as "Exact origin unknown".

`npm run validate:data` checks, among other things, that every placement refers
to an existing artwork, quotes text that really appears in its museum record,
matches its certainty to that text, and uses a relationship allowed for its
location's precision.

## Attribution

- **Earth texture** (`public/textures/earth-blue-marble.jpg`): NASA Blue Marble
  imagery, courtesy of NASA Earth Observatory / Visible Earth. NASA imagery is
  generally not subject to copyright in the United States
  ([NASA media usage guidelines](https://www.nasa.gov/nasa-brand-center/images-and-media/)).
  This copy is redistributed from the
  [three-globe](https://github.com/vasturiano/three-globe) examples (MIT License).
- **Antique Earth texture** (`public/textures/earth-antique.jpg`): derived from
  [Natural Earth II with Shaded Relief and Water](https://www.naturalearthdata.com/downloads/50m-raster-data/50m-natural-earth-2/),
  1:50m (public domain), by Tom Patterson. Recolored to a sepia palette, with
  ink coastlines, water-lining, and procedurally generated paper aging and grain
  added, and resized to 4096×2048 with `scripts/build-antique-texture.py`.
- **Country boundaries** (`src/data/ne_110m_admin_0_countries.json`): derived
  from [Natural Earth](https://www.naturalearthdata.com/) 1:110m Admin 0 –
  Countries, v5.1.2 (public domain), via
  [nvkelso/natural-earth-vector](https://github.com/nvkelso/natural-earth-vector/blob/v5.1.2/geojson/ne_110m_admin_0_countries.geojson).
  Properties were reduced to `ADM0_A3` (as `id`), `NAME`, `LABEL_Y` and
  `LABEL_X`, and coordinates rounded to 3 decimal places. Natural Earth depicts
  de facto boundaries; its depiction of disputed areas is not an endorsement by
  this project.
- **Artwork data and images**: [The Cleveland Museum of Art](https://www.clevelandart.org/)
  Open Access. Each included record and image is designated
  [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) by the museum;
  this is checked per record, since not all museum images share the same rights.
