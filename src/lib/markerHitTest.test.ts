import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { markersAt } from './markerHitTest.ts'

const HIT_RADIUS = 22

describe('markersAt', () => {
  it('finds both markers where they overlap (e.g. Ye and Xiangtangshan)', () => {
    const markers = [
      { id: 'chn-ye', x: 400, y: 300 },
      { id: 'chn-xiangtangshan', x: 397, y: 297 },
      { id: 'chn-changsha', x: 380, y: 520 },
    ]
    assert.deepEqual(markersAt({ x: 396, y: 296 }, markers, HIT_RADIUS), ['chn-xiangtangshan', 'chn-ye'])
  })

  it('finds a single marker when only its hit area contains the point', () => {
    const markers = [
      { id: 'a', x: 0, y: 0 },
      { id: 'b', x: 30, y: 0 },
    ]
    assert.deepEqual(markersAt({ x: -10, y: 0 }, markers, HIT_RADIUS), ['a'])
    assert.deepEqual(markersAt({ x: 15, y: 0 }, markers, HIT_RADIUS), ['a', 'b'])
  })

  it('finds nothing away from every marker', () => {
    assert.deepEqual(markersAt({ x: 100, y: 100 }, [{ id: 'a', x: 0, y: 0 }], HIT_RADIUS), [])
  })

  it('orders equally distant markers by ID', () => {
    const markers = [
      { id: 'b', x: 10, y: 0 },
      { id: 'a', x: -10, y: 0 },
    ]
    assert.deepEqual(markersAt({ x: 0, y: 0 }, markers, HIT_RADIUS), ['a', 'b'])
  })
})
