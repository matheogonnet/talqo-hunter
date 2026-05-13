/**
 * Détection de l'ATS utilisé par une entreprise
 * à partir du HTML de sa page carrière / site principal
 */

// Patterns de détection par ATS
// L'ordre est important : les ATS exclus sont vérifiés en premier
const ATS_PATTERNS: Record<string, RegExp[]> = {
  // ATS modernes avec IA — on EXCLUT ces prospects
  greenhouse_excluded: [
    /greenhouse\.io/i,
    /boards\.greenhouse\.io/i,
    /gh\.jobvite\.com/i,
  ],
  lever_excluded: [
    /lever\.co/i,
    /jobs\.lever\.co/i,
  ],
  workable_excluded: [
    /workable\.com/i,
    /apply\.workable\.com/i,
  ],
  smartrecruiters_excluded: [
    /smartrecruiters\.com/i,
    /jobs\.smartrecruiters\.com/i,
  ],

  // ATS basiques — prospects gardés
  wttj_only: [
    /welcometothejungle\.com\/[a-z]{2}\/companies\//i,
    /jobs\.welcometothejungle\.com/i,
    /welcometothejungle\.com/i,
  ],
  welcomekit: [
    /welcomekit\.co/i,
    /\.welcomekit\.co/i,
    /api\.welcomekit\.co/i,
  ],
  teamtailor: [
    /teamtailor\.com/i,
    /\.teamtailor\.com/i,
    /career\.[a-z0-9-]+\.com.*teamtailor/i,
  ],
  bamboohr: [
    /bamboohr\.com/i,
    /\.bamboohr\.com/i,
  ],
}

export interface ATSDetectionResult {
  ats: string
  is_excluded: boolean
  confidence: 'high' | 'low'
}

/**
 * Détecte l'ATS utilisé à partir du HTML d'une page
 */
export function detectATS(html: string): ATSDetectionResult {
  for (const [name, patterns] of Object.entries(ATS_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(html)) {
        const is_excluded = name.endsWith('_excluded')
        return {
          ats: is_excluded ? name.replace('_excluded', '') : name,
          is_excluded,
          confidence: 'high',
        }
      }
    }
  }

  // Pas de pattern trouvé = page custom ou aucun ATS
  return {
    ats: 'custom_or_none',
    is_excluded: false,
    confidence: 'low',
  }
}

/**
 * Extrait les URLs de postes ouverts depuis le HTML
 * (heuristique basique, améliorable)
 */
export function extractJobUrls(html: string, baseUrl: string): string[] {
  const urls = new Set<string>()

  // Patterns communs pour les liens de postes
  const jobPatterns = [
    /href="([^"]*(?:job|poste|career|emploi|offre|recrutement|apply)[^"]*?)"/gi,
    /href="([^"]*\/jobs?\/[^"]+)"/gi,
    /href="([^"]*\/careers?\/[^"]+)"/gi,
    /href="([^"]*\/offres?\/[^"]+)"/gi,
  ]

  for (const pattern of jobPatterns) {
    let match: RegExpExecArray | null
    pattern.lastIndex = 0
    while ((match = pattern.exec(html)) !== null) {
      const url = match[1]
      if (url && !url.includes('#') && url.length < 200) {
        // Résoudre les URLs relatives
        try {
          const absolute = url.startsWith('http')
            ? url
            : new URL(url, baseUrl).href
          urls.add(absolute)
        } catch {
          // URL invalide — ignorer
        }
      }
    }
  }

  return Array.from(urls).slice(0, 50) // max 50 URLs
}
