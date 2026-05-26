import { NextResponse } from 'next/server'
import { openDotaClient } from '@/lib/api/opendota-client'
import { getCached, CACHE_TTL } from '@/lib/redis'
import { HEROES } from '@/lib/constants/heroes'
import { calcWinRate, calcPickRate, calcBanRate, calcContestRate } from '@/lib/utils/stats-calc'
import type { DraftStats } from '@/types/dota'

export async function GET() {
  try {
    const draftStats = await getCached<DraftStats[]>(
      'drafts:stats:all',
      async () => {
        const rawStats = await openDotaClient.getHeroStats()
        
        // Calculate total pro matches (rough estimate from hero with most picks)
        const maxPicks = Math.max(...rawStats.map(h => h.pro_pick || 0))
        const estimatedTotalMatches = Math.ceil(maxPicks / 2) // Each match has ~2-3 picks of popular heroes
        
        return rawStats
          .filter(h => HEROES[h.id] && (h.pro_pick || 0) > 0)
          .map(h => {
            const hero = HEROES[h.id]
            const proPick = h.pro_pick || 0
            const proWin = h.pro_win || 0
            const proBan = h.pro_ban || 0
            
            return {
              heroId: h.id,
              heroName: hero.localizedName,
              heroIcon: hero.icon,
              matchCount: proPick,
              winCount: proWin,
              pickCount: proPick,
              banCount: proBan,
              winRate: calcWinRate(proWin, proPick),
              pickRate: calcPickRate(proPick, estimatedTotalMatches),
              banRate: calcBanRate(proBan, estimatedTotalMatches),
              contestRate: calcContestRate(proPick, proBan, estimatedTotalMatches),
            }
          })
          .sort((a, b) => b.contestRate - a.contestRate)
      },
      CACHE_TTL.DRAFT_STATS
    )

    return NextResponse.json({ stats: draftStats })
  } catch (error) {
    console.error('[API] Draft stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch draft stats' },
      { status: 500 }
    )
  }
}
