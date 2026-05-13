'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ProspectStatus } from '@/lib/types/database'

/**
 * Met à jour le status d'un prospect (appelé au drop Kanban)
 */
export async function updateProspectStatus(
  prospectId: string,
  newStatus: ProspectStatus
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('prospects')
      .update({
        status: newStatus,
        status_updated_at: new Date().toISOString(),
      })
      .eq('id', prospectId)

    if (error) throw error

    revalidatePath('/')
    revalidatePath('/prospects')

    return { success: true }
  } catch (err) {
    console.error('[updateProspectStatus]', err)
    return { success: false, error: String(err) }
  }
}

/**
 * Met à jour les notes d'un prospect
 */
export async function updateProspectNotes(
  prospectId: string,
  notes: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('prospects')
      .update({ notes })
      .eq('id', prospectId)

    if (error) throw error

    revalidatePath(`/prospects/${prospectId}`)

    return { success: true }
  } catch (err) {
    console.error('[updateProspectNotes]', err)
    return { success: false, error: String(err) }
  }
}
