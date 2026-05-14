# Talqo Prospect Hunter — Specs techniques

## Vue d'ensemble

App web autonome qui découvre toutes les 6h des startups françaises P1 (10-150 salariés, recrutement actif, sans ATS sérieux), enrichit avec les décideurs LinkedIn, génère des messages personnalisés M1/M2/M3, et te permet de suivre le pipeline de prospection.

## Stack technique

| Couche | Tech | Pourquoi |
|--------|------|----------|
| Frontend | Next.js 15 (App Router) + Tailwind + shadcn/ui | Tu connais déjà avec Talqo |
| Backend | Next.js API Routes + Server Actions | Monolithique, simple à déployer |
| DB | Supabase (Postgres + Auth + RLS) | Stack existante chez toi |
| Cron | Vercel Cron Jobs | Gratuit jusqu'à 2 jobs en plan Hobby |
| LLM | Claude API (Sonnet 4.6 + Haiku 4.5) | Discovery sur Sonnet, génération sur Haiku |
| LinkedIn / décideurs | Non retenu de fournisseur tiers | Enrichissement manuel ou source à définir plus tard |
| Email | Resend | 3000 mails/mois gratuits |
| Hosting | Vercel | Auto-deploy depuis GitHub |
| Domaine | outils.matheo.fr (à configurer) | Sous-domaine de ton domaine perso |

**Coût mensuel estimé** : 15-30€
- Claude API : 10-20€ (selon volume)
- Vercel : 0€ (Hobby plan suffit)
- Supabase : 0€ (Free tier 500MB)
- Resend : 0€

## Schéma Supabase

```sql
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
  employee_count_range TEXT, -- '10-50', '50-150'
  open_positions_count INT,
  open_positions_urls TEXT[],
  detected_ats TEXT, -- 'none', 'wttj_only', 'welcomekit', 'teamtailor', 'custom'
  ats_has_ai BOOLEAN DEFAULT FALSE,
  
  -- Contexte business
  sector TEXT, -- 'fintech', 'saas_b2b', 'ai', etc.
  description TEXT,
  funding_total_eur BIGINT,
  funding_last_round_date DATE,
  
  -- Scoring
  p1_score INT, -- 0-100, calculé par Claude
  p1_reasons TEXT[],
  target_plan TEXT, -- 'Smart' | 'Premium'
  
  -- Pipeline status
  status TEXT DEFAULT 'new' CHECK (status IN (
    'new', 'connection_sent', 'connected', 
    'm1_sent', 'replied', 'm2_sent', 
    'm3_sent', 'beta_signed', 'rejected', 'archived'
  )),
  status_updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Tracking
  discovered_at TIMESTAMPTZ DEFAULT NOW(),
  discovery_source TEXT, -- 'web_search', 'wttj', 'linkedin', 'manual'
  notes TEXT
);

-- Table des décideurs identifiés
CREATE TABLE decision_makers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id UUID REFERENCES prospects(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  full_name TEXT NOT NULL,
  role TEXT NOT NULL,
  role_category TEXT, -- 'ceo', 'cto', 'cos', 'head_of_people', 'founder', 'other'
  linkedin_url TEXT UNIQUE,
  linkedin_headline TEXT,
  priority INT DEFAULT 1, -- 1 = primary, 2 = secondary
  
  -- Status par contact
  connection_status TEXT DEFAULT 'not_sent' CHECK (connection_status IN (
    'not_sent', 'sent', 'accepted', 'declined', 'no_response'
  )),
  connection_sent_at TIMESTAMPTZ,
  connection_accepted_at TIMESTAMPTZ,
  
  m1_status TEXT DEFAULT 'not_sent',
  m1_sent_at TIMESTAMPTZ,
  m1_replied_at TIMESTAMPTZ,
  
  m2_status TEXT DEFAULT 'not_sent',
  m2_sent_at TIMESTAMPTZ,
  
  m3_status TEXT DEFAULT 'not_sent',
  m3_sent_at TIMESTAMPTZ,
  
  notes TEXT
);

-- Messages générés (pour réutilisation et audit)
CREATE TABLE generated_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_maker_id UUID REFERENCES decision_makers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  message_type TEXT CHECK (message_type IN ('m1', 'm2', 'm3')),
  hook_used TEXT, -- description du hook
  message_body TEXT NOT NULL,
  
  is_validated BOOLEAN DEFAULT FALSE, -- tu valides avant envoi
  was_sent BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMPTZ
);

-- Logs des runs du cron
CREATE TABLE cron_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  status TEXT, -- 'running', 'success', 'failed'
  prospects_discovered INT DEFAULT 0,
  prospects_qualified INT DEFAULT 0,
  errors JSONB
);

-- Indexes
CREATE INDEX idx_prospects_status ON prospects(status);
CREATE INDEX idx_prospects_score ON prospects(p1_score DESC);
CREATE INDEX idx_decision_makers_prospect ON decision_makers(prospect_id);
CREATE INDEX idx_decision_makers_status ON decision_makers(connection_status);
```

