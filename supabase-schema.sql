-- ============================================================
-- Talqo Hunter — Schéma Supabase
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Table principale des entreprises découvertes
CREATE TABLE prospects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Identité
  company_name TEXT NOT NULL UNIQUE,
  website TEXT,
  linkedin_url TEXT,
  wttj_url TEXT,

  -- Critères de qualification
  employee_count_estimate INT,
  employee_count_range TEXT,            -- '10-50', '50-150'
  open_positions_count INT,
  open_positions_urls TEXT[],
  detected_ats TEXT,                    -- 'none', 'wttj_only', 'welcomekit', 'teamtailor', 'custom'
  ats_has_ai BOOLEAN DEFAULT FALSE,

  -- Contexte business
  sector TEXT,                          -- 'fintech', 'saas_b2b', 'ai', etc.
  description TEXT,
  funding_total_eur BIGINT,
  funding_last_round_date DATE,

  -- Scoring
  p1_score INT,                         -- 0-100, calculé par Claude
  p1_reasons TEXT[],
  target_plan TEXT,                     -- 'Smart' | 'Premium'

  -- Pipeline status
  status TEXT DEFAULT 'new' CHECK (status IN (
    'new', 'connection_sent', 'connected',
    'm1_sent', 'replied', 'm2_sent',
    'm3_sent', 'beta_signed', 'rejected', 'archived'
  )),
  status_updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Tracking
  discovered_at TIMESTAMPTZ DEFAULT NOW(),
  discovery_source TEXT,                -- 'web_search', 'wttj', 'linkedin', 'manual'
  notes TEXT
);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prospects_updated_at
  BEFORE UPDATE ON prospects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Table des décideurs identifiés
CREATE TABLE decision_makers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id UUID REFERENCES prospects(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  full_name TEXT NOT NULL,
  role TEXT NOT NULL,
  role_category TEXT,                   -- 'ceo', 'cto', 'cos', 'head_of_people', 'founder', 'other'
  linkedin_url TEXT UNIQUE,
  linkedin_headline TEXT,
  profile_picture_url TEXT,
  priority INT DEFAULT 1,              -- 1 = primary, 2 = secondary

  -- Status par contact
  connection_status TEXT DEFAULT 'not_sent' CHECK (connection_status IN (
    'not_sent', 'sent', 'accepted', 'declined', 'no_response'
  )),
  connection_sent_at TIMESTAMPTZ,
  connection_accepted_at TIMESTAMPTZ,

  m1_status TEXT DEFAULT 'not_sent' CHECK (m1_status IN ('not_sent', 'sent', 'replied')),
  m1_sent_at TIMESTAMPTZ,
  m1_replied_at TIMESTAMPTZ,

  m2_status TEXT DEFAULT 'not_sent' CHECK (m2_status IN ('not_sent', 'sent', 'replied')),
  m2_sent_at TIMESTAMPTZ,

  m3_status TEXT DEFAULT 'not_sent' CHECK (m3_status IN ('not_sent', 'sent', 'replied')),
  m3_sent_at TIMESTAMPTZ,

  notes TEXT
);

-- Messages générés (pour réutilisation et audit)
CREATE TABLE generated_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_maker_id UUID REFERENCES decision_makers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  message_type TEXT CHECK (message_type IN ('m1', 'm2', 'm3')),
  hook_used TEXT,                       -- description du hook utilisé
  message_body TEXT NOT NULL,

  is_validated BOOLEAN DEFAULT FALSE,   -- validation manuelle avant envoi
  was_sent BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMPTZ
);

CREATE TRIGGER generated_messages_updated_at
  BEFORE UPDATE ON generated_messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Logs des runs du cron
CREATE TABLE cron_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  status TEXT CHECK (status IN ('running', 'success', 'failed')),
  prospects_discovered INT DEFAULT 0,
  prospects_qualified INT DEFAULT 0,
  sectors_processed TEXT[],
  errors JSONB DEFAULT '[]'::JSONB
);

-- Configuration de l'app (secteurs activés, email notif, etc.)
CREATE TABLE config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Valeurs par défaut de la config
INSERT INTO config (key, value) VALUES
  ('active_sectors', '["fintech", "saas_b2b", "ai", "revops", "martech", "hrtech", "proptech", "legaltech"]'::JSONB),
  ('notification_email', '"notifications@example.com"'::JSONB),
  ('min_p1_score', '70'::JSONB),
  ('cron_enabled', 'true'::JSONB);

-- Indexes pour les requêtes fréquentes
CREATE INDEX idx_prospects_status ON prospects(status);
CREATE INDEX idx_prospects_score ON prospects(p1_score DESC);
CREATE INDEX idx_prospects_sector ON prospects(sector);
CREATE INDEX idx_prospects_created ON prospects(created_at DESC);
CREATE INDEX idx_decision_makers_prospect ON decision_makers(prospect_id);
CREATE INDEX idx_decision_makers_connection_status ON decision_makers(connection_status);
CREATE INDEX idx_generated_messages_dm ON generated_messages(decision_maker_id);
CREATE INDEX idx_generated_messages_type ON generated_messages(message_type);

-- ============================================================
-- Row Level Security (RLS)
-- À activer après avoir configuré ton user Supabase Auth
-- ============================================================

-- ALTER TABLE prospects ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE decision_makers ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE generated_messages ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE cron_runs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE config ENABLE ROW LEVEL SECURITY;

-- Policy exemple (à adapter avec ton user_id) :
-- CREATE POLICY "owner_only" ON prospects
--   FOR ALL USING (auth.uid() = 'YOUR_USER_ID'::uuid);
