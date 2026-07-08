/** Shared helpers for the data pipeline. */

export function normalizeName(name) {
  return String(name)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/['‘’]/g, '')
    .replace(/^the\s+/, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

export function slugify(name) {
  return normalizeName(name).replace(/\s+/g, '-')
}

const round5 = (n) => Math.round(n * 1e5) / 1e5

export function roundCoords(coords) {
  if (typeof coords[0] === 'number') return coords.map(round5)
  return coords.map(roundCoords)
}

/** Planar shoelace area of a ring (abs, in deg² — only for relative ranking). */
export function ringArea(ring) {
  let area = 0
  for (let i = 0; i < ring.length - 1; i++) {
    area += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1]
  }
  return Math.abs(area / 2)
}

/** Largest outer ring of a Polygon/MultiPolygon, with its area. */
export function largestRing(geometry) {
  const polys = geometry.type === 'MultiPolygon' ? geometry.coordinates : [geometry.coordinates]
  let best = null
  let bestArea = -1
  let total = 0
  for (const rings of polys) {
    const a = ringArea(rings[0])
    total += a
    if (a > bestArea) {
      bestArea = a
      best = rings
    }
  }
  return { rings: best, area: total }
}

export function haversineKm(a, b) {
  const R = 6371
  const dLat = ((b[1] - a[1]) * Math.PI) / 180
  const dLon = ((b[0] - a[0]) * Math.PI) / 180
  const la1 = (a[1] * Math.PI) / 180
  const la2 = (b[1] * Math.PI) / 180
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}
