'use client'

import { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import type { MatchDetails, GoldXpData } from '@/types/dota'
import { HEROES } from '@/lib/constants/heroes'
import { cn } from '@/lib/utils'

interface GoldXpGraphProps {
  match: MatchDetails
}

interface CombinedGoldGraphProps {
  match: MatchDetails
}

export function GoldXpGraph({ match }: GoldXpGraphProps) {
  const radiantPlayers = useMemo(() => match.players.filter(p => p.isRadiant), [match.players])
  const direPlayers = useMemo(() => match.players.filter(p => !p.isRadiant), [match.players])

  // Aggregate gold and XP by time for each team
  const chartData = useMemo(() => {
    const maxTime = Math.max(
      ...radiantPlayers.flatMap(p => p.goldT?.map(g => g.time) || []),
      ...direPlayers.flatMap(p => p.goldT?.map(g => g.time) || []),
      0
    )

    const data: Array<{
      time: number
      radiantGold: number
      direGold: number
      radiantXP: number
      direXP: number
    }> = []

    for (let time = 0; time <= maxTime; time += 60) {
      const radiantGold = radiantPlayers.reduce((acc, p) => {
        const goldEntry = p.goldT?.find(g => g.time === time)
        return acc + (goldEntry?.gold || 0)
      }, 0)

      const direGold = direPlayers.reduce((acc, p) => {
        const goldEntry = p.goldT?.find(g => g.time === time)
        return acc + (goldEntry?.gold || 0)
      }, 0)

      const radiantXP = radiantPlayers.reduce((acc, p) => {
        const xpEntry = p.xpT?.find(x => x.time === time)
        return acc + (xpEntry?.xp || 0)
      }, 0)

      const direXP = direPlayers.reduce((acc, p) => {
        const xpEntry = p.xpT?.find(x => x.time === time)
        return acc + (xpEntry?.xp || 0)
      }, 0)

      if (radiantGold > 0 || direGold > 0 || radiantXP > 0 || direXP > 0) {
        data.push({
          time,
          radiantGold,
          direGold,
          radiantXP,
          direXP,
        })
      }
    }

    return data
  }, [radiantPlayers, direPlayers])

  const chartConfig: ChartConfig = {
    radiantGold: {
      label: 'Radiant Gold',
      color: '#22c55e',
    },
    direGold: {
      label: 'Dire Gold',
      color: '#ef4444',
    },
    radiantXP: {
      label: 'Radiant XP',
      color: '#16a34a',
    },
    direXP: {
      label: 'Dire XP',
      color: '#dc2626',
    },
  }

  if (chartData.length === 0) {
    return (
      <Card className="border-border/40 bg-card/50 backdrop-blur">
        <CardContent className="p-12 text-center">
          <p className="text-muted-foreground">Gold/XP data not available for this match</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Gold Graph */}
      <Card className="border-border/40 bg-card/50 backdrop-blur">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Team Gold Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
              <XAxis
                dataKey="time"
                tickFormatter={(value) => `${Math.floor(value / 60)}:${(value % 60).toString().padStart(2, '0')}`}
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="radiantGold"
                stroke="var(--color-radiantGold)"
                strokeWidth={2}
                dot={false}
                name="Radiant Gold"
              />
              <Line
                type="monotone"
                dataKey="direGold"
                stroke="var(--color-direGold)"
                strokeWidth={2}
                dot={false}
                name="Dire Gold"
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* XP Graph */}
      <Card className="border-border/40 bg-card/50 backdrop-blur">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Team Experience Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
              <XAxis
                dataKey="time"
                tickFormatter={(value) => `${Math.floor(value / 60)}:${(value % 60).toString().padStart(2, '0')}`}
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="radiantXP"
                stroke="var(--color-radiantXP)"
                strokeWidth={2}
                dot={false}
                name="Radiant XP"
              />
              <Line
                type="monotone"
                dataKey="direXP"
                stroke="var(--color-direXP)"
                strokeWidth={2}
                dot={false}
                name="Dire XP"
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}

export function CombinedGoldGraph({ match }: CombinedGoldGraphProps) {
  const chartData = useMemo(() => {
    const allTimes = new Set<number>()
    
    match.players.forEach(p => {
      p.goldT?.forEach(g => allTimes.add(g.time))
    })

    const sortedTimes = Array.from(allTimes).sort((a, b) => a - b)

    return sortedTimes.map(time => {
      const entry: Record<string, number | string> = { time }

      match.players.forEach(p => {
        const goldEntry = p.goldT?.find(g => g.time === time)
        const hero = HEROES[p.heroId]
        const key = `hero_${p.playerSlot}`
        entry[key] = goldEntry?.gold || 0
      })

      return entry
    })
  }, [match.players])

  const chartConfig: ChartConfig = useMemo(() => {
    const config: ChartConfig = {}
    
    match.players.forEach(p => {
      const hero = HEROES[p.heroId]
      const key = `hero_${p.playerSlot}`
      config[key] = {
        label: hero?.localizedName || `Hero ${p.heroId}`,
        color: p.isRadiant ? '#22c55e' : '#ef4444',
      }
    })

    return config
  }, [match.players])

  if (chartData.length === 0) {
    return (
      <Card className="border-border/40 bg-card/50 backdrop-blur">
        <CardContent className="p-12 text-center">
          <p className="text-muted-foreground">Gold data not available for this match</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/40 bg-card/50 backdrop-blur">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">All Players Gold Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[400px] w-full">
          <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
            <XAxis
              dataKey="time"
              tickFormatter={(value) => `${Math.floor(value / 60)}:${(value % 60).toString().padStart(2, '0')}`}
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Legend />
            {match.players.map(p => (
              <Line
                key={p.playerSlot}
                type="monotone"
                dataKey={`hero_${p.playerSlot}`}
                stroke={p.isRadiant ? '#22c55e' : '#ef4444'}
                strokeWidth={2}
                dot={false}
                opacity={0.8}
                name={HEROES[p.heroId]?.localizedName || `Hero ${p.heroId}`}
              />
            ))}
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
