import { useMemo } from 'react'
import { useAppStore } from '../store/useAppStore'
import { formatEp, seasonEpisodeOf } from '../data/episodes'
import { getMap } from '../map/registry'
import { flyToSelection } from '../map/interactions'
import type { LocationProps, ShowEvent } from '../data/types'
import styles from './DetailPanel.module.css'

const TYPE_LABELS: Record<string, string> = {
  City: 'City',
  Castle: 'Castle',
  Town: 'Town',
  Ruin: 'Ruin',
  Village: 'Village',
  Landmark: 'Landmark',
  Other: 'Place',
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  battle: 'Battle',
  death: 'Death',
  wedding: 'Wedding',
  political: 'Politics & power',
  sack: 'Sack',
  destruction: 'Destruction',
  birth: 'Birth',
  coronation: 'Coronation',
  escape: 'Escape',
  supernatural: 'The supernatural',
  journey: 'Journey',
  other: 'Event',
}

export default function DetailPanel() {
  const data = useAppStore((s) => s.data)
  const selected = useAppStore((s) => s.selected)

  if (!data || !selected) return null
  if (selected.kind === 'location') {
    const feature = data.locations.features.find((f) => f.properties.slug === selected.id)
    if (!feature) return null
    return <LocationView props={feature.properties} />
  }
  const event = data.events.find((e) => e.id === selected.id)
  if (!event) return null
  return <EventView event={event} />
}

function LocationView({ props }: { props: LocationProps }) {
  const data = useAppStore((s) => s.data)!
  const select = useAppStore((s) => s.select)
  const setTimelineEnabled = useAppStore((s) => s.setTimelineEnabled)
  const setT = useAppStore((s) => s.setT)

  const eventsHere = useMemo(
    () => data.events.filter((e) => e.locationId === props.slug),
    [data, props.slug],
  )

  return (
    <aside className={styles.panel} data-testid="detail-panel">
      <header className={styles.header}>
        <div className={styles.kicker}>
          {TYPE_LABELS[props.type] ?? props.type}
          <span className={styles.canon}>
            {props.showCanon === 'shown' ? 'Seen on screen' : 'Mentioned'}
          </span>
        </div>
        <h2 className={styles.title}>{props.name}</h2>
        {(props.region || props.allegiance) && (
          <div className={styles.subtitle}>
            {[props.region, props.allegiance].filter(Boolean).join(' · ')}
          </div>
        )}
        <button className={styles.close} onClick={() => select(null)} aria-label="Close panel">
          ×
        </button>
      </header>
      <div className={styles.body}>
        {props.description && <p className={styles.description}>{props.description}</p>}
        <dl className={styles.facts}>
          {props.firstAppearance && (
            <>
              <dt className={styles.factLabel}>First appears</dt>
              <dd className={styles.factValue}>
                {formatEp(props.firstAppearance)}
              </dd>
            </>
          )}
          {props.aliases.length > 0 && (
            <>
              <dt className={styles.factLabel}>Also known as</dt>
              <dd className={styles.factValue}>{props.aliases.join(', ')}</dd>
            </>
          )}
        </dl>

        {eventsHere.length > 0 && (
          <>
            <div className={styles.sectionTitle}>Events here</div>
            {eventsHere.map((e) => (
              <button
                key={e.id}
                className={styles.eventItem}
                onClick={() => {
                  select({ kind: 'event', id: e.id })
                  setTimelineEnabled(true)
                  setT(e.epIndex)
                }}
              >
                <span className={styles.eventEp}>{formatEp(e.epIndex)}</span>
                <span className={styles.eventTitle}>{e.title}</span>
              </button>
            ))}
          </>
        )}
      </div>
    </aside>
  )
}

function EventView({ event }: { event: ShowEvent }) {
  const data = useAppStore((s) => s.data)!
  const select = useAppStore((s) => s.select)
  const setTimelineEnabled = useAppStore((s) => s.setTimelineEnabled)
  const setT = useAppStore((s) => s.setT)
  const activeJourneys = useAppStore((s) => s.activeJourneys)
  const toggleJourney = useAppStore((s) => s.toggleJourney)

  const { season, episode } = seasonEpisodeOf(event.epIndex)
  const characters = event.characters
    .map((id) => data.characters.find((c) => c.id === id))
    .filter((c): c is NonNullable<typeof c> => Boolean(c))

  return (
    <aside className={styles.panel} data-testid="detail-panel">
      <header className={styles.header}>
        <div className={styles.kicker}>{EVENT_TYPE_LABELS[event.type] ?? 'Event'}</div>
        <h2 className={styles.title}>{event.title}</h2>
        <div className={styles.subtitle}>
          Season {season}, Episode {episode} · “{event.episodeTitle}”
        </div>
        <button className={styles.close} onClick={() => select(null)} aria-label="Close panel">
          ×
        </button>
      </header>
      <div className={styles.body}>
        <p className={styles.description}>{event.description}</p>
        <dl className={styles.facts}>
          {event.locationId && event.locationName && (
            <>
              <dt className={styles.factLabel}>Where</dt>
              <dd className={styles.factValue}>
                <button
                  className={styles.linkBtn}
                  onClick={() => {
                    const sel = { kind: 'location' as const, id: event.locationId! }
                    select(sel)
                    const map = getMap()
                    if (map) flyToSelection(map, sel)
                  }}
                >
                  {event.locationName}
                </button>
              </dd>
            </>
          )}
        </dl>

        {characters.length > 0 && (
          <>
            <div className={styles.sectionTitle}>Who was there</div>
            <div className={styles.chips}>
              {characters.map((c) => {
                const hasJourney = c.journeyAvailable
                const active = activeJourneys.includes(c.id)
                return (
                  <button
                    key={c.id}
                    className={`${styles.chip} ${active ? styles.chipActive : ''}`}
                    onClick={hasJourney ? () => toggleJourney(c.id) : undefined}
                    title={hasJourney ? 'Toggle journey path' : undefined}
                    style={hasJourney ? undefined : { cursor: 'default', opacity: 0.75 }}
                  >
                    {c.name}
                  </button>
                )
              })}
            </div>
          </>
        )}

        <button
          className={styles.jumpBtn}
          onClick={() => {
            setTimelineEnabled(true)
            setT(event.epIndex)
          }}
        >
          View on timeline
        </button>
      </div>
    </aside>
  )
}
