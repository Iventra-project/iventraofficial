import Database from 'better-sqlite3';
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

    CREATE TABLE IF NOT EXISTS workspace_submissions (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      data TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'submitted',
      payment_proof_url TEXT,
      payment_email TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
    );
  `);

  // Create indexes for performance
  try { db.exec('CREATE INDEX IF NOT EXISTS idx_workspaces_owner ON workspaces(owner_id);'); } catch {}
  try { db.exec('CREATE INDEX IF NOT EXISTS idx_workspaces_slug ON workspaces(slug);'); } catch {}
  try { db.exec('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);'); } catch {}
  try { db.exec('CREATE INDEX IF NOT EXISTS idx_submissions_ws ON workspace_submissions(workspace_id);'); } catch {}

  // Migrate workspaces table if columns do not exist
  try { db.exec('ALTER TABLE workspaces ADD COLUMN template_id TEXT DEFAULT "tech-summit";'); } catch {}
  try { db.exec('ALTER TABLE workspaces ADD COLUMN draft_config TEXT DEFAULT "";'); } catch {}
  try { db.exec('ALTER TABLE workspaces ADD COLUMN published_config TEXT DEFAULT "";'); } catch {}
  try { db.exec('ALTER TABLE workspaces ADD COLUMN published_at TEXT DEFAULT NULL;'); } catch {}
  try { db.exec('ALTER TABLE workspaces ADD COLUMN visitors_count INTEGER DEFAULT 0;'); } catch {}
  try { db.exec('ALTER TABLE workspaces ADD COLUMN form_started_count INTEGER DEFAULT 0;'); } catch {}
  try { db.exec('ALTER TABLE workspaces ADD COLUMN submitted_count INTEGER DEFAULT 0;'); } catch {}

  // Migrate users table for plan and role
  try { db.exec('ALTER TABLE users ADD COLUMN plan TEXT DEFAULT "spark";'); } catch {}
  try { db.exec('ALTER TABLE users ADD COLUMN role TEXT DEFAULT "user";'); } catch {}

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
  plan?: string; // 'spark' (Free, limit 500) | 'spark_pro' (Pro, limit 5000)
  role?: string; // 'user' | 'admin'
  created_at: string;
  updated_at: string;
}

export function getUserByEmail(email: string): UserRow | null {
  return db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(email) as UserRow | null;
}

export function getUserById(id: string): UserRow | null {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | null;
}

export function createUser(user: { id: string; email: string; password_hash: string; name: string; plan?: string; role?: string }): UserRow {
  const now = new Date().toISOString();
  const plan = user.plan || 'spark';
  const role = user.role || 'user';
  db.prepare(`
    INSERT INTO users (id, email, password_hash, name, plan, role, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(user.id, user.email.toLowerCase().trim(), user.password_hash, user.name.trim(), plan, role, now, now);
  return getUserById(user.id)!;
}

export function updateUserProfile(id: string, updates: { name?: string }): UserRow | null {
  const now = new Date().toISOString();
  if (updates.name) {
    db.prepare('UPDATE users SET name = ?, updated_at = ? WHERE id = ?').run(updates.name.trim(), now, id);
  }
  return getUserById(id);
}

// ─────────────────────────────────────────────
// ADMIN DATA ACCESS HELPERS
// ─────────────────────────────────────────────

export interface AdminUserItem {
  id: string;
  email: string;
  name: string;
  plan: 'spark' | 'spark_pro' | string;
  role: 'user' | 'admin' | string;
  created_at: string;
  updated_at: string;
  workspaces_count: number;
  total_traffic: number;
  traffic_limit: number;
  traffic_percent: number;
  submissions_count: number;
}

export interface AdminWorkspaceItem extends WorkspaceRow {
  owner_name: string;
  owner_email: string;
  owner_plan: string;
  submissions_count: number;
}

