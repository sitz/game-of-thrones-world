import type { LayerSpecification, ExpressionSpecification } from 'maplibre-gl'
import { palette, eventColors, FONT } from '../palette'

const eventColorMatch = (() => {
  const m: unknown[] = ['match', ['get', 'type']]
  for (const [type, color] of Object.entries(eventColors)) m.push(type, color)
  m.push(palette.inkSoft)
  return m as ExpressionSpecification
})()

/**
 * Event pins. Three sibling layers keyed by importance so each tier gets its
 * own minzoom; timeline code ANDs its episode predicate into all three filters.
 */
export const EVENT_LAYER_IDS = ['events-1', 'events-2', 'events-3'] as const

export function eventLayers(): LayerSpecification[] {
  const tiers: { id: (typeof EVENT_LAYER_IDS)[number]; importance: number; minzoom: number }[] = [
    { id: 'events-1', importance: 1, minzoom: 3.4 },
    { id: 'events-2', importance: 2, minzoom: 5 },
    { id: 'events-3', importance: 3, minzoom: 6.4 },
  ]
  const layers: LayerSpecification[] = [
    {
      id: 'events-pulse',
      type: 'circle',
      source: 'events',
      filter: ['==', ['get', 'epIndex'], -1], // driven by the timeline
      paint: {
        'circle-radius': 16,
        'circle-color': 'rgba(0,0,0,0)',
        'circle-stroke-color': eventColorMatch,
        'circle-stroke-width': 2,
        'circle-stroke-opacity': 0.8,
        'circle-pitch-alignment': 'map',
      },
    },
  ]
  for (const { id, importance, minzoom } of tiers) {
    layers.push({
      id,
      type: 'symbol',
      source: 'events',
      minzoom,
      filter: ['==', ['get', 'importance'], importance],
      layout: {
        'icon-image': ['concat', 'ev-', ['get', 'type']],
        'icon-size': importance === 1 ? 1 : 0.88,
        // Pins always render; their titles yield to location labels.
        'icon-allow-overlap': true,
        'icon-ignore-placement': true,
        'symbol-sort-key': ['get', 'importance'],
        'text-field': ['step', ['zoom'], '', 6.2, ['get', 'title']],
        'text-font': [FONT.fell],
        'text-size': 10.5,
        'text-optional': true,
        'text-variable-anchor': ['top', 'bottom'],
        'text-radial-offset': 0.9,
      },
      paint: {
        'text-color': eventColorMatch,
        'text-halo-color': palette.halo,
        'text-halo-width': 1.3,
      },
    })
  }
  return layers
}

/** Character journey routes + moving head markers (sources start empty). */
export function journeyLayers(): LayerSpecification[] {
  return [
    {
      id: 'journeys-casing',
      type: 'line',
      source: 'journeys',
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': '#2b2119',
        'line-width': ['interpolate', ['linear'], ['zoom'], 4, 4.2, 9, 6.5],
        'line-opacity': ['*', 0.45, ['coalesce', ['get', 'fade'], 1]] as never,
      },
    },
    {
      id: 'journeys-line',
      type: 'line',
      source: 'journeys',
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': ['get', 'color'],
        'line-width': ['interpolate', ['linear'], ['zoom'], 4, 2.6, 9, 4.2],
        'line-opacity': ['coalesce', ['get', 'fade'], 1] as never,
      },
    },
    {
      id: 'journeys-dash',
      type: 'line',
      source: 'journeys',
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': palette.halo,
        'line-width': ['interpolate', ['linear'], ['zoom'], 4, 1, 9, 1.6],
        'line-opacity': ['*', 0.85, ['coalesce', ['get', 'fade'], 1]] as never,
        'line-dasharray': [0, 2.4, 2.4],
      },
    },
    {
      id: 'journey-heads',
      type: 'symbol',
      source: 'journey-heads',
      layout: {
        'icon-image': ['get', 'icon'],
        'icon-allow-overlap': true,
        'icon-ignore-placement': true,
        'text-field': ['get', 'label'],
        'text-font': [FONT.display],
        'text-size': 10.5,
        'text-anchor': 'left',
        'text-offset': [1.1, 0],
        'text-optional': true,
      },
      paint: {
        'text-color': ['get', 'color'],
        'text-halo-color': palette.halo,
        'text-halo-width': 1.5,
      },
    },
  ]
}
