'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { XCircle, Loader2, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { updateProspectStatus } from '@/lib/actions/prospects'
import type { ProspectStatus } from '@/lib/types/database'

interface RejectProspectButtonProps {
  prospectId: string
  currentStatus: ProspectStatus
}

export function RejectProspectButton({ prospectId, currentStatus }: RejectProspectButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  if (currentStatus === 'rejected') {
    return (
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-red-100 text-red-700 border border-red-200">
          <XCircle className="w-4 h-4" />
          Refusé
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-xs text-muted-foreground h-8"
          disabled={loading}
          onClick={async () => {
            setLoading(true)
            const result = await updateProspectStatus(prospectId, 'new')
            if (!result.success) {
              toast.error('Erreur', { description: result.error })
            } else {
              toast.success('Prospect remis en "Nouveau"')
              router.refresh()
            }
            setLoading(false)
          }}
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
          Remettre
        </Button>
      </div>
    )
  }

  async function handleReject() {
    setLoading(true)
    const result = await updateProspectStatus(prospectId, 'rejected')
    if (!result.success) {
      toast.error('Erreur', { description: result.error })
      setLoading(false)
      return
    }
    toast.success('Prospect marqué comme refusé')
    router.push('/prospects')
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-colors"
      onClick={handleReject}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <XCircle className="w-3.5 h-3.5" />
      )}
      Refuser
    </Button>
  )
}
