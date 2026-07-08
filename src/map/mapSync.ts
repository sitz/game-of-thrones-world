import type { Map as MLMap } from 'maplibre-gl'
import { useAppStore, type LayerToggles } from '../store/useAppStore'
import { EVENT_LAYER_IDS } from './style/layers/story'

const LAYER_GROUPS: Record<keyof LayerToggles, string[]> = {
  political: ['political-fill', 'political-boundary'],
  terrain: [
    'landscape-swamp-tint',
    'landscape-swamp-pattern',
    'landscape-stepp-tint',
    'landscape-stepp-pattern',
    'landscape-forest-tint',
    'landscape-forest-pattern',
    'landscape-mountain-tint',
    'landscape-mountain-pattern',
    'label-landscape',
  ],
  roads: ['roads-line', 'label-road'],
  events: ['events-pulse', ...EVENT_LAYER_IDS],
  labels: [
    'label-sea',
    'label-water-minor',
    'label-water-line',
    'label-river',
    'label-wall',
    'label-region',
    'label-kingdom',
    'label-continent',
  ],
}

function applyLayerToggles(map: MLMap, layers: LayerToggles) {
  for (const [key, ids] of Object.entries(LAYER_GROUPS) as [keyof LayerToggles, string[]][]) {
    const visibility = layers[key] ? 'visible' : 'none'
    for (const id of ids) {
      if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', visibility)
    }
  }
}

/** Keeps style layer visibility in sync with the store toggles. */
export function wireLayerToggles(map: MLMap) {
  applyLayerToggles(map, useAppStore.getState().layers)
  useAppStore.subscribe((state, prev) => {
    if (state.layers !== prev.layers) applyLayerToggles(map, state.layers)
  })
}
