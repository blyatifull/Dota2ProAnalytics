import { NextResponse } from 'next/server'
import { openDotaClient } from '@/lib/api/opendota-client'
import { createStratzClient, HERO_DETAILS_QUERY, ABILITY_BUILD_QUERY } from '@/lib/api/stratz-client'
import { getCached, CACHE_TTL } from '@/lib/redis'
import { HEROES } from '@/lib/constants/heroes'
import { calcWinRate } from '@/lib/utils/stats-calc'
import type { HeroDetails, HeroMatchup, ItemBuild, AbilityLevel } from '@/types/dota'
import type { HeroDetailsResponse, AbilityBuildResponse, StratzItemPurchase, StratzAbilityLevel } from '@/lib/api/stratz-client'

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

        // Fetch STRATZ data for item builds and ability builds
        const stratzClient = createStratzClient()
        let itemBuilds: ItemBuild[] = []
        let abilityBuild: AbilityLevel[] = []

        try {
          // Fetch item purchases
          const itemData = await stratzClient.request<HeroDetailsResponse>({
            query: HERO_DETAILS_QUERY,
            variables: { heroId },
          })

          if (itemData?.heroStats?.itemPurchase) {
            itemBuilds = processItemBuilds(itemData.heroStats.itemPurchase)
          }

          // Fetch ability build
          const abilityData = await stratzClient.request<AbilityBuildResponse>({
            query: ABILITY_BUILD_QUERY,
            variables: { heroId },
          })

          if (abilityData?.heroStats?.abilityMaxLevel) {
            abilityBuild = processAbilityBuild(abilityData.heroStats.abilityMaxLevel)
          }
        } catch (stratzError) {
          console.warn(`[STRATZ] Failed to fetch data for hero ${heroId}:`, stratzError)
          // Continue with empty item/ability builds if STRATZ fails
        }

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
          itemBuilds,
          abilityBuild,
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

function processItemBuilds(purchases: StratzItemPurchase[]): ItemBuild[] {
  // Group items and calculate stats
  const itemMap = new Map<number, { wins: number; matches: number; times: number[] }>()
  
  for (const purchase of purchases) {
    const existing = itemMap.get(purchase.itemId)
    if (existing) {
      existing.wins += purchase.wins
      existing.matches += purchase.matchCount
      existing.times.push(purchase.time)
    } else {
      itemMap.set(purchase.itemId, {
        wins: purchase.wins,
        matches: purchase.matchCount,
        times: [purchase.time],
      })
    }
  }

  const result: ItemBuild[] = []
  for (const [itemId, data] of itemMap.entries()) {
    const avgTime = data.times.reduce((a, b) => a + b, 0) / data.times.length
    const phase = getPhase(avgTime)
    
    result.push({
      itemId,
      itemName: getItemName(itemId),
      itemIcon: getItemIcon(itemId),
      wins: data.wins,
      matches: data.matches,
      winRate: calcWinRate(data.wins, data.matches),
      avgTime: Math.round(avgTime / 60), // Convert to minutes
      phase,
    })
  }

  // Sort by match count and take top 15
  return result.sort((a, b) => b.matches - a.matches).slice(0, 15)
}

function getPhase(timeInSeconds: number): 'early' | 'mid' | 'late' {
  if (timeInSeconds < 600) return 'early' // Before 10 min
  if (timeInSeconds < 1500) return 'mid' // 10-25 min
  return 'late' // After 25 min
}

function getItemName(itemId: number): string {
  // Simple mapping - in production you'd use Dota constants
  return `Item ${itemId}`
}

function getItemIcon(itemId: number): string {
  return `https://cdn.stratz.com/items/${itemId}.png`
}

function processAbilityBuild(abilities: StratzAbilityLevel[]): AbilityLevel[] {
  // Sort by level and match count to get most common ability progression
  return abilities
    .sort((a, b) => a.level - b.level || b.matchCount - a.matchCount)
    .map((ability, index) => ({
      abilityId: ability.abilityId,
      abilityName: `Ability ${ability.abilityId}`,
      level: ability.level,
      order: index + 1,
    }))
}
