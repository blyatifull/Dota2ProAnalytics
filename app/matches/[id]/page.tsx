import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { DotaMap } from '@/components/map/dota-map'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Map, Users, Swords, Trophy, Clock, Target, Skull } from 'lucide-react'
import { HEROES } from '@/lib/constants/heroes'
import { formatDuration } from '@/lib/utils/stats-calc'
import { cn } from '@/lib/utils'
import type { MatchDetails } from '@/types/dota'

async function getMatchDetails(matchId: number): Promise<MatchDetails | null> {
  try {
    const baseUrl = process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'http://localhost:3000'

    const res = await fetch(`${baseUrl}/api/matches/${matchId}`, {
      next: { revalidate: 86400 },
    })

    if (!res.ok) {
      return null
    }

    return res.json()
  } catch (error) {
    console.error('Error fetching match details:', error)
    return null
  }
}

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const matchId = parseInt(id)

  if (isNaN(matchId)) {
    notFound()
  }

  const match = await getMatchDetails(matchId)

  if (!match) {
    notFound()
  }

  const radiantPlayers = match.players.filter(p => p.isRadiant)
  const direPlayers = match.players.filter(p => !p.isRadiant)
  const date = new Date(match.startTime * 1000)

  // Calculate team stats
  const radiantKills = radiantPlayers.reduce((acc, p) => acc + p.kills, 0)
  const direKills = direPlayers.reduce((acc, p) => acc + p.kills, 0)

  return (
      <div className="min-h-screen">
        {/* Header with gradient */}
        <div className="border-b border-border/40">
          <div className="container py-6">
            <Link href="/matches">
              <Button variant="ghost" size="sm" className="mb-4 text-muted-foreground hover:text-primary">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Matches
              </Button>
            </Link>

            {/* Match Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Badge variant="outline" className={cn(
                      'text-xs',
                      match.radiantWin ? 'border-green-500/30 text-green-400' : 'border-primary/30 text-primary'
                  )}>
                    {match.radiantWin ? 'Radiant Victory' : 'Dire Victory'}
                  </Badge>
                  <Badge variant="outline" className="border-border/40 text-muted-foreground text-xs">
                    ID: {match.matchId}
                  </Badge>
                </div>
                <h1 className="text-3xl font-bold mb-2">
                <span className={match.radiantWin ? 'text-green-400' : 'text-foreground'}>
                  {match.radiantTeamName}
                </span>
                  <span className="text-muted-foreground mx-3">vs</span>
                  <span className={!match.radiantWin ? 'text-primary' : 'text-foreground'}>
                  {match.direTeamName}
                </span>
                </h1>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {formatDuration(match.duration)}
                </span>
                  <span>{date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}</span>
                </div>
              </div>

              {/* Score Card */}
              <Card className="border-border/40 bg-card/50 backdrop-blur">
                <CardContent className="p-6">
                  <div className="flex items-center gap-8">
                    <div className="text-center">
                      <p className={cn(
                          'text-5xl font-bold',
                          match.radiantWin ? 'text-green-400' : 'text-muted-foreground'
                      )}>
                        {match.radiantScore}
                      </p>
                      <p className="text-sm text-green-400/80 font-medium mt-1">Radiant</p>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <Swords className="w-6 h-6 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">FINAL</span>
                    </div>
                    <div className="text-center">
                      <p className={cn(
                          'text-5xl font-bold',
                          !match.radiantWin ? 'text-primary' : 'text-muted-foreground'
                      )}>
                        {match.direScore}
                      </p>
                      <p className="text-sm text-primary/80 font-medium mt-1">Dire</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container py-8">
          <Tabs defaultValue="scoreboard" className="w-full">
            <TabsList className="bg-secondary/50 p-1 mb-6">
              <TabsTrigger
                  value="scoreboard"
                  className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary flex items-center gap-2"
              >
                <Users className="w-4 h-4" />
                Results
              </TabsTrigger>
              <TabsTrigger
                  value="draft"
                  className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary flex items-center gap-2"
              >
                <Swords className="w-4 h-4" />
                Drafts
              </TabsTrigger>
              <TabsTrigger
                  value="map"
                  className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary flex items-center gap-2"
              >
                <Map className="w-4 h-4" />
                Hot Map
              </TabsTrigger>
            </TabsList>

            <TabsContent value="scoreboard">
              <div className="space-y-6">
                <ScoreboardTable
                    title="Radiant"
                    players={radiantPlayers}
                    isWinner={match.radiantWin}
                    teamColor="green"
                />
                <ScoreboardTable
                    title="Dire"
                    players={direPlayers}
                    isWinner={!match.radiantWin}
                    teamColor="red"
                />
              </div>
            </TabsContent>

            <TabsContent value="draft">
              <DraftView pickBans={match.pickBans} />
            </TabsContent>

            <TabsContent value="map">
              <Card className="border-border/40 bg-card/50 backdrop-blur">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Map className="w-4 h-4 text-primary" />
                    </div>
                    Ward Placement Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <DotaMap
                      players={match.players}
                      duration={match.duration}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
  )
}

