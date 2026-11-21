import { useState, type FormEvent } from 'react';
import { useLanguage } from '../context/LanguageContext.tsx';
import { ScrollReveal } from './ui/ScrollReveal.tsx';
import {
  Instagram,
  Mail,
  Send,
  Check
} from 'lucide-react';

interface FooterProps {
  onOpenConsultation: () => void;
  onOpenTerms: (type: 'terms' | 'privacy') => void;
  onOpenAdmin?: () => void;
}

export default function Footer({ onOpenConsultation, onOpenTerms, onOpenAdmin }: FooterProps) {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) return;
    setSubscribed(true);
    setTimeout(() => {
      setEmail('');
      setSubscribed(false);
    }, 3500);
  };

  const handleScrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <footer className="w-full border-t border-slate-200 bg-white pt-14 pb-10 text-slate-600 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal yOffset={24} duration={0.65}>
          {/* Main 4-Column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 pb-12">
          {/* Column 1: Stay Connected (Newsletter) */}
          <div className="lg:col-span-4 space-y-4">
            <h3 className="text-2xl sm:text-3xl font-display font-extrabold tracking-tight text-slate-900 leading-tight">
              {t.footer.stayConnected.split(' ')[0]}<br />{t.footer.stayConnected.split(' ').slice(1).join(' ')}
            </h3>
            <p className="text-sm text-slate-500 leading-relaxed max-w-sm">
              {t.footer.newsletterDesc}
            </p>

            <form onSubmit={handleSubscribe} className="pt-2 max-w-sm">
              <div className="relative flex items-center rounded-xl border border-slate-200 bg-white p-1.5 shadow-2xs transition-all focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={subscribed ? (t.footer.contactUs === 'Contact Us' ? "Thank you for joining!" : "Terima kasih telah bergabung!") : "Enter your email"}
                  disabled={subscribed}
                  required
                  className="w-full bg-transparent px-3 py-1.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none"
                />
                <button
                  type="submit"
                  disabled={subscribed}
                  aria-label="Kirim Langganan Newsletter"
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-white transition-all shrink-0 cursor-pointer ${
                    subscribed
                      ? 'bg-emerald-500 hover:bg-emerald-600'
                      : 'bg-slate-900 hover:bg-blue-600 active:scale-90'
                  }`}
                >
                  {subscribed ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Send className="h-3.5 w-3.5 -translate-x-0.5" />
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Column 2: Quick Links */}
          <div className="lg:col-span-3 space-y-3.5">
            <h4 className="text-base font-display font-bold text-slate-900">
              {t.footer.quickLinks}
            </h4>
            <ul className="space-y-2.5 text-slate-600">
              <li>
                <button
                  type="button"
                  onClick={() => handleScrollTo('overview')}
                  className="hover:text-blue-600 transition-colors cursor-pointer"
                >
                  {t.footer.home}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleScrollTo('pricing')}
                  className="hover:text-blue-600 transition-colors cursor-pointer"
                >
                  {t.nav.services}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleScrollTo('features')}
                  className="hover:text-blue-600 transition-colors cursor-pointer"
                >
                  {t.nav.features}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleScrollTo('process')}
                  className="hover:text-blue-600 transition-colors cursor-pointer"
                >
                  {t.nav.process}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenConsultation}
                  className="hover:text-blue-600 transition-colors cursor-pointer"
                >
                  {t.footer.contactBtn}
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Contact Us */}
          <div className="lg:col-span-3 space-y-3.5">
            <h4 className="text-base font-display font-bold text-slate-900">
              {t.footer.contactUs}
            </h4>
            <div className="space-y-2.5 text-slate-600 text-sm leading-relaxed">
              <p>
                <span className="text-slate-800 font-medium">Phone:</span>{' '}
                <a
                  href="https://wa.me/6285850881664"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-blue-600 transition-colors"
                >
                  085850881664
                </a>
              </p>
              <p>
                <span className="text-slate-800 font-medium">Email:</span>{' '}
                <a
                  href="mailto:eventra.work@gmail.com"
                  className="hover:text-blue-600 transition-colors"
                >
                  eventra.work@gmail.com
                </a>
              </p>
            </div>
          </div>

          {/* Column 4: Follow Us */}
          <div className="lg:col-span-2 space-y-5">
            <div>
              <h4 className="text-base font-display font-bold text-slate-900 mb-3.5">
                {t.footer.followUs}
              </h4>
              <div className="flex items-center gap-2.5">
                <a
                  href="https://www.instagram.com/iventra.id/"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Instagram Iventra"
                  title="Instagram @iventra.id"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-700 transition-all hover:border-blue-600 hover:text-blue-600 hover:bg-blue-50/50"
                >
                  <Instagram className="h-4 w-4" />
                </a>
                <a
                  href="mailto:eventra.work@gmail.com"
                  aria-label="Email Iventra"
                  title="Email eventra.work@gmail.com"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-700 transition-all hover:border-blue-600 hover:text-blue-600 hover:bg-blue-50/50"
                >
                  <Mail className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Legal */}
        <div className="border-t border-slate-200/80 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Iventra Event Platform. {t.footer.rights}</p>

          <div className="flex flex-wrap items-center gap-6">
            <button
              type="button"
              onClick={() => onOpenTerms('privacy')}
              className="hover:text-blue-600 transition-colors cursor-pointer"
            >
              {t.footer.privacy}
            </button>
            <button
              type="button"
              onClick={() => onOpenTerms('terms')}
              className="hover:text-blue-600 transition-colors cursor-pointer"
            >
              {t.footer.terms}
            </button>
            <button
              type="button"
              onClick={() => alert("Cookie settings optimized.")}
              className="hover:text-blue-600 transition-colors cursor-pointer"
            >
              {t.footer.cookie}
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
        </ScrollReveal>
      </div>
    </footer>
  );
}
