export interface Point {
  x: number
  y: number
}

/** A marker's hit-area centre on screen, identified by its location ID. */
export interface ScreenMarker extends Point {
  id: string
}

/**
 * IDs of the markers whose circular hit areas contain `point`, nearest first.
 * Used to tell when a click or hover lands where several markers overlap.
 */
export function markersAt(point: Point, markers: ScreenMarker[], radius: number): string[] {
  return markers
    .map((marker) => ({ id: marker.id, distance: Math.hypot(marker.x - point.x, marker.y - point.y) }))
    .filter(({ distance }) => distance <= radius)
    .sort((a, b) => a.distance - b.distance || (a.id < b.id ? -1 : 1))
    .map(({ id }) => id)
}
