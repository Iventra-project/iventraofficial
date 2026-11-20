-- ==============================================================================
-- IVENTRA PLATFORM - SUPABASE / POSTGRESQL SCHEMA MIGRATION
-- Cocok untuk di-paste langsung pada Supabase SQL Editor
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TABLE: USERS
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'spark' CHECK (plan IN ('spark', 'spark_pro')),
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 3. TABLE: OAUTH ACCOUNTS
CREATE TABLE IF NOT EXISTS oauth_accounts (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'facebook')),
  provider_user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_oauth_provider_user UNIQUE (provider, provider_user_id)
);

CREATE INDEX IF NOT EXISTS idx_oauth_accounts_user ON oauth_accounts(user_id);

-- 4. TABLE: WORKSPACES (Event Websites & Forms)
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  service_type TEXT NOT NULL DEFAULT 'spark',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  slug TEXT UNIQUE,
  description TEXT,
  template_id TEXT DEFAULT 'tech-summit',
  draft_config JSONB DEFAULT '{}'::jsonb,
  published_config JSONB DEFAULT '{}'::jsonb,
  published_at TIMESTAMPTZ DEFAULT NULL,
  visitors_count INTEGER NOT NULL DEFAULT 0,
  form_started_count INTEGER NOT NULL DEFAULT 0,
  submitted_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workspaces_owner ON workspaces(owner_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_slug ON workspaces(slug);

-- 5. TABLE: WORKSPACE SUBMISSIONS (Responses & Pendaftaran)
CREATE TABLE IF NOT EXISTS workspace_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'verified', 'rejected')),
  payment_proof_url TEXT,
  payment_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_submissions_ws ON workspace_submissions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_submissions_created ON workspace_submissions(created_at DESC);

-- 6. TABLE: CONSULTATIONS (Leads dari Landing Page)
CREATE TABLE IF NOT EXISTS consultations (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  campus TEXT NOT NULL,
  event_name TEXT NOT NULL,
  plan_id TEXT NOT NULL,
  estimated_participants INTEGER NOT NULL DEFAULT 250,
  contact_number TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'Baru' CHECK (status IN ('Baru', 'Dihubungi', 'Deal', 'Batal')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. TABLE: MANAGED PROJECTS (Iventra Expert)
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  event_name TEXT NOT NULL,
  organization TEXT NOT NULL,
  institution_name TEXT NOT NULL DEFAULT '',
  logo_url TEXT NOT NULL DEFAULT '',
  website_url TEXT NOT NULL DEFAULT '',
  screenshot_url TEXT NOT NULL DEFAULT '',
  package_type TEXT NOT NULL,
  status_badge TEXT NOT NULL,
  current_step_index INTEGER NOT NULL DEFAULT 1,
  registered_count INTEGER NOT NULL DEFAULT 0,
  target_count INTEGER NOT NULL DEFAULT 500,
  whatsapp_reminders_sent INTEGER NOT NULL DEFAULT 0,
  certificates_ready INTEGER NOT NULL DEFAULT 0,
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. TABLE: SITE SETTINGS (Tarif & Statistik Landing Page)
CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- SEED DEFAULT SITE SETTINGS
INSERT INTO site_settings (key, value) VALUES
  ('sparkPrice', 'Rp 150rb - 300rb'),
  ('sparkPriceNote', '/ event'),
  ('flowPrice', 'Mulai Rp 500.000'),
  ('flowPriceNote', '/ event'),
  ('botPrice', 'Rp 70.000'),
  ('botPriceNote', '/ event'),
  ('totalProjectsHandled', '120+'),
  ('totalActiveUsers', '15.000+')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
