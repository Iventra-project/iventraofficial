interface SparkSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConsultationRequest?: () => void;
  onRenewSuccess?: (durationDays: number, planName: string, price: string, extraTokens?: number) => void;
}

export default function SparkSubscriptionModal({
  isOpen,
  onClose,
  onConsultationRequest
}: SparkSubscriptionModalProps) {
  if (!isOpen) return null;

  const features = [
    {
      title: 'Formulir Pendaftaran Internal Tanpa Batas',
      desc: 'Bangun formulir pendaftaran langsung di dalam Iventra tanpa bergantung Google Form/Typeform eksternal.'
    },
    {
      title: 'Database & Ekspor Excel/Spreadsheet Otomatis',
      desc: 'Semua submisi dan data peserta tersimpan rapi dan dapat diunduh kapan saja dalam format CSV/Excel.'
    },
    {
      title: 'Otomasi WhatsApp Reminder & Blast H-1',
      desc: 'Kirim notifikasi tiket QR Code dan pengingat jadwal langsung ke nomor WA peserta secara resmi.'
    },
    {
      title: 'E-Sertifikat Digital dengan QR Validasi',
      desc: 'Terbitkan sertifikat ber-SK secara instan sesuai presensi kehadiran peserta.'
    },
    {
      title: 'Custom Domain Institusi / Kampus',
      desc: 'Gunakan domain sendiri seperti eventkampus.ac.id atau namaevent.id untuk citra kepanitiaan profesional.'
    }
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="spark-sub-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Card - Clean White & Subtle Blue Gradient */}
      <div className="relative w-full max-w-lg bg-gradient-to-b from-blue-50/60 via-white to-white rounded-3xl shadow-2xl border border-blue-100 overflow-hidden animate-[scaleUp_0.15s_ease-out] flex flex-col max-h-[90vh]">
        {/* Top Header */}
        <div className="p-6 sm:p-7 pb-4 shrink-0 relative border-b border-blue-50">
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full bg-[#1f2de6] text-white text-[11px] font-bold shadow-xs">
              Spark Pro
            </span>
            <span className="text-xs font-bold text-[#1f2de6]">
              Paket Komite &amp; Event
            </span>
          </div>

          <h2 id="spark-sub-title" className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
            Buka Fitur Premium Spark
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Tingkatkan efisiensi kepanitiaan dengan sistem form terpadu, WhatsApp bot pengingat, dan presensi QR otomatis.
          </p>
        </div>

        {/* Feature List */}
        <div className="p-6 sm:p-7 overflow-y-auto space-y-3 flex-1 bg-white">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Fitur Termasuk:
          </div>

          <div className="space-y-2.5">
            {features.map((feat, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-white border border-slate-200/80 hover:border-blue-200 transition-colors flex items-start gap-3 shadow-2xs"
              >
                <div className="w-6 h-6 rounded-full bg-[#edf2ff] text-[#1f2de6] flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                  0{idx + 1}
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 leading-snug">
                    {feat.title}
                  </h4>
                  <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Special Price Note */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/60 flex items-center justify-between gap-3 mt-4">
            <div>
              <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wide block">
                Khusus Mahasiswa &amp; BEM
              </span>
              <p className="text-[11px] text-blue-800 mt-0.5">
                Konsultasikan kebutuhan peserta untuk penyesuaian kuota acara.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-[#1f2de6] text-white text-[10px] font-bold shrink-0">
              Diskon Komunitas
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 sm:p-6 bg-slate-50/80 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-white transition-colors cursor-pointer"
          >
            Nanti Dulu
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              if (onConsultationRequest) {
                onConsultationRequest();
              }
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#1f2de6] hover:bg-[#1622b8] text-white text-xs sm:text-sm font-bold shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
          >
            <span>Konsultasi Aktivasi Paket</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  );
}
