import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { createHmac, randomBytes, randomInt, randomUUID, timingSafeEqual } from 'crypto';
import {
  getUserByEmail,
  getUserById,
  createUser,
  cleanupExpiredEmailVerificationWindows,
  deletePendingEmailVerification,
  getPendingEmailVerification,
  getOrCreateOAuthUser,
  savePendingEmailVerification,
  updateUserProfile,
  updateUserPassword,
  verifyPendingEmailAndCreateUser,
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

const EMAIL_CODE_TTL_MS = 10 * 60 * 1000;
const EMAIL_CODE_RESEND_DELAY_MS = 60 * 1000;
const EMAIL_CODE_WINDOW_MS = 60 * 60 * 1000;
const EMAIL_CODE_MAX_SENDS_PER_WINDOW = 5;
const EMAIL_CODE_MAX_ATTEMPTS = 5;

class EmailDeliveryError extends Error {}

function getEmailOtpSecret(): string | null {
  const secret = process.env.EMAIL_OTP_SECRET?.trim();
  return secret && secret.length >= 32 ? secret : null;
}

type EmailSender = { name: string; email: string };

function parseEmailSender(value: string): EmailSender | null {
  const match = /^"?([^"<]+?)"?\s*<([^<>]+)>$/.exec(value.trim());
  if (!match) return null;

  const name = match[1].trim();
  const email = match[2].trim();
  if (!name || !isValidEmail(email)) return null;
  return { name, email };
}

function getEmailVerificationConfig(): { apiKey: string; sender: EmailSender; secret: string } | null {
  const apiKey = process.env.BREVO_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  const sender = from ? parseEmailSender(from) : null;
  const secret = getEmailOtpSecret();
  if (!apiKey || !sender || !secret) return null;
  return { apiKey, sender, secret };
}

function hashEmailVerificationCode(email: string, code: string, secret: string): string {
  return createHmac('sha256', secret)
    .update(`${email.toLowerCase().trim()}:${code}`)
    .digest('hex');
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]!);
}

async function sendEmailVerificationCode(
  email: string,
  name: string,
  code: string,
  config: { apiKey: string; sender: EmailSender }
): Promise<void> {
  const safeName = escapeHtml(name);
  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': config.apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({
        sender: config.sender,
        to: [{ email }],
        subject: 'Kode verifikasi akun Iventra',
        htmlContent: `<div style="font-family:Arial,sans-serif;color:#14213d;line-height:1.6"><h2>Verifikasi email Iventra</h2><p>Halo ${safeName}, gunakan kode berikut untuk menyelesaikan pendaftaran:</p><p style="font-size:32px;font-weight:700;letter-spacing:8px;color:#2456df">${code}</p><p>Kode berlaku selama 10 menit. Jika kamu tidak meminta kode ini, abaikan email ini.</p></div>`
      }),
      signal: AbortSignal.timeout(10_000)
    });

    if (!response.ok) {
      console.error('[auth/register/email] Brevo rejected the email request.', response.status);
      throw new EmailDeliveryError('Email provider rejected the request.');
    }
  } catch (error) {
    if (error instanceof EmailDeliveryError) throw error;
    console.error('[auth/register/email] Brevo request failed.', error);
    throw new EmailDeliveryError('Email provider request failed.');
  }
}

function getEmailCodeRateLimit(
  pending: NonNullable<ReturnType<typeof getPendingEmailVerification>>,
  now: number
): { retryAfterSeconds: number; message: string } | null {
  if (pending.resend_after > now) {
    return {
      retryAfterSeconds: Math.ceil((pending.resend_after - now) / 1000),
      message: 'Tunggu sebelum meminta kode baru.'
    };
  }

  if (now - pending.window_started_at < EMAIL_CODE_WINDOW_MS &&
      pending.sends_in_window >= EMAIL_CODE_MAX_SENDS_PER_WINDOW) {
    return {
      retryAfterSeconds: Math.ceil((pending.window_started_at + EMAIL_CODE_WINDOW_MS - now) / 1000),
      message: 'Batas pengiriman kode tercapai. Coba lagi nanti.'
    };
  }

  return null;
}

