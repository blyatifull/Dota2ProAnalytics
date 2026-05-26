import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { HEROES } from '@/lib/constants/heroes'
import { formatDuration } from '@/lib/utils/stats-calc'
import { cn } from '@/lib/utils'
import type { ProMatch } from '@/types/dota'

interface MatchListProps {
  matches: ProMatch[]
}

export function MatchList({ matches }: MatchListProps) {
  if (matches.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          No matches found
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {matches.map(match => (
        <MatchCard key={match.matchId} match={match} />
      ))}
    </div>
  )
}

function MatchCard({ match }: { match: ProMatch }) {
  const date = new Date(match.startTime * 1000)
  
  return (
    <Link href={`/matches/${match.matchId}`}>
      <Card className="hover:border-primary/50 transition-colors cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            {/* League */}
            <div className="min-w-32">
              <p className="text-xs text-muted-foreground">{match.leagueName}</p>
              <p className="text-xs text-muted-foreground">
                {date.toLocaleDateString()}
              </p>
            </div>
            
            {/* Teams */}
            <div className="flex-1 flex items-center justify-center gap-4">
              {/* Radiant */}
              <div className={cn(
                'flex items-center gap-2 min-w-40 justify-end',
                match.radiantWin && 'font-bold'
              )}>
                <span className={match.radiantWin ? 'text-green-600' : ''}>
                  {match.radiantTeamName}
                </span>
                {match.radiantWin && (
                  <span className="text-xs text-green-600">WIN</span>
                )}
              </div>
              
              {/* Score */}
              <div className="flex items-center gap-2 px-4 py-1 bg-secondary rounded-lg">
                <span className={cn(
                  'text-lg font-bold min-w-8 text-center',
                  match.radiantWin ? 'text-green-600' : 'text-muted-foreground'
                )}>
                  {match.radiantScore}
                </span>
                <span className="text-muted-foreground">-</span>
                <span className={cn(
                  'text-lg font-bold min-w-8 text-center',
                  !match.radiantWin ? 'text-red-600' : 'text-muted-foreground'
                )}>
                  {match.direScore}
                </span>
              </div>
              
              {/* Dire */}
              <div className={cn(
                'flex items-center gap-2 min-w-40',
                !match.radiantWin && 'font-bold'
              )}>
                {!match.radiantWin && (
                  <span className="text-xs text-red-600">WIN</span>
                )}
                <span className={!match.radiantWin ? 'text-red-600' : ''}>
                  {match.direTeamName}
                </span>
              </div>
            </div>
            
            {/* Duration */}
            <div className="min-w-20 text-right">
              <p className="text-sm font-medium">{formatDuration(match.duration)}</p>
              <p className="text-xs text-muted-foreground">Duration</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
