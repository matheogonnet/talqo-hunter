'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { LeverType } from '@/lib/types/database'

export async function createNetworkContact(data: {
  full_name: string
  company: string | null
  headline: string | null
  linkedin_url: string | null
  connected_at: string | null
  lever_type: LeverType
  relevance_score: number
  notes: string | null
}) {
  const supabase = await createClient()
  const { error } = await supabase.from('network_contacts').insert(data)
  if (error) return { success: false, error: error.message }
  revalidatePath('/reseau')
  return { success: true }
}

export async function updateNetworkContact(
  id: string,
  data: Partial<{
    lever_type: LeverType
    relevance_score: number
    notes: string | null
    is_contacted: boolean
    contacted_at: string | null
  }>
) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('network_contacts')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return { success: false, error: error.message }
  revalidatePath('/reseau')
  return { success: true }
}

export async function toggleContacted(id: string, current: boolean) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('network_contacts')
    .update({
      is_contacted: !current,
      contacted_at: !current ? new Date().toISOString().split('T')[0] : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) return { success: false, error: error.message }
  revalidatePath('/reseau')
  return { success: true }
}

export async function deleteNetworkContact(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('network_contacts').delete().eq('id', id)
  if (error) return { success: false, error: error.message }
  revalidatePath('/reseau')
  return { success: true }
}
