/**
 * Generates MapLibre SDF glyph PBFs from the vendored TTFs.
 * Output: public/glyphs/<fontstack>/<start>-<end>.pbf
 * Also copies the TTFs to public/fonts/ for UI @font-face use.
 * Run once after data:fetch: node scripts/build-glyphs.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fontnik from 'fontnik'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const FONT_DIR = path.join(ROOT, 'data', 'vendor', 'fonts')
const GLYPH_DIR = path.join(ROOT, 'public', 'glyphs')
const PUBLIC_FONTS = path.join(ROOT, 'public', 'fonts')

const STACKS = {
  'Cinzel Regular': 'cinzel-regular.ttf',
  'Cinzel Bold': 'cinzel-bold.ttf',
  'IM Fell English Regular': 'imfell-regular.ttf',
  'IM Fell English Italic': 'imfell-italic.ttf',
}

// Latin + Latin-1/Extended + general punctuation (curly quotes, dashes)
const RANGES = [
  [0, 255],
  [256, 511],
  [512, 767],
  [768, 1023],
  [8192, 8447],
]

const range = (opts) =>
  new Promise((resolve, reject) =>
    fontnik.range(opts, (err, res) => (err ? reject(err) : resolve(res))),
  )

fs.mkdirSync(PUBLIC_FONTS, { recursive: true })
for (const [stack, file] of Object.entries(STACKS)) {
  const font = fs.readFileSync(path.join(FONT_DIR, file))
  fs.copyFileSync(path.join(FONT_DIR, file), path.join(PUBLIC_FONTS, file))
  const dir = path.join(GLYPH_DIR, stack)
  fs.mkdirSync(dir, { recursive: true })
  for (const [start, end] of RANGES) {
    const pbf = await range({ font, start, end })
    fs.writeFileSync(path.join(dir, `${start}-${end}.pbf`), pbf)
  }
  console.log(`glyphs: ${stack} (${RANGES.length} ranges)`)
}
console.log('Done.')
