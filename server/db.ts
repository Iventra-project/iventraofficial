import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database path in project root
const DB_PATH = path.resolve(__dirname, '..', 'iventra.db');

export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

// Initialize schema
export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      eventName TEXT NOT NULL,
      organization TEXT NOT NULL,
      institutionName TEXT NOT NULL DEFAULT '',
      logoUrl TEXT NOT NULL DEFAULT '',
      websiteUrl TEXT NOT NULL DEFAULT '',
      screenshotUrl TEXT NOT NULL DEFAULT '',
      packageType TEXT NOT NULL,
      statusBadge TEXT NOT NULL,
      currentStepIndex INTEGER NOT NULL DEFAULT 1,
      registeredCount INTEGER NOT NULL DEFAULT 0,
      targetCount INTEGER NOT NULL DEFAULT 500,
      whatsappRemindersSent INTEGER NOT NULL DEFAULT 0,
      certificatesReady INTEGER NOT NULL DEFAULT 0,
      steps TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS consultations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      campus TEXT NOT NULL,
      eventName TEXT NOT NULL,
      planId TEXT NOT NULL,
      estimatedParticipants INTEGER NOT NULL DEFAULT 250,
      contactNumber TEXT NOT NULL,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'Baru',
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS site_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS oauth_accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      provider TEXT NOT NULL CHECK (provider IN ('google', 'facebook')),
      provider_user_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE (provider, provider_user_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS workspaces (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL,
      name TEXT NOT NULL,
      service_type TEXT NOT NULL DEFAULT 'spark',
      status TEXT NOT NULL DEFAULT 'draft',
      slug TEXT UNIQUE,
      description TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Create indexes for performance
  try { db.exec('CREATE INDEX IF NOT EXISTS idx_workspaces_owner ON workspaces(owner_id);'); } catch {}
  try { db.exec('CREATE INDEX IF NOT EXISTS idx_workspaces_slug ON workspaces(slug);'); } catch {}
  try { db.exec('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);'); } catch {}

  // Migrate workspaces table if columns do not exist
  try { db.exec('ALTER TABLE workspaces ADD COLUMN template_id TEXT DEFAULT "tech-summit";'); } catch {}
  try { db.exec('ALTER TABLE workspaces ADD COLUMN draft_config TEXT DEFAULT "";'); } catch {}
  try { db.exec('ALTER TABLE workspaces ADD COLUMN published_config TEXT DEFAULT "";'); } catch {}
  try { db.exec('ALTER TABLE workspaces ADD COLUMN published_at TEXT DEFAULT NULL;'); } catch {}

  // Migrate projects table if columns do not exist
  try { db.exec('ALTER TABLE projects ADD COLUMN institutionName TEXT DEFAULT "";'); } catch {}
  try { db.exec('ALTER TABLE projects ADD COLUMN logoUrl TEXT DEFAULT "";'); } catch {}
  try { db.exec('ALTER TABLE projects ADD COLUMN websiteUrl TEXT DEFAULT "";'); } catch {}
  try { db.exec('ALTER TABLE projects ADD COLUMN screenshotUrl TEXT DEFAULT "";'); } catch {}

  // Initialize site settings if empty
  initSiteSettings();

  // Check if projects table is empty, if so, seed demo data
  const countRow = db.prepare('SELECT COUNT(*) as count FROM projects').get() as { count: number };
  if (countRow.count === 0) {
    seedDemoData();
  }
}

export const DEFAULT_SITE_SETTINGS: Record<string, string> = {
  sparkPrice: 'Rp 150rb - 300rb',
  sparkPriceNote: '/ event',
  flowPrice: 'Mulai Rp 500.000',
  flowPriceNote: '/ event',
  botPrice: 'Rp 70.000',
  botPriceNote: '/ event',
  totalProjectsHandled: '120+',
  totalActiveUsers: '15.000+'
};

export function initSiteSettings() {
  const count = (db.prepare('SELECT COUNT(*) as c FROM site_settings').get() as any).c;
  if (count === 0) {
    const insert = db.prepare('INSERT OR REPLACE INTO site_settings (key, value) VALUES (?, ?)');
    for (const [key, value] of Object.entries(DEFAULT_SITE_SETTINGS)) {
      insert.run(key, value);
    }
  }
}

export function seedDemoData() {
  // Clear existing
  db.exec('DELETE FROM projects;');
  db.exec('DELETE FROM consultations;');

  const insertProject = db.prepare(`
    INSERT INTO projects (
      id, eventName, organization, institutionName, logoUrl, websiteUrl, screenshotUrl,
      packageType, statusBadge, currentStepIndex, registeredCount, targetCount,
      whatsappRemindersSent, certificatesReady, steps, updatedAt, createdAt
    ) VALUES (
      @id, @eventName, @organization, @institutionName, @logoUrl, @websiteUrl, @screenshotUrl,
      @packageType, @statusBadge, @currentStepIndex, @registeredCount, @targetCount,
      @whatsappRemindersSent, @certificatesReady, @steps, @updatedAt, @createdAt
    )
  `);

  const demoProjects = [
    {
      id: 'IVN-2025-FTUI',
      eventName: 'Engineering Career & Tech Expo 2025',
      organization: 'BEM FT Universitas Indonesia',
      institutionName: 'Universitas Indonesia',
      logoUrl: 'https://images.unsplash.com/photo-1592280771190-3e2e4d571952?w=120&auto=format&fit=crop&q=80',
      websiteUrl: 'https://expotech.eng.ui.ac.id',
      screenshotUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80',
      packageType: 'Flow (Multi-Stage Competition)',
      statusBadge: 'Event Berjalan',
      currentStepIndex: 3,
      registeredCount: 1420,
      targetCount: 1500,
      whatsappRemindersSent: 1420,
      certificatesReady: 1,
      updatedAt: 'Hari ini, 10:45 WIB',
      createdAt: '2025-10-10 09:00:00',
      steps: JSON.stringify([
        { id: 1, title: 'Konsultasi & Kebutuhan', desc: 'Brief alur seleksi & form pendaftaran', status: 'completed', dateCompleted: '12 Okt 2025' },
        { id: 2, title: 'Setup & Custom Branding', desc: 'Deploy domain & integrasi logo institusi', status: 'completed', dateCompleted: '14 Okt 2025' },
        { id: 3, title: 'Event Berjalan & Presensi', desc: 'Scan QR tiket & live analytics panitia', status: 'current' },
        { id: 4, title: 'Laporan & LPJ Otomatis', desc: 'Ekspor rekap kehadiran & e-sertifikat', status: 'upcoming' }
      ])
    },
    {
      id: 'IVN-2025-UGM',
      eventName: 'National Student Business Case Competition',
      organization: 'BEM KM Universitas Gadjah Mada',
      institutionName: 'Universitas Gadjah Mada',
      logoUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=120&auto=format&fit=crop&q=80',
      websiteUrl: 'https://businesscase.ugm.ac.id',
      screenshotUrl: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&auto=format&fit=crop&q=80',
      packageType: 'Flow (Penjurian Terpusat)',
      statusBadge: 'Penjurian Berkas',
      currentStepIndex: 2,
      registeredCount: 450,
      targetCount: 500,
      whatsappRemindersSent: 450,
      certificatesReady: 0,
      updatedAt: 'Kemarin, 16:20 WIB',
      createdAt: '2025-10-15 14:00:00',
      steps: JSON.stringify([
        { id: 1, title: 'Konsultasi & Kebutuhan', desc: 'Diskusi format proposal & rubrik nilai', status: 'completed', dateCompleted: '18 Okt 2025' },
        { id: 2, title: 'Setup & Custom Branding', desc: 'Portal juri dan upload berkas tim', status: 'current' },
        { id: 3, title: 'Event Berjalan & Presensi', desc: 'Presentasi finalis & penilaian live', status: 'upcoming' },
        { id: 4, title: 'Laporan & LPJ Otomatis', desc: 'Pengumuman juara & sertifikat digital', status: 'upcoming' }
      ])
    },
    {
      id: 'IVN-2025-TEDX',
      eventName: 'TEDxYouth Innovation Summit',
      organization: 'TEDx Kampus Komunitas',
      institutionName: 'TEDx Youth Indonesia',
      logoUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=120&auto=format&fit=crop&q=80',
      websiteUrl: 'https://tedxyouthsummit.id',
      screenshotUrl: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&auto=format&fit=crop&q=80',
      packageType: 'Spark + WA Bot Reminder',
      statusBadge: 'Selesai & LPJ',
      currentStepIndex: 4,
      registeredCount: 820,
      targetCount: 800,
      whatsappRemindersSent: 820,
      certificatesReady: 1,
      updatedAt: '20 Okt 2025',
      createdAt: '2025-10-01 11:30:00',
      steps: JSON.stringify([
        { id: 1, title: 'Konsultasi & Kebutuhan', desc: 'Pemilihan tema & alur tiket masuk', status: 'completed', dateCompleted: '01 Okt 2025' },
        { id: 2, title: 'Setup & Custom Branding', desc: 'Landing page tiket ber-barcode unik', status: 'completed', dateCompleted: '04 Okt 2025' },
        { id: 3, title: 'Event Berjalan & Presensi', desc: 'Gate scanner lancar tanpa antre', status: 'completed', dateCompleted: '15 Okt 2025' },
        { id: 4, title: 'Laporan & LPJ Otomatis', desc: 'Laporan keuangan & sertifikat terbit', status: 'completed', dateCompleted: '16 Okt 2025' }
      ])
    }
  ];

  for (const p of demoProjects) {
    insertProject.run(p);
  }

  // Insert sample consultation inquiries
  const insertConsultation = db.prepare(`
    INSERT INTO consultations (
      name, campus, eventName, planId, estimatedParticipants,
      contactNumber, notes, status, createdAt
    ) VALUES (
      @name, @campus, @eventName, @planId, @estimatedParticipants,
      @contactNumber, @notes, @status, @createdAt
    )
  `);

  const demoConsultations = [
    {
      name: 'Rian Pratama',
      campus: 'Institut Teknologi Bandung',
      eventName: 'ITB Hackathon & Game Jam 2025',
      planId: 'flow',
      estimatedParticipants: 600,
      contactNumber: '081298765432',
      notes: 'Butuh submission karya ber-tim dan penilaian 10 juri dari industri.',
      status: 'Baru',
      createdAt: 'Hari ini, 09:15 WIB'
    },
    {
      name: 'Nabila Syahrani',
      campus: 'Universitas Airlangga',
      eventName: 'Seminar Nasional Farmasi Klinis',
      planId: 'spark',
      estimatedParticipants: 350,
      contactNumber: '085712348765',
      notes: 'Perlu tiket QR code dan kirim sertifikat otomatis setelah presensi selesai.',
      status: 'Dihubungi',
      createdAt: 'Kemarin, 14:30 WIB'
    },
    {
      name: 'Dimas Wicaksono',
      campus: 'Universitas Diponegoro',
      eventName: 'Diponegoro Business Case Competition',
      planId: 'bot',
      estimatedParticipants: 400,
      contactNumber: '082199887766',
      notes: 'Fokus blast reminder WA H-3 dan H-1 ke seluruh peserta agar hadir tepat waktu.',
      status: 'Deal',
      createdAt: '22 Okt 2025'
    }
  ];

  for (const c of demoConsultations) {
    insertConsultation.run(c);
  }
}

// Data Access Helpers
export function getAllProjects() {
  const rows = db.prepare('SELECT * FROM projects ORDER BY createdAt DESC').all() as any[];
  return rows.map((r) => ({
    ...r,
    certificatesReady: Boolean(r.certificatesReady),
    steps: JSON.parse(r.steps)
  }));
}

export function getProjectById(id: string) {
  const row = db.prepare('SELECT * FROM projects WHERE UPPER(id) = UPPER(?)').get(id) as any;
  if (!row) return null;
  return {
    ...row,
    certificatesReady: Boolean(row.certificatesReady),
    steps: JSON.parse(row.steps)
  };
}

export function saveProject(project: any) {
  const existing = db.prepare('SELECT id FROM projects WHERE UPPER(id) = UPPER(?)').get(project.id);
  const now = new Date().toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  const payload = {
    id: project.id.trim().toUpperCase(),
    eventName: project.eventName,
    organization: project.organization,
    institutionName: project.institutionName || project.organization || '',
    logoUrl: project.logoUrl || '',
    websiteUrl: project.websiteUrl || '',
    screenshotUrl: project.screenshotUrl || '',
    packageType: project.packageType,
    statusBadge: project.statusBadge || 'Konsultasi & Setup',
    currentStepIndex: Number(project.currentStepIndex) || 1,
    registeredCount: Number(project.registeredCount) || 0,
    targetCount: Number(project.targetCount) || 500,
    whatsappRemindersSent: Number(project.whatsappRemindersSent) || 0,
    certificatesReady: project.certificatesReady ? 1 : 0,
    steps: JSON.stringify(project.steps || []),
    updatedAt: project.updatedAt || `Hari ini, ${now}`,
    createdAt: project.createdAt || new Date().toISOString()
  };

  if (existing) {
    const update = db.prepare(`
      UPDATE projects SET
        eventName = @eventName,
        organization = @organization,
        institutionName = @institutionName,
        logoUrl = @logoUrl,
        websiteUrl = @websiteUrl,
        screenshotUrl = @screenshotUrl,
        packageType = @packageType,
        statusBadge = @statusBadge,
        currentStepIndex = @currentStepIndex,
        registeredCount = @registeredCount,
        targetCount = @targetCount,
        whatsappRemindersSent = @whatsappRemindersSent,
        certificatesReady = @certificatesReady,
        steps = @steps,
        updatedAt = @updatedAt
      WHERE id = @id
    `);
    update.run(payload);
  } else {
    const insert = db.prepare(`
      INSERT INTO projects (
        id, eventName, organization, institutionName, logoUrl, websiteUrl, screenshotUrl,
        packageType, statusBadge, currentStepIndex, registeredCount, targetCount,
        whatsappRemindersSent, certificatesReady, steps, updatedAt, createdAt
      ) VALUES (
        @id, @eventName, @organization, @institutionName, @logoUrl, @websiteUrl, @screenshotUrl,
        @packageType, @statusBadge, @currentStepIndex, @registeredCount, @targetCount,
        @whatsappRemindersSent, @certificatesReady, @steps, @updatedAt, @createdAt
      )
    `);
    insert.run(payload);
  }

  return getProjectById(payload.id);
}

export function deleteProject(id: string) {
  const result = db.prepare('DELETE FROM projects WHERE UPPER(id) = UPPER(?)').run(id);
  return result.changes > 0;
}

export function getAllConsultations() {
  return db.prepare('SELECT * FROM consultations ORDER BY id DESC').all();
}

export function createConsultation(item: {
  name: string;
  campus: string;
  eventName: string;
  planId: string;
  estimatedParticipants?: number;
  contactNumber: string;
  notes?: string;
}) {
  const now = new Date().toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  const stmt = db.prepare(`
    INSERT INTO consultations (
      name, campus, eventName, planId, estimatedParticipants,
      contactNumber, notes, status, createdAt
    ) VALUES (
      ?, ?, ?, ?, ?,
      ?, ?, 'Baru', ?
    )
  `);

  const result = stmt.run(
    item.name,
    item.campus,
    item.eventName,
    item.planId || 'flow',
    item.estimatedParticipants || 250,
    item.contactNumber,
    item.notes || '',
    now
  );

  return db.prepare('SELECT * FROM consultations WHERE id = ?').get(result.lastInsertRowid);
}

export function updateConsultationStatus(id: number, status: string) {
  db.prepare('UPDATE consultations SET status = ? WHERE id = ?').run(status, id);
  return db.prepare('SELECT * FROM consultations WHERE id = ?').get(id);
}

export function deleteConsultation(id: number) {
  const res = db.prepare('DELETE FROM consultations WHERE id = ?').run(id);
  return res.changes > 0;
}

export function getStats() {
  const totalProjects = (db.prepare('SELECT COUNT(*) as c FROM projects').get() as any).c;
  const activeProjects = (db.prepare("SELECT COUNT(*) as c FROM projects WHERE statusBadge != 'Selesai & LPJ'").get() as any).c;
  const totalLeads = (db.prepare('SELECT COUNT(*) as c FROM consultations').get() as any).c;
  const newLeads = (db.prepare("SELECT COUNT(*) as c FROM consultations WHERE status = 'Baru'").get() as any).c;
  
  const aggregates = db.prepare(`
    SELECT
      COALESCE(SUM(registeredCount), 0) as totalRegistered,
      COALESCE(SUM(targetCount), 0) as totalTarget,
      COALESCE(SUM(whatsappRemindersSent), 0) as totalWaSent
    FROM projects
  `).get() as any;

  return {
    totalProjects,
    activeProjects,
    totalLeads,
    newLeads,
    totalRegistered: aggregates.totalRegistered,
    totalTarget: aggregates.totalTarget,
    totalWaSent: aggregates.totalWaSent,
    dbPath: DB_PATH
  };
}

export function getSiteSettings(): Record<string, string> {
  initSiteSettings();
  const rows = db.prepare('SELECT key, value FROM site_settings').all() as { key: string; value: string }[];
  const result: Record<string, string> = { ...DEFAULT_SITE_SETTINGS };
  for (const r of rows) {
    result[r.key] = r.value;
  }
  return result;
}

export function updateSiteSettings(settings: Record<string, string>): Record<string, string> {
  initSiteSettings();
  const upsert = db.prepare(`
    INSERT INTO site_settings (key, value)
    VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `);

  const updateTx = db.transaction((entries: [string, string][]) => {
    for (const [k, v] of entries) {
      upsert.run(k, String(v));
    }
  });

  updateTx(Object.entries(settings));
  return getSiteSettings();
}

// ─────────────────────────────────────────────
// USER data access helpers
// ─────────────────────────────────────────────

export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export function getUserByEmail(email: string): UserRow | null {
  return db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(email) as UserRow | null;
}

export function getUserById(id: string): UserRow | null {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | null;
}

export function createUser(user: { id: string; email: string; password_hash: string; name: string }): UserRow {
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO users (id, email, password_hash, name, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(user.id, user.email.toLowerCase().trim(), user.password_hash, user.name.trim(), now, now);
  return getUserById(user.id)!;
}

export type OAuthProvider = 'google' | 'facebook';

export function getOrCreateOAuthUser(input: {
  provider: OAuthProvider;
  providerUserId: string;
  email: string;
  password_hash: string;
  name: string;
}): UserRow {
  const linkAccount = db.transaction(() => {
    const linkedAccount = db.prepare(
      'SELECT user_id FROM oauth_accounts WHERE provider = ? AND provider_user_id = ?'
    ).get(input.provider, input.providerUserId) as { user_id: string } | undefined;

    if (linkedAccount) {
      const linkedUser = getUserById(linkedAccount.user_id);
      if (!linkedUser) throw new Error('OAuth account is linked to a missing user.');
      return linkedUser;
    }

    const email = input.email.trim().toLowerCase();
    if (getUserByEmail(email)) {
      throw new Error('OAuth email already in use.');
    }

    const user = createUser({
      id: randomUUID(),
      email,
      password_hash: input.password_hash,
      name: input.name
    });

    db.prepare(`
      INSERT INTO oauth_accounts (user_id, provider, provider_user_id, created_at)
      VALUES (?, ?, ?, ?)
    `).run(user.id, input.provider, input.providerUserId, new Date().toISOString());

    return user;
  });

  return linkAccount();
}

export function updateUserProfile(id: string, updates: { name?: string }): UserRow | null {
  const now = new Date().toISOString();
  if (updates.name) {
    db.prepare('UPDATE users SET name = ?, updated_at = ? WHERE id = ?').run(updates.name.trim(), now, id);
  }
  return getUserById(id);
}

export function updateUserPassword(id: string, password_hash: string): boolean {
  const now = new Date().toISOString();
  const res = db.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?').run(password_hash, now, id);
  return res.changes > 0;
}

// ─────────────────────────────────────────────
// WORKSPACE data access helpers
// ─────────────────────────────────────────────

export interface WorkspaceRow {
  id: string;
  owner_id: string;
  name: string;
  service_type: string;
  status: string;
  slug: string | null;
  description: string | null;
  template_id?: string;
  draft_config?: string;
  published_config?: string;
  published_at?: string | null;
  created_at: string;
  updated_at: string;
}

export function getWorkspacesByOwner(owner_id: string): WorkspaceRow[] {
  return db.prepare('SELECT * FROM workspaces WHERE owner_id = ? ORDER BY created_at DESC').all(owner_id) as WorkspaceRow[];
}

export function getWorkspaceById(id: string, owner_id: string): WorkspaceRow | null {
  return db.prepare('SELECT * FROM workspaces WHERE id = ? AND owner_id = ?').get(id, owner_id) as WorkspaceRow | null;
}

export function getWorkspaceBySlug(slug: string): WorkspaceRow | null {
  return db.prepare('SELECT * FROM workspaces WHERE LOWER(slug) = LOWER(?)').get(slug) as WorkspaceRow | null;
}

export function getPublishedWorkspaceBySlug(slug: string): WorkspaceRow | null {
  return db.prepare('SELECT * FROM workspaces WHERE LOWER(slug) = LOWER(?) AND status = "published"').get(slug) as WorkspaceRow | null;
}

export function createWorkspace(ws: {
  id: string;
  owner_id: string;
  name: string;
  service_type?: string;
  slug?: string;
  description?: string;
  template_id?: string;
  draft_config?: string;
}): WorkspaceRow {
  const now = new Date().toISOString();
  const slug = ws.slug ? cleanSlug(ws.slug) : generateSlug(ws.name, ws.id);
  const templateId = ws.template_id || 'tech-summit';
  const draftConfig = ws.draft_config || '';

  db.prepare(`
    INSERT INTO workspaces (id, owner_id, name, service_type, status, slug, description, template_id, draft_config, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?)
  `).run(ws.id, ws.owner_id, ws.name.trim(), ws.service_type || 'spark', slug, ws.description || null, templateId, draftConfig, now, now);
  return getWorkspaceById(ws.id, ws.owner_id)!;
}

export function updateWorkspace(id: string, owner_id: string, updates: {
  name?: string;
  status?: string;
  description?: string;
  slug?: string;
  template_id?: string;
}): WorkspaceRow | null {
  const now = new Date().toISOString();
  const ws = getWorkspaceById(id, owner_id);
  if (!ws) return null;

  const name = updates.name?.trim() ?? ws.name;
  const status = updates.status ?? ws.status;
  const description = updates.description !== undefined ? updates.description : ws.description;
  const slug = updates.slug?.trim() ?? ws.slug;
  const template_id = updates.template_id ?? ws.template_id;

  db.prepare(`
    UPDATE workspaces SET name = ?, status = ?, description = ?, slug = ?, template_id = ?, updated_at = ?
    WHERE id = ? AND owner_id = ?
  `).run(name, status, description, slug, template_id, now, id, owner_id);

  return getWorkspaceById(id, owner_id);
}

export function saveWorkspaceBuilderConfig(id: string, owner_id: string, data: {
  name?: string;
  slug?: string;
  description?: string;
  template_id?: string;
  draft_config: string;
}): WorkspaceRow | null {
  const now = new Date().toISOString();
  const ws = getWorkspaceById(id, owner_id);
  if (!ws) return null;

  const name = data.name?.trim() ?? ws.name;
  const slug = data.slug?.trim() ? cleanSlug(data.slug) : ws.slug;
  const description = data.description !== undefined ? data.description : ws.description;
  const template_id = data.template_id ?? ws.template_id;

  db.prepare(`
    UPDATE workspaces SET name = ?, slug = ?, description = ?, template_id = ?, draft_config = ?, updated_at = ?
    WHERE id = ? AND owner_id = ?
  `).run(name, slug, description, template_id, data.draft_config, now, id, owner_id);

  return getWorkspaceById(id, owner_id);
}

export function publishWorkspace(id: string, owner_id: string): { success: boolean; workspace?: WorkspaceRow; error?: string } {
  const ws = getWorkspaceById(id, owner_id);
  if (!ws) return { success: false, error: 'Workspace tidak ditemukan.' };

  const configToPublish = ws.draft_config && ws.draft_config.trim().length > 0 ? ws.draft_config : '';
  if (!configToPublish) {
    return { success: false, error: 'Konfigurasi event masih kosong. Simpan draft terlebih dahulu.' };
  }

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE workspaces SET
      status = 'published',
      published_config = draft_config,
      published_at = ?,
      updated_at = ?
    WHERE id = ? AND owner_id = ?
  `).run(now, now, id, owner_id);

  const updated = getWorkspaceById(id, owner_id)!;
  return { success: true, workspace: updated };
}

export function unpublishWorkspace(id: string, owner_id: string): { success: boolean; workspace?: WorkspaceRow; error?: string } {
  const ws = getWorkspaceById(id, owner_id);
  if (!ws) return { success: false, error: 'Workspace tidak ditemukan.' };

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE workspaces SET
      status = 'draft',
      updated_at = ?
    WHERE id = ? AND owner_id = ?
  `).run(now, id, owner_id);

  const updated = getWorkspaceById(id, owner_id)!;
  return { success: true, workspace: updated };
}

export function deleteWorkspace(id: string, owner_id: string): boolean {
  const result = db.prepare('DELETE FROM workspaces WHERE id = ? AND owner_id = ?').run(id, owner_id);
  return result.changes > 0;
}

export function cleanSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 50);
}

export function generateSlug(name: string, id: string): string {
  const base = cleanSlug(name) || 'event';
  const suffix = id.slice(-6);
  return `${base}-${suffix}`;
}

// Auto init on import
initDb();
