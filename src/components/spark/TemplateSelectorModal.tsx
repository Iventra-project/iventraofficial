import { useState, useEffect } from 'react';
import { SPARK_TEMPLATES, type TemplateId, type TemplateDefinition, getTemplateById } from '../../types/builder.ts';
import type { Workspace } from '../UserDashboard.tsx';
import RealtimeWorkspaceThumbnail from './RealtimeWorkspaceThumbnail.tsx';

interface TemplateSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: { name: string; template_id: TemplateId; slug: string; description: string }) => Promise<void>;
  isCreating: boolean;
  error?: string;
  initialTemplateId?: TemplateId;
  templates?: TemplateDefinition[];
}

export default function TemplateSelectorModal({
  isOpen,
  onClose,
  onCreate,
  isCreating,
  error,
  initialTemplateId,
  templates
}: TemplateSelectorModalProps) {
  const activeTemplates = templates && templates.length > 0 ? templates : SPARK_TEMPLATES;
  const [selectedTemplateId, setSelectedTemplateId] = useState<TemplateId>('tech-summit');
  const [workspaceName, setWorkspaceName] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [description, setDescription] = useState('');
  const [step, setStep] = useState<'template' | 'details'>('template');
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (initialTemplateId) {
        setSelectedTemplateId(initialTemplateId);
        const tmpl = getTemplateById(initialTemplateId);
        setWorkspaceName(tmpl.id === 'blank' ? 'Untitled Event' : tmpl.defaultConfig.eventName);
        setCustomSlug(tmpl.id === 'blank' ? 'my-event' : tmpl.id);
        setStep('details');
      } else {
        setSelectedTemplateId('tech-summit');
        setStep('template');
      }
      setLocalError('');
    }
  }, [isOpen, initialTemplateId]);

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
      setLocalError('Nama website minimal 2 karakter.');
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
      {/* Soft Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Card - Minimalist Clean Light Style */}
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-xl border border-[#e2e5ea] overflow-hidden animate-fadeIn flex flex-col max-h-[90vh]">
        {/* Header: Pure Minimal Title & Close Button */}
        <div className="px-6 py-4.5 bg-white border-b border-[#e2e5ea] flex items-center justify-between shrink-0">
          <h2 id="template-modal-title" className="font-heading text-lg sm:text-xl font-extrabold text-[#0b0c0e] tracking-tight">
            {step === 'template' ? 'Pilih Template' : 'Konfigurasi Website'}
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-[#585d6b] hover:text-[#0b0c0e] hover:bg-[#f4f5f8] flex items-center justify-center transition-colors cursor-pointer text-sm"
            aria-label="Tutup"
          >
            ✕
          </button>
        </div>

        {/* STEP 1: MINIMALIST TEMPLATE GRID */}
        {step === 'template' && (
          <div className="p-6 overflow-y-auto flex-1 bg-white">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeTemplates.map((tmpl) => {
                const isBlank = tmpl.id === 'blank';

                const mockWorkspace: Workspace = {
                  id: `preview-${tmpl.id}`,
                  owner_id: 'preview',
                  name: tmpl.defaultConfig.eventName || tmpl.name,
                  slug: tmpl.id,
                  service_type: 'spark',
                  template_id: tmpl.id,
                  status: 'draft',
                  draft_config: JSON.stringify(tmpl.defaultConfig),
                  published_config: null,
                  created_at: '',
                  updated_at: ''
                };

                return (
                  <div
                    key={tmpl.id}
                    onClick={() => handleTemplateSelect(tmpl.id)}
                    className="group flex flex-col rounded-xl border border-[#e2e5ea] bg-white hover:border-[#1f2de6] hover:shadow-md transition-all cursor-pointer p-2.5 text-left select-none"
                  >
                    {/* Visual Preview Box */}
                    <div className="relative h-[160px] w-full rounded-lg overflow-hidden bg-[#f8f9fb] border border-[#e2e5ea] flex flex-col">
                      {/* Browser Mockup Top Bar */}
                      <div className="h-5 bg-[#f4f5f8] border-b border-[#e2e5ea] px-2 flex items-center gap-1 shrink-0">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#cbd5e1]" />
                        <div className="w-1.5 h-1.5 rounded-full bg-[#cbd5e1]" />
                        <div className="w-1.5 h-1.5 rounded-full bg-[#cbd5e1]" />
                      </div>

                      {/* Content Preview */}
                      <div className="flex-1 w-full relative overflow-hidden bg-white">
                        {isBlank ? (
                          /* Blank Canvas: Clean minimalist canvas with plus icon */
                          <div className="w-full h-full flex flex-col items-center justify-center bg-white">
                            <div className="w-10 h-10 rounded-full bg-[#edf2ff] group-hover:bg-[#1f2de6] flex items-center justify-center transition-colors">
                              <span className="material-symbols-outlined text-[24px] text-[#1f2de6] group-hover:text-white transition-colors">
                                add
                              </span>
                            </div>
                          </div>
                        ) : (
                          /* Realtime Template Preview matching actual website */
                          <RealtimeWorkspaceThumbnail
                            workspace={mockWorkspace}
                            height={140}
                            className="w-full h-full border-none"
                          />
                        )}
                      </div>
                    </div>

                    {/* Title Underneath - Clean & Concise */}
                    <span className="mt-2.5 text-xs font-bold text-[#0b0c0e] group-hover:text-[#1f2de6] transition-colors truncate">
                      {tmpl.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 2: WORKSPACE CONFIGURATION */}
        {step === 'details' && (
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 flex flex-col justify-between bg-white">
            <div className="space-y-4">
              {/* Selected Template Badge */}
              <div className="p-3 rounded-xl bg-[#f8f9fb] border border-[#e2e5ea] flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-[11px] font-mono font-bold text-[#585d6b]">Template:</span>
                  <span className="text-xs font-bold text-[#0b0c0e] truncate">{selectedTmpl.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setStep('template')}
                  className="px-2.5 py-1 rounded-md border border-[#e2e5ea] bg-white text-[11px] font-semibold text-[#585d6b] hover:text-[#0b0c0e] hover:bg-[#f4f5f8] transition-colors cursor-pointer shrink-0"
                >
                  Ganti
                </button>
              </div>

              {/* Form Input: Nama Website */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#0b0c0e]">
                  Nama Website <span className="text-red-500">*</span>
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
                  placeholder="Nama website event"
                  className="w-full px-3 py-2 rounded-lg border border-[#e2e5ea] text-xs text-[#0b0c0e] focus:outline-none focus:border-[#1f2de6] focus:ring-1 focus:ring-[#1f2de6]"
                />
              </div>

              {/* Form Input: Slug URL */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#0b0c0e]">
                  Slug URL
                </label>
                <div className="flex items-center rounded-lg border border-[#e2e5ea] bg-[#f8f9fb] px-3 py-2 text-xs focus-within:border-[#1f2de6] focus-within:ring-1 focus-within:ring-[#1f2de6] focus-within:bg-white">
                  <span className="text-[#8c93a0] font-mono">https://</span>
                  <input
                    type="text"
                    value={customSlug}
                    onChange={(e) => setCustomSlug(e.target.value)}
                    placeholder="nama-event"
                    className="flex-1 bg-transparent px-1 font-mono text-[#1f2de6] focus:outline-none"
                  />
                  <span className="text-[#8c93a0] font-mono">.iventra.site</span>
                </div>
              </div>

              {(localError || error) && (
                <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs">
                  {localError || error}
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-[#e2e5ea]">
              <button
                type="button"
                onClick={() => setStep('template')}
                className="px-3.5 py-2 rounded-lg border border-[#e2e5ea] text-xs font-semibold text-[#585d6b] hover:bg-[#f4f5f8] transition-colors cursor-pointer"
              >
                Kembali
              </button>

              <button
                type="submit"
                disabled={isCreating}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-[#1f2de6] hover:bg-[#1622b8] text-white text-xs font-semibold tracking-tight shadow-xs transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
              >
                {isCreating ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Membuat...</span>
                  </>
                ) : (
                  <>
                    <span>Buat Website</span>
                    <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
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
