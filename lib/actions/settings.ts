'use server'

import { createMutationClient } from '@/lib/supabase/mutation-client'
import { revalidatePath } from 'next/cache'

interface SaveSettingsInput {
  activeSectors: string[]
  notificationEmail: string
}

/**
 * Sauvegarde la configuration dans la table config
 */
export async function saveSettings(
  input: SaveSettingsInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createMutationClient()

    // Upsert les deux clés de config
    const { error } = await supabase.from('config').upsert([
      { key: 'active_sectors', value: input.activeSectors },
      { key: 'notification_email', value: input.notificationEmail },
    ], { onConflict: 'key' })

    if (error) throw error

    revalidatePath('/settings')

    return { success: true }
  } catch (err) {
    console.error('[saveSettings]', err)
    return { success: false, error: String(err) }
  }
}
