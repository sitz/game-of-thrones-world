import type { WorldData } from './types'

async function get<T>(name: string): Promise<T> {
  const res = await fetch(`${import.meta.env.BASE_URL}data/${name}`)
  if (!res.ok) throw new Error(`Failed to load ${name}: ${res.status}`)
  return res.json() as Promise<T>
}

/** Loads every compiled dataset in parallel. ~1 MB raw, ~350 KB gzipped. */
export async function loadWorldData(): Promise<WorldData> {
  const [
    continents,
    islands,
    lakes,
    landscape,
    rivers,
    roads,
    wall,
    political,
    locations,
    labelsPhysical,
    labelsWater,
    events,
    journeys,
    characters,
    episodes,
    meta,
  ] = await Promise.all([
    get<WorldData['continents']>('continents.geojson'),
    get<WorldData['islands']>('islands.geojson'),
    get<WorldData['lakes']>('lakes.geojson'),
    get<WorldData['landscape']>('landscape.geojson'),
    get<WorldData['rivers']>('rivers.geojson'),
    get<WorldData['roads']>('roads.geojson'),
    get<WorldData['wall']>('wall.geojson'),
    get<WorldData['political']>('political.geojson'),
    get<WorldData['locations']>('locations.geojson'),
    get<WorldData['labelsPhysical']>('labels-physical.geojson'),
    get<WorldData['labelsWater']>('labels-water.geojson'),
    get<WorldData['events']>('events.json'),
    get<WorldData['journeys']>('journeys.json'),
    get<WorldData['characters']>('characters.json'),
    get<WorldData['episodes']>('episodes.json'),
    get<WorldData['meta']>('meta.json'),
  ])
  return {
    continents,
    islands,
    lakes,
    landscape,
    rivers,
    roads,
    wall,
    political,
    locations,
    labelsPhysical,
    labelsWater,
    events,
    journeys,
    characters,
    episodes,
    meta,
  }
}
