import { useEffect } from 'react';

interface InfoModalProps {
  type: 'profile' | 'terms' | 'privacy' | null;
  onClose: () => void;
}

export default function InfoModal({ type, onClose }: InfoModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && type) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [type, onClose]);

  if (!type) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#efecff] overflow-hidden max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#0c1df3] to-[#3b47dc] text-white flex items-center justify-between">
          <h3 className="text-base font-bold text-white">
            {type === 'profile'
              ? 'Portal Panitia Iventra'
              : type === 'terms'
              ? 'Syarat & Ketentuan Layanan'
              : 'Kebijakan Privasi Data'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
            aria-label="Tutup"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto text-sm text-[#454557] space-y-4">
          {type === 'profile' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-[#f5f2ff] border border-[#efecff]">
                <div className="w-12 h-12 rounded-full bg-[#000cb8] text-white flex items-center justify-center font-bold text-lg">
                  P
                </div>
                <div>
                  <h4 className="font-bold text-[#191930] text-base">
                    Panitia Tamu (Guest Committee)
                  </h4>
                  <p className="text-xs text-[#757589]">
                    Akses Dashboard Pengawasan Event Kampus
                  </p>
                </div>
              </div>
              <p className="leading-relaxed">
                Sebagai panitia terdaftar di Iventra, Anda mendapatkan akses login ke dashboard manajemen pendaftar, monitoring WA bot, dan portal verifikasi dewan juri.
              </p>
              <div className="p-4 rounded-xl border border-[#efecff] bg-white space-y-2">
                <div className="text-xs font-bold text-[#191930]">Status Layanan Aktif:</div>
                <div className="flex items-center justify-between text-xs">
                  <span>SLA Respons Teknis</span>
                  <span className="font-bold text-emerald-600">&lt; 15 Menit</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span>Server Availability</span>
                  <span className="font-bold text-emerald-600">99.98% High-Traffic</span>
                </div>
              </div>
            </div>
          )}

          {type === 'terms' && (
            <div className="space-y-3 leading-relaxed">
              <h4 className="font-bold text-[#191930]">1. Ketentuan Penggunaan</h4>
              <p>
                Layanan Iventra disediakan khusus untuk kepanitiaan mahasiswa, komunitas kampus, dan organisasi legal di Indonesia untuk penyelenggaraan event edukatif, kompetisi, seminar, dan festival kampus.
              </p>
              <h4 className="font-bold text-[#191930]">2. SLA &amp; Setup Sistem</h4>
              <p>
                Sistem Flow &amp; Spark akan di-setup dalam kurun waktu 24 jam setelah materi branding dan form kustom disepakati panitia.
              </p>
              <h4 className="font-bold text-[#191930]">3. Pembayaran Tanpa Biaya Tersembunyi</h4>
              <p>
                Biaya investasi per-event bersifat transparan sesuai paket yang dipilih tanpa kewajiban langganan bulanan.
              </p>
            </div>
          )}

          {type === 'privacy' && (
            <div className="space-y-3 leading-relaxed">
              <h4 className="font-bold text-[#191930]">1. Kepemilikan Data Peserta</h4>
              <p>
                Seluruh database peserta pendaftar sepenuhnya adalah milik kepanitiaan acara. Iventra tidak pernah menjual, menyewakan, atau menyebarkan data ke pihak ketiga manapun.
              </p>
              <h4 className="font-bold text-[#191930]">2. Keamanan &amp; Enkripsi</h4>
              <p>
                Semua transmisi formulir dan nomor WhatsApp dienkripsi menggunakan protokol TLS modern dengan sertifikat SSL terverifikasi.
              </p>
              <h4 className="font-bold text-[#191930]">3. Retensi Data</h4>
              <p>
                Setelah laporan LPJ diserahkan dan acara selesai, data peserta dapat diunduh oleh panitia dalam format Excel/CSV atau diarsipkan sesuai kebutuhan.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#f5f2ff] border-t border-[#efecff] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-[#0c1df3] text-white font-bold text-xs hover:bg-[#000cb8] transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
