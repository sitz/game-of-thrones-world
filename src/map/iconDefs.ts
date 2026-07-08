/**
 * Hand-drawn-style SVG icon definitions, rasterized at runtime by icons.ts.
 * All are authored at 2x (px sizes below are the on-map size; SVG is double).
 */
import { eventColors } from './style/palette'

const INK = '#3b2f24'
const HALO = '#f3ead2'

type IconDef = { svg: string; size: number } // size = on-map px

const wrap = (size: number, inner: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size * 2}" height="${size * 2}" viewBox="0 0 ${size * 2} ${size * 2}">${inner}</svg>`

export const icons: Record<string, IconDef> = {
  // ---- location markers ------------------------------------------------
  'city-large': {
    size: 17,
    svg: wrap(
      17,
      `<circle cx="17" cy="17" r="13" fill="${HALO}" stroke="${INK}" stroke-width="2.6"/>
       <circle cx="17" cy="17" r="8" fill="none" stroke="${INK}" stroke-width="1.6"/>
       <path d="M17 5 v-3 M29 17 h3 M17 29 v3 M5 17 h-3 M25.5 8.5 l2.1-2.1 M25.5 25.5 l2.1 2.1 M8.5 25.5 l-2.1 2.1 M8.5 8.5 L6.4 6.4" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>
       <circle cx="17" cy="17" r="3.2" fill="${INK}"/>`,
    ),
  },
  city: {
    size: 13,
    svg: wrap(
      13,
      `<circle cx="13" cy="13" r="9.5" fill="${HALO}" stroke="${INK}" stroke-width="2.4"/>
       <circle cx="13" cy="13" r="3" fill="${INK}"/>`,
    ),
  },
  town: {
    size: 10,
    svg: wrap(
      10,
      `<rect x="4.5" y="4.5" width="11" height="11" fill="${HALO}" stroke="${INK}" stroke-width="2.2"/>
       <circle cx="10" cy="10" r="2" fill="${INK}"/>`,
    ),
  },
  castle: {
    size: 13,
    svg: wrap(
      13,
      `<path d="M7 22 v-9 h2.4 v-3 h2.4 v3 h2.4 v-3 h2.4 v3 h2.4 v-3 h2.4 v3 H19 v9 z"
         transform="translate(0,-4)" fill="${HALO}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
       <rect x="11.4" y="12" width="3.2" height="6" fill="${INK}"/>`,
    ),
  },
  ruin: {
    size: 11,
    svg: wrap(
      11,
      `<path d="M6 18 v-7 l2.2 1 v-4 l2.6 1.4 2.4-2.6 v5 l2.8-1.6 v8 z"
         fill="none" stroke="${INK}" stroke-width="1.9" stroke-linejoin="round" opacity="0.85"/>`,
    ),
  },
  poi: {
    size: 8,
    svg: wrap(
      8,
      `<path d="M8 2.5 L13.5 8 L8 13.5 L2.5 8 Z" fill="${HALO}" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>`,
    ),
  },
}

