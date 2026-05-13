import { createClient } from '@/lib/supabase/server'
import { SettingsForm } from '@/components/settings-form'
import type { CronRun } from '@/lib/types/database'

export const metadata = { title: 'Paramètres — Talqo Hunter' }

// Secteurs disponibles pour le crawler
export const ALL_SECTORS = [
  { value: 'fintech', label: 'FinTech' },
  { value: 'saas_b2b', label: 'SaaS B2B' },
  { value: 'ai', label: 'Intelligence Artificielle' },
  { value: 'revops', label: 'RevOps' },
  { value: 'martech', label: 'MarTech' },
  { value: 'hrtech', label: 'HRTech' },
  { value: 'proptech', label: 'PropTech' },
  { value: 'legaltech', label: 'LegalTech' },
  { value: 'healthtech', label: 'HealthTech' },
  { value: 'edtech', label: 'EdTech' },
  { value: 'cybersecurity', label: 'Cybersécurité' },
  { value: 'devtools', label: 'DevTools' },
]

export default async function SettingsPage() {
  const supabase = await createClient()

  // Fetch la config actuelle
  const { data: configRows } = await supabase
    .from('config')
    .select('key, value')

  const config = Object.fromEntries(
    ((configRows ?? []) as { key: string; value: unknown }[]).map((row) => [row.key, row.value])
  )

  const activeSectors = (config.active_sectors as string[]) ?? []
  const notificationEmail = (config.notification_email as string) ?? ''

  // Derniers runs cron
  const { data: recentRuns } = await supabase
    .from('cron_runs')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(5)

  return (
    <div className="max-w-2xl mx-auto px-6 py-6 space-y-8">
      <div>
        <h1 className="text-lg font-semibold">Paramètres</h1>
        <p className="text-sm text-muted-foreground">
          Configure le crawler et les notifications
        </p>
      </div>

      <SettingsForm
        activeSectors={activeSectors}
        notificationEmail={notificationEmail}
        allSectors={ALL_SECTORS}
        recentRuns={(recentRuns ?? []) as CronRun[]}
      />
    </div>
  )
}
