import { GraphQLClient } from 'graphql-request'

const STRATZ_API_URL = 'https://api.stratz.com/graphql'

/**
 * STRATZ GraphQL client for pro match statistics
 * Requires STRATZ_API_KEY environment variable
 */
export function createStratzClient() {
  const apiKey = process.env.STRATZ_API_KEY

  if (!apiKey) {
    console.warn('[STRATZ] API key not found, using demo mode')
  }

  return new GraphQLClient(STRATZ_API_URL, {
    headers: apiKey ? {
      'Authorization': `Bearer ${apiKey}`,
      'User-Agent': 'Dota2ProAnalytics/1.0',
    } : {},
  })
}

// GraphQL Queries

export const HERO_STATS_QUERY = `
  query HeroStats($take: Int) {
    heroStats {
      stats(take: $take, bracketIds: [PROFESSIONAL]) {
        heroId
        matchCount
        winCount
      }
    }
  }
`

export const PRO_MATCHES_QUERY = `
  query ProMatches($take: Int, $skip: Int) {
    proMatches(take: $take, skip: $skip) {
      id
      startDateTime
      durationSeconds
      radiantTeam {
        id
        name
        logo
      }
      direTeam {
        id
        name
        logo
      }
      league {
        id
        displayName
        tier
      }
      didRadiantWin
      radiantKills
      direKills
      players {
        heroId
        isRadiant
        kills
        deaths
        assists
        networth
        goldPerMinute
        experiencePerMinute
        level
      }
      pickBans {
        heroId
        isPick
        order
        team
        bannedHeroId
      }
    }
  }
`

export const HERO_DETAILS_QUERY = `
  query HeroDetails($heroId: Short!) {
    heroStats {
      stats(heroIds: [$heroId], bracketIds: [PROFESSIONAL]) {
        heroId
        matchCount
        winCount
      }
      itemPurchase(heroIds: [$heroId], bracketIds: [PROFESSIONAL], take: 20) {
        heroId
        itemId
        wins
        matchCount
        time
        instance
      }
      laneOutcome(heroIds: [$heroId], bracketIds: [PROFESSIONAL]) {
        heroId
        laneId
        matchCount
        winCount
      }
    }
    constants {
      hero(id: $heroId) {
        id
        name
        displayName
        shortName
        abilities {
          id
          name
          language {
            displayName
          }
        }
      }
    }
  }
`

export const LEAGUES_QUERY = `
  query Leagues($tiers: [LeagueTier]) {
    leagues(tiers: $tiers, take: 50) {
      id
      displayName
      tier
      region
      startDateTime
      endDateTime
      prizePool
      hasLiveMatches
    }
  }
`

export const DRAFT_STATS_QUERY = `
  query DraftStats($leagueId: Int, $take: Int) {
    heroStats {
      stats(leagueId: $leagueId, take: $take, bracketIds: [PROFESSIONAL]) {
        heroId
        matchCount
        winCount
      }
    }
    league(id: $leagueId) {
      id
      displayName
      matches(take: 100) {
        id
        pickBans {
          heroId
          isPick
          order
          team
        }
      }
    }
  }
`

export const ABILITY_BUILD_QUERY = `
  query AbilityBuild($heroId: Short!) {
    heroStats {
      abilityMaxLevel(heroIds: [$heroId], bracketIds: [PROFESSIONAL]) {
        heroId
        abilityId
        level
        matchCount
        winCount
      }
    }
  }
`

// Types for STRATZ responses

export interface StratzHeroStat {
  heroId: number
  matchCount: number
  winCount: number
}

export interface StratzProMatch {
  id: number
  startDateTime: number
  durationSeconds: number
  radiantTeam: {
    id: number
    name: string
    logo: string
  } | null
  direTeam: {
    id: number
    name: string
    logo: string
  } | null
  league: {
    id: number
    displayName: string
    tier: string
  } | null
  didRadiantWin: boolean
  radiantKills: number
  direKills: number
  players: StratzPlayer[]
  pickBans: StratzPickBan[]
}

export interface StratzPlayer {
  heroId: number
  isRadiant: boolean
  kills: number
  deaths: number
  assists: number
  networth: number
  goldPerMinute: number
  experiencePerMinute: number
  level: number
}

export interface StratzPickBan {
  heroId: number
  isPick: boolean
  order: number
  team: number
  bannedHeroId?: number
}

export interface StratzItemPurchase {
  heroId: number
  itemId: number
  wins: number
  matchCount: number
  time: number
  instance: number
}

export interface StratzLeague {
  id: number
  displayName: string
  tier: string
  region: string
  startDateTime: number
  endDateTime: number
  prizePool: number
  hasLiveMatches: boolean
}

export interface StratzAbilityLevel {
  heroId: number
  abilityId: number
  level: number
  matchCount: number
  winCount: number
}

// Response types

export interface HeroStatsResponse {
  heroStats: {
    stats: StratzHeroStat[]
  }
}

export interface ProMatchesResponse {
  proMatches: StratzProMatch[]
}

export interface HeroDetailsResponse {
  heroStats: {
    stats: StratzHeroStat[]
    itemPurchase: StratzItemPurchase[]
    laneOutcome: Array<{
      heroId: number
      laneId: number
      matchCount: number
      winCount: number
    }>
  }
  constants: {
    hero: {
      id: number
      name: string
      displayName: string
      shortName: string
      abilities: Array<{
        id: number
        name: string
        language: {
          displayName: string
        }
      }>
    }
  }
}

export interface LeaguesResponse {
  leagues: StratzLeague[]
}

export interface DraftStatsResponse {
  heroStats: {
    stats: StratzHeroStat[]
  }
  league: {
    id: number
    displayName: string
    matches: Array<{
      id: number
      pickBans: StratzPickBan[]
    }>
  }
}

export interface AbilityBuildResponse {
  heroStats: {
    abilityMaxLevel: StratzAbilityLevel[]
  }
}
