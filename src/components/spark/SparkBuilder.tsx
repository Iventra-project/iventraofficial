import { useState, useEffect, useCallback, useMemo } from 'react';
import type { EventConfig, EventBlock, EventBlockType, FormFieldItem, TimelineItem, SpeakerItem, CategoryItem, FaqItem } from '../../types/builder.ts';
import { getTemplateById, ensureConfigBlocks } from '../../types/builder.ts';
import SparkEventRenderer from './SparkEventRenderer.tsx';
import SparkSubscriptionModal from './SparkSubscriptionModal.tsx';
import type { Workspace } from '../UserDashboard.tsx';

interface SparkBuilderProps {
  workspace: Workspace;
  token: string;
  onBackToDashboard: () => void;
  onWorkspaceUpdated?: (ws: Workspace) => void;
}

type DeviceViewport = 'desktop' | 'tablet' | 'mobile';

const BLOCK_TYPES_META: Record<EventBlockType, { label: string; icon: string; desc: string }> = {
  form: { label: 'Formulir Pendaftaran', icon: 'assignment', desc: 'Formulir input peserta (nama, email, berkas, dll)' },
  hero: { label: 'Hero Banner & Judul', icon: 'view_carousel', desc: 'Judul headline, countdown, subjudul, dan poster' },
  timeline: { label: 'Timeline & Tahapan', icon: 'schedule', desc: 'Alur tahapan registrasi, seleksi, dan grand final' },
  text: { label: 'Informasi & Teks Deskripsi', icon: 'text_fields', desc: 'Aturan lomba, panduan, atau informasi tambahan' },
  prizes: { label: 'Hadiah & Prizepool', icon: 'emoji_events', desc: 'Total hadiah juara 1, 2, 3, dan benefit' },
  speakers: { label: 'Pembicara & Juri', icon: 'group', desc: 'Daftar pembicara tamu, juri ahli, atau guest star' },
  tickets: { label: 'Tier Tiket & Biaya', icon: 'confirmation_number', desc: 'Kategori tiket berbayar atau free pass' },
  faq: { label: 'Tanya Jawab (FAQ)', icon: 'help', desc: 'Daftar pertanyaan umum seputar acara' },
  contact: { label: 'Kontak Panitia', icon: 'contact_support', desc: 'WhatsApp narahubung dan email resmi' }
};

