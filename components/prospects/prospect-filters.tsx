'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { SearchBar } from '@/components/shared/search-bar'
import { KANBAN_COLUMNS } from '@/lib/kanban-columns'
import { ALL_SECTORS } from '@/lib/sectors'

interface ProspectFiltersProps {
  counts?: { total: number; byStatus: Record<string, number> }
  showStatusFilters?: boolean
  showSectorFilter?: boolean
}

export function ProspectFilters({
  counts,
  showStatusFilters = true,
  showSectorFilter = true,
}: ProspectFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentStatus = searchParams.get('status') ?? 'all'
  const currentSector = searchParams.get('sector') ?? 'all'

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'all') params.delete(key)
    else params.set(key, value)
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }

  const statusFilters = [
    { value: 'all', label: 'Tous', count: counts?.total },
    ...KANBAN_COLUMNS.map((col) => ({
      value: col.status,
      label: col.label.replace(' 🎉', '').replace(' 🚫', ''),
      count: counts?.byStatus[col.status],
    })),
  ]

  return (
    <div className="space-y-3">
      <SearchBar
        placeholder="Entreprise, secteur, ATS, contact…"
        className="max-w-md"
      />

      {showStatusFilters && (
        <div className="flex gap-2 flex-wrap">
          {statusFilters.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => updateParam('status', f.value)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                currentStatus === f.value
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-muted-foreground border-border hover:text-foreground hover:border-foreground/30'
              }`}
            >
              {f.label}
              {f.count != null && (
                <span className={`ml-0.5 ${currentStatus === f.value ? 'opacity-80' : 'opacity-50'}`}>
                  {f.count}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {showSectorFilter && (
        <select
          value={currentSector}
          onChange={(e) => updateParam('sector', e.target.value)}
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
        >
          <option value="all">Tous les secteurs</option>
          {ALL_SECTORS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      )}
    </div>
  )
}
