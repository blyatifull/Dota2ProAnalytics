'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { HERO_LIST, ATTR_COLORS, ATTR_NAMES } from '@/lib/constants/heroes'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Search, Filter } from 'lucide-react'
import type { Hero, HeroStats } from '@/types/dota'

interface HeroGridProps {
  stats?: HeroStats[]
}

export function HeroGrid({ stats }: HeroGridProps) {
  const [search, setSearch] = useState('')
  const [attrFilter, setAttrFilter] = useState<string | null>(null)
  const [roleFilter, setRoleFilter] = useState<string | null>(null)

  // Get stats map for quick lookup
  const statsMap = new Map(stats?.map(s => [s.heroId, s]))

  // Filter heroes
  const filteredHeroes = HERO_LIST.filter(hero => {
    const matchesSearch = hero.localizedName.toLowerCase().includes(search.toLowerCase())
    const matchesAttr = !attrFilter || hero.primaryAttr === attrFilter
    const matchesRole = !roleFilter || hero.roles.includes(roleFilter)
    return matchesSearch && matchesAttr && matchesRole
  })

  // Get unique roles
  const allRoles = Array.from(new Set(HERO_LIST.flatMap(h => h.roles))).sort()

  // Group by attribute for display
  const heroesByAttr = {
    str: filteredHeroes.filter(h => h.primaryAttr === 'str'),
    agi: filteredHeroes.filter(h => h.primaryAttr === 'agi'),
    int: filteredHeroes.filter(h => h.primaryAttr === 'int'),
    all: filteredHeroes.filter(h => h.primaryAttr === 'all'),
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="border-border/40 bg-card/50 backdrop-blur">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search heroes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-secondary/50 border-border/40 focus:border-primary/50"
              />
            </div>
            
            {/* Attribute filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <div className="flex gap-1">
                {(['str', 'agi', 'int', 'all'] as const).map(attr => (
                  <button
                    key={attr}
                    onClick={() => setAttrFilter(attrFilter === attr ? null : attr)}
                    className={cn(
                      'px-3 py-1.5 text-sm font-medium rounded-lg transition-all border',
                      attrFilter === attr 
                        ? 'text-white border-transparent' 
                        : 'bg-secondary/50 text-muted-foreground border-border/40 hover:bg-secondary hover:text-foreground'
                    )}
                    style={attrFilter === attr ? { 
                      backgroundColor: ATTR_COLORS[attr],
                      boxShadow: `0 0 12px ${ATTR_COLORS[attr]}40`
                    } : undefined}
                  >
                    {ATTR_NAMES[attr]}
                  </button>
                ))}
              </div>
            </div>

            {/* Role filter */}
            <select
              value={roleFilter || ''}
              onChange={(e) => setRoleFilter(e.target.value || null)}
              className="px-3 py-2 text-sm rounded-lg bg-secondary/50 border border-border/40 text-foreground focus:border-primary/50 focus:outline-none"
            >
              <option value="">All Roles</option>
              {allRoles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Hero count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing <span className="text-foreground font-medium">{filteredHeroes.length}</span> of {HERO_LIST.length} heroes
        </p>
        {(attrFilter || roleFilter || search) && (
          <button
            onClick={() => {
              setSearch('')
              setAttrFilter(null)
              setRoleFilter(null)
            }}
            className="text-sm text-primary hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Grid by attribute */}
      {!attrFilter ? (
        <div className="space-y-8">
          {(['str', 'agi', 'int', 'all'] as const).map(attr => {
            const heroes = heroesByAttr[attr]
            if (heroes.length === 0) return null
            
            return (
              <div key={attr}>
                <div className="flex items-center gap-3 mb-4">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: ATTR_COLORS[attr] }}
                  />
                  <h3 className="text-lg font-semibold">{ATTR_NAMES[attr]}</h3>
                  <Badge variant="outline" className="border-border/40 text-muted-foreground">
                    {heroes.length}
                  </Badge>
                </div>
                <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-9 lg:grid-cols-11 xl:grid-cols-13 gap-2">
                  {heroes.map(hero => (
                    <HeroCard 
                      key={hero.id} 
                      hero={hero} 
                      stats={statsMap.get(hero.id)}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-9 lg:grid-cols-11 xl:grid-cols-13 gap-2">
          {filteredHeroes.map(hero => (
            <HeroCard 
              key={hero.id} 
              hero={hero} 
              stats={statsMap.get(hero.id)}
            />
          ))}
        </div>
      )}

      {filteredHeroes.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-lg font-medium mb-2">No heroes found</p>
          <p className="text-muted-foreground">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  )
}

interface HeroCardProps {
  hero: Hero
  stats?: HeroStats
}

function HeroCard({ hero, stats }: HeroCardProps) {
  const hasStats = stats && stats.matchCount > 0
  const isHighWinrate = hasStats && stats.winRate >= 52
  const isLowWinrate = hasStats && stats.winRate < 48
  
  return (
    <Link
      href={`/heroes/${hero.id}`}
      className="group relative aspect-[4/5] rounded-lg overflow-hidden bg-card border border-border/40 hover:border-primary/50 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-primary/10"
    >
      {/* Hero image */}
      <Image
        src={hero.img}
        alt={hero.localizedName}
        fill
        className="object-cover transition-transform duration-300 group-hover:scale-110"
        sizes="(max-width: 640px) 20vw, (max-width: 768px) 14vw, (max-width: 1024px) 11vw, 8vw"
      />
      
      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
      
      {/* Attribute indicator */}
      <div 
        className="absolute top-1.5 left-1.5 w-2.5 h-2.5 rounded-full shadow-lg"
        style={{ 
          backgroundColor: ATTR_COLORS[hero.primaryAttr],
          boxShadow: `0 0 6px ${ATTR_COLORS[hero.primaryAttr]}`
        }}
      />
      
      {/* Winrate indicator */}
      {hasStats && (
        <div className={cn(
          'absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full',
          isHighWinrate ? 'bg-green-500' : isLowWinrate ? 'bg-red-500' : 'bg-yellow-500'
        )} />
      )}
      
      {/* Hero name and stats */}
      <div className="absolute bottom-0 left-0 right-0 p-2">
        <p className="text-xs font-semibold text-white truncate text-center mb-0.5">
          {hero.localizedName}
        </p>
        
        {hasStats ? (
          <p className={cn(
            'text-xs text-center font-bold',
            isHighWinrate ? 'text-green-400' : isLowWinrate ? 'text-red-400' : 'text-yellow-400'
          )}>
            {stats.winRate.toFixed(1)}%
          </p>
        ) : (
          <p className="text-xs text-center text-muted-foreground">-</p>
        )}
      </div>
      
      {/* Hover overlay */}
      <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors" />
    </Link>
  )
}
