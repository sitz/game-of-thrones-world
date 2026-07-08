import { useMemo } from 'react'
import { useAppStore } from '../store/useAppStore'
import { seasonEpisodeOf, epIndexOf, TOTAL_EPISODES, SEASON_LENGTHS } from '../data/episodes'
import styles from './TimelineBar.module.css'

const SPEEDS = [0.35, 0.7, 1.4]
const SPEED_LABELS: Record<number, string> = { 0.35: '½×', 0.7: '1×', 1.4: '2×' }

export default function TimelineBar() {
  const enabled = useAppStore((s) => s.timelineEnabled)
  const setEnabled = useAppStore((s) => s.setTimelineEnabled)
  const t = useAppStore((s) => s.t)
  const setT = useAppStore((s) => s.setT)
  const playing = useAppStore((s) => s.playing)
  const setPlaying = useAppStore((s) => s.setPlaying)
  const speed = useAppStore((s) => s.speed)
  const setSpeed = useAppStore((s) => s.setSpeed)
  const data = useAppStore((s) => s.data)

  const ep = Math.floor(t)
  const { season, episode } = seasonEpisodeOf(ep)
  const episodeTitle = useMemo(
    () => data?.episodes.find((e) => e.epIndex === ep)?.title ?? '',
    [data, ep],
  )

  if (!enabled) {
    return (
      <button className={styles.pill} onClick={() => setEnabled(true)} data-testid="timeline-pill">
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
          <circle cx="6.5" cy="6.5" r="5.4" stroke="currentColor" strokeWidth="1.4" />
          <path d="M6.5 3.6 V6.7 L8.8 8.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" fill="none" />
        </svg>
        Timeline
      </button>
    )
  }

  return (
    <div className={styles.bar} data-testid="timeline-bar">
      <div className={styles.topRow}>
        <button
          className={styles.play}
          onClick={() => setPlaying(!playing)}
          aria-label={playing ? 'Pause' : 'Play'}
          data-testid="timeline-play"
        >
          {playing ? (
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
              <rect x="2" y="1.5" width="3" height="9" fill="currentColor" />
              <rect x="7" y="1.5" width="3" height="9" fill="currentColor" />
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
              <path d="M3 1.5 L10.5 6 L3 10.5 Z" fill="currentColor" />
            </svg>
          )}
        </button>
        <div className={styles.readout} data-testid="timeline-readout">
          <span className={styles.readoutEp}>
            S{season} · E{episode}
          </span>
          {episodeTitle && <span className={styles.readoutTitle}>“{episodeTitle}”</span>}
        </div>
        <button
          className={styles.speed}
          onClick={() => setSpeed(SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length])}
          aria-label="Playback speed"
        >
          {SPEED_LABELS[speed] ?? '1×'}
        </button>
        <button className={styles.close} onClick={() => setEnabled(false)} aria-label="Close timeline">
          ×
        </button>
      </div>
      <input
        className={styles.slider}
        type="range"
        min={1}
        max={TOTAL_EPISODES}
        step={1}
        value={ep}
        onChange={(e) => {
          setPlaying(false)
          setT(Number(e.target.value))
        }}
        style={{ ['--progress' as string]: `${((ep - 1) / (TOTAL_EPISODES - 1)) * 100}%` }}
        aria-label="Episode"
        data-testid="timeline-slider"
      />
      <div className={styles.seasons}>
        {SEASON_LENGTHS.map((_, i) => (
          <button
            key={i}
            className={[
              styles.season,
              i === 6 ? styles.s7 : '',
              i === 7 ? styles.s8 : '',
              season === i + 1 ? styles.seasonActive : '',
            ].join(' ')}
            onClick={() => {
              setPlaying(false)
              setT(epIndexOf(i + 1, 1))
            }}
          >
            S{i + 1}
          </button>
        ))}
      </div>
    </div>
  )
}
