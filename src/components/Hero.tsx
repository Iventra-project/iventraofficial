import { ContainerScroll } from './ui/container-scroll-animation.tsx';

interface HeroProps {
  onOpenConsultation: () => void;
  onSelectCampus?: (campus: string) => void;
  totalProjectsHandled?: string;
  totalActiveUsers?: string;
}

export default function Hero({
  onOpenConsultation
}: HeroProps) {
  const logos = [
    { name: 'BEM UI', icon: 'account_balance' },
    { name: 'TechFest Indo', icon: 'code' },
    { name: 'DevCommunity ID', icon: 'group' },
    { name: 'Himpunan Mahasiswa TI', icon: 'terminal' },
    { name: 'Silicon Youth Summit', icon: 'rocket_launch' }
  ];

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
                Buat Website Event Profesional{' '}
                <span className="relative inline-block text-blue-600">
                  Tanpa Koding,
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
                Hitungan Menit.
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed mb-8">
                Dari kompetisi kampus, hackathon hingga konferensi internasional. Luncurkan landing page elegan dengan formulir kustom, verifikasi tiket otomatis, dan manajemen peserta terintegrasi.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-8">
                <a
                  href="#dashboard"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer"
                >
                  <span>Mulai Sekarang Gratis</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </a>

                <a
                  href="#pricing"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-sm transition-all shadow-xs"
                >
                  <span className="material-symbols-outlined text-[18px] text-blue-600">tune</span>
                  <span>Pelajari Layanan</span>
                </a>
              </div>

              {/* Trust Points */}
              <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs font-medium text-slate-600">
                <div className="flex items-center gap-1.5">
                  <span className="text-blue-600 font-bold">⚡</span>
                  <span>1.250+ Event Telah Dibuat</span>
                </div>
                <span className="text-slate-300 hidden sm:inline">•</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>Setup &lt; 10 Menit</span>
                </div>
                <span className="text-slate-300 hidden sm:inline">•</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-blue-600">🔒</span>
                  <span>Terintegrasi Tiket &amp; Validasi</span>
                </div>
              </div>
            </div>
          }
        >
          {/* 3D Scrollable Card Content: Live Browser Mockup for https://hackathon-nusantara.iventra.site */}
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
                <span className="truncate">https://hackathon-nusantara.iventra.site</span>
                <span className="material-symbols-outlined text-[13px] text-slate-400 ml-auto">refresh</span>
              </div>

              <div className="flex items-center gap-1.5 text-slate-400">
                <span className="text-[10px] font-mono">100%</span>
              </div>
            </div>

            {/* Inner Live Event Page */}
            <div className="flex-1 overflow-y-auto bg-[#0b132b] text-white p-5 sm:p-7 relative">
              {/* Glow Accent */}
              <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

              {/* Mini Brand Bar */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center font-bold text-white text-xs">
                    HN
                  </div>
                  <span className="font-display font-bold text-sm tracking-tight">HN2025</span>
                </div>
                <div className="hidden sm:flex items-center gap-4 text-xs text-slate-300">
                  <span>Tentang</span>
                  <span>Timeline</span>
                  <span>Hadiah</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 font-medium border border-emerald-400/30 text-[11px]">
                    Daftar Sekarang
                  </span>
                </div>
              </div>

              {/* Grid content */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                {/* Left Col: Event Details */}
                <div className="md:col-span-7 space-y-3.5">
                  <h3 className="text-xl sm:text-2xl font-display font-extrabold text-white leading-tight">
                    Hackathon Nusantara 2025: Inovasi AI untuk Bangsa
                  </h3>

                  <p className="text-xs text-slate-300 leading-relaxed max-w-md">
                    Kompetisi pengembang software nasional terbesar dengan total hadiah 150 Juta Rupiah untuk mendorong terobosan artificial intelligence berkelanjutan.
                  </p>

                  {/* Countdown */}
                  <div className="grid grid-cols-4 gap-2 pt-1 max-w-xs">
                    {[
                      { num: '12', label: 'HARI' },
                      { num: '08', label: 'JAM' },
                      { num: '45', label: 'MENIT' },
                      { num: '20', label: 'DETIK' }
                    ].map((cd, i) => (
                      <div key={i} className="bg-white/10 backdrop-blur-md rounded-lg p-1.5 text-center border border-white/10">
                        <div className="text-sm sm:text-base font-bold font-mono text-white leading-none">{cd.num}</div>
                        <div className="text-[8px] text-slate-400 mt-0.5 font-medium">{cd.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Actions & Avatars */}
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <span className="px-3 py-1.5 rounded-lg bg-emerald-400 text-slate-950 font-bold text-xs shadow-md">
                      Registrasi Tim Anda
                    </span>
                    <span className="px-3 py-1.5 rounded-lg bg-white/10 text-white font-medium text-xs border border-white/10">
                      Buku Panduan
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <div className="flex -space-x-2">
                      <img className="w-5 h-5 rounded-full border border-slate-900 object-cover" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80" alt="avatar" />
                      <img className="w-5 h-5 rounded-full border border-slate-900 object-cover" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80" alt="avatar" />
                      <img className="w-5 h-5 rounded-full border border-slate-900 object-cover" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80" alt="avatar" />
                    </div>
                    <span className="text-[11px] text-slate-300 font-medium">
                      +482 Tim Terdaftar dari 64 Kampus
                    </span>
                  </div>
                </div>

                {/* Right Col: Live Form Card */}
                <div className="md:col-span-5 relative">
                  <div className="bg-white text-slate-900 rounded-xl p-4 shadow-xl border border-slate-100 relative">
                    {/* Floating Tooltip Pill */}
                    <div className="absolute -top-3 -right-2 bg-blue-600 text-white px-2 py-0.5 rounded-full text-[9px] font-bold shadow-lg flex items-center gap-1 border border-white">
                      <span className="material-symbols-outlined text-[11px]">qr_code_2</span>
                      <span>1-Click Tiket QR Code</span>
                    </div>

                    <h4 className="text-xs font-display font-bold text-slate-900 mb-0.5">
                      Formulir Pendaftaran
                    </h4>
                    <p className="text-[10px] text-slate-500 mb-2.5">
                      Buka hingga 25 Feb 2025 • Kuota terbatas
                    </p>

                    <div className="space-y-2 text-[11px]">
                      <div>
                        <label className="block font-medium text-slate-700 mb-0.5">
                          Nama Tim / Startup
                        </label>
                        <input
                          type="text"
                          disabled
                          value="Garuda AI Innovation"
                          className="w-full px-2 py-1 rounded border border-slate-200 bg-slate-50 text-slate-700 text-[11px]"
                        />
                      </div>

                      <div>
                        <label className="block font-medium text-slate-700 mb-0.5">
                          Email Ketua Tim
                        </label>
                        <input
                          type="text"
                          disabled
                          value="ketua@garuda-ai.id"
                          className="w-full px-2 py-1 rounded border border-slate-200 bg-slate-50 text-slate-700 text-[11px]"
                        />
                      </div>

                      <div>
                        <label className="block font-medium text-slate-700 mb-0.5">
                          Kategori Acara
                        </label>
                        <select disabled className="w-full px-2 py-1 rounded border border-slate-200 bg-slate-50 text-slate-700 text-[11px]">
                          <option>Hackathon &amp; AI Software</option>
                        </select>
                      </div>

                      <button
                        type="button"
                        disabled
                        className="w-full py-1.5 rounded-lg bg-blue-600 text-white font-bold text-xs shadow-xs mt-1"
                      >
                        Kirim Pendaftaran &amp; Dapatkan E-Tiket
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ContainerScroll>

        {/* Social Proof Partners / Logos */}
        <div className="pt-8 border-t border-slate-200/60 max-w-4xl mx-auto text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-6">
            Telah dipercaya oleh berbagai penyelenggara event &amp; kampus terkemuka
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
