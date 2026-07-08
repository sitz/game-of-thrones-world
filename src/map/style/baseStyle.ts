import type { StyleSpecification, SourceSpecification } from 'maplibre-gl'
import type { WorldData, ShowEvent } from '../../data/types'
import { baseLayers, politicalLayers, lineLayers } from './layers/base'
import { locationLayers, selectionLayers } from './layers/locations'
import { eventLayers, journeyLayers } from './layers/story'
import { waterLabelLayers, physicalLabelLayers } from './layers/labels'

const EMPTY_FC = { type: 'FeatureCollection', features: [] } as const

export function eventsToFC(events: ShowEvent[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: events.map((e) => ({
      type: 'Feature',
      properties: {
        id: e.id,
        title: e.title,
        type: e.type,
        epIndex: e.epIndex,
        importance: e.importance,
        season: e.season,
        episode: e.episode,
      },
      geometry: { type: 'Point', coordinates: e.coords },
    })),
  }
}

export function buildStyle(data: WorldData): StyleSpecification {
  const geojson = (d: unknown): SourceSpecification => ({
    type: 'geojson',
    data: d as GeoJSON.FeatureCollection,
  })

  // MapLibre needs an absolute glyphs URL (the style is an inline object with
  // no base URL of its own); resolve the app's base against the current page
  // so it works at "/" in dev and under "/game-of-thrones-world/" on Pages.
  const appBase = new URL(import.meta.env.BASE_URL, window.location.href).href

  return {
    version: 8,
    glyphs: `${appBase}glyphs/{fontstack}/{range}.pbf`,
    sources: {
      continents: geojson(data.continents),
      islands: geojson(data.islands),
      lakes: geojson(data.lakes),
      landscape: geojson(data.landscape),
      rivers: geojson(data.rivers),
      roads: geojson(data.roads),
      wall: geojson(data.wall),
      political: geojson(data.political),
      locations: geojson(data.locations),
      'labels-physical': geojson(data.labelsPhysical),
      'labels-water': geojson(data.labelsWater),
      events: geojson(eventsToFC(data.events)),
      journeys: geojson(EMPTY_FC),
      'journey-heads': geojson(EMPTY_FC),
      selected: geojson(EMPTY_FC),
    },
    layers: [
      ...baseLayers(),
      ...politicalLayers(),
      ...lineLayers(),
      ...journeyLayers().filter((l) => l.id !== 'journey-heads'),
      ...selectionLayers(),
      ...eventLayers(),
      ...locationLayers(),
      ...waterLabelLayers(),
      ...physicalLabelLayers(),
      ...journeyLayers().filter((l) => l.id === 'journey-heads'),
    ],
  }
}