## Architecture du pipeline (toutes les 6h)

```
┌─────────────────────────────────────────────────────────────┐
│ Vercel Cron Job (every 6h)                                  │
│ POST /api/cron/discover-prospects                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ ÉTAPE 1 — Discovery (Claude Sonnet 4.6 + web_search)        │
│ Pour chaque secteur (rotation) :                            │
│  - FinTech, SaaS B2B, IA, RevOps, MarTech, HRTech, etc.     │
│ Claude cherche des startups françaises 10-150 salariés      │
│ en recrutement actif, avec critères P1.                     │
│ Retour : JSON liste {name, website, sector, hint}           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ ÉTAPE 2 — Déduplication                                     │
│ Filtre les entreprises déjà en base                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ ÉTAPE 3 — Qualification (Claude Haiku 4.5)                  │
│ Pour chaque nouveau prospect :                              │
│  - Fetch page carrière (legal, 1 fetch/site)                │
│  - Détecte l'ATS (regex sur le HTML)                        │
│  - Compte les postes ouverts                                │
│  - Score P1 0-100                                           │
│  - Détermine plan cible (Smart/Premium)                     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ ÉTAPE 4 — Enrichissement décideurs                          │
│ Pour chaque prospect P1 (score >= 70) :                     │
│  - Identification CEO, co-founders, CoS, Head of People     │
│  - (manuel ou intégration future, sans API LinkedIn tiers)  │
│  - Sauvegarde dans decision_makers                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ ÉTAPE 5 — Génération messages (Claude Sonnet 4.6)           │
│ Pour chaque décideur prioritaire :                          │
│  - Hook personnalisé basé sur rôle + contexte boîte         │
│  - M1 (demande de conseil), M2 (pitch), M3 (relance)        │
│  - Sauvegarde dans generated_messages                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ ÉTAPE 6 — Notification email (Resend)                       │
│ Récap des N nouveaux P1 trouvés avec lien vers dashboard    │
└─────────────────────────────────────────────────────────────┘
```

## Structure du projet Next.js

```
talqo-hunter/
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── page.tsx                    # Dashboard principal (Kanban)
│   │   ├── prospects/
│   │   │   ├── page.tsx                # Liste complète + filtres
│   │   │   └── [id]/page.tsx           # Détail entreprise + décideurs
│   │   ├── messages/page.tsx           # Templates et messages générés
│   │   └── settings/page.tsx           # Config (secteurs ciblés, fréquence)
│   ├── api/
│   │   ├── cron/
│   │   │   └── discover-prospects/route.ts  # Endpoint cron principal
│   │   ├── prospects/
│   │   │   ├── route.ts                # GET liste, POST manuel
│   │   │   └── [id]/route.ts           # GET/PATCH/DELETE
│   │   ├── decision-makers/
│   │   │   └── [id]/route.ts           # Update status (connection_sent, m1_sent, etc.)
│   │   └── generate-message/route.ts   # Régénérer un message
│   └── layout.tsx
├── lib/
│   ├── claude.ts                       # Wrapper Claude API
│   ├── supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   ├── pipeline/
│   │   ├── discovery.ts                # Étape 1
│   │   ├── qualification.ts            # Étape 3
│   │   ├── enrichment.ts               # Étape 4
│   │   ├── message-generation.ts       # Étape 5
│   │   └── notification.ts             # Étape 6
│   └── ats-detector.ts                 # Détection ATS par regex HTML
├── components/
│   ├── kanban/
│   │   ├── board.tsx                   # Drag & drop
│   │   ├── column.tsx
│   │   └── card.tsx
│   ├── prospects/
│   │   ├── prospect-detail.tsx
│   │   ├── decision-maker-card.tsx
│   │   └── message-preview.tsx
│   └── ui/                             # shadcn/ui
├── vercel.json                         # Config cron
└── .env.local
```

## Variables d'environnement

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Claude
ANTHROPIC_API_KEY=

# Resend
RESEND_API_KEY=
NOTIFICATION_EMAIL=ton@email.com

