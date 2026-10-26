export interface ServicesPrices {
  sparkPrice?: string;
  sparkPriceNote?: string;
  flowPrice?: string;
  flowPriceNote?: string;
  botPrice?: string;
  botPriceNote?: string;
}

interface ServicesSectionProps {
  onSelectPlan: (planId: 'spark' | 'flow' | 'bot') => void;
  prices?: ServicesPrices;
}

export default function ServicesSection({ onSelectPlan, prices }: ServicesSectionProps) {
  return (
    <section className="w-full py-20 md:py-24 bg-white" id="layanan">
      <div className="w-full max-w-7xl mx-auto px-6 md:px-12">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold text-[#0c1df3] tracking-wider uppercase">
            Layanan Kami
          </span>
          <h2 className="text-3xl md:text-4xl text-[#191930] font-bold mt-2 tracking-tight">
            Solusi Tepat Sesuai Kebutuhan Eventmu
          </h2>
          <p className="text-sm md:text-base text-[#757589] mt-2">
            Pilih paket arsitektur sistem event yang dirancang khusus untuk mahasiswa.
          </p>
        </div>

        {/* 3-Column Plan Grid with 3D Perspective */}
        <div
          className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto items-center"
          style={{ perspective: '1200px' }}
        >
          {/* Card 1: Spark */}
          <div className="bg-[#f5f2ff] rounded-3xl flex flex-col justify-between shadow-md hover:shadow-xl transition-all duration-500 p-6 md:p-8 w-full max-w-[340px] mx-auto lg:origin-right lg:[transform:rotateY(14deg)_scale(0.95)] hover:lg:[transform:rotateY(0deg)_scale(1)] border border-[#efecff]/80">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 rounded-2xl bg-[#efecff] text-[#0c1df3] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[30px]" aria-hidden="true">
                    bolt
                  </span>
                </div>
                <span className="px-3 py-1 rounded-full bg-[#efecff] text-[10px] font-bold text-[#0c1df3] uppercase tracking-wider">
                  Self-Service
                </span>
              </div>

              <h3 className="text-2xl text-[#191930] font-bold">Spark</h3>
              <p className="text-sm text-[#757589] mt-1 leading-relaxed">
                Untuk event simpel &amp; cepat tanpa repot seperti webinar, seminar, &amp; talkshow kampus.
              </p>

              <div className="my-4 py-3 border-y border-[#efecff]">
                <div className="text-xs text-[#757589] font-medium">Biaya Investasi:</div>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-xl text-[#000cb8] font-bold tracking-tight">
                    {prices?.sparkPrice || 'Rp 150rb - 300rb'}
                  </span>
                  <span className="text-xs text-[#757589]">{prices?.sparkPriceNote || '/ event'}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                <span className="px-3 py-1 rounded-full bg-[#efecff] text-xs text-[#0c1df3] font-medium">
                  Form custom
                </span>
                <span className="px-3 py-1 rounded-full bg-[#efecff] text-xs text-[#0c1df3] font-medium">
                  Pendaftaran
                </span>
                <span className="px-3 py-1 rounded-full bg-[#efecff] text-xs text-[#0c1df3] font-medium">
                  Self-service
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onSelectPlan('spark')}
              className="w-full text-center py-3.5 rounded-full bg-[#efecff] text-[#0c1df3] text-sm font-bold hover:bg-[#e8e5ff] transition-colors cursor-pointer"
            >
              Pilih Spark
            </button>
          </div>

          {/* Card 2: Flow (Marquee Highlight) */}
          <div className="relative bg-white rounded-3xl flex flex-col justify-between border-2 border-[#0c1df3] hover:-translate-y-2 transition-all duration-500 p-6 md:p-10 shadow-[0_25px_60px_-10px_rgba(12,29,243,0.38)] z-20 w-full max-w-[390px] mx-auto lg:scale-105 lg:[transform:translateZ(30px)]">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-[#0c1df3] to-[#3b47dc] text-white text-[11px] font-bold tracking-wider uppercase shadow-md whitespace-nowrap">
              Pilihan Utama
            </div>

            <div>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-[#0c1df3] to-[#3b47dc] text-white flex items-center justify-center shadow-[0_8px_20px_rgba(12,29,243,0.35)] mb-4">
                <span className="material-symbols-outlined text-[30px]" aria-hidden="true">
                  account_tree
                </span>
              </div>

              <h3 className="text-2xl text-[#191930] font-bold">Flow</h3>
              <p className="text-sm text-[#757589] mt-1 leading-relaxed">
                Untuk kompetisi &amp; event bertingkat multi-tahap dengan seleksi ketat dan penilaian terpusat.
              </p>

              <div className="my-4 py-3 border-y border-[#e8e5ff]">
                <div className="text-xs text-[#0c1df3] font-semibold">Biaya Investasi:</div>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-2xl text-[#000cb8] font-extrabold tracking-tight">
                    {prices?.flowPrice || 'Mulai Rp 500.000'}
                  </span>
                  <span className="text-xs text-[#757589] font-medium">{prices?.flowPriceNote || '/ event'}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                <span className="px-3.5 py-1.5 rounded-full bg-[#efecff] text-xs text-[#0c1df3] font-bold">
                  Dashboard
                </span>
                <span className="px-3.5 py-1.5 rounded-full bg-[#efecff] text-xs text-[#0c1df3] font-bold">
                  Penjurian
                </span>
                <span className="px-3.5 py-1.5 rounded-full bg-[#efecff] text-xs text-[#0c1df3] font-bold">
                  Sertifikat
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onSelectPlan('flow')}
              className="w-full text-center py-3.5 rounded-full bg-gradient-to-r from-[#0c1df3] to-[#3b47dc] text-white text-sm font-bold shadow-[0_8px_20px_rgba(12,29,243,0.35)] hover:-translate-y-0.5 transition-transform cursor-pointer"
            >
              Pilih Flow
            </button>
          </div>

          {/* Card 3: Bot */}
          <div className="bg-[#f5f2ff] rounded-3xl flex flex-col justify-between shadow-md hover:shadow-xl transition-all duration-500 p-6 md:p-8 w-full max-w-[340px] mx-auto lg:origin-left lg:[transform:rotateY(-14deg)_scale(0.95)] hover:lg:[transform:rotateY(0deg)_scale(1)] border border-[#efecff]/80">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-[#efecff] text-[#0c1df3] flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-[30px]" aria-hidden="true">
                  smart_toy
                </span>
              </div>

              <h3 className="text-2xl text-[#191930] font-bold">Bot</h3>
              <p className="text-sm text-[#757589] mt-1 leading-relaxed">
                WhatsApp reminder bot otomatis H-1, tiket barcode, pengingat jadwal, dan FAQ 24/7 resmi.
              </p>

              <div className="my-4 py-3 border-y border-[#efecff]">
                <div className="text-xs text-[#757589] font-medium">Biaya Investasi:</div>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-xl text-[#000cb8] font-bold tracking-tight">
                    {prices?.botPrice || 'Rp 70.000'}
                  </span>
                  <span className="text-xs text-[#757589]">{prices?.botPriceNote || '/ event'}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                <span className="px-3 py-1 rounded-full bg-[#efecff] text-xs text-[#0c1df3] font-medium">
                  Reminder
                </span>
                <span className="px-3 py-1 rounded-full bg-[#efecff] text-xs text-[#0c1df3] font-medium">
                  Auto-reply FAQ
                </span>
                <span className="px-3 py-1 rounded-full bg-[#efecff] text-xs text-[#0c1df3] font-medium">
                  Pesan sambutan
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onSelectPlan('bot')}
              className="w-full text-center py-3.5 rounded-full bg-[#efecff] text-[#0c1df3] text-sm font-bold hover:bg-[#e8e5ff] transition-colors cursor-pointer"
            >
              Pilih Bot
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
