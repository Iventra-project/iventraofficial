import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { createHmac, randomBytes, randomUUID, timingSafeEqual } from 'crypto';
import {
  getUserByEmail,
  getUserById,
  createUser,
  getOrCreateOAuthUser,
  updateUserProfile,
  type OAuthProvider
} from './db.ts';

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

interface OAuthConfig {
  clientId: string;
  clientSecret: string;
}

interface OAuthIdentity {
  providerUserId: string;
  email: string;
  name: string;
}

function isOAuthProvider(value: string): value is OAuthProvider {
  return value === 'google' || value === 'facebook';
}

function getOAuthConfig(provider: OAuthProvider): OAuthConfig | null {
  const clientId = provider === 'google'
    ? process.env.GOOGLE_CLIENT_ID
    : process.env.FACEBOOK_APP_ID;
  const clientSecret = provider === 'google'
    ? process.env.GOOGLE_CLIENT_SECRET
    : process.env.FACEBOOK_APP_SECRET;

  if (!clientId?.trim() || !clientSecret?.trim()) return null;
  return { clientId: clientId.trim(), clientSecret: clientSecret.trim() };
}

function getAppOrigin(): string {
  const configuredUrl = process.env.APP_URL?.trim();
  if (!configuredUrl || configuredUrl === 'MY_APP_URL') {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('APP_URL must be configured for OAuth in production.');
    }
    return 'http://localhost:3000';
  }

  const url = new URL(configuredUrl);
  const isLocalHttp = url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname);
  if ((url.protocol !== 'https:' && !isLocalHttp) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('APP_URL must be a secure origin without a path, query, or fragment.');
  }

  return url.origin;
}

function getOAuthRedirectUri(provider: OAuthProvider, appOrigin: string): string {
  return `${appOrigin}/api/auth/oauth/${provider}/callback`;
}

function getStateCookieName(provider: OAuthProvider): string {
  return `iventra_oauth_state_${provider}`;
}

function getCookieValue(req: Request, name: string): string | undefined {
  const prefix = `${name}=`;
  return req.headers.cookie
    ?.split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(prefix))
    ?.slice(prefix.length);
}

function isMatchingState(expected: string | undefined, received: string | undefined): boolean {
  if (!expected || !received) return false;
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(received);
  if (expectedBuffer.length !== receivedBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, receivedBuffer);
}

function getOAuthFailureRedirect(appOrigin: string, message: string): string {
  return `${appOrigin}/#auth?oauth_error=${encodeURIComponent(message)}`;
}

async function fetchOAuthIdentity(
  provider: OAuthProvider,
  code: string,
  redirectUri: string,
  config: OAuthConfig
): Promise<OAuthIdentity> {
  if (provider === 'google') {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    });
    if (!tokenResponse.ok) throw new Error('Google token exchange failed.');

    const tokenData = await tokenResponse.json() as { access_token?: string };
    if (!tokenData.access_token) throw new Error('Google did not return an access token.');

    const profileResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    if (!profileResponse.ok) throw new Error('Google profile request failed.');

    const profile = await profileResponse.json() as {
      sub?: string;
      email?: string;
      email_verified?: boolean;
      name?: string;
    };
    if (!profile.sub || !profile.email || profile.email_verified !== true) {
      throw new Error('Google did not return a verified email address.');
    }

    return {
      providerUserId: profile.sub,
      email: profile.email,
      name: profile.name?.trim() || profile.email.split('@')[0]
    };
  }

  const tokenUrl = new URL('https://graph.facebook.com/v24.0/oauth/access_token');
  tokenUrl.search = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: redirectUri,
    code
  }).toString();
  const tokenResponse = await fetch(tokenUrl);
  if (!tokenResponse.ok) throw new Error('Facebook token exchange failed.');

  const tokenData = await tokenResponse.json() as { access_token?: string };
  if (!tokenData.access_token) throw new Error('Facebook did not return an access token.');

  const profileUrl = new URL('https://graph.facebook.com/v24.0/me');
  profileUrl.search = new URLSearchParams({
    fields: 'id,name,email',
    access_token: tokenData.access_token,
    appsecret_proof: createHmac('sha256', config.clientSecret).update(tokenData.access_token).digest('hex')
  }).toString();
  const profileResponse = await fetch(profileUrl);
  if (!profileResponse.ok) throw new Error('Facebook profile request failed.');

  const profile = await profileResponse.json() as {
    id?: string;
    email?: string;
    name?: string;
  };
  if (!profile.id || !profile.email) {
    throw new Error('Facebook did not return an email address. Allow email access and try again.');
  }

  return {
    providerUserId: profile.id,
    email: profile.email,
    name: profile.name?.trim() || profile.email.split('@')[0]
  };
}

// ─── Validation helpers ───────────────────────────────────────────────────────

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function isValidPassword(password: string): boolean {
  return typeof password === 'string' && password.length >= 8;
}

