import type { LeverType } from '@/lib/types/database'

export const LEVER_TYPES: {
  value: LeverType
  label: string
  emoji: string
  color: string
  bg: string
}[] = [
  {
    value: 'founder',
    label: 'Fondateur',
    emoji: '🚀',
    color: 'text-blue-700',
    bg: 'bg-blue-50 border-blue-200',
  },
  {
    value: 'recruiter',
    label: 'Recruteur',
    emoji: '🎯',
    color: 'text-purple-700',
    bg: 'bg-purple-50 border-purple-200',
  },
  {
    value: 'hr',
    label: 'RH / People',
    emoji: '👥',
    color: 'text-pink-700',
    bg: 'bg-pink-50 border-pink-200',
  },
  {
    value: 'prescriber',
    label: 'Prescripteur',
    emoji: '📣',
    color: 'text-amber-700',
    bg: 'bg-amber-50 border-amber-200',
  },
  {
    value: 'ambassador',
    label: 'Ambassadeur',
    emoji: '⭐',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50 border-emerald-200',
  },
  {
    value: 'partner',
    label: 'Partenaire',
    emoji: '🤝',
    color: 'text-cyan-700',
    bg: 'bg-cyan-50 border-cyan-200',
  },
  {
    value: 'other',
    label: 'Autre',
    emoji: '•',
    color: 'text-muted-foreground',
    bg: 'bg-muted/50 border-border',
  },
]

export function getLeverType(value: LeverType) {
  return LEVER_TYPES.find((t) => t.value === value) ?? LEVER_TYPES[LEVER_TYPES.length - 1]
}