function ScoreboardTable({
                           title,
                           players,
                           isWinner,
                           teamColor
                         }: {
  title: string
  players: MatchDetails['players']
  isWinner: boolean
  teamColor: 'green' | 'red'
}) {
  const totalKills = players.reduce((acc, p) => acc + p.kills, 0)
  const totalDeaths = players.reduce((acc, p) => acc + p.deaths, 0)
  const totalAssists = players.reduce((acc, p) => acc + p.assists, 0)

  return (
      <Card className="border-border/40 bg-card/50 backdrop-blur overflow-hidden">
        <CardHeader className={cn(
            'pb-3 border-b border-border/40',
            teamColor === 'green' ? 'bg-green-500/5' : 'bg-red-500/5'
        )}>
          <div className="flex items-center justify-between">
            <CardTitle className={cn(
                'flex items-center gap-3',
                teamColor === 'green' ? 'text-green-400' : 'text-primary'
            )}>
              <div className={cn(
                  'w-3 h-3 rounded-full',
                  teamColor === 'green' ? 'bg-green-500' : 'bg-red-500'
              )} />
              {title}
              {isWinner && (
                  <Badge className="ml-2 bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                    <Trophy className="w-3 h-3 mr-1" />
                    Winner
                  </Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-green-400">{totalKills} <span className="text-muted-foreground">K</span></span>
              <span className="text-red-400">{totalDeaths} <span className="text-muted-foreground">D</span></span>
              <span className="text-blue-400">{totalAssists} <span className="text-muted-foreground">A</span></span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
              <tr className="border-b border-border/40 bg-secondary/30">
                <th className="text-left p-3 font-medium text-muted-foreground">Hero</th>
                <th className="text-center p-3 font-medium text-muted-foreground w-12">Lvl</th>
                <th className="text-center p-3 font-medium text-green-400/70 w-12">K</th>
                <th className="text-center p-3 font-medium text-red-400/70 w-12">D</th>
                <th className="text-center p-3 font-medium text-blue-400/70 w-12">A</th>
                <th className="text-center p-3 font-medium text-muted-foreground">LH/DN</th>
                <th className="text-center p-3 font-medium text-yellow-400/70">GPM</th>
                <th className="text-center p-3 font-medium text-blue-400/70">XPM</th>
                <th className="text-center p-3 font-medium text-muted-foreground">Hero DMG</th>
                <th className="text-center p-3 font-medium text-muted-foreground">Tower DMG</th>
              </tr>
              </thead>
              <tbody>
              {players.map((player, i) => {
                const hero = HEROES[player.heroId]
                const kda = player.deaths === 0
                    ? (player.kills + player.assists).toFixed(1)
                    : ((player.kills + player.assists) / player.deaths).toFixed(1)

                return (
                    <tr
                        key={player.playerSlot}
                        className={cn(
                            'border-b border-border/20 last:border-0 hover:bg-secondary/30 transition-colors',
                            i % 2 === 0 ? 'bg-transparent' : 'bg-secondary/10'
                        )}
                    >
                      <td className="p-3">
                        <Link
                            href={`/heroes/${player.heroId}`}
                            className="flex items-center gap-3 group"
                        >
                          {hero && (
                              <div className="relative">
                                <Image
                                    src={hero.icon}
                                    alt={hero.localizedName}
                                    width={36}
                                    height={36}
                                    className="rounded-lg border border-border/40 group-hover:border-primary/40 transition-colors"
                                />
                              </div>
                          )}
                          <div>
                          <span className="font-medium group-hover:text-primary transition-colors">
                            {player.heroName}
                          </span>
                            <p className="text-xs text-muted-foreground">
                              KDA: {kda}
                            </p>
                          </div>
                        </Link>
                      </td>
                      <td className="text-center p-3 font-medium">{player.level}</td>
                      <td className="text-center p-3 font-bold text-green-400">{player.kills}</td>
                      <td className="text-center p-3 font-bold text-red-400">{player.deaths}</td>
                      <td className="text-center p-3 font-medium text-blue-400">{player.assists}</td>
                      <td className="text-center p-3 font-mono text-sm">
                        <span className="text-foreground">{player.lastHits}</span>
                        <span className="text-muted-foreground">/</span>
                        <span className="text-muted-foreground">{player.denies}</span>
                      </td>
                      <td className="text-center p-3 font-medium text-yellow-400">{player.goldPerMin}</td>
                      <td className="text-center p-3 font-medium text-blue-400">{player.xpPerMin}</td>
                      <td className="text-center p-3 font-mono text-sm">{player.heroDamage.toLocaleString()}</td>
                      <td className="text-center p-3 font-mono text-sm">{player.towerDamage.toLocaleString()}</td>
                    </tr>
                )
              })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
  )
}

function DraftView({ pickBans }: { pickBans: MatchDetails['pickBans'] }) {
  if (!pickBans || pickBans.length === 0) {
    return (
        <Card className="border-border/40 bg-card/50 backdrop-blur">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-4">
              <Swords className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium mb-2">Draft data not available</p>
            <p className="text-muted-foreground">This match may not have draft information recorded</p>
          </CardContent>
        </Card>
    )
  }

  const radiantPicks = pickBans.filter(pb => pb.team === 'radiant' && pb.isPick)
  const radiantBans = pickBans.filter(pb => pb.team === 'radiant' && !pb.isPick)
  const direPicks = pickBans.filter(pb => pb.team === 'dire' && pb.isPick)
  const direBans = pickBans.filter(pb => pb.team === 'dire' && !pb.isPick)

  return (
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-border/40 bg-card/50 backdrop-blur overflow-hidden">
          <CardHeader className="bg-green-500/5 border-b border-border/40">
            <CardTitle className="text-green-400 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              Radiant Draft
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4 text-green-400" />
                  Picks ({radiantPicks.length})
                </p>
                <div className="grid grid-cols-5 gap-2">
                  {radiantPicks.map(pb => {
                    const hero = HEROES[pb.heroId]
                    return (
                        <Link
                            key={pb.order}
                            href={`/heroes/${pb.heroId}`}
                            className="group"
                        >
                          <div className="relative aspect-square rounded-lg overflow-hidden border border-green-500/30 bg-green-500/10 group-hover:border-green-500/60 transition-colors">
                            {hero && (
                                <Image
                                    src={hero.img}
                                    alt={pb.heroName}
                                    fill
                                    className="object-cover"
                                />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                            <p className="absolute bottom-1 left-1 right-1 text-[10px] font-medium text-white truncate text-center">
                              {pb.heroName}
                            </p>
                          </div>
                        </Link>
                    )
                  })}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <Skull className="w-4 h-4 text-red-400" />
                  Bans ({radiantBans.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {radiantBans.map(pb => {
                    const hero = HEROES[pb.heroId]
                    return (
                        <div
                            key={pb.order}
                            className="flex items-center gap-2 px-2 py-1.5 bg-red-500/10 border border-red-500/20 rounded-lg opacity-70"
                        >
                          {hero && (
                              <Image
                                  src={hero.icon}
                                  alt={pb.heroName}
                                  width={20}
                                  height={20}
                                  className="rounded grayscale"
                              />
                          )}
                          <span className="text-xs line-through text-muted-foreground">{pb.heroName}</span>
                        </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-card/50 backdrop-blur overflow-hidden">
          <CardHeader className="bg-red-500/5 border-b border-border/40">
            <CardTitle className="text-primary flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              Dire Draft
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" />
                  Picks ({direPicks.length})
                </p>
                <div className="grid grid-cols-5 gap-2">
                  {direPicks.map(pb => {
                    const hero = HEROES[pb.heroId]
                    return (
                        <Link
                            key={pb.order}
                            href={`/heroes/${pb.heroId}`}
                            className="group"
                        >
                          <div className="relative aspect-square rounded-lg overflow-hidden border border-red-500/30 bg-red-500/10 group-hover:border-red-500/60 transition-colors">
                            {hero && (
                                <Image
                                    src={hero.img}
                                    alt={pb.heroName}
                                    fill
                                    className="object-cover"
                                />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                            <p className="absolute bottom-1 left-1 right-1 text-[10px] font-medium text-white truncate text-center">
                              {pb.heroName}
                            </p>
                          </div>
                        </Link>
                    )
                  })}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <Skull className="w-4 h-4 text-muted-foreground" />
                  Bans ({direBans.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {direBans.map(pb => {
                    const hero = HEROES[pb.heroId]
                    return (
                        <div
                            key={pb.order}
                            className="flex items-center gap-2 px-2 py-1.5 bg-secondary/50 border border-border/40 rounded-lg opacity-70"
                        >
                          {hero && (
                              <Image
                                  src={hero.icon}
                                  alt={pb.heroName}
                                  width={20}
                                  height={20}
                                  className="rounded grayscale"
                              />
                          )}
                          <span className="text-xs line-through text-muted-foreground">{pb.heroName}</span>
                        </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
  )
}