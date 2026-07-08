import MiniSearch from 'minisearch'
import type { WorldData } from '../data/types'
import { formatEp } from '../data/episodes'

export type SearchKind = 'location' | 'event' | 'character' | 'place'

export interface SearchDoc {
  id: string
  kind: SearchKind
  name: string
  aliases: string
  sub: string // secondary line shown in results
  coords?: [number, number]
  zoom?: number
  boost: number
}

export function buildSearchDocs(data: WorldData): SearchDoc[] {
  const docs: SearchDoc[] = []

  for (const f of data.locations.features) {
    const p = f.properties
    docs.push({
      id: `location:${p.slug}`,
      kind: 'location',
      name: p.name,
      aliases: (p.aliases ?? []).join(' '),
      sub: [p.type === 'Other' ? null : p.type, p.region].filter(Boolean).join(' · '),
      coords: f.geometry.coordinates as [number, number],
      boost: 1 + p.rank / 6,
    })
  }

  for (const e of data.events) {
    docs.push({
      id: `event:${e.id}`,
      kind: 'event',
      name: e.title,
      aliases: e.locationName ?? '',
      sub: `${formatEp(e.epIndex)} · ${e.episodeTitle}`,
      coords: e.coords,
      boost: 1 + (3 - e.importance) * 0.25,
    })
  }

  for (const c of data.characters) {
    if (!c.journeyAvailable) continue
    docs.push({
      id: `character:${c.id}`,
      kind: 'character',
      name: c.name,
      aliases: c.house ?? '',
      sub: 'Character journey',
      boost: 1.6,
    })
  }

  const placeZoom: Record<string, number> = {
    continent: 3.6,
    kingdom: 5.4,
    region: 6.3,
    sea: 4.6,
    bay: 5.8,
    strait: 6,
    forest: 6,
    mountain: 6,
    mountains: 6,
    swamp: 6.2,
    desert: 5.2,
  }
  for (const fc of [data.labelsPhysical, data.labelsWater]) {
    for (const f of fc.features) {
      const p = f.properties as { name: string; kind: string }
      const coords =
        f.geometry.type === 'Point'
          ? (f.geometry.coordinates as [number, number])
          : ((f.geometry as GeoJSON.LineString).coordinates[
              Math.floor((f.geometry as GeoJSON.LineString).coordinates.length / 2)
            ] as [number, number])
      docs.push({
        id: `place:${p.kind}:${p.name}`,
        kind: 'place',
        name: p.name,
        aliases: '',
        sub: placeKindLabel(p.kind),
        coords,
        zoom: placeZoom[p.kind] ?? 5.5,
        boost: p.kind === 'kingdom' || p.kind === 'continent' ? 1.5 : 1,
      })
    }
  }

  return docs
}

function placeKindLabel(kind: string): string {
  switch (kind) {
    case 'kingdom':
      return 'Kingdom'
    case 'continent':
      return 'Continent'
    case 'region':
      return 'Region'
    case 'sea':
      return 'Sea'
    case 'bay':
      return 'Bay'
    case 'strait':
      return 'Strait'
    case 'forest':
      return 'Forest'
    case 'mountain':
    case 'mountains':
      return 'Mountains'
    case 'swamp':
      return 'Swamp'
    case 'desert':
      return 'Steppe / desert'
    default:
      return 'Place'
  }
}

export function buildSearchIndex(docs: SearchDoc[]): MiniSearch<SearchDoc> {
  const ms = new MiniSearch<SearchDoc>({
    fields: ['name', 'aliases', 'sub'],
    storeFields: ['kind', 'name', 'sub', 'coords', 'zoom', 'boost'],
    searchOptions: {
      prefix: true,
      fuzzy: 0.2,
      boost: { name: 3, aliases: 2 },
    },
  })
  ms.addAll(docs)
  return ms
}
