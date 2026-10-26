import { useState } from 'react';

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      q: 'Berapa biaya layanan di Iventra?',
      a: 'Biaya sangat fleksibel dan disesuaikan khusus untuk kantong organisasi kemahasiswaan. Kami menyediakan model per-event tanpa langganan tersembunyi yang memberatkan kas panitia.'
    },
    {
      q: 'Apakah ada batas kuota peserta?',
      a: 'Sistem kami mampu menampung dari puluhan hingga belasan ribu peserta secara serentak tanpa lag, berkat infrastruktur cloud server berkecepatan tinggi.'
    },
    {
      q: 'Bisa custom branding sesuai identitas kampus kami?',
      a: 'Tentu saja! Anda bisa menyertakan logo institusi, warna tema organisasi, formulir spesifik, hingga subdomain website khusus untuk acara Anda.'
    },
    {
      q: 'Bagaimana cara kerja Bot WA Reminder?',
      a: 'Bot terhubung ke nomor resmi Iventra yang secara otomatis mengirimkan tiket berkode QR, pesan sambutan, dan notifikasi H-1 langsung ke nomor WhatsApp peserta tanpa panitia harus menyimpan kontak secara manual.'
    },
    {
      q: 'Bagaimana dengan keamanan data peserta dan panitia?',
      a: 'Keamanan data terjamin dengan enkripsi modern. Data peserta sepenuhnya menjadi milik panitia dan tidak akan pernah dibagikan atau dimanfaatkan untuk pihak ketiga.'
    }
  ];

  const toggleItem = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section className="w-full py-20 md:py-24 bg-white" id="faq">
      <div className="w-full max-w-7xl mx-auto px-6 md:px-12">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold text-[#0c1df3] tracking-wider uppercase">
            Bantuan &amp; Informasi
          </span>
          <h2 className="text-3xl md:text-4xl text-[#191930] font-bold mt-2 tracking-tight">
            Pertanyaan Populer
          </h2>
          <p className="text-sm md:text-base text-[#757589] mt-2">
            Hal-hal yang sering ditanyakan panitia sebelum berkolaborasi.
          </p>
        </div>

        {/* Accordion List */}
        <div className="max-w-3xl mx-auto space-y-4" id="faq-accordion">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={faq.q}
                className="faq-item bg-[#f5f2ff] rounded-2xl p-5 md:p-6 transition-all duration-200 border border-[#efecff]/70 hover:border-[#0c1df3]/20"
              >
                <button
                  type="button"
                  onClick={() => toggleItem(idx)}
                  className="w-full flex items-center justify-between text-left text-lg text-[#191930] font-bold cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0c1df3] rounded-lg"
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${idx}`}
                >
                  <span className="pr-4">{faq.q}</span>
                  <span
                    className={`material-symbols-outlined text-[#0c1df3] transition-transform duration-300 shrink-0 ${
                      isOpen ? 'rotate-180' : 'rotate-0'
                    }`}
                    aria-hidden="true"
                  >
                    expand_more
                  </span>
                </button>

                {isOpen && (
                  <div
                    id={`faq-answer-${idx}`}
                    className="faq-answer mt-3 text-sm md:text-base text-[#757589] leading-relaxed animate-fadeIn border-t border-[#efecff] pt-3"
                  >
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
