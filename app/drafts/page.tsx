import { WinrateTable } from '@/components/drafts/winrate-table'
import { PickBanChart } from '@/components/drafts/pick-ban-chart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { DraftStats } from '@/types/dota'

async function getDraftStats(): Promise<DraftStats[]> {
  try {
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000'
    
    const res = await fetch(`${baseUrl}/api/drafts`, {
      next: { revalidate: 1800 }, // 30 minutes
    })
    
    if (!res.ok) {
      console.error('Failed to fetch draft stats:', res.statusText)
      return []
    }
    
    const data = await res.json()
    return data.stats || []
  } catch (error) {
    console.error('Error fetching draft stats:', error)
    return []
  }
}

export default async function DraftsPage() {
  const stats = await getDraftStats()

  // Calculate summary stats
  const totalMatches = stats.length > 0 
    ? Math.max(...stats.map(s => s.matchCount)) 
    : 0
  const avgWinrate = stats.length > 0
    ? stats.reduce((sum, s) => sum + s.winRate * s.matchCount, 0) / 
      stats.reduce((sum, s) => sum + s.matchCount, 0)
    : 50
  const mostContested = stats.length > 0
    ? stats.sort((a, b) => b.contestRate - a.contestRate)[0]
    : null

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Draft Analytics</h1>
        <p className="text-muted-foreground">
          Pick and ban statistics from professional Dota 2 matches. Analyze the meta and discover trending heroes.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Heroes Analyzed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.length}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Win Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{avgWinrate.toFixed(1)}%</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Most Contested Hero
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {mostContested?.heroName || 'N/A'}
            </p>
            {mostContested && (
              <p className="text-sm text-muted-foreground">
                {mostContested.contestRate.toFixed(1)}% contest rate
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="charts" className="w-full">
        <TabsList>
          <TabsTrigger value="charts">Charts</TabsTrigger>
          <TabsTrigger value="table">Full Table</TabsTrigger>
        </TabsList>
        
        <TabsContent value="charts" className="mt-6">
          <PickBanChart stats={stats} />
        </TabsContent>
        
        <TabsContent value="table" className="mt-6">
          <WinrateTable stats={stats} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
