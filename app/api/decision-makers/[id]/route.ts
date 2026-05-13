import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface Params {
  params: Promise<{ id: string }>
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const body = await req.json() as Record<string, unknown>

    const { data, error } = await supabase
      .from('decision_makers')
      .update(body)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ data })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
