import { useState } from 'react';
import { SPARK_TEMPLATES, type TemplateId, getTemplateById } from '../../types/builder.ts';
import GalleryHoverCarousel, { type GalleryHoverCarouselItem } from '../../../components/ui/gallery-hover-carousel.tsx';

const TEMPLATE_GALLERY_ITEMS: (GalleryHoverCarouselItem & { templateId: TemplateId })[] = [
  {
    id: 'academic',
    templateId: 'tech-summit',
    title: 'Academic & Tech Summit',
    summary: 'Desain modern bernuansa tech indigo untuk konferensi ilmiah, seminar nasional, dan expo teknologi.',
    url: '#',
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80',
    category: 'Seminar & Konferensi',
    badge: 'Paling Populer',
  },
  {
    id: 'competition',
    templateId: 'campus-competition',
    title: 'National Campus Competition',
    summary: 'Format dinamis terfokus pada seleksi proposal, pengumpulan berkas, timeline bertingkat, dan penjurian online.',
    url: '#',
    image: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&auto=format&fit=crop&q=80',
    category: 'Kompetisi Mahasiswa',
    badge: 'Lomba & Hackathon',
  },
  {
    id: 'creative',
    templateId: 'creative-fest',
    title: 'Creative & Art Campus Fest',
    summary: 'Visual dinamis, penuh warna, dan energik cocok untuk festival musik kampus, pameran seni rupa, dan bazaar kreatif.',
    url: '#',
    image: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&auto=format&fit=crop&q=80',
    category: 'Festival & Seni',
    badge: 'Dies Natalis',
  },
  {
    id: 'blank',
    templateId: 'blank',
    title: 'Blank Canvas (Kosongan)',
    summary: 'Mulai formulir dari kanvas kosong tanpa blok bawaan. Fleksibel untuk kustomisasi bebas, RSVP, atau formulir pendaftaran khusus.',
    url: '#',
    image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=80',
    category: 'Formulir Bebas',
    badge: 'Mulai Dari Nol',
  },
];

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
      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-fadeIn flex flex-col max-h-[92vh]">
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
                ? 'Pilih struktur desain siap pakai yang dirancang untuk kebutuhan event kampus dan kompetisi.'
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

        {/* STEP 1: INTERACTIVE GALLERY HOVER CAROUSEL */}
        {step === 'template' && (
          <div className="p-6 overflow-y-auto flex-1 bg-white">
            <GalleryHoverCarousel
              heading="Katalog Template Siap Pakai"
              subheading="Arahkan kursor pada kartu untuk pratinjau detail, lalu klik untuk mengonfigurasi website event."
              items={TEMPLATE_GALLERY_ITEMS}
              onSelectItem={(item) => {
                const matched = TEMPLATE_GALLERY_ITEMS.find((t) => t.id === item.id);
                if (matched) {
                  handleTemplateSelect(matched.templateId);
                }
              }}
              className="py-2"
            />
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
