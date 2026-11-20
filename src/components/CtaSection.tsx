interface CtaSectionProps {
  onOpenConsultation: () => void;
}

export default function CtaSection({ onOpenConsultation }: CtaSectionProps) {
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
            <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-white/70 bg-white/85 px-3 py-1 text-xs font-semibold text-blue-800">
              <span>MULAI SEKARANG</span>
            </div>

            <h2 className="mb-4 text-3xl font-display font-extrabold leading-tight tracking-tight text-[#071236] sm:text-4xl md:text-5xl">
              Siap Membuat Event Anda Bersinar Lebih Profesional?
            </h2>

            <p className="mb-8 max-w-xl text-base font-medium leading-relaxed text-[#10245a]">
              Buat landing page berkualitas tinggi dan percepat koordinasi kepanitiaan Anda sekarang juga. Gratis untuk event perdana.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
              <a
                href="#dashboard"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-7 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:bg-blue-800 active:scale-[0.98]"
              >
                <span>Buat Website Gratis</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </a>

              <button
                type="button"
                onClick={onOpenConsultation}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-900/20 bg-white/85 px-6 py-3.5 text-sm font-semibold text-[#071236] transition-all hover:bg-white"
              >
                <span>Hubungi Tim Sales</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
