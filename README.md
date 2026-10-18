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
  styles/       Global styles and Tailwind theme tokens
  types/        Shared TypeScript types
public/
  textures/     Locally served globe imagery
```

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
- **Country boundaries** (`src/data/ne_110m_admin_0_countries.json`): derived
  from [Natural Earth](https://www.naturalearthdata.com/) 1:110m Admin 0 –
  Countries, v5.1.2 (public domain), via
  [nvkelso/natural-earth-vector](https://github.com/nvkelso/natural-earth-vector/blob/v5.1.2/geojson/ne_110m_admin_0_countries.geojson).
  Properties were reduced to `ADM0_A3` (as `id`), `NAME`, `LABEL_Y` and
  `LABEL_X`, and coordinates rounded to 3 decimal places. Natural Earth depicts
  de facto boundaries; its depiction of disputed areas is not an endorsement by
  this project.
