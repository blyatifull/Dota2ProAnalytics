'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { formatPercent } from '@/lib/utils/stats-calc'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import type { DraftStats } from '@/types/dota'

interface WinrateTableProps {
  stats: DraftStats[]
}

type SortField = 'heroName' | 'matchCount' | 'winRate' | 'pickRate' | 'banRate' | 'contestRate'
type SortDirection = 'asc' | 'desc'

export function WinrateTable({ stats }: WinrateTableProps) {
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState<SortField>('contestRate')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const sortedStats = useMemo(() => {
    let filtered = stats.filter(s => 
      s.heroName.toLowerCase().includes(search.toLowerCase())
    )
    
    return filtered.sort((a, b) => {
      const aVal = a[sortField]
      const bVal = b[sortField]
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal)
      }
      
      return sortDirection === 'asc' 
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number)
    })
  }, [stats, search, sortField, sortDirection])

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 px-2 font-medium"
      onClick={() => handleSort(field)}
    >
      {children}
      {sortField === field ? (
        sortDirection === 'asc' ? (
          <ArrowUp className="ml-1 h-4 w-4" />
        ) : (
          <ArrowDown className="ml-1 h-4 w-4" />
        )
      ) : (
        <ArrowUpDown className="ml-1 h-4 w-4 opacity-50" />
      )}
    </Button>
  )

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search heroes..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-xs"
      />
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>
                <SortButton field="heroName">Hero</SortButton>
              </TableHead>
              <TableHead className="text-right">
                <SortButton field="matchCount">Matches</SortButton>
              </TableHead>
              <TableHead className="text-right">
                <SortButton field="winRate">Win Rate</SortButton>
              </TableHead>
              <TableHead className="text-right">
                <SortButton field="pickRate">Pick Rate</SortButton>
              </TableHead>
              <TableHead className="text-right">
                <SortButton field="banRate">Ban Rate</SortButton>
              </TableHead>
              <TableHead className="text-right">
                <SortButton field="contestRate">Contest Rate</SortButton>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedStats.map((stat, index) => (
              <TableRow key={stat.heroId}>
                <TableCell className="font-medium text-muted-foreground">
                  {index + 1}
                </TableCell>
                <TableCell>
                  <Link 
                    href={`/heroes/${stat.heroId}`}
                    className="flex items-center gap-2 hover:underline"
                  >
                    <Image
                      src={stat.heroIcon}
                      alt={stat.heroName}
                      width={28}
                      height={28}
                      className="rounded"
                    />
                    <span className="font-medium">{stat.heroName}</span>
                  </Link>
                </TableCell>
                <TableCell className="text-right">
                  {stat.matchCount.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  <span className={cn(
                    'font-medium',
                    stat.winRate >= 55 && 'text-green-600',
                    stat.winRate >= 50 && stat.winRate < 55 && 'text-green-500',
                    stat.winRate < 50 && stat.winRate >= 45 && 'text-orange-500',
                    stat.winRate < 45 && 'text-red-500'
                  )}>
                    {formatPercent(stat.winRate)}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  {formatPercent(stat.pickRate)}
                </TableCell>
                <TableCell className="text-right">
                  {formatPercent(stat.banRate)}
                </TableCell>
                <TableCell className="text-right">
                  <span className={cn(
                    'font-medium',
                    stat.contestRate >= 50 && 'text-primary'
                  )}>
                    {formatPercent(stat.contestRate)}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