export function getAdminStats() {
  const totalUsers = (db.prepare('SELECT COUNT(*) as c FROM users').get() as any)?.c || 0;
  const proUsers = (db.prepare("SELECT COUNT(*) as c FROM users WHERE plan = 'spark_pro'").get() as any)?.c || 0;
  const freeUsers = totalUsers - proUsers;
  const totalWorkspaces = (db.prepare('SELECT COUNT(*) as c FROM workspaces').get() as any)?.c || 0;
  const publishedWorkspaces = (db.prepare("SELECT COUNT(*) as c FROM workspaces WHERE status = 'published'").get() as any)?.c || 0;
  const totalTraffic = (db.prepare('SELECT COALESCE(SUM(visitors_count), 0) as s FROM workspaces').get() as any)?.s || 0;
  const totalSubmissions = (db.prepare('SELECT COUNT(*) as c FROM workspace_submissions').get() as any)?.c || 0;
  const totalLeads = (db.prepare('SELECT COUNT(*) as c FROM consultations').get() as any)?.c || 0;

  return {
    totalUsers,
    proUsers,
    freeUsers,
    totalWorkspaces,
    publishedWorkspaces,
    totalTraffic,
    totalSubmissions,
    totalLeads
  };
}

export function getAllUsersWithTraffic(): AdminUserItem[] {
  const rows = db.prepare(`
    SELECT 
      u.id, 
      u.email, 
      u.name, 
      COALESCE(u.plan, 'spark') as plan, 
      COALESCE(u.role, 'user') as role, 
      u.created_at, 
      u.updated_at,
      COUNT(DISTINCT w.id) as workspaces_count,
      COALESCE(SUM(w.visitors_count), 0) as total_traffic,
      COUNT(DISTINCT s.id) as submissions_count
    FROM users u
    LEFT JOIN workspaces w ON w.owner_id = u.id
    LEFT JOIN workspace_submissions s ON s.workspace_id = w.id
    GROUP BY u.id
    ORDER BY u.created_at DESC
  `).all() as any[];

  return rows.map((r) => {
    const isPro = r.plan === 'spark_pro';
    const limit = isPro ? 5000 : 500;
    const traffic = Number(r.total_traffic || 0);
    const percent = Math.min(100, Math.round((traffic / limit) * 100));

    return {
      id: r.id,
      email: r.email,
      name: r.name,
      plan: r.plan,
      role: r.role,
      created_at: r.created_at,
      updated_at: r.updated_at,
      workspaces_count: Number(r.workspaces_count || 0),
      total_traffic: traffic,
      traffic_limit: limit,
      traffic_percent: percent,
      submissions_count: Number(r.submissions_count || 0)
    };
  });
}

export function getAdminUserDetail(id: string) {
  const user = getUserById(id);
  if (!user) return null;

  const isPro = user.plan === 'spark_pro';
  const limit = isPro ? 5000 : 500;

  const workspaces = db.prepare(`
    SELECT 
      w.*,
      (SELECT COUNT(*) FROM workspace_submissions WHERE workspace_id = w.id) as submissions_count
    FROM workspaces w
    WHERE w.owner_id = ?
    ORDER BY w.updated_at DESC
  `).all(id) as any[];

  const totalTraffic = workspaces.reduce((acc, ws) => acc + (Number(ws.visitors_count) || 0), 0);
  const totalSubmissions = workspaces.reduce((acc, ws) => acc + (Number(ws.submissions_count) || 0), 0);
  const percent = Math.min(100, Math.round((totalTraffic / limit) * 100));

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    plan: user.plan || 'spark',
    role: user.role || 'user',
    created_at: user.created_at,
    updated_at: user.updated_at,
    traffic_limit: limit,
    total_traffic: totalTraffic,
    traffic_percent: percent,
    total_submissions: totalSubmissions,
    workspaces_count: workspaces.length,
    workspaces: workspaces.map((w) => ({
      ...w,
      visitors_count: Number(w.visitors_count || 0),
      submissions_count: Number(w.submissions_count || 0)
    }))
  };
}

