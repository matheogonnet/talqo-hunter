'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'

export function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="w-full justify-start text-muted-foreground hover:text-foreground gap-2"
      onClick={handleLogout}
    >
      <LogOut className="w-3.5 h-3.5" />
      Déconnexion
    </Button>
  )
}
