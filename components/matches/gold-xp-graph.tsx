'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy, TrendingUp } from 'lucide-react'
import type { MatchDetails } from '@/types/dota'

interface GoldXpGraphProps {
    match: MatchDetails
}

export function GoldXpGraph({ match }: GoldXpGraphProps) {
    // Process gold and XP advantage data
    const intervalMinutes = 1 // Each data point represents 1 minute
    const duration = match.duration

    const chartData = Array.from({ length: Math.min(duration, 80) }, (_, i) => {
        const minute = i + 1
        const goldAdv = match.radiantGoldAdv?.[i] || 0
        const xpAdv = match.radiantXpAdv?.[i] || 0

        return {
            time: `${minute}:00`,
            minute,
            goldAdvantage: goldAdv,
            xpAdvantage: xpAdv,
            radiantLead: goldAdv > 0 ? goldAdv : 0,
            direLead: goldAdv < 0 ? Math.abs(goldAdv) : 0,
        }
    })

    const formatTime = (tick: string) => {
        const minutes = parseInt(tick)
        if (minutes % 5 === 0) return `${minutes}'`
        return ''
    }

    const formatNumber = (value: number) => {
        if (Math.abs(value) >= 1000) {
            return `${(value / 1000).toFixed(1)}k`
        }
        return value.toString()
    }

    return (
        <Card className="border-border/40 bg-card/50 backdrop-blur">
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-yellow-500/10">
                        <TrendingUp className="w-4 h-4 text-yellow-400" />
                    </div>
                    Gold & XP Advantage
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px]">
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
                                    if (name.includes('Gold')) {
                                        return [`${value > 0 ? '+' : ''}${formatNumber(value)}`, name]
                                    }
                                    return [`${value > 0 ? '+' : ''}${formatNumber(value)}`, name]
                                }}
                                labelFormatter={(label) => `Time: ${label}`}
                            />
                            <Legend />
                            <ReferenceLine y={0} stroke="#6B7280" strokeWidth={2} />
                            <Line
                                type="monotone"
                                dataKey="goldAdvantage"
                                name="Gold Advantage (Radiant)"
                                stroke="#10B981"
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 6 }}
                            />
                            <Line
                                type="monotone"
                                dataKey="xpAdvantage"
                                name="XP Advantage (Radiant)"
                                stroke="#3B82F6"
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 6 }}
                                strokeDasharray="5 5"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                <div className="mt-4 flex justify-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                        <span className="text-muted-foreground">Green = Gold Advantage</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                        <span className="text-muted-foreground">Blue = XP Advantage</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}