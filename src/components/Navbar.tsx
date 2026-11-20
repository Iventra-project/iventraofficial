import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { motion } from 'motion/react';
import { House, Layers3, Menu, Sparkles, Workflow, X } from 'lucide-react';
import Logo from './Logo.tsx';
import { InteractiveHoverButton } from './ui/interactive-hover-button.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';

interface NavbarProps {
  onOpenConsultation: () => void;
  onOpenDashboard?: () => void;
  isLoggedIn?: boolean;
  userName?: string;
}

export default function Navbar({
  onOpenConsultation,
  onOpenDashboard,
  isLoggedIn = false,
  userName
}: NavbarProps) {
  const { lang, setLang, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  const isClickScrollingRef = useRef(false);
  const clickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const navItems = [
    { href: '#overview', label: t.nav.overview, id: 'overview', icon: House },
    { href: '#pricing', label: t.nav.services, id: 'pricing', icon: Layers3 },
    { href: '#features', label: t.nav.features, id: 'features', icon: Sparkles },
    { href: '#process', label: t.nav.process, id: 'process', icon: Workflow }
  ];

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

    // Lock scroll tracking temporarily during smooth scroll so the active indicator stays solid
    isClickScrollingRef.current = true;
    if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
    clickTimeoutRef.current = setTimeout(() => {
      isClickScrollingRef.current = false;
    }, 850);

    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setMobileMenuOpen(false);
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
      if (isClickScrollingRef.current) return;

      const scrollY = window.scrollY + 120;
      for (const item of [...navItems].reverse()) {
        const section = document.getElementById(item.id);
        if (section && section.offsetTop <= scrollY) {
          setActiveSection(item.id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
    };
  }, []);

  const renderNavLinks = (mobile = false) => (
    <>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeSection === item.id;
        const isHovered = hoveredSection === item.id;

        return (
          <a
            key={item.id}
            href={item.href}
            aria-label={item.label}
            aria-current={isActive ? 'location' : undefined}
            title={mobile ? item.label : undefined}
            onMouseEnter={() => setHoveredSection(item.id)}
            onMouseLeave={() => setHoveredSection(null)}
            onClick={(event) => handleNavigationClick(event, item.id)}
            className={`relative isolate flex shrink-0 items-center justify-center rounded-full transition-colors duration-200 ${
              isScrolled
                ? 'px-3.5 py-1.5 text-sm font-semibold'
                : 'px-4 py-2 text-sm font-semibold'
            } ${
              isActive ? 'text-blue-700 font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {/* Active section indicator */}
            {isActive && (
              <motion.span
                layoutId={mobile ? "iventra-nav-active-mobile" : "iventra-nav-active-desktop"}
                className="absolute inset-0 -z-10 rounded-full bg-blue-50"
                initial={false}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              >
                <span className="absolute -top-1 left-1/2 h-1 w-8 -translate-x-1/2 rounded-t-full bg-blue-600">
                  <span className="absolute -left-2 -top-1 h-5 w-12 rounded-full bg-blue-400/25 blur-md" />
                  <span className="absolute -top-1 left-1/2 h-5 w-8 -translate-x-1/2 rounded-full bg-blue-400/20 blur-md" />
                </span>
              </motion.span>
            )}

            {/* Hover preview pill for non-active links */}
            {isHovered && !isActive && (
              <motion.span
                layoutId={mobile ? "iventra-nav-hover-mobile" : "iventra-nav-hover-desktop"}
                className="absolute inset-0 -z-10 rounded-full bg-slate-100/90"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: 'spring', stiffness: 450, damping: 32 }}
              />
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
        className={`fixed top-0 inset-x-0 z-50 flex justify-center transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isScrolled ? 'pt-3 px-3 sm:px-4 pointer-events-none' : 'pt-0 px-0 pointer-events-auto'
        }`}
      >
        {/* Full-width top bar background: purely fades opacity without black border color interpolation */}
        <div
          className={`absolute inset-0 -z-10 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl transition-opacity duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isScrolled ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        />

        {/* Inner Nav Container */}
        <div
          className={`relative pointer-events-auto flex items-center justify-between transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isScrolled
              ? 'w-full max-w-3xl h-[3.25rem] rounded-full border border-slate-200/90 bg-white/92 shadow-xl shadow-slate-900/5 backdrop-blur-xl px-4 sm:px-6'
              : 'w-full max-w-7xl h-[4.25rem] rounded-none border border-transparent bg-transparent shadow-none px-4 sm:px-6 lg:px-8'
          }`}
        >
          <a
            href="#overview"
            onClick={(event) => handleNavigationClick(event, 'overview')}
            className="group flex shrink-0 items-center gap-2"
          >
            <Logo size="sm" />
            <span className="font-display font-extrabold tracking-tight text-slate-900 text-lg sm:text-xl transition-colors duration-200 group-hover:text-blue-600">
              IVENTRA
            </span>
          </a>

          <nav
            aria-label="Navigasi utama"
            className="hidden items-center gap-1 md:flex"
            onMouseLeave={() => setHoveredSection(null)}
          >
            {renderNavLinks()}
          </nav>

          <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
            {/* Language Switcher Toggle IDN / ENG */}
            <div className="flex items-center rounded-full border border-slate-200 bg-slate-100/90 p-0.5 text-[11px] font-semibold shadow-2xs">
              <button
                type="button"
                onClick={() => setLang('id')}
                aria-label="Bahasa Indonesia"
                className={`rounded-full px-2 py-0.5 transition-all cursor-pointer ${
                  lang === 'id'
                    ? 'bg-white text-blue-600 shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                IDN
              </button>
              <button
                type="button"
                onClick={() => setLang('en')}
                aria-label="English Language"
                className={`rounded-full px-2 py-0.5 transition-all cursor-pointer ${
                  lang === 'en'
                    ? 'bg-white text-blue-600 shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                ENG
              </button>
            </div>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-700 transition-colors hover:bg-slate-50 md:hidden"
              aria-label={mobileMenuOpen ? 'Tutup menu' : 'Buka menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>

            {onOpenDashboard && (
              isLoggedIn ? (
                <button
                  type="button"
                  onClick={onOpenDashboard}
                  aria-label="Buka dashboard profil"
                  title="Profil"
                  className={`flex items-center justify-center rounded-full bg-blue-600 font-bold text-white shadow-sm ring-2 ring-blue-100 transition-all duration-300 hover:bg-blue-700 active:scale-95 ${
                    isScrolled ? 'h-9 w-9 text-xs' : 'h-10 w-10 text-sm'
                  }`}
                >
                  <span>{(userName || 'U').charAt(0).toUpperCase()}</span>
                </button>
              ) : (
                <InteractiveHoverButton
                  text={t.nav.login}
                  onClick={onOpenDashboard}
                  aria-label="Masuk ke Dashboard"
                  className={
                    isScrolled
                      ? 'h-9 w-24 text-xs'
                      : 'h-10 w-28 text-sm'
                  }
                />
              )
            )}
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
                {t.nav.consultation}
              </button>
            </div>
          )}
        </div>
      </header>

      <nav
        aria-label="Navigasi bagian"
        className="fixed bottom-[calc(0.75rem+env(safe-area-inset-bottom))] left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-full border border-slate-200/90 bg-white/95 p-1.5 shadow-lg shadow-slate-900/10 backdrop-blur-xl md:hidden"
        onMouseLeave={() => setHoveredSection(null)}
      >
        {renderNavLinks(true)}
      </nav>
    </>
  );
}
