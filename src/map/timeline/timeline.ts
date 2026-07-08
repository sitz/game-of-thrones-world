/**
 * Timeline engine: keeps the event layers filtered/faded to the store's `t`,
 * pulses current-episode pins, and advances `t` during playback.
 * All map writes happen here, outside React.
 */
import type { Map as MLMap, ExpressionSpecification } from 'maplibre-gl'
import { useAppStore } from '../../store/useAppStore'
import { EVENT_LAYER_IDS } from '../style/layers/story'
import { TOTAL_EPISODES } from '../../data/episodes'

function applyEventFilters(map: MLMap, enabled: boolean, t: number) {
  const ep = Math.floor(t)
  for (const [i, id] of EVENT_LAYER_IDS.entries()) {
    if (!map.getLayer(id)) continue
    const importance = i + 1
    const base: ExpressionSpecification = ['==', ['get', 'importance'], importance]
    map.setFilter(id, enabled ? ['all', base, ['<=', ['get', 'epIndex'], ep]] : base)

    // Recency fade: history stays visible but dimmed; "now" pops.
    const fade: ExpressionSpecification = [
      'interpolate',
      ['linear'],
      ['get', 'epIndex'],
      ep - 20,
      0.35,
      ep - 6,
      0.7,
      ep,
      1,
    ]
    map.setPaintProperty(id, 'icon-opacity', enabled ? fade : 1)
    map.setPaintProperty(id, 'text-opacity', enabled ? fade : 1)
  }
  if (map.getLayer('events-pulse')) {
    map.setFilter('events-pulse', ['==', ['get', 'epIndex'], enabled ? ep : -1])
  }
}

export function wireTimeline(map: MLMap) {
  applyEventFilters(map, useAppStore.getState().timelineEnabled, useAppStore.getState().t)

  useAppStore.subscribe((state, prev) => {
    if (state.timelineEnabled === prev.timelineEnabled && Math.floor(state.t) === Math.floor(prev.t)) {
      return
    }
    applyEventFilters(map, state.timelineEnabled, state.t)
  })

  // Pulse ring on current-episode events (runs only in timeline mode)
  let pulseFrame = 0
  const pulse = (now: number) => {
    pulseFrame = requestAnimationFrame(pulse)
    if (!useAppStore.getState().timelineEnabled || !map.getLayer('events-pulse')) return
    const phase = (now % 1600) / 1600
    const radius = 12 + phase * 14
    const opacity = 0.85 * (1 - phase)
    map.setPaintProperty('events-pulse', 'circle-radius', radius)
    map.setPaintProperty('events-pulse', 'circle-stroke-opacity', opacity)
  }
  pulseFrame = requestAnimationFrame(pulse)

  // Playback: advance fractional t so journey heads glide between episodes
  let playFrame = 0
  let lastTick: number | null = null
  const tick = (now: number) => {
    playFrame = requestAnimationFrame(tick)
    const s = useAppStore.getState()
    if (!s.timelineEnabled || !s.playing) {
      lastTick = null
      return
    }
    if (lastTick === null) {
      lastTick = now
      return
    }
    const dt = (now - lastTick) / 1000
    lastTick = now
    const next = s.t + dt * s.speed
    if (next >= TOTAL_EPISODES) {
      s.setT(TOTAL_EPISODES)
      s.setPlaying(false)
    } else {
      s.setT(next)
    }
  }
  playFrame = requestAnimationFrame(tick)

  map.once('remove', () => {
    cancelAnimationFrame(pulseFrame)
    cancelAnimationFrame(playFrame)
  })
}
