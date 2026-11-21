import { useState, useEffect } from 'react';
import { LanguageProvider } from './context/LanguageContext.tsx';
import Navbar from './components/Navbar.tsx';
import Hero from './components/Hero.tsx';
import ServicesSection, { ServicesPrices } from './components/ServicesSection.tsx';
import ComparisonSection from './components/ComparisonSection.tsx';
import ProcessSection from './components/ProcessSection.tsx';
import FaqSection from './components/FaqSection.tsx';
import CtaSection from './components/CtaSection.tsx';
import Footer from './components/Footer.tsx';
import FloatingWhatsApp from './components/FloatingWhatsApp.tsx';
import ConsultationModal from './components/ConsultationModal.tsx';
import ProjectTrackerModal from './components/ProjectTrackerModal.tsx';
import InfoModal from './components/InfoModal.tsx';
import AdminDashboard, { SiteSettings } from './components/AdminDashboard.tsx';
import AuthPage, { type AuthUser } from './components/AuthPage.tsx';
import UserDashboard, { type Workspace } from './components/UserDashboard.tsx';
import SparkBuilder from './components/spark/SparkBuilder.tsx';
import PublicEventPage from './components/spark/PublicEventPage.tsx';
import SparkProCheckoutPage from './components/SparkProCheckoutPage.tsx';
import ExpertConsultationPage from './components/ExpertConsultationPage.tsx';
import { TopSkeletonBar, InitialSiteSkeleton } from './components/ui/LoadingSkeletonBar.tsx';

// ─── Auth Helpers ─────────────────────────────────────────────────────────────

const TOKEN_KEY = 'iventra_token';
const USER_KEY = 'iventra_user';

function loadStoredAuth(): { token: string; user: AuthUser } | null {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const userRaw = localStorage.getItem(USER_KEY);
    if (!token || !userRaw) return null;
    return { token, user: JSON.parse(userRaw) };
  } catch {
    return null;
  }
}

function saveStoredAuth(token: string, user: AuthUser) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function clearStoredAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

// ─── App Views ────────────────────────────────────────────────────────────────

type AppView = 'landing' | 'admin' | 'auth' | 'dashboard' | 'builder' | 'public-event' | 'spark-pro-checkout' | 'expert-consultation';

function parseHash(hash: string): {
  view: AppView;
  slug?: string;
  builderId?: string;
  oauthToken?: string;
  oauthError?: string;
} {
  if (hash === '#expert-consultation' || hash === '#expert') {
    return { view: 'expert-consultation' };
  }
  if (hash === '#spark-pro-checkout' || hash === '#checkout-pro') {
    return { view: 'spark-pro-checkout' };
  }
  if (hash.startsWith('#event/')) {
    const slug = hash.slice(7).split('?')[0];
    return { view: 'public-event', slug };
  }
  if (hash.startsWith('#builder/')) {
    const builderId = hash.slice(9).split('?')[0];
    return { view: 'builder', builderId };
  }
  if (hash === '#admin') {
    return { view: 'admin' };
  }
  if (hash === '#dashboard') {
    return { view: 'dashboard' };
  }
  if (hash.startsWith('#auth?')) {
    const params = new URLSearchParams(hash.slice(6));
    const oauthToken = params.get('oauth_token') || undefined;
    return {
      view: oauthToken ? 'dashboard' : 'auth',
      oauthToken,
      oauthError: params.get('oauth_error') || undefined
    };
  }
  if (hash === '#auth') {
    return { view: 'auth' };
  }
  return { view: 'landing' };
}

