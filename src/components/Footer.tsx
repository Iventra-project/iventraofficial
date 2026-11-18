import Logo from './Logo.tsx';

interface FooterProps {
  onOpenConsultation: () => void;
  onOpenTerms: (type: 'terms' | 'privacy') => void;
  onOpenAdmin?: () => void;
}

export default function Footer({ onOpenConsultation, onOpenTerms, onOpenAdmin }: FooterProps) {
  return (
    <footer className="w-full bg-white border-t border-slate-200 py-10 text-slate-600 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Brand & Copyright */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Logo size="sm" />
              <span className="font-display font-bold text-slate-900 text-sm tracking-tight">
                IVENTRA
              </span>
            </div>
            <span className="text-slate-300 hidden sm:inline">•</span>
            <span className="text-slate-500">
              © {new Date().getFullYear()} Iventra Event Platform. All rights reserved.
            </span>
          </div>

          {/* Links */}
          <div className="flex flex-wrap items-center gap-6 font-medium text-slate-500">
            <button
              type="button"
              onClick={() => onOpenTerms('privacy')}
              className="hover:text-blue-600 transition-colors cursor-pointer"
            >
              Privacy Policy
            </button>
            <button
              type="button"
              onClick={() => onOpenTerms('terms')}
              className="hover:text-blue-600 transition-colors cursor-pointer"
            >
              Terms of Service
            </button>
            <button
              type="button"
              onClick={onOpenConsultation}
              className="hover:text-blue-600 transition-colors cursor-pointer"
            >
              Kontak Kami
            </button>
            {onOpenAdmin && (
              <button
                type="button"
                onClick={onOpenAdmin}
                className="hover:text-slate-900 transition-colors font-mono cursor-pointer"
                title="Akses Konsol Admin"
              >
                Admin
              </button>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
