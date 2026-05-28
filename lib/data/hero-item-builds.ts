// Static fallback data for hero item builds
// This provides default builds when OpenDota API is unavailable

import type { ItemBuild, AbilityLevel } from '@/types/dota'

export interface HeroItemBuildData {
  itemBuilds: ItemBuild[]
  abilityBuild: AbilityLevel[]
}

// Common items by phase
const STARTING_ITEMS = [
  { id: 29, name: 'Boots of Speed', img: 'items/boots' },
  { id: 42, name: 'Town Portal Scroll', img: 'items/tpscroll' },
  { id: 36, name: 'Magic Wand', img: 'items/magic_wand' },
  { id: 185, name: 'Orb of Venom', img: 'items/orb_of_venom' },
  { id: 37, name: 'Bracer', img: 'items/bracer' },
  { id: 38, name: 'Wraith Band', img: 'items/wraith_band' },
  { id: 39, name: 'Null Talisman', img: 'items/null_talisman' },
]

const EARLY_GAME = [
  { id: 50, name: 'Power Treads', img: 'items/power_treads' },
  { id: 57, name: 'Phase Boots', img: 'items/phase_boots' },
  { id: 102, name: 'Arcane Boots', img: 'items/arcane_boots' },
  { id: 63, name: 'Bottle', img: 'items/bottle' },
  { id: 116, name: 'Black King Bar', img: 'items/black_king_bar' },
  { id: 1, name: 'Blink Dagger', img: 'items/blink' },
  { id: 108, name: 'Magic Stick', img: 'items/magic_stick' },
]

const MID_GAME = [
  { id: 123, name: 'Battle Fury', img: 'items/battle_fury' },
  { id: 139, name: 'Butterfly', img: 'items/butterfly' },
  { id: 149, name: 'Manta Style', img: 'items/manta' },
  { id: 152, name: 'Scythe of Vyse', img: 'items/scythe' },
  { id: 154, name: "Shiva's Guard", img: 'items/shivas_guard' },
  { id: 158, name: 'Satanic', img: 'items/satanic' },
  { id: 147, name: 'Bloodstone', img: 'items/bloodstone' },
]

const LATE_GAME = [
  { id: 141, name: 'Daedalus', img: 'items/daedalus' },
  { id: 143, name: 'Divine Rapier', img: 'items/divine_rapier' },
  { id: 148, name: 'Heart of Tarrasque', img: 'items/heart' },
  { id: 156, name: 'Abyssal Blade', img: 'items/abyssal_blade' },
  { id: 168, name: 'Refresher Orb', img: 'items/refresher_orb' },
  { id: 232, name: 'Octarine Core', img: 'items/octarine_core' },
  { id: 263, name: 'Hurricane Pike', img: 'items/hurricane_pike' },
]

function createItemBuild(
  itemId: number,
  itemName: string,
  itemIcon: string,
  phase: 'early' | 'mid' | 'late',
  baseWins: number,
  baseMatches: number,
  avgTime: number
): ItemBuild {
  return {
    itemId,
    itemName,
    itemIcon: `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/${itemIcon}`,
    wins: baseWins,
    matches: baseMatches,
    winRate: (baseWins / baseMatches) * 100,
    avgTime,
    phase,
  }
}

// Generic builds by role
const CARRY_BUILD: ItemBuild[] = [
  ...STARTING_ITEMS.map(i => createItemBuild(i.id, i.name, i.img, 'early', 45, 100, 300)),
  ...EARLY_GAME.slice(0, 3).map(i => createItemBuild(i.id, i.name, i.img, 'early', 40, 80, 600)),
  ...MID_GAME.slice(0, 4).map(i => createItemBuild(i.id, i.name, i.img, 'mid', 35, 60, 1200)),
  ...LATE_GAME.slice(0, 4).map(i => createItemBuild(i.id, i.name, i.img, 'late', 25, 40, 2000)),
]

const MID_BUILD: ItemBuild[] = [
  ...STARTING_ITEMS.map(i => createItemBuild(i.id, i.name, i.img, 'early', 45, 100, 300)),
  ...EARLY_GAME.slice(1, 4).map(i => createItemBuild(i.id, i.name, i.img, 'early', 40, 80, 550)),
  ...MID_GAME.slice(2, 6).map(i => createItemBuild(i.id, i.name, i.img, 'mid', 35, 60, 1100)),
  ...LATE_GAME.slice(0, 3).map(i => createItemBuild(i.id, i.name, i.img, 'late', 25, 40, 1800)),
]

const OFFLANE_BUILD: ItemBuild[] = [
  ...STARTING_ITEMS.map(i => createItemBuild(i.id, i.name, i.img, 'early', 45, 100, 300)),
  ...EARLY_GAME.slice(3, 6).map(i => createItemBuild(i.id, i.name, i.img, 'early', 40, 80, 500)),
  ...MID_GAME.slice(4, 7).map(i => createItemBuild(i.id, i.name, i.img, 'mid', 35, 60, 1000)),
  ...LATE_GAME.slice(3, 6).map(i => createItemBuild(i.id, i.name, i.img, 'late', 25, 40, 1700)),
]

