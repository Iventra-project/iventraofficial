import { useEffect, useState, type MouseEvent } from 'react';
import Logo from './Logo.tsx';

interface NavbarProps {
  onOpenTracker: () => void;
  onOpenConsultation: () => void;
  onOpenProfile: () => void;
  onOpenAdmin?: () => void;
  onOpenDashboard?: () => void;
  isLoggedIn?: boolean;
  userName?: string;
}

export default function Navbar({
  onOpenTracker,
  onOpenConsultation,
  onOpenAdmin,
  onOpenDashboard,
  isLoggedIn = false,
  userName
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');

  const navItems = [
    { href: '#overview', label: 'Overview', id: 'overview' },
    { href: '#pricing', label: 'Pilihan Model', id: 'pricing' },
    { href: '#features', label: 'Fitur Khusus', id: 'features' },
    { href: '#process', label: 'Alur Kerja', id: 'process' }
  ];

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
      const scrollY = window.scrollY + 100;
      for (const item of [...navItems].reverse()) {
        const el = document.getElementById(item.id);
        if (el && el.offsetTop <= scrollY) {
          setActiveSection(item.id);
          break;
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/85 backdrop-blur-md border-b border-slate-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Logo Brand */}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex items-center gap-2.5 group"
        >
          <Logo size="sm" />
          <div className="flex items-center gap-1.5">
            <span className="text-xl font-display font-extrabold tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
              IVENTRA
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200/60">
              EVENT PLATFORM
            </span>
          </div>
        </a>

        {/* Center Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          {navItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <a
                key={item.id}
                href={item.href}
                onClick={(e) => handleNavigationClick(e, item.id)}
                className={`transition-colors py-1 relative ${
                  isActive
                    ? 'text-blue-600 font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {item.label}
                {isActive && (
                  <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                )}
              </a>
            );
          })}
        </nav>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Tracker shortcut */}
          <button
            type="button"
            onClick={onOpenTracker}
            className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:text-slate-900 hover:border-slate-300 bg-white/80 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[15px]">search</span>
            <span>Cek Status</span>
          </button>

          {/* Admin shortcut */}
          {onOpenAdmin && (
            <button
              type="button"
              onClick={onOpenAdmin}
              className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-mono text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Akses Admin"
            >
              <span>admin</span>
            </button>
          )}

          {/* Dashboard / Auth Button */}
          {onOpenDashboard && (
            <button
              type="button"
              onClick={onOpenDashboard}
              className="inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-sm hover:shadow transition-all active:scale-[0.98] cursor-pointer"
            >
              {isLoggedIn ? (
                <>
                  <div className="w-5 h-5 rounded-full bg-white/20 text-white flex items-center justify-center text-[10px] font-bold">
                    {(userName || 'U').charAt(0).toUpperCase()}
                  </div>
                  <span>Dashboard</span>
                </>
              ) : (
                <>
                  <span>Masuk Dashboard</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </>
              )}
            </button>
          )}

          {/* Mobile menu trigger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-100"
            aria-label="Toggle menu"
          >
            <span className="material-symbols-outlined text-[20px]">
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-6 py-4 space-y-3">
          {navItems.map((item) => (
            <a
              key={item.id}
              href={item.href}
              onClick={(e) => handleNavigationClick(e, item.id)}
              className="block py-2 text-sm font-medium text-slate-700 hover:text-blue-600"
            >
              {item.label}
            </a>
          ))}
          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenTracker();
              }}
              className="w-full text-left py-2 text-xs text-slate-600 flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">search</span>
              <span>Cek Status Project</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenConsultation();
              }}
              className="w-full text-left py-2 text-xs text-blue-600 font-semibold"
            >
              Konsultasi Panitia Expert →
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
