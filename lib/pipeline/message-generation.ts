/**
 * Génération des messages M1/M2/M3 via Claude Sonnet
 * Implémenté en Phase 2
 */

import type { Prospect, DecisionMaker } from '@/lib/types/database'

interface GeneratedMessages {
  m1: { body: string; hook: string }
  m2: { body: string; hook: string }
  m3: { body: string; hook: string }
}

/**
 * Génère les 3 messages LinkedIn pour un décideur
 * @todo Implémenter en Phase 2
 */
export async function generateMessagesForDecisionMaker(
  _prospect: Prospect,
  _decisionMaker: DecisionMaker
): Promise<GeneratedMessages> {
  // TODO Phase 2
  throw new Error('generateMessagesForDecisionMaker not implemented yet — see Phase 2')
}
