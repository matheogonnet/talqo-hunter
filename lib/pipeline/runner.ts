/**
 * Orchestrateur principal du pipeline Talqo Hunter
 * Implémenté en Phase 2
 */

interface PipelineOptions {
  sectors: string[]
  minP1Score: number
  runId: string
}

interface PipelineResult {
  discovered: number
  qualified: number
}

/**
 * Lance le pipeline complet :
 * 1. Discovery (Claude Sonnet + web_search)
 * 2. Déduplication
 * 3. Qualification (Claude Haiku + HTML parsing)
 * 4. Enrichissement décideurs (LinkedIn / saisie)
 * 5. Génération messages (Claude Sonnet)
 * 6. Notification email (Resend)
 *
 * @todo Implémenter en Phase 2
 */
export async function runDiscoveryPipeline(
  options: PipelineOptions
): Promise<PipelineResult> {
  console.log('[Pipeline] Démarrage avec options:', options)
  // TODO Phase 2
  throw new Error('Pipeline not implemented yet — see Phase 2')
}
