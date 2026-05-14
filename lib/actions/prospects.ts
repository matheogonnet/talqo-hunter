'use server'

import { createMutationClient } from '@/lib/supabase/mutation-client'
import { revalidatePath } from 'next/cache'
import type { ProspectStatus, RoleCategory } from '@/lib/types/database'

export type CreateManualProspectInput = {
  company_name: string
  /** Au moins un des deux (site ou page LinkedIn entreprise) est requis côté validation */
  website?: string | null
  linkedin_url?: string | null
  sector?: string | null
  description?: string | null
  open_positions_count?: number | null
  employee_count_estimate?: number | null
  /** Contact principal obligatoire */
  contact_full_name: string
  contact_role: string
  contact_linkedin_url?: string | null
  contact_linkedin_headline?: string | null
  contact_role_category?: RoleCategory | null
}

/**
 * Crée une entreprise prospect manuellement + un contact obligatoire (hors cron).
 */
export async function createManualProspect(
  input: CreateManualProspectInput
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const name = input.company_name.trim()
    const sector = input.sector?.trim() ?? ''
    const contactName = input.contact_full_name.trim()
    const contactRole = input.contact_role.trim()
    const web = input.website?.trim() || null
    const liCompany = input.linkedin_url?.trim() || null

    if (!name) {
      return { success: false, error: 'Le nom de l’entreprise est requis.' }
    }
    if (!sector) {
      return { success: false, error: 'Le secteur est requis.' }
    }
    if (!web && !liCompany) {
      return {
        success: false,
        error: 'Indique au moins un site web ou une URL LinkedIn entreprise.',
      }
    }
    if (!contactName || !contactRole) {
      return {
        success: false,
        error: 'Le contact principal (nom + rôle) est obligatoire.',
      }
    }

    const supabase = await createMutationClient()

    const { data: prospect, error: pErr } = await supabase
      .from('prospects')
      .insert({
        company_name: name,
        website: web,
        linkedin_url: liCompany,
        sector,
        description: input.description?.trim() || null,
        open_positions_count:
          typeof input.open_positions_count === 'number' && !Number.isNaN(input.open_positions_count)
            ? Math.max(0, Math.round(input.open_positions_count))
            : null,
        employee_count_estimate:
          typeof input.employee_count_estimate === 'number' && !Number.isNaN(input.employee_count_estimate)
            ? Math.max(0, Math.round(input.employee_count_estimate))
            : null,
        discovery_source: 'manual',
        status: 'new',
      })
      .select('id')
      .single()

    if (pErr) {
      const code = (pErr as { code?: string }).code
      const msg =
        code === '23505' || pErr.message.toLowerCase().includes('duplicate')
          ? 'Une entreprise avec ce nom existe déjà.'
          : pErr.message
      throw new Error(msg)
    }

    const prospectId = prospect?.id as string | undefined
    if (!prospectId) {
      throw new Error('Prospect créé sans id.')
    }

    const { error: dmErr } = await supabase.from('decision_makers').insert({
      prospect_id: prospectId,
      full_name: contactName,
      role: contactRole,
      linkedin_url: input.contact_linkedin_url?.trim() || null,
      linkedin_headline: input.contact_linkedin_headline?.trim() || null,
      role_category: input.contact_role_category ?? 'other',
      priority: 1,
    })

    if (dmErr) {
      await supabase.from('prospects').delete().eq('id', prospectId)
      throw new Error(dmErr.message)
    }

    revalidatePath('/')
    revalidatePath('/prospects')
    revalidatePath(`/prospects/${prospectId}`)

    return { success: true, id: prospectId }
  } catch (err) {
    console.error('[createManualProspect]', err)
    return { success: false, error: String(err) }
  }
}

/**
 * Met à jour le status d'un prospect (appelé au drop Kanban)
 */
export async function updateProspectStatus(
  prospectId: string,
  newStatus: ProspectStatus
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createMutationClient()

    const { data, error } = await supabase
      .from('prospects')
      .update({
        status: newStatus,
        status_updated_at: new Date().toISOString(),
      })
      .eq('id', prospectId)
      .select('id')

    if (error) throw error
    if (!data?.length) {
      console.error('[updateProspectStatus] 0 ligne mise à jour pour id=', prospectId)
      return {
        success: false,
        error: 'Aucune ligne mise à jour (id inconnu ou politique RLS).',
      }
    }

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
    const supabase = await createMutationClient()

    const { data, error } = await supabase
      .from('prospects')
      .update({ notes })
      .eq('id', prospectId)
      .select('id')

    if (error) throw error
    if (!data?.length) {
      return { success: false, error: 'Aucune ligne mise à jour.' }
    }

    revalidatePath(`/prospects/${prospectId}`)

    return { success: true }
  } catch (err) {
    console.error('[updateProspectNotes]', err)
    return { success: false, error: String(err) }
  }
}
