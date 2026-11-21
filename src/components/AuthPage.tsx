import { useEffect, useState, useRef, type FormEvent, type ClipboardEvent, type KeyboardEvent } from 'react';
import { ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole, Mail, Check, Star, Trophy } from 'lucide-react';
import Logo from './Logo.tsx';

interface AuthPageProps {
  onAuthSuccess: (token: string, user: AuthUser, redirectHash?: string) => void;
  onBackToSite: () => void;
  oauthError?: string;
  initialOnboardingUser?: { token: string; user: AuthUser } | null;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  age?: number | null;
  gender?: string | null;
  role?: string;
  plan?: string;
  onboarding_role?: string | null;
  onboarding_purpose?: string | null;
  onboarding_source?: string | null;
  createdAt: string;
}

type AuthMode = 'login' | 'register' | 'forgot';

const ROLE_OPTIONS = [
  'Mahasiswa',
  'Pelajar',
  'Dosen / Tenaga Pendidik',
  'Event Organizer',
  'Profesional / Karyawan',
  'Pemilik Bisnis',
  'Lainnya'
];

const PURPOSE_OPTIONS = [
  'Seminar dan Webinar',
  'Lomba dan Kompetisi',
  'Workshop dan Pelatihan',
  'Konferensi dan Kongres',
  'Festival dan Pameran',
  'Kegiatan Organisasi',
  'Lainnya'
];

const SOURCE_OPTIONS = [
  'Instagram',
  'TikTok',
  'YouTube',
  'Google Search',
  'Website / Blog',
  'Rekomendasi teman',
  'Event atau pameran',
  'Iklan digital'
];

