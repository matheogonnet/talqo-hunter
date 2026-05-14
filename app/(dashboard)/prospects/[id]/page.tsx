import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { ExternalLink, Globe, Link2, Users, TrendingUp, Target } from 'lucide-react'
import type { ProspectFull } from '@/lib/types/database'
import { scoreColor } from '@/lib/utils/score'
import { DecisionMakerCard } from '@/components/prospects/decision-maker-card'
import { NotesEditor } from '@/components/prospects/notes-editor'
import { AddDecisionMakerForm } from '@/components/prospects/add-decision-maker-form'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('prospects')
    .select('company_name')
    .eq('id', id)
    .single()
  const row = data as { company_name: string } | null
  return { title: row ? `${row.company_name} — Talqo Hunter` : 'Prospect' }
}

export default async function ProspectDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch prospect avec décideurs et leurs messages
  const { data, error } = await supabase
    .from('prospects')
    .select(`
      *,
      decision_makers (
        *,
        generated_messages (*)
      )
    `)
    .eq('id', id)
    .single()

  if (error || !data) notFound()

  const p = data as unknown as ProspectFull

  return (
    <div className="max-w-4xl mx-auto px-6 py-6 space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{p.company_name}</h1>
            {p.sector && (
              <p className="text-muted-foreground capitalize mt-1">
                {p.sector.replace('_', ' ')}
              </p>
            )}
          </div>
          {p.p1_score != null && (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${scoreColor(p.p1_score)}`}>
              Score P1 : {p.p1_score}/100
            </span>
          )}
        </div>

        {/* Liens */}
        <div className="flex flex-wrap gap-3">
          {p.website && (
            <a
              href={p.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Globe className="w-3.5 h-3.5" />
              Site web
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
          {p.linkedin_url && (
            <a
              href={p.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Link2 className="w-3.5 h-3.5" />
              LinkedIn
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        {/* Méta infos */}
        <div className="flex flex-wrap gap-4 text-sm">
          {p.employee_count_estimate && (
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Users className="w-3.5 h-3.5" />
              ~{p.employee_count_estimate} salariés
            </span>
          )}
          {p.open_positions_count != null && (
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <TrendingUp className="w-3.5 h-3.5" />
              {p.open_positions_count} poste{p.open_positions_count > 1 ? 's' : ''} ouvert{p.open_positions_count > 1 ? 's' : ''}
            </span>
          )}
          {p.target_plan && (
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Target className="w-3.5 h-3.5" />
              Plan {p.target_plan}
            </span>
          )}
          {p.detected_ats && (
            <Badge variant="outline" className="text-xs">
              ATS : {p.detected_ats}
            </Badge>
          )}
        </div>
      </div>

      {/* Pourquoi P1 */}
      {p.p1_reasons && p.p1_reasons.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Pourquoi P1
          </h2>
          <ul className="space-y-1.5">
            {p.p1_reasons.map((reason, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="text-emerald-600 mt-0.5">✓</span>
                {reason}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Description */}
      {p.description && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Description
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{p.description}</p>
        </section>
      )}

      {/* Décideurs */}
      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Décideurs ({p.decision_makers?.length ?? 0})
          </h2>
          <AddDecisionMakerForm prospectId={p.id} />
        </div>
        {p.decision_makers && p.decision_makers.length > 0 ? (
          <div className="space-y-4">
            {p.decision_makers
              .sort((a, b) => a.priority - b.priority)
              .map((dm) => (
                <DecisionMakerCard key={dm.id} decisionMaker={dm} />
              ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Aucun décideur identifié pour l&apos;instant.
          </p>
        )}
      </section>

      {/* Notes */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Notes (éditables)
        </h2>
        <NotesEditor prospectId={p.id} initialNotes={p.notes} />
      </section>

      {/* Footer */}
      <div className="text-xs text-muted-foreground pt-4 border-t border-border">
        Découvert {formatDistanceToNow(new Date(p.discovered_at), { locale: fr, addSuffix: true })}
        {p.discovery_source && ` via ${p.discovery_source}`}
      </div>
    </div>
  )
}
