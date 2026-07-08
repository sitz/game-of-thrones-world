import type { LayerSpecification } from 'maplibre-gl'
import { palette, kingdomTints, wildlingsTint } from '../palette'

/** Background water, land fills, coast treatment, terrain, lakes, rivers. */
export function baseLayers(): LayerSpecification[] {
  const layers: LayerSpecification[] = [
    {
      id: 'background',
      type: 'background',
      paint: { 'background-color': palette.water },
    },
  ]

  // Coastal ink wash: wide blurred dark line under the land fill — only the
  // outer (water-side) half remains visible once land is painted on top.
  for (const src of ['continents', 'islands'] as const) {
    layers.push({
      id: `coast-glow-${src}`,
      type: 'line',
      source: src,
      paint: {
        'line-color': palette.coastGlow,
        'line-width': ['interpolate', ['exponential', 1.6], ['zoom'], 3, 5, 7, 14, 10, 26],
        'line-blur': ['interpolate', ['linear'], ['zoom'], 3, 4, 10, 14],
        'line-opacity': 0.45,
      },
    })
  }

  layers.push(
    {
      id: 'land-continents',
      type: 'fill',
      source: 'continents',
      paint: { 'fill-color': palette.parchment },
    },
    {
      id: 'land-islands',
      type: 'fill',
      source: 'islands',
      paint: { 'fill-color': palette.parchment },
    },
  )

  // Terrain: a soft tint (reads at low zoom) + a tiling hand-drawn pattern.
  const terrain: [string, string, string, number][] = [
    ['swamp', palette.swamp, 'pattern-swamp', 0.4],
    ['stepp', palette.desert, 'pattern-desert', 0.5],
    ['forest', palette.forest, 'pattern-forest', 0.5],
    ['mountain', palette.mountain, 'pattern-mountain', 0.45],
  ]
  for (const [type, color, pattern, opacity] of terrain) {
    layers.push(
      {
        id: `landscape-${type}-tint`,
        type: 'fill',
        source: 'landscape',
        filter: ['==', ['get', 'type'], type],
        paint: {
          'fill-color': color,
          'fill-opacity': ['interpolate', ['linear'], ['zoom'], 3.5, 0.35, 6, opacity, 9, opacity * 0.7],
        },
      },
      {
        id: `landscape-${type}-pattern`,
        type: 'fill',
        source: 'landscape',
        minzoom: 4.6,
        filter: ['==', ['get', 'type'], type],
        paint: {
          'fill-pattern': pattern,
          'fill-opacity': ['interpolate', ['linear'], ['zoom'], 4.6, 0, 5.6, 0.85],
        },
      },
    )
  }

  layers.push(
    {
      id: 'lakes-fill',
      type: 'fill',
      source: 'lakes',
      paint: { 'fill-color': palette.water },
    },
    {
      id: 'lakes-outline',
      type: 'line',
      source: 'lakes',
      paint: {
        'line-color': palette.lakeOutline,
        'line-width': ['interpolate', ['linear'], ['zoom'], 4, 0.4, 10, 1.4],
        'line-opacity': 0.7,
      },
    },
    {
      id: 'rivers-line',
      type: 'line',
      source: 'rivers',
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': palette.river,
        'line-width': [
          'interpolate',
          ['exponential', 1.5],
          ['zoom'],
          4,
          ['*', 0.35, ['coalesce', ['get', 'size'], 1]],
          8,
          ['*', 1.1, ['coalesce', ['get', 'size'], 1]],
          10.5,
          ['*', 1.8, ['coalesce', ['get', 'size'], 1]],
        ],
        'line-opacity': 0.85,
      },
    },
  )

  return layers
}

export function politicalLayers(): LayerSpecification[] {
  const tintMatch: unknown[] = ['match', ['get', 'name']]
  for (const [name, color] of Object.entries(kingdomTints)) tintMatch.push(name, color)
  tintMatch.push(wildlingsTint) // fallback: the unnamed wildlands polygon

  return [
    {
      id: 'political-fill',
      type: 'fill',
      source: 'political',
      paint: {
        'fill-color': tintMatch as never,
        'fill-opacity': ['interpolate', ['linear'], ['zoom'], 4, 0.28, 6.5, 0.16, 9, 0.06],
      },
    },
    {
      id: 'political-boundary',
      type: 'line',
      source: 'political',
      paint: {
        'line-color': palette.kingdomLabel,
        'line-width': ['interpolate', ['linear'], ['zoom'], 4, 0.8, 8, 1.8],
        'line-dasharray': [4, 2.5, 1.2, 2.5],
        'line-opacity': 0.5,
      },
    },
  ]
}

export function lineLayers(): LayerSpecification[] {
  return [
    {
      id: 'roads-line',
      type: 'line',
      source: 'roads',
      minzoom: 4.8,
      layout: { 'line-join': 'round' },
      paint: {
        'line-color': palette.road,
        'line-width': ['interpolate', ['linear'], ['zoom'], 5, 0.6, 10, 2.2],
        'line-dasharray': [3, 2.2],
        'line-opacity': ['interpolate', ['linear'], ['zoom'], 4.8, 0, 5.5, 0.75],
      },
    },
    // Crisp coastline ink on top of terrain fills
    {
      id: 'coastline-continents',
      type: 'line',
      source: 'continents',
      paint: {
        'line-color': palette.coastline,
        'line-width': ['interpolate', ['linear'], ['zoom'], 3, 0.5, 8, 1.1, 10.5, 1.6],
        'line-opacity': 0.75,
      },
    },
    {
      id: 'coastline-islands',
      type: 'line',
      source: 'islands',
      paint: {
        'line-color': palette.coastline,
        'line-width': ['interpolate', ['linear'], ['zoom'], 3, 0.4, 8, 0.9, 10.5, 1.4],
        'line-opacity': 0.7,
      },
    },
    {
      id: 'wall-glow',
      type: 'line',
      source: 'wall',
      layout: { 'line-cap': 'round' },
      paint: {
        'line-color': palette.wallGlow,
        'line-width': ['interpolate', ['linear'], ['zoom'], 4, 5, 10, 18],
        'line-blur': 4,
        'line-opacity': 0.8,
      },
    },
    {
      id: 'wall-core',
      type: 'line',
      source: 'wall',
      layout: { 'line-cap': 'round' },
      paint: {
        'line-color': palette.wallCore,
        'line-width': ['interpolate', ['linear'], ['zoom'], 4, 1.6, 10, 6],
      },
    },
  ]
}
