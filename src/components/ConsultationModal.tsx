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
        <div className="px-6 py-5 bg-gradient-to-r from-[#0c1df3] to-[#3b47dc] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">chat</span>
            </div>
            <div>
              <h3 id="consultation-title" className="text-lg font-bold text-white">
                Konsultasi &amp; Penyiapan Sistem
              </h3>
              <p className="text-xs text-white/80">
                Respon cepat via WhatsApp resmi tim Iventra
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Tutup Dialog"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto">
          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Package Selector */}
              <div>
                <label className="block text-xs font-bold text-[#454557] mb-2 uppercase tracking-wide">
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
                        className={`p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                          selected
                            ? 'bg-[#efecff] border-[#0c1df3] text-[#000cb8] shadow-xs'
                            : 'bg-[#f5f2ff]/60 border-[#efecff] text-[#454557] hover:border-[#0c1df3]/40'
                        }`}
                      >
                        <div className="text-xs font-extrabold flex items-center justify-between">
                          <span>{pkg.name}</span>
                          {pkg.isPopular && (
                            <span className="text-[9px] bg-[#0c1df3] text-white px-1.5 py-0.2 rounded-full">
                              Top
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-bold text-[#0c1df3] mt-1">
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
                  <label htmlFor="panitia-name" className="block text-xs font-bold text-[#191930] mb-1">
                    Nama Panitia *
                  </label>
                  <input
                    id="panitia-name"
                    type="text"
                    required
                    placeholder="Contoh: Rian Pratama"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#c5c5da] focus:border-[#0c1df3] focus:ring-2 focus:ring-[#0c1df3]/20 text-sm outline-hidden"
                  />
                  {errors.name && (
                    <p className="text-[11px] text-[#ba1a1a] mt-1">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="panitia-campus" className="block text-xs font-bold text-[#191930] mb-1">
                    Organisasi / Kampus *
                  </label>
                  <input
                    id="panitia-campus"
                    type="text"
                    required
                    placeholder="Contoh: BEM FT UI"
                    value={formData.campus}
                    onChange={(e) => setFormData({ ...formData, campus: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#c5c5da] focus:border-[#0c1df3] focus:ring-2 focus:ring-[#0c1df3]/20 text-sm outline-hidden"
                  />
                  {errors.campus && (
                    <p className="text-[11px] text-[#ba1a1a] mt-1">{errors.campus}</p>
                  )}
                </div>
              </div>

              {/* Event Name & WA Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="panitia-event" className="block text-xs font-bold text-[#191930] mb-1">
                    Nama Acara / Event *
                  </label>
                  <input
                    id="panitia-event"
                    type="text"
                    required
                    placeholder="Contoh: Engineering Career Expo"
                    value={formData.eventName}
                    onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#c5c5da] focus:border-[#0c1df3] focus:ring-2 focus:ring-[#0c1df3]/20 text-sm outline-hidden"
                  />
                  {errors.eventName && (
                    <p className="text-[11px] text-[#ba1a1a] mt-1">{errors.eventName}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="panitia-wa" className="block text-xs font-bold text-[#191930] mb-1">
                    No. WhatsApp Aktif *
                  </label>
                  <input
                    id="panitia-wa"
                    type="tel"
                    required
                    placeholder="081234567890"
                    value={formData.contactNumber}
                    onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#c5c5da] focus:border-[#0c1df3] focus:ring-2 focus:ring-[#0c1df3]/20 text-sm outline-hidden"
                  />
                  {errors.contactNumber && (
                    <p className="text-[11px] text-[#ba1a1a] mt-1">{errors.contactNumber}</p>
                  )}
                </div>
              </div>

              {/* Estimated Participants */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor="panitia-participants" className="text-xs font-bold text-[#191930]">
                    Estimasi Peserta
                  </label>
                  <span className="text-xs font-extrabold text-[#000cb8]">
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
                  className="w-full accent-[#0c1df3] cursor-pointer"
                />
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="panitia-notes" className="block text-xs font-bold text-[#191930] mb-1">
                  Kebutuhan Khusus / Format Seleksi (Opsional)
                </label>
                <textarea
                  id="panitia-notes"
                  rows={2}
                  placeholder="Contoh: Butuh sistem penilaian dewan juri online dan barcode tiket H-1."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#c5c5da] focus:border-[#0c1df3] text-sm outline-hidden resize-none"
                />
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#0c1df3] to-[#3b47dc] text-white font-bold text-sm shadow-[0_8px_20px_rgba(12,29,243,0.35)] hover:-translate-y-0.5 transition-transform cursor-pointer"
                >
                  Lihat Draf Pesan &amp; Hubungi Sekarang
                </button>
              </div>
            </form>
          ) : (
            /* Submission / WhatsApp Preview View */
            <div className="space-y-4 animate-fadeIn">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
                <span className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px]">check</span>
                </span>
                <div>
                  <h4 className="text-sm font-bold text-emerald-900">
                    Draf Pesan Konsultasi Siap!
                  </h4>
                  <p className="text-xs text-emerald-700">
                    Kirim langsung ke kontak konsultan Iventra untuk tanggapan instan.
                  </p>
                </div>
              </div>

              {/* WhatsApp Message Preview Bubble */}
              <div className="bg-[#f5f2ff] p-4 rounded-2xl border border-[#efecff] text-left">
                <div className="text-[11px] font-bold text-[#454557] mb-2 uppercase tracking-wider flex items-center justify-between">
                  <span>Pratinjau Pesan WhatsApp</span>
                  <button
                    type="button"
                    onClick={copyToClipboard}
                    className="text-[#0c1df3] hover:underline font-semibold cursor-pointer text-xs"
                  >
                    {copied ? 'Tersalin ✓' : 'Salin Teks'}
                  </button>
                </div>
                <pre className="text-xs text-[#191930] whitespace-pre-wrap font-sans bg-white p-3 rounded-xl border border-[#efecff] leading-relaxed">
                  {decodeURIComponent(encodedMessage)}
                </pre>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 py-3.5 px-4 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-colors text-center"
                >
                  <span className="material-symbols-outlined text-[20px]">send</span>
                  <span>Buka WhatsApp Sekarang</span>
                </a>
                <button
                  type="button"
                  onClick={() => setIsSubmitted(false)}
                  className="px-5 py-3 rounded-full bg-[#efecff] text-[#0c1df3] font-bold text-sm hover:bg-[#e8e5ff] transition-colors cursor-pointer"
                >
                  Ubah Data
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
