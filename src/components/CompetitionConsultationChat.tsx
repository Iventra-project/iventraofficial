import { useState, useRef, useEffect } from 'react';

interface WorkflowStage {
  phase: string;
  title: string;
  timeline: string;
  details: string[];
}

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  stages?: WorkflowStage[];
  rubric?: { criteria: string; weight: string; desc: string }[];
  timestamp: string;
}

const PRESET_TOPICS = [
  {
    icon: 'devices',
    label: 'Alur Lomba UI/UX & Web Design',
    prompt: 'Bagaimana alur dan tahapan ideal untuk lomba UI/UX Design tingkat universitas?'
  },
  {
    icon: 'description',
    label: 'Kompetisi Karya Tulis Ilmiah (KTI)',
    prompt: 'Rancang alur kompetisi Karya Tulis Ilmiah (KTI) bertingkat dari abstrak hingga full paper.'
  },
  {
    icon: 'trending_up',
    label: 'Lomba Business Plan & Startup',
    prompt: 'Susun alur lomba Business Plan Competition (BPC) lengkap dengan format pitching finalis.'
  },
  {
    icon: 'gavel',
    label: 'Format Rubrik Penjurian Terstandar',
    prompt: 'Berikan rekomendasi rubrik penilaian juri independen dan bobot persentase skor lomba.'
  }
];

