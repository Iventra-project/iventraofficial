import { useLanguage } from '../context/LanguageContext.tsx';

interface CtaSectionProps {
  onOpenConsultation: () => void;
}

export default function CtaSection({ onOpenConsultation }: CtaSectionProps) {
  const { t } = useLanguage();

  return (
    <section className="w-full py-16 md:py-24 relative" id="hubungi">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div
          className="relative overflow-hidden rounded-3xl border border-white/20 bg-cover bg-center p-8 text-white shadow-2xl sm:p-14 md:p-16"
          style={{
            backgroundImage: "url('/assets/bg/BackgroundIventra_web1.svg')"
          }}
        >

          <div className="relative z-10 max-w-2xl text-left">
            <h2 className="mb-4 text-3xl font-display font-extrabold leading-tight tracking-tight text-[#071236] sm:text-4xl md:text-5xl">
              {t.cta.title}
            </h2>

            <p className="mb-8 max-w-xl text-base font-medium leading-relaxed text-[#10245a]">
              {t.cta.description}
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
              <a
                href="#pricing"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-7 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:bg-blue-800 active:scale-[0.98]"
              >
                <span>{t.cta.btnStart}</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </a>

              <button
                type="button"
                onClick={onOpenConsultation}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-900/20 bg-white/85 px-6 py-3.5 text-sm font-semibold text-[#071236] transition-all hover:bg-white cursor-pointer"
              >
                <span>{t.cta.btnConsult}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
