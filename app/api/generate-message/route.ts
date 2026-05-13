import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/generate-message
 * Régénère les messages M1/M2/M3 pour un décideur donné
 * Body: { decisionMakerId: string }
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await req.json() as { decisionMakerId?: string }

    if (!body.decisionMakerId) {
      return NextResponse.json({ error: 'decisionMakerId requis' }, { status: 400 })
    }

    // Fetch le décideur + son prospect
    const { data: dm, error: dmError } = await supabase
      .from('decision_makers')
      .select(`
        *,
        prospects (*)
      `)
      .eq('id', body.decisionMakerId)
      .single()

    if (dmError || !dm) {
      return NextResponse.json({ error: 'Décideur introuvable' }, { status: 404 })
    }

    // Import dynamique du générateur (disponible en Phase 2)
    const { generateMessagesForDecisionMaker } = await import('@/lib/pipeline/message-generation')
    const prospect = (dm as { prospects: Record<string, unknown> }).prospects

    const messages = await generateMessagesForDecisionMaker(
      prospect as unknown as Parameters<typeof generateMessagesForDecisionMaker>[0],
      dm as unknown as Parameters<typeof generateMessagesForDecisionMaker>[1]
    )

    // Upsert les messages en DB
    for (const [type, content] of Object.entries(messages) as [string, { body: string; hook: string }][]) {
      if (!['m1', 'm2', 'm3'].includes(type)) continue
      await supabase
        .from('generated_messages')
        .upsert({
          decision_maker_id: body.decisionMakerId,
          message_type: type as 'm1' | 'm2' | 'm3',
          message_body: content.body,
          hook_used: content.hook,
        }, {
          onConflict: 'decision_maker_id,message_type',
          ignoreDuplicates: false,
        })
    }

    return NextResponse.json({ success: true, messages })
  } catch (err) {
    console.error('[generate-message]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
