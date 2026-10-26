import { useState } from 'react';
import Logo from './Logo.tsx';

interface NavbarProps {
  onOpenTracker: () => void;
  onOpenConsultation: () => void;
  onOpenProfile: () => void;
}

export default function Navbar({
  onOpenTracker,
  onOpenConsultation,
  onOpenProfile
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('layanan');

  const navItems = [
    { href: '#layanan', label: 'Layanan', id: 'layanan' },
    { href: '#kelebihan', label: 'Kelebihan', id: 'kelebihan' },
    { href: '#alur', label: 'Alur', id: 'alur' },
    { href: '#faq', label: 'FAQ', id: 'faq' }
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-[#efecff]/80 transition-all">
      <div className="h-20 w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-12 flex items-center justify-between">
        {/* Brand */}
        <a
          href="#"
          className="flex items-center gap-2 sm:gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0c1df3] rounded-lg shrink-0"
          aria-label="Iventra Beranda"
        >
          <Logo size="md" />
          <span className="text-xl sm:text-2xl text-[#000cb8] font-extrabold tracking-tight">
            Iventra
          </span>
        </a>

        {/* Desktop Navigation */}
        <nav
          className="hidden md:flex items-center gap-8"
          aria-label="Navigasi Utama"
        >
          {navItems.map((item) => (
            <a
              key={item.id}
              href={item.href}
              onClick={() => setActiveSection(item.id)}
              className={`text-sm transition-colors whitespace-nowrap font-semibold ${
                activeSection === item.id
                  ? 'text-[#000cb8] font-bold'
                  : 'text-[#454557] hover:text-[#000cb8]'
              }`}
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenTracker}
            className="inline-flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-full bg-gradient-to-r from-[#0c1df3] to-[#3b47dc] text-white text-xs sm:text-sm font-semibold shadow-[0_8px_24px_-2px_rgba(12,29,243,0.35)] hover:-translate-y-0.5 active:translate-y-0 transition-transform duration-200 cursor-pointer whitespace-nowrap"
            aria-label="Track Project Kepanitiaan"
          >
            <span className="material-symbols-outlined text-[16px] sm:text-[18px]" aria-hidden="true">
              rocket_launch
            </span>
            <span className="hidden xs:inline sm:inline">Track Project</span>
            <span className="xs:hidden inline sm:hidden">Track</span>
          </button>

          <button
            type="button"
            onClick={onOpenProfile}
            className="hidden sm:flex w-9 h-9 rounded-full bg-[#000cb8] hover:bg-[#0c1df3] text-white items-center justify-center transition-colors shadow-sm cursor-pointer"
            aria-label="Profil Akun Panitia"
            title="Info Panitia"
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
              person
            </span>
          </button>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden w-9 h-9 rounded-xl bg-[#efecff] text-[#000cb8] flex items-center justify-center cursor-pointer"
            aria-label={mobileMenuOpen ? 'Tutup Menu' : 'Buka Menu'}
            aria-expanded={mobileMenuOpen}
          >
            <span className="material-symbols-outlined text-[22px]">
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#efecff] bg-white px-6 py-4 shadow-xl animate-fadeIn">
          <nav className="flex flex-col gap-3 py-2">
            {navItems.map((item) => (
              <a
                key={item.id}
                href={item.href}
                onClick={() => {
                  setActiveSection(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`py-2 text-base font-semibold transition-colors ${
                  activeSection === item.id
                    ? 'text-[#000cb8]'
                    : 'text-[#454557] hover:text-[#000cb8]'
                }`}
              >
                {item.label}
              </a>
            ))}
            <div className="pt-3 border-t border-[#efecff] flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenProfile();
                }}
                className="w-full py-2.5 rounded-xl border border-[#efecff] text-[#454557] font-semibold text-sm text-left px-4 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px] text-[#0c1df3]">person</span>
                <span>Info Akun Panitia</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenConsultation();
                }}
                className="w-full py-3 rounded-xl bg-[#0c1df3] text-white font-bold text-sm text-center shadow-md"
              >
                Konsultasi Event Gratis
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
