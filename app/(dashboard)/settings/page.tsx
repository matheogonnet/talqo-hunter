import { createClient } from '@/lib/supabase/server'
import { SettingsForm } from '@/components/settings-form'
import { ALL_SECTORS } from '@/lib/sectors'
import type { CronRun } from '@/lib/types/database'

export const metadata = { title: 'Paramètres — Talqo Hunter' }

export default async function SettingsPage() {
  const supabase = await createClient()

  const { data: configRows } = await supabase
    .from('config')
    .select('key, value')

  const config = Object.fromEntries(
    ((configRows ?? []) as { key: string; value: unknown }[]).map((row) => [row.key, row.value])
  )

  const activeSectors = (config.active_sectors as string[]) ?? []
  const notificationEmail = (config.notification_email as string) ?? ''

  const { data: recentRuns } = await supabase
    .from('cron_runs')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(5)

  return (
    <div className="flex-1 min-h-0 overflow-y-auto max-w-2xl mx-auto px-6 py-6 space-y-8">
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
