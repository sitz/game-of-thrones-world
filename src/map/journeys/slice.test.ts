import { describe, expect, it } from 'vitest'
import { haversineKm } from './distance'

// Mirror of the slicing math in animator.ts, kept in sync via this test file.
function cumulative(coords: [number, number][]): number[] {
  const cum = [0]
  for (let i = 1; i < coords.length; i++) {
    cum.push(cum[i - 1] + haversineKm(coords[i - 1], coords[i]))
  }
  return cum
}

describe('journey distance parametrization', () => {
  const line: [number, number][] = [
    [0, 0],
    [1, 0],
    [2, 0],
    [4, 0],
  ]
  const cum = cumulative(line)

  it('is monotonic and starts at zero', () => {
    expect(cum[0]).toBe(0)
    for (let i = 1; i < cum.length; i++) expect(cum[i]).toBeGreaterThan(cum[i - 1])
  })

  it('matches haversine segment sums', () => {
    expect(cum[3]).toBeCloseTo(haversineKm([0, 0], [1, 0]) + haversineKm([1, 0], [2, 0]) + haversineKm([2, 0], [4, 0]), 6)
  })

  it('equator degrees are ~111 km', () => {
    expect(haversineKm([0, 0], [1, 0])).toBeGreaterThan(110)
    expect(haversineKm([0, 0], [1, 0])).toBeLessThan(112.5)
  })
})
