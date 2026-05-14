import type { ProspectStatus } from '@/lib/types/database'

export const KANBAN_COLUMNS: { status: ProspectStatus; label: string }[] = [
  { status: 'new', label: 'Nouveau' },
  { status: 'connection_sent', label: 'Connexion envoyée' },
  { status: 'connected', label: 'Connecté' },
  { status: 'm1_sent', label: 'M1 envoyé' },
  { status: 'replied', label: 'Répondu' },
  { status: 'm2_sent', label: 'M2 envoyé' },
  { status: 'm3_sent', label: 'M3 envoyé' },
  { status: 'beta_signed', label: 'Beta signé 🎉' },
  { status: 'rejected', label: 'Refusé 🚫' },
]
