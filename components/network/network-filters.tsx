'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { LEVER_TYPES } from '@/lib/lever-types'
import type { LeverType } from '@/lib/types/database'

export function NetworkFilters({ counts }: { counts: Record<string, number> }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const current = searchParams.get('lever') ?? 'all'

  function setFilter(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'all') params.delete('lever')
    else params.set('lever', value)
    router.push(`${pathname}?${params.toString()}`)
  }

  const total = Object.values(counts).reduce((s, n) => s + n, 0)

  const filters = [
    { value: 'all', label: 'Tous', emoji: '🔍', count: total },
    ...LEVER_TYPES.filter((t) => t.value !== 'other').map((t) => ({
      value: t.value,
      label: t.label,
      emoji: t.emoji,
      count: counts[t.value] ?? 0,
    })),
  ]

  return (
    <div className="flex gap-2 flex-wrap">
      {filters.map((f) => (
        <button
          key={f.value}
          onClick={() => setFilter(f.value)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
            current === f.value
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-background text-muted-foreground border-border hover:text-foreground hover:border-foreground/30'
          }`}
        >
          <span>{f.emoji}</span>
          {f.label}
          <span className={`ml-0.5 ${current === f.value ? 'opacity-80' : 'opacity-50'}`}>
            {f.count}
          </span>
        </button>
      ))}
    </div>
  )
}