const SUPPORT_BUILD: ItemBuild[] = [
  ...STARTING_ITEMS.map(i => createItemBuild(i.id, i.name, i.img, 'early', 45, 100, 250)),
  ...EARLY_GAME.slice(0, 2).map(i => createItemBuild(i.id, i.name, i.img, 'early', 40, 80, 450)),
  ...MID_GAME.slice(4, 6).map(i => createItemBuild(i.id, i.name, i.img, 'mid', 35, 60, 900)),
  ...LATE_GAME.slice(5, 7).map(i => createItemBuild(i.id, i.name, i.img, 'late', 25, 40, 1600)),
]

// Default ability build order (generic pattern)
const DEFAULT_ABILITY_BUILD: AbilityLevel[] = [
  { abilityId: 5001, abilityName: 'Primary Skill', level: 1, order: 1 },
  { abilityId: 5002, abilityName: 'Secondary Skill', level: 1, order: 2 },
  { abilityId: 5001, abilityName: 'Primary Skill', level: 2, order: 3 },
  { abilityId: 5003, abilityName: 'Utility Skill', level: 1, order: 4 },
  { abilityId: 5001, abilityName: 'Primary Skill', level: 3, order: 5 },
  { abilityId: 5004, abilityName: 'Ultimate', level: 1, order: 6 },
  { abilityId: 5001, abilityName: 'Primary Skill', level: 4, order: 7 },
  { abilityId: 5002, abilityName: 'Secondary Skill', level: 2, order: 8 },
  { abilityId: 5002, abilityName: 'Secondary Skill', level: 3, order: 9 },
  { abilityId: 5002, abilityName: 'Secondary Skill', level: 4, order: 10 },
  { abilityId: 5004, abilityName: 'Ultimate', level: 2, order: 11 },
  { abilityId: 5003, abilityName: 'Utility Skill', level: 2, order: 12 },
  { abilityId: 5003, abilityName: 'Utility Skill', level: 3, order: 13 },
  { abilityId: 5003, abilityName: 'Utility Skill', level: 4, order: 14 },
  { abilityId: 5004, abilityName: 'Ultimate', level: 3, order: 15 },
]

// Map hero IDs to their preferred builds
const HERO_BUILDS: Record<number, { itemBuilds: ItemBuild[], abilityBuild: AbilityLevel[] }> = {
  // Carry heroes
  1: { itemBuilds: CARRY_BUILD, abilityBuild: DEFAULT_ABILITY_BUILD }, // Antimage
  8: { itemBuilds: CARRY_BUILD, abilityBuild: DEFAULT_ABILITY_BUILD }, // Juggernaut
  11: { itemBuilds: CARRY_BUILD, abilityBuild: DEFAULT_ABILITY_BUILD }, // Shadow Fiend
  59: { itemBuilds: CARRY_BUILD, abilityBuild: DEFAULT_ABILITY_BUILD }, // Huskar
  73: { itemBuilds: CARRY_BUILD, abilityBuild: DEFAULT_ABILITY_BUILD }, // Alchemist
  
  // Mid heroes
  11: { itemBuilds: MID_BUILD, abilityBuild: DEFAULT_ABILITY_BUILD }, // Shadow Fiend
  74: { itemBuilds: MID_BUILD, abilityBuild: DEFAULT_ABILITY_BUILD }, // Invoker
  106: { itemBuilds: MID_BUILD, abilityBuild: DEFAULT_ABILITY_BUILD }, // Ember Spirit
  
  // Offlane heroes
  2: { itemBuilds: OFFLANE_BUILD, abilityBuild: DEFAULT_ABILITY_BUILD }, // Axe
  16: { itemBuilds: OFFLANE_BUILD, abilityBuild: DEFAULT_ABILITY_BUILD }, // Pudge
  97: { itemBuilds: OFFLANE_BUILD, abilityBuild: DEFAULT_ABILITY_BUILD }, // Magnus
  
  // Support heroes
  5: { itemBuilds: SUPPORT_BUILD, abilityBuild: DEFAULT_ABILITY_BUILD }, // Crystal Maiden
  31: { itemBuilds: SUPPORT_BUILD, abilityBuild: DEFAULT_ABILITY_BUILD }, // Lich
  105: { itemBuilds: SUPPORT_BUILD, abilityBuild: DEFAULT_ABILITY_BUILD }, // Earth Spirit
}

export function getHeroBuildData(heroId: number): HeroItemBuildData | null {
  return HERO_BUILDS[heroId] || null
}

export function getGenericBuildByRole(role: string): HeroItemBuildData {
  switch (role.toLowerCase()) {
    case 'carry':
    case 'core':
      return { itemBuilds: CARRY_BUILD, abilityBuild: DEFAULT_ABILITY_BUILD }
    case 'mid':
      return { itemBuilds: MID_BUILD, abilityBuild: DEFAULT_ABILITY_BUILD }
    case 'offlane':
    case 'initiator':
      return { itemBuilds: OFFLANE_BUILD, abilityBuild: DEFAULT_ABILITY_BUILD }
    case 'support':
    default:
      return { itemBuilds: SUPPORT_BUILD, abilityBuild: DEFAULT_ABILITY_BUILD }
  }
}
