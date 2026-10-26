export default function ComparisonSection() {
  const comparisonRows = [
    {
      feature: 'Tampilan Acara',
      ordinary: 'Tampilan generik dan kaku, tanpa personalisasi',
      iventra: 'Branding custom eksklusif kampus, landing page estetik',
      isOdd: false
    },
    {
      feature: 'Manajemen Panitia',
      ordinary: 'Tidak ada dashboard manajemen terpadu',
      iventra: 'Dashboard panitia terintegrasi real-time, pantau kuota seketika',
      isOdd: true
    },
    {
      feature: 'Alur Perlombaan',
      ordinary: 'Hanya satu tahap sederhana, menyulitkan flow seleksi',
      iventra: 'Multi-tahap mulus: daftar, seleksi berkas, pengumuman final',
      isOdd: false
    },
    {
      feature: 'Notifikasi Peserta',
      ordinary: 'Manual lewat chat satu per satu, rawan terlewat',
      iventra: 'Reminder WhatsApp otomatis & terjadwal langsung ke nomor peserta',
      isOdd: true
    },
    {
      feature: 'Laporan & LPJ',
      ordinary: 'Rekap spreadsheet manual membingungkan dan rawan typo',
      iventra: 'Sertifikat dan laporan otomatis 1-klik siap lampiran LPJ',
      isOdd: false
    }
  ];

  return (
    <section className="w-full py-20 md:py-24 bg-white" id="kelebihan">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold text-[#0c1df3] tracking-wider uppercase">
            Kelebihan Kami
          </span>
          <h2 className="text-3xl md:text-4xl text-[#191930] font-bold mt-2 tracking-tight">
            Kenapa Iventra?
          </h2>
          <p className="text-sm md:text-base text-[#757589] mt-2">
            Tinggalkan cara konvensional yang menguras waktu dan tenaga panitia.
          </p>
        </div>

        {/* Table Comparison Container */}
        <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-[0_8px_32px_-4px_rgba(12,29,243,0.08)] border border-[#efecff] overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 bg-[#e8e5ff]/80 p-4 md:px-6 text-sm font-semibold border-b border-[#efecff]">
            <div className="col-span-4 text-[#454557] font-bold">Fitur &amp; Kebutuhan</div>
            <div className="col-span-4 text-[#757589] font-semibold">Platform Biasa</div>
            <div className="col-span-4 text-[#000cb8] font-bold flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-[#0c1df3]">
                verified
              </span>
              <span>Iventra</span>
            </div>
          </div>

          {/* Table Rows */}
          {comparisonRows.map((row, index) => (
            <div
              key={row.feature}
              className={`grid grid-cols-12 items-center p-4 md:px-6 transition-colors ${
                row.isOdd ? 'bg-[#f5f2ff]/40' : 'bg-white'
              } ${index < comparisonRows.length - 1 ? 'border-b border-[#efecff]' : ''}`}
            >
              <div className="col-span-4 text-xs md:text-sm text-[#191930] font-bold pr-2">
                {row.feature}
              </div>
              <div className="col-span-4 text-xs md:text-sm text-[#757589] flex items-start gap-2 pr-2">
                <span className="text-[#ba1a1a] font-black text-sm shrink-0">✕</span>
                <span className="leading-snug">{row.ordinary}</span>
              </div>
              <div className="col-span-4 text-xs md:text-sm text-[#000cb8] font-bold flex items-start gap-2">
                <span className="text-emerald-600 font-black text-sm shrink-0">✓</span>
                <span className="leading-snug">{row.iventra}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
