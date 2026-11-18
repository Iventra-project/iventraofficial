import { useState, useEffect } from 'react';
import {
  PACKAGES,
  ConsultationFormData,
  validateConsultationForm,
  generateWhatsAppMessage
} from '../utils/pricing.ts';

interface ConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPlan?: 'spark' | 'flow' | 'bot' | null;
}

export default function ConsultationModal({
  isOpen,
  onClose,
  initialPlan = 'flow'
}: ConsultationModalProps) {
  const [formData, setFormData] = useState<ConsultationFormData>({
    name: '',
    campus: '',
    eventName: '',
    planId: initialPlan || 'flow',
    estimatedParticipants: 250,
    contactNumber: '',
    notes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (initialPlan) {
      setFormData((prev) => ({ ...prev, planId: initialPlan }));
    }
    setIsSubmitted(false);
    setErrors({});
  }, [initialPlan, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateConsultationForm(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }
    setErrors({});
    setIsSubmitted(true);

    // Save lead to SQLite database
    fetch('/api/consultations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    }).catch((err) => {
      console.warn('Gagal menyimpan lead ke SQLite backend:', err);
    });
  };

  const encodedMessage = generateWhatsAppMessage(formData);
  const waUrl = `https://wa.me/6281234567890?text=${encodedMessage}`;

  const copyToClipboard = () => {
    const rawMessage = decodeURIComponent(encodedMessage);
    navigator.clipboard.writeText(rawMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="consultation-title"
    >
      <div
        className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-[#efecff] overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-5 bg-[#0b0c0e] text-white flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center font-mono text-xs text-[#1f2de6] font-bold">
              IVN
            </div>
            <div>
              <h3 id="consultation-title" className="text-base font-bold text-white tracking-tight">
                Konsultasi &amp; Implementasi Sistem
              </h3>
              <p className="text-xs text-white/60 font-mono">
                SLA respon resmi tim Iventra &lt;15 menit
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer text-sm font-mono"
            aria-label="Tutup Dialog"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto bg-white">
          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Package Selector */}
              <div>
                <label className="block text-xs font-mono font-bold text-[#585d6b] mb-2 uppercase tracking-wide">
                  Pilihan Paket Layanan
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['spark', 'flow', 'bot'] as const).map((pid) => {
                    const pkg = PACKAGES[pid];
                    const selected = formData.planId === pid;
                    return (
                      <button
                        key={pid}
                        type="button"
                        onClick={() => setFormData({ ...formData, planId: pid })}
                        className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
                          selected
                            ? 'bg-[#f4f5f8] border-[#0b0c0e] text-[#0b0c0e] ring-1 ring-[#0b0c0e]'
                            : 'bg-white border-[#e2e5ea] text-[#585d6b] hover:border-[#b0b6c2]'
                        }`}
                      >
                        <div className="text-xs font-bold flex items-center justify-between">
                          <span>{pkg.name}</span>
                          {pkg.isPopular && (
                            <span className="text-[9px] font-mono bg-[#1f2de6] text-white px-1.5 py-0.5 rounded">
                              Top
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-mono font-bold text-[#1f2de6] mt-1">
                          {pkg.priceLabel.split(' ')[0]} {pkg.priceLabel.split(' ')[1] || ''}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Contact Name & Campus */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="panitia-name" className="block text-xs font-bold text-[#0b0c0e] mb-1">
                    Nama Panitia *
                  </label>
                  <input
                    id="panitia-name"
                    type="text"
                    required
                    placeholder="Contoh: Rian Pratama"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#e2e5ea] focus:border-[#0b0c0e] focus:ring-1 focus:ring-[#0b0c0e] text-sm outline-hidden text-[#0b0c0e] bg-white"
                  />
                  {errors.name && (
                    <p className="text-[11px] font-mono text-red-600 mt-1">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="panitia-campus" className="block text-xs font-bold text-[#0b0c0e] mb-1">
                    Organisasi / Kampus *
                  </label>
                  <input
                    id="panitia-campus"
                    type="text"
                    required
                    placeholder="Contoh: BEM FT UI"
                    value={formData.campus}
                    onChange={(e) => setFormData({ ...formData, campus: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#e2e5ea] focus:border-[#0b0c0e] focus:ring-1 focus:ring-[#0b0c0e] text-sm outline-hidden text-[#0b0c0e] bg-white"
                  />
                  {errors.campus && (
                    <p className="text-[11px] font-mono text-red-600 mt-1">{errors.campus}</p>
                  )}
                </div>
              </div>

              {/* Event Name & WA Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="panitia-event" className="block text-xs font-bold text-[#0b0c0e] mb-1">
                    Nama Acara / Event *
                  </label>
                  <input
                    id="panitia-event"
                    type="text"
                    required
                    placeholder="Contoh: Engineering Career Expo"
                    value={formData.eventName}
                    onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#e2e5ea] focus:border-[#0b0c0e] focus:ring-1 focus:ring-[#0b0c0e] text-sm outline-hidden text-[#0b0c0e] bg-white"
                  />
                  {errors.eventName && (
                    <p className="text-[11px] font-mono text-red-600 mt-1">{errors.eventName}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="panitia-wa" className="block text-xs font-bold text-[#0b0c0e] mb-1">
                    No. WhatsApp Aktif *
                  </label>
                  <input
                    id="panitia-wa"
                    type="tel"
                    required
                    placeholder="081234567890"
                    value={formData.contactNumber}
                    onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#e2e5ea] focus:border-[#0b0c0e] focus:ring-1 focus:ring-[#0b0c0e] text-sm outline-hidden text-[#0b0c0e] bg-white font-mono"
                  />
                  {errors.contactNumber && (
                    <p className="text-[11px] font-mono text-red-600 mt-1">{errors.contactNumber}</p>
                  )}
                </div>
              </div>

              {/* Estimated Participants */}
              <div className="p-3.5 rounded-lg bg-[#f8f9fb] border border-[#e2e5ea]">
                <div className="flex justify-between items-center mb-2">
                  <label htmlFor="panitia-participants" className="text-xs font-bold text-[#0b0c0e]">
                    Estimasi Peserta
                  </label>
                  <span className="text-xs font-mono font-bold text-[#1f2de6] px-2 py-0.5 rounded bg-white border border-[#e2e5ea]">
                    {formData.estimatedParticipants} orang
                  </span>
                </div>
                <input
                  id="panitia-participants"
                  type="range"
                  min="20"
                  max="3000"
                  step="20"
                  value={formData.estimatedParticipants}
                  onChange={(e) =>
                    setFormData({ ...formData, estimatedParticipants: Number(e.target.value) })
                  }
                  className="w-full accent-[#1f2de6] cursor-pointer"
                />
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="panitia-notes" className="block text-xs font-bold text-[#0b0c0e] mb-1">
                  Kebutuhan Khusus / Format Seleksi (Opsional)
                </label>
                <textarea
                  id="panitia-notes"
                  rows={2}
                  placeholder="Contoh: Butuh sistem penilaian dewan juri online dan barcode tiket H-1."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-lg border border-[#e2e5ea] focus:border-[#0b0c0e] text-sm outline-hidden resize-none text-[#0b0c0e]"
                />
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-lg bg-[#1f2de6] hover:bg-[#1622b8] text-white font-semibold text-sm transition-all active:scale-[0.99] cursor-pointer shadow-xs"
                >
                  Generate Draf WhatsApp &amp; Hubungi Tim
                </button>
              </div>
            </form>
          ) : (
            /* Submission / WhatsApp Preview View */
            <div className="space-y-4 animate-fadeIn">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 font-mono text-sm font-bold">
                  ✓
                </span>
                <div>
                  <h4 className="text-sm font-bold text-emerald-900">
                    Draf Pesan Konsultasi Siap Diteruskan
                  </h4>
                  <p className="text-xs text-emerald-700">
                    Kirim langsung ke kontak teknis Iventra untuk respon cepat.
                  </p>
                </div>
              </div>

              {/* WhatsApp Message Preview Bubble */}
              <div className="bg-[#f8f9fb] p-4 rounded-xl border border-[#e2e5ea] text-left">
                <div className="text-[11px] font-mono font-bold text-[#585d6b] mb-2 uppercase tracking-wider flex items-center justify-between">
                  <span>Pratinjau Pesan Terstruktur</span>
                  <button
                    type="button"
                    onClick={copyToClipboard}
                    className="text-[#1f2de6] hover:underline font-mono cursor-pointer text-xs font-bold"
                  >
                    {copied ? 'Tersalin ✓' : 'Salin Pesan'}
                  </button>
                </div>
                <pre className="text-xs text-[#0b0c0e] whitespace-pre-wrap font-mono bg-white p-3 rounded-lg border border-[#e2e5ea] leading-relaxed">
                  {decodeURIComponent(encodedMessage)}
                </pre>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-[#1f2de6] hover:bg-[#1622b8] text-white font-semibold text-sm transition-colors text-center active:scale-[0.99]"
                >
                  <span>Buka WhatsApp Sekarang</span>
                  <span className="font-mono text-xs">→</span>
                </a>
                <button
                  type="button"
                  onClick={() => setIsSubmitted(false)}
                  className="px-5 py-3 rounded-lg bg-[#f4f5f8] border border-[#e2e5ea] text-[#0b0c0e] font-semibold text-sm hover:bg-[#e2e5ea] transition-colors cursor-pointer"
                >
                  Ubah Rincian
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
