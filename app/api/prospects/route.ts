import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createManualProspect, type CreateManualProspectInput } from '@/lib/actions/prospects'
import { applyProspectSearchFilters } from '@/lib/search'

/**
 * GET /api/prospects — Liste des prospects avec filtres optionnels
 * POST /api/prospects — Ajouter un prospect manuellement (+ contact obligatoire, même règles que l’UI)
 */

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(req.url)

    const q = searchParams.get('q') ?? undefined
    const status = searchParams.get('status') ?? undefined
    const sector = searchParams.get('sector') ?? undefined
    const limit = parseInt(searchParams.get('limit') ?? '50', 10)

    let query = supabase
      .from('prospects')
      .select('*')
      .order('p1_score', { ascending: false })
      .limit(Math.min(limit, 200))

    query = applyProspectSearchFilters(query, { q, status, sector })

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ data })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<CreateManualProspectInput>

    const result = await createManualProspect({
      company_name: body.company_name ?? '',
      website: body.website ?? null,
      linkedin_url: body.linkedin_url ?? null,
      sector: body.sector ?? null,
      description: body.description ?? null,
      open_positions_count: body.open_positions_count ?? null,
      employee_count_estimate: body.employee_count_estimate ?? null,
      contact_full_name: body.contact_full_name ?? '',
      contact_role: body.contact_role ?? '',
      contact_linkedin_url: body.contact_linkedin_url ?? null,
      contact_linkedin_headline: body.contact_linkedin_headline ?? null,
      contact_role_category: body.contact_role_category ?? undefined,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error ?? 'Validation ou insert échoué' }, { status: 400 })
    }

    return NextResponse.json({ data: { id: result.id } }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
