interface SparkSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConsultationRequest?: () => void;
}

export default function SparkSubscriptionModal({
  isOpen,
  onClose,
  onConsultationRequest
}: SparkSubscriptionModalProps) {
  if (!isOpen) return null;

  const features = [
    {
      icon: 'dynamic_form',
      title: 'Formulir Pendaftaran Internal Tanpa Batas',
      desc: 'Bangun formulir pendaftaran langsung di dalam Iventra tanpa bergantung Google Form/Typeform eksternal.'
    },
    {
      icon: 'table_view',
      title: 'Database & Ekspor Excel/Spreadsheet Otomatis',
      desc: 'Semua submisi dan data peserta tersimpan rapi dan dapat diunduh kapan saja dalam format CSV/Excel.'
    },
    {
      icon: 'send',
      title: 'Otomasi WhatsApp Reminder & Blast H-1',
      desc: 'Kirim notifikasi tiket QR Code dan pengingat jadwal langsung ke nomor WA peserta secara resmi.'
    },
    {
      icon: 'workspace_premium',
      title: 'E-Sertifikat Digital dengan QR Validasi',
      desc: 'Terbitkan sertifikat ber-SK secara instan sesuai presensi kehadiran peserta.'
    },
    {
      icon: 'language',
      title: 'Custom Domain Institusi / Kampus',
      desc: 'Gunakan domain sendiri seperti eventkampus.ac.id atau namaevent.id untuk citra kepanitiaan profesional.'
    }
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="spark-sub-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#191930]/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-xl bg-white rounded-xl shadow-2xl border border-[#e2e5ea] overflow-hidden animate-fadeIn flex flex-col max-h-[90vh]">
        {/* Top Header Banner */}
        <div className="relative bg-[#0b0c0e] text-white p-6 sm:p-8 shrink-0 border-b border-white/10">
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer font-mono text-sm"
            aria-label="Tutup modal"
          >
            ✕
          </button>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/10 text-white text-[10px] font-mono uppercase tracking-wider mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1f2de6]"></span>
            <span>Iventra Spark Subscription</span>
          </div>

          <h2 id="spark-sub-title" className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
            Buka Fitur Premium Spark
          </h2>
          <p className="text-white/60 text-xs sm:text-sm mt-1 max-w-md">
            Tingkatkan efisiensi kepanitiaan dengan sistem form terpadu, WhatsApp bot pengingat, dan presensi QR otomatis.
          </p>
        </div>

        {/* Feature List */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-4 flex-1 bg-white">
          <div className="text-xs font-mono font-bold text-[#585d6b] uppercase tracking-wider">
            Fitur Unggulan Termasuk:
          </div>

          <div className="grid grid-cols-1 gap-3">
            {features.map((feat, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-[#f8f9fb] border border-[#e2e5ea] flex items-start gap-3.5"
              >
                <div className="w-8 h-8 rounded-lg bg-[#0b0c0e] text-white flex items-center justify-center shrink-0 font-mono text-xs font-bold">
                  0{idx + 1}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#0b0c0e] tracking-tight">{feat.title}</h4>
                  <p className="text-xs text-[#585d6b] mt-0.5 leading-relaxed">{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Pricing Info Card */}
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-4">
            <div>
              <span className="text-xs font-mono font-bold text-emerald-900 uppercase tracking-wide">
                Paket Mahasiswa &amp; BEM
              </span>
              <p className="text-xs text-emerald-800 mt-0.5">
                Konsultasikan kebutuhan peserta untuk penyesuaian kuota &amp; harga khusus kepanitiaan kampus.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded bg-emerald-600 text-white text-xs font-mono font-bold shrink-0">
              Diskon Komunitas
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 sm:p-6 bg-[#f8f9fb] border-t border-[#e2e5ea] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-[#e2e5ea] text-xs font-mono font-bold text-[#585d6b] hover:bg-white transition-colors cursor-pointer"
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
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-[#1f2de6] hover:bg-[#1622b8] text-white text-xs sm:text-sm font-semibold tracking-tight shadow-xs transition-all active:scale-[0.99] cursor-pointer"
          >
            <span>Konsultasi Aktivasi Paket</span>
            <span className="font-mono text-xs">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
