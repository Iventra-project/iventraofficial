export default function ProcessSection() {
  const steps = [
    {
      num: '01',
      title: 'Pilih Template atau Request Custom',
      desc: 'Gunakan ratusan tema siap pakai untuk seminar, hackathon, konser, atau konsultasikan kebutuhan unik tim ke engineer kami.'
    },
    {
      num: '02',
      title: 'Kustomisasi Info, Form & Timeline',
      desc: 'Isi tanggal agenda, aturan pendaftaran, upload banner, dan atur alur registrasi peserta secara visual dengan cepat.'
    },
    {
      num: '03',
      title: 'Publish & Bagikan ke Calon Peserta',
      desc: 'Sebarkan link website ke Instagram, WhatsApp, dan grup panitia. Peserta langsung mendaftar dengan lancar dan terima e-tiket otomatis.'
    }
  ];

  return (
    <section className="w-full py-20 md:py-28 bg-white border-b border-slate-200/80 relative" id="process">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        {/* Section Header */}
        <div className="max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-semibold text-xs mb-3 border border-blue-200 shadow-xs">
            <span>CARA KERJA CEPAT</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-extrabold text-slate-900 tracking-tight mb-4">
            Luncurkan Dalam Tiga Langkah Mudah
          </h2>
          <p className="text-base text-slate-600 leading-relaxed font-normal">
            Daripada berminggu-minggu coding dari nol, aktifkan web event Anda dalam 5 menit.
          </p>
        </div>

        {/* 3 Step Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left mb-16">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className="bg-slate-50 rounded-2xl border border-slate-200/80 p-8 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <span className="text-4xl sm:text-5xl font-display font-extrabold text-blue-600 block mb-6">
                  {step.num}
                </span>
                <h3 className="text-xl font-display font-bold text-slate-900 mb-3">
                  {step.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {step.desc}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200/60 flex items-center gap-2 text-xs text-blue-600 font-semibold">
                <span>Langkah {idx + 1} dari 3</span>
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </div>
            </div>
          ))}
        </div>

        {/* Testimonial Quote Card matching Image 1 */}
        <div className="max-w-4xl mx-auto bg-slate-50/80 rounded-2xl border border-slate-200 p-8 sm:p-12 shadow-sm text-left relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Quote Icon Bubble */}
            <div className="w-16 h-16 rounded-2xl bg-blue-100/70 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200 shadow-2xs">
              <span className="text-4xl font-serif font-black leading-none">“</span>
            </div>

            <div className="space-y-3">
              <p className="text-base sm:text-lg text-slate-800 font-medium italic leading-relaxed">
                "Website hackathon kampus kami berhasil menampung 2.400 peserta tanpa down sedikitpun. Otomasi penutupan tiket tepat pukul 23:59 bekerja tanpa harus kami pantau tengah malam!"
              </p>
              <div>
                <span className="text-sm font-bold text-slate-900 block">
                  Danang Tri Wibowo
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  Ketua Pelaksana IT Fest &amp; Hackathon Mahasiswa
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
