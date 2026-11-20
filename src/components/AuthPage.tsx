import { useEffect, useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react';
import Logo from './Logo.tsx';

interface AuthPageProps {
  onAuthSuccess: (token: string, user: AuthUser) => void;
  onBackToSite: () => void;
  oauthError?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

type AuthMode = 'login' | 'register' | 'forgot';

export default function AuthPage({ onAuthSuccess, onBackToSite, oauthError }: AuthPageProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'facebook' | null>(null);
  const [verificationPending, setVerificationPending] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (oauthError) setError(oauthError);
  }, [oauthError]);

  useEffect(() => {
    if (!verificationPending || resendCountdown <= 0) return;
    const timer = window.setTimeout(() => {
      setResendCountdown((seconds) => Math.max(0, seconds - 1));
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [verificationPending, resendCountdown]);

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setError('');
    setNotice('');
    setPassword('');
    setConfirmPassword('');
    setVerificationPending(false);
    setVerificationCode('');
    setResendCountdown(0);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setNotice('');

    if (!email.trim()) return setError('Email wajib diisi.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return setError('Masukkan alamat email yang valid.');
    }

    if (mode === 'register' && verificationPending) {
      if (!/^\d{6}$/.test(verificationCode)) {
        return setError('Masukkan kode verifikasi 6 digit.');
      }

      setIsLoading(true);
      try {
        const response = await fetch('/api/auth/register/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: verificationEmail, code: verificationCode })
        });
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Kode verifikasi gagal diproses.');
          return;
        }

        setEmail(verificationEmail);
        setName('');
        setPassword('');
        setConfirmPassword('');
        setVerificationPending(false);
        setVerificationEmail('');
        setVerificationCode('');
        setResendCountdown(0);
        setMode('login');
        setNotice(data.message || 'Verifikasi berhasil. Silakan login dengan email dan password Anda.');
      } catch {
        setError('Gagal terhubung ke server. Periksa koneksi internet Anda.');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (mode === 'forgot') {
      setNotice('Layanan email pemulihan belum diaktifkan. Hubungi administrator Iventra untuk memulihkan akun.');
      return;
    }

    if (!password) return setError('Password wajib diisi.');

    if (mode === 'register') {
      if (!name.trim() || name.trim().length < 2) return setError('Nama minimal 2 karakter.');
      if (password.length < 8) return setError('Password minimal 8 karakter.');
      if (password !== confirmPassword) return setError('Konfirmasi password tidak cocok.');
    }

    setIsLoading(true);

    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body = mode === 'login'
        ? { email: email.trim(), password }
        : { name: name.trim(), email: email.trim(), password };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Terjadi kesalahan. Coba lagi.');
        return;
      }

      if (mode === 'register') {
        setVerificationPending(true);
        setVerificationEmail(data.email || email.trim());
        setVerificationCode('');
        setResendCountdown(data.resendAfterSeconds ?? 60);
        setNotice(`Kode verifikasi sudah dikirim ke ${data.email || email.trim()}. Masukkan kode 6 digit untuk menyelesaikan pendaftaran.`);
        return;
      }

      onAuthSuccess(data.token, data.user);
    } catch {
      setError('Gagal terhubung ke server. Periksa koneksi internet Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  const resendVerificationCode = async () => {
    if (resendCountdown > 0 || isResending) return;

    setError('');
    setNotice('');
    setIsResending(true);
    try {
      const response = await fetch('/api/auth/register/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: verificationEmail })
      });
      const data = await response.json();

      if (!response.ok) {
        if (data.retryAfterSeconds) setResendCountdown(data.retryAfterSeconds);
        setError(data.error || 'Kode verifikasi gagal dikirim ulang.');
        return;
      }

      setVerificationCode('');
      setResendCountdown(data.resendAfterSeconds ?? 60);
      setNotice(`Kode verifikasi baru sudah dikirim ke ${verificationEmail}.`);
    } catch {
      setError('Gagal terhubung ke server. Periksa koneksi internet Anda.');
    } finally {
      setIsResending(false);
    }
  };

  const startOAuth = async (provider: 'google' | 'facebook') => {
    setError('');
    setOauthLoading(provider);

    try {
      const response = await fetch(`/api/auth/oauth/${provider}/start`, { method: 'POST' });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || `Login dengan ${provider} belum tersedia.`);
        return;
      }

      window.location.assign(data.url);
    } catch {
      setError('Gagal memulai login. Periksa koneksi ke server lalu coba lagi.');
    } finally {
      setOauthLoading(null);
    }
  };

  const isRegister = mode === 'register';
  const isForgot = mode === 'forgot';
  const isVerifyingRegistration = isRegister && verificationPending;

  return (
    <main className="auth-screen">
      <section className="auth-visual" aria-label="Tentang platform Iventra">
        <button type="button" onClick={onBackToSite} className="auth-visual-back">
          <ArrowLeft size={17} aria-hidden="true" />
          Kembali ke website
        </button>

        <div className="auth-visual-content">
          <h1>Manage Event,<br />Make Moments</h1>

          <div className="auth-preview" aria-hidden="true">
            <div className="auth-preview-top">
              <span className="auth-preview-dot" />
              <span className="auth-preview-dot" />
              <span className="auth-preview-dot" />
              <span className="auth-preview-label">EVENT DASHBOARD</span>
            </div>
            <div className="auth-preview-body">
              <div className="auth-preview-mark">I</div>
              <div className="auth-preview-copy">
                <span className="auth-preview-eyebrow">EVENT BERIKUTNYA</span>
                <strong>Semua persiapan, lebih terarah.</strong>
                <span className="auth-preview-line" />
                <span className="auth-preview-line auth-preview-line-short" />
              </div>
              <div className="auth-preview-check">✓</div>
            </div>
          </div>
        </div>

        <span className="auth-visual-footer">IVENTRA · EVENT PLATFORM</span>
      </section>

      <section className="auth-main">
        <button type="button" onClick={onBackToSite} className="auth-mobile-back">
          <ArrowLeft size={17} aria-hidden="true" />
          Kembali
        </button>

        <div className="auth-content">
          <div className="auth-brand">
            <Logo size="sm" />
            <span>IVENTRA</span>
          </div>

          <header className="auth-heading">
            <h2>
              {isForgot
                ? 'Lupa kata sandi?'
                : isVerifyingRegistration
                  ? 'Verifikasi email'
                  : isRegister
                    ? 'Buat akun Iventra'
                    : 'Selamat datang kembali'}
            </h2>
            <p>
              {isForgot
                ? 'Masukkan email akun Anda untuk memulai pemulihan.'
                : isVerifyingRegistration
                  ? 'Masukkan kode 6 digit yang kami kirim untuk menyelesaikan pendaftaran.'
                  : isRegister
                  ? 'Daftar untuk mulai mengelola event Anda.'
                  : 'Masuk untuk melanjutkan ke dashboard Iventra.'}
            </p>
          </header>

          {!isForgot && !verificationPending && (
            <div className="auth-social-section">
              <div className="auth-social-buttons">
                <button
                  type="button"
                  className="auth-social-button"
                  onClick={() => startOAuth('google')}
                  disabled={oauthLoading !== null}
                >
                  <img src="/assets/auth/google.svg" alt="" aria-hidden="true" />
                  <span>{oauthLoading === 'google' ? 'Menghubungkan...' : 'Google'}</span>
                </button>
                <button
                  type="button"
                  className="auth-social-button"
                  onClick={() => startOAuth('facebook')}
                  disabled={oauthLoading !== null}
                >
                  <img src="/assets/taste/icons/demo/facebook.svg" alt="" aria-hidden="true" />
                  <span>{oauthLoading === 'facebook' ? 'Menghubungkan...' : 'Facebook'}</span>
                </button>
              </div>
              <div className="auth-divider"><span>atau dengan email</span></div>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="auth-form">
            {isRegister && !verificationPending && (
              <div className="auth-field">
                <label htmlFor="auth-name">Nama lengkap</label>
                <input
                  id="auth-name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Nama Anda"
                  required
                />
              </div>
            )}

            <div className="auth-field">
              <label htmlFor="auth-email">{verificationPending ? 'Kode dikirim ke alamat email' : 'Alamat email'}</label>
              <div className="auth-input-wrap">
                <Mail className="auth-input-icon" size={18} aria-hidden="true" />
                <input
                  id="auth-email"
                  type="email"
                  autoComplete="email"
                  value={verificationPending ? verificationEmail : email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="nama@email.com"
                  readOnly={verificationPending}
                  required
                />
              </div>
            </div>

            {isVerifyingRegistration && (
              <div className="auth-field">
                <label htmlFor="auth-verification-code">Kode verifikasi</label>
                <input
                  id="auth-verification-code"
                  type="text"
                  className="auth-code-input"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Masukkan 6 digit kode"
                  aria-describedby="auth-verification-help"
                  required
                />
                <span id="auth-verification-help" className="auth-field-help">
                  Periksa kotak masuk atau folder spam. Kode berlaku selama 10 menit.
                </span>
              </div>
            )}

            {!isForgot && !verificationPending && (
              <div className="auth-field">
                <div className="auth-label-row">
                  <label htmlFor="auth-password">Password</label>
                  {!isRegister && (
                    <button type="button" className="auth-text-button" onClick={() => switchMode('forgot')}>
                      Lupa password?
                    </button>
                  )}
                </div>
                <div className="auth-input-wrap">
                  <LockKeyhole className="auth-input-icon" size={18} aria-hidden="true" />
                  <input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={isRegister ? 'new-password' : 'current-password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder={isRegister ? 'Minimal 8 karakter' : 'Masukkan password'}
                    required
                  />
                  <button
                    type="button"
                    className="auth-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            )}

            {isRegister && !verificationPending && (
              <div className="auth-field">
                <label htmlFor="auth-confirm">Konfirmasi password</label>
                <div className="auth-input-wrap">
                  <LockKeyhole className="auth-input-icon" size={18} aria-hidden="true" />
                  <input
                    id="auth-confirm"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Ulangi password"
                    required
                  />
                </div>
              </div>
            )}

            {error && <p className="auth-message auth-message-error" role="alert">{error}</p>}
            {notice && <p className="auth-message auth-message-notice" role="status">{notice}</p>}

            <button type="submit" className="auth-submit" disabled={isLoading}>
              {isLoading
                ? 'Memproses...'
                : isVerifyingRegistration
                  ? 'Verifikasi email'
                  : isForgot
                    ? 'Kirim instruksi pemulihan'
                    : isRegister
                      ? 'Kirim kode verifikasi'
                      : 'Masuk ke dashboard'}
              {!isLoading && <ArrowRight size={18} aria-hidden="true" />}
            </button>

            {isVerifyingRegistration && (
              <div className="auth-verification-actions">
                <span>Belum menerima kode?</span>
                <button
                  type="button"
                  className="auth-text-button"
                  onClick={resendVerificationCode}
                  disabled={isResending || resendCountdown > 0}
                >
                  {isResending
                    ? 'Mengirim ulang...'
                    : resendCountdown > 0
                      ? `Kirim ulang dalam ${resendCountdown} detik`
                      : 'Kirim ulang kode'}
                </button>
              </div>
            )}
          </form>

          <p className="auth-switch">
            {isForgot ? (
              <>
                Ingat password Anda?{' '}
                <button type="button" onClick={() => switchMode('login')}>Kembali masuk</button>
              </>
            ) : isVerifyingRegistration ? (
              <>
                Salah email atau ingin mengubah data?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setVerificationPending(false);
                    setVerificationCode('');
                    setError('');
                    setNotice('');
                  }}
                >
                  Kembali ke pendaftaran
                </button>
              </>
            ) : isRegister ? (
              <>
                Sudah punya akun?{' '}
                <button type="button" onClick={() => switchMode('login')}>Masuk</button>
              </>
            ) : (
              <>
                Belum punya akun?{' '}
                <button type="button" onClick={() => switchMode('register')}>Daftar sekarang</button>
              </>
            )}
          </p>

          <p className="auth-security">
            <LockKeyhole size={14} aria-hidden="true" />
            Akun Anda dilindungi dengan aman
          </p>
        </div>
      </section>
    </main>
  );
}
