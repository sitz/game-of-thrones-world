import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { WorldData } from '../data/types'
import { buildStyle } from './style/baseStyle'
import { prepareIcons, installIcons } from './icons'
import { setMap } from './registry'

interface Props {
  data: WorldData
  onReady?: (map: maplibregl.Map) => void
}

export default function MapView({ data, onReady }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    let cancelled = false
    let map: maplibregl.Map | undefined
    const cleanupFns: (() => void)[] = []

    prepareIcons(data.journeys).then((iconCache) => {
      if (cancelled || !containerRef.current) return
      map = new maplibregl.Map({
        container: containerRef.current,
        style: buildStyle(data),
        center: [18, 6],
        zoom: 4.3,
        minZoom: 3.1,
        maxZoom: 10.5,
        maxBounds: [
          [-14, -44],
          [100, 46],
        ],
        hash: 'map',
        renderWorldCopies: false,
        attributionControl: false,
        fadeDuration: 250,
      })
      installIcons(map, iconCache)
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right')
      map.addControl(
        new maplibregl.AttributionControl({
          compact: true,
          customAttribution:
            'Map data © <a href="https://quartermaester.info" target="_blank" rel="noopener">cadaei, theMountainGoat &amp; Tear</a> (CC BY-NC-SA 3.0) · A fan project',
        }),
        'bottom-right',
      )
      mapRef.current = map
      // Dev/verification handle; also guards against creation while the
      // container was still zero-sized (fonts/HMR races).
      ;(window as unknown as { __map?: maplibregl.Map }).__map = map
      map.once('load', () => {
        if (cancelled || !map) return
        map.resize()
        setMap(map)
        onReady?.(map)
      })
      // ResizeObserver callbacks can be starved in occluded tabs; make sure
      // the canvas recovers whenever the page becomes visible again.
      const onVisible = () => map?.resize()
      document.addEventListener('visibilitychange', onVisible)
      window.addEventListener('resize', onVisible)
      cleanupFns.push(() => {
        document.removeEventListener('visibilitychange', onVisible)
        window.removeEventListener('resize', onVisible)
      })
    })

    return () => {
      cancelled = true
      for (const fn of cleanupFns.splice(0)) fn()
      setMap(null)
      map?.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <div ref={containerRef} className="map-container" />
}
