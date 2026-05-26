import { HeroGrid } from '@/components/heroes/hero-grid'
import type { HeroStats } from '@/types/dota'

async function getHeroStats(): Promise<HeroStats[]> {
  try {
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000'
    
    const res = await fetch(`${baseUrl}/api/heroes`, {
      next: { revalidate: 3600 }, // 1 hour
    })
    
    if (!res.ok) {
      console.error('Failed to fetch hero stats:', res.statusText)
      return []
    }
    
    const data = await res.json()
    return data.stats || []
  } catch (error) {
    console.error('Error fetching hero stats:', error)
    return []
  }
}

export default async function HeroesPage() {
  const stats = await getHeroStats()

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Heroes</h1>
        <p className="text-muted-foreground">
          Professional match statistics for all Dota 2 heroes. Click on a hero to see detailed analysis.
        </p>
      </div>
      
      <HeroGrid stats={stats} />
    </div>
  )
}
