import { useEffect, useRef, useState } from 'react'
import { useAppStore, type LayerToggles } from '../store/useAppStore'
import styles from './LayerControl.module.css'

const ROWS: { key: keyof LayerToggles; label: string }[] = [
  { key: 'political', label: 'Kingdoms & borders' },
  { key: 'terrain', label: 'Forests & mountains' },
  { key: 'roads', label: 'Roads' },
  { key: 'events', label: 'Show events' },
  { key: 'labels', label: 'Names of realms & seas' },
]

export default function LayerControl() {
  const layers = useAppStore((s) => s.layers)
  const toggleLayer = useAppStore((s) => s.toggleLayer)
  const setAboutOpen = useAppStore((s) => s.setAboutOpen)
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('mousedown', onClick)
    return () => window.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <button
        className={styles.button}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        data-testid="layer-button"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
          <path d="M7 1.5 L13 4.5 L7 7.5 L1 4.5 Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
          <path d="M2.2 7.5 L7 9.9 L11.8 7.5 M2.2 10.2 L7 12.6 L11.8 10.2" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" fill="none" />
        </svg>
        <span className={styles.label}>Layers</span>
      </button>
      {open && (
        <div className={styles.pop} data-testid="layer-popover">
          {ROWS.map(({ key, label }) => (
            <button key={key} className={styles.row} onClick={() => toggleLayer(key)}>
              <span className={`${styles.check} ${layers[key] ? styles.checkOn : ''}`}>
                {layers[key] ? '✓' : ''}
              </span>
              {label}
            </button>
          ))}
          <div className={styles.divider} />
          <button
            className={`${styles.row} ${styles.about}`}
            onClick={() => {
              setOpen(false)
              setAboutOpen(true)
            }}
          >
            About this map…
          </button>
        </div>
      )}
    </div>
  )
}
