import { notFound } from 'next/navigation'
import Link from 'next/link'
import { HeroDetailsView } from '@/components/heroes/hero-details'
import { Button } from '@/components/ui/button'
import { HEROES } from '@/lib/constants/heroes'
import { ArrowLeft } from 'lucide-react'
import type { HeroDetails } from '@/types/dota'

async function getHeroDetails(heroId: number): Promise<HeroDetails | null> {
  try {
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000'
    
    const res = await fetch(`${baseUrl}/api/heroes/${heroId}`, {
      next: { revalidate: 3600 },
    })
    
    if (!res.ok) {
      return null
    }
    
    return res.json()
  } catch (error) {
    console.error('Error fetching hero details:', error)
    return null
  }
}

export async function generateStaticParams() {
  return Object.keys(HEROES).map(id => ({ id }))
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const hero = HEROES[parseInt(id)]
  
  return {
    title: hero ? `${hero.localizedName} - Pro Stats` : 'Hero Details',
    description: hero 
      ? `Professional match statistics and builds for ${hero.localizedName} in Dota 2`
      : 'Dota 2 hero statistics',
  }
}

export default async function HeroPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const heroId = parseInt(id)
  
  if (isNaN(heroId) || !HEROES[heroId]) {
    notFound()
  }

  const details = await getHeroDetails(heroId)
  
  if (!details) {
    notFound()
  }

  return (
    <div className="container py-8">
      <Link href="/heroes">
        <Button variant="ghost" size="sm" className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Heroes
        </Button>
      </Link>
      
      <HeroDetailsView details={details} />
    </div>
  )
}
