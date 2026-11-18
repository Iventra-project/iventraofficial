export default function ComparisonSection() {
  return (
    <section
      className="w-full py-20 md:py-28 relative overflow-hidden text-white"
      style={{
        backgroundImage: `url('/assets/bg/section-bg-blue.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
      id="features"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="max-w-2xl mb-16 text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white font-semibold text-xs mb-3 border border-white/30 backdrop-blur-sm shadow-xs">
            <span>FITUR KHUSUS EVENT</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-extrabold text-white tracking-tight mb-4 drop-shadow-xs">
            Dibangun Khusus untuk Alur Kerja Kepanitiaan Nyata
          </h2>
          <p className="text-base text-blue-100 leading-relaxed font-medium">
            Bukan web builder umum. Setiap modul dirancang khusus menjawab kebutuhan kepanitiaan event di Indonesia.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
          {/* Card 1: Timeline-Driven Visibility (Col 7) */}
          <div className="md:col-span-7 bg-white rounded-2xl border border-white/60 p-8 shadow-xl flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-6 shadow-md shadow-blue-500/20">
                <span className="material-symbols-outlined text-[24px]">schedule</span>
              </div>
              <h3 className="text-2xl font-display font-bold text-slate-900 mb-2">
                Timeline-Driven Visibility
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed max-w-lg mb-8">
                Konten dan tombol registrasi otomatis berganti saat fase event berpindah. Tidak perlu begadang untuk tutup form manual saat midnight.
              </p>
            </div>

            {/* Stages interactive preview */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 grid grid-cols-3 gap-3 text-left">
              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Fase 1</span>
                <span className="text-xs font-bold text-slate-700 block mt-0.5 truncate">Pendaftaran</span>
                <span className="text-[10px] text-emerald-600 font-semibold">✓ Selesai</span>
              </div>
              <div className="bg-blue-50/80 p-3 rounded-lg border border-blue-200 shadow-2xs relative">
                <span className="text-[10px] font-bold text-blue-600 block uppercase">Fase 2</span>
                <span className="text-xs font-bold text-blue-900 block mt-0.5 truncate">Seleksi Proposal</span>
                <span className="text-[10px] text-blue-700 font-bold">● Aktif Sekarang</span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs opacity-75">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Fase 3</span>
                <span className="text-xs font-bold text-slate-700 block mt-0.5 truncate">Grand Final</span>
                <span className="text-[10px] text-slate-400 font-medium">🔒 Terjadwal</span>
              </div>
            </div>
          </div>

          {/* Card 2: Integrated Forms (Col 5) */}
          <div className="md:col-span-5 bg-white rounded-2xl border border-white/60 p-8 shadow-xl flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center mb-6 shadow-md shadow-emerald-500/20">
                <span className="material-symbols-outlined text-[24px]">assignment</span>
              </div>
              <h3 className="text-2xl font-display font-bold text-slate-900 mb-2">
                Integrated Forms
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                Formulir pendaftaran cerdas bawaan dengan validasi berkas, upload proposal, dan link drive otomatis tanpa perlu Google Forms terpisah.
              </p>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Kustomisasi Field &amp; Syarat</span>
              <span className="text-blue-600 font-bold inline-flex items-center gap-1">
                <span>Pilihan Jenis Tiket / Form</span>
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </span>
            </div>
          </div>

          {/* Card 3: QR Ticket Ready (Col 5) */}
          <div className="md:col-span-5 bg-white rounded-2xl border border-white/60 p-8 shadow-xl flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-6 shadow-md shadow-blue-500/20">
                <span className="material-symbols-outlined text-[24px]">qr_code_2</span>
              </div>
              <h3 className="text-2xl font-display font-bold text-slate-900 mb-2">
                QR Ticket Ready
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                Setiap pendaftar otomatis mendapatkan tiket unik dengan barcode QR yang siap di-scan saat registrasi ulang offline di gate masuk.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-blue-600 text-[20px]">verified</span>
                <span className="text-xs font-semibold text-slate-800">Presisi 0.5 Detik per Scan</span>
              </div>
              <span className="text-[11px] font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                VALID
              </span>
            </div>
          </div>

          {/* Card 4: Real-time Visitor & Conversion Analytics (Col 7) */}
          <div className="md:col-span-7 bg-white rounded-2xl border border-white/60 p-8 shadow-xl flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-6 shadow-md shadow-blue-500/20">
                  <span className="material-symbols-outlined text-[24px]">trending_up</span>
                </div>
                <h3 className="text-2xl font-display font-bold text-slate-900 mb-2">
                  Real-time Visitor &amp; Conversion Analytics
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed max-w-md">
                  Pantau berapa pengunjung yang melihat poster, membuka web, dan mengisi form secara real-time tanpa setup Google Analytics yang rumit.
                </p>
              </div>

              <div className="text-right">
                <span className="text-3xl font-display font-extrabold text-blue-600 block">
                  84.2%
                </span>
                <span className="text-[10px] text-slate-500 font-medium">Rata-rata Konversi Form</span>
              </div>
            </div>

            {/* Sparkline curve */}
            <div className="mt-8 pt-4 border-t border-slate-100">
              <div className="h-14 w-full">
                <svg viewBox="0 0 500 60" className="w-full h-full" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="curveGradientFeatures" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M0,50 Q60,45 120,38 T240,25 T360,12 T480,8 L500,6 L500,60 L0,60 Z"
                    fill="url(#curveGradientFeatures)"
                  />
                  <path
                    d="M0,50 Q60,45 120,38 T240,25 T360,12 T480,8 L500,6"
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="3"
                  />
                  <circle cx="360" cy="12" r="5" fill="#2563eb" stroke="#ffffff" strokeWidth="2" />
                  <circle cx="500" cy="6" r="5" fill="#2563eb" stroke="#ffffff" strokeWidth="2" />
                </svg>
              </div>
              <div className="flex justify-between text-[10px] text-slate-600 font-mono mt-1">
                <span>Senin</span>
                <span>Rabu</span>
                <span>Jumat</span>
                <span className="font-bold text-blue-700">Puncak (Minggu)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
