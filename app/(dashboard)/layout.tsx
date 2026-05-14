import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LogoutButton } from '@/components/ui/logout-button'
import { TalqoMark } from '@/components/brand/talqo-mark'
import { AUTH_DISABLED } from '@/lib/auth-mode'
import { LayoutDashboard, Building2, Settings } from 'lucide-react'
import { MobileNav } from '@/components/layout/mobile-nav'

/**
 * Layout principal du dashboard
 * Desktop : sidebar fixe + zone de contenu scrollable
 * Mobile  : top bar + bottom nav iOS-style, sidebar cachée
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!AUTH_DISABLED && !user) redirect('/login')

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">

      {/* ── Mobile top bar (caché sur md+) ── */}
      <header className="md:hidden shrink-0 flex items-center gap-2.5 px-4 h-14 border-b border-border bg-background">
        <TalqoMark size={28} className="w-7 h-7" />
        <p className="text-sm font-semibold">Talqo Hunter</p>
      </header>

      {/* ── Zone centrale : sidebar (desktop) + contenu ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar — visible uniquement desktop */}
        <aside className="hidden md:flex w-56 flex-shrink-0 flex-col border-r border-border bg-sidebar">
          {/* Logo */}
          <div className="px-4 py-5 border-b border-sidebar-border">
            <div className="flex items-center gap-2.5">
              <TalqoMark size={32} className="w-8 h-8" />
              <div>
                <p className="text-sm font-semibold leading-none">Talqo Hunter</p>
                <p className="text-xs text-muted-foreground mt-0.5">Prospection P1</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-3 space-y-0.5">
            <NavItem href="/" icon={<LayoutDashboard className="w-4 h-4" />} label="Pipeline" />
            <NavItem href="/prospects" icon={<Building2 className="w-4 h-4" />} label="Prospects" />
            <NavItem href="/settings" icon={<Settings className="w-4 h-4" />} label="Paramètres" />
          </nav>

          {/* Footer sidebar */}
          <div className="px-3 py-3 border-t border-sidebar-border space-y-2">
            <div className="px-2 py-1.5">
              <p className="text-xs text-muted-foreground truncate">
                {AUTH_DISABLED
                  ? 'Accès libre (auth désactivée)'
                  : (user?.email ?? '')}
              </p>
            </div>
            {!AUTH_DISABLED ? <LogoutButton /> : null}
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          {children}
        </main>

      </div>

      {/* ── Mobile bottom nav (caché sur md+) ── */}
      <MobileNav />

    </div>
  )
}

function NavItem({
  href,
  icon,
  label,
}: {
  href: string
  icon: React.ReactNode
  label: string
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
    >
      {icon}
      {label}
    </Link>
  )
}
