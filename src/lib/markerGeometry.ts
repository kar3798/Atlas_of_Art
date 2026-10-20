import type { LocationPrecision } from '../types/discovery'

// Push-pin geometry (px). The needle's tip sits on the location; the ball is above it.
export const PIN_WIDTH = 12
export const PIN_HEIGHT = 22
export const PIN_BALL_SIZE = 10
// Centre of the ball relative to the location, used to centre the hit area and preview.
export const PIN_HEAD_Y = -PIN_HEIGHT + PIN_BALL_SIZE / 2

/** Vertical offset (px) of a marker's visual centre from the point it marks. */
export const markerCenterY = (precision: LocationPrecision) => (precision === 'region' ? 0 : PIN_HEAD_Y)
