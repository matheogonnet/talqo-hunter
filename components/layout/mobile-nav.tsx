'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Building2, Settings } from 'lucide-react'

const LINKS = [
  { href: '/', icon: LayoutDashboard, label: 'Pipeline' },
  { href: '/prospects', icon: Building2, label: 'Prospects' },
  { href: '/settings', icon: Settings, label: 'Réglages' },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden shrink-0 flex items-center justify-around border-t border-border bg-background h-16">
      {LINKS.map(({ href, icon: Icon, label }) => {
        const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-1 flex-1 py-2 transition-colors ${
              isActive
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
