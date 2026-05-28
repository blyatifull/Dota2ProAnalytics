'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Image from 'next/image'
import { Coins } from 'lucide-react'
import type { MatchDetails } from '@/types/dota'
import { HEROES } from '@/lib/constants/heroes'

interface PlayerGoldGraphProps {
    match: MatchDetails
}

export function PlayerGoldGraph({ match }: PlayerGoldGraphProps) {
    // Group players by team
    const radiantPlayers = match.players.filter(p => p.isRadiant)
    const direPlayers = match.players.filter(p => !p.isRadiant)

    // Generate chart data for each minute
    const duration = match.duration
    const chartData = Array.from({ length: Math.min(duration, 80) }, (_, i) => {
        const minute = i + 1
        const entry: Record<string, number | string> = {
            time: `${minute}:00`,
            minute,
        }

        // Estimate gold for each player based on GPM and time
        // This is an approximation since we don't have exact gold timeline per player
        radiantPlayers.forEach(player => {
            // Gold accumulated = (GPM / 60) * minutes * progression factor
            // Using a simple linear progression for visualization
            const progressionFactor = minute / duration
            const estimatedGold = Math.round((player.goldPerMin / 60) * minute * (1 + progressionFactor * 0.5))
            entry[`radiant_${player.playerSlot}`] = estimatedGold
        })

        direPlayers.forEach(player => {
            const progressionFactor = minute / duration
            const estimatedGold = Math.round((player.goldPerMin / 60) * minute * (1 + progressionFactor * 0.5))
            entry[`dire_${player.playerSlot}`] = estimatedGold
        })

        return entry
    })

    const formatTime = (tick: string) => {
        const minutes = parseInt(tick)
        if (minutes % 5 === 0) return `${minutes}'`
        return ''
    }

    const formatNumber = (value: number) => {
        if (value >= 1000) {
            return `${(value / 1000).toFixed(1)}k`
        }
        return value.toString()
    }

    // Generate colors for lines
    const radiantColors = ['#10B981', '#34D399', '#6EE7B7', '#A7F3D0', '#D1FAE5']
    const direColors = ['#EF4444', '#F87171', '#FCA5A5', '#FECACA', '#FEE2E2']

    return (
        <Card className="border-border/40 bg-card/50 backdrop-blur">
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-yellow-500/10">
                        <Coins className="w-4 h-4 text-yellow-400" />
                    </div>
                    Player Gold Over Time
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.5} />
                            <XAxis
                                dataKey="time"
                                tickFormatter={formatTime}
                                stroke="#9CA3AF"
                                tick={{ fontSize: 12 }}
                                interval={4}
                            />
                            <YAxis
                                stroke="#9CA3AF"
                                tick={{ fontSize: 12 }}
                                tickFormatter={formatNumber}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1F2937',
                                    border: '1px solid #374151',
                                    borderRadius: '8px',
                                    color: '#F3F4F6',
                                }}
                                formatter={(value: number, name: string) => {
                                    const [team, slot] = name.split('_')
                                    const player = match.players.find(p => p.playerSlot.toString() === slot)
                                    const heroName = player ? HEROES[player.heroId]?.localizedName || player.heroName : name
                                    return [`${formatNumber(value)} gold`, heroName]
                                }}
                                labelFormatter={(label) => `Time: ${label}`}
                            />
                            <Legend
                                content={({ payload }) => {
                                    if (!payload) return null
                                    return (
                                        <div className="flex flex-wrap justify-center gap-4 mt-4">
                                            {payload.map((entry, index) => {
                                                const [team, slot] = (entry.dataKey as string).split('_')
                                                const player = match.players.find(p => p.playerSlot.toString() === slot)
                                                if (!player) return null
                                                const hero = HEROES[player.heroId]

                                                return (
                                                    <div key={index} className="flex items-center gap-2">
                                                        {hero && (
                                                            <Image
                                                                src={hero.icon}
                                                                alt={hero.localizedName}
                                                                width={20}
                                                                height={20}
                                                                className="rounded"
                                                            />
                                                        )}
                                                        <span className="text-xs text-muted-foreground">{player.heroName}</span>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )
                                }}
                            />

                            {/* Radiant players */}
                            {radiantPlayers.map((player, index) => (
                                <Line
                                    key={`radiant_${player.playerSlot}`}
                                    type="monotone"
                                    dataKey={`radiant_${player.playerSlot}`}
                                    name={player.heroName}
                                    stroke={radiantColors[index % radiantColors.length]}
                                    strokeWidth={2}
                                    dot={false}
                                    opacity={0.8}
                                />
                            ))}

                            {/* Dire players */}
                            {direPlayers.map((player, index) => (
                                <Line
                                    key={`dire_${player.playerSlot}`}
                                    type="monotone"
                                    dataKey={`dire_${player.playerSlot}`}
                                    name={player.heroName}
                                    stroke={direColors[index % direColors.length]}
                                    strokeWidth={2}
                                    dot={false}
                                    opacity={0.8}
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                <div className="mt-4 flex justify-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                        <span className="text-muted-foreground">Radiant Players</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <span className="text-muted-foreground">Dire Players</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}