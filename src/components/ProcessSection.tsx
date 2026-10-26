export default function ProcessSection() {
  const steps = [
    {
      num: '01',
      title: 'Konsultasi',
      desc: 'Bahas kebutuhan & format eventmu bersama tim spesialis kami.'
    },
    {
      num: '02',
      title: 'Setup & Branding',
      desc: 'Sistem kustom siap rilis dalam 24 jam dengan visual identitas acaramu.'
    },
    {
      num: '03',
      title: 'Event Berjalan',
      desc: 'Presensi & notifikasi lancar otomatis tanpa hambatan antrean.'
    },
    {
      num: '04',
      title: 'Laporan',
      desc: 'Data LPJ & e-sertifikat instan terkirim rapi ke seluruh peserta.'
    }
  ];

  return (
    <section className="w-full py-20 md:py-24 bg-white" id="alur">
      <div className="w-full max-w-7xl mx-auto px-6 md:px-12">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold text-[#0c1df3] tracking-wider uppercase">
            Alur Layanan Kita
          </span>
          <h2 className="text-3xl md:text-4xl text-[#191930] font-bold mt-2 tracking-tight">
            4 Langkah Mudah Kolaborasi
          </h2>
          <p className="text-sm md:text-base text-[#757589] mt-2">
            Dari awal perencanaan hingga evaluasi selesai dengan alur terstruktur.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Horizontal Connecting Line on desktop */}
          <div
            className="hidden lg:block absolute top-7 left-14 right-14 h-0.5 bg-[#efecff] -z-0"
            aria-hidden="true"
          />

          {steps.map((step) => (
            <div
              key={step.num}
              className="relative z-10 flex flex-col items-start bg-[#f5f2ff] p-6 rounded-2xl border border-[#efecff]/70 hover:shadow-md hover:-translate-y-1 transition-all duration-300"
            >
              <div className="w-14 h-14 rounded-full bg-gradient-to-r from-[#0c1df3] to-[#3b47dc] text-white text-xl font-black flex items-center justify-center shadow-[0_8px_20px_rgba(12,29,243,0.3)] mb-4 shrink-0">
                {step.num}
              </div>
              <h4 className="text-lg text-[#191930] font-bold tracking-tight">
                {step.title}
              </h4>
              <p className="text-sm text-[#757589] mt-1 leading-relaxed">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