export default function CompetitionConsultationChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'Halo Panitia! Saya asisten spesialis alur kompetisi Iventra. Saya dapat membantu merancang tahapan lomba bertingkat, formulir pengumpulan karya, sistem portal juri, dan pembobotan skor. Silakan pilih topik rekomendasi di bawah atau tuliskan kebutuhan lomba Anda:',
      timestamp: 'Baru saja'
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback(id);
    setTimeout(() => setCopyFeedback(null), 2500);
  };

  const generateAIResponse = (query: string): Message => {
    const q = query.toLowerCase();
    const time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    if (q.includes('ui/ux') || q.includes('web') || q.includes('desain')) {
      return {
        id: String(Date.now()),
        sender: 'ai',
        text: 'Berikut adalah rekomendasi alur terstandarisasi untuk kompetisi UI/UX & Web Design:',
        stages: [
          {
            phase: 'Tahap 1',
            title: 'Registrasi & Pengumpulan Proposal Solusi',
            timeline: 'Hari 1 - 20',
            details: [
              'Pendaftaran tim (1-3 mahasiswa) via portal website Iventra.',
              'Unggah berkas studi kasus (Design Thinking / Problem Framing) dalam format PDF max 10 halaman.',
              'Pemeriksaan validasi berkas identitas (KTM aktif).'
            ]
          },
          {
            phase: 'Tahap 2',
            title: 'Penjurian Naskah & Kurasi Top 8 Finalis',
            timeline: 'Hari 21 - 25',
            details: [
              'Penjurian blind review oleh juri independen melalui portal Iventra Flow.',
              'Rekapitulasi skor otomatis untuk memilih Top 8 tim finalis.',
              'Pengumuman resmi dan pengiriman e-tiket Technical Meeting via WhatsApp Blast.'
            ]
          },
          {
            phase: 'Tahap 3',
            title: 'Final Prototyping & Live Pitching',
            timeline: 'Hari 30 (Grand Final)',
            details: [
              'Peserta mengumpulkan tautan interaktif Figma dan slide pitch deck.',
              'Presentasi luring/daring: 7 menit presentasi + 8 menit tanya jawab dewan juri.',
              'Input nilai langsung oleh juri pada form penilaian digital terenkripsi.'
            ]
          }
        ],
        rubric: [
          { criteria: 'Inovasi & Relevansi Solusi', weight: '30%', desc: 'Keaslian gagasan dan efektivitas pemecahan masalah pengguna.' },
          { criteria: 'Usability & Visual UI Design', weight: '30%', desc: 'Penerapan Design System, hierarki tipografi, dan kemudahan navigasi.' },
          { criteria: 'Metodologi Riset (UX Research)', weight: '25%', desc: 'Kekuatan user persona, user journey map, dan usability testing.' },
          { criteria: 'Penyampaian Presentasi (Pitching)', weight: '15%', desc: 'Artikulasi tim, penguasaan materi, dan respon terhadap pertanyaan juri.' }
        ],
        timestamp: time
      };
    }

    if (q.includes('kti') || q.includes('karya tulis') || q.includes('esai') || q.includes('paper')) {
      return {
        id: String(Date.now()),
        sender: 'ai',
        text: 'Berikut adalah rancangan alur kompetisi Karya Tulis Ilmiah (KTI) bertingkat siap pakai:',
        stages: [
          {
            phase: 'Tahap 1',
            title: 'Submisi Abstrak Terbuka (Gratis)',
            timeline: 'Hari 1 - 15',
            details: [
              'Pendaftaran tim dan pengunggahan abstrak karya ilmiah (250-300 kata).',
              'Seleksi kelayakan topik oleh tim kurasi panitia.',
              'Pengumuman tim yang berhak melaju ke tahap Full Paper.'
            ]
          },
          {
            phase: 'Tahap 2',
            title: 'Pembayaran Registrasi & Pengumpulan Full Paper',
            timeline: 'Hari 16 - 35',
            details: [
              'Pembayaran tiket kompetisi terintegrasi otomatis di website Iventra.',
              'Unggah berkas naskah lengkap (format PDF standar IEEE / APA).',
              'Pemeriksaan orisinalitas otomatis (lolos uji kemiripan < 20%).'
            ]
          },
          {
            phase: 'Tahap 3',
            title: 'Blind Review Dewan Juri Pakar',
            timeline: 'Hari 36 - 42',
            details: [
              'Juri menilai naskah tanpa melihat identitas kampus/nama peserta (Double Blind).',
              'Penentuan 10 naskah terbaik untuk presentasi di babak final.'
            ]
          },
          {
            phase: 'Tahap 4',
            title: 'Sidang Pleno Finalis & Expo Karya',
            timeline: 'Hari 45',
            details: [
              'Presentasi karya di hadapan 3 dewan juri akademisi.',
              'Sesi tanya jawab mendalam 10 menit per tim.',
              'Presensi menggunakan barcode QR dan penerbitan e-sertifikat ber-SK.'
            ]
          }
        ],
        rubric: [
          { criteria: 'Gagasan & Orisinalitas Ide', weight: '35%', desc: 'Keunikan pendekatan dan relevansi terhadap tema utama kompetisi.' },
          { criteria: 'Metodologi & Ketajaman Analisis', weight: '30%', desc: 'Ketepatan metode penelitian dan validitas data pendukung.' },
          { criteria: 'Sistematika Penulisan & Kaidah', weight: '20%', desc: 'Kesesuaian format pedoman, sitasi ilmiah, dan keterbacaan bahasa.' },
          { criteria: 'Potensi Implementasi & Manfaat', weight: '15%', desc: 'Dampak nyata bagi masyarakat atau perkembangan keilmuan.' }
        ],
        timestamp: time
      };
    }

    if (q.includes('business') || q.includes('bisnis') || q.includes('startup') || q.includes('bpc')) {
      return {
        id: String(Date.now()),
        sender: 'ai',
        text: 'Berikut adalah alur terstruktur untuk Business Plan Competition (BPC):',
        stages: [
          {
            phase: 'Tahap 1',
            title: 'Pengumpulan BMC & Executive Summary',
            timeline: 'Minggu 1 - 2',
            details: [
              'Registrasi tim dan submisi lembar Business Model Canvas (BMC) 1 halaman.',
              'Ringkasan eksekutif rencana bisnis maksimal 3 halaman.',
              'Seleksi administrasi & kelayakan ide pasar.'
            ]
          },
          {
            phase: 'Tahap 2',
            title: 'Submisi Proposal Bisnis Lengkap & Video Pitch',
            timeline: 'Minggu 3 - 5',
            details: [
              'Unggah proposal komprehensif (analisis keuangan, strategi pemasaran, proyeksi cashflow 3 tahun).',
              'Tautan video pengenalan produk berdurasi 3 menit.'
            ]
          },
          {
            phase: 'Tahap 3',
            title: 'Demo Day & Investor / Jury Pitching',
            timeline: 'Minggu 6 (Finalis Top 5)',
            details: [
              'Presentasi 8 menit di depan praktisi bisnis / venture capital.',
              'Tanya jawab kelayakan finansial 7 menit.',
              'Penetapan juara 1, 2, 3 dan kategori Best Pitch.'
            ]
          }
        ],
        rubric: [
          { criteria: 'Market Validation & Problem-Solution Fit', weight: '30%', desc: 'Bukti validasi kebutuhan target pasar nyata.' },
          { criteria: 'Kelayakan Finansial & Model Monetisasi', weight: '30%', desc: 'Realisme proyeksi pendapatan, COGS, dan BEP.' },
          { criteria: 'Inovasi & Daya Saing (Competitive Edge)', weight: '25%', desc: 'Kekuatan keunggulan komparatif dibanding kompetitor.' },
          { criteria: 'Kompetensi Tim & Kesiapan Eksekusi', weight: '15%', desc: 'Distribusi peran dan kapabilitas anggota dalam menjalankan rencana.' }
        ],
        timestamp: time
      };
    }

    if (q.includes('rubrik') || q.includes('juri') || q.includes('nilai') || q.includes('skor')) {
      return {
        id: String(Date.now()),
        sender: 'ai',
        text: 'Berikut adalah panduan standar penyusunan rubrik penilaian juri untuk kepanitiaan:',
        stages: [
          {
            phase: 'Langkah 1',
            title: 'Standarisasi Rentang Nilai (Skala 1 - 100)',
            timeline: 'Sebelum Penjurian',
            details: [
              'Kurang: 50 - 64 (Tidak memenuhi kriteria minimum pedoman).',
              'Cukup: 65 - 74 (Memenuhi syarat namun minim inovasi).',
              'Baik: 75 - 84 (Solutif, sistematis, dan data valid).',
              'Sangat Baik: 85 - 100 (Out-of-the-box, presisi tinggi, siap diimplementasikan).'
            ]
          },
          {
            phase: 'Langkah 2',
            title: 'Isolasi Nilai Juri (Anti-Bias)',
            timeline: 'Saat Penjurian Berlangsung',
            details: [
              'Setiap juri memiliki tautan form khusus tanpa melihat skor dari juri lainnya.',
              'Komentar kualitatif wajib diisi untuk tim yang mendapat skor <60 atau >90.',
              'Sistem Iventra Flow melakukan agregasi rata-rata terbobot secara otomatis.'
            ]
          }
        ],
        rubric: [
          { criteria: 'Kesesuaian Tema & Orisinalitas', weight: '30%', desc: 'Kepatuhan terhadap batas tema lomba.' },
          { criteria: 'Kualitas Teknis & Metodologi', weight: '40%', desc: 'Bobot terbesar pada kedalaman substansi karya.' },
          { criteria: 'Estetika & Presentasi Akhir', weight: '30%', desc: 'Kerapian format dan penguasaan saat tanya jawab.' }
        ],
        timestamp: time
      };
    }

    // Default smart response for custom competitions
    return {
      id: String(Date.now()),
      sender: 'ai',
      text: `Berikut adalah rekomendasi kerangka alur lomba terstruktur untuk "${query}":`,
      stages: [
        {
          phase: 'Fase 1',
          title: 'Sosialisasi & Pendaftaran Terpusat',
          timeline: 'Pekan 1 - 3',
          details: [
            'Rilis Buku Panduan / Juknis resmi di landing page event Iventra.',
            'Pendaftaran mandiri peserta dengan verifikasi tiket dan nomor WhatsApp.',
            'Batas waktu pengumpulan draf berkas tahap awal.'
          ]
        },
        {
          phase: 'Fase 2',
          title: 'Kurasi & Penjurian Tahap Penyisihan',
          timeline: 'Pekan 4',
          details: [
            'Dewan juri mengulas karya melalui portal kurasi mandiri.',
            'Penyusunan ranking berdasarkan total nilai pembobotan.',
            'Pengumuman delegasi finalis yang lolos ke babak puncak.'
          ]
        },
        {
          phase: 'Fase 3',
          title: 'Babak Final & Penganugerahan Juara',
          timeline: 'Pekan 5',
          details: [
            'Technical Meeting peserta finalis.',
            'Sesi unjuk karya / presentasi di depan juri kehormatan.',
            'Presensi kode QR dan penerbitan sertifikat digital otomatis.'
          ]
        }
      ],
      rubric: [
        { criteria: 'Kesesuaian Regulasi Teknis', weight: '25%', desc: 'Kepatuhan terhadap seluruh ketentuan juknis.' },
        { criteria: 'Kreativitas & Daya Tarik Solusi', weight: '45%', desc: 'Keunikan dan keunggulan eksekusi ide lomba.' },
        { criteria: 'Artikulasi & Pertahanan Gagasan', weight: '30%', desc: 'Kemampuan menjawab tanggapan dan kritik dewan juri.' }
      ],
      timestamp: time
    };
  };

  const handleSendMessage = (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query) return;

    const userMsg: Message = {
      id: String(Date.now()),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const aiReply = generateAIResponse(query);
      setMessages((prev) => [...prev, aiReply]);
      setIsTyping(false);
    }, 600);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome',
        sender: 'ai',
        text: 'Percakapan telah direset. Silakan tuliskan jenis kompetisi atau pilih topik rekomendasi untuk merancang alur lomba baru:',
        timestamp: 'Baru saja'
      }
    ]);
  };

  const compileConversationSummary = (): string => {
    return messages
      .map((m) => {
        let block = `[${m.sender.toUpperCase()}] ${m.text}\n`;
        if (m.stages) {
          block += '\n--- TAHAPAN ALUR LOMBA ---\n';
          m.stages.forEach((st) => {
            block += `${st.phase}: ${st.title} (${st.timeline})\n`;
            st.details.forEach((d) => (block += `  • ${d}\n`));
          });
        }
        if (m.rubric) {
          block += '\n--- RUBRIK PENILAIAN ---\n';
          m.rubric.forEach((rb) => {
            block += `• ${rb.criteria} [${rb.weight}]: ${rb.desc}\n`;
          });
        }
        return block;
      })
      .join('\n');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fadeIn pb-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#1f2de6] font-bold block mb-1">
            Asisten Kompetisi &amp; Juri
          </span>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#0b0c0e] tracking-tight">
            Konsultasi Alur Lomba &amp; Penjurian
          </h1>
          <p className="text-xs sm:text-sm text-[#585d6b] mt-1">
            Rancang tahapan kompetisi, sistem submisi karya, dan rubrik penilaian juri secara terstandar.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleClearChat}
            className="px-3 py-2 rounded-lg border border-[#e2e5ea] hover:bg-white text-xs font-semibold text-[#585d6b] hover:text-[#0b0c0e] transition-colors cursor-pointer flex items-center gap-1.5"
            title="Reset Percakapan"
          >
            <span className="material-symbols-outlined text-[16px]">restart_alt</span>
            <span className="hidden sm:inline">Reset Chat</span>
          </button>

          <button
            type="button"
            onClick={() => handleCopyText(compileConversationSummary(), 'summary')}
            className="px-3.5 py-2 rounded-lg bg-[#0b0c0e] hover:bg-[#1f2de6] text-white text-xs font-semibold tracking-tight transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <span className="material-symbols-outlined text-[16px]">content_copy</span>
            <span>{copyFeedback === 'summary' ? 'Disalin!' : 'Salin Hasil Alur'}</span>
          </button>
        </div>
      </div>

      {/* Main Chatbot Window */}
      <div className="rounded-2xl bg-white border border-[#e2e5ea] shadow-2xs overflow-hidden flex flex-col h-[650px]">
        {/* Chat Header Bar */}
        <div className="p-4 bg-[#fafbfc] border-b border-[#e2e5ea] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0b0c0e] text-white flex items-center justify-center font-mono font-bold text-xs shrink-0 shadow-xs">
              <span className="material-symbols-outlined text-[18px]">smart_toy</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading font-bold text-sm text-[#0b0c0e]">
                  Iventra Flow Assistant
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Online
                </span>
              </div>
              <span className="text-[11px] font-mono text-[#8c93a0] block">
                Konsultan Struktur Lomba &amp; Penilaian
              </span>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-[#8c93a0]">
            <span>Siap Ekspor ke Juknis</span>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-[#f8f9fb]">
          {messages.map((msg) => {
            const isAI = msg.sender === 'ai';
            return (
              <div
                key={msg.id}
                className={`flex gap-3.5 ${isAI ? 'items-start' : 'items-start justify-end'}`}
              >
                {isAI && (
                  <div className="w-8 h-8 rounded-lg bg-[#0b0c0e] text-white flex items-center justify-center shrink-0 text-xs font-mono font-bold shadow-xs">
                    AI
                  </div>
                )}

                <div className={`space-y-3 max-w-2xl ${isAI ? 'w-full' : 'max-w-lg'}`}>
                  {/* Bubble Text */}
                  <div
                    className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                      isAI
                        ? 'bg-white text-[#0b0c0e] border border-[#e2e5ea] shadow-2xs'
                        : 'bg-[#1f2de6] text-white font-medium rounded-tr-none shadow-xs'
                    }`}
                  >
                    <p>{msg.text}</p>

                    {/* Render Structured Stages if provided */}
                    {msg.stages && (
                      <div className="mt-4 space-y-3 pt-3 border-t border-[#f0f2f5]">
                        <span className="text-[11px] font-mono font-bold text-[#1f2de6] uppercase tracking-wider block">
                          Tahapan Alur Pelaksanaan:
                        </span>

                        <div className="space-y-2.5">
                          {msg.stages.map((st, sIdx) => (
                            <div
                              key={sIdx}
                              className="p-3.5 rounded-xl bg-[#fafbfc] border border-[#e2e5ea] space-y-1.5"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-1">
                                <div className="flex items-center gap-2">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#edf2ff] text-[#1f2de6]">
                                    {st.phase}
                                  </span>
                                  <strong className="text-xs font-heading font-bold text-[#0b0c0e]">
                                    {st.title}
                                  </strong>
                                </div>
                                <span className="text-[10px] font-mono text-[#8c93a0]">
                                  {st.timeline}
                                </span>
                              </div>

                              <ul className="list-disc list-inside space-y-1 text-xs text-[#585d6b] pl-1">
                                {st.details.map((dt, dIdx) => (
                                  <li key={dIdx} className="leading-normal">
                                    {dt}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Render Rubric Table if provided */}
                    {msg.rubric && (
                      <div className="mt-4 space-y-2.5 pt-3 border-t border-[#f0f2f5]">
                        <span className="text-[11px] font-mono font-bold text-emerald-700 uppercase tracking-wider block">
                          Rekomendasi Rubrik &amp; Bobot Penilaian Juri:
                        </span>

                        <div className="rounded-xl border border-[#e2e5ea] overflow-hidden text-xs">
                          <table className="w-full text-left">
                            <thead className="bg-[#fafbfc] border-b border-[#e2e5ea] text-[#8c93a0] font-mono text-[10px] uppercase">
                              <tr>
                                <th className="px-3 py-2 font-semibold">Kriteria Penilaian</th>
                                <th className="px-3 py-2 font-semibold">Bobot</th>
                                <th className="px-3 py-2 font-semibold">Fokus Penilaian</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#f0f2f5] bg-white text-[11px]">
                              {msg.rubric.map((rb, rIdx) => (
                                <tr key={rIdx}>
                                  <td className="px-3 py-2 font-bold text-[#0b0c0e]">
                                    {rb.criteria}
                                  </td>
                                  <td className="px-3 py-2 font-mono font-bold text-[#1f2de6]">
                                    {rb.weight}
                                  </td>
                                  <td className="px-3 py-2 text-[#585d6b]">
                                    {rb.desc}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Metadata & Copy action */}
                  <div
                    className={`flex items-center gap-2 text-[10px] font-mono text-[#8c93a0] ${
                      isAI ? 'justify-between' : 'justify-end'
                    }`}
                  >
                    <span>{msg.timestamp}</span>
                    {isAI && (
                      <button
                        type="button"
                        onClick={() => handleCopyText(msg.text, msg.id)}
                        className="hover:text-[#0b0c0e] transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[13px]">content_copy</span>
                        <span>{copyFeedback === msg.id ? 'Tersalin' : 'Salin Pesan'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {!isAI && (
                  <div className="w-8 h-8 rounded-lg bg-[#1f2de6] text-white flex items-center justify-center shrink-0 text-xs font-mono font-bold shadow-xs">
                    You
                  </div>
                )}
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex gap-3.5 items-center">
              <div className="w-8 h-8 rounded-lg bg-[#0b0c0e] text-white flex items-center justify-center shrink-0 text-xs font-mono font-bold">
                AI
              </div>
              <div className="p-3.5 rounded-2xl bg-white border border-[#e2e5ea] text-xs text-[#585d6b] flex items-center gap-1.5 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-[#1f2de6] animate-bounce"></span>
                <span className="w-2 h-2 rounded-full bg-[#1f2de6] animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-2 h-2 rounded-full bg-[#1f2de6] animate-bounce [animation-delay:0.4s]"></span>
                <span className="font-mono text-[11px] text-[#8c93a0] ml-2">Menyusun alur kompetisi...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Topic Prompts */}
        <div className="p-3 bg-[#fafbfc] border-t border-[#e2e5ea] shrink-0">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-[10px] font-mono text-[#8c93a0] uppercase tracking-wider shrink-0 pl-1">
              Topik Cepat:
            </span>
            {PRESET_TOPICS.map((topic, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(topic.prompt)}
                disabled={isTyping}
                className="px-3 py-1.5 rounded-lg bg-white border border-[#e2e5ea] hover:border-[#1f2de6] hover:text-[#1f2de6] text-[#0b0c0e] text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-[0.98] disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[14px] text-[#1f2de6]">
                  {topic.icon}
                </span>
                <span>{topic.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Input Bar */}
        <div className="p-3.5 sm:p-4 bg-white border-t border-[#e2e5ea] shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tuliskan jenis lomba atau pertanyaan alur penjurian... (Tekan Enter)"
              disabled={isTyping}
              className="flex-1 px-4 py-2.5 rounded-xl border border-[#e2e5ea] bg-[#f8f9fb] text-xs sm:text-sm text-[#0b0c0e] placeholder-[#8c93a0] focus:bg-white focus:border-[#1f2de6] focus:outline-none transition-all"
            />

            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="px-5 py-2.5 rounded-xl bg-[#1f2de6] hover:bg-[#1622b8] text-white text-xs sm:text-sm font-semibold tracking-tight shadow-xs transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed shrink-0 active:scale-[0.98]"
            >
              <span>Kirim</span>
              <span className="material-symbols-outlined text-[16px]">send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

