import type { HeroStats, DraftStats } from '@/types/dota'

/**
 * Calculate winrate as percentage
 */
export function calcWinRate(wins: number, matches: number): number {
  if (matches === 0) return 0
  return (wins / matches) * 100
}

/**
 * Calculate pick rate from total matches
 */
export function calcPickRate(picks: number, totalMatches: number): number {
  if (totalMatches === 0) return 0
  // Each match has 10 heroes picked
  return (picks / (totalMatches * 10)) * 100
}

/**
 * Calculate ban rate from total matches
 */
export function calcBanRate(bans: number, totalMatches: number): number {
  if (totalMatches === 0) return 0
  // Each match typically has ~14 bans (varies by mode)
  return (bans / (totalMatches * 14)) * 100
}

/**
 * Calculate contest rate (pick + ban rate)
 */
export function calcContestRate(picks: number, bans: number, totalMatches: number): number {
  if (totalMatches === 0) return 0
  return calcPickRate(picks, totalMatches) + calcBanRate(bans, totalMatches)
}

/**
 * Format percentage for display
 */
export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`
}

/**
 * Format duration in seconds to mm:ss or hh:mm:ss
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

/**
 * Sort heroes by stat
 */
export function sortHeroStats(
  stats: HeroStats[],
  sortBy: 'winRate' | 'pickRate' | 'banRate' | 'matchCount',
  direction: 'asc' | 'desc' = 'desc'
): HeroStats[] {
  return [...stats].sort((a, b) => {
    const diff = a[sortBy] - b[sortBy]
    return direction === 'desc' ? -diff : diff
  })
}

/**
 * Get tier label based on pick/ban/winrate
 */
export function getHeroTier(winRate: number, contestRate: number): 'S' | 'A' | 'B' | 'C' | 'D' {
  if (winRate >= 55 && contestRate >= 50) return 'S'
  if (winRate >= 52 && contestRate >= 30) return 'A'
  if (winRate >= 48 && contestRate >= 15) return 'B'
  if (winRate >= 45) return 'C'
  return 'D'
}

/**
 * Tier colors for UI
 */
export const TIER_COLORS = {
  S: '#EF4444', // red
  A: '#F97316', // orange
  B: '#EAB308', // yellow
  C: '#22C55E', // green
  D: '#6B7280', // gray
}

/**
 * Process raw API data into DraftStats
 */
export function processDraftStats(
  heroId: number,
  heroName: string,
  heroIcon: string,
  matchCount: number,
  winCount: number,
  pickCount: number,
  banCount: number,
  totalMatches: number
): DraftStats {
  return {
    heroId,
    heroName,
    heroIcon,
    matchCount,
    winCount,
    pickCount,
    banCount,
    winRate: calcWinRate(winCount, matchCount),
    pickRate: calcPickRate(pickCount, totalMatches),
    banRate: calcBanRate(banCount, totalMatches),
    contestRate: calcContestRate(pickCount, banCount, totalMatches),
  }
}
