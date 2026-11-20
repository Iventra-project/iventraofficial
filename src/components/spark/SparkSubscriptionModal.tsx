import { useState } from 'react';

interface SparkSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConsultationRequest?: () => void;
  onRenewSuccess?: (durationDays: number, planName: string, price: string, extraTokens?: number) => void;
}

export default function SparkSubscriptionModal({
  isOpen,
  onClose,
  onConsultationRequest,
  onRenewSuccess
}: SparkSubscriptionModalProps) {
  if (!isOpen) return null;

  const [selectedTier, setSelectedTier] = useState<'monthly' | 'semester' | 'topup'>('monthly');
  const [paymentMethod, setPaymentMethod] = useState<'qris' | 'va'>('qris');
  const [isProcessing, setIsProcessing] = useState(false);

  const tiers = [
    {
      id: 'monthly' as const,
      name: 'Spark Pro Bulanan',
      durationDays: 30,
      price: 'Rp 150.000',
      tokens: 10,
      badge: 'Standar Panitia',
      desc: 'Masa aktif 30 hari dengan kuota 10 website event live terverifikasi.'
    },
    {
      id: 'semester' as const,
      name: 'Spark Pro Semester',
      durationDays: 180,
      price: 'Rp 750.000',
      tokens: 25,
      badge: 'Hemat 20% Kampus',
      desc: 'Masa aktif 180 hari (6 bulan) dengan kuota 25 website event live.'
    },
    {
      id: 'topup' as const,
      name: 'Top Up Token (+5 Event)',
      durationDays: 0,
      price: 'Rp 65.000',
      tokens: 5,
      badge: 'Ekstensi Kuota',
      desc: 'Menambah 5 slot token website langsung tanpa mengubah masa aktif.'
    }
  ];

  const currentTier = tiers.find((t) => t.id === selectedTier) || tiers[0];

  const getTargetExpiryFormatted = (days: number) => {
    if (days === 0) return 'Mengikuti periode aktif berjalan';
    const target = new Date();
    target.setDate(target.getDate() + days);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(target);
  };

  const handlePay = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      if (onRenewSuccess) {
        onRenewSuccess(
          currentTier.durationDays,
          currentTier.name,
          currentTier.price,
          currentTier.tokens
        );
      }
      onClose();
    }, 1200);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="spark-sub-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#0b0c0e]/60 backdrop-blur-xs"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-[#e2e5ea] overflow-hidden animate-fadeIn flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="relative bg-[#0b0c0e] text-white p-6 sm:p-7 shrink-0 border-b border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer text-sm"
            aria-label="Tutup modal"
          >
            ✕
          </button>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-white text-[10px] font-mono uppercase tracking-wider mb-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1f2de6]"></span>
            <span>Aktivasi &amp; Perpanjangan Lisensi</span>
          </div>

          <h2 id="spark-sub-title" className="text-xl sm:text-2xl font-extrabold tracking-tight text-white font-heading">
            Langganan Spark Pro
          </h2>
          <p className="text-white/60 text-xs sm:text-sm mt-1">
            Pilih paket masa aktif dan kuota token event untuk kepanitiaan Anda.
          </p>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-7 overflow-y-auto space-y-5 flex-1 bg-white">
          {/* Package Selection */}
          <div className="space-y-3">
            <label className="text-xs font-mono font-bold text-[#585d6b] uppercase tracking-wider block">
              1. Pilih Paket &amp; Durasi
            </label>

            <div className="grid grid-cols-1 gap-2.5">
              {tiers.map((tier) => {
                const isSelected = selectedTier === tier.id;
                return (
                  <div
                    key={tier.id}
                    onClick={() => setSelectedTier(tier.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'border-[#1f2de6] bg-[#f8f9ff] ring-1 ring-[#1f2de6]'
                        : 'border-[#e2e5ea] bg-white hover:border-[#cbd5e1]'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-heading font-bold text-sm text-[#0b0c0e]">
                          {tier.name}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#edf2ff] text-[#1f2de6]">
                          {tier.badge}
                        </span>
                      </div>
                      <p className="text-xs text-[#585d6b] leading-tight">
                        {tier.desc}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-heading font-extrabold text-sm text-[#0b0c0e] block">
                        {tier.price}
                      </span>
                      <span className="text-[10px] font-mono text-emerald-700 font-semibold">
                        +{tier.tokens} Token
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-2.5">
            <label className="text-xs font-mono font-bold text-[#585d6b] uppercase tracking-wider block">
              2. Metode Pembayaran Instan
            </label>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('qris')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                  paymentMethod === 'qris'
                    ? 'border-[#1f2de6] bg-[#f8f9ff] ring-1 ring-[#1f2de6]'
                    : 'border-[#e2e5ea] bg-white hover:border-[#cbd5e1]'
                }`}
              >
                <span className="material-symbols-outlined text-[20px] text-[#1f2de6]">
                  qr_code_scanner
                </span>
                <div>
                  <span className="text-xs font-bold text-[#0b0c0e] block">QRIS</span>
                  <span className="text-[10px] text-[#8c93a0] block font-mono">Gopay, OVO, BCA, Dana</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('va')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                  paymentMethod === 'va'
                    ? 'border-[#1f2de6] bg-[#f8f9ff] ring-1 ring-[#1f2de6]'
                    : 'border-[#e2e5ea] bg-white hover:border-[#cbd5e1]'
                }`}
              >
                <span className="material-symbols-outlined text-[20px] text-[#585d6b]">
                  account_balance
                </span>
                <div>
                  <span className="text-xs font-bold text-[#0b0c0e] block">Virtual Account</span>
                  <span className="text-[10px] text-[#8c93a0] block font-mono">BCA, Mandiri, BNI, BRI</span>
                </div>
              </button>
            </div>
          </div>

          {/* Breakdown Preview */}
          <div className="p-4 rounded-xl bg-[#f8f9fb] border border-[#e2e5ea] space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between text-[#585d6b]">
              <span>Tanggal Aktivasi / Beli</span>
              <strong className="text-[#0b0c0e]">{new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())}</strong>
            </div>
            <div className="flex items-center justify-between text-[#585d6b]">
              <span>Habis Masa Berlaku (Jatuh Tempo)</span>
              <strong className="text-emerald-700">{getTargetExpiryFormatted(currentTier.durationDays)}</strong>
            </div>
            <div className="flex items-center justify-between text-[#585d6b] pt-1 border-t border-[#e2e5ea]">
              <span>Total Pembayaran</span>
              <strong className="text-sm font-heading font-extrabold text-[#0b0c0e]">{currentTier.price}</strong>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 sm:p-6 bg-[#f8f9fb] border-t border-[#e2e5ea] flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2.5 rounded-lg border border-[#e2e5ea] text-xs font-semibold text-[#585d6b] hover:bg-white transition-colors cursor-pointer"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handlePay}
            disabled={isProcessing}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-[#1f2de6] hover:bg-[#1622b8] text-white text-xs sm:text-sm font-semibold tracking-tight shadow-xs transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
          >
            {isProcessing ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Memproses Transaksi...</span>
              </span>
            ) : (
              <span>Konfirmasi &amp; Bayar {currentTier.price}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
