'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ExternalLink, Copy, Check, Send, Loader2, FileEdit } from 'lucide-react'
import { toast } from 'sonner'
import type { DecisionMakerWithMessages, ConnectionStatus, MessageType } from '@/lib/types/database'
import { avatarColor } from '@/lib/utils/score'
import { updateConnectionStatus, markMessageSent, updateMessageBody, createDraftMessage } from '@/lib/actions/decision-makers'

interface DecisionMakerCardProps {
  decisionMaker: DecisionMakerWithMessages
}

const CONNECTION_STATUS_LABELS: Record<ConnectionStatus, string> = {
  not_sent: 'Pas envoyé',
  sent: 'Envoyé',
  accepted: 'Accepté',
  declined: 'Décliné',
  no_response: 'Pas de réponse',
}

const CONNECTION_STATUS_COLORS: Record<ConnectionStatus, string> = {
  not_sent: 'bg-slate-100 text-slate-600',
  sent: 'bg-blue-100 text-blue-700',
  accepted: 'bg-emerald-100 text-emerald-700',
  declined: 'bg-red-100 text-red-700',
  no_response: 'bg-amber-100 text-amber-700',
}

const CONNECTION_STATUS_NEXT: Record<ConnectionStatus, ConnectionStatus> = {
  not_sent: 'sent',
  sent: 'accepted',
  accepted: 'accepted',
  declined: 'declined',
  no_response: 'no_response',
}

export function DecisionMakerCard({ decisionMaker: dm }: DecisionMakerCardProps) {
  const router = useRouter()
  const [connectionStatus, setConnectionStatus] = useState(dm.connection_status)
  const [copied, setCopied] = useState<string | null>(null)

  // Trouver les messages par type
  const getMsg = (type: 'm1' | 'm2' | 'm3') =>
    dm.generated_messages?.find((m) => m.message_type === type)

  async function handleConnectionToggle() {
    const nextStatus = CONNECTION_STATUS_NEXT[connectionStatus]
    if (nextStatus === connectionStatus) return

    setConnectionStatus(nextStatus)
    const result = await updateConnectionStatus(dm.id, nextStatus, dm.prospect_id)
    if (!result.success) {
      setConnectionStatus(connectionStatus)
      toast.error('Erreur lors de la mise à jour')
    }
  }

  async function handleCopy(text: string, type: string) {
    await navigator.clipboard.writeText(text)
    setCopied(type)
    toast.success('Message copié !')
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header décideur */}
      <div className="p-4 flex items-start justify-between gap-4 border-b border-border">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          {dm.profile_picture_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={dm.profile_picture_url}
              alt={dm.full_name}
              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${avatarColor(dm.full_name)}`}>
              {dm.full_name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-medium text-sm">{dm.full_name}</p>
            <p className="text-xs text-muted-foreground">{dm.role}</p>
            {dm.linkedin_headline && (
              <p className="text-xs text-muted-foreground/60 mt-0.5 line-clamp-1">
                {dm.linkedin_headline}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Bouton LinkedIn */}
          {dm.linkedin_url && (
            <a
              href={dm.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="sm" className="gap-1.5 text-xs h-7">
                <ExternalLink className="w-3 h-3" />
                LinkedIn
              </Button>
            </a>
          )}

          {/* Toggle connexion */}
          <button
            onClick={handleConnectionToggle}
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer hover:opacity-80 ${CONNECTION_STATUS_COLORS[connectionStatus]}`}
          >
            {CONNECTION_STATUS_LABELS[connectionStatus]}
          </button>
        </div>
      </div>

      {/* Messages M1/M2/M3 */}
      <div className="p-4">
        <Tabs defaultValue="m1">
          <TabsList className="bg-muted h-8">
            {(['m1', 'm2', 'm3'] as const).map((type) => {
              const msg = getMsg(type)
              return (
                <TabsTrigger key={type} value={type} className="text-xs uppercase px-3 h-6">
                  {type}
                  {msg?.was_sent && (
                    <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                  )}
                </TabsTrigger>
              )
            })}
          </TabsList>

          {(['m1', 'm2', 'm3'] as const).map((type) => {
            const msg = getMsg(type)
            return (
              <TabsContent key={type} value={type} className="mt-3 space-y-3">
                {msg ? (
                  <MessageEditor
                    message={msg}
                    prospectId={dm.prospect_id}
                    onCopy={() => handleCopy(msg.message_body, type)}
                    copied={copied === type}
                  />
                ) : (
                  <EmptyMessageSlot
                    prospectId={dm.prospect_id}
                    decisionMakerId={dm.id}
                    type={type}
                    onCreated={() => router.refresh()}
                  />
                )}
              </TabsContent>
            )
          })}
        </Tabs>
      </div>
    </div>
  )
}

