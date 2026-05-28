// Hero types
export interface Hero {
  id: number
  name: string
  localizedName: string
  primaryAttr: 'str' | 'agi' | 'int' | 'all'
  attackType: 'Melee' | 'Ranged'
  roles: string[]
  img: string
  icon: string
}

export interface HeroStats {
  heroId: number
  matchCount: number
  winCount: number
  pickCount: number
  banCount: number
  winRate: number
  pickRate: number
  banRate: number
}

export interface HeroDetails extends HeroStats {
  hero: Hero
  itemBuilds: ItemBuild[]
  abilityBuild: AbilityLevel[]
  matchups: HeroMatchup[]
}

export interface ItemBuild {
  itemId: number
  itemName: string
  itemIcon: string
  wins: number
  matches: number
  winRate: number
  avgTime: number // average purchase time in minutes
  phase: 'early' | 'mid' | 'late'
}

export interface AbilityLevel {
  abilityId: number
  abilityName: string
  level: number
  order: number
}

export interface HeroMatchup {
  heroId: number
  heroName: string
  matchCount: number
  winRate: number
  advantage: number
}

// Match types
export interface ProMatch {
  matchId: number
  leagueName: string
  leagueId: number
  radiantTeamId: number
  radiantTeamName: string
  radiantTeamLogo: string
  direTeamId: number
  direTeamName: string
  direTeamLogo: string
  radiantWin: boolean
  duration: number
  startTime: number
  gameMode: number
  radiantScore: number
  direScore: number
}

export interface MatchDetails extends ProMatch {
  players: MatchPlayer[]
  pickBans: PickBan[]
  objectives: Objective[]
  radiantGoldAdv?: number[]
  radiantXpAdv?: number[]
}

export interface MatchPlayer {
  accountId: number
  playerSlot: number
  heroId: number
  heroName: string
  isRadiant: boolean
  kills: number
  deaths: number
  assists: number
  lastHits: number
  denies: number
  goldPerMin: number
  xpPerMin: number
  heroDamage: number
  towerDamage: number
  heroHealing: number
  level: number
  items: number[]
  backpack: number[]
  // Position data
  lanePos?: Record<string, Record<string, number>>
  obsLog?: WardEvent[]
  senLog?: WardEvent[]
}

export interface WardEvent {
  time: number
  type: 'observer' | 'sentry'
  x: number
  y: number
  player: number
  entityleft?: boolean
}

export interface PickBan {
  heroId: number
  heroName: string
  isPick: boolean
  team: 'radiant' | 'dire'
  order: number
}

export interface Objective {
  time: number
  type: string
  team?: 'radiant' | 'dire'
  slot?: number
  key?: string
}

// Draft analytics types
export interface DraftStats {
  heroId: number
  heroName: string
  heroIcon: string
  matchCount: number
  winCount: number
  pickCount: number
  banCount: number
  winRate: number
  pickRate: number
  banRate: number
  contestRate: number // pick + ban rate
}

export interface LeagueInfo {
  leagueId: number
  name: string
  tier: 'premium' | 'professional' | 'amateur'
  startDate: number
  endDate: number
  region?: string
}

// Map coordinates types
export interface MapPosition {
  x: number
  y: number
  time: number
}

export interface PlayerTrajectory {
  playerId: number
  heroId: number
  heroName: string
  isRadiant: boolean
  positions: MapPosition[]
}

// API response types
export interface StratzHeroStatsResponse {
  heroStats: {
    stats: Array<{
      heroId: number
      matchCount: number
      winCount: number
      pickCount: number
      banCount: number
    }>
  }
}

export interface OpenDotaMatchResponse {
  match_id: number
  radiant_win: boolean
  duration: number
  start_time: number
  radiant_team: {
    team_id: number
    name: string
    logo_url: string
  }
  dire_team: {
    team_id: number
    name: string
    logo_url: string
  }
  players: Array<{
    account_id: number
    player_slot: number
    hero_id: number
    isRadiant: boolean
    kills: number
    deaths: number
    assists: number
    last_hits: number
    denies: number
    gold_per_min: number
    xp_per_min: number
    hero_damage: number
    tower_damage: number
    hero_healing: number
    level: number
    item_0: number
    item_1: number
    item_2: number
    item_3: number
    item_4: number
    item_5: number
    backpack_0: number
    backpack_1: number
    backpack_2: number
    lane_pos?: Record<string, Record<string, number>>
    obs_log?: Array<{
      time: number
      x: number
      y: number
      entityleft?: boolean
    }>
    sen_log?: Array<{
      time: number
      x: number
      y: number
      entityleft?: boolean
    }>
  }>
  picks_bans?: Array<{
    hero_id: number
    is_pick: boolean
    team: number
    order: number
  }>
}