import { describe, expect, it } from 'vitest'
import { epIndexOf, seasonEpisodeOf, parseEpCode, toEpCode, TOTAL_EPISODES } from './episodes'

describe('epIndex math', () => {
  it('maps season/episode to a 1..73 index', () => {
    expect(epIndexOf(1, 1)).toBe(1)
    expect(epIndexOf(1, 10)).toBe(10)
    expect(epIndexOf(3, 9)).toBe(29)
    expect(epIndexOf(7, 1)).toBe(61)
    expect(epIndexOf(7, 7)).toBe(67)
    expect(epIndexOf(8, 6)).toBe(TOTAL_EPISODES)
  })

  it('round-trips every episode', () => {
    for (let i = 1; i <= TOTAL_EPISODES; i++) {
      const { season, episode } = seasonEpisodeOf(i)
      expect(epIndexOf(season, episode)).toBe(i)
    }
  })

  it('parses and formats episode codes', () => {
    expect(parseEpCode('s03e09')).toBe(29)
    expect(parseEpCode('S8E6')).toBe(73)
    expect(parseEpCode('s07e08')).toBeNull() // season 7 has 7 episodes
    expect(parseEpCode('s09e01')).toBeNull()
    expect(parseEpCode('nonsense')).toBeNull()
    expect(toEpCode(29)).toBe('s03e09')
    expect(parseEpCode(toEpCode(67))).toBe(67)
  })

  it('clamps out-of-range indices', () => {
    expect(seasonEpisodeOf(0)).toEqual({ season: 1, episode: 1 })
    expect(seasonEpisodeOf(99)).toEqual({ season: 8, episode: 6 })
  })
})
