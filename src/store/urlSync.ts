/**
 * Serializes app state (timeline, layers, journeys, selection) into the URL
 * hash alongside MapLibre's own `map=z/lat/lng` param, so any view is
 * shareable. Example:
 *   #map=6.2/8.4/17.2&t=s04e02&j=jon,arya&sel=loc:winterfell
 */
import { useAppStore, DEFAULT_LAYERS, type LayerToggles } from './useAppStore'
import { parseEpCode, toEpCode } from '../data/episodes'
import { whenMapReady } from '../map/registry'
import { flyToSelection } from '../map/interactions'

const LAYER_CODES: [keyof LayerToggles, string][] = [
  ['political', 'pol'],
  ['terrain', 'ter'],
  ['roads', 'rd'],
  ['events', 'ev'],
  ['labels', 'lb'],
]

function readHashParams(): Map<string, string> {
  const out = new Map<string, string>()
  for (const part of window.location.hash.replace(/^#/, '').split('&')) {
    const eq = part.indexOf('=')
    if (eq > 0) out.set(part.slice(0, eq), decodeURIComponent(part.slice(eq + 1)))
  }
  return out
}

function writeHashParams(update: Record<string, string | null>) {
  const params = readHashParams()
  for (const [k, v] of Object.entries(update)) {
    if (v === null) params.delete(k)
    else params.set(k, v)
  }
  // Keep / : , readable (MapLibre's own map= param uses slashes)
  const enc = (v: string) =>
    encodeURIComponent(v).replace(/%2F/gi, '/').replace(/%3A/gi, ':').replace(/%2C/gi, ',')
  const hash = [...params.entries()].map(([k, v]) => `${k}=${enc(v)}`).join('&')
  history.replaceState(null, '', `${window.location.pathname}${window.location.search}#${hash}`)
}

/** Parse URL params into the store once at boot (after data is loaded). */
export function applyUrlToStore() {
  const params = readHashParams()
  const store = useAppStore.getState()

  const t = params.get('t')
  if (t) {
    const epIndex = parseEpCode(t)
    if (epIndex !== null) {
      store.setTimelineEnabled(true)
      store.setT(epIndex)
    }
  }

  const layers = params.get('layers')
  if (layers !== null && layers !== undefined) {
    const enabled = new Set(layers.split(',').filter(Boolean))
    for (const [key, code] of LAYER_CODES) {
      const want = enabled.has(code)
      if (useAppStore.getState().layers[key] !== want) store.toggleLayer(key)
    }
  }

  const j = params.get('j')
  if (j) {
    const data = store.data
    for (const id of j.split(',').filter(Boolean)) {
      if (data?.journeys.some((jj) => jj.characterId === id)) store.toggleJourney(id)
    }
  }

  const sel = params.get('sel')
  if (sel) {
    const [kind, ...rest] = sel.split(':')
    const id = rest.join(':')
    const data = store.data
    if (kind === 'loc' && data?.locations.features.some((f) => f.properties.slug === id)) {
      store.select({ kind: 'location', id })
      whenMapReady((map) => flyToSelection(map, { kind: 'location', id }))
    } else if (kind === 'ev' && data?.events.some((e) => e.id === id)) {
      store.select({ kind: 'event', id })
      whenMapReady((map) => flyToSelection(map, { kind: 'event', id }))
    }
  }
}

/** Subscribe to store changes and mirror them into the hash (debounced). */
export function wireUrlSync() {
  let timer: number | undefined
  useAppStore.subscribe((state, prev) => {
    if (
      state.timelineEnabled === prev.timelineEnabled &&
      state.t === prev.t &&
      state.layers === prev.layers &&
      state.activeJourneys === prev.activeJourneys &&
      state.selected === prev.selected
    ) {
      return
    }
    window.clearTimeout(timer)
    timer = window.setTimeout(() => {
      const s = useAppStore.getState()
      const layersDefault = (Object.keys(DEFAULT_LAYERS) as (keyof LayerToggles)[]).every(
        (k) => s.layers[k] === DEFAULT_LAYERS[k],
      )
      writeHashParams({
        t: s.timelineEnabled ? toEpCode(Math.round(s.t)) : null,
        layers: layersDefault
          ? null
          : LAYER_CODES.filter(([k]) => s.layers[k])
              .map(([, code]) => code)
              .join(','),
        j: s.activeJourneys.length ? s.activeJourneys.join(',') : null,
        sel: s.selected ? `${s.selected.kind === 'location' ? 'loc' : 'ev'}:${s.selected.id}` : null,
      })
    }, 300)
  })
}
