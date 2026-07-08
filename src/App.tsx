import { useEffect, useRef, useState } from 'react'
import MapView from './map/MapView'
import SearchBar from './components/SearchBar'
import DetailPanel from './components/DetailPanel'
import LayerControl from './components/LayerControl'
import AboutModal from './components/AboutModal'
import TimelineBar from './components/TimelineBar'
import JourneyControl from './components/JourneyControl'
import { loadWorldData } from './data/loaders'
import { useAppStore } from './store/useAppStore'
import { wireInteractions } from './map/interactions'
import { wireLayerToggles } from './map/mapSync'
import { wireTimeline } from './map/timeline/timeline'
import { wireJourneys } from './map/journeys/animator'
import { applyUrlToStore, wireUrlSync } from './store/urlSync'

export default function App() {
  const data = useAppStore((s) => s.data)
  const setData = useAppStore((s) => s.setData)
  const [error, setError] = useState<string | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const wired = useRef(false)

  useEffect(() => {
    loadWorldData().then(
      (d) => useAppStore.getState().setData(d),
      (e: Error) => setError(e.message),
    )
  }, [setData])

  return (
    <div className="app">
      {data && (
        <MapView
          data={data}
          onReady={(map) => {
            if (!wired.current) {
              wired.current = true
              wireInteractions(map)
              wireLayerToggles(map)
              wireTimeline(map)
              wireJourneys(map)
              wireUrlSync()
              applyUrlToStore()
            }
            setMapReady(true)
          }}
        />
      )}
      <div className="paper-grain" />
      {mapReady && (
        <>
          <SearchBar />
          <LayerControl />
          <DetailPanel />
          <TimelineBar />
          <JourneyControl />
          <AboutModal />
        </>
      )}
      {!mapReady && (
        <div className="loading-screen" role="status">
          <div className="loading-title">Known World</div>
          <div className="loading-sub">
            {error ? `Something went wrong: ${error}` : 'Unrolling the map…'}
          </div>
        </div>
      )}
    </div>
  )
}
