import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LogoutButton } from '@/components/ui/logout-button'
import { AUTH_DISABLED } from '@/lib/auth-mode'
import { LayoutDashboard, Building2, Settings } from 'lucide-react'

/**
 * Layout principal du dashboard
 * Sidebar fixe + zone de contenu scrollable
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
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 flex flex-col border-r border-border bg-sidebar">
        {/* Logo */}
        <div className="px-4 py-5 border-b border-sidebar-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-lg">
              🎯
            </div>
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
