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
  `);

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

// Auto init on import
initDb();
