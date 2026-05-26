'use client'

import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { HEROES, ATTR_COLORS, ATTR_NAMES } from '@/lib/constants/heroes'
import { formatPercent } from '@/lib/utils/stats-calc'
import { cn } from '@/lib/utils'
import type { HeroDetails, HeroMatchup } from '@/types/dota'

interface HeroDetailsViewProps {
  details: HeroDetails
}

export function HeroDetailsView({ details }: HeroDetailsViewProps) {
  const hero = HEROES[details.heroId]
  
  if (!hero) {
    return <div>Hero not found</div>
  }

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="flex items-start gap-6">
        <div className="relative w-48 aspect-video rounded-lg overflow-hidden">
          <Image
            src={hero.img}
            alt={hero.localizedName}
            fill
            className="object-cover"
          />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{hero.localizedName}</h1>
            <Badge 
              style={{ backgroundColor: ATTR_COLORS[hero.primaryAttr] }}
              className="text-white"
            >
              {ATTR_NAMES[hero.primaryAttr]}
            </Badge>
            <Badge variant="outline">{hero.attackType}</Badge>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {hero.roles.map(role => (
              <Badge key={role} variant="secondary">{role}</Badge>
            ))}
          </div>
          
          {/* Pro Stats Summary */}
          <div className="grid grid-cols-4 gap-4">
            <StatCard 
              label="Win Rate" 
              value={formatPercent(details.winRate)}
              highlight={details.winRate >= 50}
            />
            <StatCard 
              label="Pro Matches" 
              value={details.matchCount.toLocaleString()}
            />
            <StatCard 
              label="Picks" 
              value={details.pickCount.toLocaleString()}
            />
            <StatCard 
              label="Bans" 
              value={details.banCount.toLocaleString()}
            />
          </div>
        </div>
      </div>

      {/* Tabs for different sections */}
      <Tabs defaultValue="matchups" className="w-full">
        <TabsList>
          <TabsTrigger value="matchups">Matchups</TabsTrigger>
          <TabsTrigger value="builds">Item Builds</TabsTrigger>
          <TabsTrigger value="abilities">Ability Build</TabsTrigger>
        </TabsList>
        
        <TabsContent value="matchups" className="mt-4">
          <MatchupsSection matchups={details.matchups} />
        </TabsContent>
        
        <TabsContent value="builds" className="mt-4">
          <ItemBuildsSection />
        </TabsContent>
        
        <TabsContent value="abilities" className="mt-4">
          <AbilityBuildSection />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function StatCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className={cn(
          'text-2xl font-bold',
          highlight === true && 'text-green-600',
          highlight === false && 'text-red-600'
        )}>
          {value}
        </p>
      </CardContent>
    </Card>
  )
}

function MatchupsSection({ matchups }: { matchups: HeroMatchup[] }) {
  if (matchups.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          No matchup data available
        </CardContent>
      </Card>
    )
  }

  // Split into good and bad matchups
  const goodMatchups = matchups.filter(m => m.advantage > 0).sort((a, b) => b.advantage - a.advantage)
  const badMatchups = matchups.filter(m => m.advantage <= 0).sort((a, b) => a.advantage - b.advantage)

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-green-600">Strong Against</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {goodMatchups.slice(0, 10).map(m => (
              <MatchupRow key={m.heroId} matchup={m} />
            ))}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Weak Against</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {badMatchups.slice(0, 10).map(m => (
              <MatchupRow key={m.heroId} matchup={m} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function MatchupRow({ matchup }: { matchup: HeroMatchup }) {
  const hero = HEROES[matchup.heroId]
  
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg bg-secondary/50">
      {hero && (
        <Image
          src={hero.icon}
          alt={matchup.heroName}
          width={32}
          height={32}
          className="rounded"
        />
      )}
      <span className="flex-1 font-medium">{matchup.heroName}</span>
      <span className="text-sm text-muted-foreground">
        {matchup.matchCount} games
      </span>
      <span className={cn(
        'font-bold min-w-16 text-right',
        matchup.advantage > 0 ? 'text-green-600' : 'text-red-600'
      )}>
        {matchup.advantage > 0 ? '+' : ''}{matchup.advantage.toFixed(1)}%
      </span>
    </div>
  )
}

function ItemBuildsSection() {
  return (
    <Card>
      <CardContent className="p-6">
        <p className="text-center text-muted-foreground">
          Item build data requires STRATZ API integration.
          <br />
          Add your STRATZ_API_KEY to enable this feature.
        </p>
      </CardContent>
    </Card>
  )
}

function AbilityBuildSection() {
  return (
    <Card>
      <CardContent className="p-6">
        <p className="text-center text-muted-foreground">
          Ability build data requires STRATZ API integration.
          <br />
          Add your STRATZ_API_KEY to enable this feature.
        </p>
      </CardContent>
    </Card>
  )
}