export function adminCreateUser(data: { name: string; email: string; password_hash: string; plan?: string; role?: string }): UserRow {
  const id = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  return createUser({
    id,
    name: data.name,
    email: data.email,
    password_hash: data.password_hash,
    plan: data.plan || 'spark',
    role: data.role || 'user'
  });
}

export function adminUpdateUser(id: string, updates: { name?: string; email?: string; plan?: string; role?: string; password_hash?: string }): UserRow | null {
  const now = new Date().toISOString();
  const user = getUserById(id);
  if (!user) return null;

  const name = updates.name?.trim() ?? user.name;
  const email = updates.email?.toLowerCase().trim() ?? user.email;
  const plan = updates.plan ?? user.plan ?? 'spark';
  const role = updates.role ?? user.role ?? 'user';

  if (updates.password_hash) {
    db.prepare('UPDATE users SET name = ?, email = ?, plan = ?, role = ?, password_hash = ?, updated_at = ? WHERE id = ?')
      .run(name, email, plan, role, updates.password_hash, now, id);
  } else {
    db.prepare('UPDATE users SET name = ?, email = ?, plan = ?, role = ?, updated_at = ? WHERE id = ?')
      .run(name, email, plan, role, now, id);
  }

  return getUserById(id);
}

export function adminDeleteUser(id: string): boolean {
  // Cascades to workspaces and submissions
  const res = db.prepare('DELETE FROM users WHERE id = ?').run(id);
  return res.changes > 0;
}

export function getAllWorkspacesForAdmin(): AdminWorkspaceItem[] {
  const rows = db.prepare(`
    SELECT 
      w.*,
      COALESCE(u.name, 'Unknown') as owner_name,
      COALESCE(u.email, '-') as owner_email,
      COALESCE(u.plan, 'spark') as owner_plan,
      (SELECT COUNT(*) FROM workspace_submissions WHERE workspace_id = w.id) as submissions_count
    FROM workspaces w
    LEFT JOIN users u ON w.owner_id = u.id
    ORDER BY w.updated_at DESC
  `).all() as any[];

  return rows.map((r) => ({
    ...r,
    submissions_count: Number(r.submissions_count || 0),
    visitors_count: Number(r.visitors_count || 0),
    form_started_count: Number(r.form_started_count || 0),
    submitted_count: Number(r.submitted_count || 0)
  }));
}

export function adminUpdateWorkspace(id: string, updates: { name?: string; slug?: string; status?: string; service_type?: string; visitors_count?: number }): WorkspaceRow | null {
  const now = new Date().toISOString();
  const ws = db.prepare('SELECT * FROM workspaces WHERE id = ?').get(id) as WorkspaceRow | null;
  if (!ws) return null;

  const name = updates.name?.trim() ?? ws.name;
  const slug = updates.slug?.trim() ? cleanSlug(updates.slug) : ws.slug;
  const status = updates.status ?? ws.status;
  const service_type = updates.service_type ?? ws.service_type;
  const visitors_count = updates.visitors_count !== undefined ? updates.visitors_count : ws.visitors_count;

  db.prepare(`
    UPDATE workspaces SET name = ?, slug = ?, status = ?, service_type = ?, visitors_count = ?, updated_at = ?
    WHERE id = ?
  `).run(name, slug, status, service_type, visitors_count, now, id);

  return db.prepare('SELECT * FROM workspaces WHERE id = ?').get(id) as WorkspaceRow | null;
}