async function issueEmailVerificationCode(input: {
  email: string;
  name: string;
  passwordHash: string;
  config: { apiKey: string; sender: EmailSender; secret: string };
  pending: ReturnType<typeof getPendingEmailVerification>;
}): Promise<{ retryAfterSeconds: number }> {
  const now = Date.now();
  const currentPending = input.pending;
  const windowExpired = !currentPending || now - currentPending.window_started_at >= EMAIL_CODE_WINDOW_MS;
  const sendsInWindow = windowExpired ? 1 : currentPending.sends_in_window + 1;
  const windowStartedAt = windowExpired ? now : currentPending.window_started_at;
  const code = String(randomInt(100_000, 1_000_000));
  const email = input.email.toLowerCase().trim();

  savePendingEmailVerification({
    email,
    name: input.name,
    password_hash: input.passwordHash,
    code_hash: hashEmailVerificationCode(email, code, input.config.secret),
    expires_at: now + EMAIL_CODE_TTL_MS,
    attempts: 0,
    sends_in_window: sendsInWindow,
    window_started_at: windowStartedAt,
    resend_after: now + EMAIL_CODE_RESEND_DELAY_MS
  });

  await sendEmailVerificationCode(email, input.name, code, input.config);

  return { retryAfterSeconds: Math.ceil(EMAIL_CODE_RESEND_DELAY_MS / 1000) };
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

    const normalizedEmail = email.trim().toLowerCase();
    if (getUserByEmail(normalizedEmail)) {
      return res.status(409).json({ error: 'Email sudah terdaftar. Silakan login.' });
    }

    const config = getEmailVerificationConfig();
    if (!config) {
      return res.status(503).json({
        error: 'Verifikasi email belum dikonfigurasi. Lengkapi BREVO_API_KEY, EMAIL_FROM, dan EMAIL_OTP_SECRET.'
      });
    }

    const now = Date.now();
    cleanupExpiredEmailVerificationWindows(now);
    const pending = getPendingEmailVerification(normalizedEmail);
    if (pending) {
      const rateLimit = getEmailCodeRateLimit(pending, now);
      if (rateLimit) {
        res.setHeader('Retry-After', String(rateLimit.retryAfterSeconds));
        return res.status(429).json(rateLimit);
      }
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const result = await issueEmailVerificationCode({
      email: normalizedEmail,
      name: name.trim(),
      passwordHash,
      config,
      pending
    });

    return res.status(202).json({
      verificationRequired: true,
      email: normalizedEmail,
      expiresInSeconds: Math.floor(EMAIL_CODE_TTL_MS / 1000),
      resendAfterSeconds: result.retryAfterSeconds
    });
  } catch (error: any) {
    console.error('[auth/register]', error);
    const isDeliveryError = error instanceof EmailDeliveryError;
    return res.status(isDeliveryError ? 502 : 500).json({
      error: isDeliveryError
        ? 'Kode verifikasi gagal dikirim. Periksa konfigurasi email lalu coba lagi.'
        : 'Terjadi kesalahan server. Coba lagi.'
    });
  }
});

router.post('/register/resend', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (typeof email !== 'string' || !isValidEmail(email)) {
      return res.status(400).json({ error: 'Format email tidak valid.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const config = getEmailVerificationConfig();
    if (!config) {
      return res.status(503).json({
        error: 'Verifikasi email belum dikonfigurasi. Lengkapi BREVO_API_KEY, EMAIL_FROM, dan EMAIL_OTP_SECRET.'
      });
    }

    const now = Date.now();
    cleanupExpiredEmailVerificationWindows(now);
    const pending = getPendingEmailVerification(normalizedEmail);
    if (!pending) {
      return res.status(404).json({ error: 'Sesi verifikasi tidak ditemukan atau sudah kedaluwarsa. Silakan daftar kembali.' });
    }

    if (getUserByEmail(normalizedEmail)) {
      deletePendingEmailVerification(normalizedEmail);
      return res.status(409).json({ error: 'Email sudah terdaftar. Silakan login.' });
    }

    const rateLimit = getEmailCodeRateLimit(pending, now);
    if (rateLimit) {
      res.setHeader('Retry-After', String(rateLimit.retryAfterSeconds));
      return res.status(429).json(rateLimit);
    }

    const result = await issueEmailVerificationCode({
      email: normalizedEmail,
      name: pending.name,
      passwordHash: pending.password_hash,
      config,
      pending
    });

    return res.json({
      verificationRequired: true,
      email: normalizedEmail,
      expiresInSeconds: Math.floor(EMAIL_CODE_TTL_MS / 1000),
      resendAfterSeconds: result.retryAfterSeconds
    });
  } catch (error) {
    console.error('[auth/register/resend]', error);
    const isDeliveryError = error instanceof EmailDeliveryError;
    return res.status(isDeliveryError ? 502 : 500).json({
      error: isDeliveryError
        ? 'Kode verifikasi gagal dikirim. Periksa konfigurasi email lalu coba lagi.'
        : 'Terjadi kesalahan server. Coba lagi.'
    });
  }
});

router.post('/register/verify', (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;
    if (typeof email !== 'string' || !isValidEmail(email)) {
      return res.status(400).json({ error: 'Format email tidak valid.' });
    }
    if (typeof code !== 'string' || !/^\d{6}$/.test(code)) {
      return res.status(400).json({ error: 'Masukkan kode verifikasi 6 digit.' });
    }

    const secret = getEmailOtpSecret();
    if (!secret) {
      return res.status(503).json({ error: 'Verifikasi email belum dikonfigurasi di server.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const result = verifyPendingEmailAndCreateUser(
      normalizedEmail,
      hashEmailVerificationCode(normalizedEmail, code, secret),
      Date.now(),
      EMAIL_CODE_MAX_ATTEMPTS
    );

    if (result.status !== 'verified') {
      const errors = {
        invalid: { status: 400, message: 'Kode verifikasi salah.' },
        locked: { status: 429, message: 'Batas percobaan kode tercapai. Minta kode baru untuk melanjutkan.' },
        expired: { status: 400, message: 'Kode verifikasi sudah kedaluwarsa. Daftar kembali untuk menerima kode baru.' },
        missing: { status: 404, message: 'Sesi verifikasi tidak ditemukan. Silakan daftar kembali.' },
        already_registered: { status: 409, message: 'Email sudah terdaftar. Silakan login.' }
      } as const;
      const error = errors[result.status];
      return res.status(error.status).json({ error: error.message });
    }

    return res.json({
      verified: true,
      message: 'Verifikasi berhasil. Silakan login dengan email dan password Anda.'
    });
  } catch (error) {
    console.error('[auth/register/verify]', error);
    return res.status(500).json({ error: 'Verifikasi gagal diproses. Coba lagi.' });
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