function MessageEditor({
  message,
  prospectId,
  onCopy,
  copied,
}: {
  message: { id: string; message_body: string; was_sent: boolean; hook_used: string | null }
  prospectId: string
  onCopy: () => void
  copied: boolean
}) {
  const [body, setBody] = useState(message.message_body)
  const [saving, setSaving] = useState(false)
  const [marking, setMarking] = useState(false)

  async function handleBlur() {
    if (body === message.message_body) return
    setSaving(true)
    await updateMessageBody(message.id, body, prospectId)
    setSaving(false)
  }

  async function handleMarkSent() {
    setMarking(true)
    const result = await markMessageSent(message.id, prospectId)
    if (!result.success) {
      toast.error('Erreur lors de la mise à jour')
    } else {
      toast.success('Marqué comme envoyé')
    }
    setMarking(false)
  }

  return (
    <div className="space-y-2">
      {message.hook_used && (
        <p className="text-xs text-muted-foreground">
          <span className="text-muted-foreground/50">Hook : </span>
          {message.hook_used}
        </p>
      )}

      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onBlur={handleBlur}
        className="min-h-[140px] text-sm bg-muted border-border resize-none font-mono"
      />

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground/50">
          {saving ? 'Sauvegarde...' : body.length + ' caractères'}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs h-7"
            onClick={onCopy}
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copié !' : 'Copier'}
          </Button>
          {!message.was_sent && (
            <Button
              size="sm"
              className="gap-1.5 text-xs h-7"
              onClick={handleMarkSent}
              disabled={marking}
            >
              <Send className="w-3 h-3" />
              Marquer envoyé
            </Button>
          )}
          {message.was_sent && (
            <Badge className="text-xs bg-emerald-100 text-emerald-700 border-emerald-200">
              ✓ Envoyé
            </Badge>
          )}
        </div>
      </div>
    </div>
  )
}

function EmptyMessageSlot({
  prospectId,
  decisionMakerId,
  type,
  onCreated,
}: {
  prospectId: string
  decisionMakerId: string
  type: MessageType
  onCreated: () => void
}) {
  const [loading, setLoading] = useState(false)

  async function handleCreate() {
    setLoading(true)
    const result = await createDraftMessage(prospectId, decisionMakerId, type)
    setLoading(false)
    if (!result.success) {
      toast.error('Impossible de créer le message', { description: result.error })
      return
    }
    toast.success(`Message ${type.toUpperCase()} créé — tu peux l’éditer ci-dessous.`)
    onCreated()
  }

  return (
    <div className="rounded-lg border border-dashed border-border bg-muted/30 py-6 px-4 text-center space-y-3">
      <p className="text-sm text-muted-foreground">
        Aucun texte pour <strong className="text-foreground">{type.toUpperCase()}</strong>. Tu peux le rédiger à la main.
      </p>
      <Button type="button" size="sm" variant="secondary" className="gap-1.5" onClick={handleCreate} disabled={loading}>
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileEdit className="w-3.5 h-3.5" />}
        Créer un message vierge
      </Button>
    </div>
  )
}
