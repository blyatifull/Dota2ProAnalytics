import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Users, Swords, Map, TrendingUp, Trophy, Clock } from 'lucide-react'
import { HEROES, HERO_LIST } from '@/lib/constants/heroes'
import { formatPercent } from '@/lib/utils/stats-calc'
import { cn } from '@/lib/utils'
import type { HeroStats, ProMatch, DraftStats } from '@/types/dota'

async function getData() {
  const baseUrl = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : 'http://localhost:3000'
  
  try {
    const [heroesRes, matchesRes, draftsRes] = await Promise.all([
      fetch(`${baseUrl}/api/heroes`, { next: { revalidate: 3600 } }),
      fetch(`${baseUrl}/api/matches?limit=5`, { next: { revalidate: 300 } }),
      fetch(`${baseUrl}/api/drafts`, { next: { revalidate: 1800 } }),
    ])

    const [heroesData, matchesData, draftsData] = await Promise.all([
      heroesRes.ok ? heroesRes.json() : { stats: [] },
      matchesRes.ok ? matchesRes.json() : { matches: [] },
      draftsRes.ok ? draftsRes.json() : { stats: [] },
    ])

    return {
      heroStats: heroesData.stats as HeroStats[],
      recentMatches: (matchesData.matches as ProMatch[]).slice(0, 5),
      draftStats: draftsData.stats as DraftStats[],
    }
  } catch (error) {
    console.error('Error fetching home data:', error)
    return { heroStats: [], recentMatches: [], draftStats: [] }
  }
}

