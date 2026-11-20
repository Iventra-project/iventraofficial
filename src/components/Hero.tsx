import { useMemo } from 'react';
import { ContainerScroll } from './ui/container-scroll-animation.tsx';
import SparkEventRenderer from './spark/SparkEventRenderer.tsx';
import { getTemplateById } from '../types/builder.ts';
import { useLanguage } from '../context/LanguageContext.tsx';

interface HeroProps {
  onOpenConsultation: () => void;
  onSelectCampus?: (campus: string) => void;
  totalProjectsHandled?: string;
  totalActiveUsers?: string;
}

export default function Hero({
  onOpenConsultation
}: HeroProps) {
  const { t } = useLanguage();
  const logos = [
    { name: 'BEM UI', icon: 'account_balance' },
    { name: 'TechFest Indo', icon: 'code' },
    { name: 'DevCommunity ID', icon: 'group' },
    { name: 'Himpunan Mahasiswa TI', icon: 'terminal' },
    { name: 'Silicon Youth Summit', icon: 'rocket_launch' }
  ];

  const previewConfig = useMemo(() => {
    return getTemplateById('tech-summit').defaultConfig;
  }, []);

  return (
    <section
      id="overview"
      className="relative w-full pt-20 pb-16 md:pb-24 overflow-hidden border-b border-slate-200/80"
      style={{
        backgroundImage: `url('/assets/bg/BackgroundIventra_Web2.svg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'top center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <ContainerScroll
          titleComponent={
            <div className="flex flex-col items-center justify-center text-center max-w-4xl mx-auto pb-4">
              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-extrabold text-slate-900 tracking-tight leading-[1.12] mb-6">
                {t.hero.headline1}{' '}
                <span className="relative inline-block text-blue-600">
                  {t.hero.headlineHighlight}
                  <svg
                    className="absolute -bottom-2 left-0 w-full h-3 text-emerald-500 overflow-visible"
                    viewBox="0 0 250 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M3 8.5C65 2.5 185 2 247 9.5"
                      stroke="currentColor"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>{' '}
                {t.hero.headline2}
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed mb-8">
                {t.hero.subtitle}
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-8">
                <a
                  href="#dashboard"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer"
                >
                  <span>{t.hero.ctaPrimary}</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </a>

                <a
                  href="#pricing"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-sm transition-all shadow-xs"
                >
                  <span className="material-symbols-outlined text-[18px] text-blue-600">tune</span>
                  <span>{t.hero.ctaSecondary}</span>
                </a>
              </div>

              {/* Trust Points */}
              <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs font-medium text-slate-600">
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>{t.hero.trustSetup}</span>
                </div>
                <span className="text-slate-300 hidden sm:inline">•</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-blue-600">🔒</span>
                  <span>{t.hero.trustTicket}</span>
                </div>
              </div>
            </div>
          }
        >
          {/* 3D Scrollable Card Content: Live Browser Mockup with Authentic Iventra Spark Website */}
          <div className="h-full w-full flex flex-col bg-white overflow-hidden text-left shadow-inner">
            {/* Browser Top Header */}
            <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-400 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block" />
              </div>

              <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-white border border-slate-200 text-slate-600 font-mono text-[11px] max-w-sm sm:max-w-md w-full justify-center shadow-2xs">
                <span className="material-symbols-outlined text-[13px] text-slate-400">lock</span>
                <span className="truncate">https://tech-summit.iventra.site</span>
                <span className="material-symbols-outlined text-[13px] text-slate-400 ml-auto">refresh</span>
              </div>

              <div className="flex items-center gap-1.5 text-slate-400">
                <span className="text-[10px] font-mono">100%</span>
              </div>
            </div>

            {/* Inner Live Event Page rendered via SparkEventRenderer */}
            <div className="flex-1 overflow-y-auto bg-slate-50 text-slate-900 relative">
              <SparkEventRenderer config={previewConfig} isPreviewMode={true} />
            </div>
          </div>
        </ContainerScroll>

        {/* Social Proof Partners / Logos */}
        <div className="pt-8 border-t border-slate-200/60 max-w-4xl mx-auto text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-6">
            {t.hero.trustedBy}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-slate-600">
            {logos.map((logo, i) => (
              <div key={i} className="flex items-center gap-2 hover:text-blue-600 transition-colors">
                <span className="material-symbols-outlined text-[20px] text-blue-500">{logo.icon}</span>
                <span className="text-sm font-semibold tracking-tight">{logo.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
