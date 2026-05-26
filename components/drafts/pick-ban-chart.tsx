'use client'

import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TrendingUp, Ban, Award } from 'lucide-react'
import type { DraftStats } from '@/types/dota'

interface PickBanChartProps {
  stats: DraftStats[]
}

const COLORS = {
  high: '#22C55E',   // green for high winrate
  low: '#DC2626',    // red for low winrate
  neutral: '#3B82F6', // blue
  ban: '#DC2626',    // red for bans
  gold: '#FBBF24',   // gold for winrate
}

export function PickBanChart({ stats }: PickBanChartProps) {
  const topPicked = useMemo(() => 
    [...stats]
      .sort((a, b) => b.pickCount - a.pickCount)
      .slice(0, 12)
      .map(s => ({
        name: s.heroName.length > 10 ? s.heroName.slice(0, 10) + '...' : s.heroName,
        fullName: s.heroName,
        picks: s.pickCount,
        winRate: s.winRate,
      })),
    [stats]
  )

  const topBanned = useMemo(() => 
    [...stats]
      .sort((a, b) => b.banCount - a.banCount)
      .slice(0, 12)
      .map(s => ({
        name: s.heroName.length > 10 ? s.heroName.slice(0, 10) + '...' : s.heroName,
        fullName: s.heroName,
        bans: s.banCount,
        winRate: s.winRate,
      })),
    [stats]
  )

  const topWinrate = useMemo(() => 
    [...stats]
      .filter(s => s.matchCount >= 10)
      .sort((a, b) => b.winRate - a.winRate)
      .slice(0, 12)
      .map(s => ({
        name: s.heroName.length > 10 ? s.heroName.slice(0, 10) + '...' : s.heroName,
        fullName: s.heroName,
        winRate: s.winRate,
        matches: s.matchCount,
      })),
    [stats]
  )

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-popover/95 backdrop-blur border border-border/50 p-3 rounded-lg shadow-xl">
          <p className="font-semibold text-foreground mb-1">{data.fullName || label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm text-muted-foreground flex items-center gap-2">
              <span 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: entry.fill || entry.color }}
              />
              <span className="capitalize">{entry.name}:</span>
              <span className="font-medium text-foreground">
                {entry.name === 'winRate' 
                  ? `${entry.value.toFixed(1)}%` 
                  : entry.value.toLocaleString()
                }
              </span>
            </p>
          ))}
          {data.matches && (
            <p className="text-xs text-muted-foreground mt-1 border-t border-border/50 pt-1">
              {data.matches} total matches
            </p>
          )}
        </div>
      )
    }
    return null
  }

  return (
    <Tabs defaultValue="picks" className="w-full">
      <TabsList className="grid w-full max-w-lg grid-cols-3 bg-secondary/50 p-1">
        <TabsTrigger 
          value="picks" 
          className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary flex items-center gap-2"
        >
          <TrendingUp className="w-4 h-4" />
          Most Picked
        </TabsTrigger>
        <TabsTrigger 
          value="bans"
          className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary flex items-center gap-2"
        >
          <Ban className="w-4 h-4" />
          Most Banned
        </TabsTrigger>
        <TabsTrigger 
          value="winrate"
          className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary flex items-center gap-2"
        >
          <Award className="w-4 h-4" />
          Top Winrate
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="picks" className="mt-6">
        <Card className="border-border/40 bg-card/50 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="p-2 rounded-lg bg-green-500/10">
                <TrendingUp className="w-4 h-4 text-green-500" />
              </div>
              Most Picked Heroes in Pro Matches
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Bar color indicates win rate (green = 50%+, red = below 50%)
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-[450px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topPicked}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 5, bottom: 5 }}
                >
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    horizontal={true} 
                    vertical={false} 
                    stroke="#2a2a4a"
                  />
                  <XAxis 
                    type="number" 
                    stroke="#6b7280"
                    fontSize={12}
                  />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={85}
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="picks" 
                    name="Picks" 
                    radius={[0, 4, 4, 0]}
                    maxBarSize={24}
                  >
                    {topPicked.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.winRate >= 50 ? COLORS.high : COLORS.low}
                        fillOpacity={0.85}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="bans" className="mt-6">
        <Card className="border-border/40 bg-card/50 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="p-2 rounded-lg bg-red-500/10">
                <Ban className="w-4 h-4 text-red-500" />
              </div>
              Most Banned Heroes in Pro Matches
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Heroes teams fear the most
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-[450px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topBanned}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 5, bottom: 5 }}
                >
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    horizontal={true} 
                    vertical={false}
                    stroke="#2a2a4a"
                  />
                  <XAxis 
                    type="number"
                    stroke="#6b7280"
                    fontSize={12}
                  />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={85}
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="bans" 
                    name="Bans" 
                    fill={COLORS.ban}
                    fillOpacity={0.85}
                    radius={[0, 4, 4, 0]}
                    maxBarSize={24}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="winrate" className="mt-6">
        <Card className="border-border/40 bg-card/50 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <Award className="w-4 h-4 text-yellow-500" />
              </div>
              Highest Winrate Heroes (10+ matches)
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Most successful heroes in professional play
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-[450px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topWinrate}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 5, bottom: 5 }}
                >
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    horizontal={true} 
                    vertical={false}
                    stroke="#2a2a4a"
                  />
                  <XAxis 
                    type="number" 
                    domain={[40, 75]} 
                    tickFormatter={(v) => `${v}%`}
                    stroke="#6b7280"
                    fontSize={12}
                  />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={85}
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="winRate" 
                    name="winRate" 
                    fill={COLORS.gold}
                    fillOpacity={0.85}
                    radius={[0, 4, 4, 0]}
                    maxBarSize={24}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
