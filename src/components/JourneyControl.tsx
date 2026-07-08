import { useEffect, useRef, useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import styles from './JourneyControl.module.css'

export default function JourneyControl() {
  const data = useAppStore((s) => s.data)
  const active = useAppStore((s) => s.activeJourneys)
  const toggleJourney = useAppStore((s) => s.toggleJourney)
  const clearJourneys = useAppStore((s) => s.clearJourneys)
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('mousedown', onClick)
    return () => window.removeEventListener('mousedown', onClick)
  }, [])

  if (!data || data.journeys.length === 0) return null

  return (
    <div className={styles.wrap} ref={wrapRef}>
      {open && (
        <div className={styles.pop} data-testid="journey-popover">
          <div className={styles.popTitle}>Character journeys</div>
          <div className={styles.chips}>
            {data.journeys.map((j) => {
              const isActive = active.includes(j.characterId)
              return (
                <button
                  key={j.characterId}
                  className={`${styles.chip} ${isActive ? styles.chipActive : ''}`}
                  style={isActive ? { background: j.color } : undefined}
                  onClick={() => toggleJourney(j.characterId)}
                  data-testid={`journey-chip-${j.characterId}`}
                >
                  <span className={styles.dot} style={{ background: isActive ? 'rgba(243,234,210,0.9)' : j.color }} />
                  {j.name.split(' ')[0]}
                </button>
              )
            })}
          </div>
          {active.length > 0 && (
            <button className={styles.clear} onClick={clearJourneys}>
              Clear all
            </button>
          )}
        </div>
      )}
      <button
        className={styles.toggle}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        data-testid="journey-button"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
          <path d="M2 12 C4.5 7 6.5 10.5 9 5.5 M9 5.5 L11.5 3 M11.5 3 l0.9 2.6 M11.5 3 l-2.6-0.3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" fill="none" />
          <circle cx="2" cy="12" r="1.5" fill="currentColor" />
        </svg>
        <span className={styles.label}>Journeys</span>
        {active.length > 0 && <span className={styles.badge}>{active.length}</span>}
      </button>
    </div>
  )
}
