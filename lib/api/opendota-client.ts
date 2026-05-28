const OPENDOTA_API_BASE = 'https://api.opendota.com/api'

// Rate limiting: 60 requests per minute
// We'll implement simple request tracking

/**
 * OpenDota API client for match data, positions, and wards
 */
export class OpenDotaClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = OPENDOTA_API_BASE
  }

  private async request<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 300 }, // 5 min cache at edge
    })

    if (!response.ok) {
      throw new Error(`OpenDota API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Get list of professional matches
   */
  async getProMatches(limit = 100): Promise<ProMatchResponse[]> {
    return this.request<ProMatchResponse[]>(`/proMatches?limit=${limit}`)
  }

  /**
   * Get detailed match data including player positions and ward logs
   */
  async getMatch(matchId: number): Promise<MatchResponse> {
    return this.request<MatchResponse>(`/matches/${matchId}`)
  }

  /**
   * Get match timeseries data (gold, xp, lh over time)
   */
  async getMatchTimeseries(matchId: number): Promise<TimeseriesResponse[]> {
    return this.request<TimeseriesResponse[]>(`/matches/${matchId}/timeseries`)
  }

  /**
   * Get hero stats
   */
  async getHeroStats(): Promise<HeroStatsResponse[]> {
    return this.request<HeroStatsResponse[]>('/heroStats')
  }

  /**
   * Get public matches for a specific hero
   */
  async getHeroMatches(heroId: number, limit = 20): Promise<PublicMatchResponse[]> {
    return this.request<PublicMatchResponse[]>(`/heroes/${heroId}/matches?limit=${limit}`)
  }

  /**
   * Get hero matchups (counter data)
   */
  async getHeroMatchups(heroId: number): Promise<HeroMatchupResponse[]> {
    return this.request<HeroMatchupResponse[]>(`/heroes/${heroId}/matchups`)
  }

  /**
   * Get leagues (tournaments)
   */
  async getLeagues(): Promise<LeagueResponse[]> {
    return this.request<LeagueResponse[]>('/leagues')
  }

  /**
   * Get hero matches with item and ability data
   */
  async getHeroMatchesWithDetails(heroId: number, limit = 100): Promise<DetailedMatchResponse[]> {
    return this.request<DetailedMatchResponse[]>(`/heroes/${heroId}/matches?limit=${limit}`)
  }

  /**
   * Get constants items
   */
  async getItems(): Promise<Record<string, ItemConstant>> {
    return this.request<Record<string, ItemConstant>>('/constants/items')
  }

  /**
   * Get constants abilities
   */
  async getAbilities(): Promise<Record<string, AbilityConstant>> {
    return this.request<Record<string, AbilityConstant>>('/constants/abilities')
  }
}

// Response types
export interface ProMatchResponse {
  match_id: number
  duration: number
  start_time: number
  radiant_team_id: number
  radiant_name: string
  dire_team_id: number
  dire_name: string
  leagueid: number
  league_name: string
  series_id: number
  series_type: number
  radiant_score: number
  dire_score: number
  radiant_win: boolean
}

export interface MatchResponse {
  match_id: number
  barracks_status_dire: number
  barracks_status_radiant: number
  chat: unknown[]
  cluster: number
  cosmetics: unknown[]
  dire_score: number
  dire_team: {
    team_id: number
    name: string
    logo_url: string
  }
  duration: number
  engine: number
  first_blood_time: number
  game_mode: number
  human_players: number
  leagueid: number
  lobby_type: number
  match_seq_num: number
  negative_votes: number
  objectives: ObjectiveResponse[]
  picks_bans: PickBanResponse[]
  positive_votes: number
  radiant_gold_adv: number[]
  radiant_score: number
  radiant_team: {
    team_id: number
    name: string
    logo_url: string
  }
  radiant_win: boolean
  radiant_xp_adv: number[]
  skill: number
  start_time: number
  teamfights: unknown[]
  tower_status_dire: number
  tower_status_radiant: number
  version: number
  replay_salt: number
  series_id: number
  series_type: number
  players: PlayerResponse[]
  patch: number
  region: number
  replay_url: string
}

export interface PlayerResponse {
  match_id: number
  player_slot: number
  ability_upgrades_arr: number[]
  account_id: number
  assists: number
  backpack_0: number
  backpack_1: number
  backpack_2: number
  deaths: number
  denies: number
  gold: number
  gold_per_min: number
  gold_spent: number
  hero_damage: number
  hero_healing: number
  hero_id: number
  item_0: number
  item_1: number
  item_2: number
  item_3: number
  item_4: number
  item_5: number
  item_neutral: number
  kills: number
  last_hits: number
  level: number
  net_worth: number
  tower_damage: number
  xp_per_min: number
  personaname: string
  name: string
  isRadiant: boolean
  win: number
  lose: number
  total_gold: number
  total_xp: number
  kda: number
  // Position data (available if parsed)
  lane_pos?: Record<string, Record<string, number>>
  obs_log?: WardLogEntry[]
  sen_log?: WardLogEntry[]
  obs_placed?: number
  sen_placed?: number
  // Additional
  purchase_log?: PurchaseLogEntry[]
  kills_log?: KillLogEntry[]
  // Time series data
  gold_t?: Array<{ time: number; gold: number }>
  xp_t?: Array<{ time: number; xp: number }>
  lh_t?: Array<{ time: number; lh: number }>
}

export interface WardLogEntry {
  time: number
  type?: string
  key?: string
  slot?: number
  x: number
  y: number
  z?: number
  entityleft?: boolean
  ehandle?: number
  player_slot?: number
}

export interface PurchaseLogEntry {
  time: number
  key: string
}

export interface KillLogEntry {
  time: number
  key: string
}

export interface PickBanResponse {
  is_pick: boolean
  hero_id: number
  team: number
  order: number
  match_id?: number
}

export interface ObjectiveResponse {
  time: number
  type: string
  slot?: number
  key?: string
  player_slot?: number
  team?: number
  unit?: string
}

export interface HeroStatsResponse {
  id: number
  name: string
  localized_name: string
  primary_attr: string
  attack_type: string
  roles: string[]
  img: string
  icon: string
  base_health: number
  base_health_regen: number
  base_mana: number
  base_mana_regen: number
  base_armor: number
  base_mr: number
  base_attack_min: number
  base_attack_max: number
  base_str: number
  base_agi: number
  base_int: number
  str_gain: number
  agi_gain: number
  int_gain: number
  attack_range: number
  projectile_speed: number
  attack_rate: number
  move_speed: number
  turn_rate: number
  pro_pick?: number
  pro_win?: number
  pro_ban?: number
  '1_pick'?: number
  '1_win'?: number
  '2_pick'?: number
  '2_win'?: number
  '3_pick'?: number
  '3_win'?: number
  '4_pick'?: number
  '4_win'?: number
  '5_pick'?: number
  '5_win'?: number
  '6_pick'?: number
  '6_win'?: number
  '7_pick'?: number
  '7_win'?: number
  '8_pick'?: number
  '8_win'?: number
}

export interface HeroMatchupResponse {
  hero_id: number
  games_played: number
  wins: number
}

export interface PublicMatchResponse {
  match_id: number
  player_slot: number
  radiant_win: boolean
  duration: number
  game_mode: number
  lobby_type: number
  hero_id: number
  start_time: number
  version: number
  kills: number
  deaths: number
  assists: number
}

export interface LeagueResponse {
  leagueid: number
  ticket: string
  banner: string
  tier: string
  name: string
}

export interface DetailedMatchResponse extends PublicMatchResponse {
  ability_upgrades?: AbilityUpgrade[]
  item_0: number
  item_1: number
  item_2: number
  item_3: number
  item_4: number
  item_5: number
  backpack_0: number
  backpack_1: number
  backpack_2: number
  purchase_log?: PurchaseLogEntry[]
  kills_log?: KillLogEntry[]
  lane_pos?: Record<string, Record<string, number>>
}

export interface AbilityUpgrade {
  ability: number
  time: number
  level: number
}

export interface ItemConstant {
  id: number
  img: string
  dname: string
  qual: string
  cost: number
  desc?: string
  attrib?: Array<{ key: string; value: string | number; display?: string }>
  mc: boolean | number
  cd: boolean | number
  lore?: string
  components?: string[] | null
  created: boolean
  charges?: boolean | number
}

export interface AbilityConstant {
  id: number
  img: string
  dname: string
  description?: string
  behavior?: string | string[]
  dmg_type?: string
  bkbpierce?: string
  target_type?: string
  dispellable?: string
  notes?: string
  attrib?: Array<{ key: string; value: string | number; display?: string }>
  mc: boolean | number
  hc: boolean | number
  cd: boolean | number
  lore?: string
}

// Export singleton instance
export const openDotaClient = new OpenDotaClient()