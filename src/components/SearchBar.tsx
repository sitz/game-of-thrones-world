import { useEffect, useMemo, useRef, useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { buildSearchDocs, buildSearchIndex, type SearchDoc, type SearchKind } from '../search/buildIndex'
import { getMap } from '../map/registry'
import { flyToSelection } from '../map/interactions'
import styles from './SearchBar.module.css'

const GROUP_ORDER: SearchKind[] = ['location', 'place', 'event', 'character']
const GROUP_LABELS: Record<SearchKind, string> = {
  location: 'Places',
  place: 'Realms & nature',
  event: 'Events',
  character: 'Journeys',
}

interface Hit extends SearchDoc {
  score: number
}

export default function SearchBar() {
  const data = useAppStore((s) => s.data)
  const select = useAppStore((s) => s.select)
  const toggleJourney = useAppStore((s) => s.toggleJourney)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  const index = useMemo(() => (data ? buildSearchIndex(buildSearchDocs(data)) : null), [data])

  const hits: Hit[] = useMemo(() => {
    if (!index || query.trim().length < 2) return []
    const raw = index.search(query) as unknown as (Hit & { boost: number })[]
    return raw
      .map((h) => ({ ...h, score: h.score * (h.boost ?? 1) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 14)
  }, [index, query])

  const grouped = useMemo(() => {
    const groups: { kind: SearchKind; items: Hit[] }[] = []
    for (const kind of GROUP_ORDER) {
      const items = hits.filter((h) => h.kind === kind)
      if (items.length) groups.push({ kind, items })
    }
    return groups
  }, [hits])

  const flat = useMemo(() => grouped.flatMap((g) => g.items), [grouped])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        inputRef.current?.select()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('mousedown', onClick)
    return () => window.removeEventListener('mousedown', onClick)
  }, [])

  useEffect(() => setActive(0), [query])

  function choose(hit: Hit) {
    const map = getMap()
    setOpen(false)
    setQuery('')
    inputRef.current?.blur()
    const [prefix, ...rest] = hit.id.split(':')
    const id = rest.join(':')
    if (prefix === 'location' || prefix === 'event') {
      const sel = { kind: prefix as 'location' | 'event', id }
      select(sel)
      if (map) flyToSelection(map, sel)
    } else if (prefix === 'character') {
      toggleJourney(id)
    } else if (hit.coords && map) {
      select(null)
      map.flyTo({ center: hit.coords, zoom: hit.zoom ?? 5.5, speed: 1.6, essential: true })
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => Math.min(a + 1, flat.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, 0))
    } else if (e.key === 'Enter' && flat[active]) {
      choose(flat[active])
    } else if (e.key === 'Escape') {
      setOpen(false)
      inputRef.current?.blur()
    }
  }

  let flatIndex = -1

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <div className={styles.box}>
        <span className={styles.icon} aria-hidden>
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <circle cx="6.5" cy="6.5" r="4.7" stroke="currentColor" strokeWidth="1.6" />
            <path d="M10.2 10.2 L13.6 13.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </span>
        <input
          ref={inputRef}
          className={styles.input}
          placeholder="Search the known world…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          aria-label="Search locations, events, characters"
          data-testid="search-input"
        />
        {query ? (
          <button className={styles.clear} onClick={() => setQuery('')} aria-label="Clear search">
            ×
          </button>
        ) : (
          <span className={styles.kbd}>⌘K</span>
        )}
      </div>

      {open && query.trim().length >= 2 && (
        <div className={styles.results} role="listbox" data-testid="search-results">
          {grouped.length === 0 && <div className={styles.empty}>Nothing found in the known world.</div>}
          {grouped.map((g) => (
            <div key={g.kind}>
              <div className={styles.group}>{GROUP_LABELS[g.kind]}</div>
              {g.items.map((hit) => {
                flatIndex++
                const i = flatIndex
                return (
                  <button
                    key={hit.id}
                    className={`${styles.item} ${i === active ? styles.itemActive : ''}`}
                    onClick={() => choose(hit)}
                    onMouseEnter={() => setActive(i)}
                    role="option"
                    aria-selected={i === active}
                  >
                    <span className={styles.itemName}>{hit.name}</span>
                    <span className={styles.itemSub}>{hit.sub}</span>
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
