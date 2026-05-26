'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { wardLogToCanvas, MAP_SIZE, TEAM_COLORS, WARD_COLORS, formatGameTime, withAlpha } from '@/lib/utils/map-transform'
import type { MatchPlayer, WardEvent } from '@/types/dota'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Eye, Crosshair } from 'lucide-react'

interface DotaMapProps {
  players: MatchPlayer[]
  duration: number
  className?: string
}

interface ProcessedWard extends WardEvent {
  heroName: string
  isRadiant: boolean
  canvasX: number
  canvasY: number
}

export function DotaMap({ players, duration, className }: DotaMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [timeRange, setTimeRange] = useState<[number, number]>([0, duration])
  const [showObservers, setShowObservers] = useState(true)
  const [showSentries, setShowSentries] = useState(true)
  const [selectedTeam, setSelectedTeam] = useState<'all' | 'radiant' | 'dire'>('all')
  const [hoveredWard, setHoveredWard] = useState<ProcessedWard | null>(null)
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null)

  // Process and collect all wards from players with pre-computed canvas coordinates
  const allWards: ProcessedWard[] = players.flatMap(p => {
    const wards: ProcessedWard[] = []
    
    if (p.obsLog) {
      wards.push(...p.obsLog.map(w => {
        const { x: canvasX, y: canvasY } = wardLogToCanvas(w.x, w.y)
        return {
          ...w,
          heroName: p.heroName,
          isRadiant: p.isRadiant,
          canvasX,
          canvasY,
        }
      }))
    }
    
    if (p.senLog) {
      wards.push(...p.senLog.map(w => {
        const { x: canvasX, y: canvasY } = wardLogToCanvas(w.x, w.y)
        return {
          ...w,
          heroName: p.heroName,
          isRadiant: p.isRadiant,
          canvasX,
          canvasY,
        }
      }))
    }
    
    return wards
  })

  // Filter wards by time and team
  const filteredWards = allWards.filter(w => {
    const inTimeRange = w.time >= timeRange[0] && w.time <= timeRange[1]
    const matchesTeam = selectedTeam === 'all' || 
      (selectedTeam === 'radiant' && w.isRadiant) ||
      (selectedTeam === 'dire' && !w.isRadiant)
    const matchesType = (w.type === 'observer' && showObservers) || 
      (w.type === 'sentry' && showSentries)
    return inTimeRange && matchesTeam && matchesType
  })

  const drawMap = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas with dark background
    ctx.fillStyle = '#0f0f1a'
    ctx.fillRect(0, 0, MAP_SIZE, MAP_SIZE)

    // Draw subtle grid
    ctx.strokeStyle = '#1a1a2e'
    ctx.lineWidth = 1
    const gridSize = MAP_SIZE / 16
    for (let i = 0; i <= MAP_SIZE; i += gridSize) {
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i, MAP_SIZE)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(0, i)
      ctx.lineTo(MAP_SIZE, i)
      ctx.stroke()
    }

    // Draw river (diagonal)
    const riverGradient = ctx.createLinearGradient(0, MAP_SIZE, MAP_SIZE, 0)
    riverGradient.addColorStop(0, 'rgba(59, 130, 246, 0.1)')
    riverGradient.addColorStop(0.5, 'rgba(59, 130, 246, 0.15)')
    riverGradient.addColorStop(1, 'rgba(59, 130, 246, 0.1)')
    ctx.fillStyle = riverGradient
    ctx.beginPath()
    ctx.moveTo(0, MAP_SIZE - 40)
    ctx.lineTo(40, MAP_SIZE)
    ctx.lineTo(MAP_SIZE, 40)
    ctx.lineTo(MAP_SIZE - 40, 0)
    ctx.closePath()
    ctx.fill()

    // Draw lanes with glow
    ctx.strokeStyle = '#2a2a4a'
    ctx.lineWidth = 4
    ctx.lineCap = 'round'
    
    // Top lane
    ctx.beginPath()
    ctx.moveTo(50, MAP_SIZE - 50)
    ctx.lineTo(50, 50)
    ctx.lineTo(MAP_SIZE - 50, 50)
    ctx.stroke()
    
    // Bottom lane  
    ctx.beginPath()
    ctx.moveTo(50, MAP_SIZE - 50)
    ctx.lineTo(MAP_SIZE - 50, MAP_SIZE - 50)
    ctx.lineTo(MAP_SIZE - 50, 50)
    ctx.stroke()
    
    // Mid lane
    ctx.beginPath()
    ctx.moveTo(50, MAP_SIZE - 50)
    ctx.lineTo(MAP_SIZE - 50, 50)
    ctx.stroke()

    // Draw base indicators with glow
    // Radiant (bottom-left)
    const radiantGradient = ctx.createRadialGradient(60, MAP_SIZE - 60, 0, 60, MAP_SIZE - 60, 50)
    radiantGradient.addColorStop(0, 'rgba(34, 197, 94, 0.4)')
    radiantGradient.addColorStop(1, 'rgba(34, 197, 94, 0)')
    ctx.fillStyle = radiantGradient
    ctx.beginPath()
    ctx.arc(60, MAP_SIZE - 60, 50, 0, Math.PI * 2)
    ctx.fill()
    
    ctx.fillStyle = TEAM_COLORS.radiant
    ctx.font = 'bold 10px Geist, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('RADIANT', 60, MAP_SIZE - 55)
    
    // Dire (top-right)
    const direGradient = ctx.createRadialGradient(MAP_SIZE - 60, 60, 0, MAP_SIZE - 60, 60, 50)
    direGradient.addColorStop(0, 'rgba(220, 38, 38, 0.4)')
    direGradient.addColorStop(1, 'rgba(220, 38, 38, 0)')
    ctx.fillStyle = direGradient
    ctx.beginPath()
    ctx.arc(MAP_SIZE - 60, 60, 50, 0, Math.PI * 2)
    ctx.fill()
    
    ctx.fillStyle = TEAM_COLORS.dire
    ctx.font = 'bold 10px Geist, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('DIRE', MAP_SIZE - 60, 65)

    // Draw wards with improved visuals
    filteredWards.forEach((ward, index) => {
      const x = ward.canvasX
      const y = ward.canvasY
      const isObs = ward.type === 'observer'
      const wardColor = isObs ? WARD_COLORS.observer : WARD_COLORS.sentry
      const teamColor = ward.isRadiant ? TEAM_COLORS.radiant : TEAM_COLORS.dire
      
      // Ward glow
      const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, 16)
      glowGradient.addColorStop(0, withAlpha(wardColor, 0.5))
      glowGradient.addColorStop(1, withAlpha(wardColor, 0))
      ctx.fillStyle = glowGradient
      ctx.beginPath()
      ctx.arc(x, y, 16, 0, Math.PI * 2)
      ctx.fill()
      
      // Ward circle background
      ctx.beginPath()
      ctx.arc(x, y, 8, 0, Math.PI * 2)
      ctx.fillStyle = withAlpha(wardColor, 0.9)
      ctx.fill()
      
      // Team border
      ctx.strokeStyle = teamColor
      ctx.lineWidth = 2
      ctx.stroke()

      // Ward icon
      ctx.fillStyle = '#000'
      ctx.font = 'bold 9px Geist, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(isObs ? 'O' : 'S', x, y)
      
      // Time indicator (small dot showing relative time)
      const timeProgress = ward.time / duration
      const indicatorAngle = -Math.PI / 2 + timeProgress * Math.PI * 2
      const indicatorX = x + Math.cos(indicatorAngle) * 11
      const indicatorY = y + Math.sin(indicatorAngle) * 11
      ctx.beginPath()
      ctx.arc(indicatorX, indicatorY, 2, 0, Math.PI * 2)
      ctx.fillStyle = '#fff'
      ctx.fill()
    })

  }, [filteredWards, duration])

  useEffect(() => {
    drawMap()
  }, [drawMap])

  // Handle mouse move for hover detection
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const rect = canvas.getBoundingClientRect()
    const scaleX = MAP_SIZE / rect.width
    const scaleY = MAP_SIZE / rect.height
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY
    
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
    
    // Find nearest ward
    let nearestWard: ProcessedWard | null = null
    let nearestDist = 20 // Max distance threshold
    
    filteredWards.forEach(ward => {
      const dist = Math.sqrt(Math.pow(ward.canvasX - x, 2) + Math.pow(ward.canvasY - y, 2))
      if (dist < nearestDist) {
        nearestDist = dist
        nearestWard = ward
      }
    })
    
    setHoveredWard(nearestWard)
  }

  const observerCount = filteredWards.filter(w => w.type === 'observer').length
  const sentryCount = filteredWards.filter(w => w.type === 'sentry').length

  return (
    <div className={cn('space-y-4', className)}>
      {/* Controls */}
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-6">
            {/* Time slider */}
            <div className="flex-1 min-w-64">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Time Range</span>
                <span className="text-sm font-mono text-primary">
                  {formatGameTime(timeRange[0])} - {formatGameTime(timeRange[1])}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={duration}
                value={timeRange[1]}
                onChange={(e) => setTimeRange([0, parseInt(e.target.value)])}
                className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>
            
            {/* Ward type toggles */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowObservers(!showObservers)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                  showObservers 
                    ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' 
                    : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                )}
              >
                <Eye className="w-4 h-4" />
                <span>Observers</span>
                <Badge variant="secondary" className="ml-1 bg-yellow-500/20 text-yellow-400">
                  {observerCount}
                </Badge>
              </button>
              
              <button
                onClick={() => setShowSentries(!showSentries)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                  showSentries 
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                    : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                )}
              >
                <Crosshair className="w-4 h-4" />
                <span>Sentries</span>
                <Badge variant="secondary" className="ml-1 bg-blue-500/20 text-blue-400">
                  {sentryCount}
                </Badge>
              </button>
            </div>
            
            {/* Team filter */}
            <div className="flex items-center gap-2">
              {(['all', 'radiant', 'dire'] as const).map(team => (
                <button
                  key={team}
                  onClick={() => setSelectedTeam(team)}
                  className={cn(
                    'px-3 py-2 text-sm font-medium rounded-lg transition-all capitalize',
                    selectedTeam === team
                      ? team === 'radiant' 
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : team === 'dire'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-primary/20 text-primary border border-primary/30'
                      : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                  )}
                >
                  {team}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Map Canvas */}
      <div className="relative">
        <Card className="border-border/50 overflow-hidden">
          <div className="relative aspect-square max-w-2xl mx-auto">
            <canvas
              ref={canvasRef}
              width={MAP_SIZE}
              height={MAP_SIZE}
              className="w-full h-full map-canvas cursor-crosshair"
              onMouseMove={handleMouseMove}
              onMouseLeave={() => {
                setHoveredWard(null)
                setMousePos(null)
              }}
            />
            
            {/* Hover tooltip */}
            {hoveredWard && mousePos && (
              <div 
                className="absolute z-10 pointer-events-none"
                style={{ 
                  left: Math.min(mousePos.x + 10, 300), 
                  top: mousePos.y + 10 
                }}
              >
                <Card className="border-border/50 bg-popover/95 backdrop-blur shadow-xl">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: hoveredWard.isRadiant ? TEAM_COLORS.radiant : TEAM_COLORS.dire }}
                      />
                      <span className="font-medium">{hoveredWard.heroName}</span>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>
                        <span className="capitalize">{hoveredWard.type}</span> ward
                      </p>
                      <p>Placed at {formatGameTime(hoveredWard.time)}</p>
                      <p className="text-xs font-mono">
                        Position: ({hoveredWard.x.toFixed(0)}, {hoveredWard.y.toFixed(0)})
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            
            {/* Stats overlay */}
            <div className="absolute top-3 left-3 flex flex-col gap-2">
              <Badge variant="secondary" className="bg-black/60 backdrop-blur text-white border-0">
                {filteredWards.length} wards
              </Badge>
            </div>
          </div>
        </Card>
      </div>

      {/* Ward Timeline */}
      {filteredWards.length > 0 && (
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Ward Placement Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-48 overflow-y-auto space-y-1">
              {filteredWards
                .sort((a, b) => a.time - b.time)
                .map((ward, i) => (
                  <div 
                    key={`${ward.time}-${ward.x}-${ward.y}-${i}`}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors"
                  >
                    <span 
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: ward.isRadiant ? TEAM_COLORS.radiant : TEAM_COLORS.dire }}
                    />
                    <span className="font-mono text-sm text-primary w-12">
                      {formatGameTime(ward.time)}
                    </span>
                    <span className="text-sm font-medium flex-1">{ward.heroName}</span>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        'text-xs',
                        ward.type === 'observer' 
                          ? 'border-yellow-500/30 text-yellow-400' 
                          : 'border-blue-500/30 text-blue-400'
                      )}
                    >
                      {ward.type}
                    </Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
