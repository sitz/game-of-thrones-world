/** Episode index math. epIndex runs 1..73 across the show's 8 seasons. */

export const SEASON_LENGTHS = [10, 10, 10, 10, 10, 10, 7, 6]
export const SEASON_OFFSETS = [0, 10, 20, 30, 40, 50, 60, 67]
export const TOTAL_EPISODES = 73

export function epIndexOf(season: number, episode: number): number {
  return SEASON_OFFSETS[season - 1] + episode
}

export function seasonEpisodeOf(epIndex: number): { season: number; episode: number } {
  const i = Math.min(Math.max(Math.round(epIndex), 1), TOTAL_EPISODES)
  let season = 1
  while (season < 8 && i > SEASON_OFFSETS[season]) season++
  return { season, episode: i - SEASON_OFFSETS[season - 1] }
}

export function formatEp(epIndex: number): string {
  const { season, episode } = seasonEpisodeOf(epIndex)
  return `S${season}E${episode}`
}

/** Parse "s04e02" → epIndex, or null. */
export function parseEpCode(code: string): number | null {
  const m = /^s(\d{1,2})e(\d{1,2})$/i.exec(code.trim())
  if (!m) return null
  const season = Number(m[1])
  const episode = Number(m[2])
  if (season < 1 || season > 8) return null
  if (episode < 1 || episode > SEASON_LENGTHS[season - 1]) return null
  return epIndexOf(season, episode)
}

export function toEpCode(epIndex: number): string {
  const { season, episode } = seasonEpisodeOf(epIndex)
  return `s${String(season).padStart(2, '0')}e${String(episode).padStart(2, '0')}`
}
