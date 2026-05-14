'use client'

import { useState } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { updateProspectNotes } from '@/lib/actions/prospects'
import { toast } from 'sonner'
import { Loader2, Save } from 'lucide-react'

export function NotesEditor({
  prospectId,
  initialNotes,
}: {
  prospectId: string
  initialNotes: string | null
}) {
  const [notes, setNotes] = useState(initialNotes ?? '')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    const result = await updateProspectNotes(prospectId, notes)
    setSaving(false)
    if (!result.success) {
      toast.error('Impossible d’enregistrer les notes', { description: result.error })
      return
    }
    toast.success('Notes enregistrées')
  }

  return (
    <div className="space-y-2">
      <Textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Contexte, prochaine action, rappels…"
        className="min-h-[120px] text-sm bg-muted/50 border-border resize-y"
      />
      <Button type="button" size="sm" variant="secondary" onClick={handleSave} disabled={saving} className="gap-1.5">
        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
        Enregistrer les notes
      </Button>
    </div>
  )
}
