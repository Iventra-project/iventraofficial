import { useState } from 'react';
import Logo from './Logo.tsx';

interface AuthPageProps {
  onAuthSuccess: (token: string, user: AuthUser) => void;
  onBackToSite: () => void;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

type AuthMode = 'login' | 'register';

export default function AuthPage({ onAuthSuccess, onBackToSite }: AuthPageProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setError('');
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Client-side validation (server also validates)
    if (!email.trim()) return setError('Email wajib diisi.');
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

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Terjadi kesalahan. Coba lagi.');
        return;
      }

      onAuthSuccess(data.token, data.user);
    } catch {
      setError('Gagal terhubung ke server. Periksa koneksi internet Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5f2ff] via-[#fcf8ff] to-[#f0f4ff] flex flex-col items-center justify-center px-4 py-12">
      {/* Back to site */}
      <div className="w-full max-w-sm mb-6">
        <button
          type="button"
          onClick={onBackToSite}
          className="inline-flex items-center gap-1.5 text-sm text-[#757589] hover:text-[#0c1df3] transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          <span>Kembali ke Website</span>
        </button>
      </div>

      <div className="w-full max-w-sm">
        {/* Logo + Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Logo size="md" />
            <span className="text-2xl font-extrabold text-[#000cb8] tracking-tight">Iventra</span>
          </div>
          <p className="text-sm text-[#757589] text-center">
            {mode === 'login' ? 'Masuk ke akun Iventra Anda' : 'Buat akun Iventra gratis'}
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-3xl shadow-[0_20px_60px_-10px_rgba(12,29,243,0.12)] border border-[#efecff] p-7 sm:p-8">
          {/* Mode Tabs */}
          <div className="flex rounded-2xl bg-[#f5f2ff] p-1 mb-6">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-white shadow-sm text-[#0c1df3]'
                  : 'text-[#757589] hover:text-[#454557]'
              }`}
            >
              Masuk
            </button>
            <button
              type="button"
              onClick={() => switchMode('register')}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                mode === 'register'
                  ? 'bg-white shadow-sm text-[#0c1df3]'
                  : 'text-[#757589] hover:text-[#454557]'
              }`}
            >
              Daftar
            </button>
          </div>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            {/* Name field (register only) */}
            {mode === 'register' && (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="auth-name" className="text-xs font-bold text-[#454557] uppercase tracking-wide">
                  Nama Lengkap
                </label>
                <input
                  id="auth-name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama Anda"
                  className="w-full px-4 py-3 rounded-xl border border-[#e2e1f4] bg-[#fafafa] text-sm text-[#191930] placeholder-[#b8b7cc] focus:outline-none focus:ring-2 focus:ring-[#0c1df3] focus:border-transparent transition"
                  required
                />
              </div>
            )}

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="auth-email" className="text-xs font-bold text-[#454557] uppercase tracking-wide">
                Email
              </label>
              <input
                id="auth-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@contoh.com"
                className="w-full px-4 py-3 rounded-xl border border-[#e2e1f4] bg-[#fafafa] text-sm text-[#191930] placeholder-[#b8b7cc] focus:outline-none focus:ring-2 focus:ring-[#0c1df3] focus:border-transparent transition"
                required
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="auth-password" className="text-xs font-bold text-[#454557] uppercase tracking-wide">
                Password
              </label>
              <div className="relative">
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'register' ? 'Minimal 8 karakter' : '••••••••'}
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-[#e2e1f4] bg-[#fafafa] text-sm text-[#191930] placeholder-[#b8b7cc] focus:outline-none focus:ring-2 focus:ring-[#0c1df3] focus:border-transparent transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#b8b7cc] hover:text-[#454557] transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Confirm Password (register only) */}
            {mode === 'register' && (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="auth-confirm" className="text-xs font-bold text-[#454557] uppercase tracking-wide">
                  Konfirmasi Password
                </label>
                <input
                  id="auth-confirm"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password"
                  className="w-full px-4 py-3 rounded-xl border border-[#e2e1f4] bg-[#fafafa] text-sm text-[#191930] placeholder-[#b8b7cc] focus:outline-none focus:ring-2 focus:ring-[#0c1df3] focus:border-transparent transition"
                  required
                />
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">error</span>
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#0c1df3] to-[#3b47dc] text-white font-bold text-sm shadow-[0_8px_24px_-4px_rgba(12,29,243,0.4)] hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{mode === 'login' ? 'Memproses...' : 'Mendaftarkan...'}</span>
                </>
              ) : (
                <span>{mode === 'login' ? 'Masuk Dashboard' : 'Buat Akun'}</span>
              )}
            </button>

            {/* Footer note */}
            {mode === 'login' && (
              <p className="text-center text-xs text-[#757589] mt-1">
                Belum punya akun?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('register')}
                  className="text-[#0c1df3] font-bold hover:underline cursor-pointer"
                >
                  Daftar gratis
                </button>
              </p>
            )}
            {mode === 'register' && (
              <p className="text-center text-xs text-[#757589] mt-1">
                Sudah punya akun?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="text-[#0c1df3] font-bold hover:underline cursor-pointer"
                >
                  Masuk
                </button>
              </p>
            )}
          </form>
        </div>

        {/* Legal note */}
        <p className="text-center text-[11px] text-[#b8b7cc] mt-5 leading-relaxed">
          Dengan mendaftar, Anda menyetujui Syarat & Ketentuan dan Kebijakan Privasi Iventra.
        </p>
      </div>
    </div>
  );
}
