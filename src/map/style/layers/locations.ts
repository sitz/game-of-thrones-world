import type { LayerSpecification } from 'maplibre-gl'
import type { ExpressionSpecification } from 'maplibre-gl'
import { palette, FONT } from '../palette'

const halo = {
  'text-halo-color': palette.halo,
  'text-halo-width': 1.4,
  'text-halo-blur': 0.4,
} as const

// Higher-rank places win symbol collisions (lower sort key = higher priority)
const sortKey: ExpressionSpecification = ['-', 6, ['get', 'rank']]

const anchors: {
  'text-variable-anchor': ('top' | 'bottom' | 'right' | 'left')[]
  'text-radial-offset': number
  'text-justify': 'auto'
} = {
  'text-variable-anchor': ['top', 'bottom', 'right', 'left'],
  'text-radial-offset': 0.75,
  'text-justify': 'auto',
}

interface Tier {
  id: string
  filter: ExpressionSpecification
  minzoom: number
  icon: string
  font: string
  size: [number, number, number, number] // z1, s1, z2, s2
  color?: string
  iconSize?: number
}

const tiers: Tier[] = [
  {
    id: 'loc-other',
    filter: ['in', ['get', 'type'], ['literal', ['Other', 'Village', 'Landmark']]],
    minzoom: 7,
    icon: 'poi',
    font: FONT.fell,
    size: [7, 10.5, 10.5, 12.5],
    color: palette.inkSoft,
  },
  {
    id: 'loc-ruin',
    filter: ['==', ['get', 'type'], 'Ruin'],
    minzoom: 6.2,
    icon: 'ruin',
    font: FONT.fellItalic,
    size: [6.2, 10.5, 10.5, 13],
    color: palette.ruinLabel,
  },
  {
    id: 'loc-town',
    filter: ['==', ['get', 'type'], 'Town'],
    minzoom: 6,
    icon: 'town',
    font: FONT.display,
    size: [6, 10.5, 10.5, 13],
  },
  {
    id: 'loc-castle-minor',
    filter: ['all', ['==', ['get', 'type'], 'Castle'], ['<=', ['get', 'rank'], 2]],
    minzoom: 6.4,
    icon: 'castle',
    font: FONT.display,
    size: [6.4, 10.5, 10.5, 13],
    iconSize: 0.85,
  },
  {
    id: 'loc-castle',
    filter: [
      'all',
      ['==', ['get', 'type'], 'Castle'],
      ['>', ['get', 'rank'], 2],
      ['<', ['get', 'rank'], 5],
    ],
    minzoom: 5.4,
    icon: 'castle',
    font: FONT.display,
    size: [5.4, 11, 10.5, 14],
  },
  {
    id: 'loc-castle-major',
    filter: ['all', ['==', ['get', 'type'], 'Castle'], ['>=', ['get', 'rank'], 5]],
    minzoom: 4.4,
    icon: 'castle',
    font: FONT.display,
    size: [4.4, 11.5, 9, 15.5],
  },
  {
    id: 'loc-city',
    filter: ['all', ['==', ['get', 'type'], 'City'], ['<', ['get', 'rank'], 5]],
    minzoom: 4.6,
    icon: 'city',
    font: FONT.display,
    size: [4.6, 11.5, 9, 15],
  },
  {
    id: 'loc-city-major',
    filter: ['all', ['==', ['get', 'type'], 'City'], ['>=', ['get', 'rank'], 5]],
    minzoom: 3.8,
    icon: 'city-large',
    font: FONT.displayBold,
    size: [3.9, 12, 8, 18],
  },
]

export function locationLayers(): LayerSpecification[] {
  return tiers.map(({ id, filter, minzoom, icon, font, size, color, iconSize }) => ({
    id,
    type: 'symbol' as const,
    source: 'locations',
    filter,
    minzoom,
    layout: {
      'icon-image': icon,
      'icon-size': iconSize ?? 1,
      'text-field': ['get', 'name'] as never,
      'text-font': [font],
      'text-size': ['interpolate', ['linear'], ['zoom'], size[0], size[1], size[2], size[3]] as never,
      'symbol-sort-key': sortKey,
      'text-optional': true,
      ...anchors,
    },
    paint: {
      'text-color': color ?? palette.ink,
      ...halo,
    },
  }))
}

/** Selection halo — a single-feature source updated on click. */
export function selectionLayers(): LayerSpecification[] {
  return [
    {
      id: 'selected-halo',
      type: 'circle',
      source: 'selected',
      paint: {
        'circle-radius': 17,
        'circle-color': 'rgba(140, 47, 57, 0.12)',
        'circle-stroke-color': palette.selection,
        'circle-stroke-width': 2.2,
      },
    },
  ]
}
