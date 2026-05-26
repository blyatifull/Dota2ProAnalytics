import { NextResponse } from 'next/server'
import { openDotaClient } from '@/lib/api/opendota-client'
import { getCached, CACHE_TTL } from '@/lib/redis'
import { HEROES } from '@/lib/constants/heroes'
import { calcWinRate } from '@/lib/utils/stats-calc'
import type { HeroDetails, HeroMatchup } from '@/types/dota'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const heroId = parseInt(id)

  if (isNaN(heroId) || !HEROES[heroId]) {
    return NextResponse.json(
      { error: 'Invalid hero ID' },
      { status: 400 }
    )
  }

  try {
    const details = await getCached<HeroDetails>(
      `heroes:details:${heroId}`,
      async () => {
        const hero = HEROES[heroId]
        
        // Fetch hero stats and matchups in parallel
        const [allStats, matchups] = await Promise.all([
          openDotaClient.getHeroStats(),
          openDotaClient.getHeroMatchups(heroId),
        ])

        const heroStat = allStats.find(h => h.id === heroId)
        
        const proPick = heroStat?.pro_pick || 0
        const proWin = heroStat?.pro_win || 0
        const proBan = heroStat?.pro_ban || 0

        // Process matchups - sort by games played and calculate advantage
        const processedMatchups: HeroMatchup[] = matchups
          .filter(m => HEROES[m.hero_id])
          .map(m => ({
            heroId: m.hero_id,
            heroName: HEROES[m.hero_id].localizedName,
            matchCount: m.games_played,
            winRate: calcWinRate(m.wins, m.games_played),
            advantage: calcWinRate(m.wins, m.games_played) - 50, // Advantage over 50%
          }))
          .sort((a, b) => b.matchCount - a.matchCount)
          .slice(0, 20)

        return {
          heroId,
          hero,
          matchCount: proPick,
          winCount: proWin,
          pickCount: proPick,
          banCount: proBan,
          winRate: calcWinRate(proWin, proPick),
          pickRate: 0, // Would need total match count
          banRate: 0,
          itemBuilds: [], // Would need STRATZ API for item builds
          abilityBuild: [], // Would need STRATZ API for ability builds
          matchups: processedMatchups,
        }
      },
      CACHE_TTL.HERO_STATS
    )

    return NextResponse.json(details)
  } catch (error) {
    console.error(`[API] Hero ${heroId} details error:`, error)
    return NextResponse.json(
      { error: 'Failed to fetch hero details' },
      { status: 500 }
    )
  }
}
