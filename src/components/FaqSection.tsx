import { useState } from 'react';

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Berapa biaya implementasi sistem di Iventra?',
      a: 'Struktur biaya kami dirancang proporsional dengan skala organisasi mahasiswa. Tersedia opsi Spark (mulai dari Rp 99.000 / event flat), Custom Flow untuk seleksi bertahap, dan add-on WhatsApp Gateway tanpa komitmen langganan tahunan.'
    },
    {
      q: 'Bagaimana kapasitas dan reliabilitas saat pendaftaran serentak (war tiket)?',
      a: 'Arsitektur backend Iventra dioptimasi untuk konkurensi tinggi dengan response time <100ms. Sistem mengunci kuota pendaftaran secara atomik sehingga mencegah over-capacity dan freeze saat ribuan peserta submit serentak.'
    },
    {
      q: 'Bisakah landing page dan tiket disesuaikan identitas visual fakultas/himpunan?',
      a: 'Tentu. Anda dapat mengatur custom slug URL (misal: iventra.id/event/bina-desa-2025), logo himpunan, banner, palet warna, FAQ, dan panduan guidebook resmi pada Spark Builder tanpa memerlukan kemampuan coding.'
    },
    {
      q: 'Bagaimana mekanisme WhatsApp Gateway dan tiket QR bekerja?',
      a: 'Ketika peserta melengkapi pendaftaran, server kami otomatis men-generate tiket berkode QR unik berenkripsi dan mengirimkannya langsung ke nomor WhatsApp peserta. Di hari H, panitia cukup membuka kamera scanner Iventra untuk validasi 0.5 detik.'
    },
    {
      q: 'Apakah data pendaftar aman dan memenuhi standar kepanitiaan?',
      a: 'Data peserta terenkripsi dan menjadi aset eksklusif panitia Anda. Kami tidak membagikan data peserta kepada pihak ketiga. Rekap data dapat di-export sewaktu-waktu ke format spreadsheet siap audit LPJ universitas.'
    }
  ];

  const toggleItem = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section className="w-full py-24 md:py-32 bg-[#f4f5f8] border-b border-[#e2e5ea]" id="faq">
      <div className="w-full max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Header column */}
          <div className="lg:col-span-5">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[#0b0c0e] text-white text-[11px] font-mono uppercase tracking-wider mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1f2de6]"></span>
              Dokumentasi &amp; FAQ
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0b0c0e] tracking-tight leading-[1.1]">
              Pertanyaan umum seputar sistem &amp; integrasi.
            </h2>
            <p className="text-base text-[#585d6b] mt-4 leading-relaxed">
              Semua hal esensial mengenai arsitektur, SLA, kapasitas pendaftaran, dan format kemitraan kepanitiaan.
            </p>
            <div className="mt-8 p-5 rounded-xl bg-white border border-[#e2e5ea] max-w-sm">
              <span className="font-mono text-xs uppercase tracking-wider text-[#585d6b] block mb-1">
                Punya Kebutuhan Spesifik?
              </span>
              <p className="text-xs text-[#585d6b] leading-relaxed mb-3">
                Diskusikan custom flow pendaftaran bertahap bersama tim teknis kami.
              </p>
              <a
                href="#hubungi"
                className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-[#1f2de6] hover:text-[#1622b8] hover:underline"
              >
                Konsultasikan Sekarang →
              </a>
            </div>
          </div>

          {/* Accordion column */}
          <div className="lg:col-span-7 space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openIndex === idx;
              return (
                <div
                  key={faq.q}
                  className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                    isOpen
                      ? 'bg-white border-[#0b0c0e] shadow-xs'
                      : 'bg-white border-[#e2e5ea] hover:border-[#b0b6c2]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleItem(idx)}
                    className="w-full flex items-center justify-between p-5 md:p-6 text-left cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1f2de6] focus-visible:ring-offset-2 rounded-xl"
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${idx}`}
                  >
                    <div className="flex items-center gap-3 pr-4">
                      <span className="font-mono text-xs text-[#585d6b]">0{idx + 1}</span>
                      <span className="text-base font-bold text-[#0b0c0e] tracking-tight">
                        {faq.q}
                      </span>
                    </div>
                    <span
                      className={`font-mono text-xs px-2 py-0.5 rounded border transition-colors shrink-0 ${
                        isOpen
                          ? 'bg-[#0b0c0e] text-white border-[#0b0c0e]'
                          : 'bg-[#f4f5f8] text-[#585d6b] border-[#e2e5ea]'
                      }`}
                      aria-hidden="true"
                    >
                      {isOpen ? 'TUTUP' : 'BUKA'}
                    </span>
                  </button>

                  {isOpen && (
                    <div
                      id={`faq-answer-${idx}`}
                      className="px-5 md:px-6 pb-6 text-sm text-[#585d6b] leading-relaxed border-t border-[#e2e5ea] pt-4"
                    >
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