// ─── Routes ───────────────────────────────────────────────────────────────────

router.post('/oauth/:provider/start', (req: Request, res: Response) => {
  const providerName = req.params.provider;
  if (!isOAuthProvider(providerName)) {
    return res.status(404).json({ error: 'Metode login tidak tersedia.' });
  }

  const config = getOAuthConfig(providerName);
  if (!config) {
    const providerLabel = providerName === 'google' ? 'Google' : 'Facebook';
    return res.status(503).json({ error: `Login ${providerLabel} belum dikonfigurasi di server.` });
  }

  try {
    const appOrigin = getAppOrigin();
    const redirectUri = getOAuthRedirectUri(providerName, appOrigin);
    const state = randomBytes(32).toString('hex');
    const secureCookie = appOrigin.startsWith('https://');

    res.cookie(getStateCookieName(providerName), state, {
      httpOnly: true,
      secure: secureCookie,
      sameSite: 'lax',
      path: `/api/auth/oauth/${providerName}`,
      maxAge: 5 * 60 * 1000
    });

    const authorizationUrl = providerName === 'google'
      ? new URL('https://accounts.google.com/o/oauth2/v2/auth')
      : new URL('https://www.facebook.com/v24.0/dialog/oauth');
    authorizationUrl.search = new URLSearchParams(providerName === 'google'
      ? {
          client_id: config.clientId,
          redirect_uri: redirectUri,
          response_type: 'code',
          scope: 'openid email profile',
          state,
          prompt: 'select_account'
        }
      : {
          client_id: config.clientId,
          redirect_uri: redirectUri,
          response_type: 'code',
          scope: 'email,public_profile',
          state
        }).toString();

    return res.json({ url: authorizationUrl.toString() });
  } catch (error) {
    console.error('[auth/oauth/start]', providerName, error);
    return res.status(500).json({ error: 'Gagal memulai login. Periksa konfigurasi OAuth server.' });
  }
});

router.get('/oauth/:provider/callback', async (req: Request, res: Response) => {
  const providerName = req.params.provider;
  if (!isOAuthProvider(providerName)) {
    return res.status(404).send('Metode login tidak tersedia.');
  }

  const providerLabel = providerName === 'google' ? 'Google' : 'Facebook';
  let appOrigin: string;
  try {
    appOrigin = getAppOrigin();
  } catch (error) {
    console.error('[auth/oauth/callback] Invalid APP_URL configuration.', error);
    return res.status(500).send('Konfigurasi OAuth server belum lengkap.');
  }

  const cookieName = getStateCookieName(providerName);
  const expectedState = getCookieValue(req, cookieName);
  const receivedState = typeof req.query.state === 'string' ? req.query.state : undefined;
  const secureCookie = appOrigin.startsWith('https://');
  res.clearCookie(cookieName, {
    httpOnly: true,
    secure: secureCookie,
    sameSite: 'lax',
    path: `/api/auth/oauth/${providerName}`
  });

  if (!isMatchingState(expectedState, receivedState)) {
    return res.redirect(302, getOAuthFailureRedirect(appOrigin, `Sesi login ${providerLabel} tidak valid. Silakan coba lagi.`));
  }

  if (typeof req.query.error === 'string' || typeof req.query.code !== 'string') {
    return res.redirect(302, getOAuthFailureRedirect(appOrigin, `Login dengan ${providerLabel} dibatalkan atau gagal.`));
  }

  const config = getOAuthConfig(providerName);
  if (!config) {
    return res.redirect(302, getOAuthFailureRedirect(appOrigin, `Login ${providerLabel} belum dikonfigurasi di server.`));
  }

  try {
    const redirectUri = getOAuthRedirectUri(providerName, appOrigin);
    const identity = await fetchOAuthIdentity(providerName, req.query.code, redirectUri, config);
    const generatedPasswordHash = await bcrypt.hash(randomBytes(32).toString('hex'), BCRYPT_ROUNDS);
    const user = getOrCreateOAuthUser({
      provider: providerName,
      providerUserId: identity.providerUserId,
      email: identity.email,
      password_hash: generatedPasswordHash,
      name: identity.name
    });
    const token = signToken({ userId: user.id, email: user.email });

    return res.redirect(302, `${appOrigin}/#auth?oauth_token=${encodeURIComponent(token)}`);
  } catch (error) {
    console.error(`[auth/oauth/${providerName}/callback]`, error);
    const message = error instanceof Error && error.message.includes('did not return an email')
      ? `Akun ${providerLabel} tidak memberikan akses email. Izinkan email lalu coba lagi.`
      : error instanceof Error && error.message === 'OAuth email already in use.'
        ? 'Email ini sudah digunakan. Masuk dengan email dan password terlebih dahulu.'
        : `Login dengan ${providerLabel} gagal. Silakan coba lagi.`;
    return res.redirect(302, getOAuthFailureRedirect(appOrigin, message));
  }
});

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

export default router;
