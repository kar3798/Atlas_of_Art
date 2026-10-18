# Atlas of Art

An open-source educational web app for exploring artworks from around the world
through an interactive 3D globe. The initial focus is Indian and Chinese
sculpture and historical art, drawn from openly licensed museum collections.

> Status: interactive globe with country selection for India and China.
> Museum data and artwork details are not built yet.

## Getting started

Requires Node.js 20.19+ or 22.12+.

```bash
npm install
npm run dev      # start the dev server at http://localhost:5173
npm run build    # type-check and build for production into dist/
npm run preview  # serve the production build locally
npm run lint     # run ESLint
```

## Tech stack

- [Vite](https://vite.dev/) + [React](https://react.dev/) + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com/) via `@tailwindcss/vite`
- [react-globe.gl](https://github.com/vasturiano/react-globe.gl) (three.js) for the globe

## Project structure

```
src/
  components/   UI components (Header, Footer, GlobeView, CountryPicker, CountryPanel)
  data/         Country boundaries and the list of selectable countries
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
**Realistic** (default) and an experimental **Antique** parchment style. In
development (`npm run dev`) a small switch in the top-right corner toggles
between them; it is not included in production builds.

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
  ink coastlines and procedurally generated paper aging added, and resized to
  4096×2048 with `scripts/build-antique-texture.py`.
- **Country boundaries** (`src/data/ne_110m_admin_0_countries.json`): derived
  from [Natural Earth](https://www.naturalearthdata.com/) 1:110m Admin 0 –
  Countries, v5.1.2 (public domain), via
  [nvkelso/natural-earth-vector](https://github.com/nvkelso/natural-earth-vector/blob/v5.1.2/geojson/ne_110m_admin_0_countries.geojson).
  Properties were reduced to `ADM0_A3` (as `id`), `NAME`, `LABEL_Y` and
  `LABEL_X`, and coordinates rounded to 3 decimal places. Natural Earth depicts
  de facto boundaries; its depiction of disputed areas is not an endorsement by
  this project.
