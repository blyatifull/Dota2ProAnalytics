import { NextResponse } from 'next/server'
import { openDotaClient } from '@/lib/api/opendota-client'
import { getCached, CACHE_TTL } from '@/lib/redis'
import type { ProMatch } from '@/types/dota'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

  try {
    const matches = await getCached<ProMatch[]>(
      `matches:pro:${limit}`,
      async () => {
        const rawMatches = await openDotaClient.getProMatches(limit)
        
        return rawMatches.map(m => ({
          matchId: m.match_id,
          leagueName: m.league_name || 'Unknown League',
          leagueId: m.leagueid,
          radiantTeamId: m.radiant_team_id,
          radiantTeamName: m.radiant_name || 'Radiant',
          radiantTeamLogo: '',
          direTeamId: m.dire_team_id,
          direTeamName: m.dire_name || 'Dire',
          direTeamLogo: '',
          radiantWin: m.radiant_win,
          duration: m.duration,
          startTime: m.start_time,
          gameMode: 2, // Captain's Mode typically
          radiantScore: m.radiant_score,
          direScore: m.dire_score,
        }))
      },
      CACHE_TTL.MATCH_LIST
    )

    return NextResponse.json({ matches })
  } catch (error) {
    console.error('[API] Pro matches error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pro matches' },
      { status: 500 }
    )
  }
}
