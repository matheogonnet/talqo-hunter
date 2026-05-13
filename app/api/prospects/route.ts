import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/prospects — Liste des prospects avec filtres optionnels
 * POST /api/prospects — Ajouter un prospect manuellement
 */

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(req.url)

    const status = searchParams.get('status')
    const sector = searchParams.get('sector')
    const limit = parseInt(searchParams.get('limit') ?? '50', 10)

    let query = supabase
      .from('prospects')
      .select('*')
      .order('p1_score', { ascending: false })
      .limit(Math.min(limit, 200))

    if (status) query = query.eq('status', status)
    if (sector) query = query.eq('sector', sector)

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ data })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await req.json() as { company_name?: string; website?: string; sector?: string }

    if (!body.company_name) {
      return NextResponse.json({ error: 'company_name requis' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('prospects')
      .insert({
        company_name: body.company_name,
        website: body.website ?? null,
        sector: body.sector ?? null,
        discovery_source: 'manual',
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ data }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
