import { useState, useEffect } from 'react';
import { DEMO_PROJECTS, lookupProject, ProjectData } from '../utils/projectTracker.ts';

interface ProjectTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialProjectId?: string;
}

export default function ProjectTrackerModal({
  isOpen,
  onClose,
  initialProjectId
}: ProjectTrackerModalProps) {
  const [searchId, setSearchId] = useState(initialProjectId || 'IVN-2025-FTUI');
  const [project, setProject] = useState<ProjectData | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      const targetId = initialProjectId || searchId || 'IVN-2025-FTUI';
      setSearchId(targetId);
      handleSearch(targetId);
    }
  }, [isOpen, initialProjectId]);

  if (!isOpen) return null;

  const handleSearch = async (id: string) => {
    setErrorMsg('');
    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(id.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setProject(data);
        return;
      }
    } catch {
      // Fallback to local demo
    }

    const found = lookupProject(id);
    if (found) {
      setProject(found);
    } else {
      setProject(null);
      setErrorMsg(`Project dengan kode "${id}" tidak ditemukan. Coba kode demo di bawah.`);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tracker-title"
    >
      <div
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-[#efecff] overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-[#0c1df3] to-[#3b47dc] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">rocket_launch</span>
            </div>
            <div>
              <h3 id="tracker-title" className="text-lg font-bold text-white">
                Live Project Tracker
              </h3>
              <p className="text-xs text-white/80">
                Pantau progres penyiapan sistem &amp; status live event kepanitiaan
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Tutup Dialog Tracker"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Search Bar & Demo Chips */}
        <div className="p-6 border-b border-[#efecff] bg-[#f5f2ff]/40">
          <label htmlFor="tracker-input" className="block text-xs font-bold text-[#454557] mb-2 uppercase tracking-wide">
            Masukkan Kode Project / Tiket Panitia
          </label>
          <div className="flex gap-2">
            <input
              id="tracker-input"
              type="text"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value.toUpperCase())}
              placeholder="Contoh: IVN-2025-FTUI"
              className="flex-1 px-4 py-2.5 rounded-xl border border-[#c5c5da] focus:border-[#0c1df3] focus:ring-2 focus:ring-[#0c1df3]/20 text-sm font-mono uppercase font-semibold"
            />
            <button
              type="button"
              onClick={() => handleSearch(searchId)}
              className="px-5 py-2.5 rounded-xl bg-[#0c1df3] hover:bg-[#000cb8] text-white text-sm font-bold transition-colors cursor-pointer"
            >
              Cek Status
            </button>
          </div>

          {/* Quick Demo Chips */}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className="text-[11px] text-[#757589] font-medium">Contoh Demo:</span>
            {Object.keys(DEMO_PROJECTS).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => {
                  setSearchId(k);
                  handleSearch(k);
                }}
                className={`text-[11px] font-mono px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                  searchId === k
                    ? 'bg-[#0c1df3] text-white border-[#0c1df3]'
                    : 'bg-white border-[#efecff] text-[#000cb8] hover:bg-[#efecff]'
                }`}
              >
                {k}
              </button>
            ))}
          </div>

          {errorMsg && (
            <p className="text-xs text-[#ba1a1a] mt-2 font-medium">{errorMsg}</p>
          )}
        </div>

        {/* Project Details */}
        {project && (
          <div className="p-6 overflow-y-auto space-y-6">
            {/* Top Project Card */}
            <div className="bg-[#f5f2ff] p-5 rounded-2xl border border-[#efecff] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold text-[#0c1df3] uppercase tracking-wider">
                  {project.organization}
                </span>
                <h4 className="text-lg font-bold text-[#191930] mt-0.5">
                  {project.eventName}
                </h4>
                <div className="text-xs text-[#757589] mt-1 flex items-center gap-2">
                  <span>Paket: <strong className="text-[#191930]">{project.packageType}</strong></span>
                  <span>·</span>
                  <span>Update: {project.updatedAt}</span>
                </div>
              </div>
              <div className="self-start sm:self-center">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                  {project.statusBadge}
                </span>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl bg-white border border-[#efecff] shadow-xs">
                <div className="text-xs text-[#757589] font-medium">Pendaftar Terverifikasi</div>
                <div className="text-2xl font-extrabold text-[#000cb8] mt-1 tabular-nums">
                  {project.registeredCount.toLocaleString('id-ID')}
                </div>
                <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">
                  Target: {project.targetCount}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white border border-[#efecff] shadow-xs">
                <div className="text-xs text-[#757589] font-medium">WhatsApp Reminder</div>
                <div className="text-2xl font-extrabold text-[#0c1df3] mt-1 tabular-nums">
                  {project.whatsappRemindersSent.toLocaleString('id-ID')}
                </div>
                <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">
                  100% Terkirim ke Peserta
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white border border-[#efecff] shadow-xs">
                <div className="text-xs text-[#757589] font-medium">E-Sertifikat Digital</div>
                <div className="text-lg font-extrabold text-[#191930] mt-1">
                  {project.certificatesReady ? 'Siap Generate' : 'Tahap Seleksi'}
                </div>
                <div className="text-[11px] text-[#757589] mt-0.5">
                  QR Code Verifier Aktif
                </div>
              </div>
            </div>

            {/* 4 Steps Timeline */}
            <div>
              <h5 className="text-xs font-bold text-[#454557] mb-3 uppercase tracking-wide">
                Alur Tahapan Penyiapan Sistem
              </h5>
              <div className="space-y-3">
                {project.steps.map((st) => {
                  const isDone = st.status === 'completed';
                  const isCur = st.status === 'current';
                  return (
                    <div
                      key={st.id}
                      className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                        isDone
                          ? 'bg-emerald-50/60 border-emerald-200'
                          : isCur
                          ? 'bg-[#efecff] border-[#0c1df3] shadow-xs'
                          : 'bg-white border-[#efecff] opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                            isDone
                              ? 'bg-emerald-600 text-white'
                              : isCur
                              ? 'bg-[#0c1df3] text-white animate-pulse'
                              : 'bg-[#efecff] text-[#757589]'
                          }`}
                        >
                          {isDone ? '✓' : st.id}
                        </span>
                        <div>
                          <div className="text-sm font-bold text-[#191930]">
                            {st.title}
                          </div>
                          <div className="text-xs text-[#757589]">
                            {st.desc}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        {isDone && (
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                            Selesai {st.dateCompleted ? `(${st.dateCompleted})` : ''}
                          </span>
                        )}
                        {isCur && (
                          <span className="text-[10px] font-bold text-[#0c1df3] bg-white px-2 py-0.5 rounded-full border border-[#0c1df3]/30">
                            Sedang Berjalan
                          </span>
                        )}
                        {!isDone && !isCur && (
                          <span className="text-[10px] font-medium text-[#757589]">
                            Akan Datang
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
