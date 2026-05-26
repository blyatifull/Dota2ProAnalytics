import { NextResponse } from 'next/server'
import { openDotaClient } from '@/lib/api/opendota-client'
import { getCached, CACHE_TTL } from '@/lib/redis'
import { HEROES } from '@/lib/constants/heroes'
import { calcWinRate } from '@/lib/utils/stats-calc'
import type { HeroDetails, HeroMatchup, ItemBuild, AbilityLevel } from '@/types/dota'
import type { DetailedMatchResponse, ItemConstant, AbilityConstant, AbilityUpgrade } from '@/lib/api/opendota-client'

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
                    // Fetch matches for this hero with item/ability data
                    const matches = await openDotaClient.getHeroMatchesWithDetails(heroId, 100)

                    // Fetch items and abilities constants
                    const [items, abilities] = await Promise.all([
                        openDotaClient.getItems(),
                        openDotaClient.getAbilities(),
                    ])

                    // Process item builds from matches
                    itemBuilds = processItemBuildsFromMatches(matches, items)

                    // Process ability build from matches
                    abilityBuild = processAbilityBuildFromMatches(matches, abilities)
                } catch (opendotaError) {
                    console.warn(`[OpenDota] Failed to fetch detailed data for hero ${heroId}:`, opendotaError)
                    // Continue with empty item/ability builds if OpenDota fails
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

function processItemBuildsFromMatches(
    matches: DetailedMatchResponse[],
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
        const isWin = match.radiant_win === (match.player_slot < 128)
        const duration = match.duration

        // Collect all items from the match (including backpack)
        const itemIds = [
            match.item_0, match.item_1, match.item_2,
            match.item_3, match.item_4, match.item_5,
            match.backpack_0, match.backpack_1, match.backpack_2
        ].filter(id => id !== 0 && id !== undefined)

        // Process purchase log if available for timing
        const purchaseTimes = new Map<number, number>()
        if (match.purchase_log) {
            for (const purchase of match.purchase_log) {
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
                    itemIcon: `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/${itemId}.png`,
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

    // Sort by match count and take top 15 per phase
    return result.sort((a, b) => b.matches - a.matches).slice(0, 15)
}

function processAbilityBuildFromMatches(
    matches: DetailedMatchResponse[],
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
        if (!match.ability_upgrades || match.ability_upgrades.length === 0) {
            continue
        }

        // Sort ability upgrades by time to get the order
        const sortedUpgrades = [...match.ability_upgrades].sort((a, b) => a.time - b.time)

        for (let i = 0; i < sortedUpgrades.length; i++) {
            const upgrade = sortedUpgrades[i]
            const key = `${upgrade.ability}-${upgrade.level}`
            const abilityData = abilities[`ability_${upgrade.ability}`] || abilities[`${upgrade.ability}`]

            const existing = abilityLevels.get(key)
            if (existing) {
                existing.count += 1
            } else if (abilityData) {
                abilityLevels.set(key, {
                    abilityId: upgrade.ability,
                    abilityName: abilityData.dname,
                    level: upgrade.level,
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

function processItemBuilds(purchases: any[]): ItemBuild[] {
    // Legacy function - kept for compatibility
    return []
}

function processAbilityBuild(abilities: any[]): AbilityLevel[] {
    // Legacy function - kept for compatibility
    return []
}