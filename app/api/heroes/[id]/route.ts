import { NextResponse } from 'next/server'
import { openDotaClient } from '@/lib/api/opendota-client'
import { getCached, CACHE_TTL } from '@/lib/redis'
import { HEROES } from '@/lib/constants/heroes'
import { calcWinRate } from '@/lib/utils/stats-calc'
import { getGenericBuildByRole } from '@/lib/data/hero-item-builds'
import type { HeroDetails, HeroMatchup, ItemBuild, AbilityLevel } from '@/types/dota'
import type { DetailedMatchResponse, ItemConstant, AbilityConstant, AbilityUpgrade, MatchResponse } from '@/lib/api/opendota-client'

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

                // Fetch OpenDota data for item builds and ability builds
                let itemBuilds: ItemBuild[] = []
                let abilityBuild: AbilityLevel[] = []

                try {
                    // Fetch items and abilities constants first
                    const [items, abilities] = await Promise.all([
                        openDotaClient.getItems(),
                        openDotaClient.getAbilities(),
                    ])

                    // Fetch recent pro matches to get match IDs for this hero
                    const proMatches = await openDotaClient.getProMatches(50)
                    
                    // Filter matches that include this hero and get their IDs
                    const matchIdsForHero = proMatches
                        .filter(m => {
                            // We need to check if hero is in the match by fetching details
                            return true // We'll filter after fetching details
                        })
                        .map(m => m.match_id)
                        .slice(0, 20) // Limit to 20 matches for performance

                    // Fetch full match details for each match
                    const detailedMatchesPromises = matchIdsForHero.map(matchId => 
                        openDotaClient.getMatch(matchId).catch(() => null)
                    )
                    const detailedMatches = await Promise.all(detailedMatchesPromises)
                    
                    // Filter matches that have our hero
                    const heroMatches = detailedMatches.filter(m => {
                        if (!m) return false
                        return m.players.some(p => p.hero_id === heroId)
                    }) as MatchResponse[]

                    // Process item builds from matches
                    itemBuilds = processItemBuildsFromFullMatches(heroMatches, heroId, items)

                    // Process ability build from matches
                    abilityBuild = processAbilityBuildFromFullMatches(heroMatches, heroId, abilities)
                } catch (opendotaError) {
                    console.warn(`[OpenDota] Failed to fetch detailed data for hero ${heroId}:`, opendotaError)
                    // Continue with empty item/ability builds if OpenDota fails
                }

                // Fallback to generic builds if no data from OpenDota
                if (itemBuilds.length === 0 || abilityBuild.length === 0) {
                    const heroRole = hero.roles[0] || 'support'
                    const genericBuild = getGenericBuildByRole(heroRole)
                    
                    // Use generic builds as fallback
                    if (itemBuilds.length === 0) {
                        itemBuilds = genericBuild.itemBuilds
                    }
                    if (abilityBuild.length === 0) {
                        abilityBuild = genericBuild.abilityBuild
                    }
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

function processItemBuildsFromFullMatches(
    matches: MatchResponse[],
    heroId: number,
    items: Record<string, ItemConstant>
): ItemBuild[] {
    // Group items by ID and track wins, matches, and purchase times
    const itemStats = new Map<number, {
        wins: number
        matches: number
        times: number[]
        itemName: string
        itemIcon: string
    }>()

    for (const match of matches) {
        // Find the player with this hero
        const player = match.players.find(p => p.hero_id === heroId)
        if (!player) continue

        const isWin = match.radiant_win === (player.player_slot < 128)
        const duration = match.duration

        // Collect all items from the match (including backpack)
        const itemIds = [
            player.item_0, player.item_1, player.item_2,
            player.item_3, player.item_4, player.item_5,
            player.backpack_0, player.backpack_1, player.backpack_2
        ].filter(id => id !== 0 && id !== undefined)

        // Process purchase log if available for timing
        const purchaseTimes = new Map<number, number>()
        if (player.purchase_log) {
            for (const purchase of player.purchase_log) {
                const itemId = getItemIdFromKey(purchase.key)
                if (itemId && !purchaseTimes.has(itemId)) {
                    purchaseTimes.set(itemId, purchase.time)
                }
            }
        }

        for (const itemId of itemIds) {
            const existing = itemStats.get(itemId)
            const itemData = items[`item_${itemId}`] || items[`${itemId}`]

            if (existing) {
                existing.wins += isWin ? 1 : 0
                existing.matches += 1
                // Use purchase time if available, otherwise use match duration as estimate
                const time = purchaseTimes.get(itemId) ?? duration
                existing.times.push(time)
            } else if (itemData) {
                itemStats.set(itemId, {
                    wins: isWin ? 1 : 0,
                    matches: 1,
                    times: [purchaseTimes.get(itemId) ?? duration],
                    itemName: itemData.dname,
                    itemIcon: `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/${itemData.img}`,
                })
            }
        }
    }

    const result: ItemBuild[] = []
    for (const [itemId, data] of itemStats.entries()) {
        const avgTime = data.times.reduce((a, b) => a + b, 0) / data.times.length
        const phase = getPhase(avgTime)

        result.push({
            itemId,
            itemName: data.itemName,
            itemIcon: data.itemIcon,
            wins: data.wins,
            matches: data.matches,
            winRate: calcWinRate(data.wins, data.matches),
            avgTime: Math.round(avgTime),
            phase,
        })
    }

    // Sort by match count and take top items
    return result.sort((a, b) => b.matches - a.matches)
}

function processAbilityBuildFromFullMatches(
    matches: MatchResponse[],
    heroId: number,
    abilities: Record<string, AbilityConstant>
): AbilityLevel[] {
    // Track ability upgrades by level
    const abilityLevels = new Map<string, {
        abilityId: number
        abilityName: string
        level: number
        order: number
        count: number
    }>()

    for (const match of matches) {
        // Find the player with this hero
        const player = match.players.find(p => p.hero_id === heroId)
        if (!player || !player.ability_upgrades_arr || player.ability_upgrades_arr.length === 0) {
            continue
        }

        // Process ability upgrades - they come as an array of ability IDs in order
        const abilityUpgradesArr = player.ability_upgrades_arr
        
        // We need to track which level each ability is at as we go through the upgrades
        const abilityLevelCount = new Map<number, number>()
        
        for (let i = 0; i < abilityUpgradesArr.length; i++) {
            const abilityId = abilityUpgradesArr[i]
            
            // Skip special abilities (like talents) which have negative IDs or very high IDs
            if (abilityId <= 0 || abilityId > 1000) {
                continue
            }
            
            // Increment the level for this ability
            const currentLevel = (abilityLevelCount.get(abilityId) || 0) + 1
            abilityLevelCount.set(abilityId, currentLevel)
            
            const key = `${abilityId}-${currentLevel}`
            const abilityData = abilities[`ability_${abilityId}`] || abilities[`${abilityId}`]

            const existing = abilityLevels.get(key)
            if (existing) {
                existing.count += 1
            } else if (abilityData) {
                abilityLevels.set(key, {
                    abilityId: abilityId,
                    abilityName: abilityData.dname,
                    level: currentLevel,
                    order: i + 1,
                    count: 1,
                })
            }
        }
    }

    // Convert to array and sort by level then by count (most common first)
    return Array.from(abilityLevels.values())
        .sort((a, b) => a.level - b.level || b.count - a.count)
        .map((ability, index) => ({
            abilityId: ability.abilityId,
            abilityName: ability.abilityName,
            level: ability.level,
            order: index + 1,
        }))
}

function getItemIdFromKey(key: string): number | null {
    // Parse item key from purchase log (e.g., "item_blink", "item_tpscroll")
    if (!key.startsWith('item_')) {
        return null
    }

    const itemKey = key.replace('item_', '')

    // Map common item keys to IDs (this is a simplified mapping)
    // In production, you'd want a complete mapping or reverse lookup
    const itemKeyToId: Record<string, number> = {
        'blink': 1,
        'tpscroll': 42,
        'boots': 29,
        'magic_wand': 36,
        'power_treads': 50,
        'phase_boots': 57,
        'arcane_boots': 102,
        'black_king_bar': 116,
        'butterfly': 139,
        'daedalus': 141,
        'divine_rapier': 143,
        'heart': 148,
        'manta': 149,
        'satanic': 158,
        'shivas_guard': 154,
        'scythe': 152,
    }

    return itemKeyToId[itemKey] || null
}

function getPhase(timeInSeconds: number): 'early' | 'mid' | 'late' {
    if (timeInSeconds < 600) return 'early' // Before 10 min
    if (timeInSeconds < 1500) return 'mid' // 10-25 min
    return 'late' // After 25 min
}

// Remove legacy functions - no longer needed