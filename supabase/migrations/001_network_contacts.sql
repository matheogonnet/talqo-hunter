-- ============================================================
-- Table : network_contacts
-- Gestion du réseau LinkedIn — leviers pour Talqo
-- À exécuter dans : Supabase Dashboard > SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.network_contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Identité LinkedIn
  full_name TEXT NOT NULL,
  company TEXT,
  headline TEXT,
  linkedin_url TEXT,
  connected_at DATE,

  -- Classification Talqo
  lever_type TEXT NOT NULL DEFAULT 'other',
  -- Valeurs : 'founder' | 'recruiter' | 'hr' | 'prescriber' | 'ambassador' | 'partner' | 'other'

  relevance_score INTEGER DEFAULT 5 CHECK (relevance_score >= 1 AND relevance_score <= 10),

  -- Suivi contact
  is_contacted BOOLEAN DEFAULT FALSE,
  contacted_at DATE,

  -- Notes libres
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_nc_lever_type ON public.network_contacts(lever_type);
CREATE INDEX IF NOT EXISTS idx_nc_relevance ON public.network_contacts(relevance_score DESC);

-- ============================================================
-- Données initiales — réseau LinkedIn filtré (sans Deloitte)
-- ============================================================

INSERT INTO public.network_contacts (full_name, company, headline, lever_type, relevance_score, connected_at) VALUES

-- FOUNDERS / CEOs qui recrutent activement
('Vincent Coste', 'Najar', 'Co-founder & CEO at Najar | Hiring dozens of positions', 'founder', 10, '2026-05-13'),
('Pauline Glikman', 'Payflows', 'Building a love letter to CFOs at Payflows - We''re hiring 🚀', 'founder', 9, '2026-05-15'),
('Rodrigues VINCENT', 'Aspiration Pro', 'Fondateur Aspiration Pro | ✨ Je recrute des responsables IA', 'founder', 9, '2026-05-20'),
('Axel Demazy', 'Spendesk', 'Spendesk CEO - ex-BCG partner', 'founder', 8, '2026-05-17'),
('Nicolas Benady', 'Swan', 'Cofounder & President at Swan', 'founder', 8, '2026-05-18'),
('Paul-Emmanuel Bidault', 'Dastra', 'CEO @ Dastra | Construire la plateforme de gouvernance Privacy, IA et Data', 'founder', 8, '2026-05-16'),
('Martial ROBERGE', 'Lexia', 'Co-fondateur & Directeur Général @ Lexia | Voice AI & Conversation Intelligence', 'founder', 8, '2026-05-26'),
('Mathis ESCRIVA', 'Lexia', 'Co-fondateur & President @ Lexia | Voice AI & Conversation Intelligence', 'founder', 8, '2026-04-13'),
('Jordan Duwa', 'Pyl.Tech', 'Co-Founder @ Pyl.Tech | 🚀 Transformez et Innovez à travers Google Cloud', 'founder', 7, '2026-05-12'),
('Samy Ouardini', 'Ramify', 'Co-Founder @ Ramify', 'founder', 7, '2026-05-12'),
('Arthur Goudard', 'Formlyy & Setlyy', 'Co-Fondateur @ Formlyy & Setlyy | #1 Logiciels D''Inbound WhatsApp', 'founder', 7, '2021-10-20'),
('paul tuet', 'Missyl', 'CEO Missyl', 'founder', 7, '2023-11-10'),
('Théo Bonnet', 'Lightcone', 'Founder, CEO @ Lightcone', 'founder', 7, '2020-09-23'),
('Igor Sautier', 'Nevios', 'J''aide les PME à remplir leur agenda de rendez-vous qualifiés | Fondateur de Nevios', 'founder', 7, '2024-03-14'),
('Paul Sanchez', 'Layci', 'Cofondateur & Stratégiste Digital chez Layci', 'founder', 7, '2024-09-10'),
('Élie BIME', 'Finovox / Lumireur', 'Responsable produit chez Finovox | Fondateur de Lumireur', 'founder', 6, '2020-10-05'),
('Nacer BOUSSAHOUL', 'N-VIBE / SIVIEW', 'Co-Founder @ N-VIBE | Freelance R&D Electronics Engineer', 'founder', 6, '2024-09-20'),
('Thomas Fournier', 'Colber', 'Product Engineer & Manager | Founder @Colber | Ex-Big Four', 'founder', 6, '2025-10-27'),

-- RECRUTEURS PROFESSIONNELS
('Jérôme Misery', 'Blurec & Technology', 'Fondateur Blurec & Technology | Senior Recruiter (9 ans d''exp.) | Partenaire de croissance', 'recruiter', 9, '2026-02-25'),
('Raphaël Paya', 'TRIBU / Miixeo / Silvernest', '🚀 AI recruitment | SaaS | Web design | Founder @ TRIBU, Miixeo & Silvernest', 'recruiter', 9, '2026-03-20'),
('Elodie Roux', NULL, 'Chasseur de têtes | IT - Industrie - Défense', 'recruiter', 8, '2026-05-21'),
('Olivier Marx', 'JOB DO', 'Président JOB DO (recrutement). 8x entrepreneur, 4 exit, 2 millions de VU LinkedIn', 'recruiter', 8, '2024-06-14'),
('Mialy Diebold', NULL, 'Consultante Senior | Passionnée par l''innovation digitale | Recrutement & Stratégie | CRM/ERP', 'recruiter', 8, '2025-05-30'),
('Cindy Guerry', NULL, 'Connecter les talents tech ☁️ (Salesforce, ERP, AI, DevOps...) aux top opportunités 🚀', 'recruiter', 7, '2026-03-18'),
('Lalla Abla Alaoui', 'Attijariwafa Bank', 'Talent Acquisition Manager - Attijariwafa Bank', 'recruiter', 7, '2024-09-26'),
('David Lopez', NULL, 'Chargé de Recrutement', 'recruiter', 6, '2024-11-12'),
('Nadia Elmaanni', NULL, 'Chargée de recrutement', 'recruiter', 6, '2025-02-05'),

-- PRESCRIPTEURS (ESN / Consulting IT — connaissent les PME sans ATS)
('Jean-Philippe Clair', 'ASI', 'Directeur Offre, Marketing & Communication chez ASI | IA, Data, Digital', 'prescriber', 8, '2024-10-24'),
('Yannick GONNET', 'ASI Lyon', 'Directeur des Opérations | Digital • Data • IA | ASI Lyon', 'prescriber', 8, '2020-09-09'),
('Allyson Charvet-Laforêt', 'Extia', 'Business Manager chez Extia', 'prescriber', 7, '2024-10-26'),
('Thomas de La Ferrière', 'Rektangle', 'Deviens un consultant 100% libre @Rektangle', 'prescriber', 6, '2023-05-17'),
('Kevin Biren', NULL, 'Travaillons ton employabilité! 🧭', 'prescriber', 6, '2024-01-15'),

-- AMBASSADEURS (réseau startup, influence)
('Vincent Magnon', NULL, 'President & Group CEO | Corporate & Business Strategy | Leading Digital, Energy and Industrial transitions | M&A', 'ambassador', 7, '2024-06-14'),
('Elsa Moisand', 'Volta', 'Chief of Staff @Volta | voltasoftware.com', 'ambassador', 6, '2026-05-13'),
('Amélie Yuan', 'Ramify', 'VP Corporate Development @ Ramify', 'ambassador', 6, '2026-05-21')

ON CONFLICT DO NOTHING;
