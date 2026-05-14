'use server'

import { createMutationClient } from '@/lib/supabase/mutation-client'
import { revalidatePath } from 'next/cache'
import type { ConnectionStatus, MessageType, RoleCategory } from '@/lib/types/database'

function revalidateProspectViews(prospectId?: string) {
  revalidatePath('/')
  revalidatePath('/prospects')
  if (prospectId) {
    revalidatePath(`/prospects/${prospectId}`)
  }
}

/**
 * Met à jour le statut de connexion LinkedIn d'un décideur
 */
export async function updateConnectionStatus(
  decisionMakerId: string,
  status: ConnectionStatus,
  prospectId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createMutationClient()

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

    revalidateProspectViews(prospectId)

    return { success: true }
  } catch (err) {
    console.error('[updateConnectionStatus]', err)
    return { success: false, error: String(err) }
  }
}

/**
 * Ajoute un contact (décideur) à une entreprise prospect.
 */
export async function createDecisionMaker(
  prospectId: string,
  input: {
    full_name: string
    role: string
    linkedin_url?: string | null
    linkedin_headline?: string | null
    role_category?: RoleCategory | null
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const fullName = input.full_name.trim()
    const role = input.role.trim()
    if (!fullName || !role) {
      return { success: false, error: 'Nom et rôle sont requis.' }
    }

    const supabase = await createMutationClient()

    const { data: lastRow } = await supabase
      .from('decision_makers')
      .select('priority')
      .eq('prospect_id', prospectId)
      .order('priority', { ascending: false })
      .limit(1)
      .maybeSingle()

    const nextPriority = ((lastRow as { priority: number } | null)?.priority ?? 0) + 1

    const { error } = await supabase.from('decision_makers').insert({
      prospect_id: prospectId,
      full_name: fullName,
      role,
      linkedin_url: input.linkedin_url?.trim() || null,
      linkedin_headline: input.linkedin_headline?.trim() || null,
      role_category: input.role_category ?? 'other',
      priority: nextPriority,
    })

    if (error) throw error

    revalidateProspectViews(prospectId)

    return { success: true }
  } catch (err) {
    console.error('[createDecisionMaker]', err)
    return { success: false, error: String(err) }
  }
}

/**
 * Crée un brouillon de message M1/M2/M3 pour un décideur (édition manuelle).
 */
export async function createDraftMessage(
  prospectId: string,
  decisionMakerId: string,
  messageType: MessageType
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createMutationClient()

    const { data: existing } = await supabase
      .from('generated_messages')
      .select('id')
      .eq('decision_maker_id', decisionMakerId)
      .eq('message_type', messageType)
      .maybeSingle()

    if (existing) {
      return { success: false, error: 'Un message de ce type existe déjà pour ce contact.' }
    }

    const { error } = await supabase.from('generated_messages').insert({
      decision_maker_id: decisionMakerId,
      message_type: messageType,
      message_body:
        'Bonjour,\n\n(À personnaliser — écris ton message ici puis enregistre en cliquant en dehors du champ.)',
      hook_used: null,
    })

    if (error) throw error

    revalidateProspectViews(prospectId)

    return { success: true }
  } catch (err) {
    console.error('[createDraftMessage]', err)
    return { success: false, error: String(err) }
  }
}

/**
 * Marque un message comme envoyé et met à jour le timestamp
 */
export async function markMessageSent(
  messageId: string,
  prospectId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createMutationClient()

    const { error } = await supabase
      .from('generated_messages')
      .update({
        was_sent: true,
        sent_at: new Date().toISOString(),
      })
      .eq('id', messageId)

    if (error) throw error

    revalidateProspectViews(prospectId)

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
  body: string,
  prospectId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createMutationClient()

    const { error } = await supabase
      .from('generated_messages')
      .update({ message_body: body })
      .eq('id', messageId)

    if (error) throw error

    revalidateProspectViews(prospectId)

    return { success: true }
  } catch (err) {
    console.error('[updateMessageBody]', err)
    return { success: false, error: String(err) }
  }
}
