/** Cartographic palette — parchment & ink. Keep in sync with styles/tokens.css. */
export const palette = {
  water: '#3d626b',
  waterLine: '#2e4c53',
  waterLabel: '#cfe0da',
  waterLabelHalo: 'rgba(40, 68, 75, 0.75)',

  parchment: '#eadfc0',
  ink: '#3b2f24',
  inkSoft: '#5a4a38',
  inkFaint: '#8a7a62',
  halo: '#f3ead2',

  coastGlow: '#24444c',
  coastline: '#4a3d2e',

  river: '#41707c',
  lakeOutline: '#35565e',
  road: '#97754c',
  roadLabel: '#7c5f3e',

  wallGlow: '#b9d8e2',
  wallCore: '#f0f8fb',
  wallLabel: '#4a7180',

  forest: '#adb58c',
  forestLabel: '#5c6b45',
  mountain: '#b49e7d',
  mountainLabel: '#75603f',
  swamp: '#9aa68c',
  swampLabel: '#5e6b52',
  desert: '#dcc697',
  desertLabel: '#8a6f3f',

  kingdomLabel: '#6b5537',
  continentLabel: 'rgba(59, 47, 36, 0.82)',
  regionLabel: '#7a6a52',
  ruinLabel: '#7d6a55',

  selection: '#8c2f39',
} as const

/** Muted heraldic tints for the political fill, keyed by polygon name. */
export const kingdomTints: Record<string, string> = {
  'The North': '#b7c2c4',
  Riverlands: '#a9b8a1',
  'The Vale': '#b7c3d9',
  'The Iron Islands': '#a8a19b',
  'The Westerlands': '#d1a08a',
  'The Reach': '#b5c398',
  Stormlands: '#c9b784',
  Dorne: '#d6b088',
  Crownsland: '#c39aa0',
  'New Gift': '#c5cdc9',
  "Bran's Gift": '#c5cdc9',
}
export const wildlingsTint = '#ccd8da'

export const eventColors: Record<string, string> = {
  battle: '#8c2f39',
  death: '#43363b',
  wedding: '#a5762c',
  political: '#5b5320',
  sack: '#8c2f39',
  destruction: '#b4501e',
  birth: '#a5762c',
  coronation: '#5b5320',
  escape: '#3f5e73',
  supernatural: '#3f5e73',
  journey: '#3f5e73',
  other: '#6d5f4c',
}

export const FONT = {
  display: 'Cinzel Regular',
  displayBold: 'Cinzel Bold',
  fell: 'IM Fell English Regular',
  fellItalic: 'IM Fell English Italic',
} as const
