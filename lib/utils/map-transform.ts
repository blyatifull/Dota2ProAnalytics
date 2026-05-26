// Dota 2 map coordinate transformation utilities
// 
// OpenDota API ward coordinates come in a special format:
// The x,y values are already scaled coordinates (0-255 range typically)
// or actual game coordinates depending on the data source.
//
// Game world coordinates: approximately -8288 to 8288
// OpenDota parsed replay coordinates: vary based on parsing version

// Canvas/display size (square map)
export const MAP_SIZE = 512

// Game coordinate bounds
const GAME_MIN = -8288
const GAME_MAX = 8288
const GAME_RANGE = GAME_MAX - GAME_MIN // 16576

// OpenDota coordinate bounds (from parsed replays)
// Ward logs use scaled coordinates in the range ~60-190
const OPENDOTA_MIN = 64
const OPENDOTA_MAX = 192
const OPENDOTA_RANGE = OPENDOTA_MAX - OPENDOTA_MIN

/**
 * Convert OpenDota ward log coordinates to canvas coordinates
 * OpenDota stores ward positions as scaled grid values (typically 64-192 range)
 * These need to be mapped to our canvas size
 */
export function wardLogToCanvas(x: number, y: number): { x: number; y: number } {
  // OpenDota ward coordinates are in ~64-192 range
  // We need to normalize and scale to canvas
  
  // Handle the case where coordinates might be in game world format
  if (Math.abs(x) > 1000 || Math.abs(y) > 1000) {
    // These are game world coordinates
    return gameToCanvas(x, y)
  }
  
  // Normalize from OpenDota range to 0-1
  const normalizedX = (x - OPENDOTA_MIN) / OPENDOTA_RANGE
  const normalizedY = (y - OPENDOTA_MIN) / OPENDOTA_RANGE
  
  // Scale to canvas size
  // Y is inverted because canvas Y increases downward but game Y increases upward
  return {
    x: Math.max(0, Math.min(MAP_SIZE, normalizedX * MAP_SIZE)),
    y: Math.max(0, Math.min(MAP_SIZE, (1 - normalizedY) * MAP_SIZE)),
  }
}

/**
 * Convert Dota 2 game coordinates to canvas/display coordinates
 * Game: (-8288, -8288) to (8288, 8288)
 * Canvas: (0, 0) to (MAP_SIZE, MAP_SIZE)
 * Note: Y is inverted in canvas
 */
export function gameToCanvas(gameX: number, gameY: number): { x: number; y: number } {
  const x = ((gameX - GAME_MIN) / GAME_RANGE) * MAP_SIZE
  const y = MAP_SIZE - ((gameY - GAME_MIN) / GAME_RANGE) * MAP_SIZE // Y inverted
  return { 
    x: Math.max(0, Math.min(MAP_SIZE, x)), 
    y: Math.max(0, Math.min(MAP_SIZE, y)) 
  }
}

/**
 * Convert canvas coordinates back to game coordinates
 */
export function canvasToGame(canvasX: number, canvasY: number): { x: number; y: number } {
  const x = (canvasX / MAP_SIZE) * GAME_RANGE + GAME_MIN
  const y = ((MAP_SIZE - canvasY) / MAP_SIZE) * GAME_RANGE + GAME_MIN
  return { x, y }
}

/**
 * Convert OpenDota lane_pos keys to canvas coordinates
 * lane_pos format: { "128": { "120": count } } where keys are grid cells
 * Grid is 128x128 cells covering the map (for legacy data)
 * Or 192 cells for newer data
 */
export function lanePosCellToCanvas(cellX: number, cellY: number): { x: number; y: number } {
  // Determine grid size based on max cell value seen
  const gridSize = Math.max(cellX, cellY) <= 128 ? 128 : 192
  
  const x = (cellX / gridSize) * MAP_SIZE
  const y = MAP_SIZE - (cellY / gridSize) * MAP_SIZE
  return { x, y }
}

/**
 * Parse lane_pos data from OpenDota into position array
 */
export function parseLanePos(lanePos: Record<string, Record<string, number>> | undefined): Array<{ x: number; y: number; intensity: number }> {
  if (!lanePos) return []
  
  const positions: Array<{ x: number; y: number; intensity: number }> = []
  let maxCount = 0
  
  // First pass: find max count for normalization
  for (const xKey of Object.keys(lanePos)) {
    for (const yKey of Object.keys(lanePos[xKey])) {
      maxCount = Math.max(maxCount, lanePos[xKey][yKey])
    }
  }
  
  // Second pass: convert to positions
  for (const xKey of Object.keys(lanePos)) {
    for (const yKey of Object.keys(lanePos[xKey])) {
      const cellX = parseInt(xKey)
      const cellY = parseInt(yKey)
      const count = lanePos[xKey][yKey]
      const { x, y } = lanePosCellToCanvas(cellX, cellY)
      positions.push({ x, y, intensity: maxCount > 0 ? count / maxCount : 0 })
    }
  }
  
  return positions
}

/**
 * Convert game time (seconds) to display format (mm:ss)
 */
export function formatGameTime(seconds: number): string {
  const negative = seconds < 0
  const absSeconds = Math.abs(Math.floor(seconds))
  const mins = Math.floor(absSeconds / 60)
  const secs = absSeconds % 60
  return `${negative ? '-' : ''}${mins}:${secs.toString().padStart(2, '0')}`
}

/**
 * Team colors for map display
 */
export const TEAM_COLORS = {
  radiant: '#22C55E', // green
  dire: '#DC2626',    // red (dire)
}

/**
 * Ward icon colors
 */
export const WARD_COLORS = {
  observer: '#FBBF24', // yellow/gold for obs
  sentry: '#3B82F6',   // blue for sentry
}

/**
 * Get color with alpha
 */
export function withAlpha(color: string, alpha: number): string {
  // For hex colors
  if (color.startsWith('#')) {
    const hex = color.slice(1)
    const r = parseInt(hex.slice(0, 2), 16)
    const g = parseInt(hex.slice(2, 4), 16)
    const b = parseInt(hex.slice(4, 6), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }
  return color
}
