import { NextResponse } from 'next/server'
import { openDotaClient } from '@/lib/api/opendota-client'
import { redis, getCached, CACHE_TTL } from '@/lib/redis'
import { HEROES } from '@/lib/constants/heroes'
import { calcWinRate, calcPickRate, calcBanRate } from '@/lib/utils/stats-calc'
import type { HeroStats } from '@/types/dota'

export async function GET() {
  try {
    const stats = await getCached<HeroStats[]>(
      'heroes:stats:all',
      async () => {
        const rawStats = await openDotaClient.getHeroStats()
        
        return rawStats
          .filter(h => HEROES[h.id]) // Only include known heroes
          .map(h => {
            const hero = HEROES[h.id]
            const proPick = h.pro_pick || 0
            const proWin = h.pro_win || 0
            const proBan = h.pro_ban || 0
            const totalProMatches = Math.max(proPick, 1) // Avoid division by zero
            
            return {
              heroId: h.id,
              matchCount: proPick,
              winCount: proWin,
              pickCount: proPick,
              banCount: proBan,
              winRate: calcWinRate(proWin, proPick),
              pickRate: calcPickRate(proPick, totalProMatches * 10), // Rough estimate
              banRate: calcBanRate(proBan, totalProMatches * 10),
            }
          })
          .sort((a, b) => b.matchCount - a.matchCount)
      },
      CACHE_TTL.HERO_STATS
    )

    return NextResponse.json({ stats })
  } catch (error) {
    console.error('[API] Heroes stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch hero stats' },
      { status: 500 }
    )
  }
}
