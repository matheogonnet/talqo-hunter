/**
 * Types TypeScript pour Talqo Hunter
 *
 * Note : Pour une intégration Supabase strictement typée, utilise :
 * `npx supabase gen types typescript --project-id <id> > lib/types/supabase.ts`
 * après avoir configuré ton projet Supabase.
 *
 * En attendant, on utilise des types manuels + casts explicites dans les queries.
 */

export type ProspectStatus =
  | 'new'
  | 'connection_sent'
  | 'connected'
  | 'm1_sent'
  | 'replied'
  | 'm2_sent'
  | 'm3_sent'
  | 'beta_signed'
  | 'rejected'
  | 'archived'

export type ConnectionStatus =
  | 'not_sent'
  | 'sent'
  | 'accepted'
  | 'declined'
  | 'no_response'

export type MessageStatus = 'not_sent' | 'sent' | 'replied'

export type MessageType = 'm1' | 'm2' | 'm3'

export type RoleCategory =
  | 'ceo'
  | 'cto'
  | 'cos'
  | 'head_of_people'
  | 'founder'
  | 'other'

export type DetectedATS =
  | 'wttj_only'
  | 'welcomekit'
  | 'teamtailor'
  | 'custom_or_none'
  | 'greenhouse'
  | 'lever'
  | 'workable'
  | 'other'

export type TargetPlan = 'Smart' | 'Premium'

export type CronRunStatus = 'running' | 'success' | 'failed'

// ---- Tables ----

export interface Prospect {
  id: string
  created_at: string
  updated_at: string

  company_name: string
  website: string | null
  linkedin_url: string | null
  wttj_url: string | null

  employee_count_estimate: number | null
  employee_count_range: string | null
  open_positions_count: number | null
  open_positions_urls: string[] | null
  detected_ats: DetectedATS | null
  ats_has_ai: boolean

  sector: string | null
  description: string | null
  funding_total_eur: number | null
  funding_last_round_date: string | null

  p1_score: number | null
  p1_reasons: string[] | null
  target_plan: TargetPlan | null

  status: ProspectStatus
  status_updated_at: string

  discovered_at: string
  discovery_source: string | null
  notes: string | null
}

export interface DecisionMaker {
  id: string
  prospect_id: string
  created_at: string

  full_name: string
  role: string
  role_category: RoleCategory | null
  linkedin_url: string | null
  linkedin_headline: string | null
  profile_picture_url: string | null
  priority: number

  connection_status: ConnectionStatus
  connection_sent_at: string | null
  connection_accepted_at: string | null

  m1_status: MessageStatus
  m1_sent_at: string | null
  m1_replied_at: string | null

  m2_status: MessageStatus
  m2_sent_at: string | null

  m3_status: MessageStatus
  m3_sent_at: string | null

  notes: string | null
}

export interface GeneratedMessage {
  id: string
  decision_maker_id: string
  created_at: string
  updated_at: string

  message_type: MessageType
  hook_used: string | null
  message_body: string

  is_validated: boolean
  was_sent: boolean
  sent_at: string | null
}

export interface CronRun {
  id: string
  started_at: string
  finished_at: string | null
  status: CronRunStatus | null
  prospects_discovered: number
  prospects_qualified: number
  sectors_processed: string[] | null
  errors: unknown
}

export interface Config {
  id: string
  key: string
  value: unknown
  updated_at: string
}

// ---- Types composés pour les vues ----

export interface ProspectWithDecisionMakers extends Prospect {
  decision_makers: DecisionMaker[]
}

export interface DecisionMakerWithMessages extends DecisionMaker {
  generated_messages: GeneratedMessage[]
}

export interface ProspectFull extends Prospect {
  decision_makers: DecisionMakerWithMessages[]
}

// ---- Type Supabase Database (format Supabase v2) ----
// Permet le typage générique createServerClient<Database>

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      prospects: {
        Row: Prospect
        Insert: Partial<Omit<Prospect, 'id' | 'created_at' | 'updated_at'>> & { company_name: string }
        Update: Partial<Omit<Prospect, 'id' | 'created_at'>>
      }
      decision_makers: {
        Row: DecisionMaker
        Insert: Partial<Omit<DecisionMaker, 'id' | 'created_at'>> & { full_name: string; role: string; prospect_id: string }
        Update: Partial<Omit<DecisionMaker, 'id' | 'created_at'>>
      }
      generated_messages: {
        Row: GeneratedMessage
        Insert: Partial<Omit<GeneratedMessage, 'id' | 'created_at' | 'updated_at'>> & { message_body: string; decision_maker_id: string }
        Update: Partial<Omit<GeneratedMessage, 'id' | 'created_at'>>
      }
      cron_runs: {
        Row: CronRun
        Insert: Partial<Omit<CronRun, 'id'>>
        Update: Partial<Omit<CronRun, 'id'>>
      }
      config: {
        Row: Config
        Insert: Omit<Config, 'id' | 'updated_at'>
        Update: Partial<Omit<Config, 'id'>>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
