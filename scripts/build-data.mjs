/**
 * Offline data pipeline: data/vendor + data/curated  →  public/data.
 *  - trims + minifies base geometry
 *  - joins hand-authored location enrichments onto upstream points
 *  - generates label points (polylabel) for kingdoms/regions/landscape/water/continents
 *  - compiles events (epIndex, coord resolution) and journeys (distance-parametrized)
 * Fails hard on schema errors or dangling references.
 * Run: npm run data:build   (also wired as predev/prebuild)
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import polylabel from 'polylabel'
import { z } from 'zod'
import {
  normalizeName,
  roundCoords,
  largestRing,
  haversineKm,
} from './lib/normalize.mjs'
import * as S from './lib/schemas.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const VENDOR = path.join(ROOT, 'data', 'vendor')
const CURATED = path.join(ROOT, 'data', 'curated')
const OUT = path.join(ROOT, 'public', 'data')

const IF_MISSING = process.argv.includes('--if-missing')
if (IF_MISSING && fs.existsSync(path.join(OUT, 'meta.json'))) {
  console.log('data:build skipped (public/data exists; run `npm run data:build` to rebuild)')
  process.exit(0)
}

const readJSON = (p) => JSON.parse(fs.readFileSync(p, 'utf8'))
const vendor = (f) => readJSON(path.join(VENDOR, f))
const curatedDir = (dir) => {
  const d = path.join(CURATED, dir)
  if (!fs.existsSync(d)) return []
  return fs
    .readdirSync(d)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => ({ file: `${dir}/${f}`, data: readJSON(path.join(d, f)) }))
}

const errors = []
const warnings = []
const fail = (msg) => errors.push(msg)
const warn = (msg) => warnings.push(msg)

function validate(schema, value, ctx) {
  const res = schema.safeParse(value)
  if (!res.success) {
    for (const issue of res.error.issues) {
      fail(`${ctx}: ${issue.path.join('.')} — ${issue.message}`)
    }
    return null
  }
  return res.data
}

fs.mkdirSync(OUT, { recursive: true })
let outBytes = 0
function write(name, obj) {
  const json = JSON.stringify(obj)
  fs.writeFileSync(path.join(OUT, name), json)
  outBytes += json.length
  console.log(`  ${name.padEnd(26)} ${(json.length / 1024).toFixed(0).padStart(5)} KB`)
}

const EP_OFFSETS = [0, 10, 20, 30, 40, 50, 60, 67]
const epIndexOf = (season, episode) => EP_OFFSETS[season - 1] + episode

// ---------------------------------------------------------------- geometry
console.log('geometry:')
const geomProps = {
  continents: (p) => ({ name: p.name }),
  islands: (p) => ({ name: p.name, size: p.size }),
  lakes: (p) => ({ name: p.name }),
  landscape: (p) => ({ name: p.name, type: p.type }),
  rivers: (p) => ({ name: p.name, size: p.size }),
  roads: (p) => ({ name: p.name, size: p.size }),
  wall: (p) => ({ name: p.name }),
  political: (p) => ({ name: p.name, claimedBy: p.ClaimedBy }),
}
const geom = {}
for (const [name, pick] of Object.entries(geomProps)) {
  const fc = vendor(`got_${name}.geojson`)
  geom[name] = {
    type: 'FeatureCollection',
    features: fc.features.map((f) => ({
      type: 'Feature',
      properties: pick(f.properties ?? {}),
      geometry: { type: f.geometry.type, coordinates: roundCoords(f.geometry.coordinates) },
    })),
  }
  write(`${name}.geojson`, geom[name])
}

// ------------------------------------------------------------- enrichments
console.log('locations:')
const upstream = vendor('got_locations.geojson')
const bySlugCoords = new Map() // slug -> [lon,lat] for event/journey resolution

const enrichFiles = curatedDir('locations')
const enrichments = []
const seenSlugs = new Set()
for (const { file, data } of enrichFiles) {
  if (!Array.isArray(data)) {
    fail(`${file}: expected an array of enrichments`)
    continue
  }
  data.forEach((raw, i) => {
    const e = validate(S.LocationEnrichment, raw, `${file}[${i}]`)
    if (!e) return
    if (seenSlugs.has(e.slug)) fail(`${file}: duplicate slug "${e.slug}"`)
    seenSlugs.add(e.slug)
    enrichments.push({ ...e, _file: file })
  })
}

const upstreamById = new Map(upstream.features.map((f) => [f.properties.id, f]))
const upstreamByName = new Map()
for (const f of upstream.features) {
  const key = normalizeName(f.properties.name ?? '')
  if (key && !upstreamByName.has(key)) upstreamByName.set(key, f)
}

const matchedUpstreamIds = new Set()
const locationFeatures = []

for (const e of enrichments) {
  let up = null
  if (e.id !== undefined) {
    up = upstreamById.get(e.id)
    if (!up) {
      fail(`${e._file}: "${e.slug}" references upstream id ${e.id} which does not exist`)
      continue
    }
    if (normalizeName(up.properties.name ?? '') !== normalizeName(e.name)) {
      warn(
        `${e._file}: "${e.slug}" name "${e.name}" differs from upstream id ${e.id} name "${up.properties.name}" (rename kept)`,
      )
    }
    matchedUpstreamIds.add(e.id)
  } else if (upstreamByName.has(normalizeName(e.name))) {
    fail(
      `${e._file}: "${e.slug}" has no id but matches upstream name "${e.name}" — set its id instead of duplicating`,
    )
    continue
  }
  const coords = e.coords ?? up.geometry.coordinates
  const type = e.type ?? up?.properties.type ?? 'Other'
  const rank = e.rankOverride ?? up?.properties.size ?? 2
  bySlugCoords.set(e.slug, coords)
  locationFeatures.push({
    type: 'Feature',
    properties: {
      slug: e.slug,
      name: e.name,
      aliases: e.aliases ?? [],
      type,
      rank,
      region: e.region,
      allegiance: e.allegiance ?? null,
      description: e.description,
      firstAppearance: e.firstAppearance ? epIndexOf(e.firstAppearance.season, e.firstAppearance.episode) : null,
      showCanon: e.showCanon,
      enriched: 1,
    },
    geometry: { type: 'Point', coordinates: roundCoords(coords) },
  })
}

// Upstream locations without enrichment still render (marked unenriched).
// They keep their canonical slug so events/journeys can reference them
// before their enrichment file lands.
const canonicalPath = path.join(CURATED, 'canonical-slugs.json')
const canonicalById = new Map()
if (fs.existsSync(canonicalPath)) {
  for (const [slug, info] of Object.entries(readJSON(canonicalPath))) {
    if (info.id !== undefined) canonicalById.set(info.id, slug)
  }
}
const unenriched = []
for (const f of upstream.features) {
  if (matchedUpstreamIds.has(f.properties.id)) continue
  const name = f.properties.name
  if (!name) continue
  const slug =
    canonicalById.get(f.properties.id) ??
    `u${f.properties.id}-${normalizeName(name).replace(/\s+/g, '-')}`
  unenriched.push(`${f.properties.id}\t${name}\t${f.properties.type}\tsize=${f.properties.size}`)
  bySlugCoords.set(slug, f.geometry.coordinates)
  locationFeatures.push({
    type: 'Feature',
    properties: {
      slug,
      name,
      aliases: [],
      type: f.properties.type,
      rank: f.properties.size ?? 1,
      region: null,
      allegiance: null,
      description: null,
      firstAppearance: null,
      showCanon: 'mentioned',
      enriched: 0,
    },
    geometry: { type: 'Point', coordinates: roundCoords(f.geometry.coordinates) },
  })
}
// Canonical "new" locations whose enrichment file hasn't landed yet
if (fs.existsSync(canonicalPath)) {
  for (const [slug, info] of Object.entries(readJSON(canonicalPath))) {
    if (info.id !== undefined || bySlugCoords.has(slug)) continue
    unenriched.push(`new\t${info.name}\t${info.type}\tsize=${info.size}`)
    bySlugCoords.set(slug, info.coords)
    locationFeatures.push({
      type: 'Feature',
      properties: {
        slug,
        name: info.name,
        aliases: [],
        type: info.type,
        rank: info.size ?? 2,
        region: null,
        allegiance: null,
        description: null,
        firstAppearance: null,
        showCanon: 'mentioned',
        enriched: 0,
      },
      geometry: { type: 'Point', coordinates: roundCoords(info.coords) },
    })
  }
}
write('locations.geojson', { type: 'FeatureCollection', features: locationFeatures })
console.log(`  enriched ${enrichments.length}, unenriched upstream ${unenriched.length}`)

// ------------------------------------------------------------------ labels
console.log('labels:')
const overridesRaw = fs.existsSync(path.join(CURATED, 'labels-overrides.json'))
  ? readJSON(path.join(CURATED, 'labels-overrides.json'))
  : {}
const overrides = {}
for (const [key, value] of Object.entries(overridesRaw)) {
  const o = validate(S.LabelOverride, value, `labels-overrides.json["${key}"]`)
  if (o) overrides[key] = { ...o, _used: false }
}

const WATER_KINDS = {
  'The Sunset Sea': 'sea',
  'The Narrow Sea': 'sea',
  'The Shivering Sea': 'sea',
  'Summer Sea': 'sea',
  'The Jade Sea': 'sea',
  'The Smoking Sea': 'sea',
  'Sea of Myrth': 'bay',
  'Sea of Dorne': 'bay',
  'Blazewater Bay': 'bay',
  'Ironman\'s Bay': 'bay',
  'Whispering Sound': 'bay',
  'Shipbreaker Bay': 'bay',
  'Blackwater Bay': 'bay',
  'Bay of Crabs': 'bay',
  'Bay of Seals': 'bay',
  'Bay of Ice': 'bay',
  'The Gulf of Grief': 'bay',
  'The Bite': 'bay',
  'Saltspear': 'bay',
  'Redwyne Straits': 'strait',
  'Straits of Tarth': 'strait',
}

function labelPoint(feature) {
  const { rings, area } = largestRing(feature.geometry)
  const p = polylabel(rings, 0.05)
  return { coords: [p[0], p[1]], area }
}

function applyOverride(kind, name, label) {
  const o = overrides[`${kind}:${name}`]
  if (!o) return label
  o._used = true
  if (o.hide) return null
  return {
    ...label,
    coords: o.coords ?? label.coords,
    name: o.text ?? label.name,
    sizeRank: o.sizeRank ?? label.sizeRank,
  }
}

const sizeRankFor = (kind, area) => {
  const big = { sea: 40, kingdom: 30, continent: 1, region: 12, forest: 8, mountain: 8 }[kind] ?? 10
  return area >= big ? 1 : area >= big / 4 ? 2 : 3
}

const physical = []
const water = []
// Regions duplicate many kingdom/landscape names (Wolfswood, Iron Islands, …);
// first label with a given normalized name wins, so order matters below.
const emittedNames = new Set()

function pushLabel(list, kind, name, feature) {
  if (!name) {
    const o = overrides[`${kind}:#${feature.properties.id ?? ''}`]
    if (!o || !o.text || !o.coords) return
    o._used = true
    list.push({ name: o.text, kind, coords: o.coords, sizeRank: o.sizeRank ?? 2 })
    emittedNames.add(normalizeName(o.text))
    return
  }
  const { coords, area } = labelPoint(feature)
  const label = applyOverride(kind, name, { name, kind, coords, sizeRank: sizeRankFor(kind, area) })
  if (!label) return
  if (emittedNames.has(normalizeName(label.name))) return
  emittedNames.add(normalizeName(label.name))
  list.push(label)
}

for (const f of vendor('got_continents.geojson').features) {
  pushLabel(physical, 'continent', f.properties.name, f)
}
for (const f of vendor('got_political.geojson').features) {
  pushLabel(physical, 'kingdom', f.properties.name, f)
}
const landscapeKind = { forest: 'forest', mountain: 'mountain', swamp: 'swamp', stepp: 'desert' }
for (const f of vendor('got_landscape.geojson').features) {
  pushLabel(physical, landscapeKind[f.properties.type] ?? 'area', f.properties.name, f)
}
for (const f of vendor('got_regions.geojson').features) {
  const name = f.properties.name
  const wkind = WATER_KINDS[name]
  if (wkind) pushLabel(water, wkind, name, f)
  else pushLabel(physical, 'region', name, f)
}

// Hand-authored extra labels (mountain ranges, missing seas, …)
if (fs.existsSync(path.join(CURATED, 'labels-extra.json'))) {
  const extra = readJSON(path.join(CURATED, 'labels-extra.json'))
  extra.features?.forEach((raw, i) => {
    const f = validate(S.ExtraLabel, raw, `labels-extra.json[${i}]`)
    if (!f) return
    const isWater = ['sea', 'bay', 'strait'].includes(f.properties.kind)
    const target = isWater ? water : physical
    if (f.geometry.type === 'LineString') {
      target.push({
        name: f.properties.name,
        kind: f.properties.kind,
        line: f.geometry.coordinates,
        sizeRank: f.properties.sizeRank ?? 1,
      })
    } else {
      target.push({
        name: f.properties.name,
        kind: f.properties.kind,
        coords: f.geometry.coordinates,
        sizeRank: f.properties.sizeRank ?? 2,
      })
    }
  })
}

for (const [key, o] of Object.entries(overrides)) {
  if (!o._used) warn(`labels-overrides.json: key "${key}" matched no generated label`)
}

const toLabelFC = (list) => ({
  type: 'FeatureCollection',
  features: list.map((l) => ({
    type: 'Feature',
    properties: { name: l.name, kind: l.kind, sizeRank: l.sizeRank },
    geometry: l.line
      ? { type: 'LineString', coordinates: roundCoords(l.line) }
      : { type: 'Point', coordinates: roundCoords(l.coords) },
  })),
})
write('labels-physical.geojson', toLabelFC(physical))
write('labels-water.geojson', toLabelFC(water))

// -------------------------------------------------------------- characters
const charactersRaw = fs.existsSync(path.join(CURATED, 'characters.json'))
  ? readJSON(path.join(CURATED, 'characters.json'))
  : []
const characters = []
const charIds = new Set()
charactersRaw.forEach((raw, i) => {
  const c = validate(S.Character, raw, `characters.json[${i}]`)
  if (!c) return
  if (charIds.has(c.id)) fail(`characters.json: duplicate id "${c.id}"`)
  charIds.add(c.id)
  characters.push(c)
})

// ------------------------------------------------------------------ events
console.log('events:')
const events = []
const eventIds = new Set()
for (const { file, data } of curatedDir('events')) {
  if (!Array.isArray(data)) {
    fail(`${file}: expected an array of events`)
    continue
  }
  data.forEach((raw, i) => {
    const e = validate(S.ShowEvent, raw, `${file}[${i}]`)
    if (!e) return
    if (eventIds.has(e.id)) fail(`${file}: duplicate event id "${e.id}"`)
    eventIds.add(e.id)
    const fileSeason = Number(file.match(/s0(\d)/)?.[1])
    if (fileSeason && e.season !== fileSeason) {
      fail(`${file}: event "${e.id}" has season ${e.season}, expected ${fileSeason}`)
    }
    const idEp = e.id.match(/^s(\d{2})e(\d{2})/)
    if (Number(idEp[1]) !== e.season || Number(idEp[2]) !== e.episode) {
      fail(`${file}: event id "${e.id}" does not match season/episode ${e.season}/${e.episode}`)
    }
    let coords = e.coords
    let locationName = null
    if (e.locationId) {
      const c = bySlugCoords.get(e.locationId)
      if (!c) {
        fail(`${file}: event "${e.id}" references unknown locationId "${e.locationId}"`)
        return
      }
      coords = e.coords ?? c
      locationName = locationFeatures.find((f) => f.properties.slug === e.locationId)?.properties.name
    }
    for (const ch of e.characters) {
      if (!charIds.has(ch)) fail(`${file}: event "${e.id}" references unknown character "${ch}"`)
    }
    events.push({
      id: e.id,
      title: e.title,
      description: e.description,
      type: e.type,
      season: e.season,
      episode: e.episode,
      episodeTitle: e.episodeTitle,
      epIndex: epIndexOf(e.season, e.episode),
      locationId: e.locationId ?? null,
      locationName,
      coords: roundCoords(coords),
      characters: e.characters,
      importance: e.importance,
    })
  })
}
events.sort((a, b) => a.epIndex - b.epIndex || a.id.localeCompare(b.id))
write('events.json', events)
console.log(`  ${events.length} events`)

// ---------------------------------------------------------------- journeys
console.log('journeys:')
const journeys = []
for (const { file, data } of curatedDir('journeys')) {
  const j = validate(S.Journey, data, file)
  if (!j) continue
  if (!charIds.has(j.characterId)) fail(`${file}: unknown characterId "${j.characterId}"`)
  const coords = []
  const waypoints = []
  let cumKm = 0
  let lastEp = 0
  let ok = true
  j.waypoints.forEach((w, i) => {
    let c = w.coords ?? (w.locationId ? bySlugCoords.get(w.locationId) : null)
    if (!c) {
      fail(`${file}: waypoint[${i}] references unknown locationId "${w.locationId}"`)
      ok = false
      return
    }
    const ep = epIndexOf(w.season, w.episode)
    if (ep < lastEp) {
      fail(`${file}: waypoint[${i}] epIndex ${ep} decreases (prev ${lastEp})`)
      ok = false
    }
    lastEp = ep
    const enter = i === 0 ? [] : (w.via ?? [])
    for (const v of enter) {
      cumKm += haversineKm(coords[coords.length - 1], v)
      coords.push(v)
    }
    if (coords.length) cumKm += haversineKm(coords[coords.length - 1], c)
    coords.push(c)
    waypoints.push({
      coordIndex: coords.length - 1,
      cumKm: Math.round(cumKm * 10) / 10,
      epIndex: ep,
      name: w.locationId
        ? locationFeatures.find((f) => f.properties.slug === w.locationId)?.properties.name ?? null
        : null,
      note: w.note ?? null,
    })
  })
  if (!ok) continue
  journeys.push({
    characterId: j.characterId,
    name: j.name,
    color: j.color,
    dies: j.dies ? epIndexOf(j.dies.season, j.dies.episode) : null,
    coords: roundCoords(coords),
    waypoints,
    totalKm: Math.round(cumKm),
  })
}
write('journeys.json', journeys)
write('characters.json', characters)
console.log(`  ${journeys.length} journeys, ${characters.length} characters`)

// ---------------------------------------------------------- episode titles
const showEpisodes = vendor('show/episodes.json').episodes
write(
  'episodes.json',
  showEpisodes.map((e) => ({
    season: e.seasonNum,
    episode: e.episodeNum,
    title: e.episodeTitle,
    epIndex: epIndexOf(e.seasonNum, e.episodeNum),
  })),
)

// -------------------------------------------------------------------- meta
write('meta.json', {
  generatedAt: new Date().toISOString(),
  counts: {
    locations: locationFeatures.length,
    enriched: enrichments.length,
    events: events.length,
    journeys: journeys.length,
    characters: characters.length,
  },
})

// ------------------------------------------------------------------ report
const reportPath = path.join(ROOT, 'data', 'unenriched-report.tsv')
if (unenriched.length) {
  fs.writeFileSync(reportPath, 'id\tname\ttype\tsize\n' + unenriched.join('\n'))
  console.log(`\n${unenriched.length} upstream locations lack enrichment → data/unenriched-report.tsv`)
} else if (fs.existsSync(reportPath)) {
  fs.unlinkSync(reportPath)
}
for (const w of warnings) console.warn(`WARN: ${w}`)
if (outBytes > 1.5 * 1024 * 1024) console.warn(`WARN: payload ${(outBytes / 1048576).toFixed(2)} MB exceeds 1.5 MB budget`)
if (errors.length) {
  console.error(`\n${errors.length} error(s):`)
  for (const e of errors) console.error(`  ✗ ${e}`)
  process.exit(1)
}
console.log(`\nOK — total payload ${(outBytes / 1024).toFixed(0)} KB`)
