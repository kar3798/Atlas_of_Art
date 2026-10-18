const toRad = (deg: number) => (deg * Math.PI) / 180
const toDeg = (rad: number) => (rad * 180) / Math.PI

/**
 * Points of a circle on the sphere: every point lies `radiusDeg` degrees of arc
 * from the centre. Returned as closed [lat, lng] pairs.
 */
export function sphericalCircle(
  lat: number,
  lng: number,
  radiusDeg: number,
  steps = 72,
): [number, number][] {
  const φ1 = toRad(lat)
  const λ1 = toRad(lng)
  const δ = toRad(radiusDeg)
  const points: [number, number][] = []

  for (let i = 0; i <= steps; i++) {
    const θ = (2 * Math.PI * i) / steps
    const φ2 = Math.asin(Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ))
    const λ2 =
      λ1 + Math.atan2(Math.sin(θ) * Math.sin(δ) * Math.cos(φ1), Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2))
    points.push([toDeg(φ2), toDeg(λ2)])
  }
  return points
}
