import Logo from './Logo.tsx';

interface FooterProps {
  onOpenConsultation: () => void;
  onOpenTerms: (type: 'terms' | 'privacy') => void;
  onOpenAdmin?: () => void;
}

export default function Footer({ onOpenConsultation, onOpenTerms, onOpenAdmin }: FooterProps) {
  return (
    <footer className="w-full bg-gradient-to-r from-[#0c1df3] to-[#3b47dc] text-white py-16">
      <div className="w-full max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-12">
          {/* Brand Info */}
          <div className="md:col-span-6 text-left">
            <div className="flex items-center gap-2.5 mb-3">
              <Logo size="sm" className="bg-white/10" />
              <span className="text-2xl font-extrabold text-white tracking-tight">
                Iventra
              </span>
            </div>
            <p className="text-sm md:text-base text-white/80 max-w-sm leading-relaxed">
              Platform Event Mahasiswa &amp; Komunitas Indonesia. Menghadirkan solusi digital efisien dari hulu ke hilir.
            </p>
          </div>

          {/* Navigation Links */}
          <div className="md:col-span-3 text-left">
            <span className="text-sm font-bold text-white block mb-3 uppercase tracking-wider">
              Navigasi
            </span>
            <ul className="space-y-2.5 text-sm text-white/80">
              <li>
                <a href="#layanan" className="hover:text-white transition-colors">
                  Layanan
                </a>
              </li>
              <li>
                <a href="#kelebihan" className="hover:text-white transition-colors">
                  Kelebihan
                </a>
              </li>
              <li>
                <a href="#alur" className="hover:text-white transition-colors">
                  Alur Layanan
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-white transition-colors">
                  FAQ
                </a>
              </li>
              {onOpenAdmin && (
                <li>
                  <button
                    type="button"
                    onClick={onOpenAdmin}
                    className="hover:text-white transition-colors text-white/90 font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[14px]">admin_panel_settings</span>
                    <span>Dashboard Admin (SQLite)</span>
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* Help & Contact */}
          <div className="md:col-span-3 text-left">
            <span className="text-sm font-bold text-white block mb-3 uppercase tracking-wider">
              Bantuan &amp; Kontak
            </span>
            <ul className="space-y-2.5 text-sm text-white/80">
              <li>
                <button
                  type="button"
                  onClick={onOpenConsultation}
                  className="hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer text-left"
                >
                  <span className="material-symbols-outlined text-[16px]">chat</span>
                  <span>Chat WhatsApp Panitia</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenTerms('terms')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Syarat &amp; Ketentuan Layanan
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenTerms('privacy')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Kebijakan Privasi Data
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-white/70 text-xs sm:text-sm border-t border-white/10">
          <span>&copy; 2025 Iventra. Hak Cipta Dilindungi.</span>
          <span className="mt-2 sm:mt-0">
            Dibuat khusus untuk ekosistem mahasiswa Indonesia.
          </span>
        </div>
      </div>
    </footer>
  );
}
