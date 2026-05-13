'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Loader2, Play, RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react'
import { saveSettings } from '@/lib/actions/settings'
import type { CronRun } from '@/lib/types/database'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

interface SettingsFormProps {
  activeSectors: string[]
  notificationEmail: string
  allSectors: { value: string; label: string }[]
  recentRuns: CronRun[]
}

export function SettingsForm({
  activeSectors: initialSectors,
  notificationEmail: initialEmail,
  allSectors,
  recentRuns,
}: SettingsFormProps) {
  const [sectors, setSectors] = useState<string[]>(initialSectors)
  const [email, setEmail] = useState(initialEmail)
  const [isPending, startTransition] = useTransition()
  const [isRunning, setIsRunning] = useState(false)

  function toggleSector(value: string) {
    setSectors((prev) =>
      prev.includes(value)
        ? prev.filter((s) => s !== value)
        : [...prev, value]
    )
  }

  function handleSave() {
    startTransition(async () => {
      const result = await saveSettings({ activeSectors: sectors, notificationEmail: email })
      if (result.success) {
        toast.success('Paramètres sauvegardés')
      } else {
        toast.error('Erreur lors de la sauvegarde')
      }
    })
  }

  async function handleManualRun() {
    setIsRunning(true)
    try {
      const res = await fetch('/api/cron/discover-prospects', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET ?? ''}`,
        },
      })
      if (res.ok) {
        toast.success('Run manuel lancé !', {
          description: 'Les résultats apparaîtront dans quelques minutes',
        })
      } else {
        const data = await res.json() as { error?: string }
        toast.error('Erreur', { description: data.error ?? 'Erreur inconnue' })
      }
    } catch {
      toast.error('Erreur réseau')
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Secteurs */}
      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold">Secteurs ciblés</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Le crawler alternera entre ces secteurs à chaque run
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {allSectors.map((sector) => (
            <label
              key={sector.value}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors text-sm ${
                sectors.includes(sector.value)
                  ? 'border-primary/50 bg-primary/10 text-foreground'
                  : 'border-border bg-card text-muted-foreground hover:border-border/80'
              }`}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={sectors.includes(sector.value)}
                onChange={() => toggleSector(sector.value)}
              />
              <span className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                sectors.includes(sector.value)
                  ? 'bg-primary border-primary text-primary-foreground'
                  : 'border-border'
              }`}>
                {sectors.includes(sector.value) && (
                  <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 10 10">
                    <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </span>
              {sector.label}
            </label>
          ))}
        </div>
      </section>

      {/* Email */}
      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold">Email de notification</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Reçois un récap à chaque run réussi
          </p>
        </div>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="matheo@example.com"
          className="bg-card border-border max-w-sm"
        />
      </section>

      {/* Sauvegarder */}
      <Button onClick={handleSave} disabled={isPending} className="gap-2">
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        Sauvegarder
      </Button>

      {/* Run manuel */}
      <section className="space-y-3 pt-4 border-t border-border">
        <div>
          <h2 className="text-sm font-semibold">Run manuel</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Lance immédiatement le pipeline de découverte sans attendre le cron
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleManualRun}
          disabled={isRunning}
          className="gap-2"
        >
          {isRunning ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          {isRunning ? 'Run en cours...' : 'Lancer un run manuel'}
        </Button>
      </section>

      {/* Historique des runs */}
      {recentRuns.length > 0 && (
        <section className="space-y-3 pt-4 border-t border-border">
          <h2 className="text-sm font-semibold">Derniers runs</h2>
          <div className="space-y-2">
            {recentRuns.map((run) => (
              <div
                key={run.id}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-border bg-card text-sm"
              >
                <div className="flex items-center gap-2.5">
                  {run.status === 'success' && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                  {run.status === 'failed' && <XCircle className="w-4 h-4 text-red-400" />}
                  {run.status === 'running' && <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />}
                  <span className="text-muted-foreground text-xs">
                    {formatDistanceToNow(new Date(run.started_at), { locale: fr, addSuffix: true })}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{run.prospects_discovered} découverts</span>
                  <span>·</span>
                  <span>{run.prospects_qualified} qualifiés</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