// ---- event badges: colored disc + parchment glyph ----------------------
const eventGlyphs: Record<string, string> = {
  battle: `<path d="M9 21 L21 9 M11.5 9 H9 v2.5 M21 18.5 V21 h-2.5 M9 9 l12 12 M18.5 9 H21 v2.5 M9 18.5 V21 h2.5" stroke="${HALO}" stroke-width="2" stroke-linecap="round" fill="none"/>`,
  death: `<path d="M15 8 v10 M15 21.5 v0.1 M11.5 11 c0-2 1.5-3.5 3.5-3.5 s3.5 1.5 3.5 3.5" stroke="${HALO}" stroke-width="2.2" stroke-linecap="round" fill="none"/>`,
  wedding: `<circle cx="12.4" cy="15" r="4.4" fill="none" stroke="${HALO}" stroke-width="2"/><circle cx="17.6" cy="15" r="4.4" fill="none" stroke="${HALO}" stroke-width="2"/>`,
  political: `<path d="M8.5 19 v-8 l3.3 3 3.2-4.5 3.2 4.5 3.3-3 v8 z" fill="${HALO}"/>`,
  sack: `<path d="M9 21 L21 9 M9 9 l12 12" stroke="${HALO}" stroke-width="2.4" stroke-linecap="round"/><circle cx="15" cy="15" r="1.8" fill="${HALO}"/>`,
  destruction: `<path d="M15 7 c1 3-2.4 4-1.6 7 .6 2 2.6 2 2.6 4.4 0 1.6-1.2 2.6-2.6 2.6 -3 0-5-2.2-5-5 0-4.4 4.4-5.6 6.6-9z M17.6 12 c2 1.6 3 3.4 3 5.6 0 1.8-.8 3-2 3.6" fill="none" stroke="${HALO}" stroke-width="1.9" stroke-linejoin="round" stroke-linecap="round"/>`,
  birth: `<circle cx="15" cy="15" r="5.5" fill="none" stroke="${HALO}" stroke-width="2"/><circle cx="15" cy="15" r="1.8" fill="${HALO}"/>`,
  coronation: `<path d="M8.5 19 v-8 l3.3 3 3.2-4.5 3.2 4.5 3.3-3 v8 z" fill="${HALO}"/>`,
  escape: `<path d="M9 15 h10 M15 9.5 L20.5 15 L15 20.5" stroke="${HALO}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  supernatural: `<path d="M15 7.5 l1.9 5 5.1.3 -4 3.2 1.4 5 -4.4-2.9 -4.4 2.9 1.4-5 -4-3.2 5.1-.3 z" fill="${HALO}"/>`,
  journey: `<path d="M8 20 c3-6 8-2 11-8 M19 9 l1.6 3.4 -3.6.4" stroke="${HALO}" stroke-width="2" stroke-linecap="round" fill="none"/>`,
  other: `<circle cx="15" cy="15" r="2.6" fill="${HALO}"/>`,
}

for (const [type, glyph] of Object.entries(eventGlyphs)) {
  icons[`ev-${type}`] = {
    size: 15,
    svg: wrap(
      15,
      `<circle cx="15" cy="15" r="11.5" fill="${eventColors[type]}" stroke="${HALO}" stroke-width="2"/>${glyph}`,
    ),
  }
}

// ---- terrain fill patterns (tiling) ------------------------------------
const pat = (size: number, inner: string) => ({ size, svg: wrap(size, inner) })

export const patterns: Record<string, IconDef> = {
  'pattern-forest': pat(
    26,
    `<g fill="none" stroke="#6d7a52" stroke-width="1.7" opacity="0.55" stroke-linejoin="round">
       <path d="M10 16 l4-7 4 7 z M14 16 v3"/>
       <path d="M32 38 l4-7 4 7 z M36 38 v3"/>
       <path d="M38 10 l3.4-6 3.4 6 z M41.4 10 v2.6"/>
       <path d="M12 40 l3-5.4 3 5.4 z M15 40 v2.4"/>
     </g>`,
  ),
  'pattern-mountain': pat(
    26,
    `<g fill="none" stroke="#82684a" stroke-width="1.8" opacity="0.6" stroke-linejoin="round" stroke-linecap="round">
       <path d="M6 20 l6.5-10 6.5 10 M9.5 15 l3-2 2.6 2"/>
       <path d="M28 44 l6-9 6 9 M31 40 l3-2 2.6 2"/>
       <path d="M34 16 l5-7.4 5 7.4"/>
     </g>`,
  ),
  'pattern-swamp': pat(
    26,
    `<g stroke="#5e6b52" stroke-width="1.6" opacity="0.5" stroke-linecap="round">
       <path d="M8 14 h9 M11 18 h6"/>
       <path d="M30 36 h9 M33 40 h6"/>
       <path d="M34 12 h7"/>
       <path d="M10 40 h7"/>
     </g>`,
  ),
  'pattern-desert': pat(
    26,
    `<g fill="#8a6f3f" opacity="0.4">
       <circle cx="10" cy="12" r="1.5"/><circle cx="30" cy="24" r="1.5"/>
       <circle cx="44" cy="8" r="1.5"/><circle cx="18" cy="38" r="1.5"/>
       <circle cx="40" cy="44" r="1.5"/>
     </g>`,
  ),
}

/** Journey head + death markers, tinted per character at runtime. */
export function journeyHeadSvg(color: string): IconDef {
  return {
    size: 12,
    svg: wrap(
      12,
      `<circle cx="12" cy="12" r="8" fill="${color}" stroke="${HALO}" stroke-width="3"/>
       <circle cx="12" cy="12" r="2.6" fill="${HALO}"/>`,
    ),
  }
}

export function journeyEndSvg(color: string): IconDef {
  return {
    size: 12,
    svg: wrap(
      12,
      `<circle cx="12" cy="12" r="8.5" fill="#43363b" stroke="${color}" stroke-width="2.4"/>
       <path d="M8.5 8.5 l7 7 M15.5 8.5 l-7 7" stroke="${HALO}" stroke-width="2.2" stroke-linecap="round"/>`,
    ),
  }
}