# Cron secret (pour sécuriser l'endpoint)
CRON_SECRET=

# Talqo brand (pour messages)
TALQO_FOUNDER_NAME=Mathéo
TALQO_FOUNDER_ROLE=Consultant @Deloitte
```

## Configuration Vercel Cron

```json
{
  "crons": [
    {
      "path": "/api/cron/discover-prospects",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

## Prompt système Claude — Étape 1 Discovery

```
Tu es un expert en sourcing de prospects B2B pour Talqo, un SaaS ATS avec IA destiné aux PME et startups françaises de 10 à 150 salariés.

Mission : trouver des startups françaises actuellement en recrutement actif qui correspondent au profil P1 strict :
- Effectifs : 10 à 150 salariés
- Recrutement actif visible publiquement (au moins 3 postes ouverts)
- Pas d'ATS sérieux avec IA (WTTJ seul, WelcomeKit basique, page carrière custom, ou Teamtailor sans scoring IA = OK ; Greenhouse, Lever, Workable = écarter)
- Secteur cible : {{SECTOR}}
- Maturité digitale élevée (signaux : levée de fonds récente, communication tech-forward, fondateurs tech-savvy)

Utilise web_search pour identifier 10 à 20 startups françaises qui matchent. Pour chaque, retourne au format JSON strict :

[{
  "company_name": "string",
  "website": "string (URL principale)",
  "linkedin_url": "string ou null",
  "wttj_url": "string ou null si trouvé",
  "sector": "{{SECTOR}}",
  "employee_count_estimate": int,
  "funding_total_eur": int ou null,
  "funding_last_round_date": "YYYY-MM-DD ou null",
  "discovery_hint": "string courte expliquant pourquoi cette boîte matche P1"
}]

Réponds UNIQUEMENT avec le JSON, sans préambule ni markdown.
```

## Prompt système Claude — Étape 3 Qualification

```
Tu es un expert ATS qui analyse la page carrière d'une entreprise pour déterminer son niveau de maturité recrutement.

Données fournies :
- Nom : {{company_name}}
- HTML de la page carrière (extrait)
- HTML du site principal (extrait)

Tâches :
1. Détecter l'ATS utilisé. Indicateurs :
   - "welcometothejungle.com" dans les URLs → wttj_only si pas d'autre
   - "welcomekit.co" ou "/welcomekit/" → welcomekit
   - "teamtailor.com" → teamtailor
   - "greenhouse.io", "lever.co", "workable.com" → exclure (NOT P1)
   - Aucun match + formulaire custom → custom

2. Compter les postes ouverts visibles

3. Évaluer si l'ATS a de l'IA (scoring, matching auto)

4. Calculer p1_score (0-100) :
   - +30 si pas d'ATS détecté ou WTTJ seul
   - +20 si 5+ postes ouverts
   - +20 si secteur tech/SaaS/IA/FinTech
   - +15 si levée récente (<18 mois)
   - +15 si fondateurs avec profil tech-savvy détectable
   - -50 si ATS = greenhouse/lever/workable

5. Recommander target_plan :
   - "Smart" si <10 postes ouverts
   - "Premium" si 10+ postes ou volume tech élevé

Réponds en JSON strict :
{
  "detected_ats": "wttj_only|welcomekit|teamtailor|custom|other",
  "ats_has_ai": boolean,
  "open_positions_count": int,
  "open_positions_urls": ["url1", "url2"],
  "p1_score": int,
  "p1_reasons": ["raison1", "raison2"],
  "target_plan": "Smart|Premium",
  "should_keep": boolean (true si p1_score >= 70)
}
```

## Prompt système Claude — Étape 5 Génération Messages

```
Tu génères 3 messages LinkedIn pour Mathéo, qui développe Talqo (ATS IA pour startups) en parallèle de son boulot de Consultant chez Deloitte.

Contexte du prospect :
- Entreprise : {{company_name}}
- Secteur : {{sector}}
- Effectifs : {{employee_count}}
- Postes ouverts : {{open_positions}}
- Levée récente : {{funding_info}}
- Description : {{description}}

Contact :
- Nom : {{full_name}}
- Rôle : {{role}}
- Catégorie : {{role_category}}

Style requis :
- Ton professionnel mais chaleureux, pas commercial
- Vouvoiement
- Pas de superlatifs creux ("incroyable", "fantastique")
- Phrases courtes
- Pas d'emoji sauf le ":)" final
- Le hook doit être ANCRÉ sur un fait concret et récent de l'entreprise (pas générique)

Structure obligatoire des messages :

M1 (premier contact, demande de conseil) :
"Bonjour {{prénom}},

Je suis de près ce que vous construisez chez {{company_name}}, notamment [HOOK SPÉCIFIQUE TIRÉ DU CONTEXTE]. Et c'est cool !

J'aurais aimé vous demander un petit avis, car en parallèle de mon boulot chez Deloitte, j'ai monté une équipe avec qui on développe un SaaS IA dans le recrutement. J'aurai voulu savoir : [QUESTION SPÉCIFIQUE AU CONTEXTE, qui mène naturellement à parler de l'IA dans le recrutement].

Merci d'avance pour le retour :)"

M2 (pitch après réponse) :
"Merci beaucoup pour le retour, vraiment utile.

Du coup je vous présente le projet : Talqo, un ATS avec scoring IA qu'on déploie chez nos premiers clients beta. Chaque candidature scorée automatiquement face à la fiche de poste, pipeline centralisé, retours candidats automatisés.

{{company_name}} coche toutes les cases — [RAISONS SPÉCIFIQUES POURQUOI EUX].

On sélectionne une dizaine de structures pour la phase beta — accès gratuit, retour terrain attendu. Ça vous tenterait de tester ?"

M3 (relance J+5 si pas de réponse à M2) :
"Bonjour {{prénom}},

Relance rapide — on finalise notre sélection de beta testeurs et {{company_name}} est dans notre short list. Accès gratuit, [15 min OU aucun engagement]. Un mot suffit :)"

Réponds en JSON :
{
  "m1": "texte complet",
  "m1_hook_used": "description courte du hook",
  "m2": "texte complet",
  "m3": "texte complet"
}
```

## Détection ATS — Regex et patterns

```typescript
// lib/ats-detector.ts
const ATS_PATTERNS = {
  wttj_only: [
    /welcometothejungle\.com\/[a-z]{2}\/companies\//i,
    /jobs\.welcometothejungle\.com/i,
  ],
  welcomekit: [
    /welcomekit\.co/i,
    /\.welcomekit\.co/i,
  ],
  teamtailor: [
    /teamtailor\.com/i,
    /career\.[a-z]+\.com.*teamtailor/i,
  ],
  greenhouse_excluded: [
    /greenhouse\.io/i,
    /boards\.greenhouse\.io/i,
  ],
  lever_excluded: [
    /lever\.co/i,
    /jobs\.lever\.co/i,
  ],
  workable_excluded: [
    /workable\.com/i,
    /apply\.workable\.com/i,
  ],
};

export function detectATS(html: string): {
  ats: string;
  is_excluded: boolean;
} {
  for (const [name, patterns] of Object.entries(ATS_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(html)) {
        return {
          ats: name.replace('_excluded', ''),
          is_excluded: name.endsWith('_excluded'),
        };
      }
    }
  }
  return { ats: 'custom_or_none', is_excluded: false };
}
```

## Dashboard — Vues principales

### Vue 1 : Kanban Pipeline
Colonnes : `Nouveau` → `Connexion envoyée` → `Connecté` → `M1 envoyé` → `Répondu` → `M2 envoyé` → `M3 envoyé` → `Beta signé`

Cartes (par entreprise) avec :
- Nom + secteur + score P1 (badge couleur)
- Nombre de postes ouverts
- Avatars des décideurs identifiés (max 3)
- Drag & drop entre colonnes (update status automatique)
- Click → ouvre le détail

### Vue 2 : Détail Prospect
- Header : nom, site, LinkedIn, secteur, plan cible
- Section "Pourquoi P1" : raisons listées
- Section "Postes ouverts" : liste avec liens
- Section "Décideurs" : cards avec :
  - Photo + nom + rôle
  - Bouton "Ouvrir LinkedIn" (lien direct)
  - Statut connexion (toggle : Pas envoyé / Envoyé / Accepté)
  - Onglets M1 / M2 / M3 avec :
    - Texte du message généré (éditable)
    - Bouton "Copier"
    - Bouton "Marquer comme envoyé" (timestamp auto)
- Notes libres en bas

### Vue 3 : Settings
- Secteurs activés pour le crawler (checkboxes)
- Fréquence du cron (info read-only : 6h)
- Email de notification
- Test : "Lancer un run manuel maintenant"

## Plan d'implémentation par étapes (pour Claude Code)

### Phase 1 — Foundation (jour 1, ~3h)
1. `npx create-next-app@latest talqo-hunter` (TypeScript + Tailwind + App Router)
2. Setup Supabase projet + run le SQL du schéma
3. Install : `@supabase/ssr @anthropic-ai/sdk resend lucide-react`
4. Setup shadcn/ui : Button, Card, Badge, Dialog, Tabs, Input, Textarea
5. Layout auth simple (login email magic link via Supabase)

### Phase 2 — Cron Discovery + Qualification (jour 1, ~4h)
1. `/api/cron/discover-prospects/route.ts` avec validation CRON_SECRET
2. `lib/pipeline/discovery.ts` — appel Claude Sonnet avec web_search
3. `lib/pipeline/qualification.ts` — fetch HTML pages carrières + Claude Haiku
4. `lib/ats-detector.ts` — regex
5. Insertion en DB avec dédup sur company_name
6. Logs dans `cron_runs`
7. Test manuel : `curl -H "Authorization: Bearer $CRON_SECRET" localhost:3000/api/cron/discover-prospects`

### Phase 3 — Enrichissement décideurs (jour 2, ~2h)
1. `lib/pipeline/enrichment.ts` — pour chaque P1 score >= 70, enregistrer les décideurs (flux manuel ou source à brancher)
2. Mapping role → role_category (regex sur headline)

### Phase 4 — Génération messages (jour 2, ~2h)
1. `lib/pipeline/message-generation.ts` — Claude Sonnet avec le template
2. Sauvegarde dans `generated_messages`

### Phase 5 — Dashboard Kanban (jour 2, ~4h)
1. `app/(dashboard)/page.tsx` — fetch prospects groupés par status
2. Composant `Board` avec dnd-kit pour le drag & drop
3. Update status au drop via Server Action

### Phase 6 — Détail Prospect (jour 3, ~3h)
1. `app/(dashboard)/prospects/[id]/page.tsx`
2. Section décideurs + messages + boutons actions
3. Bouton "Copier message" (clipboard API)
4. Bouton "Marquer envoyé" (Server Action)

### Phase 7 — Notification email (jour 3, ~1h)
1. `lib/pipeline/notification.ts` — Resend
2. Template HTML simple : liste des nouveaux P1 + lien dashboard
3. Trigger en fin de cron run

### Phase 8 — Settings + déploiement (jour 3, ~2h)
1. Page settings (secteurs activés en JSON dans une table `config`)
2. Bouton "Run manuel" qui POST sur l'endpoint cron
3. Deploy Vercel + setup env vars + cron
4. Configure DNS outils.matheo.fr

**Total estimé : 2-3 jours de dev focus en mode Claude Code intensif.**

## Sécurité

- L'endpoint cron est protégé par un header `Authorization: Bearer ${CRON_SECRET}` que seul Vercel Cron connaît
- Supabase RLS activé sur toutes les tables (seul ton utilisateur peut lire/écrire)
- Pas de cookies LinkedIn ni de scraping LinkedIn direct (respect ToS ; enrichissement manuel ou source conforme à définir)
- Respect des robots.txt pour les fetch de pages carrières
- Throttling : 1 fetch par site max, délai 2s entre fetches

## Métriques à suivre dans le dashboard

- Nombre de prospects par status (par défaut sur la home)
- Taux d'acceptation des connexions
- Taux de réponse au M1
- Taux de conversion M2 → beta signed
- Coût Claude API du mois (estimation)

## Commandes pour Claude Code

```bash
# Initialiser
npx create-next-app@latest talqo-hunter --typescript --tailwind --app
cd talqo-hunter

# Dependencies
npm install @supabase/ssr @supabase/supabase-js @anthropic-ai/sdk resend lucide-react @dnd-kit/core @dnd-kit/sortable

# shadcn/ui
npx shadcn@latest init
npx shadcn@latest add button card badge dialog tabs input textarea sonner

# Variables d'env
cp .env.example .env.local
# Remplir les valeurs

# Dev
npm run dev

# Deploy
vercel
```

## Next steps après livraison de l'app

1. **Calibrer les prompts** sur les premiers résultats — ajuster le scoring P1 si trop strict/laxiste
2. **A/B tester les messages M1** — créer 2 variantes par décideur, suivre lequel performe mieux
3. **Ajouter l'OCR** sur les images de fiches de poste si tu veux scorer plus finement
4. **Intégrer un détecteur de "fresh news"** (RSS / Google Alerts) pour les hooks ultra récents
5. **Connecteur Slack** pour notifs en temps réel des nouveaux P1 top score
