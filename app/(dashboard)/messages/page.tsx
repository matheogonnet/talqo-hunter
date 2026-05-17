import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'


export const metadata = { title: 'Messages — Talqo Hunter' }

export default async function MessagesPage() {
  const supabase = await createClient()

  const { data: messagesRaw } = await supabase
    .from('generated_messages')
    .select(`
      id,
      message_type,
      message_body,
      hook_used,
      was_sent,
      created_at,
      decision_maker_id,
      decision_makers (
        full_name,
        role,
        prospect_id,
        prospects ( company_name )
      )
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  // Cast explicite pour le type join Supabase
  type MessageWithDM = {
    id: string
    message_type: string
    message_body: string
    hook_used: string | null
    was_sent: boolean
    created_at: string
    decision_maker_id: string
    decision_makers: {
      full_name: string
      role: string
      prospect_id: string
      prospects: { company_name: string }
    } | null
  }
  const messages = (messagesRaw ?? []) as unknown as MessageWithDM[]

  return (
    <div className="flex-1 min-h-0 overflow-y-auto px-6 py-6 space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Messages générés</h1>
        <p className="text-sm text-muted-foreground">
          {messages?.length ?? 0} messages
        </p>
      </div>

      <div className="space-y-2">
        {messages.map((msg) => {
          const dm = msg.decision_makers

          return (
            <div
              key={msg.id}
              className="rounded-lg border border-border bg-white p-4 space-y-2"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/prospects/${dm?.prospect_id}`}
                      className="font-medium hover:text-primary transition-colors text-sm"
                    >
                      {dm?.prospects?.company_name ?? '—'}
                    </Link>
                    <span className="text-muted-foreground text-sm">·</span>
                    <span className="text-sm text-muted-foreground">{dm?.full_name}</span>
                  </div>
                  {msg.hook_used && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Hook : {msg.hook_used}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge
                    variant="outline"
                    className="text-xs uppercase font-mono"
                  >
                    {msg.message_type}
                  </Badge>
                  {msg.was_sent && (
                    <Badge className="text-xs bg-emerald-100 text-emerald-700 border-emerald-200">
                      Envoyé
                    </Badge>
                  )}
                </div>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 whitespace-pre-line">
                {msg.message_body}
              </p>
              <p className="text-xs text-muted-foreground/50">
                {formatDistanceToNow(new Date(msg.created_at), { locale: fr, addSuffix: true })}
              </p>
            </div>
          )
        })}

        {(!messages || messages.length === 0) && (
          <div className="py-12 text-center text-muted-foreground">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>Aucun message généré pour l&apos;instant</p>
          </div>
        )}
      </div>
    </div>
  )
}
