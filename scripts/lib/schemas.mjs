/** Zod schemas for all hand-authored curated data. Mirrors src/data/types.ts. */
import { z } from 'zod'

export const Coords = z.tuple([z.number(), z.number()])

const EpisodeRef = z.object({
  season: z.number().int().min(1).max(8),
  episode: z.number().int().min(1).max(10),
})

export const LocationEnrichment = z
  .object({
    id: z.number().int().optional(), // upstream got_locations id; omit for new locations
    slug: z
      .string()
      .regex(/^[a-z0-9-]+$/, 'slug must be kebab-case'),
    name: z.string().min(1),
    aliases: z.array(z.string()).optional(),
    region: z.string().min(1),
    allegiance: z.string().optional(),
    description: z.string().min(20).max(600),
    firstAppearance: EpisodeRef.optional(),
    showCanon: z.enum(['shown', 'mentioned']),
    rankOverride: z.number().int().min(1).max(6).optional(),
    type: z.enum(['City', 'Castle', 'Town', 'Ruin', 'Village', 'Landmark', 'Other']).optional(),
    coords: Coords.optional(),
  })
  .refine((l) => l.id !== undefined || (l.coords && l.type), {
    message: 'new locations (no upstream id) need coords and type',
  })

export const EventType = z.enum([
  'battle',
  'death',
  'wedding',
  'political',
  'sack',
  'destruction',
  'birth',
  'coronation',
  'escape',
  'supernatural',
  'journey',
  'other',
])

export const ShowEvent = z
  .object({
    id: z.string().regex(/^s\d{2}e\d{2}-[a-z0-9-]+$/, 'id like s01e09-execution-of-ned-stark'),
    title: z.string().min(3).max(80),
    description: z.string().min(30).max(500),
    type: EventType,
    season: z.number().int().min(1).max(8),
    episode: z.number().int().min(1).max(10),
    episodeTitle: z.string().min(1),
    locationId: z.string().optional(),
    coords: Coords.optional(),
    characters: z.array(z.string()),
    importance: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  })
  .refine((e) => e.locationId || e.coords, {
    message: 'event needs locationId or explicit coords',
  })

export const Journey = z.object({
  characterId: z.string().min(1),
  name: z.string().min(1),
  color: z.string().regex(/^#[0-9a-f]{6}$/i),
  dies: EpisodeRef.optional(),
  waypoints: z
    .array(
      z
        .object({
          locationId: z.string().optional(),
          coords: Coords.optional(),
          season: z.number().int().min(1).max(8),
          episode: z.number().int().min(1).max(10),
          via: z.array(Coords).optional(),
          note: z.string().max(200).optional(),
        })
        .refine((w) => w.locationId || w.coords, {
          message: 'waypoint needs locationId or coords',
        }),
    )
    .min(2),
})

export const Character = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  house: z.string().optional(),
  journeyAvailable: z.boolean().optional(),
})

export const LabelOverride = z.object({
  coords: Coords.optional(),
  text: z.string().optional(),
  hide: z.boolean().optional(),
  sizeRank: z.number().int().min(1).max(3).optional(),
})

export const ExtraLabel = z.object({
  type: z.literal('Feature'),
  properties: z.object({
    name: z.string(),
    kind: z.enum(['sea', 'bay', 'strait', 'mountains', 'desert', 'area', 'forest', 'swamp']),
    sizeRank: z.number().int().min(1).max(3).optional(),
  }),
  geometry: z.object({
    type: z.enum(['Point', 'LineString']),
    coordinates: z.any(),
  }),
})
