'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ConnectionStatus } from '@/lib/types/database'

/**
 * Met à jour le statut de connexion LinkedIn d'un décideur
 */
export async function updateConnectionStatus(
  decisionMakerId: string,
  status: ConnectionStatus
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const updates: Record<string, unknown> = { connection_status: status }

    if (status === 'sent') {
      updates.connection_sent_at = new Date().toISOString()
    } else if (status === 'accepted') {
      updates.connection_accepted_at = new Date().toISOString()
    }

    const { error } = await supabase
      .from('decision_makers')
      .update(updates)
      .eq('id', decisionMakerId)

    if (error) throw error

    revalidatePath('/prospects/[id]', 'page')

    return { success: true }
  } catch (err) {
    console.error('[updateConnectionStatus]', err)
    return { success: false, error: String(err) }
  }
}

/**
 * Marque un message comme envoyé et met à jour le timestamp
 */
export async function markMessageSent(
  messageId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('generated_messages')
      .update({
        was_sent: true,
        sent_at: new Date().toISOString(),
      })
      .eq('id', messageId)

    if (error) throw error

    revalidatePath('/prospects/[id]', 'page')

    return { success: true }
  } catch (err) {
    console.error('[markMessageSent]', err)
    return { success: false, error: String(err) }
  }
}

/**
 * Met à jour le corps d'un message généré (édition manuelle)
 */
export async function updateMessageBody(
  messageId: string,
  body: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('generated_messages')
      .update({ message_body: body })
      .eq('id', messageId)

    if (error) throw error

    return { success: true }
  } catch (err) {
    console.error('[updateMessageBody]', err)
    return { success: false, error: String(err) }
  }
}
