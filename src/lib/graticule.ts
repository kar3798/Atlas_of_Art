/** A latitude or longitude line as [lat, lng] points. */
export interface GraticuleLine {
  points: [number, number][]
  isEquator: boolean
}

// Spacing between points along each line; small enough to follow the curvature smoothly.
const POINT_STEP = 2

function range(start: number, end: number, step: number) {
  const values = []
  for (let v = start; v <= end; v += step) values.push(v)
  return values
}

/** Meridians and parallels every `step` degrees (parallels exclude the poles). */
export function createGraticule(step: number): GraticuleLine[] {
  const meridians = range(-180, 180 - step, step).map((lng) => ({
    points: range(-90, 90, POINT_STEP).map((lat): [number, number] => [lat, lng]),
    isEquator: false,
  }))
  const parallels = range(-90 + step, 90 - step, step).map((lat) => ({
    points: range(-180, 180, POINT_STEP).map((lng): [number, number] => [lat, lng]),
    isEquator: lat === 0,
  }))
  return [...meridians, ...parallels]
}
