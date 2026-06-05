import type { NetworkContact } from '@/lib/types/database'
import type { ProspectWithDecisionMakers } from '@/lib/types/database'

export function sanitizeSearchQuery(q: string): string {
  return q.trim().replace(/[%_\\]/g, '\\$&')
}

export function matchesNetworkContact(contact: NetworkContact, q: string): boolean {
  const lower = q.toLowerCase()
  return [contact.full_name, contact.company, contact.headline, contact.notes].some(
    (field) => field?.toLowerCase().includes(lower)
  )
}

export function matchesProspect(prospect: ProspectWithDecisionMakers, q: string): boolean {
  const lower = q.toLowerCase()
  const fields = [
    prospect.company_name,
    prospect.sector,
    prospect.website,
    prospect.detected_ats,
    prospect.target_plan,
    prospect.description,
  ]
  if (fields.some((field) => field?.toLowerCase().includes(lower))) return true
  return prospect.decision_makers?.some(
    (dm) =>
      dm.full_name?.toLowerCase().includes(lower) ||
      dm.role?.toLowerCase().includes(lower)
  ) ?? false
}

export interface ProspectSearchParams {
  q?: string
  status?: string
  sector?: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function applyProspectSearchFilters(query: any, filters: ProspectSearchParams) {
  let q = query
  if (filters.status && filters.status !== 'all') {
    q = q.eq('status', filters.status)
  }
  if (filters.sector && filters.sector !== 'all') {
    q = q.eq('sector', filters.sector)
  }
  if (filters.q?.trim()) {
    const pattern = `%${sanitizeSearchQuery(filters.q.trim())}%`
    q = q.or(
      `company_name.ilike.${pattern},sector.ilike.${pattern},website.ilike.${pattern},detected_ats.ilike.${pattern},target_plan.ilike.${pattern},description.ilike.${pattern}`
    )
  }
  return q
}
