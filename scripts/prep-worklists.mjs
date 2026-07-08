/**
 * Pre-generates authoring worklists for the dataset fan-out:
 *  - assigns every upstream location a canonical slug + a region bucket
 *    (point-in-polygon against the political polygons, longitude bands for Essos)
 *  - adds show-important locations missing upstream (with coords)
 *  - emits data/curated/canonical-slugs.json (the contract for events/journeys)
 *  - emits per-bucket worklists + a coordinate anchor cheat-sheet to --out <dir>
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { slugify, largestRing } from './lib/normalize.mjs'
import polylabel from 'polylabel'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outIx = process.argv.indexOf('--out')
const OUT = outIx > -1 ? process.argv[outIx + 1] : path.join(ROOT, 'data', 'worklists')
fs.mkdirSync(OUT, { recursive: true })

const vendor = (f) => JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'vendor', f), 'utf8'))

// ---- point in polygon (ray casting, MultiPolygon-aware)
function inRing(pt, ring) {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]
    if (yi > pt[1] !== yj > pt[1] && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) {
      inside = !inside
    }
  }
  return inside
}
function inGeometry(pt, geometry) {
  const polys = geometry.type === 'MultiPolygon' ? geometry.coordinates : [geometry.coordinates]
  for (const rings of polys) {
    if (inRing(pt, rings[0]) && !rings.slice(1).some((hole) => inRing(pt, hole))) return true
  }
  return false
}

const BUCKET_BY_KINGDOM = {
  'The North': 'north',
  'New Gift': 'north',
  "Bran's Gift": 'north',
  Riverlands: 'riverlands',
  'The Vale': 'vale',
  'The Iron Islands': 'iron-islands',
  'The Westerlands': 'westerlands',
  Crownsland: 'crownlands',
  Stormlands: 'stormlands',
  'The Reach': 'reach',
  Dorne: 'dorne',
  __wildlings: 'beyond-wall',
}

const political = vendor('got_political.geojson').features
const locations = vendor('got_locations.geojson').features

function bucketFor(coords) {
  for (const f of political) {
    if (inGeometry(coords, f.geometry)) {
      const key = f.properties.name ?? '__wildlings'
      return BUCKET_BY_KINGDOM[key] ?? null
    }
  }
  // Not inside any kingdom polygon: Westeros islands & fringes by lon, Essos by lon
  const [lon, lat] = coords
  if (lon < 26.5) {
    if (lat > 33) return 'beyond-wall'
    if (lat > 17) return 'north'
    if (lon < 10 && lat > 8) return 'iron-islands'
    if (lat < -4) return 'dorne'
    if (lon > 20) return lat > 6 ? 'vale' : 'stormlands'
    return lat > 6 ? 'riverlands' : 'reach'
  }
  return lon < 42 ? 'essos-west' : 'essos-east'
}

// ---- island centroids for new locations
const islands = vendor('got_islands.geojson').features
function islandPoint(name) {
  const f = islands.find((f) => f.properties.name === name)
  if (!f) return null
  const { rings } = largestRing(f.geometry)
  const p = polylabel(rings, 0.05)
  return [Math.round(p[0] * 1e5) / 1e5, Math.round(p[1] * 1e5) / 1e5]
}

const NEW_LOCATIONS = [
  { slug: 'casterly-rock', name: 'Casterly Rock', type: 'Castle', size: 5, coords: [7.28, 5.52] },
  { slug: 'hardhome', name: 'Hardhome', type: 'Village', size: 3, coords: [21.6, 36.8] },
  { slug: 'bear-island', name: 'Bear Island', type: 'Castle', size: 2, coords: islandPoint('Bear Island') ?? [10.2, 30.2] },
  { slug: 'naath', name: 'Naath', type: 'Landmark', size: 1, coords: islandPoint('Naath') ?? [46, -37.5] },
]

// ---- existing seed enrichments (preserved by authors)
const seedDir = path.join(ROOT, 'data', 'curated', 'locations')
const seeds = new Map() // slug -> {file, entry}
for (const file of fs.readdirSync(seedDir).filter((f) => f.endsWith('.json'))) {
  for (const entry of JSON.parse(fs.readFileSync(path.join(seedDir, file), 'utf8'))) {
    seeds.set(entry.slug, { file, entry })
  }
}

// ---- canonical slug assignment
const canonical = {} // slug -> {id?, name, type, size, coords, bucket}
const usedSlugs = new Set()
const buckets = {}

function register(slug, info) {
  canonical[slug] = info
  ;(buckets[info.bucket] ??= []).push({ slug, ...info })
}

for (const f of locations) {
  const name = f.properties.name
  if (!name) continue
  const coords = [
    Math.round(f.geometry.coordinates[0] * 1e5) / 1e5,
    Math.round(f.geometry.coordinates[1] * 1e5) / 1e5,
  ]
  // Seeded entries keep their curated slug
  const seeded = [...seeds.values()].find((s) => s.entry.id === f.properties.id)
  let slug = seeded ? seeded.entry.slug : slugify(name)
  if (usedSlugs.has(slug)) slug = `${slug}-${f.properties.id}`
  usedSlugs.add(slug)
  register(slug, {
    id: f.properties.id,
    name,
    type: f.properties.type,
    size: f.properties.size,
    coords,
    bucket: bucketFor(f.geometry.coordinates),
    seeded: Boolean(seeded),
  })
}

for (const n of NEW_LOCATIONS) {
  if (usedSlugs.has(n.slug)) continue
  usedSlugs.add(n.slug)
  register(n.slug, { ...n, bucket: bucketFor(n.coords), isNew: true, seeded: false })
}

fs.writeFileSync(
  path.join(ROOT, 'data', 'curated', 'canonical-slugs.json'),
  JSON.stringify(canonical, null, 1),
)

// ---- worklists + anchors
for (const [bucket, items] of Object.entries(buckets)) {
  fs.writeFileSync(path.join(OUT, `${bucket}.json`), JSON.stringify(items, null, 1))
}

const ANCHOR_NAMES = [
  "King's Landing",
  'Winterfell',
  'Castle Black',
  'The Eyrie',
  'Sunspear',
  'Pyke',
  'Oldtown',
  'Lannisport',
  'White Harbor',
  'Braavos',
  'Pentos',
  'Volantis',
  'Meereen',
  'Astapor',
  'Yunkai',
  'Vaes Dothrak',
  'Qarth',
  'Dragonstone',
  'Riverrun',
  'Harrenhal',
  "Storm's End",
  'Highgarden',
  'Eastwatch-by-the-Sea',
  'Valyria',
]
const anchors = {}
for (const [slug, info] of Object.entries(canonical)) {
  if (ANCHOR_NAMES.includes(info.name)) anchors[info.name] = { slug, coords: info.coords }
}
fs.writeFileSync(path.join(OUT, '_anchors.json'), JSON.stringify(anchors, null, 1))

const summary = Object.entries(buckets)
  .map(([b, items]) => `${b}: ${items.length}`)
  .join(', ')
console.log(`canonical slugs: ${Object.keys(canonical).length}`)
console.log(`worklists → ${OUT}`)
console.log(summary)
