# Atlas of Art

An open-source educational web app for exploring artworks from around the world
through an interactive 3D globe. The initial focus is Indian and Chinese
sculpture and historical art, drawn from openly licensed museum collections.

> Status: frontend foundation only. Museum data, region selection and artwork
> details are not built yet.

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
  components/   UI components (Header, Footer, GlobeView)
  lib/          Utilities and hooks
  styles/       Global styles and Tailwind theme tokens
public/
  textures/     Locally served globe imagery
```

`types/` and `data/` directories will be added when artwork data is introduced.

## Attribution

- **Earth texture** (`public/textures/earth-blue-marble.jpg`): NASA Blue Marble
  imagery, courtesy of NASA Earth Observatory / Visible Earth. NASA imagery is
  generally not subject to copyright in the United States
  ([NASA media usage guidelines](https://www.nasa.gov/nasa-brand-center/images-and-media/)).
  This copy is redistributed from the
  [three-globe](https://github.com/vasturiano/three-globe) examples (MIT License).
