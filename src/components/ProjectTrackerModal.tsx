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
        <div className="px-6 py-5 bg-[#0b0c0e] text-white flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center font-mono text-xs text-[#1f2de6] font-bold">
              SYS
            </div>
            <div>
              <h3 id="tracker-title" className="text-base font-bold text-white tracking-tight">
                Live Deployment &amp; Event Tracker
              </h3>
              <p className="text-xs text-white/60 font-mono">
                Log status pipeline &amp; integrasi sistem kepanitiaan real-time
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer text-sm font-mono"
            aria-label="Tutup Dialog Tracker"
          >
            ✕
          </button>
        </div>

        {/* Search Bar & Demo Chips */}
        <div className="p-6 border-b border-[#e2e5ea] bg-[#f8f9fb]">
          <label htmlFor="tracker-input" className="block text-xs font-mono font-bold text-[#585d6b] mb-2 uppercase tracking-wide">
            Kode Registrasi Project / Tiket Panitia
          </label>
          <div className="flex gap-2">
            <input
              id="tracker-input"
              type="text"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value.toUpperCase())}
              placeholder="Contoh: IVN-2025-FTUI"
              className="flex-1 px-4 py-2.5 rounded-lg border border-[#e2e5ea] focus:border-[#0b0c0e] focus:ring-1 focus:ring-[#0b0c0e] text-sm font-mono uppercase font-semibold text-[#0b0c0e] bg-white outline-hidden"
            />
            <button
              type="button"
              onClick={() => handleSearch(searchId)}
              className="px-5 py-2.5 rounded-lg bg-[#0b0c0e] hover:bg-[#1f2de6] text-white text-xs font-mono uppercase font-bold tracking-wider transition-colors cursor-pointer"
            >
              Cek Status
            </button>
          </div>

          {/* Quick Demo Chips */}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className="text-[11px] font-mono text-[#585d6b]">Demo Case:</span>
            {Object.keys(DEMO_PROJECTS).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => {
                  setSearchId(k);
                  handleSearch(k);
                }}
                className={`text-[11px] font-mono px-2.5 py-1 rounded border transition-colors cursor-pointer ${
                  searchId === k
                    ? 'bg-[#0b0c0e] text-white border-[#0b0c0e]'
                    : 'bg-white border-[#e2e5ea] text-[#0b0c0e] hover:border-[#0b0c0e]'
                }`}
              >
                {k}
              </button>
            ))}
          </div>

          {errorMsg && (
            <p className="text-xs font-mono text-red-600 mt-2">{errorMsg}</p>
          )}
        </div>

        {/* Project Details */}
        {project && (
          <div className="p-6 overflow-y-auto space-y-6 bg-white">
            {/* Top Project Card */}
            <div className="bg-[#f8f9fb] p-5 rounded-xl border border-[#e2e5ea] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-mono font-bold text-[#1f2de6] uppercase tracking-wider">
                  {project.organization}
                </span>
                <h4 className="text-lg font-bold text-[#0b0c0e] tracking-tight mt-0.5">
                  {project.eventName}
                </h4>
                <div className="text-xs font-mono text-[#585d6b] mt-1 flex items-center gap-2">
                  <span>Paket: <strong className="text-[#0b0c0e]">{project.packageType}</strong></span>
                  <span>·</span>
                  <span>Update: {project.updatedAt}</span>
                </div>
              </div>
              <div className="self-start sm:self-center">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-mono font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                  {project.statusBadge}
                </span>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl bg-white border border-[#e2e5ea]">
                <div className="text-xs font-mono text-[#585d6b]">Pendaftar Terverifikasi</div>
                <div className="text-2xl font-mono font-extrabold text-[#0b0c0e] mt-1 tabular-nums">
                  {project.registeredCount.toLocaleString('id-ID')}
                </div>
                <div className="text-[11px] font-mono text-emerald-700 mt-0.5">
                  Target: {project.targetCount}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white border border-[#e2e5ea]">
                <div className="text-xs font-mono text-[#585d6b]">WhatsApp Reminder</div>
                <div className="text-2xl font-mono font-extrabold text-[#1f2de6] mt-1 tabular-nums">
                  {project.whatsappRemindersSent.toLocaleString('id-ID')}
                </div>
                <div className="text-[11px] font-mono text-emerald-700 mt-0.5">
                  100% Terkirim ke Peserta
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white border border-[#e2e5ea]">
                <div className="text-xs font-mono text-[#585d6b]">Sistem Gate QR</div>
                <div className="text-base font-bold text-[#0b0c0e] mt-2">
                  {project.certificatesReady ? 'Siap Generate LPJ' : 'Presensi Aktif'}
                </div>
                <div className="text-[11px] font-mono text-[#585d6b] mt-0.5">
                  Scanner latency &lt;0.5s
                </div>
              </div>
            </div>

            {/* 4 Steps Timeline */}
            <div>
              <h5 className="text-xs font-mono font-bold text-[#585d6b] mb-3 uppercase tracking-wide">
                Pipeline Verifikasi &amp; Implementasi
              </h5>
              <div className="space-y-2.5">
                {project.steps.map((st) => {
                  const isDone = st.status === 'completed';
                  const isCur = st.status === 'current';
                  return (
                    <div
                      key={st.id}
                      className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                        isDone
                          ? 'bg-white border-[#e2e5ea]'
                          : isCur
                          ? 'bg-[#f8f9fb] border-[#0b0c0e] shadow-xs'
                          : 'bg-white border-[#e2e5ea] opacity-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-6 h-6 rounded flex items-center justify-center text-xs font-mono font-bold shrink-0 ${
                            isDone
                              ? 'bg-emerald-600 text-white'
                              : isCur
                              ? 'bg-[#1f2de6] text-white'
                              : 'bg-[#f4f5f8] text-[#585d6b] border border-[#e2e5ea]'
                          }`}
                        >
                          {isDone ? '✓' : st.id}
                        </span>
                        <div>
                          <div className="text-sm font-bold text-[#0b0c0e]">
                            {st.title}
                          </div>
                          <div className="text-xs text-[#585d6b]">
                            {st.desc}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        {isDone && (
                          <span className="text-[11px] font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                            Selesai {st.dateCompleted ? `(${st.dateCompleted})` : ''}
                          </span>
                        )}
                        {isCur && (
                          <span className="text-[11px] font-mono font-bold text-[#1f2de6] bg-white px-2 py-0.5 rounded border border-[#1f2de6]">
                            Sedang Berjalan
                          </span>
                        )}
                        {!isDone && !isCur && (
                          <span className="text-[11px] font-mono text-[#585d6b]">
                            Antrean
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
