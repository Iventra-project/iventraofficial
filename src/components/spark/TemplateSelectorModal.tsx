import { useState } from 'react';
import { SPARK_TEMPLATES, type TemplateId, getTemplateById } from '../../types/builder.ts';

interface TemplateSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: { name: string; template_id: TemplateId; slug: string; description: string }) => Promise<void>;
  isCreating: boolean;
  error?: string;
}

export default function TemplateSelectorModal({
  isOpen,
  onClose,
  onCreate,
  isCreating,
  error
}: TemplateSelectorModalProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<TemplateId>('blank');
  const [workspaceName, setWorkspaceName] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [description, setDescription] = useState('');
  const [step, setStep] = useState<'template' | 'details'>('template');
  const [localError, setLocalError] = useState('');

  if (!isOpen) return null;

  const handleTemplateSelect = (id: TemplateId) => {
    setSelectedTemplateId(id);
    const tmpl = getTemplateById(id);
    if (!workspaceName) {
      setWorkspaceName(tmpl.id === 'blank' ? 'Untitled Event' : tmpl.defaultConfig.eventName);
      setCustomSlug(tmpl.id === 'blank' ? 'my-event' : tmpl.id);
    }
    setStep('details');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (!workspaceName.trim() || workspaceName.trim().length < 2) {
      setLocalError('Nama workspace minimal 2 karakter.');
      return;
    }

    const cleanSlug = customSlug
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .trim();

    await onCreate({
      name: workspaceName.trim(),
      template_id: selectedTemplateId,
      slug: cleanSlug || undefined as any,
      description: description.trim()
    });
  };

  const selectedTmpl = getTemplateById(selectedTemplateId);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="template-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#0b0c0e]/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-fadeIn flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-6 bg-[#0b0c0e] text-white border-b border-white/10 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              <span className="text-xs font-mono font-bold text-white/70 uppercase tracking-wider">
                Iventra Spark Workspace
              </span>
            </div>
            <h2 id="template-modal-title" className="text-xl sm:text-2xl font-display font-extrabold text-white tracking-tight">
              {step === 'template' ? 'Mulai dari Template atau Blank Canvas' : 'Konfigurasi Workspace Baru'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
              {step === 'template'
                ? 'Pilih Blank Canvas (Kosongan) ala Google Form, atau gunakan template event siap pakai.'
                : 'Beri nama dan tentukan tautan slug untuk website event baru Anda.'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0 text-sm"
            aria-label="Tutup"
          >
            ✕
          </button>
        </div>

        {/* STEP 1: TEMPLATE CARDS */}
        {step === 'template' && (
          <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {SPARK_TEMPLATES.map((tmpl) => {
                const isSelected = selectedTemplateId === tmpl.id;
                const isBlank = tmpl.id === 'blank';

                return (
                  <div
                    key={tmpl.id}
                    onClick={() => handleTemplateSelect(tmpl.id)}
                    className={`group rounded-xl border transition-all duration-200 p-4 flex flex-col justify-between cursor-pointer text-left relative overflow-hidden ${
                      isSelected
                        ? 'border-blue-600 bg-white shadow-md ring-2 ring-blue-600'
                        : 'border-slate-200 hover:border-blue-400 bg-white hover:shadow-sm'
                    }`}
                  >
                    <div>
                      {/* Banner Preview */}
                      <div className={`h-24 rounded-lg bg-gradient-to-tr ${tmpl.previewGradient} p-3 text-slate-900 flex flex-col justify-between shadow-2xs mb-3 relative overflow-hidden ${
                        isBlank ? 'border-2 border-dashed border-slate-300' : ''
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-white/90 px-2 py-0.5 rounded shadow-2xs text-slate-900">
                            {tmpl.category}
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-600 text-white px-2 py-0.5 rounded">
                            {tmpl.badge}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {isBlank && (
                            <span className="material-symbols-outlined text-[18px] text-blue-600">
                              note_add
                            </span>
                          )}
                          <span className="text-xs font-bold line-clamp-1 text-slate-900">
                            {tmpl.name}
                          </span>
                        </div>
                      </div>

                      {/* Info */}
                      <h3 className="font-display font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors tracking-tight">
                        {tmpl.name}
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed line-clamp-3">
                        {tmpl.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTemplateSelect(tmpl.id);
                        }}
                        className={`w-full py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                          isBlank
                            ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                            : 'bg-slate-900 hover:bg-blue-600 text-white'
                        }`}
                      >
                        {isBlank ? 'Mulai Kosongan →' : 'Pilih Template →'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 2: WORKSPACE DETAILS */}
        {step === 'details' && (
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1 flex flex-col justify-between bg-white">
            <div className="space-y-4">
              {/* Selected Template Card */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg bg-gradient-to-tr ${selectedTmpl.previewGradient} flex items-center justify-center text-slate-900 shrink-0 text-xs font-bold shadow-2xs`}>
                    {selectedTmpl.id === 'blank' ? '📝' : '⚡'}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
                      Tipe Template
                    </span>
                    <h4 className="font-bold text-sm text-slate-900">{selectedTmpl.name}</h4>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setStep('template')}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-white transition-colors cursor-pointer"
                >
                  Ganti Template
                </button>
              </div>

              {/* Form Inputs */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800 uppercase">
                  Nama Event / Workspace <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={workspaceName}
                  onChange={(e) => {
                    setWorkspaceName(e.target.value);
                    if (!customSlug) {
                      setCustomSlug(
                        e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9]/g, '-')
                          .replace(/-+/g, '-')
                      );
                    }
                  }}
                  placeholder="Contoh: Hackathon Nusantara 2026 / Webinar AI"
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800 uppercase">
                  Slug URL Web Event
                </label>
                <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600 focus-within:bg-white">
                  <span className="text-slate-400 font-mono">https://</span>
                  <input
                    type="text"
                    value={customSlug}
                    onChange={(e) => setCustomSlug(e.target.value)}
                    placeholder="nama-event"
                    className="flex-1 bg-transparent px-1 font-mono text-blue-700 focus:outline-none"
                  />
                  <span className="text-slate-400 font-mono">.iventra.site</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800 uppercase">
                  Deskripsi Singkat (Opsional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Jelaskan secara ringkas perihal kegiatan atau panduan pendaftaran..."
                  rows={3}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 resize-none"
                />
              </div>

              {(localError || error) && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
                  {localError || error}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setStep('template')}
                className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                ← Kembali
              </button>

              <button
                type="submit"
                disabled={isCreating}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {isCreating ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Membuat Workspace...</span>
                  </>
                ) : (
                  <>
                    <span>Buka Spark Builder</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
