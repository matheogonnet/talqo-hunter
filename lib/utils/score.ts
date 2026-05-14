/**
 * Retourne la classe CSS de couleur pour un score P1
 */
export function scoreColor(score: number): string {
  if (score >= 80) return 'score-high'
  if (score >= 60) return 'score-medium'
  return 'score-low'
}

/**
 * Génère un avatar de couleur à partir d'un nom d'entreprise
 */
export function companyInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

/**
 * Génère une couleur de fond déterministe pour un avatar
 */
export function avatarColor(name: string): string {
  const colors = [
    'bg-blue-100 text-blue-700',
    'bg-violet-100 text-violet-700',
    'bg-emerald-100 text-emerald-700',
    'bg-amber-100 text-amber-700',
    'bg-rose-100 text-rose-700',
    'bg-cyan-100 text-cyan-700',
    'bg-orange-100 text-orange-700',
    'bg-pink-100 text-pink-700',
  ]
  const idx = name
    .split('')
    .reduce((acc, c) => acc + c.charCodeAt(0), 0) % colors.length
  return colors[idx]
}
