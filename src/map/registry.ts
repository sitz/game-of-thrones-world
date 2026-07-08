/**
 * Module-level handle to the MapLibre map so non-React code
 * (timeline filters, journey animator, URL sync) can drive it directly.
 */
import type { Map as MLMap } from 'maplibre-gl'

let _map: MLMap | null = null
const waiters: ((map: MLMap) => void)[] = []

export function setMap(map: MLMap | null) {
  _map = map
  if (map) {
    for (const w of waiters.splice(0)) w(map)
  }
}

export function getMap(): MLMap | null {
  return _map
}

export function whenMapReady(cb: (map: MLMap) => void) {
  if (_map) cb(_map)
  else waiters.push(cb)
}
