const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.resolve(__dirname, '..', 'iventra.db');
const db = new Database(dbPath);

console.log('Resetting dummy data...');

// 1. Delete all dummy records
db.exec('DELETE FROM projects;');
db.exec('DELETE FROM consultations;');
db.exec('DELETE FROM workspaces;');
db.exec('DELETE FROM workspace_submissions;');
db.exec('DELETE FROM pending_email_verifications;');
db.exec('DELETE FROM oauth_accounts;');
db.prepare('DELETE FROM users WHERE email != ?').run('eventra.work@gmail.com');

// 2. Ensure permanent admin account
const adminEmail = 'eventra.work@gmail.com';
const existing = db.prepare('SELECT * FROM users WHERE email = ?').get(adminEmail);
const passwordHash = bcrypt.hashSync('fromsijatosija', 12);
const now = new Date().toISOString();

if (!existing) {
  db.prepare(`
    INSERT INTO users (id, email, password_hash, name, plan, role, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'usr_admin_eventra',
    adminEmail,
    passwordHash,
    'Iventra Admin',
    'spark_pro',
    'admin',
    now,
    now
  );
  console.log('Permanent admin account created.');
} else {
  db.prepare(`
    UPDATE users
    SET password_hash = ?, role = 'admin', plan = 'spark_pro', updated_at = ?
    WHERE email = ?
  `).run(passwordHash, now, adminEmail);
  console.log('Permanent admin account updated.');
}

// 3. Print verification counts
const tables = [
  'users',
  'projects',
  'consultations',
  'workspaces',
  'workspace_submissions',
  'oauth_accounts',
  'pending_email_verifications'
];

for (const t of tables) {
  const c = db.prepare('SELECT COUNT(*) as cnt FROM ' + t).get();
  console.log(`${t}: ${c.cnt}`);
}

console.log('Users in DB:', db.prepare('SELECT id, email, name, role, plan FROM users').all());