export function adminDeleteWorkspace(id: string): boolean {
  const res = db.prepare('DELETE FROM workspaces WHERE id = ?').run(id);
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
  visitors_count?: number;
  form_started_count?: number;
  submitted_count?: number;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceSubmissionRow {
  id: string;
  workspace_id: string;
  data: string;
  status: 'submitted' | 'verified' | 'rejected' | string;
  payment_proof_url?: string | null;
  payment_email?: string | null;
  created_at: string;
}

export function getWorkspacesByOwner(owner_id: string): WorkspaceRow[] {
  return db.prepare('SELECT * FROM workspaces WHERE owner_id = ? ORDER BY created_at DESC').all(owner_id) as WorkspaceRow[];
}

export function getWorkspaceById(id: string, owner_id: string): WorkspaceRow | null {
  return db.prepare('SELECT * FROM workspaces WHERE id = ? AND owner_id = ?').get(id, owner_id) as WorkspaceRow | null;
}

export function getWorkspaceBySlug(slug: string): WorkspaceRow | null {
  return db.prepare('SELECT * FROM workspaces WHERE LOWER(slug) = LOWER(?) OR id = ?').get(slug, slug) as WorkspaceRow | null;
}

export function getPublishedWorkspaceBySlug(slug: string): WorkspaceRow | null {
  return db.prepare("SELECT * FROM workspaces WHERE LOWER(slug) = LOWER(?) AND status = 'published'").get(slug) as WorkspaceRow | null;
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

export function incrementWorkspaceStat(workspaceId: string, statType: 'visitors' | 'form_started' | 'submitted'): void {
  const column = statType === 'visitors' ? 'visitors_count' : statType === 'form_started' ? 'form_started_count' : 'submitted_count';
  try {
    db.prepare(`UPDATE workspaces SET ${column} = COALESCE(${column}, 0) + 1 WHERE id = ?`).run(workspaceId);
  } catch (err) {
    console.error('Failed to increment workspace stat:', err);
  }
}

export function getWorkspaceStats(workspaceId: string): { visitors: number; form_started: number; submitted: number } {
  try {
    const row = db.prepare('SELECT visitors_count, form_started_count, submitted_count FROM workspaces WHERE id = ?').get(workspaceId) as any;
    return {
      visitors: row?.visitors_count || 0,
      form_started: row?.form_started_count || 0,
      submitted: row?.submitted_count || 0,
    };
  } catch (err) {
    return { visitors: 0, form_started: 0, submitted: 0 };
  }
}

export function getWorkspaceSubmissions(workspaceId: string): WorkspaceSubmissionRow[] {
  try {
    return db.prepare('SELECT * FROM workspace_submissions WHERE workspace_id = ? ORDER BY created_at DESC').all(workspaceId) as WorkspaceSubmissionRow[];
  } catch (err) {
    console.error('Failed to get workspace submissions:', err);
    return [];
  }
}

export function createWorkspaceSubmission(params: {
  id?: string;
  workspace_id: string;
  data: Record<string, any>;
  status?: string;
  payment_proof_url?: string;
  payment_email?: string;
}): WorkspaceSubmissionRow {
  const id = params.id || `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();
  const dataStr = typeof params.data === 'string' ? params.data : JSON.stringify(params.data);
  const status = params.status || 'submitted';

  db.prepare(`
    INSERT INTO workspace_submissions (id, workspace_id, data, status, payment_proof_url, payment_email, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, params.workspace_id, dataStr, status, params.payment_proof_url || null, params.payment_email || null, now);

  incrementWorkspaceStat(params.workspace_id, 'submitted');

  return db.prepare('SELECT * FROM workspace_submissions WHERE id = ?').get(id) as WorkspaceSubmissionRow;
}

export function updateWorkspaceSubmissionStatus(submissionId: string, status: string): boolean {
  try {
    const res = db.prepare('UPDATE workspace_submissions SET status = ? WHERE id = ?').run(status, submissionId);
    return res.changes > 0;
  } catch {
    return false;
  }
}

export function deleteWorkspaceSubmission(submissionId: string): boolean {
  try {
    const res = db.prepare('DELETE FROM workspace_submissions WHERE id = ?').run(submissionId);
    return res.changes > 0;
  } catch {
    return false;
  }
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