export default async function HomePage() {
  const { heroStats, recentMatches, draftStats } = await getData()

  // Top heroes by winrate (minimum 50 matches for reliability)
  const topWinrate = heroStats
    .filter(s => s.matchCount >= 50)
    .sort((a, b) => b.winRate - a.winRate)
    .slice(0, 5)

  // Most picked heroes
  const mostPicked = [...heroStats]
    .sort((a, b) => b.matchCount - a.matchCount)
    .slice(0, 5)

  // Most contested (pick + ban)
  const mostContested = draftStats.slice(0, 5)

  // Calculate totals
  const totalMatches = heroStats.reduce((acc, s) => acc + s.matchCount, 0) / 10

  return (
    <div className="min-h-screen">
      {/* Hero Section with gradient */}
      <section className="relative border-b border-border/40">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        
        <div className="container relative py-16">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4 border-primary/30 text-primary">
              Pro Match Analytics
            </Badge>
            <h1 className="text-5xl font-bold mb-4 tracking-tight">
              Dota 2 <span className="text-primary">Pro</span> Analytics
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Comprehensive statistics and analysis from professional Dota 2 matches. 
              Track hero meta, draft trends, and ward placements from TI and Major tournaments.
            </p>
          </div>
          
          {/* Stats Cards - 3 cards evenly distributed */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card className="border-border/40 bg-card/50 backdrop-blur hover:border-primary/30 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold">{HERO_LIST.length}</p>
                    <p className="text-sm text-muted-foreground">Heroes</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-border/40 bg-card/50 backdrop-blur hover:border-green-500/30 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                    <TrendingUp className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold">{Math.round(totalMatches)}+</p>
                    <p className="text-sm text-muted-foreground">Pro Matches</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-border/40 bg-card/50 backdrop-blur hover:border-yellow-500/30 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                    <Trophy className="w-6 h-6 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold truncate">
                      {mostContested[0]?.heroName?.split(' ')[0] || 'N/A'}
                    </p>
                    <p className="text-sm text-muted-foreground">Most Contested</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container py-12">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Top Winrate Heroes */}
          <Card className="border-border/40 bg-card/50 backdrop-blur flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                </div>
                <CardTitle className="text-lg">Top Win Rate</CardTitle>
              </div>
              <Link href="/heroes">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                  View All <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-xs text-muted-foreground mb-3">Minimum 50 matches</p>
              <div className="space-y-2">
                {topWinrate.map((stat, i) => {
                  const hero = HEROES[stat.heroId]
                  if (!hero) return null
                  return (
                    <Link
                      key={stat.heroId}
                      href={`/heroes/${stat.heroId}`}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-all group"
                    >
                      <span className="text-sm font-bold text-muted-foreground w-5">{i + 1}</span>
                      <div className="relative">
                        <Image
                          src={hero.icon}
                          alt={hero.localizedName}
                          width={36}
                          height={36}
                          className="rounded-lg border border-border/40 group-hover:border-primary/40 transition-colors"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{hero.localizedName}</p>
                        <p className="text-xs text-muted-foreground">{stat.matchCount} matches</p>
                      </div>
                      <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
                        {formatPercent(stat.winRate)}
                      </Badge>
                    </Link>
                  )
                })}
                {topWinrate.length === 0 && (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-3">
                      <TrendingUp className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">Loading statistics...</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Most Picked Heroes */}
          <Card className="border-border/40 bg-card/50 backdrop-blur flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="w-4 h-4 text-primary" />
                </div>
                <CardTitle className="text-lg">Most Picked</CardTitle>
              </div>
              <Link href="/drafts">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                  View All <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-xs text-muted-foreground mb-3">By pick count</p>
              <div className="space-y-2">
                {mostPicked.map((stat, i) => {
                  const hero = HEROES[stat.heroId]
                  if (!hero) return null
                  return (
                    <Link
                      key={stat.heroId}
                      href={`/heroes/${stat.heroId}`}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-all group"
                    >
                      <span className="text-sm font-bold text-muted-foreground w-5">{i + 1}</span>
                      <div className="relative">
                        <Image
                          src={hero.icon}
                          alt={hero.localizedName}
                          width={36}
                          height={36}
                          className="rounded-lg border border-border/40 group-hover:border-primary/40 transition-colors"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{hero.localizedName}</p>
                        <p className="text-xs text-muted-foreground">
                          {stat.winRate.toFixed(1)}% winrate
                        </p>
                      </div>
                      <span className="text-sm font-mono text-muted-foreground">
                        {stat.matchCount}
                      </span>
                    </Link>
                  )
                })}
                {mostPicked.length === 0 && (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-3">
                      <Users className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">Loading statistics...</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Matches - Limited to 5 */}
          <Card className="border-border/40 bg-card/50 backdrop-blur flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Clock className="w-4 h-4 text-blue-500" />
                </div>
                <CardTitle className="text-lg">Recent Pro Matches</CardTitle>
              </div>
              <Link href="/matches">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                  View All <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-xs text-muted-foreground mb-3">Latest 5 matches</p>
              <div className="space-y-2">
                {recentMatches.slice(0, 5).map(match => {
                  const date = new Date(match.startTime * 1000)
                  const duration = Math.floor(match.duration / 60)
                  return (
                    <Link
                      key={match.matchId}
                      href={`/matches/${match.matchId}`}
                      className="block p-3 rounded-lg hover:bg-secondary/50 transition-all group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={cn(
                          'font-medium text-sm truncate max-w-20',
                          match.radiantWin ? 'text-green-400' : 'text-muted-foreground'
                        )}>
                          {match.radiantTeamName || 'Radiant'}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            'font-bold',
                            match.radiantWin ? 'text-green-400' : 'text-muted-foreground'
                          )}>
                            {match.radiantScore}
                          </span>
                          <span className="text-muted-foreground">-</span>
                          <span className={cn(
                            'font-bold',
                            !match.radiantWin ? 'text-primary' : 'text-muted-foreground'
                          )}>
                            {match.direScore}
                          </span>
                        </div>
                        <span className={cn(
                          'font-medium text-sm truncate max-w-20 text-right',
                          !match.radiantWin ? 'text-primary' : 'text-muted-foreground'
                        )}>
                          {match.direTeamName || 'Dire'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="truncate max-w-28">{match.leagueName || 'Pro Match'}</span>
                        <span>{duration}m | {date.toLocaleDateString()}</span>
                      </div>
                    </Link>
                  )
                })}
                {recentMatches.length === 0 && (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-3">
                      <Clock className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">Loading matches...</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feature Cards */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Explore Features</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Link href="/heroes" className="group">
              <Card className="h-full border-border/40 bg-card/50 backdrop-blur hover:border-primary/50 hover:bg-card/80 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 w-fit mb-4 group-hover:bg-primary/20 transition-colors">
                    <Users className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                    Hero Statistics
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Browse all heroes with professional match statistics, counter matchups, 
                    item builds, and ability skill orders.
                  </p>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/drafts" className="group">
              <Card className="h-full border-border/40 bg-card/50 backdrop-blur hover:border-primary/50 hover:bg-card/80 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 w-fit mb-4 group-hover:bg-primary/20 transition-colors">
                    <Swords className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                    Draft Analytics
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Analyze pick/ban trends, win rates, and contest rates 
                    across professional tournaments and patches.
                  </p>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/matches" className="group">
              <Card className="h-full border-border/40 bg-card/50 backdrop-blur hover:border-primary/50 hover:bg-card/80 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 w-fit mb-4 group-hover:bg-primary/20 transition-colors">
                    <Map className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                    Match Analysis
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    View interactive ward maps, player movements, 
                    and detailed scoreboards for professional matches.
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
