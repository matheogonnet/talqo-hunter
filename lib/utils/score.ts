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
    'bg-blue-500/20 text-blue-400',
    'bg-violet-500/20 text-violet-400',
    'bg-emerald-500/20 text-emerald-400',
    'bg-amber-500/20 text-amber-400',
    'bg-rose-500/20 text-rose-400',
    'bg-cyan-500/20 text-cyan-400',
    'bg-orange-500/20 text-orange-400',
    'bg-pink-500/20 text-pink-400',
  ]
  const idx = name
    .split('')
    .reduce((acc, c) => acc + c.charCodeAt(0), 0) % colors.length
  return colors[idx]
}
