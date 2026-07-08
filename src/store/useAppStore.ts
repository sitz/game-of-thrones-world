import { create } from 'zustand'
import type { WorldData } from '../data/types'
import { TOTAL_EPISODES } from '../data/episodes'

export type Selection = { kind: 'location' | 'event'; id: string } | null

export interface LayerToggles {
  political: boolean
  terrain: boolean
  roads: boolean
  events: boolean
  labels: boolean
}

interface AppState {
  data: WorldData | null
  selected: Selection
  aboutOpen: boolean
  layers: LayerToggles
  timelineEnabled: boolean
  t: number // fractional epIndex 1..73 while playing
  playing: boolean
  speed: number // episodes per second
  activeJourneys: string[]

  setData: (data: WorldData) => void
  select: (sel: Selection) => void
  setAboutOpen: (open: boolean) => void
  toggleLayer: (key: keyof LayerToggles) => void
  setTimelineEnabled: (enabled: boolean) => void
  setT: (t: number) => void
  setPlaying: (playing: boolean) => void
  setSpeed: (speed: number) => void
  toggleJourney: (characterId: string) => void
  clearJourneys: () => void
}

export const DEFAULT_LAYERS: LayerToggles = {
  political: true,
  terrain: true,
  roads: true,
  events: true,
  labels: true,
}

export const useAppStore = create<AppState>((set) => ({
  data: null,
  selected: null,
  aboutOpen: false,
  layers: { ...DEFAULT_LAYERS },
  timelineEnabled: false,
  t: TOTAL_EPISODES,
  playing: false,
  speed: 0.7,
  activeJourneys: [],

  setData: (data) => set({ data }),
  select: (selected) => set({ selected }),
  setAboutOpen: (aboutOpen) => set({ aboutOpen }),
  toggleLayer: (key) =>
    set((s) => ({ layers: { ...s.layers, [key]: !s.layers[key] } })),
  setTimelineEnabled: (timelineEnabled) =>
    set((s) => ({
      timelineEnabled,
      playing: timelineEnabled && s.playing,
      t: timelineEnabled ? (s.t === TOTAL_EPISODES ? 1 : s.t) : TOTAL_EPISODES,
    })),
  setT: (t) => set({ t: Math.min(Math.max(t, 1), TOTAL_EPISODES) }),
  setPlaying: (playing) => set({ playing }),
  setSpeed: (speed) => set({ speed }),
  toggleJourney: (characterId) =>
    set((s) => ({
      activeJourneys: s.activeJourneys.includes(characterId)
        ? s.activeJourneys.filter((id) => id !== characterId)
        : [...s.activeJourneys, characterId],
    })),
  clearJourneys: () => set({ activeJourneys: [] }),
}))

// Dev/verification handle (mirrors window.__map in MapView)
if (import.meta.env.DEV) {
  ;(window as unknown as { __store?: typeof useAppStore }).__store = useAppStore
}
