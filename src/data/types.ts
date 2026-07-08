/** Runtime shapes of the compiled files in public/data (see scripts/build-data.mjs). */

export type LocationType = 'City' | 'Castle' | 'Town' | 'Ruin' | 'Village' | 'Landmark' | 'Other'

export interface LocationProps {
  slug: string
  name: string
  aliases: string[]
  type: LocationType
  rank: number // 1–6, drives zoom tier + collision priority
  region: string | null
  allegiance: string | null
  description: string | null
  firstAppearance: number | null // epIndex
  showCanon: 'shown' | 'mentioned'
  enriched: 0 | 1
}

export type EventType =
  | 'battle'
  | 'death'
  | 'wedding'
  | 'political'
  | 'sack'
  | 'destruction'
  | 'birth'
  | 'coronation'
  | 'escape'
  | 'supernatural'
  | 'journey'
  | 'other'

export interface ShowEvent {
  id: string
  title: string
  description: string
  type: EventType
  season: number
  episode: number
  episodeTitle: string
  epIndex: number // 1–73
  locationId: string | null
  locationName: string | null
  coords: [number, number]
  characters: string[]
  importance: 1 | 2 | 3
}

export interface JourneyWaypoint {
  coordIndex: number
  cumKm: number
  epIndex: number
  name: string | null
  note: string | null
}

export interface Journey {
  characterId: string
  name: string
  color: string
  dies: number | null // epIndex
  coords: [number, number][]
  waypoints: JourneyWaypoint[]
  totalKm: number
}

export interface Character {
  id: string
  name: string
  house?: string
  journeyAvailable?: boolean
}

export interface EpisodeInfo {
  season: number
  episode: number
  title: string
  epIndex: number
}

export interface Meta {
  generatedAt: string
  counts: {
    locations: number
    enriched: number
    events: number
    journeys: number
    characters: number
  }
}

export interface WorldData {
  continents: GeoJSON.FeatureCollection
  islands: GeoJSON.FeatureCollection
  lakes: GeoJSON.FeatureCollection
  landscape: GeoJSON.FeatureCollection
  rivers: GeoJSON.FeatureCollection
  roads: GeoJSON.FeatureCollection
  wall: GeoJSON.FeatureCollection
  political: GeoJSON.FeatureCollection
  locations: GeoJSON.FeatureCollection<GeoJSON.Point, LocationProps>
  labelsPhysical: GeoJSON.FeatureCollection
  labelsWater: GeoJSON.FeatureCollection
  events: ShowEvent[]
  journeys: Journey[]
  characters: Character[]
  episodes: EpisodeInfo[]
  meta: Meta
}
