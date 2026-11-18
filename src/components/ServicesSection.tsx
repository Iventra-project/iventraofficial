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
    <section className="w-full py-20 md:py-28 bg-[#f8fafd] border-b border-slate-200/80 relative" id="pricing">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        {/* Section Header */}
        <div className="max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-semibold text-xs mb-3 border border-blue-200 shadow-xs">
            <span>PILIH MODEL EVENT</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-extrabold text-slate-900 tracking-tight mb-4">
            Pilih Cara Anda Menjalankan Event
          </h2>
          <p className="text-base text-slate-600 leading-relaxed font-normal">
            Bisa buat sendiri secara instan dengan builder mandiri, atau percayakan sepenuhnya kepada tim expert desainer &amp; developer kami.
          </p>
        </div>

        {/* 3 Solution Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch text-left">
          {/* Plan 1: Iventra Spark */}
          <div className="bg-white rounded-2xl border border-slate-200 p-8 flex flex-col justify-between shadow-md hover:shadow-xl transition-all">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">
                  MANDIRI
                </span>
                <span className="text-xs text-slate-500 font-medium">Instan Setup</span>
              </div>

              <h3 className="text-2xl font-display font-bold text-slate-900">
                Iventra Spark
              </h3>
              <p className="text-xs text-slate-600 mt-2 min-h-[36px] leading-relaxed">
                Untuk panitia mandiri yang ingin meluncurkan website event cepat tanpa menunggu tim teknis.
              </p>

              {/* Price */}
              <div className="my-6 pb-6 border-b border-slate-100">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-display font-extrabold text-slate-900">
                    Rp 0
                  </span>
                  <span className="text-xs text-slate-500 font-medium">/ event</span>
                </div>
                <span className="text-[11px] text-emerald-600 font-medium mt-1 block">
                  ✓ Gratis selamanya untuk 1 event aktif
                </span>
              </div>

              {/* Features List */}
              <ul className="space-y-3 text-xs text-slate-700 mb-8">
                {[
                  '100+ Template Event Siap Pakai',
                  'Live Dynamic Timeline & Stages',
                  'Formulir Pendaftaran Terintegrasi',
                  'Export Data Peserta ke Excel/CSV',
                  'Subdomain iventra.site Resmi'
                ].map((feat, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-[16px] text-blue-600 shrink-0 mt-0.5">
                      check_circle
                    </span>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <a
              href="#dashboard"
              className="w-full py-3 px-4 rounded-xl border-2 border-blue-600 text-blue-600 hover:bg-blue-50 text-center font-bold text-sm transition-all"
            >
              Pakai Gratis Sekarang
            </a>
          </div>

          {/* Plan 2: Iventra Spark Pro (Featured) */}
          <div className="bg-white rounded-2xl border-2 border-blue-600 p-8 flex flex-col justify-between shadow-xl shadow-blue-500/10 relative lg:-translate-y-2">
            {/* Populer Badge */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-3.5 py-1 rounded-full text-xs font-bold shadow-md flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px]">star</span>
              <span>Paling Populer &amp; Rekomendasi</span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4 mt-1">
                <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                  SPARK PRO
                </span>
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                  Otomatisasi Penuh
                </span>
              </div>

              <h3 className="text-2xl font-display font-bold text-slate-900">
                Iventra Spark Pro
              </h3>
              <p className="text-xs text-slate-600 mt-2 min-h-[36px] leading-relaxed">
                Solusi serba otomatis dengan fitur lanjutan untuk event komersial atau berskala nasional.
              </p>

              {/* Price */}
              <div className="my-6 pb-6 border-b border-slate-100">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-display font-extrabold text-blue-600">
                    {prices?.sparkPrice || 'Rp 149.000'}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">/ event</span>
                </div>
                <span className="text-[11px] text-slate-500 font-medium mt-1 block">
                  Bayar sekali saat event dipublikasikan
                </span>
              </div>

              {/* Features List */}
              <ul className="space-y-3 text-xs text-slate-700 mb-8">
                {[
                  'Semua fitur Spark Free',
                  'Custom Domain (contoh: namaevent.com)',
                  'Sistem E-Tiket Barcode & QR Scan',
                  'WhatsApp Notifikasi Otomatis',
                  'Unlimited Form Responses & Peserta',
                  'Priority Server & Fast CDN Global'
                ].map((feat, i) => (
                  <li key={i} className="flex items-start gap-2.5 font-medium">
                    <span className="material-symbols-outlined text-[16px] text-blue-600 shrink-0 mt-0.5">
                      verified
                    </span>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <a
              href="#dashboard"
              className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-center font-bold text-sm shadow-md hover:shadow-lg transition-all"
            >
              Pilih Spark Pro →
            </a>
          </div>

          {/* Plan 3: Iventra Expert */}
          <div className="bg-white rounded-2xl border border-slate-200 p-8 flex flex-col justify-between shadow-md hover:shadow-xl transition-all">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">
                  FULL SERVICE
                </span>
                <span className="text-xs text-blue-600 font-medium">Bespoke Dev</span>
              </div>

              <h3 className="text-2xl font-display font-bold text-slate-900">
                Iventra Expert
              </h3>
              <p className="text-xs text-slate-600 mt-2 min-h-[36px] leading-relaxed">
                Percayakan seluruh website, integrasi pembayaran, hingga teknis live event pada tim engineer profesional.
              </p>

              {/* Price */}
              <div className="my-6 pb-6 border-b border-slate-100">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-display font-extrabold text-slate-900">
                    Konsultasi
                  </span>
                  <span className="text-xs text-slate-500 font-medium">/ custom brief</span>
                </div>
                <span className="text-[11px] text-blue-600 font-medium mt-1 block">
                  Proposal &amp; SLA pengerjaan dalam 24 jam
                </span>
              </div>

              {/* Features List */}
              <ul className="space-y-3 text-xs text-slate-700 mb-8">
                {[
                  'Desain Kustom Unik dari Tim Desainer UI/UX',
                  'Integrasi Payment Gateway (QRIS, BCA, VA)',
                  'Sistem Scanner QR On-Site Panitia',
                  'Custom Multi-tier Ticketing & Bundling',
                  'Dedicated Project Manager & On-Site Support'
                ].map((feat, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-[16px] text-blue-600 shrink-0 mt-0.5">
                      check_circle
                    </span>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              type="button"
              onClick={() => onSelectPlan('flow')}
              className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-center font-bold text-sm transition-all cursor-pointer"
            >
              Hubungi Tim Expert
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
