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
  age INTEGER DEFAULT NULL,
  gender TEXT DEFAULT NULL,
  onboarding_role TEXT DEFAULT NULL,
  onboarding_purpose TEXT DEFAULT NULL,
  onboarding_source TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 2B. TABLE: PENDING EMAIL VERIFICATIONS (Kode OTP Pendaftaran)
CREATE TABLE IF NOT EXISTS pending_email_verifications (
  email TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  expires_at BIGINT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  sends_in_window INTEGER NOT NULL DEFAULT 1,
  window_started_at BIGINT NOT NULL,
  resend_after BIGINT NOT NULL,
  age INTEGER DEFAULT NULL,
  gender TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

-- 9. TABLE: TEMPLATES (Event Templates)
CREATE TABLE IF NOT EXISTS templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  badge TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  preview_gradient TEXT,
  recommended_for TEXT,
  default_config JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- SEED PERMANENT ADMIN (eventra.work@gmail.com / fromsijatosija)
-- Hash bcrypt untuk 'fromsijatosija'
INSERT INTO users (id, email, password_hash, name, plan, role, created_at, updated_at)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'eventra.work@gmail.com',
  '$2b$12$JeoBkUx1yi2lO5y7lzD5kOkyocNzJil2lzS.CrxuLDK6zVKnm6qyu',
  'Iventra Admin',
  'spark_pro',
  'admin',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  password_hash = '$2b$12$JeoBkUx1yi2lO5y7lzD5kOkyocNzJil2lzS.CrxuLDK6zVKnm6qyu',
  role = 'admin',
  plan = 'spark_pro',
  updated_at = NOW();

-- 10. PERMISSIONS (Wajib untuk Supabase REST API & service_role)
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role, anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role, anon, authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, service_role, anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, service_role, anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, service_role, anon, authenticated;

