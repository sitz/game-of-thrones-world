/**
 * Validates ONE hand-authored curated file without touching public/data —
 * safe to run concurrently from many authoring agents.
 *   node scripts/validate-file.mjs data/curated/events/s03.json
 * Checks schema, canonical slug references, character ids, episode titles
 * (against the vendored scene data), and world-bounds coordinates.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as S from './lib/schemas.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const target = process.argv[2]
if (!target) {
  console.error('usage: node scripts/validate-file.mjs <path-to-curated-file>')
  process.exit(2)
}
const abs = path.resolve(ROOT, target)
const rel = path.relative(ROOT, abs).replace(/\\/g, '/')

const errors = []
const read = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'))

let raw
try {
  raw = JSON.parse(fs.readFileSync(abs, 'utf8'))
} catch (e) {
  console.error(`✗ ${rel}: invalid JSON — ${e.message}`)
  process.exit(1)
}

const canonical = read('data/curated/canonical-slugs.json')
const characters = new Set(read('data/curated/characters.json').map((c) => c.id))
const inBounds = ([lon, lat]) => lon >= -14 && lon <= 100 && lat >= -44 && lat <= 46

function checkSchema(schema, value, ctx) {
  const res = schema.safeParse(value)
  if (!res.success) {
    for (const i of res.error.issues) errors.push(`${ctx}: ${i.path.join('.')} — ${i.message}`)
    return null
  }
  return res.data
}

if (rel.startsWith('data/curated/locations/')) {
  if (!Array.isArray(raw)) errors.push('expected a JSON array')
  const seen = new Set()
  for (const [i, entry] of (Array.isArray(raw) ? raw : []).entries()) {
    const e = checkSchema(S.LocationEnrichment, entry, `[${i}]`)
    if (!e) continue
    if (seen.has(e.slug)) errors.push(`[${i}] duplicate slug "${e.slug}" in file`)
    seen.add(e.slug)
    const c = canonical[e.slug]
    if (!c) errors.push(`[${i}] slug "${e.slug}" is not in canonical-slugs.json`)
    else {
      if (c.id !== undefined && e.id !== c.id) {
        errors.push(`[${i}] "${e.slug}" should have id ${c.id} (has ${e.id})`)
      }
      if (c.isNew && !e.coords) errors.push(`[${i}] new location "${e.slug}" needs coords`)
    }
    if (e.coords && !inBounds(e.coords)) errors.push(`[${i}] "${e.slug}" coords out of bounds`)
  }
} else if (rel.startsWith('data/curated/events/')) {
  if (!Array.isArray(raw)) errors.push('expected a JSON array')
  const episodes = read('data/vendor/show/episodes.json').episodes
  const season = Number(rel.match(/s0(\d)\.json$/)?.[1])
  const seen = new Set()
  for (const [i, entry] of (Array.isArray(raw) ? raw : []).entries()) {
    const e = checkSchema(S.ShowEvent, entry, `[${i}]`)
    if (!e) continue
    if (seen.has(e.id)) errors.push(`[${i}] duplicate event id "${e.id}"`)
    seen.add(e.id)
    if (season && e.season !== season) errors.push(`[${i}] ${e.id}: season ${e.season} ≠ file season ${season}`)
    const ep = episodes.find((x) => x.seasonNum === e.season && x.episodeNum === e.episode)
    if (!ep) errors.push(`[${i}] ${e.id}: S${e.season}E${e.episode} does not exist`)
    else if (ep.episodeTitle !== e.episodeTitle) {
      errors.push(`[${i}] ${e.id}: episodeTitle "${e.episodeTitle}" ≠ actual "${ep.episodeTitle}"`)
    }
    if (e.locationId && !canonical[e.locationId]) {
      errors.push(`[${i}] ${e.id}: unknown locationId "${e.locationId}" (must be a canonical slug)`)
    }
    if (e.coords && !inBounds(e.coords)) errors.push(`[${i}] ${e.id}: coords out of bounds`)
    for (const ch of e.characters) {
      if (!characters.has(ch)) errors.push(`[${i}] ${e.id}: unknown character "${ch}"`)
    }
  }
  const imp1 = (Array.isArray(raw) ? raw : []).filter((e) => e.importance === 1).length
  if (imp1 > 9) errors.push(`too many importance-1 events (${imp1}); keep ≤ 9 per season`)
} else if (rel.startsWith('data/curated/journeys/')) {
  const j = checkSchema(S.Journey, raw, 'journey')
  if (j) {
    if (!characters.has(j.characterId)) errors.push(`unknown characterId "${j.characterId}"`)
    let lastEp = 0
    j.waypoints.forEach((w, i) => {
      if (w.locationId && !canonical[w.locationId]) {
        errors.push(`waypoint[${i}]: unknown locationId "${w.locationId}"`)
      }
      if (w.coords && !inBounds(w.coords)) errors.push(`waypoint[${i}]: coords out of bounds`)
      for (const v of w.via ?? []) {
        if (!inBounds(v)) errors.push(`waypoint[${i}]: via point out of bounds`)
      }
      const ep = [0, 10, 20, 30, 40, 50, 60, 67][w.season - 1] + w.episode
      if (ep < lastEp) errors.push(`waypoint[${i}]: episode order decreases`)
      lastEp = ep
    })
  }
} else {
  console.error(`✗ don't know how to validate ${rel}`)
  process.exit(2)
}

if (errors.length) {
  console.error(`✗ ${rel}: ${errors.length} problem(s)`)
  for (const e of errors) console.error(`  - ${e}`)
  process.exit(1)
}
console.log(`✓ ${rel} valid (${Array.isArray(raw) ? raw.length + ' entries' : 'ok'})`)
