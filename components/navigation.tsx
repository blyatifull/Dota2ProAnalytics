'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Users, Swords, Map, BarChart3, Gamepad2 } from 'lucide-react'

const navItems = [
  { href: '/', label: 'Overview', icon: BarChart3 },
  { href: '/heroes', label: 'Heroes', icon: Users },
  { href: '/matches', label: 'Matches', icon: Map },
  { href: '/drafts', label: 'Drafts', icon: Swords },
]

export function Navigation() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center">
        {/* Logo */}
        <Link href="/" className="mr-8 flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-shadow">
            <Gamepad2 className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="hidden sm:block">
            <span className="font-bold text-lg tracking-tight">D2 Pro</span>
            <span className="text-primary font-bold text-lg">Analytics</span>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-1">
          {navItems.map(item => {
            const isActive = pathname === item.href || 
              (item.href !== '/' && pathname.startsWith(item.href))
            const Icon = item.icon
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                  isActive 
                    ? 'bg-primary/10 text-primary border border-primary/20' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                )}
              >
                <Icon className={cn(
                  'w-4 h-4 transition-colors',
                  isActive ? 'text-primary' : ''
                )} />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span>Live data from OpenDota & STRATZ</span>
          </div>
        </div>
      </div>
    </header>
  )
}
