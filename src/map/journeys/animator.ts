/**
 * Journey renderer: slices each active character's route to the timeline
 * position, positions the moving head marker, and animates the route dash.
 * Geometry slicing (not line-gradient) so each journey clips independently.
 */
import type { Map as MLMap, GeoJSONSource } from 'maplibre-gl'
import type { Journey } from '../../data/types'
import { useAppStore } from '../../store/useAppStore'
import { haversineKm } from './distance'

interface Prepared {
  journey: Journey
  coordCum: number[] // cumulative km at every coordinate
}

const prepared = new Map<string, Prepared>()

function prepare(journey: Journey): Prepared {
  let cached = prepared.get(journey.characterId)
  if (cached) return cached
  const coordCum: number[] = [0]
  for (let i = 1; i < journey.coords.length; i++) {
    coordCum.push(coordCum[i - 1] + haversineKm(journey.coords[i - 1], journey.coords[i]))
  }
  cached = { journey, coordCum }
  prepared.set(journey.characterId, cached)
  return cached
}

/** Head position + partial line for a journey at fractional epIndex t. */
function slice(p: Prepared, t: number): { line: [number, number][]; head: [number, number] } | null {
  const { journey, coordCum } = p
  const wps = journey.waypoints
  if (!wps.length || t < wps[0].epIndex) return null

  // Distance target: lerp cumKm between the surrounding waypoints
  let targetKm: number
  if (t >= wps[wps.length - 1].epIndex) {
    targetKm = coordCum[coordCum.length - 1]
  } else {
    let i = 0
    while (i < wps.length - 1 && wps[i + 1].epIndex <= t) i++
    const a = wps[i]
    const b = wps[i + 1]
    const span = b.epIndex - a.epIndex
    const frac = span > 0 ? (t - a.epIndex) / span : 1
    targetKm = a.cumKm + (b.cumKm - a.cumKm) * frac
  }

  // Walk coords up to targetKm, lerping the head within its segment
  const line: [number, number][] = [journey.coords[0]]
  for (let i = 1; i < journey.coords.length; i++) {
    if (coordCum[i] <= targetKm) {
      line.push(journey.coords[i])
      continue
    }
    const segLen = coordCum[i] - coordCum[i - 1]
    const f = segLen > 0 ? (targetKm - coordCum[i - 1]) / segLen : 0
    const a = journey.coords[i - 1]
    const b = journey.coords[i]
    line.push([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f])
    break
  }
  return { line, head: line[line.length - 1] }
}

function updateSources(map: MLMap) {
  const { data, activeJourneys, timelineEnabled, t } = useAppStore.getState()
  const lineSrc = map.getSource('journeys') as GeoJSONSource | undefined
  const headSrc = map.getSource('journey-heads') as GeoJSONSource | undefined
  if (!data || !lineSrc || !headSrc) return

  const lines: GeoJSON.Feature[] = []
  const heads: GeoJSON.Feature[] = []

  for (const id of activeJourneys) {
    const journey = data.journeys.find((j) => j.characterId === id)
    if (!journey) continue
    const p = prepare(journey)
    const dead = journey.dies !== null && timelineEnabled && t >= journey.dies

    if (!timelineEnabled) {
      // Static full route
      lines.push({
        type: 'Feature',
        properties: { color: journey.color, fade: 1 },
        geometry: { type: 'LineString', coordinates: journey.coords },
      })
      continue
    }

    const sliced = slice(p, t)
    if (!sliced) continue
    lines.push({
      type: 'Feature',
      properties: { color: journey.color, fade: dead ? 0.45 : 1 },
      geometry: { type: 'LineString', coordinates: sliced.line },
    })
    heads.push({
      type: 'Feature',
      properties: {
        icon: dead ? `journey-end-${journey.characterId}` : `journey-head-${journey.characterId}`,
        label: journey.name,
        color: journey.color,
      },
      geometry: { type: 'Point', coordinates: sliced.head },
    })
  }

  lineSrc.setData({ type: 'FeatureCollection', features: lines })
  headSrc.setData({ type: 'FeatureCollection', features: heads })
}

// Marching-ants dash phases (adapted from the MapLibre animated-dash example)
const DASH_PHASES: number[][] = [
  [0, 2.4, 2.4],
  [0.6, 2.4, 1.8],
  [1.2, 2.4, 1.2],
  [1.8, 2.4, 0.6],
  [2.4, 2.4, 0],
  [0, 0.6, 2.4, 1.8],
  [0, 1.2, 2.4, 1.2],
  [0, 1.8, 2.4, 0.6],
]

export function wireJourneys(map: MLMap) {
  updateSources(map)

  useAppStore.subscribe((state, prev) => {
    if (
      state.activeJourneys === prev.activeJourneys &&
      state.timelineEnabled === prev.timelineEnabled &&
      state.t === prev.t &&
      state.data === prev.data
    ) {
      return
    }
    updateSources(map)
  })

  // Dash animation, throttled to ~12 steps/sec, only while journeys visible
  let frame = 0
  let step = 0
  let lastStep = 0
  const animate = (now: number) => {
    frame = requestAnimationFrame(animate)
    if (!useAppStore.getState().activeJourneys.length || !map.getLayer('journeys-dash')) return
    if (now - lastStep < 85) return
    lastStep = now
    step = (step + 1) % DASH_PHASES.length
    map.setPaintProperty('journeys-dash', 'line-dasharray', DASH_PHASES[step])
  }
  frame = requestAnimationFrame(animate)
  map.once('remove', () => cancelAnimationFrame(frame))
}
