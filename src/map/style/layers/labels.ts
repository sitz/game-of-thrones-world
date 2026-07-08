import type { LayerSpecification } from 'maplibre-gl'
import { palette, FONT } from '../palette'

const halo = {
  'text-halo-color': palette.halo,
  'text-halo-width': 1.4,
  'text-halo-blur': 0.4,
} as const

/** Water body names — light ink on the dark teal sea. */
export function waterLabelLayers(): LayerSpecification[] {
  const waterPaint = {
    'text-color': palette.waterLabel,
    'text-halo-color': palette.waterLabelHalo,
    'text-halo-width': 1.1,
    'text-halo-blur': 0.6,
  } as const

  return [
    {
      id: 'label-sea',
      type: 'symbol',
      source: 'labels-water',
      filter: ['all', ['==', ['get', 'kind'], 'sea'], ['==', ['geometry-type'], 'Point']],
      minzoom: 3.3,
      layout: {
        'text-field': ['get', 'name'],
        'text-font': [FONT.fellItalic],
        'text-size': ['interpolate', ['linear'], ['zoom'], 3.4, 13, 6, 20],
        'text-letter-spacing': 0.5,
        'text-max-width': 6,
      },
      paint: { ...waterPaint, 'text-opacity': ['interpolate', ['linear'], ['zoom'], 7.5, 1, 8.5, 0.4] },
    },
    {
      id: 'label-water-minor',
      type: 'symbol',
      source: 'labels-water',
      filter: ['all', ['!=', ['get', 'kind'], 'sea'], ['==', ['geometry-type'], 'Point']],
      minzoom: 4.9,
      layout: {
        'text-field': ['get', 'name'],
        'text-font': [FONT.fellItalic],
        'text-size': ['interpolate', ['linear'], ['zoom'], 5, 11, 8, 14.5],
        'text-letter-spacing': 0.28,
        'text-max-width': 7,
      },
      paint: waterPaint,
    },
    {
      id: 'label-water-line',
      type: 'symbol',
      source: 'labels-water',
      filter: ['==', ['geometry-type'], 'LineString'],
      minzoom: 3.3,
      layout: {
        'symbol-placement': 'line-center',
        'text-field': ['get', 'name'],
        'text-font': [FONT.fellItalic],
        'text-size': ['interpolate', ['linear'], ['zoom'], 3.4, 14, 6, 21],
        'text-letter-spacing': 0.55,
      },
      paint: waterPaint,
    },
    {
      id: 'label-river',
      type: 'symbol',
      source: 'rivers',
      filter: ['to-boolean', ['get', 'name']],
      minzoom: 6.6,
      layout: {
        'symbol-placement': 'line',
        'text-field': ['get', 'name'],
        'text-font': [FONT.fellItalic],
        'text-size': ['interpolate', ['linear'], ['zoom'], 6.6, 10.5, 10, 13],
        'text-letter-spacing': 0.15,
      },
      paint: {
        'text-color': palette.river,
        'text-halo-color': palette.halo,
        'text-halo-width': 1.2,
      },
    },
  ]
}

/** Physical geography + political names on land. */
export function physicalLabelLayers(): LayerSpecification[] {
  const landscapeColor = [
    'match',
    ['get', 'kind'],
    'forest',
    palette.forestLabel,
    'mountain',
    palette.mountainLabel,
    'mountains',
    palette.mountainLabel,
    'swamp',
    palette.swampLabel,
    'desert',
    palette.desertLabel,
    palette.regionLabel,
  ] as never

  return [
    {
      id: 'label-road',
      type: 'symbol',
      source: 'roads',
      filter: ['to-boolean', ['get', 'name']],
      minzoom: 6.2,
      layout: {
        'symbol-placement': 'line',
        'text-field': ['get', 'name'],
        'text-font': [FONT.fell],
        'text-size': 10.5,
        'text-letter-spacing': 0.25,
      },
      paint: { 'text-color': palette.roadLabel, ...halo },
    },
    {
      id: 'label-wall',
      type: 'symbol',
      source: 'wall',
      minzoom: 4.5,
      layout: {
        'symbol-placement': 'line',
        'text-field': 'THE WALL',
        'text-font': [FONT.display],
        'text-size': ['interpolate', ['linear'], ['zoom'], 4.5, 10, 8, 15],
        'text-letter-spacing': 0.7,
        'text-offset': [0, -1.1],
      },
      paint: { 'text-color': palette.wallLabel, ...halo },
    },
    {
      id: 'label-landscape',
      type: 'symbol',
      source: 'labels-physical',
      filter: [
        'in',
        ['get', 'kind'],
        ['literal', ['forest', 'mountain', 'mountains', 'swamp', 'desert']],
      ],
      minzoom: 4.7,
      layout: {
        'text-field': ['get', 'name'],
        'text-font': [FONT.fellItalic],
        'text-size': ['interpolate', ['linear'], ['zoom'], 4.8, 11, 8, 15.5],
        'text-letter-spacing': 0.22,
        'text-max-width': 7,
        'symbol-sort-key': ['get', 'sizeRank'],
      },
      paint: { 'text-color': landscapeColor, ...halo },
    },
    {
      id: 'label-region',
      type: 'symbol',
      source: 'labels-physical',
      filter: ['==', ['get', 'kind'], 'region'],
      minzoom: 5.3,
      layout: {
        'text-field': ['get', 'name'],
        'text-font': [FONT.fell],
        'text-size': ['interpolate', ['linear'], ['zoom'], 5.4, 10.5, 8.5, 14],
        'text-letter-spacing': 0.3,
        'text-max-width': 7,
        'symbol-sort-key': ['get', 'sizeRank'],
      },
      paint: { 'text-color': palette.regionLabel, ...halo, 'text-halo-width': 1.2 },
    },
    {
      id: 'label-kingdom',
      type: 'symbol',
      source: 'labels-physical',
      filter: ['==', ['get', 'kind'], 'kingdom'],
      minzoom: 3.9,
      maxzoom: 7.4,
      layout: {
        'text-field': ['upcase', ['get', 'name']],
        'text-font': [FONT.display],
        'text-size': ['interpolate', ['linear'], ['zoom'], 4.2, 11, 7, 21],
        'text-letter-spacing': 0.42,
        'text-max-width': 8,
      },
      paint: {
        'text-color': palette.kingdomLabel,
        ...halo,
        'text-halo-width': 1.6,
        'text-opacity': ['interpolate', ['linear'], ['zoom'], 6.6, 0.95, 7.3, 0.35],
      },
    },
    {
      id: 'label-continent',
      type: 'symbol',
      source: 'labels-physical',
      filter: ['==', ['get', 'kind'], 'continent'],
      minzoom: 3.2,
      maxzoom: 5.0,
      layout: {
        'text-field': ['upcase', ['get', 'name']],
        'text-font': [FONT.displayBold],
        'text-size': ['interpolate', ['linear'], ['zoom'], 3.3, 24, 4.8, 34],
        'text-letter-spacing': 0.65,
      },
      paint: {
        'text-color': palette.continentLabel,
        ...halo,
        'text-halo-width': 2,
        'text-opacity': ['interpolate', ['linear'], ['zoom'], 4.2, 0.9, 4.9, 0],
      },
    },
  ]
}