export default function AuthPage({
  onAuthSuccess,
  onBackToSite,
  oauthError,
  initialOnboardingUser
}: AuthPageProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [username, setUsername] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Laki-laki');
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
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [slideKey, setSlideKey] = useState(0);
  const [slideDirection, setSlideDirection] = useState<'slide-left' | 'slide-right' | null>(null);

  // Personalized Setup state
  const [isOnboarding, setIsOnboarding] = useState(
    () => !!initialOnboardingUser && !initialOnboardingUser.user.onboarding_role
  );
  const [onboardingStep, setOnboardingStep] = useState<1 | 2 | 3 | 4>(1);
  const [authedToken, setAuthedToken] = useState<string | null>(
    initialOnboardingUser?.token || null
  );
  const [authedUser, setAuthedUser] = useState<AuthUser | null>(
    initialOnboardingUser?.user || null
  );
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedPurpose, setSelectedPurpose] = useState<string>('');
  const [selectedSource, setSelectedSource] = useState<string>('');
  const [chosenPlan, setChosenPlan] = useState<'spark' | 'pro' | 'expert'>('spark');

  useEffect(() => {
    if (initialOnboardingUser && !initialOnboardingUser.user.onboarding_role) {
      setAuthedToken(initialOnboardingUser.token);
      setAuthedUser(initialOnboardingUser.user);
      setIsOnboarding(true);
      setOnboardingStep(1);
    }
  }, [initialOnboardingUser]);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

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

  useEffect(() => {
    if (verificationPending) {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 50);
    }
  }, [verificationPending]);

  const switchMode = (newMode: AuthMode) => {
    if (newMode === mode) return;
    if (newMode === 'register') {
      setSlideDirection('slide-left');
    } else {
      setSlideDirection('slide-right');
    }
    setSlideKey((prev) => prev + 1);
    setMode(newMode);
    setError('');
    setNotice('');
    setUsername('');
    setAge('');
    setGender('Laki-laki');
    setPassword('');
    setConfirmPassword('');
    setVerificationPending(false);
    setOtp(['', '', '', '', '', '']);
    setResendCountdown(0);
    setIsOnboarding(false);
  };

  const handleOtpChange = (index: number, value: string) => {
    const cleanDigits = value.replace(/\D/g, '');
    if (!cleanDigits) {
      const newOtp = [...otp];
      newOtp[index] = '';
      setOtp(newOtp);
      return;
    }

    if (cleanDigits.length > 1) {
      const newOtp = [...otp];
      for (let i = 0; i < cleanDigits.length && index + i < 6; i++) {
        newOtp[index + i] = cleanDigits[i];
      }
      setOtp(newOtp);
      const targetIndex = Math.min(index + cleanDigits.length, 5);
      inputRefs.current[targetIndex]?.focus();
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = cleanDigits;
    setOtp(newOtp);

    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
      } else {
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e: ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const newOtp = ['', '', '', '', '', ''];
    for (let i = 0; i < pasted.length && i < 6; i++) {
      newOtp[i] = pasted[i];
    }
    setOtp(newOtp);
    const targetIndex = Math.min(pasted.length, 5);
    inputRefs.current[targetIndex]?.focus();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setNotice('');

    if (mode === 'register' && verificationPending) {
      const verificationCode = otp.join('');
      if (!/^\d{6}$/.test(verificationCode)) {
        return setError('Masukkan 6 digit kode verifikasi.');
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
          setError(data.error || 'Kode verifikasi tidak valid.');
          return;
        }

        // Successfully verified: start Personalized Setup
        setVerificationPending(false);
        setAuthedToken(data.token);
        setAuthedUser(data.user);
        setIsOnboarding(true);
        setOnboardingStep(1);
        setSlideDirection('slide-left');
        setSlideKey((prev) => prev + 1);
        setError('');
        setNotice('');
      } catch {
        setError('Gagal terhubung ke server. Periksa koneksi internet Anda.');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (!email.trim()) return setError('Email wajib diisi.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return setError('Masukkan alamat email yang valid.');
    }

    if (mode === 'forgot') {
      setNotice('Layanan email pemulihan belum diaktifkan. Hubungi administrator Iventra untuk memulihkan akun.');
      return;
    }

    if (!password) return setError('Password wajib diisi.');

    if (mode === 'register') {
      if (!username.trim() || username.trim().length < 2) return setError('Username minimal 2 karakter.');
      const parsedAge = parseInt(age, 10);
      if (!age || isNaN(parsedAge) || parsedAge < 10 || parsedAge > 120) return setError('Masukkan umur yang valid (10-120 tahun).');
      if (!gender) return setError('Pilih jenis kelamin.');
      if (password.length < 8) return setError('Password minimal 8 karakter.');
      if (password !== confirmPassword) return setError('Konfirmasi password tidak cocok.');
    }

    setIsLoading(true);

    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body = mode === 'login'
        ? { email: email.trim(), password }
        : {
            username: username.trim(),
            name: username.trim(),
            age: parseInt(age, 10) || null,
            gender,
            email: email.trim(),
            password
          };

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
        setOtp(['', '', '', '', '', '']);
        setResendCountdown(300); // 5 menit
        return;
      }

      // If user hasn't completed personalized setup yet, direct to onboarding
      if (!data.user.onboarding_role) {
        setAuthedToken(data.token);
        setAuthedUser(data.user);
        setIsOnboarding(true);
        setOnboardingStep(1);
        setSlideDirection('slide-left');
        setSlideKey((prev) => prev + 1);
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
        setError(data.error || 'Gagal mengirim ulang kode.');
        return;
      }

      setOtp(['', '', '', '', '', '']);
      setResendCountdown(300); // 5 menit
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

  const handleNextOnboarding = () => {
    if (onboardingStep === 1 && selectedRole) {
      setSlideDirection('slide-left');
      setSlideKey((prev) => prev + 1);
      setOnboardingStep(2);
    } else if (onboardingStep === 2 && selectedPurpose) {
      setSlideDirection('slide-left');
      setSlideKey((prev) => prev + 1);
      setOnboardingStep(3);
    } else if (onboardingStep === 3 && selectedSource) {
      setSlideDirection('slide-left');
      setSlideKey((prev) => prev + 1);
      setOnboardingStep(4);
    }
  };

  const handleBackOnboarding = () => {
    if (onboardingStep === 2) {
      setSlideDirection('slide-right');
      setSlideKey((prev) => prev + 1);
      setOnboardingStep(1);
    } else if (onboardingStep === 3) {
      setSlideDirection('slide-right');
      setSlideKey((prev) => prev + 1);
      setOnboardingStep(2);
    } else if (onboardingStep === 4) {
      setSlideDirection('slide-right');
      setSlideKey((prev) => prev + 1);
      setOnboardingStep(3);
    }
  };

  const handleFinishOnboarding = async () => {
    if (!authedToken || !authedUser) return;

    try {
      await fetch('/api/auth/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authedToken}`
        },
        body: JSON.stringify({
          role: selectedRole,
          purpose: selectedPurpose,
          source: selectedSource,
          selectedPlan: chosenPlan === 'pro' ? 'spark_pro' : 'spark'
        })
      });
    } catch (e) {
      console.error('Failed to save onboarding:', e);
    }

    const updatedUser: AuthUser = {
      ...authedUser,
      onboarding_role: selectedRole,
      onboarding_purpose: selectedPurpose,
      onboarding_source: selectedSource,
      plan: chosenPlan === 'pro' ? 'spark_pro' : authedUser.plan || 'spark'
    };

    if (chosenPlan === 'spark') {
      onAuthSuccess(authedToken, updatedUser, '#dashboard');
    } else if (chosenPlan === 'pro') {
      onAuthSuccess(authedToken, updatedUser, '#spark-pro-checkout');
    } else {
      onAuthSuccess(authedToken, updatedUser, '#expert-consultation');
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

        <div className={`auth-content ${isOnboarding && onboardingStep === 4 ? '!max-w-[780px]' : ''}`}>
          <div className="auth-brand">
            <Logo size="sm" />
            <span>IVENTRA</span>
          </div>

          {!isForgot && !verificationPending && !isOnboarding && (
            <div className="mb-6 p-1 bg-slate-100/90 rounded-xl grid grid-cols-2 gap-1 border border-slate-200/80">
              <button
                type="button"
                onClick={() => switchMode('login')}
                className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  !isRegister
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Masuk
              </button>
              <button
                type="button"
                onClick={() => switchMode('register')}
                className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  isRegister
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Daftar
              </button>
            </div>
          )}

          <div
            key={slideKey}
            className={
              slideDirection === 'slide-left'
                ? 'auth-slide-in-right'
                : slideDirection === 'slide-right'
                ? 'auth-slide-in-left'
                : ''
            }
          >
            {isOnboarding ? (
              <div className="w-full">
                {/* Onboarding Header */}
                <header className="auth-heading mb-4 text-left">
                  <div className="mb-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-bold tracking-wide">
                      Personalized Setup {onboardingStep <= 3 ? `· ${onboardingStep} dari 3` : '· Paket'}
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900">
                    {onboardingStep <= 3 ? 'Mari mengenal Anda' : 'Pilih Plan Anda'}
                  </h2>
                  <p className="text-sm font-medium text-slate-600 mt-1">
                    {onboardingStep === 1
                      ? 'Apa peran Anda saat ini?'
                      : onboardingStep === 2
                      ? 'Untuk kebutuhan apa Anda menggunakan Iventra?'
                      : onboardingStep === 3
                      ? 'Dari mana Anda mengetahui Iventra?'
                      : 'Pilih paket yang sesuai untuk kebutuhan event Anda.'}
                  </p>
                </header>

                {/* Step 1: Role */}
                {onboardingStep === 1 && (
                  <div className="space-y-2 my-5">
                    {ROLE_OPTIONS.map((opt) => {
                      const isSelected = selectedRole === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setSelectedRole(opt)}
                          className={`w-full py-3 px-4 rounded-xl border text-left text-sm font-semibold transition-all flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50/60 text-blue-700 shadow-2xs ring-1 ring-blue-500/25'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50/60'
                          }`}
                        >
                          <span>{opt}</span>
                          <span
                            className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                              isSelected
                                ? 'border-blue-600 bg-blue-600 text-white'
                                : 'border-slate-300 bg-transparent'
                            }`}
                          >
                            {isSelected && <Check size={10} strokeWidth={3} />}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Step 2: Purpose */}
                {onboardingStep === 2 && (
                  <div className="space-y-2 my-5">
                    {PURPOSE_OPTIONS.map((opt) => {
                      const isSelected = selectedPurpose === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setSelectedPurpose(opt)}
                          className={`w-full py-3 px-4 rounded-xl border text-left text-sm font-semibold transition-all flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50/60 text-blue-700 shadow-2xs ring-1 ring-blue-500/25'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50/60'
                          }`}
                        >
                          <span>{opt}</span>
                          <span
                            className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                              isSelected
                                ? 'border-blue-600 bg-blue-600 text-white'
                                : 'border-slate-300 bg-transparent'
                            }`}
                          >
                            {isSelected && <Check size={10} strokeWidth={3} />}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Step 3: Source */}
                {onboardingStep === 3 && (
                  <div className="space-y-2 my-5">
                    {SOURCE_OPTIONS.map((opt) => {
                      const isSelected = selectedSource === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setSelectedSource(opt)}
                          className={`w-full py-3 px-4 rounded-xl border text-left text-sm font-semibold transition-all flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50/60 text-blue-700 shadow-2xs ring-1 ring-blue-500/25'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50/60'
                          }`}
                        >
                          <span>{opt}</span>
                          <span
                            className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                              isSelected
                                ? 'border-blue-600 bg-blue-600 text-white'
                                : 'border-slate-300 bg-transparent'
                            }`}
                          >
                            {isSelected && <Check size={10} strokeWidth={3} />}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Step 4: Plan Selection */}
                {onboardingStep === 4 && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-5 items-stretch">
                    {/* Card 1: Iventra Spark */}
                    <div
                      onClick={() => setChosenPlan('spark')}
                      className={`relative flex flex-col p-4 rounded-2xl border transition-all cursor-pointer text-left ${
                        chosenPlan === 'spark'
                          ? 'border-2 border-blue-600 bg-blue-50/25 shadow-md ring-2 ring-blue-500/20'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Free</span>
                        <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          chosenPlan === 'spark' ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300'
                        }`}>
                          {chosenPlan === 'spark' && <Check size={10} strokeWidth={3} />}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900">Iventra Spark</h3>
                      <div className="my-1.5 flex items-baseline gap-1">
                        <span className="text-xl font-display font-extrabold text-slate-900">Gratis</span>
                      </div>
                      <ul className="mt-3 space-y-1.5 text-xs text-slate-600 flex-1">
                        <li className="flex items-start gap-1.5">
                          <Check size={13} className="text-blue-600 mt-0.5 shrink-0" />
                          <span>1.000 Kuota / Minggu</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <Check size={13} className="text-blue-600 mt-0.5 shrink-0" />
                          <span>Akses 5 Workspace</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <Check size={13} className="text-blue-600 mt-0.5 shrink-0" />
                          <span>Koleksi Template Web</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <Check size={13} className="text-blue-600 mt-0.5 shrink-0" />
                          <span>Publikasi Website Gratis</span>
                        </li>
                      </ul>
                    </div>

                    {/* Card 2: Iventra Spark Pro */}
                    <div
                      onClick={() => setChosenPlan('pro')}
                      className={`relative flex flex-col p-4 rounded-2xl border transition-all cursor-pointer text-left ${
                        chosenPlan === 'pro'
                          ? 'border-2 border-blue-600 bg-blue-50/30 shadow-md ring-2 ring-blue-500/20'
                          : 'border-slate-200 bg-white hover:border-blue-400'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-2xs">
                          <Star size={10} fill="currentColor" /> Populer
                        </span>
                        <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          chosenPlan === 'pro' ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300'
                        }`}>
                          {chosenPlan === 'pro' && <Check size={10} strokeWidth={3} />}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900">Iventra Spark Pro</h3>
                      <div className="my-1.5 flex items-baseline gap-1">
                        <span className="text-xl font-display font-extrabold text-blue-600">Rp 150rb</span>
                        <span className="text-[10px] text-slate-500 font-semibold">/ bln</span>
                      </div>
                      <ul className="mt-3 space-y-1.5 text-xs text-slate-600 flex-1">
                        <li className="flex items-start gap-1.5">
                          <Check size={13} className="text-blue-600 mt-0.5 shrink-0" />
                          <span>10.000 Kuota / Minggu</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <Check size={13} className="text-blue-600 mt-0.5 shrink-0" />
                          <span>Akses 30 Workspace</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <Check size={13} className="text-blue-600 mt-0.5 shrink-0" />
                          <span>Domain Kustom Sendiri</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <Check size={13} className="text-blue-600 mt-0.5 shrink-0" />
                          <span>E-Tiket & Scanner QR</span>
                        </li>
                      </ul>
                    </div>

                    {/* Card 3: Iventra Expert */}
                    <div
                      onClick={() => setChosenPlan('expert')}
                      className={`relative flex flex-col p-4 rounded-2xl border transition-all cursor-pointer text-left ${
                        chosenPlan === 'expert'
                          ? 'border-2 border-amber-500 bg-amber-50/20 shadow-md ring-2 ring-amber-500/20'
                          : 'border-slate-200 bg-white hover:border-amber-400'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 text-amber-700 border border-amber-500/20 px-2 py-0.5 text-[10px] font-bold">
                          <Trophy size={11} /> Expert
                        </span>
                        <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          chosenPlan === 'expert' ? 'border-amber-500 bg-amber-500 text-white' : 'border-slate-300'
                        }`}>
                          {chosenPlan === 'expert' && <Check size={10} strokeWidth={3} />}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900">Iventra Expert</h3>
                      <div className="my-1.5 flex items-baseline gap-1">
                        <span className="text-xl font-display font-extrabold text-slate-900">Konsultasi</span>
                      </div>
                      <ul className="mt-3 space-y-1.5 text-xs text-slate-600 flex-1">
                        <li className="flex items-start gap-1.5">
                          <Check size={13} className="text-blue-600 mt-0.5 shrink-0" />
                          <span>Desain Kustom Tim UI/UX</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <Check size={13} className="text-blue-600 mt-0.5 shrink-0" />
                          <span>Trafik & Peserta Unlimited</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <Check size={13} className="text-blue-600 mt-0.5 shrink-0" />
                          <span>Integrasi Payment Gateway</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <Check size={13} className="text-blue-600 mt-0.5 shrink-0" />
                          <span>Dedicated Event PM</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* Onboarding Navigation Buttons */}
                <div className="flex items-center justify-between pt-3 gap-3">
                  {onboardingStep > 1 ? (
                    <button
                      type="button"
                      onClick={handleBackOnboarding}
                      className="px-5 py-3 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs sm:text-sm font-bold hover:bg-slate-50 transition-all cursor-pointer"
                    >
                      Kembali
                    </button>
                  ) : (
                    <div />
                  )}

                  {onboardingStep < 4 ? (
                    <button
                      type="button"
                      onClick={handleNextOnboarding}
                      disabled={
                        (onboardingStep === 1 && !selectedRole) ||
                        (onboardingStep === 2 && !selectedPurpose) ||
                        (onboardingStep === 3 && !selectedSource)
                      }
                      className="flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md cursor-pointer ml-auto"
                    >
                      <span>Lanjut</span>
                      <ArrowRight size={16} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleFinishOnboarding}
                      className="flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold transition-all shadow-md cursor-pointer ml-auto"
                    >
                      <span>
                        {chosenPlan === 'spark'
                          ? 'Lanjut ke Dashboard'
                          : chosenPlan === 'pro'
                          ? 'Lanjut ke Pembayaran'
                          : 'Lanjut ke Konsultasi'}
                      </span>
                      <ArrowRight size={16} />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <>
                <header className="auth-heading">
                  <h2>
                    {isForgot
                      ? 'Lupa kata sandi?'
                      : isVerifyingRegistration
                        ? 'Verifikasi Email'
                        : isRegister
                          ? 'Buat akun Iventra'
                          : 'Selamat datang kembali'}
                  </h2>
                  {!isVerifyingRegistration && (
                    <p>
                      {isForgot
                        ? 'Masukkan email akun Anda untuk memulai pemulihan.'
                        : isRegister
                        ? 'Daftar untuk mulai mengelola event Anda.'
                        : 'Masuk untuk melanjutkan ke dashboard Iventra.'}
                    </p>
                  )}
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
                  {isVerifyingRegistration ? (
                    <>
                      <div
                        className="flex justify-center items-center gap-2 sm:gap-3 my-5"
                        onPaste={handleOtpPaste}
                      >
                        {otp.map((digit, index) => (
                          <input
                            key={index}
                            ref={(el) => { inputRefs.current[index] = el; }}
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={1}
                            value={digit}
                            onChange={(event) => handleOtpChange(index, event.target.value)}
                            onKeyDown={(event) => handleOtpKeyDown(index, event)}
                            className="w-11 h-14 sm:w-12 sm:h-14 text-center text-xl font-bold font-mono text-slate-900 bg-white border border-slate-200 rounded-xl shadow-2xs focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                            autoFocus={index === 0}
                          />
                        ))}
                      </div>

                      {error && <p className="auth-message auth-message-error" role="alert">{error}</p>}
                      {notice && <p className="auth-message auth-message-notice" role="status">{notice}</p>}

                      <button
                        type="submit"
                        className="auth-submit"
                        disabled={isLoading || otp.join('').length !== 6}
                      >
                        {isLoading ? 'Memproses...' : 'Verifikasi'}
                        {!isLoading && <ArrowRight size={18} aria-hidden="true" />}
                      </button>

                      <div className="flex items-center justify-between pt-4 text-xs font-semibold">
                        <button
                          type="button"
                          onClick={() => {
                            setVerificationPending(false);
                            setOtp(['', '', '', '', '', '']);
                            setError('');
                            setNotice('');
                          }}
                          className="text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                        >
                          Kembali
                        </button>

                        <button
                          type="button"
                          onClick={resendVerificationCode}
                          disabled={isResending || resendCountdown > 0}
                          className={`transition-colors cursor-pointer ${
                            resendCountdown > 0 || isResending
                              ? 'text-slate-400 cursor-not-allowed'
                              : 'text-blue-600 hover:text-blue-700'
                          }`}
                        >
                          {isResending
                            ? 'Mengirim...'
                            : resendCountdown > 0
                              ? `Kirim ulang (${formatTimer(resendCountdown)})`
                              : 'Kirim ulang'}
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      {isRegister && (
                        <>
                          <div className="auth-field">
                            <label htmlFor="auth-username">Username</label>
                            <input
                              id="auth-username"
                              type="text"
                              autoComplete="username"
                              value={username}
                              onChange={(event) => setUsername(event.target.value)}
                              placeholder="Masukkan username"
                              required
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="auth-field">
                              <label htmlFor="auth-age">Umur</label>
                              <input
                                id="auth-age"
                                type="number"
                                min="10"
                                max="120"
                                value={age}
                                onChange={(event) => setAge(event.target.value)}
                                placeholder="Contoh: 20"
                                required
                              />
                            </div>

                            <div className="auth-field">
                              <label htmlFor="auth-gender">Jenis Kelamin</label>
                              <select
                                id="auth-gender"
                                value={gender}
                                onChange={(event) => setGender(event.target.value)}
                                className="w-full h-[52px] px-3.5 border border-[#d8deea] rounded-[10px] text-[#17213d] bg-white outline-none focus:border-[#2456df] text-[15px] cursor-pointer"
                                required
                              >
                                <option value="Laki-laki">Laki-laki</option>
                                <option value="Perempuan">Perempuan</option>
                              </select>
                            </div>
                          </div>
                        </>
                      )}

                      <div className="auth-field">
                        <label htmlFor="auth-email">Alamat email</label>
                        <div className="auth-input-wrap">
                          <Mail className="auth-input-icon" size={18} aria-hidden="true" />
                          <input
                            id="auth-email"
                            type="email"
                            autoComplete="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            placeholder="nama@email.com"
                            required
                          />
                        </div>
                      </div>

                      {!isForgot && (
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

                      {isRegister && (
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
                          : isForgot
                            ? 'Kirim instruksi pemulihan'
                            : isRegister
                              ? 'Daftar'
                              : 'Masuk ke dashboard'}
                        {!isLoading && <ArrowRight size={18} aria-hidden="true" />}
                      </button>
                    </>
                  )}
                </form>
              </>
            )}
          </div>

          {!isVerifyingRegistration && !isOnboarding && (
            <>
              <p className="auth-switch">
                {isForgot ? (
                  <>
                    Ingat password Anda?{' '}
                    <button type="button" onClick={() => switchMode('login')}>Kembali masuk</button>
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
            </>
          )}
        </div>
      </section>
    </main>
  );
}
