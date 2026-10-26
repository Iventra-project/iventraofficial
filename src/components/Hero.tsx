import { useState } from 'react';

interface HeroProps {
  onOpenConsultation: () => void;
  onSelectCampus?: (campus: string) => void;
  totalProjectsHandled?: string;
  totalActiveUsers?: string;
}

export default function Hero({
  onOpenConsultation,
  onSelectCampus,
  totalProjectsHandled = '120+',
  totalActiveUsers = '15.000+'
}: HeroProps) {
  const [selectedCampus, setSelectedCampus] = useState<string | null>(null);

  const campuses = [
    { name: 'BEM FT UI', stat: '1.420 Peserta', event: 'Career Expo' },
    { name: 'BEM KM UGM', stat: '450 Tim', event: 'Business Case Comp' },
    { name: 'HIMA ITB', stat: '680 Mahasiswa', event: 'Informatics Summit' },
    { name: 'BEM UNAIR', stat: '950 Peserta', event: 'National Olympiad' },
    { name: 'TEDx Kampus', stat: '820 Tiket', event: 'Youth Conference' },
    { name: 'Olimpiade Ilmiah', stat: '1.200 Peserta', event: 'Sains & Riset' }
  ];

  const handleCampusClick = (name: string) => {
    setSelectedCampus(selectedCampus === name ? null : name);
    if (onSelectCampus) {
      onSelectCampus(name);
    }
  };

  return (
    <section className="relative w-full pt-16 pb-12 md:pt-24 md:pb-16 overflow-hidden bg-white">
      {/* Radiant Glow Behind Mockup */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/4 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[550px] rounded-full blur-3xl opacity-60 bg-gradient-to-tr from-[#e0e0ff] to-[#e2dfff]"
        aria-hidden="true"
      />

      <div className="w-full max-w-6xl mx-auto px-6 md:px-12 lg:px-16 flex flex-col items-center text-center relative z-10">
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16 py-4 md:py-6">
          {/* Left Column: Value Proposition */}
          <div className="flex flex-col items-start text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#f5f2ff] border border-[#e8e5ff]/50 shadow-xs mb-4">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0c1df3] animate-pulse" />
              <span className="text-xs text-[#0c1df3] font-bold tracking-wide">
                Platform Event Kampus No. 1 di Indonesia
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-[44px] lg:leading-[52px] text-[#191930] font-extrabold tracking-tight mb-4 text-balance">
              Events <span className="text-[#000cb8]">Made Easy</span>, Not Messy.
            </h1>

            <p className="text-base sm:text-lg text-[#757589] max-w-xl mb-6 leading-relaxed">
              Kelola pendaftaran, seleksi lomba, dan notifikasi peserta otomatis untuk kepanitiaan kampus modern.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={onOpenConsultation}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-gradient-to-r from-[#0c1df3] to-[#3b47dc] text-white text-sm font-bold shadow-[0_12px_28px_-4px_rgba(12,29,243,0.38)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">chat</span>
                <span>Hubungi Kami</span>
              </button>

              <a
                href="#layanan"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-white text-[#0c1df3] text-sm font-bold shadow-xs border border-[#efecff] hover:bg-[#f5f2ff] transition-all duration-200"
              >
                <span>Layanan Kami</span>
                <span className="material-symbols-outlined text-[18px]">arrow_downward</span>
              </a>
            </div>
          </div>

          {/* Right Column: Live Mockup Dashboard */}
          <div className="w-full flex justify-center lg:justify-end">
            <div className="w-full max-w-sm rounded-2xl bg-white shadow-[0_20px_50px_-8px_rgba(12,29,243,0.14)] border border-[#efecff] overflow-hidden transition-all duration-300 hover:shadow-[0_25px_60px_-6px_rgba(12,29,243,0.2)]">
              {/* Browser Window Header */}
              <div className="px-4 py-3 bg-[#f5f2ff]/70 border-b border-[#efecff] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#FF5F56] inline-block shadow-xs" />
                  <span className="w-3 h-3 rounded-full bg-[#FFBD2E] inline-block shadow-xs" />
                  <span className="w-3 h-3 rounded-full bg-[#27C93F] inline-block shadow-xs" />
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-[#efecff] shadow-xs text-[#757589] text-[11px] font-medium max-w-xs mx-auto">
                  <span className="material-symbols-outlined text-[14px] text-emerald-600">lock</span>
                  <span className="text-[#454557] font-medium">iventra.id/live-metrics</span>
                </div>
                <div className="w-8 flex justify-end text-[#757589]">
                  <span className="material-symbols-outlined text-[16px]">more_vert</span>
                </div>
              </div>

              {/* Window Body Cards */}
              <div className="p-5 md:p-6 bg-white">
                <div className="flex flex-col gap-4 items-stretch">
                  {/* Metric 1 */}
                  <div className="bg-[#f5f2ff]/70 p-4 rounded-2xl border border-[#efecff] flex items-center gap-3 text-left hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#0c1df3] to-[#3b47dc] text-white flex items-center justify-center shadow-[0_8px_20px_-2px_rgba(12,29,243,0.3)] shrink-0">
                      <span className="material-symbols-outlined text-[24px]">rocket_launch</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-2xl text-[#191930] font-extrabold tracking-tight tabular-nums">
                          {totalProjectsHandled}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-600/10 text-emerald-600 text-[10px] font-bold">
                          Verified
                        </span>
                      </div>
                      <div className="text-xs text-[#757589] mt-0.5 font-medium">
                        Project Ditangani
                      </div>
                    </div>
                  </div>

                  {/* Metric 2 */}
                  <div className="bg-[#f5f2ff]/70 p-4 rounded-2xl border border-[#efecff] flex items-center gap-3 text-left hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#0c1df3] to-[#3b47dc] text-white flex items-center justify-center shadow-[0_8px_20px_-2px_rgba(12,29,243,0.3)] shrink-0">
                      <span className="material-symbols-outlined text-[24px]">groups</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-2xl text-[#191930] font-extrabold tracking-tight tabular-nums">
                          {totalActiveUsers}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#0c1df3]/10 text-[#000cb8] text-[10px] font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#0c1df3] animate-pulse" />
                          Live
                        </span>
                      </div>
                      <div className="text-xs text-[#757589] mt-0.5 font-medium">
                        Total User Aktif
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Social Proof Badges */}
        <div className="w-full max-w-4xl text-center">
          <span className="text-xs text-[#454557] uppercase tracking-wider block mb-4 font-bold">
            Dipercaya oleh Organisasi &amp; Komunitas Kampus
          </span>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {campuses.map((c) => {
              const isActive = selectedCampus === c.name;
              return (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => handleCampusClick(c.name)}
                  className={`px-5 py-2.5 rounded-2xl border transition-all duration-200 cursor-pointer text-sm font-bold shadow-xs hover:-translate-y-0.5 flex items-center gap-2 ${
                    isActive
                      ? 'bg-[#000cb8] border-[#000cb8] text-white shadow-md'
                      : 'bg-[#f5f2ff] border-[#efecff] text-[#191930] hover:border-[#0c1df3]/30'
                  }`}
                  aria-pressed={isActive}
                >
                  <span>{c.name}</span>
                  {isActive && (
                    <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded-full text-white font-medium">
                      {c.stat}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {selectedCampus && (
            <div className="mt-4 inline-block bg-[#f5f2ff] border border-[#e8e5ff] px-4 py-2 rounded-xl text-xs text-[#000cb8] font-medium animate-fadeIn">
              💡 {selectedCampus} menggunakan Iventra untuk memanage {campuses.find(c => c.name === selectedCampus)?.event} dengan {campuses.find(c => c.name === selectedCampus)?.stat}.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
