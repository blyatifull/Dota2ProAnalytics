import { MatchList } from '@/components/matches/match-list'
import type { ProMatch } from '@/types/dota'

async function getProMatches(): Promise<ProMatch[]> {
  try {
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000'
    
    const res = await fetch(`${baseUrl}/api/matches?limit=50`, {
      next: { revalidate: 300 }, // 5 minutes
    })
    
    if (!res.ok) {
      console.error('Failed to fetch pro matches:', res.statusText)
      return []
    }
    
    const data = await res.json()
    return data.matches || []
  } catch (error) {
    console.error('Error fetching pro matches:', error)
    return []
  }
}

export default async function MatchesPage() {
  const matches = await getProMatches()

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Professional Matches</h1>
        <p className="text-muted-foreground">
          Recent professional Dota 2 matches. Click on a match to see detailed analysis with ward placements and player movements.
        </p>
      </div>
      
      <MatchList matches={matches} />
    </div>
  )
}
