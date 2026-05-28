import { NextResponse } from 'next/server'
import { openDotaClient } from '@/lib/api/opendota-client'
import { getCached, CACHE_TTL } from '@/lib/redis'
import { HEROES } from '@/lib/constants/heroes'
import type { MatchDetails, MatchPlayer, PickBan, WardEvent, Objective } from '@/types/dota'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const matchId = parseInt(id)

  if (isNaN(matchId)) {
    return NextResponse.json(
        { error: 'Invalid match ID' },
        { status: 400 }
    )
  }

  try {
    const matchDetails = await getCached<MatchDetails>(
        `matches:details:${matchId}`,
        async () => {
          const match = await openDotaClient.getMatch(matchId)

          // Process players
          const players: MatchPlayer[] = match.players.map(p => ({
            accountId: p.account_id,
            playerSlot: p.player_slot,
            heroId: p.hero_id,
            heroName: HEROES[p.hero_id]?.localizedName || `Hero ${p.hero_id}`,
            isRadiant: p.isRadiant,
            kills: p.kills,
            deaths: p.deaths,
            assists: p.assists,
            lastHits: p.last_hits,
            denies: p.denies,
            goldPerMin: p.gold_per_min,
            xpPerMin: p.xp_per_min,
            heroDamage: p.hero_damage,
            towerDamage: p.tower_damage,
            heroHealing: p.hero_healing,
            level: p.level,
            items: [p.item_0, p.item_1, p.item_2, p.item_3, p.item_4, p.item_5],
            backpack: [p.backpack_0, p.backpack_1, p.backpack_2],
            lanePos: p.lane_pos,
            obsLog: p.obs_log?.map(w => ({
              time: w.time,
              type: 'observer' as const,
              x: w.x,
              y: w.y,
              player: p.player_slot,
              entityleft: w.entityleft,
            })),
            senLog: p.sen_log?.map(w => ({
              time: w.time,
              type: 'sentry' as const,
              x: w.x,
              y: w.y,
              player: p.player_slot,
              entityleft: w.entityleft,
            })),
          }))

          // Process pick/bans
          const pickBans: PickBan[] = (match.picks_bans || []).map(pb => ({
            heroId: pb.hero_id,
            heroName: HEROES[pb.hero_id]?.localizedName || `Hero ${pb.hero_id}`,
            isPick: pb.is_pick,
            team: pb.team === 0 ? 'radiant' : 'dire',
            order: pb.order,
          }))

          // Process objectives
          const objectives: Objective[] = (match.objectives || []).map(o => ({
            time: o.time,
            type: o.type,
            team: o.team === 2 ? 'radiant' : o.team === 3 ? 'dire' : undefined,
            slot: o.slot,
            key: o.key,
          }))

          return {
            matchId: match.match_id,
            leagueName: '',
            leagueId: match.leagueid,
            radiantTeamId: match.radiant_team?.team_id || 0,
            radiantTeamName: match.radiant_team?.name || 'Radiant',
            radiantTeamLogo: match.radiant_team?.logo_url || '',
            direTeamId: match.dire_team?.team_id || 0,
            direTeamName: match.dire_team?.name || 'Dire',
            direTeamLogo: match.dire_team?.logo_url || '',
            radiantWin: match.radiant_win,
            duration: match.duration,
            startTime: match.start_time,
            gameMode: match.game_mode,
            radiantScore: match.radiant_score,
            direScore: match.dire_score,
            players,
            pickBans,
            objectives,
            radiantGoldAdv: match.radiant_gold_adv,
            radiantXpAdv: match.radiant_xp_adv,
          }
        },
        CACHE_TTL.MATCH_DETAILS
    )

    return NextResponse.json(matchDetails)
  } catch (error) {
    console.error(`[API] Match ${matchId} details error:`, error)
    return NextResponse.json(
        { error: 'Failed to fetch match details' },
        { status: 500 }
    )
  }
}