export default function App() {
  const [view, setView] = useState<AppView>(() => {
    if (typeof window === 'undefined') return 'landing';
    return parseHash(window.location.hash).view;
  });

  const [activeSlug, setActiveSlug] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return parseHash(window.location.hash).slug || '';
  });

  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);

  const [authToken, setAuthToken] = useState<string | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [onboardingUser, setOnboardingUser] = useState<{ token: string; user: AuthUser } | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(() => {
    if (typeof window === 'undefined') return false;
    return !!parseHash(window.location.hash).oauthToken;
  });

  const [isConsultationOpen, setIsConsultationOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'spark' | 'flow' | 'bot' | null>('flow');
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);
  const [trackerInitialId, setTrackerInitialId] = useState('IVN-2025-FTUI');
  const [infoModalType, setInfoModalType] = useState<'profile' | 'terms' | 'privacy' | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 750);
    return () => clearTimeout(timer);
  }, []);

  // Dynamic Site Settings
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({
    sparkPrice: 'Rp 150.000',
    sparkPriceNote: '/ bulan',
    flowPrice: 'Mulai Rp 500.000',
    flowPriceNote: '/ event',
    botPrice: 'Rp 70.000',
    botPriceNote: '/ event',
    totalProjectsHandled: '120+',
    totalActiveUsers: '15.000+'
  });

  // ─── Load Settings ─────────────────────────────────────────────────────────

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setSiteSettings((prev) => ({ ...prev, ...data }));
      }
    } catch (err) {
      console.warn('Could not load site settings from server:', err);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  // ─── Auth: Restore session on mount ───────────────────────────────────────

  useEffect(() => {
    if (parseHash(window.location.hash).oauthToken) return;

    const stored = loadStoredAuth();
    if (!stored) return;

    setIsCheckingAuth(true);
    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${stored.token}` }
    })
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error('invalid');
      })
      .then((data) => {
        setAuthToken(stored.token);
        setAuthUser(data.user);

        // If URL hash was #dashboard, ensure we show dashboard
        const currentHash = window.location.hash;
        if (currentHash === '#dashboard') {
          setView('dashboard');
        } else if (currentHash.startsWith('#builder/')) {
          const wsId = currentHash.slice(9).split('?')[0];
          fetch(`/api/workspaces/${wsId}`, {
            headers: { Authorization: `Bearer ${stored.token}` }
          })
            .then((r) => r.json())
            .then((ws) => {
              if (ws && ws.id) {
                setActiveWorkspace(ws);
                setView('builder');
              }
            })
            .catch(() => {});
        }
      })
      .catch(() => {
        clearStoredAuth();
      })
      .finally(() => {
        setIsCheckingAuth(false);
      });
  }, []);

  useEffect(() => {
    const oauthToken = parseHash(window.location.hash).oauthToken;
    if (!oauthToken) return;

    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#auth`);
    setIsCheckingAuth(true);

    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${oauthToken}` }
    })
      .then((response) => {
        if (response.ok) return response.json();
        throw new Error('OAuth session verification failed.');
      })
      .then((data) => {
        setAuthToken(oauthToken);
        setAuthUser(data.user);
        saveStoredAuth(oauthToken, data.user);

        // If user hasn't completed personalized setup yet, direct to Personalized Setup
        if (!data.user.onboarding_role) {
          setOnboardingUser({ token: oauthToken, user: data.user });
          setView('auth');
          window.location.hash = '#auth';
          return;
        }

        const redirect = sessionStorage.getItem('post_login_redirect');
        if (redirect) {
          sessionStorage.removeItem('post_login_redirect');
          window.location.hash = redirect;
          if (redirect === '#admin') {
            setView('admin');
            return;
          }
          if (redirect === '#spark-pro-checkout') {
            setView('spark-pro-checkout');
            return;
          }
          if (redirect === '#expert-consultation') {
            setView('expert-consultation');
            return;
          }
        }
        window.location.hash = '#dashboard';
        setView('dashboard');
      })
      .catch((error) => {
        console.error('Could not verify the OAuth session:', error);
        clearStoredAuth();
        setView('auth');
        window.location.hash = `#auth?oauth_error=${encodeURIComponent('Login sosial gagal diverifikasi. Silakan coba lagi.')}`;
      })
      .finally(() => {
        setIsCheckingAuth(false);
      });
  }, []);

  // ─── Hash Change Listener ──────────────────────────────────────────────────

  useEffect(() => {
    const handleHashChange = () => {
      const parsed = parseHash(window.location.hash);

      if (parsed.view === 'public-event' && parsed.slug) {
        setActiveSlug(parsed.slug);
        setView('public-event');
      } else if (parsed.view === 'builder') {
        const wsId = parsed.builderId;
        if (activeWorkspace && activeWorkspace.id === wsId) {
          setView('builder');
        } else if (wsId && authToken) {
          fetch(`/api/workspaces/${wsId}`, {
            headers: { Authorization: `Bearer ${authToken}` }
          })
            .then((r) => r.json())
            .then((ws) => {
              if (ws && ws.id) {
                setActiveWorkspace(ws);
                setView('builder');
              } else {
                setView('dashboard');
              }
            })
            .catch(() => setView('dashboard'));
        } else {
          setView(authToken ? 'dashboard' : 'auth');
        }
      } else if (parsed.view === 'dashboard') {
        if (authToken && authUser) {
          setView('dashboard');
        } else {
          setView('auth');
        }
      } else if (parsed.view === 'admin') {
        setView('admin');
      } else if (parsed.view === 'auth') {
        setView('auth');
      } else if (parsed.view === 'spark-pro-checkout') {
        if (!authToken || !authUser) {
          sessionStorage.setItem('post_login_redirect', '#spark-pro-checkout');
          window.location.hash = '#auth';
          setView('auth');
        } else {
          setView('spark-pro-checkout');
        }
      } else if (parsed.view === 'expert-consultation') {
        setView('expert-consultation');
      } else {
        setView('landing');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
  }, [authToken, authUser, activeWorkspace]);

  // ─── Navigation Handlers ───────────────────────────────────────────────────

  const handleOpenConsultation = (plan?: 'spark' | 'flow' | 'bot') => {
    setSelectedPlan(plan || 'flow');
    setIsConsultationOpen(true);
  };

  const handleOpenAdmin = () => {
    window.location.hash = '#admin';
    setView('admin');
  };

  const handleOpenDashboard = () => {
    if (authToken && authUser) {
      window.location.hash = '#dashboard';
      setView('dashboard');
    } else {
      window.location.hash = '#auth';
      setView('auth');
    }
  };

  const handleOpenBuilder = (ws: Workspace) => {
    setActiveWorkspace(ws);
    window.location.hash = `#builder/${ws.id}`;
    setView('builder');
  };

  const handleBackToSite = () => {
    window.history.pushState(null, '', window.location.pathname);
    setView('landing');
  };

  const handleBackToDashboard = () => {
    window.location.hash = '#dashboard';
    setView('dashboard');
  };

  const handleAuthSuccess = (token: string, user: AuthUser, redirectHash?: string) => {
    setOnboardingUser(null);
    setAuthToken(token);
    setAuthUser(user);
    saveStoredAuth(token, user);
    const redirect = redirectHash || sessionStorage.getItem('post_login_redirect');
    if (redirect) {
      sessionStorage.removeItem('post_login_redirect');
      window.location.hash = redirect;
      if (redirect === '#admin') {
        setView('admin');
        return;
      }
      if (redirect === '#spark-pro-checkout') {
        setView('spark-pro-checkout');
        return;
      }
      if (redirect === '#expert-consultation') {
        setView('expert-consultation');
        return;
      }
    }
    window.location.hash = '#dashboard';
    setView('dashboard');
  };

  const handleLogout = () => {
    setOnboardingUser(null);
    setAuthToken(null);
    setAuthUser(null);
    setActiveWorkspace(null);
    clearStoredAuth();
    window.history.pushState(null, '', window.location.pathname);
    setView('landing');
  };

  const handlePreviewInTracker = (id: string) => {
    setTrackerInitialId(id);
    setIsTrackerOpen(true);
  };

  // ─── Computed ──────────────────────────────────────────────────────────────

  const pricesForServices: ServicesPrices = {
    sparkPrice: siteSettings.sparkPrice,
    sparkPriceNote: siteSettings.sparkPriceNote,
    flowPrice: siteSettings.flowPrice,
    flowPriceNote: siteSettings.flowPriceNote,
    botPrice: siteSettings.botPrice,
    botPriceNote: siteSettings.botPriceNote
  };

  // ─── Views ─────────────────────────────────────────────────────────────────

  // 1. PUBLIC EVENT RENDERER (`/#event/:slug`)
  if (view === 'public-event' && activeSlug) {
    return (
      <PublicEventPage
        slug={activeSlug}
        onBackToHome={handleBackToSite}
        onOpenBuilder={(wsId) => {
          if (activeWorkspace && activeWorkspace.id === wsId) {
            setView('builder');
          } else {
            handleOpenDashboard();
          }
        }}
      />
    );
  }

  // 2. SPARK EVENT BUILDER (`#builder/:id`)
  if (view === 'builder') {
    if (!authToken || !authUser) {
      setView('auth');
      return null;
    }
    if (!activeWorkspace) {
      handleOpenDashboard();
      return null;
    }
    return (
      <SparkBuilder
        workspace={activeWorkspace}
        token={authToken}
        onBackToDashboard={handleBackToDashboard}
        onWorkspaceUpdated={(updated) => setActiveWorkspace(updated)}
      />
    );
  }

  // 3. ADMIN VIEW (Gated strictly for eventra.work@gmail.com with role === 'admin')
  if (view === 'admin') {
    const isMasterAdmin = Boolean(
      authToken &&
      authUser &&
      authUser.email?.toLowerCase().trim() === 'eventra.work@gmail.com' &&
      authUser.role === 'admin'
    );

    if (!authToken || !authUser) {
      sessionStorage.setItem('post_login_redirect', '#admin');
      return (
        <div className="min-h-screen bg-[#f8f9fe] flex flex-col items-center justify-center p-4 text-center font-sans">
          <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-xl p-8 space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
              <span className="material-symbols-outlined text-[32px]">admin_panel_settings</span>
            </div>
            <div className="space-y-2">
              <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold tracking-wider uppercase bg-blue-50 text-blue-700 border border-blue-200">
                PORTAL ADMINISTRATOR
              </span>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight pt-1">Akses Admin Dilindungi</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Halaman ini dilindungi dan hanya dapat diakses oleh akun administrator utama (<strong className="text-slate-900 font-mono">eventra.work@gmail.com</strong>).
              </p>
            </div>
            <div className="pt-2 flex flex-col gap-3">
              <button
                type="button"
                onClick={() => {
                  sessionStorage.setItem('post_login_redirect', '#admin');
                  window.location.hash = '#auth';
                  setView('auth');
                }}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-all shadow-md hover:shadow-lg cursor-pointer"
              >
                Masuk dengan Akun Admin
              </button>
              <button
                type="button"
                onClick={handleBackToSite}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-colors cursor-pointer"
              >
                Kembali ke Beranda
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (!isMasterAdmin) {
      return (
        <div className="min-h-screen bg-[#f8f9fe] flex flex-col items-center justify-center p-4 text-center font-sans">
          <div className="max-w-md w-full bg-white rounded-2xl border border-red-200 shadow-xl p-8 space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto shadow-inner">
              <span className="material-symbols-outlined text-[32px]">gpp_bad</span>
            </div>
            <div className="space-y-2">
              <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold tracking-wider uppercase bg-red-50 text-red-700 border border-red-200">
                403 · AKSES DITOLAK
              </span>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight pt-1">Izin Tidak Memadai</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Anda sedang masuk sebagai <strong className="text-slate-900 font-mono">{authUser.email}</strong>. Akun ini tidak memiliki hak akses administrator.
              </p>
              <p className="text-xs text-slate-500">
                Akses konsol admin hanya terbuka untuk akun <strong>eventra.work@gmail.com</strong>.
              </p>
            </div>
            <div className="pt-2 flex flex-col gap-3">
              <button
                type="button"
                onClick={() => {
                  handleLogout();
                  sessionStorage.setItem('post_login_redirect', '#admin');
                  window.location.hash = '#auth';
                  setView('auth');
                }}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-all shadow-md hover:shadow-lg cursor-pointer"
              >
                Ganti Akun (Login Admin)
              </button>
              <button
                type="button"
                onClick={() => {
                  window.location.hash = '#dashboard';
                  setView('dashboard');
                }}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-colors cursor-pointer"
              >
                Kembali ke Dashboard Saya
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#f8f9fe] text-[#191930] selection:bg-[#0c1df3] selection:text-white">
        <AdminDashboard
          onBackToSite={handleBackToSite}
          onPreviewProject={handlePreviewInTracker}
          onSettingsUpdated={loadSettings}
        />
        <ProjectTrackerModal
          isOpen={isTrackerOpen}
          initialProjectId={trackerInitialId}
          onClose={() => setIsTrackerOpen(false)}
        />
      </div>
    );
  }

  // 4. AUTH PAGE
  if (view === 'auth') {
    return (
      <div className="selection:bg-[#0c1df3] selection:text-white">
        <AuthPage
          onAuthSuccess={handleAuthSuccess}
          onBackToSite={handleBackToSite}
          oauthError={parseHash(window.location.hash).oauthError}
          initialOnboardingUser={onboardingUser}
        />
      </div>
    );
  }

  // 5. USER DASHBOARD (PROTECTED)
  if (view === 'dashboard') {
    if (isCheckingAuth) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#f8f9fe]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-[#0c1df3] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-[#757589] font-semibold">Memverifikasi sesi...</p>
          </div>
        </div>
      );
    }
    if (!authToken || !authUser) {
      setView('auth');
      return null;
    }
    // If user hasn't completed personalized setup yet, direct to onboarding
    if (!authUser.onboarding_role) {
      setOnboardingUser({ token: authToken, user: authUser });
      setView('auth');
      window.location.hash = '#auth';
      return null;
    }
    return (
      <div className="selection:bg-[#0c1df3] selection:text-white">
        <UserDashboard
          user={authUser}
          token={authToken}
          onLogout={handleLogout}
          onBackToSite={handleBackToSite}
          onOpenBuilder={handleOpenBuilder}
          onOpenAdmin={handleOpenAdmin}
        />
      </div>
    );
  }

  // 6. SPARK PRO CHECKOUT PAGE
  if (view === 'spark-pro-checkout') {
    if (isCheckingAuth) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }
    if (!authToken || !authUser) {
      sessionStorage.setItem('post_login_redirect', '#spark-pro-checkout');
      window.location.hash = '#auth';
      setView('auth');
      return null;
    }
    return (
      <SparkProCheckoutPage
        onBack={handleBackToSite}
        onOpenDashboard={handleOpenDashboard}
        defaultPrice={siteSettings.sparkPrice ? `${siteSettings.sparkPrice} / bulan` : 'Rp 150.000 / bulan'}
        userEmail={authUser?.email}
      />
    );
  }

  // 7. EXPERT CONSULTATION PAGE
  if (view === 'expert-consultation') {
    return (
      <ExpertConsultationPage
        onBack={handleBackToSite}
        onOpenTracker={() => setIsTrackerOpen(true)}
      />
    );
  }

  // 8. PUBLIC LANDING PAGE (DEFAULT)
  return (
    <LanguageProvider>
      <div className="min-h-screen flex flex-col bg-white text-slate-900 selection:bg-blue-600 selection:text-white">
        <TopSkeletonBar isLoading={isInitialLoading} />
        <InitialSiteSkeleton isVisible={isInitialLoading} />

        <Navbar
          onOpenConsultation={() => handleOpenConsultation()}
          onOpenDashboard={handleOpenDashboard}
          isLoggedIn={!!(authToken && authUser)}
          userName={authUser?.name}
        />

        <main className="w-full flex-1">
          {/* Section 1 - Hero with Iventra background and event preview */}
          <Hero
            onOpenConsultation={() => handleOpenConsultation()}
            onSelectCampus={() => {}}
            totalProjectsHandled={siteSettings.totalProjectsHandled}
            totalActiveUsers={siteSettings.totalActiveUsers}
          />

          {/* Section 2 - Pricing / Pilihan Model: Clean Light Theme */}
          <ServicesSection
            onSelectPlan={(planId) => handleOpenConsultation(planId)}
            onOpenSparkProCheckout={() => {
              if (!authToken || !authUser) {
                sessionStorage.setItem('post_login_redirect', '#spark-pro-checkout');
                window.location.hash = '#auth';
                setView('auth');
              } else {
                window.location.hash = '#spark-pro-checkout';
                setView('spark-pro-checkout');
              }
            }}
            onOpenExpertConsultation={() => {
              window.location.hash = '#expert-consultation';
              setView('expert-consultation');
            }}
            prices={pricesForServices}
          />

          {/* Section 3 - Features Bento Grid: Background Gambar 3 (section-bg-blue.jpg) */}
          <ComparisonSection />

          {/* Section 4 - 3-Step Process & Testimonial Quote: Clean Light Theme */}
          <ProcessSection />

          {/* Section 5 - Call to Action Banner */}
          <CtaSection
            onOpenConsultation={() => handleOpenConsultation()}
          />
        </main>

        <Footer
          onOpenConsultation={() => handleOpenConsultation()}
          onOpenTerms={(type) => setInfoModalType(type)}
          onOpenAdmin={handleOpenAdmin}
        />

        <FloatingWhatsApp
          onOpenConsultation={() => handleOpenConsultation()}
        />

        <ConsultationModal
          isOpen={isConsultationOpen}
          onClose={() => setIsConsultationOpen(false)}
          initialPlan={selectedPlan}
        />

        <ProjectTrackerModal
          isOpen={isTrackerOpen}
          initialProjectId={trackerInitialId}
          onClose={() => setIsTrackerOpen(false)}
        />

        <InfoModal
          type={infoModalType}
          onClose={() => setInfoModalType(null)}
        />
      </div>
    </LanguageProvider>
  );
}
