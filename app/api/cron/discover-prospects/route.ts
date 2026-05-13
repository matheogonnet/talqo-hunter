import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

/**
 * POST /api/cron/discover-prospects
 *
 * Endpoint principal du pipeline de découverte.
 * Protégé par Authorization: Bearer <CRON_SECRET>
 * Appelé par Vercel Cron toutes les 6h (voir vercel.json)
 *
 * Pipeline :
 * 1. Discovery (Claude Sonnet + web_search)
 * 2. Déduplication
 * 3. Qualification (Claude Haiku + fetch HTML)
 * 4. Enrichissement décideurs (Proxycurl)
 * 5. Génération messages (Claude Sonnet)
 * 6. Notification email (Resend)
 */
export async function POST(req: NextRequest) {
  // ---- Auth ----
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()

  // ---- Créer un log de run ----
  const { data: cronRun, error: cronRunError } = await supabase
    .from('cron_runs')
    .insert({
      status: 'running',
      prospects_discovered: 0,
      prospects_qualified: 0,
      sectors_processed: [],
    })
    .select()
    .single()

  if (cronRunError || !cronRun) {
    console.error('[Cron] Impossible de créer le log de run:', cronRunError)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  const runId = cronRun.id
  console.log(`[Cron] Run démarré — ID: ${runId}`)

  try {
    // ---- Récupérer la config ----
    const { data: configRows } = await supabase
      .from('config')
      .select('key, value')
      .in('key', ['active_sectors', 'min_p1_score'])

    const config = Object.fromEntries(
      (configRows ?? []).map((r) => [r.key, r.value])
    )
    const activeSectors = (config.active_sectors as string[]) ?? ['saas_b2b', 'fintech', 'ai']
    const minScore = (config.min_p1_score as number) ?? 70

    // Rotation des secteurs : on prend 2 secteurs par run (rotation basée sur l'heure)
    const hour = new Date().getHours()
    const sectorIndex = Math.floor(hour / 6) % activeSectors.length
    const sectorsThisRun = activeSectors.slice(
      sectorIndex,
      sectorIndex + 2
    )

    console.log(`[Cron] Secteurs pour ce run: ${sectorsThisRun.join(', ')}`)

    // ---- Import dynamique du pipeline (disponible en Phase 2) ----
    let discovered = 0
    let qualified = 0
    const errors: unknown[] = []

    try {
      const { runDiscoveryPipeline } = await import('@/lib/pipeline/runner')
      const result = await runDiscoveryPipeline({
        sectors: sectorsThisRun,
        minP1Score: minScore,
        runId,
      })
      discovered = result.discovered
      qualified = result.qualified
    } catch (pipelineError) {
      // Le pipeline n'est pas encore implémenté en Phase 1 — c'est attendu
      if (
        pipelineError instanceof Error &&
        pipelineError.message.includes('Cannot find module')
      ) {
        console.log('[Cron] Pipeline non encore implémenté (Phase 2)')
        errors.push('Pipeline not implemented yet')
      } else {
        throw pipelineError
      }
    }

    // ---- Finaliser le log ----
    await supabase
      .from('cron_runs')
      .update({
        status: 'success',
        finished_at: new Date().toISOString(),
        prospects_discovered: discovered,
        prospects_qualified: qualified,
        sectors_processed: sectorsThisRun,
        errors: errors.length > 0 ? errors : null,
      })
      .eq('id', runId)

    console.log(`[Cron] Run terminé — ${discovered} découverts, ${qualified} qualifiés`)

    return NextResponse.json({
      success: true,
      runId,
      sectors: sectorsThisRun,
      discovered,
      qualified,
    })
  } catch (err) {
    console.error('[Cron] Erreur fatale:', err)

    await supabase
      .from('cron_runs')
      .update({
        status: 'failed',
        finished_at: new Date().toISOString(),
        errors: [String(err)],
      })
      .eq('id', runId)

    return NextResponse.json(
      { error: 'Pipeline error', details: String(err) },
      { status: 500 }
    )
  }
}

// Vercel Cron appelle en GET sur certains plans — on supporte les deux
export async function GET(req: NextRequest) {
  return POST(req)
}
