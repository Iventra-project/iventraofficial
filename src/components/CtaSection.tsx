interface CtaSectionProps {
  onOpenConsultation: () => void;
}

export default function CtaSection({ onOpenConsultation }: CtaSectionProps) {
  return (
    <section className="w-full py-16 md:py-24 relative" id="hubungi">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="relative rounded-3xl bg-[#0b1739] text-white p-8 sm:p-14 md:p-16 overflow-hidden shadow-2xl border border-white/20">
          {/* Subtle decorative circular backdrop watermark */}
          <div className="absolute -right-20 -bottom-20 w-96 h-96 rounded-full bg-blue-600/30 pointer-events-none" />
          <div className="absolute right-20 -top-20 w-72 h-72 rounded-full bg-cyan-400/20 blur-2xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-semibold mb-4 backdrop-blur-sm border border-white/25">
              <span>MULAI SEKARANG</span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-extrabold tracking-tight text-white mb-4 leading-tight">
              Siap Membuat Event Anda Bersinar Lebih Profesional?
            </h2>

            <p className="text-base text-blue-100 max-w-xl leading-relaxed mb-8 font-medium">
              Buat landing page berkualitas tinggi dan percepat koordinasi kepanitiaan Anda sekarang juga. Gratis untuk event perdana.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
              <a
                href="#dashboard"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-white text-blue-700 hover:bg-blue-50 font-bold text-sm shadow-md transition-all active:scale-[0.98] cursor-pointer"
              >
                <span>Buat Website Gratis</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </a>

              <button
                type="button"
                onClick={onOpenConsultation}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm border border-white/25 transition-all cursor-pointer backdrop-blur-sm"
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
