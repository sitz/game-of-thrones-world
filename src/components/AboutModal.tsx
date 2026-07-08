import { useAppStore } from '../store/useAppStore'
import styles from './AboutModal.module.css'

export default function AboutModal() {
  const open = useAppStore((s) => s.aboutOpen)
  const setOpen = useAppStore((s) => s.setAboutOpen)
  const data = useAppStore((s) => s.data)

  if (!open) return null

  return (
    <div className={styles.backdrop} onClick={() => setOpen(false)}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()} role="dialog" aria-label="About this map">
        <button className={styles.close} onClick={() => setOpen(false)} aria-label="Close">
          ×
        </button>
        <h2 className={styles.title}>KNOWN WORLD</h2>
        <div className={styles.tagline}>An interactive map of the Game of Thrones television series</div>
        <p>
          Every kingdom, castle, city, sea and wood of the known world — with the show's key
          events pinned in place and the great journeys of its characters traced across the map.
          Search anything, scrub the timeline from Winterfell to the ashes of King's Landing, and
          follow who went where.
        </p>
        {data && (
          <div className={styles.stats}>
            <div className={styles.stat}>
              <div className={styles.statNum}>{data.meta.counts.locations}</div>
              <div className={styles.statLabel}>locations</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statNum}>{data.meta.counts.events}</div>
              <div className={styles.statLabel}>events</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statNum}>{data.meta.counts.journeys}</div>
              <div className={styles.statLabel}>journeys</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statNum}>8</div>
              <div className={styles.statLabel}>seasons</div>
            </div>
          </div>
        )}
        <div className={styles.fine}>
          A non-commercial fan project. Base map geometry by{' '}
          <a href="https://quartermaester.info" target="_blank" rel="noopener noreferrer">
            cadaei, theMountainGoat &amp; Tear
          </a>{' '}
          (CC BY-NC-SA 3.0), based on the works of George R. R. Martin. Episode scene data by{' '}
          <a href="https://github.com/jeffreylancaster/game-of-thrones" target="_blank" rel="noopener noreferrer">
            Jeffrey Lancaster
          </a>
          . Rendered with{' '}
          <a href="https://maplibre.org" target="_blank" rel="noopener noreferrer">
            MapLibre GL JS
          </a>
          . Typeset in Cinzel and IM Fell English (SIL OFL). Game of Thrones is © HBO; this
          project is unaffiliated.
        </div>
      </div>
    </div>
  )
}
