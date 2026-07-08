import type { Map as MLMap, MapMouseEvent } from 'maplibre-gl'
import type { GeoJSONSource } from 'maplibre-gl'
import { useAppStore } from '../store/useAppStore'
import { EVENT_LAYER_IDS } from './style/layers/story'

export const LOCATION_LAYER_IDS = [
  'loc-city-major',
  'loc-city',
  'loc-castle-major',
  'loc-castle',
  'loc-castle-minor',
  'loc-town',
  'loc-ruin',
  'loc-other',
] as const

const CLICKABLE = [...EVENT_LAYER_IDS, ...LOCATION_LAYER_IDS]

/** Click/hover wiring + selection halo sync. */
export function wireInteractions(map: MLMap) {
  for (const layer of CLICKABLE) {
    map.on('mouseenter', layer, () => {
      map.getCanvas().style.cursor = 'pointer'
    })
    map.on('mouseleave', layer, () => {
      map.getCanvas().style.cursor = ''
    })
  }

  map.on('click', (e: MapMouseEvent) => {
    const features = map.queryRenderedFeatures(e.point, { layers: [...CLICKABLE] })
    const { select } = useAppStore.getState()
    if (!features.length) {
      select(null)
      return
    }
    // Prefer events over locations when stacked (they're smaller targets)
    const ev = features.find((f) => (f.layer.id as string).startsWith('events-'))
    const top = ev ?? features[0]
    if ((top.layer.id as string).startsWith('events-')) {
      select({ kind: 'event', id: top.properties.id as string })
    } else {
      select({ kind: 'location', id: top.properties.slug as string })
    }
  })

  // Selection halo follows the store
  useAppStore.subscribe((state, prev) => {
    if (state.selected === prev.selected) return
    const src = map.getSource('selected') as GeoJSONSource | undefined
    if (!src) return
    const coords = selectionCoords(state.selected)
    src.setData(
      coords
        ? { type: 'FeatureCollection', features: [{ type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: coords } }] }
        : { type: 'FeatureCollection', features: [] },
    )
  })
}

export function selectionCoords(sel: { kind: string; id: string } | null): [number, number] | null {
  if (!sel) return null
  const data = useAppStore.getState().data
  if (!data) return null
  if (sel.kind === 'event') {
    return data.events.find((e) => e.id === sel.id)?.coords ?? null
  }
  const f = data.locations.features.find((f) => f.properties.slug === sel.id)
  return (f?.geometry.coordinates as [number, number]) ?? null
}

/** Fly the camera to a selection (used by search + deep links). */
export function flyToSelection(map: MLMap, sel: { kind: string; id: string }, zoom?: number) {
  const coords = selectionCoords(sel)
  if (!coords) return
  const data = useAppStore.getState().data
  let targetZoom = zoom ?? 6.8
  if (!zoom && sel.kind === 'location' && data) {
    const f = data.locations.features.find((f) => f.properties.slug === sel.id)
    const rank = f?.properties.rank ?? 2
    targetZoom = rank >= 5 ? 6.2 : rank >= 3 ? 6.8 : 7.4
  }
  map.flyTo({ center: coords, zoom: Math.max(map.getZoom(), targetZoom), speed: 1.6, essential: true })
}
