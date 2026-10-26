interface CtaSectionProps {
  onOpenConsultation: () => void;
}

export default function CtaSection({ onOpenConsultation }: CtaSectionProps) {
  return (
    <section className="w-full py-16 md:py-20 bg-white">
      <div className="w-full max-w-7xl mx-auto px-6 md:px-12">
        <div className="w-full rounded-3xl bg-gradient-to-r from-[#0c1df3] to-[#3b47dc] p-8 md:p-14 shadow-[0_20px_50px_-8px_rgba(12,29,243,0.35)] relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-white text-left max-w-2xl">
            <span className="inline-block px-3.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold mb-4 text-white">
              Mulai Sekarang
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-[40px] font-extrabold leading-tight tracking-tight text-white">
              Siap bikin eventmu naik level?
            </h2>
            <p className="text-base md:text-lg text-white/90 mt-3 leading-relaxed">
              Konsultasi gratis format pendaftaran, alur seleksi, dan demo bot reminder langsung dengan tim kami.
            </p>
          </div>

          <div>
            <button
              type="button"
              onClick={onOpenConsultation}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-[#0c1df3] text-sm font-bold shadow-lg hover:scale-105 active:scale-100 transition-transform duration-200 whitespace-nowrap cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                chat
              </span>
              <span>Hubungi Kami</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
