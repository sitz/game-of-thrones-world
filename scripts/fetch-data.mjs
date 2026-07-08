/**
 * Vendors all upstream data at pinned revisions into data/vendor/.
 * Network access happens ONLY here; every other script works offline.
 * Run: npm run data:fetch
 */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const VENDOR = path.join(ROOT, 'data', 'vendor')

// Pinned revisions (git ls-remote HEAD, 2026-07-08)
const GEO_REPO = 'mapbox/GOT-Inspired-Map'
const GEO_SHA = '4f88f8e2ed57b12784ac3246fb419f6c1ac4db1d'
const SHOW_REPO = 'jeffreylancaster/game-of-thrones'
const SHOW_SHA = 'c142bfc9fb15d3aff5fcaf680c501bc38aeb3b61'

const GEO_LICENSE =
  'CC BY-NC-SA 3.0 — map data by cadaei, theMountainGoat and Tear, based on works by George R. R. Martin'
const SHOW_LICENSE = 'Free to use with attribution — Jeffrey Lancaster'
const FONT_LICENSE = 'SIL Open Font License 1.1'

const FILES = [
  // Base geometry. NOTE: upstream political file is misspelled "got_politcal".
  ...[
    ['got_continents.geojson', 'got_continents.geojson'],
    ['got_islands.geojson', 'got_islands.geojson'],
    ['got_lakes.geojson', 'got_lakes.geojson'],
    ['got_landscape.geojson', 'got_landscape.geojson'],
    ['got_locations.geojson', 'got_locations.geojson'],
    ['got_officialMapAreas.geojson', 'got_officialMapAreas.geojson'],
    ['got_politcal.geojson', 'got_political.geojson'],
    ['got_regions.geojson', 'got_regions.geojson'],
    ['got_rivers.geojson', 'got_rivers.geojson'],
    ['got_roads.geojson', 'got_roads.geojson'],
    ['got_wall.geojson', 'got_wall.geojson'],
  ].map(([remote, local]) => ({
    url: `https://raw.githubusercontent.com/${GEO_REPO}/${GEO_SHA}/GoTRelease/${remote}`,
    dest: local,
    license: GEO_LICENSE,
  })),
  // Show datasets (scene-by-scene backbone for events/journeys curation)
  ...['episodes.json', 'characters.json', 'locations.json'].map((f) => ({
    url: `https://raw.githubusercontent.com/${SHOW_REPO}/${SHOW_SHA}/data/${f}`,
    dest: `show/${f}`,
    license: SHOW_LICENSE,
  })),
  // Fonts (OFL). Cinzel static instances via the Google Fonts CSS API;
  // IM Fell English static TTFs from the google/fonts repo.
  {
    url: 'https://fonts.gstatic.com/s/cinzel/v26/8vIU7ww63mVu7gtR-kwKxNvkNOjw-tbnfY3lCA.ttf',
    dest: 'fonts/cinzel-regular.ttf',
    license: FONT_LICENSE,
  },
  {
    url: 'https://fonts.gstatic.com/s/cinzel/v26/8vIU7ww63mVu7gtR-kwKxNvkNOjw-jHgfY3lCA.ttf',
    dest: 'fonts/cinzel-bold.ttf',
    license: FONT_LICENSE,
  },
  {
    url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/imfellenglish/IMFeENrm28P.ttf',
    dest: 'fonts/imfell-regular.ttf',
    license: FONT_LICENSE,
  },
  {
    url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/imfellenglish/IMFeENit28P.ttf',
    dest: 'fonts/imfell-italic.ttf',
    license: FONT_LICENSE,
  },
]

const manifest = {
  fetchedAt: new Date().toISOString(),
  sources: {
    geometry: { repo: GEO_REPO, sha: GEO_SHA, license: GEO_LICENSE },
    show: { repo: SHOW_REPO, sha: SHOW_SHA, license: SHOW_LICENSE },
  },
  files: [],
}

for (const { url, dest, license } of FILES) {
  const outPath = path.join(VENDOR, dest)
  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  process.stdout.write(`fetch ${dest} ... `)
  const res = await fetch(url)
  if (!res.ok) {
    console.error(`FAILED ${res.status} ${url}`)
    process.exit(1)
  }
  const buf = Buffer.from(await res.arrayBuffer())
  // Guard against HTML error pages saved as data
  if (buf.subarray(0, 20).toString().trimStart().startsWith('<')) {
    console.error(`FAILED: got HTML instead of data from ${url}`)
    process.exit(1)
  }
  fs.writeFileSync(outPath, buf)
  const sha256 = crypto.createHash('sha256').update(buf).digest('hex')
  manifest.files.push({ path: dest, url, bytes: buf.length, sha256, license })
  console.log(`${(buf.length / 1024).toFixed(1)} KB`)
}

fs.writeFileSync(path.join(VENDOR, 'MANIFEST.json'), JSON.stringify(manifest, null, 2))
console.log(`\nVendored ${manifest.files.length} files into data/vendor/`)
