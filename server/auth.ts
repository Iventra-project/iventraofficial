import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { getUserByEmail, getUserById, createUser, updateUserProfile, updateUserPassword } from './db.ts';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'iventra-dev-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const BCRYPT_ROUNDS = 12;

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AuthPayload {
  userId: string;
  email: string;
}

// Extend Express Request to carry user info after auth middleware
declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

// ─── Middleware ───────────────────────────────────────────────────────────────

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token autentikasi diperlukan.' });
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthPayload;
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Token tidak valid atau sudah kadaluarsa. Silakan login kembali.' });
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sanitizeUser(user: { id: string; email: string; name: string; created_at: string }) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.created_at
  };
}

function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
}

// ─── Validation helpers ───────────────────────────────────────────────────────

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function isValidPassword(password: string): boolean {
  return typeof password === 'string' && password.length >= 8;
}

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * POST /api/auth/register
 * Body: { name, email, password }
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    // Server-side validation
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ error: 'Nama minimal 2 karakter.' });
    }
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ error: 'Format email tidak valid.' });
    }
    if (!isValidPassword(password)) {
      return res.status(400).json({ error: 'Password minimal 8 karakter.' });
    }

    // Check existing email
    const existing = getUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'Email sudah terdaftar. Silakan login.' });
    }

    const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const id = randomUUID();

    const user = createUser({ id, email, password_hash, name });
    const token = signToken({ userId: user.id, email: user.email });

    return res.status(201).json({
      token,
      user: sanitizeUser(user)
    });
  } catch (error: any) {
    console.error('[auth/register]', error);
    return res.status(500).json({ error: 'Terjadi kesalahan server. Coba lagi.' });
  }
});

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email dan password wajib diisi.' });
    }

    const user = getUserByEmail(email);
    if (!user) {
      // Generic message to avoid user enumeration
      return res.status(401).json({ error: 'Email atau password salah.' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Email atau password salah.' });
    }

    const token = signToken({ userId: user.id, email: user.email });

    return res.json({
      token,
      user: sanitizeUser(user)
    });
  } catch (error: any) {
    console.error('[auth/login]', error);
    return res.status(500).json({ error: 'Terjadi kesalahan server. Coba lagi.' });
  }
});

/**
 * GET /api/auth/me
 * Header: Authorization: Bearer <token>
 * Returns current user info
 */
router.get('/me', requireAuth, (req: Request, res: Response) => {
  try {
    const user = getUserById(req.user!.userId);
    if (!user) {
      return res.status(404).json({ error: 'Akun tidak ditemukan.' });
    }
    return res.json({ user: sanitizeUser(user) });
  } catch (error: any) {
    console.error('[auth/me]', error);
    return res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

/**
 * PUT /api/auth/profile
 * Header: Authorization: Bearer <token>
 * Body: { name }
 */
router.put('/profile', requireAuth, (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ error: 'Nama minimal 2 karakter.' });
    }

    const updated = updateUserProfile(req.user!.userId, { name });
    if (!updated) {
      return res.status(404).json({ error: 'Akun tidak ditemukan.' });
    }

    return res.json({ user: sanitizeUser(updated) });
  } catch (error: any) {
    console.error('[auth/profile]', error);
    return res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

/**
 * PUT /api/auth/password
 * Header: Authorization: Bearer <token>
 * Body: { currentPassword, newPassword }
 */
router.put('/password', requireAuth, async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Password saat ini dan password baru wajib diisi.' });
    }
    if (!isValidPassword(newPassword)) {
      return res.status(400).json({ error: 'Password baru minimal 8 karakter.' });
    }

    const user = getUserById(req.user!.userId);
    if (!user) {
      return res.status(404).json({ error: 'Akun tidak ditemukan.' });
    }

    const match = await bcrypt.compare(currentPassword, user.password_hash);
    if (!match) {
      return res.status(400).json({ error: 'Password saat ini tidak sesuai.' });
    }

    const password_hash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    updateUserPassword(req.user!.userId, password_hash);

    return res.json({ success: true, message: 'Password berhasil diperbarui.' });
  } catch (error: any) {
    console.error('[auth/password]', error);
    return res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

export default router;