export default function SparkBuilder({
  workspace,
  token,
  onBackToDashboard,
  onWorkspaceUpdated
}: SparkBuilderProps) {
  // Initialize config
  const initialConfig = useMemo<EventConfig>(() => {
    let parsed: any = null;
    if (workspace.draft_config) {
      try {
        parsed = JSON.parse(workspace.draft_config);
      } catch (e) {
        console.warn('Could not parse workspace draft_config:', e);
      }
    }
    if (!parsed) {
      const tmpl = getTemplateById(workspace.template_id || 'blank');
      parsed = {
        ...tmpl.defaultConfig,
        eventName: workspace.name || tmpl.defaultConfig.eventName,
        description: workspace.description || tmpl.defaultConfig.description
      };
    }
    return {
      ...parsed,
      blocks: ensureConfigBlocks(parsed)
    };
  }, [workspace]);

  const [config, setConfig] = useState<EventConfig>(initialConfig);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(() => {
    const b = ensureConfigBlocks(initialConfig);
    return b.length > 0 ? b[0].id : null;
  });

  const [deviceViewport, setDeviceViewport] = useState<DeviceViewport>('desktop');
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [saveStatusText, setSaveStatusText] = useState('Semua perubahan tersimpan');
  const [isDirty, setIsDirty] = useState(false);
  const [currentWs, setCurrentWs] = useState<Workspace>(workspace);
  const [slugInput, setSlugInput] = useState(workspace.slug || '');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Floating add menu popover
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Helper updater
  const updateConfig = useCallback((updater: (prev: EventConfig) => EventConfig) => {
    setConfig((prev) => {
      const next = updater(prev);
      setIsDirty(true);
      setSaveStatusText('Perubahan belum disimpan');
      return next;
    });
  }, []);

  // Save Draft API
  const handleSaveDraft = async (showFeedback = true) => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/workspaces/${currentWs.id}/builder`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({
          name: config.eventName || currentWs.name,
          slug: slugInput || currentWs.slug,
          description: config.description || currentWs.description,
          template_id: currentWs.template_id || 'blank',
          draft_config: JSON.stringify(config)
        })
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Gagal menyimpan draft.');
      }

      setCurrentWs(json);
      setIsDirty(false);
      setSaveStatusText('Tersimpan otomatis');
      if (showFeedback) {
        showToast('Draft berhasil disimpan!');
      }
      onWorkspaceUpdated?.(json);
    } catch (err: any) {
      if (showFeedback) {
        showToast(err.message || 'Gagal menyimpan.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Auto-save debounce
  useEffect(() => {
    if (!isDirty) return;
    const timer = setTimeout(() => {
      handleSaveDraft(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, [config, isDirty]);

  // Publish API
  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      const res = await fetch(`/api/workspaces/${currentWs.id}/publish`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          slug: slugInput || currentWs.slug
        })
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Gagal mempublikasikan website.');
      }
      setCurrentWs(json);
      showToast('Website berhasil dipublikasikan!');
      onWorkspaceUpdated?.(json);
    } catch (err: any) {
      showToast(err.message || 'Gagal mempublikasikan.');
    } finally {
      setIsPublishing(false);
    }
  };

  // ─── GOOGLE FORMS BLOCK MANIPULATION ───────────────────────────────────────

  const currentBlocks = useMemo(() => config.blocks || [], [config.blocks]);

  // Add block
  const handleAddBlock = (type: EventBlockType) => {
    const newId = `block-${Date.now()}`;
    let defaultData: any = {};

    switch (type) {
      case 'form':
        defaultData = {
          buttonText: 'Kirim Pendaftaran',
          fields: [
            { id: `f-${Date.now()}-1`, label: 'Nama Lengkap', type: 'text', required: true, placeholder: 'Masukkan nama Anda' },
            { id: `f-${Date.now()}-2`, label: 'Email', type: 'email', required: true, placeholder: 'email@domain.com' },
            { id: `f-${Date.now()}-3`, label: 'Nomor WhatsApp', type: 'whatsapp', required: true, placeholder: '081234567890' }
          ]
        };
        break;
      case 'hero':
        defaultData = {
          headline: config.eventName || 'Untitled Event',
          tagline: 'Tagline atau pengantar singkat acara',
          dateText: 'Segera Hadir 2026',
          locationText: 'Hybrid / Online',
          badgeText: 'Pendaftaran Dibuka'
        };
        break;
      case 'timeline':
        defaultData = {
          items: [
            { id: `t-${Date.now()}-1`, name: 'Pendaftaran Dibuka', description: 'Registrasi peserta dibuka secara online.', startDate: '01 Nov', endDate: '15 Nov', order: 1, status: 'active' },
            { id: `t-${Date.now()}-2`, name: 'Hari Pelaksanaan Acara', description: 'Pelaksanaan seminar & awarding.', startDate: '20 Nov', endDate: '20 Nov', order: 2, status: 'upcoming' }
          ]
        };
        break;
      case 'text':
        defaultData = {
          content: 'Tuliskan deskripsi lengkap, latar belakang kegiatan, aturan kepesertaan, atau syarat pendaftaran di sini.'
        };
        break;
      case 'prizes':
        defaultData = {
          items: [
            { id: `pz-${Date.now()}-1`, title: 'Juara 1 (Main Winner)', prizePool: 'Rp 10.000.000', badge: 'Juara 1', description: 'Uang tunai + Sertifikat Juara + Plakat' },
            { id: `pz-${Date.now()}-2`, title: 'Juara 2 (Runner Up)', prizePool: 'Rp 5.000.000', badge: 'Juara 2', description: 'Uang tunai + E-Sertifikat' }
          ]
        };
        break;
      case 'speakers':
        defaultData = {
          items: [
            { id: `sp-${Date.now()}-1`, name: 'Dr. Nama Pembicara', role: 'Keynote Speaker', companyOrCampus: 'Instansi / Perusahaan', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', topic: 'Topik Bahasan Acara' }
          ]
        };
        break;
      case 'faq':
        defaultData = {
          items: [
            { id: `faq-${Date.now()}-1`, question: 'Apakah acara ini berbayar atau gratis?', answer: 'Pendaftaran kegiatan ini tidak dipungut biaya apapun.' },
            { id: `faq-${Date.now()}-2`, question: 'Bagaimana cara mendapatkan e-sertifikat?', answer: 'E-sertifikat akan dikirimkan otomatis ke email peserta setelah mengisi formulir presensi.' }
          ]
        };
        break;
      case 'contact':
        defaultData = {
          committeeName: 'Sekretariat Panitia Event',
          email: 'info@iventra.site',
          whatsappNumber: '6281234567890'
        };
        break;
      default:
        defaultData = {};
    }

    const newBlock: EventBlock = {
      id: newId,
      type,
      title: BLOCK_TYPES_META[type].label,
      subtitle: '',
      enabled: true,
      data: defaultData
    };

    updateConfig((prev) => {
      const list = prev.blocks ? [...prev.blocks] : [];
      return {
        ...prev,
        blocks: [...list, newBlock]
      };
    });

    setActiveBlockId(newId);
    setIsAddMenuOpen(false);
    showToast(`Blok "${BLOCK_TYPES_META[type].label}" ditambahkan`);
  };

  // Reorder block up
  const handleMoveBlockUp = (index: number) => {
    if (index <= 0) return;
    updateConfig((prev) => {
      const list = [...(prev.blocks || [])];
      const temp = list[index - 1];
      list[index - 1] = list[index];
      list[index] = temp;
      return { ...prev, blocks: list };
    });
  };

  // Reorder block down
  const handleMoveBlockDown = (index: number) => {
    if (index >= currentBlocks.length - 1) return;
    updateConfig((prev) => {
      const list = [...(prev.blocks || [])];
      const temp = list[index + 1];
      list[index + 1] = list[index];
      list[index] = temp;
      return { ...prev, blocks: list };
    });
  };

  // Duplicate block
  const handleDuplicateBlock = (block: EventBlock) => {
    const clone: EventBlock = {
      ...block,
      id: `block-${Date.now()}`,
      title: `${block.title} (Salinan)`,
      data: JSON.parse(JSON.stringify(block.data))
    };
    updateConfig((prev) => {
      const list = [...(prev.blocks || [])];
      const idx = list.findIndex((b) => b.id === block.id);
      list.splice(idx + 1, 0, clone);
      return { ...prev, blocks: list };
    });
    setActiveBlockId(clone.id);
    showToast('Komponen berhasil disalin');
  };

  // Delete block
  const handleDeleteBlock = (id: string) => {
    updateConfig((prev) => ({
      ...prev,
      blocks: (prev.blocks || []).filter((b) => b.id !== id)
    }));
    showToast('Komponen dihapus');
  };

  // Change block type
  const handleChangeBlockType = (blockId: string, newType: EventBlockType) => {
    updateConfig((prev) => {
      const list = (prev.blocks || []).map((b) => {
        if (b.id !== blockId) return b;
        return {
          ...b,
          type: newType,
          title: BLOCK_TYPES_META[newType].label
        };
      });
      return { ...prev, blocks: list };
    });
  };

  // Update specific block data
  const handleUpdateBlock = (blockId: string, updates: Partial<EventBlock>) => {
    updateConfig((prev) => {
      const list = (prev.blocks || []).map((b) => {
        if (b.id !== blockId) return b;
        return { ...b, ...updates };
      });
      return { ...prev, blocks: list };
    });
  };

  const publishedUrl = `${window.location.origin}/#event/${currentWs.slug || currentWs.id}`;

  return (
    <div className="min-h-screen flex flex-col bg-[#f0f2f5] text-slate-900 select-none font-sans">
      {/* ─── GLOBAL TOP NAVIGATION ────────────────────────────────────────── */}
      <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4 z-40 shrink-0">
        {/* Left: Back button & Breadcrumbs */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBackToDashboard}
            className="w-8 h-8 rounded-lg border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors cursor-pointer shrink-0"
            title="Kembali ke Dashboard"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          </button>

          <div className="flex items-center gap-2 text-xs text-slate-500 truncate">
            <span className="font-semibold text-slate-800">Iventra Spark</span>
            <span>/</span>
            <span className="font-bold text-slate-900 truncate">{config.eventName || 'Untitled Event'}</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-mono">
            <span className={`w-2 h-2 rounded-full ${isDirty ? 'bg-amber-500' : 'bg-emerald-500'}`} />
            <span>{isSaving ? 'Menyimpan...' : saveStatusText}</span>
          </div>
        </div>

        {/* Center: Device Viewport Switcher */}
        <div className="hidden md:flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs">
          <button
            type="button"
            onClick={() => setDeviceViewport('desktop')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              deviceViewport === 'desktop' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">desktop_windows</span>
            <span>Desktop</span>
          </button>
          <button
            type="button"
            onClick={() => setDeviceViewport('tablet')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              deviceViewport === 'tablet' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">tablet</span>
            <span>Tablet</span>
          </button>
          <button
            type="button"
            onClick={() => setDeviceViewport('mobile')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              deviceViewport === 'mobile' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">smartphone</span>
            <span>Mobile</span>
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setIsThemeModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
            title="Pengaturan Tema & Warna"
          >
            <span className="material-symbols-outlined text-[16px] text-blue-600">palette</span>
            <span className="hidden sm:inline">Tema</span>
          </button>

          <button
            type="button"
            onClick={() => handleSaveDraft(true)}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-800 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">save</span>
            <span>Simpan</span>
          </button>

          <a
            href={publishedUrl}
            target="_blank"
            rel="noreferrer"
            className="hidden lg:inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <span>Preview ↗</span>
          </a>

          <button
            type="button"
            onClick={handlePublish}
            disabled={isPublishing}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[16px]">rocket_launch</span>
            <span>{isPublishing ? 'Mempublikasikan...' : 'Publikasikan'}</span>
          </button>
        </div>
      </header>

      {/* ─── DUAL COLUMN WORKSPACE ─────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        {/* ─── LEFT: GOOGLE FORMS STYLE EDITOR CANVAS ───────────────────────── */}
        <div className="w-full lg:w-[540px] xl:w-[600px] border-r border-slate-200 bg-[#f0f2f5] flex flex-col shrink-0 overflow-y-auto p-4 sm:p-6 space-y-4 relative">
          {/* HEADER CARD (Matching Google Forms Top Card in Screenshot) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden relative">
            {/* Top Purple/Blue Accent Stripe */}
            <div className="h-3 w-full bg-blue-600" />

            <div className="p-6 space-y-4">
              {/* Event Title Input */}
              <div>
                <input
                  type="text"
                  value={config.eventName || ''}
                  onChange={(e) => updateConfig((prev) => ({ ...prev, eventName: e.target.value }))}
                  placeholder="Untitled Event / Judul Acara"
                  className="w-full text-2xl sm:text-3xl font-display font-extrabold text-slate-900 border-b-2 border-transparent hover:border-slate-200 focus:border-blue-600 focus:outline-none transition-colors pb-1"
                />
              </div>

              {/* Form Description Textarea */}
              <div>
                <textarea
                  value={config.description || ''}
                  onChange={(e) => updateConfig((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Deskripsi acara, petunjuk pendaftaran, dan informasi penting lainnya..."
                  rows={2}
                  className="w-full text-xs sm:text-sm text-slate-600 border-b border-transparent hover:border-slate-200 focus:border-blue-600 focus:outline-none transition-colors resize-none leading-relaxed"
                />
              </div>

              {/* Quick Metadata: Tanggal & Lokasi */}
              <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="material-symbols-outlined text-[16px] text-slate-400">calendar_month</span>
                  <input
                    type="text"
                    value={config.eventDateText || ''}
                    onChange={(e) => updateConfig((prev) => ({ ...prev, eventDateText: e.target.value }))}
                    placeholder="Waktu pelaksanaan"
                    className="w-full bg-transparent text-slate-800 text-xs focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="material-symbols-outlined text-[16px] text-slate-400">location_on</span>
                  <input
                    type="text"
                    value={config.eventLocationText || ''}
                    onChange={(e) => updateConfig((prev) => ({ ...prev, eventLocationText: e.target.value }))}
                    placeholder="Lokasi / Online"
                    className="w-full bg-transparent text-slate-800 text-xs focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* DYNAMIC SEQUENTIAL BLOCK CARDS (Matching Google Forms Question Cards) */}
          {currentBlocks.map((block, idx) => {
            const isActive = activeBlockId === block.id;
            const meta = BLOCK_TYPES_META[block.type] || BLOCK_TYPES_META.form;

            return (
              <div
                key={block.id}
                onClick={() => setActiveBlockId(block.id)}
                className={`bg-white rounded-2xl border transition-all duration-200 shadow-sm relative ${
                  isActive
                    ? 'border-l-4 border-l-blue-600 border-slate-300 shadow-md ring-1 ring-blue-600/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Drag Handle Top Bar */}
                <div className="pt-2 pb-1 flex items-center justify-center cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 transition-colors">
                  <span className="material-symbols-outlined text-[20px]">drag_indicator</span>
                </div>

                <div className="p-5 sm:p-6 space-y-4">
                  {/* Card Header Row: Title Input & Block Type Dropdown */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={block.title || ''}
                        onChange={(e) => handleUpdateBlock(block.id, { title: e.target.value })}
                        placeholder="Untitled Question / Nama Komponen"
                        className="w-full text-base font-display font-bold text-slate-900 border-b border-transparent hover:border-slate-200 focus:border-blue-600 focus:outline-none transition-colors pb-0.5"
                      />
                    </div>

                    {/* Block Type Dropdown Selector */}
                    <div className="relative shrink-0">
                      <select
                        value={block.type}
                        onChange={(e) => handleChangeBlockType(block.id, e.target.value as EventBlockType)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 hover:bg-white focus:outline-none focus:border-blue-600 cursor-pointer"
                      >
                        {Object.entries(BLOCK_TYPES_META).map(([tKey, tMeta]) => (
                          <option key={tKey} value={tKey}>
                            {tMeta.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* IN-CARD CONFIGURATION ACCORDING TO TYPE */}
                  <div className="pt-2">
                    {/* TYPE: FORM */}
                    {block.type === 'form' && (
                      <div className="space-y-3">
                        <div className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">
                          Daftar Pertanyaan / Input Pendaftaran:
                        </div>

                        {/* Form Fields List */}
                        <div className="space-y-2">
                          {((block.data?.fields as FormFieldItem[]) || []).map((field, fIdx) => (
                            <div key={field.id || fIdx} className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                              <div className="flex items-center justify-between gap-2">
                                <input
                                  type="text"
                                  value={field.label}
                                  onChange={(e) => {
                                    const nextFields = [...block.data.fields];
                                    nextFields[fIdx].label = e.target.value;
                                    handleUpdateBlock(block.id, {
                                      data: { ...block.data, fields: nextFields }
                                    });
                                  }}
                                  placeholder="Nama Pertanyaan / Label Input"
                                  className="w-full bg-white px-2.5 py-1 rounded-md border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-600"
                                />

                                <select
                                  value={field.type}
                                  onChange={(e) => {
                                    const nextFields = [...block.data.fields];
                                    nextFields[fIdx].type = e.target.value as any;
                                    handleUpdateBlock(block.id, {
                                      data: { ...block.data, fields: nextFields }
                                    });
                                  }}
                                  className="px-2 py-1 rounded-md border border-slate-200 bg-white text-[11px] text-slate-600"
                                >
                                  <option value="text">Jawaban Singkat</option>
                                  <option value="paragraph">Paragraf</option>
                                  <option value="email">Email</option>
                                  <option value="whatsapp">Nomor WhatsApp</option>
                                  <option value="select">Dropdown</option>
                                  <option value="file">Upload Berkas</option>
                                </select>

                                <button
                                  type="button"
                                  onClick={() => {
                                    const nextFields = block.data.fields.filter((_: any, i: number) => i !== fIdx);
                                    handleUpdateBlock(block.id, {
                                      data: { ...block.data, fields: nextFields }
                                    });
                                  }}
                                  className="text-slate-400 hover:text-red-600 p-1"
                                  title="Hapus field"
                                >
                                  <span className="material-symbols-outlined text-[16px]">close</span>
                                </button>
                              </div>

                              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                                <input
                                  type="text"
                                  value={field.placeholder || ''}
                                  onChange={(e) => {
                                    const nextFields = [...block.data.fields];
                                    nextFields[fIdx].placeholder = e.target.value;
                                    handleUpdateBlock(block.id, {
                                      data: { ...block.data, fields: nextFields }
                                    });
                                  }}
                                  placeholder="Contoh teks placeholder..."
                                  className="bg-transparent text-slate-500 text-[11px] flex-1 focus:outline-none"
                                />

                                <label className="flex items-center gap-1.5 cursor-pointer ml-3">
                                  <span>Wajib diisi</span>
                                  <input
                                    type="checkbox"
                                    checked={field.required}
                                    onChange={(e) => {
                                      const nextFields = [...block.data.fields];
                                      nextFields[fIdx].required = e.target.checked;
                                      handleUpdateBlock(block.id, {
                                        data: { ...block.data, fields: nextFields }
                                      });
                                    }}
                                    className="rounded text-blue-600 focus:ring-blue-500"
                                  />
                                </label>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Add Field Button */}
                        <button
                          type="button"
                          onClick={() => {
                            const newField: FormFieldItem = {
                              id: `f-${Date.now()}`,
                              label: 'Pertanyaan Baru',
                              type: 'text',
                              required: true,
                              placeholder: ''
                            };
                            const nextFields = [...(block.data.fields || []), newField];
                            handleUpdateBlock(block.id, {
                              data: { ...block.data, fields: nextFields }
                            });
                          }}
                          className="w-full py-2 rounded-xl border border-dashed border-blue-300 text-blue-600 text-xs font-bold hover:bg-blue-50/50 transition-colors flex items-center justify-center gap-1.5"
                        >
                          <span className="material-symbols-outlined text-[16px]">add</span>
                          <span>Tambah Input Pertanyaan</span>
                        </button>
                      </div>
                    )}

                    {/* TYPE: HERO */}
                    {block.type === 'hero' && (
                      <div className="space-y-3 text-xs">
                        <div>
                          <label className="block text-slate-600 font-bold mb-1">Headline Utama</label>
                          <input
                            type="text"
                            value={block.data?.headline || ''}
                            onChange={(e) => handleUpdateBlock(block.id, { data: { ...block.data, headline: e.target.value } })}
                            placeholder="Judul besar headline"
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-600 font-bold mb-1">Tagline</label>
                          <input
                            type="text"
                            value={block.data?.tagline || ''}
                            onChange={(e) => handleUpdateBlock(block.id, { data: { ...block.data, tagline: e.target.value } })}
                            placeholder="Tagline ajakan"
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-600 font-bold mb-1">URL Poster / Banner</label>
                          <input
                            type="text"
                            value={block.data?.bannerUrl || ''}
                            onChange={(e) => handleUpdateBlock(block.id, { data: { ...block.data, bannerUrl: e.target.value } })}
                            placeholder="https://..."
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-mono"
                          />
                        </div>
                      </div>
                    )}

                    {/* TYPE: TIMELINE */}
                    {block.type === 'timeline' && (
                      <div className="space-y-3">
                        <div className="space-y-2">
                          {((block.data?.items as TimelineItem[]) || []).map((stage, sIdx) => (
                            <div key={stage.id || sIdx} className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                              <div className="flex items-center justify-between gap-2">
                                <input
                                  type="text"
                                  value={stage.name}
                                  onChange={(e) => {
                                    const nextStages = [...block.data.items];
                                    nextStages[sIdx].name = e.target.value;
                                    handleUpdateBlock(block.id, { data: { ...block.data, items: nextStages } });
                                  }}
                                  placeholder="Nama Tahapan"
                                  className="w-full bg-white px-2.5 py-1 rounded-md border border-slate-200 text-xs font-semibold"
                                />
                                <select
                                  value={stage.status}
                                  onChange={(e) => {
                                    const nextStages = [...block.data.items];
                                    nextStages[sIdx].status = e.target.value as any;
                                    handleUpdateBlock(block.id, { data: { ...block.data, items: nextStages } });
                                  }}
                                  className="px-2 py-1 rounded-md border border-slate-200 bg-white text-[11px]"
                                >
                                  <option value="upcoming">Terjadwal</option>
                                  <option value="active">Aktif</option>
                                  <option value="completed">Selesai</option>
                                </select>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nextStages = block.data.items.filter((_: any, i: number) => i !== sIdx);
                                    handleUpdateBlock(block.id, { data: { ...block.data, items: nextStages } });
                                  }}
                                  className="text-slate-400 hover:text-red-600"
                                >
                                  <span className="material-symbols-outlined text-[16px]">close</span>
                                </button>
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={stage.startDate}
                                  onChange={(e) => {
                                    const nextStages = [...block.data.items];
                                    nextStages[sIdx].startDate = e.target.value;
                                    handleUpdateBlock(block.id, { data: { ...block.data, items: nextStages } });
                                  }}
                                  placeholder="Tanggal (Contoh: 10 Nov)"
                                  className="w-full bg-transparent text-slate-600 text-xs focus:outline-none"
                                />
                              </div>
                            </div>
                          ))}
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const newStage: TimelineItem = {
                              id: `t-${Date.now()}`,
                              name: 'Tahapan Baru',
                              description: '',
                              startDate: '10 Nov',
                              endDate: '15 Nov',
                              order: (block.data.items || []).length + 1,
                              status: 'upcoming'
                            };
                            const nextStages = [...(block.data.items || []), newStage];
                            handleUpdateBlock(block.id, { data: { ...block.data, items: nextStages } });
                          }}
                          className="w-full py-2 rounded-xl border border-dashed border-blue-300 text-blue-600 text-xs font-bold hover:bg-blue-50/50 flex items-center justify-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[16px]">add</span>
                          <span>Tambah Tahapan Timeline</span>
                        </button>
                      </div>
                    )}

                    {/* TYPE: TEXT */}
                    {block.type === 'text' && (
                      <div className="space-y-2">
                        <textarea
                          value={block.data?.content || ''}
                          onChange={(e) => handleUpdateBlock(block.id, { data: { ...block.data, content: e.target.value } })}
                          rows={4}
                          placeholder="Ketik teks penjelasan, aturan, atau informasi lengkap..."
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 resize-none leading-relaxed"
                        />
                      </div>
                    )}

                    {/* TYPE: PRIZES */}
                    {block.type === 'prizes' && (
                      <div className="space-y-3">
                        <div className="space-y-2">
                          {((block.data?.items as CategoryItem[]) || []).map((pz, pzIdx) => (
                            <div key={pz.id || pzIdx} className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                              <div className="flex items-center justify-between gap-2">
                                <input
                                  type="text"
                                  value={pz.title}
                                  onChange={(e) => {
                                    const nextPz = [...block.data.items];
                                    nextPz[pzIdx].title = e.target.value;
                                    handleUpdateBlock(block.id, { data: { ...block.data, items: nextPz } });
                                  }}
                                  placeholder="Nama Kategori / Juara"
                                  className="w-full bg-white px-2.5 py-1 rounded-md border border-slate-200 text-xs font-bold"
                                />
                                <input
                                  type="text"
                                  value={pz.prizePool || ''}
                                  onChange={(e) => {
                                    const nextPz = [...block.data.items];
                                    nextPz[pzIdx].prizePool = e.target.value;
                                    handleUpdateBlock(block.id, { data: { ...block.data, items: nextPz } });
                                  }}
                                  placeholder="Nominal (Rp ...)"
                                  className="w-32 bg-white px-2 py-1 rounded-md border border-slate-200 text-xs font-mono text-blue-600 font-bold"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nextPz = block.data.items.filter((_: any, i: number) => i !== pzIdx);
                                    handleUpdateBlock(block.id, { data: { ...block.data, items: nextPz } });
                                  }}
                                  className="text-slate-400 hover:text-red-600"
                                >
                                  <span className="material-symbols-outlined text-[16px]">close</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const newPz: CategoryItem = {
                              id: `pz-${Date.now()}`,
                              title: `Juara ${(block.data.items || []).length + 1}`,
                              targetAudience: 'Pemenang',
                              description: 'Hadiah tunai dan sertifikat',
                              prizePool: 'Rp 5.000.000',
                              badge: `Juara ${(block.data.items || []).length + 1}`
                            };
                            const nextPz = [...(block.data.items || []), newPz];
                            handleUpdateBlock(block.id, { data: { ...block.data, items: nextPz } });
                          }}
                          className="w-full py-2 rounded-xl border border-dashed border-blue-300 text-blue-600 text-xs font-bold hover:bg-blue-50/50 flex items-center justify-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[16px]">add</span>
                          <span>Tambah Kategori Hadiah</span>
                        </button>
                      </div>
                    )}

                    {/* TYPE: SPEAKERS */}
                    {block.type === 'speakers' && (
                      <div className="space-y-3">
                        <div className="space-y-2">
                          {((block.data?.items as SpeakerItem[]) || []).map((spk, spkIdx) => (
                            <div key={spk.id || spkIdx} className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                              <div className="flex items-center justify-between gap-2">
                                <input
                                  type="text"
                                  value={spk.name}
                                  onChange={(e) => {
                                    const nextSpk = [...block.data.items];
                                    nextSpk[spkIdx].name = e.target.value;
                                    handleUpdateBlock(block.id, { data: { ...block.data, items: nextSpk } });
                                  }}
                                  placeholder="Nama Pembicara"
                                  className="w-full bg-white px-2 py-1 rounded border border-slate-200 text-xs font-bold"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nextSpk = block.data.items.filter((_: any, i: number) => i !== spkIdx);
                                    handleUpdateBlock(block.id, { data: { ...block.data, items: nextSpk } });
                                  }}
                                  className="text-slate-400 hover:text-red-600"
                                >
                                  <span className="material-symbols-outlined text-[16px]">close</span>
                                </button>
                              </div>
                              <input
                                type="text"
                                value={spk.role}
                                onChange={(e) => {
                                  const nextSpk = [...block.data.items];
                                  nextSpk[spkIdx].role = e.target.value;
                                  handleUpdateBlock(block.id, { data: { ...block.data, items: nextSpk } });
                                }}
                                placeholder="Peran / Jabatan"
                                className="w-full bg-transparent text-xs text-slate-500 focus:outline-none"
                              />
                            </div>
                          ))}
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const newSpk: SpeakerItem = {
                              id: `spk-${Date.now()}`,
                              name: 'Nama Pembicara Baru',
                              role: 'Speaker / Panelist',
                              companyOrCampus: 'Instansi',
                              avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'
                            };
                            const nextSpk = [...(block.data.items || []), newSpk];
                            handleUpdateBlock(block.id, { data: { ...block.data, items: nextSpk } });
                          }}
                          className="w-full py-2 rounded-xl border border-dashed border-blue-300 text-blue-600 text-xs font-bold hover:bg-blue-50/50 flex items-center justify-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[16px]">add</span>
                          <span>Tambah Pembicara</span>
                        </button>
                      </div>
                    )}

                    {/* TYPE: FAQ */}
                    {block.type === 'faq' && (
                      <div className="space-y-3">
                        <div className="space-y-2">
                          {((block.data?.items as FaqItem[]) || []).map((faq, fIdx) => (
                            <div key={faq.id || fIdx} className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                              <div className="flex items-center justify-between gap-2">
                                <input
                                  type="text"
                                  value={faq.question}
                                  onChange={(e) => {
                                    const nextFaq = [...block.data.items];
                                    nextFaq[fIdx].question = e.target.value;
                                    handleUpdateBlock(block.id, { data: { ...block.data, items: nextFaq } });
                                  }}
                                  placeholder="Pertanyaan"
                                  className="w-full bg-white px-2 py-1 rounded border border-slate-200 text-xs font-bold"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nextFaq = block.data.items.filter((_: any, i: number) => i !== fIdx);
                                    handleUpdateBlock(block.id, { data: { ...block.data, items: nextFaq } });
                                  }}
                                  className="text-slate-400 hover:text-red-600"
                                >
                                  <span className="material-symbols-outlined text-[16px]">close</span>
                                </button>
                              </div>
                              <textarea
                                value={faq.answer}
                                onChange={(e) => {
                                  const nextFaq = [...block.data.items];
                                  nextFaq[fIdx].answer = e.target.value;
                                  handleUpdateBlock(block.id, { data: { ...block.data, items: nextFaq } });
                                }}
                                rows={2}
                                placeholder="Jawaban..."
                                className="w-full bg-transparent text-xs text-slate-600 focus:outline-none resize-none"
                              />
                            </div>
                          ))}
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const newFaq: FaqItem = {
                              id: `faq-${Date.now()}`,
                              question: 'Pertanyaan baru?',
                              answer: 'Jawaban penjelasan...'
                            };
                            const nextFaq = [...(block.data.items || []), newFaq];
                            handleUpdateBlock(block.id, { data: { ...block.data, items: nextFaq } });
                          }}
                          className="w-full py-2 rounded-xl border border-dashed border-blue-300 text-blue-600 text-xs font-bold hover:bg-blue-50/50 flex items-center justify-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[16px]">add</span>
                          <span>Tambah FAQ</span>
                        </button>
                      </div>
                    )}

                    {/* TYPE: CONTACT */}
                    {block.type === 'contact' && (
                      <div className="space-y-2 text-xs">
                        <div>
                          <label className="block text-slate-600 font-bold mb-1">Nomor WhatsApp Narahubung</label>
                          <input
                            type="text"
                            value={block.data?.whatsappNumber || ''}
                            onChange={(e) => handleUpdateBlock(block.id, { data: { ...block.data, whatsappNumber: e.target.value } })}
                            placeholder="6281234567890"
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-600 font-bold mb-1">Email Resmi</label>
                          <input
                            type="email"
                            value={block.data?.email || ''}
                            onChange={(e) => handleUpdateBlock(block.id, { data: { ...block.data, email: e.target.value } })}
                            placeholder="panitia@event.site"
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* BOTTOM ACTION TOOLBAR (Google Forms Bottom Bar in Screenshot) */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-slate-400">
                    {/* Left: Reorder Arrows */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveBlockUp(idx);
                        }}
                        disabled={idx === 0}
                        className="w-7 h-7 rounded hover:bg-slate-100 flex items-center justify-center transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                        title="Geser Naik (Urut ke Atas)"
                      >
                        <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveBlockDown(idx);
                        }}
                        disabled={idx === currentBlocks.length - 1}
                        className="w-7 h-7 rounded hover:bg-slate-100 flex items-center justify-center transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                        title="Geser Turun (Urut ke Bawah)"
                      >
                        <span className="material-symbols-outlined text-[18px]">arrow_downward</span>
                      </button>

                      <span className="text-[10px] font-mono text-slate-400 ml-1">
                        Urutan #{idx + 1}
                      </span>
                    </div>

                    {/* Right: Duplicate, Delete, Required/Visibility Toggle */}
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicateBlock(block);
                        }}
                        className="w-7 h-7 rounded hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors"
                        title="Duplikat Komponen"
                      >
                        <span className="material-symbols-outlined text-[18px]">content_copy</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteBlock(block.id);
                        }}
                        className="w-7 h-7 rounded hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-red-600 transition-colors"
                        title="Hapus Komponen"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>

                      <span className="h-4 w-px bg-slate-200" />

                      {/* Required / Active in Preview Toggle */}
                      <label
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700"
                      >
                        <span>Aktif di Web</span>
                        <input
                          type="checkbox"
                          checked={block.enabled}
                          onChange={(e) => handleUpdateBlock(block.id, { enabled: e.target.checked })}
                          className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* EMPTY BLOCKS CALLOUT (If user removes everything) */}
          {currentBlocks.length === 0 && (
            <div className="py-12 border-2 border-dashed border-slate-300 rounded-2xl text-center p-6 space-y-3 bg-white/60">
              <span className="material-symbols-outlined text-[36px] text-slate-400">add_circle_outline</span>
              <h4 className="font-bold text-sm text-slate-800">Canvas Masih Kosong</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Mulai bangun website event Anda dari nol. Klik tombol di bawah untuk menambahkan formulir, timeline, atau hero banner.
              </p>
              <button
                type="button"
                onClick={() => setIsAddMenuOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                <span>Tambah Fitur Pertama</span>
              </button>
            </div>
          )}

          {/* FLOATING ACTION TOOLBAR (Google Forms Floating Tool Bar) */}
          <div className="sticky bottom-4 z-20 flex justify-center">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 shadow-xl p-1.5 flex items-center gap-1.5">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">add_circle</span>
                  <span>Tambah Fitur Baru</span>
                </button>

                {/* Add Menu Popover */}
                {isAddMenuOpen && (
                  <div className="absolute bottom-12 left-0 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2 z-50 space-y-1 animate-fadeIn">
                    <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      PILIH KOMPONEN EVENT
                    </div>
                    {Object.entries(BLOCK_TYPES_META).map(([key, item]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleAddBlock(key as EventBlockType)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-blue-50 text-slate-800 transition-colors cursor-pointer group"
                      >
                        <span className="material-symbols-outlined text-[20px] text-blue-600 group-hover:scale-110 transition-transform">
                          {item.icon}
                        </span>
                        <div>
                          <span className="block text-xs font-bold text-slate-900 group-hover:text-blue-700">
                            {item.label}
                          </span>
                          <span className="block text-[10px] text-slate-500">
                            {item.desc}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick shortcut buttons */}
              <button
                type="button"
                onClick={() => handleAddBlock('form')}
                className="w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-700 transition-colors"
                title="Tambah Formulir"
              >
                <span className="material-symbols-outlined text-[18px]">assignment</span>
              </button>

              <button
                type="button"
                onClick={() => handleAddBlock('timeline')}
                className="w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-700 transition-colors"
                title="Tambah Timeline"
              >
                <span className="material-symbols-outlined text-[18px]">schedule</span>
              </button>

              <button
                type="button"
                onClick={() => handleAddBlock('text')}
                className="w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-700 transition-colors"
                title="Tambah Teks"
              >
                <span className="material-symbols-outlined text-[18px]">text_fields</span>
              </button>

              <button
                type="button"
                onClick={() => handleAddBlock('prizes')}
                className="w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-700 transition-colors"
                title="Tambah Hadiah"
              >
                <span className="material-symbols-outlined text-[18px]">emoji_events</span>
              </button>

              <button
                type="button"
                onClick={() => handleAddBlock('faq')}
                className="w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-700 transition-colors"
                title="Tambah FAQ"
              >
                <span className="material-symbols-outlined text-[18px]">help</span>
              </button>
            </div>
          </div>
        </div>

        {/* ─── RIGHT: LIVE DEVICE PREVIEW (ORDERED BY BLOCK SEQUENCE) ────────── */}
        <div className="flex-1 bg-slate-200/80 p-4 sm:p-6 overflow-y-auto flex items-start justify-center">
          <div
            className={`transition-all duration-300 w-full bg-white rounded-2xl shadow-2xl border border-slate-300/80 overflow-hidden flex flex-col ${
              deviceViewport === 'mobile'
                ? 'max-w-[390px] min-h-[780px]'
                : deviceViewport === 'tablet'
                ? 'max-w-[768px] min-h-[820px]'
                : 'max-w-[1080px] min-h-[860px]'
            }`}
          >
            {/* Simulated Browser Chrome */}
            <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs shrink-0 select-none">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-400 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block" />
              </div>

              <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-white border border-slate-200 text-slate-500 font-mono text-[11px] max-w-sm sm:max-w-md w-full justify-center shadow-2xs">
                <span className="material-symbols-outlined text-[13px] text-slate-400">lock</span>
                <span className="truncate">https://{slugInput || currentWs.slug || 'event'}.iventra.site</span>
                <span className="material-symbols-outlined text-[13px] text-slate-400 ml-auto">refresh</span>
              </div>

              <div className="flex items-center gap-1.5 text-slate-400">
                <span className="text-[10px] font-mono">100%</span>
              </div>
            </div>

            {/* LIVE EVENT RENDERER IN EXACT SEQUENTIAL BLOCK ORDER */}
            <div className="flex-1 overflow-y-auto bg-white">
              <SparkEventRenderer config={config} isPreviewMode={true} />
            </div>
          </div>
        </div>
      </div>

      {/* ─── TOAST NOTIFICATION ────────────────────────────────────────────── */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-2xl text-xs font-bold animate-fadeIn flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px] text-blue-400">info</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ─── THEME & COLOR MODAL ────────────────────────────────────────────── */}
      {isThemeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-display font-bold text-base text-slate-900">Tampilan &amp; Branding Website</h3>
              <button
                type="button"
                onClick={() => setIsThemeModalOpen(false)}
                className="text-slate-400 hover:text-slate-800 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Warna Utama (Primary)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={config.theme?.primaryColor || '#1f2de6'}
                    onChange={(e) => updateConfig((prev) => ({
                      ...prev,
                      theme: { ...(prev.theme || { primaryColor: '#1f2de6', accentColor: '#3b47dc', bgStyle: 'clean-white', fontFamily: 'sans' }), primaryColor: e.target.value }
                    }))}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200 p-0.5"
                  />
                  <input
                    type="text"
                    value={config.theme?.primaryColor || '#1f2de6'}
                    onChange={(e) => updateConfig((prev) => ({
                      ...prev,
                      theme: { ...(prev.theme || { primaryColor: '#1f2de6', accentColor: '#3b47dc', bgStyle: 'clean-white', fontFamily: 'sans' }), primaryColor: e.target.value }
                    }))}
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-200 font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Gaya Latar Belakang (Background Style)</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'clean-white', label: 'Clean White' },
                    { id: 'subtle-gradient', label: 'Subtle Gradient' },
                    { id: 'dark-modern', label: 'Dark Modern' },
                    { id: 'campus-emerald', label: 'Campus Emerald' }
                  ].map((style) => (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => updateConfig((prev) => ({
                        ...prev,
                        theme: { ...(prev.theme || { primaryColor: '#1f2de6', accentColor: '#3b47dc', bgStyle: 'clean-white', fontFamily: 'sans' }), bgStyle: style.id as any }
                      }))}
                      className={`p-2.5 rounded-xl border text-left font-bold transition-all ${
                        config.theme?.bgStyle === style.id
                          ? 'border-blue-600 bg-blue-50 text-blue-700 ring-1 ring-blue-600'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {style.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Slug URL Web Event</label>
                <div className="flex items-center px-3 py-2 rounded-lg border border-slate-200 bg-slate-50">
                  <span className="text-slate-400 font-mono text-xs">https://</span>
                  <input
                    type="text"
                    value={slugInput}
                    onChange={(e) => {
                      setSlugInput(e.target.value);
                      setIsDirty(true);
                    }}
                    placeholder="nama-event"
                    className="flex-1 bg-transparent px-1 font-mono text-blue-700 text-xs focus:outline-none"
                  />
                  <span className="text-slate-400 font-mono text-xs">.iventra.site</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setIsThemeModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── SPARK SUBSCRIPTION MODAL ───────────────────────────────────────── */}
      <SparkSubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
      />
    </div>
  );
}
