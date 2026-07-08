import type { Map as MLMap } from 'maplibre-gl'
import { icons, patterns, journeyHeadSvg, journeyEndSvg } from './iconDefs'

function rasterize(svg: string): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      resolve(ctx.getImageData(0, 0, canvas.width, canvas.height))
    }
    img.onerror = () => reject(new Error('icon rasterization failed'))
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  })
}

/**
 * Rasterizes every icon/pattern (plus per-character journey markers) up front,
 * so a synchronous `styleimagemissing` handler can serve them race-free.
 */
export async function prepareIcons(
  journeys: { characterId: string; color: string }[],
): Promise<Map<string, ImageData>> {
  const defs: Record<string, string> = {}
  for (const [name, def] of Object.entries({ ...icons, ...patterns })) defs[name] = def.svg
  for (const j of journeys) {
    defs[`journey-head-${j.characterId}`] = journeyHeadSvg(j.color).svg
    defs[`journey-end-${j.characterId}`] = journeyEndSvg(j.color).svg
  }
  const entries = await Promise.all(
    Object.entries(defs).map(async ([name, svg]) => [name, await rasterize(svg)] as const),
  )
  return new Map(entries)
}

/** Installs the image cache on the map; also pre-adds everything after load. */
export function installIcons(map: MLMap, cache: Map<string, ImageData>) {
  map.on('styleimagemissing', (e) => {
    const data = cache.get(e.id)
    if (data && !map.hasImage(e.id)) map.addImage(e.id, data, { pixelRatio: 2 })
  })
  map.once('load', () => {
    for (const [name, data] of cache) {
      if (!map.hasImage(name)) map.addImage(name, data, { pixelRatio: 2 })
    }
  })
}
