import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Check,
  ExternalLink,
  FolderGit2,
  X,
  MessageSquare
} from 'lucide-react';
import Logo from './Logo.tsx';
import { generateWhatsAppMessage } from '../utils/pricing.ts';

interface ExpertConsultationPageProps {
  onBack: () => void;
  onOpenTracker?: () => void;
}

const PORTFOLIO_ITEMS = [
  {
    title: 'Engineering Career & Tech Expo 2025',
    org: 'BEM FT Universitas Indonesia',
    type: 'Multi-Stage Competition & Expo',
    stats: '1.420+ Peserta · QR Presensi On-site',
    status: 'Selesai & Sukses'
  },
  {
    title: 'National Student Business Case Challenge',
    org: 'BEM KM Universitas Gadjah Mada',
    type: 'Penjurian Berkas & Pitching Final',
    stats: '450 Tim · Portal Juri Kustom',
    status: 'Selesai & Sukses'
  },
  {
    title: 'Festival Seni & Dies Natalis Kolaboratif',
    org: 'Institut Teknologi Bandung',
    type: 'Ticketing & Gate Scanner Hari-H',
    stats: '3.200 Tiket QR · WhatsApp Blast H-1',
    status: 'Selesai & Sukses'
  }
];

export default function ExpertConsultationPage({
  onBack,
  onOpenTracker
}: ExpertConsultationPageProps) {
  const [name, setName] = useState('');
  const [campus, setCampus] = useState('');
  const [eventName, setEventName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [participants, setParticipants] = useState('500 - 1.500');
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !whatsapp.trim() || !eventName.trim()) {
      alert('Mohon lengkapi Nama, Nama Acara, dan Nomor WhatsApp.');
      return;
    }

    setIsSubmitting(true);

    const formData = {
      name,
      campus: campus || 'Umum / Institusi',
      eventName,
      planId: 'flow' as const,
      estimatedParticipants: parseInt(participants.replace(/\D/g, '')) || 500,
      contactNumber: whatsapp,
      notes
    };

    try {
      await fetch('/api/consultations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
    } catch (err) {
      console.warn('Gagal menyimpan konsultasi:', err);
    } finally {
      setIsSubmitting(false);
      setIsSuccess(true);
    }
  };

  const getWaUrl = () => {
    const encoded = generateWhatsAppMessage({
      name,
      campus: campus || '-',
      eventName,
      planId: 'flow',
      estimatedParticipants: parseInt(participants.replace(/\D/g, '')) || 500,
      contactNumber: whatsapp,
      notes
    });
    return `https://wa.me/6281234567890?text=${encoded}`;
  };

  // SUCCESS VIEW
  if (isSuccess) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#f8fafc] p-4 text-slate-900">
        <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl p-8 text-center space-y-6">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <Check className="h-7 w-7 stroke-[3]" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900">
              Pengajuan Terkirim
            </h2>
          </div>

          <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-left text-xs space-y-2.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Nama PIC</span>
              <span className="font-semibold text-slate-900">{name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Acara</span>
              <span className="font-semibold text-slate-900">{eventName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">WhatsApp</span>
              <span className="font-semibold text-slate-900">{whatsapp}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Layanan</span>
              <span className="font-bold text-blue-600">Iventra Expert (Full Service)</span>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <a
              href={getWaUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-600/20"
            >
              <MessageSquare className="h-4 w-4" />
              <span>Lanjut Diskusi di WhatsApp</span>
            </a>

            <button
              type="button"
              onClick={onBack}
              className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium text-xs hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Kembali ke Beranda
            </button>
          </div>
        </div>
      </div>
    );
  }

  // SPLIT VIEW
  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#f8fafc] text-slate-900">
      {/* SECTION KIRI: TABEL KEUNGGULAN EXPERT & TOMBOL PORTOFOLIO */}
      <section className="w-full lg:w-1/2 p-6 sm:p-10 lg:p-12 xl:p-16 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-200">
        <div className="max-w-xl w-full mx-auto space-y-6">
          {/* Header Navigasi */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="flex items-center justify-center h-8 w-8 rounded-full border border-slate-200 bg-white hover:bg-slate-100 transition-colors text-slate-600 cursor-pointer"
              aria-label="Kembali"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2">
              <Logo size="sm" />
              <span className="font-display font-extrabold text-slate-900 text-base tracking-tight">
                IVENTRA
              </span>
            </div>
          </div>

          {/* Judul Bersih Tanpa Teks Tambahan */}
          <h1 className="text-2xl sm:text-3xl font-display font-black tracking-tight text-slate-900">
            Keunggulan Iventra Expert
          </h1>

          {/* Tabel Keunggulan */}
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-700 font-semibold">
                <tr>
                  <th className="py-3 px-4">Layanan &amp; Spesifikasi</th>
                  <th className="py-3 px-4 text-blue-600 font-bold bg-blue-50/50">Iventra Expert</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr>
                  <td className="py-2.5 px-4 font-medium">Model Layanan</td>
                  <td className="py-2.5 px-4 font-semibold text-slate-900 bg-blue-50/20">Full Service (End-to-End)</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-medium">Desain Web Event</td>
                  <td className="py-2.5 px-4 font-semibold text-blue-600 bg-blue-50/20">Desain Kustom Eksklusif UI/UX</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-medium">Kapasitas Peserta &amp; Trafik</td>
                  <td className="py-2.5 px-4 font-semibold text-slate-900 bg-blue-50/20">Tanpa Batas (Unlimited)</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-medium">Payment Gateway</td>
                  <td className="py-2.5 px-4 font-semibold text-emerald-600 bg-blue-50/20">Multi-bank, QRIS &amp; Verifikasi Otomatis</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-medium">Sistem Scanner QR On-Site</td>
                  <td className="py-2.5 px-4 font-semibold text-emerald-600 bg-blue-50/20">Aplikasi Scanner Panitia Hari-H</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-medium">Broadcast &amp; Notifikasi WA</td>
                  <td className="py-2.5 px-4 font-semibold text-emerald-600 bg-blue-50/20">Mesin WhatsApp Blast Resmi</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-medium">Dedicated Project Manager</td>
                  <td className="py-2.5 px-4 font-semibold text-slate-900 bg-blue-50/20">Pendampingan 1-on-1 &amp; SLA 24 Jam</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-medium">Dukungan Teknis Hari-H</td>
                  <td className="py-2.5 px-4 font-semibold text-slate-900 bg-blue-50/20">Pendampingan On-Site &amp; Monitoring</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Tombol Portofolio */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowPortfolioModal(true)}
              className="w-full py-3 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-900 text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <FolderGit2 className="h-4 w-4 text-blue-600" />
              <span>Lihat Portofolio Event</span>
            </button>
          </div>
        </div>

        <div className="max-w-xl w-full mx-auto pt-6 text-[11px] text-slate-400 font-mono">
          IVENTRA EXPERT · FULL SERVICE ENTERPRISE
        </div>
      </section>

      {/* SECTION KANAN: FORM KONSULTASI BERLATAR PUTIH */}
      <section className="w-full lg:w-1/2 bg-white p-6 sm:p-10 lg:p-12 xl:p-16 flex flex-col justify-center">
        <form
          onSubmit={handleSubmit}
          className="max-w-md w-full mx-auto space-y-4 text-left"
        >
          {/* Judul Bersih Tanpa Teks Tambahan */}
          <h2 className="text-2xl font-display font-bold tracking-tight text-slate-900 mb-2">
            Konsultasi Event
          </h2>

          {/* Nama PIC */}
          <div className="space-y-1.5">
            <label htmlFor="exp-name" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Nama Panitia / PIC
            </label>
            <input
              id="exp-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama lengkap"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-600 focus:bg-white transition-all"
            />
          </div>

          {/* Nama Acara */}
          <div className="space-y-1.5">
            <label htmlFor="exp-event" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Nama Acara
            </label>
            <input
              id="exp-event"
              type="text"
              required
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="Contoh: Tech Expo & Seminar 2026"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-600 focus:bg-white transition-all"
            />
          </div>

          {/* Organisasi / Kampus */}
          <div className="space-y-1.5">
            <label htmlFor="exp-campus" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Organisasi / Kampus
            </label>
            <input
              id="exp-campus"
              type="text"
              value={campus}
              onChange={(e) => setCampus(e.target.value)}
              placeholder="Contoh: BEM FT UI"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-600 focus:bg-white transition-all"
            />
          </div>

          {/* WhatsApp & Estimasi Peserta */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="exp-wa" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                No. WhatsApp
              </label>
              <input
                id="exp-wa"
                type="tel"
                required
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="081234567890"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-600 focus:bg-white transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="exp-part" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Estimasi Peserta
              </label>
              <select
                id="exp-part"
                value={participants}
                onChange={(e) => setParticipants(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-600 focus:bg-white transition-all cursor-pointer"
              >
                <option value="100 - 500">100 - 500 orang</option>
                <option value="500 - 1.500">500 - 1.500 orang</option>
                <option value="1.500 - 5.000">1.500 - 5.000 orang</option>
                <option value="5.000+">5.000+ orang</option>
              </select>
            </div>
          </div>

          {/* Catatan Kebutuhan */}
          <div className="space-y-1.5">
            <label htmlFor="exp-notes" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Catatan Kebutuhan
            </label>
            <textarea
              id="exp-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Jelaskan kebutuhan khusus atau target tanggal acara..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-600 focus:bg-white transition-all resize-none"
            />
          </div>

          {/* Tombol Kirim */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
            >
              {isSubmitting ? (
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>Kirim Pengajuan Konsultasi</span>
              )}
            </button>
          </div>
        </form>
      </section>

      {/* PORTOFOLIO MODAL */}
      {showPortfolioModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FolderGit2 className="h-5 w-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Portofolio Event Iventra
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPortfolioModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors"
                aria-label="Tutup"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              {PORTFOLIO_ITEMS.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {item.org} · {item.type}
                    </p>
                    <span className="text-[10px] text-blue-600 font-mono font-semibold block mt-0.5">
                      {item.stats}
                    </span>
                  </div>
                  <span className="self-start sm:self-center px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                    {item.status}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              {onOpenTracker && (
                <button
                  type="button"
                  onClick={() => {
                    setShowPortfolioModal(false);
                    onOpenTracker();
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <span>Cek Pelacak Proyek (Live Tracker)</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowPortfolioModal(false)}
                className="py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 cursor-pointer transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
