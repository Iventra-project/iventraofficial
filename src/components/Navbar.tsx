import { useEffect, useState, type MouseEvent } from 'react';
import { motion } from 'motion/react';
import { House, Layers3, Menu, Sparkles, Workflow, X } from 'lucide-react';
import Logo from './Logo.tsx';

interface NavbarProps {
  onOpenConsultation: () => void;
  onOpenDashboard?: () => void;
  isLoggedIn?: boolean;
  userName?: string;
}

const navItems = [
  { href: '#overview', label: 'Overview', id: 'overview', icon: House },
  { href: '#pricing', label: 'Pilihan Model', id: 'pricing', icon: Layers3 },
  { href: '#features', label: 'Fitur Khusus', id: 'features', icon: Sparkles },
  { href: '#process', label: 'Alur Kerja', id: 'process', icon: Workflow }
];

export default function Navbar({
  onOpenConsultation,
  onOpenDashboard,
  isLoggedIn = false,
  userName
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.scrollY > 40;
  });
  const [activeSection, setActiveSection] = useState(() => {
    if (typeof window === 'undefined') return 'overview';
    return navItems.find((item) => item.id === window.location.hash.slice(1))?.id ?? 'overview';
  });

  const handleNavigationClick = (
    event: MouseEvent<HTMLAnchorElement>,
    sectionId: string
  ) => {
    event.preventDefault();
    const section = document.getElementById(sectionId);
    if (!section) return;

    const hash = `#${sectionId}`;
    if (window.location.hash !== hash) {
      window.history.pushState(null, '', hash);
    }
    setActiveSection(sectionId);
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setMobileMenuOpen(false);
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
      const scrollY = window.scrollY + 100;
      for (const item of [...navItems].reverse()) {
        const section = document.getElementById(item.id);
        if (section && section.offsetTop <= scrollY) {
          setActiveSection(item.id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const renderNavLinks = (mobile = false) => (
    <>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeSection === item.id;

        return (
          <a
            key={item.id}
            href={item.href}
            aria-label={item.label}
            aria-current={isActive ? 'location' : undefined}
            title={mobile ? item.label : undefined}
            onClick={(event) => handleNavigationClick(event, item.id)}
            className={`relative isolate flex shrink-0 items-center justify-center rounded-full px-3 py-2.5 text-sm font-semibold transition-colors sm:px-4 ${
              isActive ? 'text-blue-700' : 'text-slate-600 hover:text-blue-700'
            }`}
          >
            {isActive && (
              <motion.span
                layoutId="iventra-nav-active"
                className="absolute inset-0 -z-10 rounded-full bg-blue-50"
                initial={false}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              >
                <span className="absolute -top-1 left-1/2 h-1 w-8 -translate-x-1/2 rounded-t-full bg-blue-600">
                  <span className="absolute -left-2 -top-1 h-5 w-12 rounded-full bg-blue-400/25 blur-md" />
                  <span className="absolute -top-1 left-1/2 h-5 w-8 -translate-x-1/2 rounded-full bg-blue-400/20 blur-md" />
                </span>
              </motion.span>
            )}
            <span className={mobile ? 'hidden md:inline' : undefined}>{item.label}</span>
            {mobile && <Icon className="md:hidden" size={19} strokeWidth={2.25} aria-hidden="true" />}
          </a>
        );
      })}
    </>
  );

  return (
    <>
      <header
        className={`fixed left-1/2 z-50 -translate-x-1/2 transition-all duration-300 ease-out ${
          isScrolled
            ? 'top-3 w-max max-w-[calc(100vw-1rem)] rounded-full border border-slate-200 bg-white/95 shadow-lg shadow-slate-900/10 backdrop-blur-xl'
            : 'top-0 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-xl'
        }`}
      >
        <div
          className={`mx-auto flex items-center justify-between transition-all duration-300 ${
            isScrolled
              ? 'h-14 gap-3 px-3 sm:gap-5 sm:px-5'
              : 'h-[4.5rem] max-w-7xl px-4 sm:px-6 lg:px-8'
          }`}
        >
          <a
            href="#overview"
            onClick={(event) => handleNavigationClick(event, 'overview')}
            className="group flex shrink-0 items-center gap-2.5"
          >
            <Logo size="sm" />
            <span className="text-xl font-display font-extrabold tracking-tight text-slate-900 transition-colors group-hover:text-blue-600">
              IVENTRA
            </span>
          </a>

          <nav
            aria-label="Navigasi utama"
            className={`hidden items-center gap-1 transition-all duration-300 md:flex ${
              isScrolled
                ? 'rounded-full p-0'
                : 'rounded-full border border-slate-200 bg-white/80 p-1.5 shadow-sm'
            }`}
          >
            {renderNavLinks()}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-700 transition-colors hover:bg-slate-50 md:hidden"
              aria-label={mobileMenuOpen ? 'Tutup menu' : 'Buka menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={19} /> : <Menu size={19} />}
            </button>

            {onOpenDashboard && (
              <button
                type="button"
                onClick={onOpenDashboard}
                aria-label={isLoggedIn ? 'Buka dashboard profil' : 'Masuk'}
                title={isLoggedIn ? 'Profil' : undefined}
                className={
                  isLoggedIn
                    ? 'flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700 shadow-sm ring-2 ring-white transition-colors hover:bg-blue-200'
                    : 'inline-flex min-h-10 items-center justify-center rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow'
                }
              >
                {isLoggedIn ? (
                  <span>{(userName || 'U').charAt(0).toUpperCase()}</span>
                ) : (
                  <span>Masuk</span>
                )}
              </button>
            )}
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="absolute inset-x-4 top-[calc(100%+0.5rem)] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl md:hidden">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenConsultation();
              }}
              className="w-full rounded-xl bg-blue-50 px-4 py-3 text-left text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-100"
            >
              Konsultasi Panitia Expert →
            </button>
          </div>
        )}
      </header>

      <nav
        aria-label="Navigasi bagian"
        className="fixed bottom-[calc(0.75rem+env(safe-area-inset-bottom))] left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-full border border-slate-200/90 bg-white/95 p-1.5 shadow-lg shadow-slate-900/10 backdrop-blur-xl md:hidden"
      >
        {renderNavLinks(true)}
      </nav>
    </>
  );
}
