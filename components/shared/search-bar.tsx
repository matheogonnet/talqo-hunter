'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Search, X } from 'lucide-react'

interface SearchBarProps {
  paramName?: string
  placeholder?: string
  className?: string
}

export function SearchBar({
  paramName = 'q',
  placeholder = 'Rechercher…',
  className,
}: SearchBarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [value, setValue] = useState(searchParams.get(paramName) ?? '')

  useEffect(() => {
    setValue(searchParams.get(paramName) ?? '')
  }, [searchParams, paramName])

  useEffect(() => {
    const currentQ = searchParams.get(paramName) ?? ''
    if (value.trim() === currentQ) return

    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      const trimmed = value.trim()
      if (trimmed) params.set(paramName, trimmed)
      else params.delete(paramName)
      const qs = params.toString()
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    }, 300)

    return () => clearTimeout(timer)
  }, [value, paramName, pathname, router, searchParams])

  return (
    <div className={`relative ${className ?? ''}`}>
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
      <Input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="pl-8 pr-8"
      />
      {value && (
        <button
          type="button"
          onClick={() => setValue('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Effacer la recherche"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}
