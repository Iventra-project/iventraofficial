import { useState, useEffect, useCallback, useMemo } from 'react';
import type {
  EventConfig,
  EventBlock,
  EventBlockType,
  FormFieldItem,
  FormFieldType,
  TimelineItem,
  SpeakerItem,
  CategoryItem,
  FaqItem,
  HeroButton,
  FormStep,
  WebsitePhase,
  GalleryImageItem
} from '../../types/builder.ts';
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

const ProDiamondBadge = () => (
  <span
    title="Fitur Pro"
    className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 text-white shadow-xs z-20 pointer-events-none"
  >
    <span className="material-symbols-outlined text-[10px] leading-none font-bold">diamond</span>
  </span>
);

const BLOCK_TYPES_META: Record<EventBlockType, { label: string; icon: string; desc: string }> = {
  hero: { label: 'Hero Banner & Judul', icon: 'view_carousel', desc: 'Headline, subjudul, poster, dan tombol aksi' },
  form: { label: 'Formulir Pendaftaran', icon: 'assignment', desc: 'Formulir input data pendaftar bertahap' },
  buttons: { label: 'Tombol Tindakan (CTA)', icon: 'smart_button', desc: 'Tombol aksi mandiri untuk navigasi atau link' },
  gallery: { label: 'Galeri Foto & Dokumentasi', icon: 'collections', desc: 'Koleksi foto acara berbagai ukuran (kecil & besar)' },
  timeline: { label: 'Timeline & Tahapan', icon: 'schedule', desc: 'Alur tahapan pelaksanaan event' },
  text: { label: 'Informasi & Deskripsi', icon: 'text_fields', desc: 'Teks aturan, panduan, atau ketentuan' },
  prizes: { label: 'Hadiah & Prizepool', icon: 'emoji_events', desc: 'Total hadiah juara dan kategori apresiasi' },
  speakers: { label: 'Pembicara & Juri', icon: 'group', desc: 'Daftar pembicara tamu atau dewan juri' },
  tickets: { label: 'Tier Tiket & Biaya', icon: 'confirmation_number', desc: 'Kategori tiket berbayar atau free pass' },
  faq: { label: 'Tanya Jawab (FAQ)', icon: 'help', desc: 'Pertanyaan umum seputar acara' },
  contact: { label: 'Kontak Panitia', icon: 'contact_support', desc: 'Narahubung WhatsApp dan email' }
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
  const [isDirty, setIsDirty] = useState(false);
  const [currentWs, setCurrentWs] = useState<Workspace>(workspace);
  const [slugInput, setSlugInput] = useState(workspace.slug || '');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals & Popovers
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [publishModalStep, setPublishModalStep] = useState<'input' | 'launching' | 'success'>('input');
  const [publishEventName, setPublishEventName] = useState(config.eventName || currentWs.name || '');
  const [publishSlug, setPublishSlug] = useState(workspace.slug || 'event-2026');
  const [isGeneralOpen, setIsGeneralOpen] = useState(false);
  const [isPhaseSectionOpen, setIsPhaseSectionOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [subscriptionGateTitle, setSubscriptionGateTitle] = useState('');
  const [isUserSubscribed, setIsUserSubscribed] = useState(workspace.service_type === 'spark_pro' || false);
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const handleBackClick = () => {
    if (isDirty) {
      setIsExitModalOpen(true);
    } else {
      onBackToDashboard();
    }
  };

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const updateConfig = useCallback((updater: (prev: EventConfig) => EventConfig) => {
    setConfig((prev) => {
      const next = updater(prev);
      setIsDirty(true);
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
      if (showFeedback) {
        showToast('Draft berhasil disimpan');
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

  // Debounced auto-save
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

  // Auto-adapt color theme from Logo image URL
  const adaptThemeFromLogo = useCallback((logoUrl: string) => {
    if (!logoUrl) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 16;
        canvas.height = 16;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, 16, 16);
          const data = ctx.getImageData(0, 0, 16, 16).data;
          let r = 0, g = 0, b = 0, count = 0;
          for (let i = 0; i < data.length; i += 4) {
            const cr = data[i], cg = data[i + 1], cb = data[i + 2], ca = data[i + 3];
            if (ca > 150 && (cr + cg + cb < 700) && (cr + cg + cb > 80)) {
              r += cr; g += cg; b += cb; count++;
            }
          }
          if (count > 0) {
            r = Math.round(r / count);
            g = Math.round(g / count);
            b = Math.round(b / count);
            const primaryHex = '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
            const accentHex = '#' + [
              Math.min(255, Math.round(r * 1.25)),
              Math.min(255, Math.round(g * 1.25)),
              Math.min(255, Math.round(b * 1.25))
            ].map((x) => x.toString(16).padStart(2, '0')).join('');

            updateConfig((prev) => ({
              ...prev,
              theme: {
                ...prev.theme,
                primaryColor: primaryHex,
                accentColor: accentHex,
                bgStyle: 'subtle-gradient'
              }
            }));
            return;
          }
        }
      } catch (err) {
        // Fallback
      }
      updateConfig((prev) => ({
        ...prev,
        theme: {
          ...prev.theme,
          primaryColor: '#0c1df3',
          accentColor: '#3b47dc',
          bgStyle: 'subtle-gradient'
        }
      }));
    };
    img.onerror = () => {};
    img.src = logoUrl;
  }, [updateConfig]);

  // Website Scheduling Phases (Fase 1, Fase 2, dst)
  const currentPhases: WebsitePhase[] = useMemo(() => {
    if (config.phases && Array.isArray(config.phases) && config.phases.length > 0) {
      return config.phases;
    }
    const defaultBlocks = config.blocks || [];
    return [
      {
        id: 'phase-1',
        name: 'Fase 1: Pendaftaran',
        scheduledDate: new Date().toISOString().split('T')[0],
        blocks: defaultBlocks
      },
      {
        id: 'phase-2',
        name: 'Fase 2: Seleksi & Pengumpulan',
        scheduledDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        blocks: defaultBlocks
      }
    ];
  }, [config.phases, config.blocks]);

  const activePhaseId = config.activePhaseId || currentPhases[0]?.id || 'phase-1';
  const activePhase = currentPhases.find((p) => p.id === activePhaseId) || currentPhases[0];

  const currentBlocks: EventBlock[] = useMemo(() => {
    if (config.enablePhases && activePhase && Array.isArray(activePhase.blocks)) {
      return activePhase.blocks;
    }
    return config.blocks || [];
  }, [config.enablePhases, activePhase, config.blocks]);

  const updateCurrentBlocks = (newBlocks: EventBlock[]) => {
    updateConfig((prev) => {
      if (prev.enablePhases && activePhaseId) {
        const nextPhases = currentPhases.map((p) =>
          p.id === activePhaseId ? { ...p, blocks: newBlocks } : p
        );
        return {
          ...prev,
          phases: nextPhases,
          blocks: newBlocks
        };
      }
      return {
        ...prev,
        blocks: newBlocks
      };
    });
  };

  const handleSelectPhase = (phaseId: string) => {
    const targetPhase = currentPhases.find((p) => p.id === phaseId);
    if (!targetPhase) return;
    updateConfig((prev) => ({
      ...prev,
      activePhaseId: phaseId,
      blocks: targetPhase.blocks || prev.blocks || []
    }));
  };

  const handleToggleEnablePhases = () => {
    if (!config.enablePhases) {
      if (!isUserSubscribed) {
        setSubscriptionGateTitle('Fitur Penjadwalan Fase Otomatis');
        setIsSubscriptionModalOpen(true);
        return;
      }
      updateConfig((prev) => {
        let phasesList = prev.phases;
        const initialBlocks = prev.blocks || [];
        if (!phasesList || phasesList.length === 0) {
          phasesList = [
            {
              id: 'phase-1',
              name: 'Fase 1: Pendaftaran',
              scheduledDate: new Date().toISOString().split('T')[0],
              blocks: JSON.parse(JSON.stringify(initialBlocks))
            },
            {
              id: 'phase-2',
              name: 'Fase 2: Seleksi & Pengumpulan',
              scheduledDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
              blocks: JSON.parse(JSON.stringify(initialBlocks))
            }
          ];
        } else {
          phasesList = phasesList.map((p) => ({
            ...p,
            blocks: p.blocks || JSON.parse(JSON.stringify(initialBlocks))
          }));
        }
        return {
          ...prev,
          enablePhases: true,
          phases: phasesList,
          activePhaseId: phasesList[0].id
        };
      });
      setIsPhaseSectionOpen(true);
      showToast('Penjadwalan fase website diaktifkan');
    } else {
      updateConfig((prev) => ({
        ...prev,
        enablePhases: false
      }));
      setIsPhaseSectionOpen(false);
      showToast('Penjadwalan fase dinonaktifkan');
    }
  };

  const handleUpdatePhase = (phaseId: string, updates: Partial<WebsitePhase>) => {
    updateConfig((prev) => {
      const nextPhases = currentPhases.map((p) => (p.id === phaseId ? { ...p, ...updates } : p));
      return {
        ...prev,
        phases: nextPhases
      };
    });
  };

  const handleAddPhase = () => {
    const newPhase: WebsitePhase = {
      id: `phase-${Date.now()}`,
      name: `Fase ${currentPhases.length + 1}`,
      scheduledDate: new Date(Date.now() + (currentPhases.length + 1) * 7 * 86400000).toISOString().split('T')[0],
      blocks: JSON.parse(JSON.stringify(currentBlocks))
    };
    updateConfig((prev) => ({
      ...prev,
      phases: [...currentPhases, newPhase],
      activePhaseId: newPhase.id,
      blocks: newPhase.blocks
    }));
    showToast(`${newPhase.name} ditambahkan dengan duplikasi fitur fase sebelumnya!`);
  };

  const handleDeletePhase = (phaseId: string) => {
    if (currentPhases.length <= 1) {
      showToast('Minimal harus ada 1 fase.');
      return;
    }
    const remaining = currentPhases.filter((p) => p.id !== phaseId);
    updateConfig((prev) => ({
      ...prev,
      phases: remaining,
      activePhaseId: remaining[0].id,
      blocks: remaining[0].blocks || prev.blocks || []
    }));
    showToast('Fase berhasil dihapus');
  };

  const isPhaseAutoActive = (scheduledDate?: string) => {
    if (!scheduledDate) return false;
    const today = new Date().toISOString().split('T')[0];
    return today >= scheduledDate;
  };

  // Publish Modal Actions
  const openPublishModal = () => {
    setPublishEventName(config.eventName || currentWs.name || '');
    setPublishSlug(slugInput || currentWs.slug || 'event-2026');
    setPublishModalStep('input');
    setIsPublishModalOpen(true);
  };

  const executePublishWithRocket = async () => {
    setPublishModalStep('launching');
    try {
      // 1. Save draft first
      await fetch(`/api/workspaces/${currentWs.id}/builder`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({
          name: publishEventName || currentWs.name,
          slug: publishSlug || currentWs.slug,
          description: config.description || currentWs.description,
          template_id: currentWs.template_id || 'blank',
          draft_config: JSON.stringify({
            ...config,
            eventName: publishEventName || config.eventName
          })
        })
      });

      // 2. Rocket Flight Animation delay
      await new Promise((r) => setTimeout(r, 2200));

      // 3. Call publish API
      const res = await fetch(`/api/workspaces/${currentWs.id}/publish`, {
        method: 'POST',
        headers: authHeaders
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Gagal mempublikasikan website.');
      }

      setCurrentWs(json.workspace || { ...currentWs, status: 'published', slug: publishSlug, name: publishEventName });
      setIsDirty(false);
      onWorkspaceUpdated?.(json.workspace);
      setPublishModalStep('success');
    } catch (err: any) {
      showToast(err.message || 'Gagal mempublikasikan.');
      setPublishModalStep('input');
    }
  };

  // Check if any button in the workspace directs to a specific block
  const isBlockTargetedByAnyButton = useCallback(
    (targetBlockId: string) => {
      return currentBlocks.some((b) => {
        const btns: HeroButton[] = b.data?.buttons || [];
        return btns.some((btn) => btn.enabled && btn.targetType === 'block' && btn.targetBlockId === targetBlockId);
      });
    },
    [currentBlocks]
  );

  // Add block
  const handleAddBlock = (type: EventBlockType) => {
    const newId = `block-${Date.now()}`;
    let defaultData: any = {};

    switch (type) {
      case 'hero':
        defaultData = {
          headline: config.eventName || 'Untitled Event',
          tagline: '',
          dateText: 'Segera Hadir 2026',
          locationText: 'Online / Hybrid',
          badgeText: '',
          buttons: [
            { id: `btn-${Date.now()}-1`, enabled: true, label: 'Daftar Sekarang', targetType: 'block', targetBlockId: 'block-form' }
          ]
        };
        break;
      case 'buttons':
        defaultData = {
          buttons: [
            { id: `btn-${Date.now()}-1`, enabled: true, label: 'Pelajari Selengkapnya', targetType: 'block', targetBlockId: '' }
          ]
        };
        break;
      case 'form':
        defaultData = {
          buttonText: 'Kirim Pendaftaran',
          openMode: 'same-page',
          hideFromMainPage: false,
          steps: [
            {
              id: `step-${Date.now()}-1`,
              title: 'Alur 1',
              fields: [
                { id: `f-${Date.now()}-1`, label: 'Nama Lengkap', type: 'text', required: true, placeholder: 'Nama Anda' },
                { id: `f-${Date.now()}-2`, label: 'Email', type: 'text', required: true, placeholder: 'nama@domain.com' }
              ]
            }
          ]
        };
        break;
      case 'timeline':
        defaultData = {
          items: [
            { id: `t-${Date.now()}-1`, name: 'Registrasi Peserta', description: '', startDate: '01 Nov', endDate: '15 Nov', order: 1, status: 'active' },
            { id: `t-${Date.now()}-2`, name: 'Pelaksanaan Acara', description: '', startDate: '20 Nov', endDate: '20 Nov', order: 2, status: 'upcoming' }
          ]
        };
        break;
      case 'text':
        defaultData = {
          content: 'Tuliskan deskripsi lengkap atau ketentuan acara di sini.'
        };
        break;
      case 'prizes':
        defaultData = {
          items: [
            { id: `pz-${Date.now()}-1`, title: 'Juara 1', prizePool: 'Rp 10.000.000', badge: 'Juara 1', description: 'Uang tunai + Sertifikat' }
          ]
        };
        break;
      case 'speakers':
        defaultData = {
          items: [
            { id: `sp-${Date.now()}-1`, name: 'Nama Pembicara', role: 'Speaker', companyOrCampus: 'Instansi', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80' }
          ]
        };
        break;
      case 'gallery':
        defaultData = {
          sectionTitle: 'Dokumentasi & Galeri',
          sectionSubtitle: 'Koleksi momen dan dokumentasi kegiatan',
          images: [
            {
              id: `img-${Date.now()}-1`,
              url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80',
              caption: 'Opening Ceremony',
              size: 'featured'
            },
            {
              id: `img-${Date.now()}-2`,
              url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop&q=80',
              caption: 'Sesi Diskusi & Workshop',
              size: 'normal'
            }
          ]
        };
        break;
      case 'faq':
        defaultData = {
          items: [
            { id: `faq-${Date.now()}-1`, question: 'Pertanyaan?', answer: 'Jawaban...' }
          ]
        };
        break;
      case 'contact':
        defaultData = {
          committeeName: 'Sekretariat Panitia',
          email: 'info@event.site',
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

    updateCurrentBlocks([...currentBlocks, newBlock]);
    setActiveBlockId(newId);
    setIsAddMenuOpen(false);
  };

  const handleMoveBlockUp = (index: number) => {
    if (index <= 0) return;
    const list = [...currentBlocks];
    const temp = list[index - 1];
    list[index - 1] = list[index];
    list[index] = temp;
    updateCurrentBlocks(list);
  };

  const handleMoveBlockDown = (index: number) => {
    if (index >= currentBlocks.length - 1) return;
    const list = [...currentBlocks];
    const temp = list[index + 1];
    list[index + 1] = list[index];
    list[index] = temp;
    updateCurrentBlocks(list);
  };

  const handleDuplicateBlock = (block: EventBlock) => {
    const clone: EventBlock = {
      ...block,
      id: `block-${Date.now()}`,
      title: `${block.title} (Salinan)`,
      data: JSON.parse(JSON.stringify(block.data))
    };
    const list = [...currentBlocks];
    const idx = list.findIndex((b) => b.id === block.id);
    list.splice(idx + 1, 0, clone);
    updateCurrentBlocks(list);
    setActiveBlockId(clone.id);
  };

  const handleDeleteBlock = (id: string) => {
    const list = currentBlocks.filter((b) => b.id !== id);
    updateCurrentBlocks(list);
  };

  const handleChangeBlockType = (blockId: string, newType: EventBlockType) => {
    const list = currentBlocks.map((b) => {
      if (b.id !== blockId) return b;
      return {
        ...b,
        type: newType,
        title: BLOCK_TYPES_META[newType].label
      };
    });
    updateCurrentBlocks(list);
  };

  const handleUpdateBlock = (blockId: string, updates: Partial<EventBlock>) => {
    const list = currentBlocks.map((b) => {
      if (b.id !== blockId) return b;
      return { ...b, ...updates };
    });
    updateCurrentBlocks(list);
  };

  // Add button to Hero or Buttons block (Max 2 for free, 3 requires subscription)
  const handleAddButtonToBlock = (blockId: string, currentButtons: HeroButton[]) => {
    if (currentButtons.length >= 2) {
      setSubscriptionGateTitle('Batas Tombol Aksi Spark Free');
      setIsSubscriptionModalOpen(true);
      return;
    }
    const newBtn: HeroButton = {
      id: `btn-${Date.now()}`,
      enabled: true,
      label: currentButtons.length === 0 ? 'Daftar Sekarang' : 'Pelajari Detail',
      targetType: 'block',
      targetBlockId: ''
    };
    handleUpdateBlock(blockId, {
      data: {
        ...(currentBlocks.find((b) => b.id === blockId)?.data || {}),
        buttons: [...currentButtons, newBtn]
      }
    });
  };

  // Add Form Step (Max 2 steps for free, 3 requires subscription)
  const handleAddFormStep = (blockId: string, currentSteps: FormStep[]) => {
    if (currentSteps.length >= 2) {
      setSubscriptionGateTitle('Batas Alur Bertahap Spark Free');
      setIsSubscriptionModalOpen(true);
      return;
    }
    const newStep: FormStep = {
      id: `step-${Date.now()}`,
      title: `Alur ${currentSteps.length + 1}`,
      fields: [
        { id: `f-${Date.now()}`, label: 'Upload Berkas / Bukti', type: 'image', required: true }
      ]
    };
    handleUpdateBlock(blockId, {
      data: {
        ...(currentBlocks.find((b) => b.id === blockId)?.data || {}),
        steps: [...currentSteps, newStep]
      }
    });
  };

  // Add Gallery Image (Max 2 for free, 3+ requires subscription)
  const handleAddGalleryImage = (blockId: string, currentImages: GalleryImageItem[]) => {
    if (currentImages.length >= 2 && !isUserSubscribed) {
      setSubscriptionGateTitle('Batas Galeri Foto Spark Free');
      setIsSubscriptionModalOpen(true);
      return;
    }
    const newImg: GalleryImageItem = {
      id: `img-${Date.now()}`,
      url: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800&auto=format&fit=crop&q=80',
      caption: `Foto Dokumentasi #${currentImages.length + 1}`,
      size: currentImages.length % 3 === 0 ? 'featured' : 'normal'
    };
    handleUpdateBlock(blockId, {
      data: {
        ...(currentBlocks.find((b) => b.id === blockId)?.data || {}),
        images: [...currentImages, newImg]
      }
    });
  };

  // Add field to specific form step with 3 choices: 'text', 'image', 'choice'
  const handleAddFieldToStep = (blockId: string, stepIndex: number, type: FormFieldType) => {
    const block = currentBlocks.find((b) => b.id === blockId);
    if (!block) return;
    const steps: FormStep[] = [...(block.data.steps || [])];
    if (!steps[stepIndex]) return;

    let defaultLabel = 'Pertanyaan Baru';
    let defaultOptions: string[] | undefined = undefined;

    if (type === 'text') defaultLabel = 'Nama Lengkap / Catatan';
    if (type === 'image') defaultLabel = 'Upload Berkas / Gambar';
    if (type === 'choice') {
      defaultLabel = 'Pilihan Kategori / Tiket';
      defaultOptions = ['Opsi 1', 'Opsi 2'];
    }

    const newField: FormFieldItem = {
      id: `f-${Date.now()}`,
      label: defaultLabel,
      type,
      required: true,
      options: defaultOptions,
      placeholder: ''
    };

    steps[stepIndex].fields = [...(steps[stepIndex].fields || []), newField];
    handleUpdateBlock(blockId, {
      data: { ...block.data, steps }
    });
  };

  const publishedUrl = `${window.location.origin}/#event/${currentWs.slug || currentWs.id}`;

  return (
    <div className="h-screen flex flex-col bg-[#f0f2f5] text-slate-900 select-none font-sans overflow-hidden">
      {/* ─── GLOBAL TOP NAVIGATION ────────────────────────────────────────── */}
      <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4 z-40 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={handleBackClick}
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
        </div>

        {/* Viewport Switcher */}
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

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
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
            onClick={openPublishModal}
            disabled={isPublishing}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[16px]">rocket_launch</span>
            <span>{isPublishing ? 'Meluncur...' : 'Publikasikan'}</span>
          </button>
        </div>
      </header>

      {/* ─── ANIMATED SKELETON BAR LOADER ────────────────────────────────────── */}
      {(isSaving || isPublishing) && (
        <div className="w-full h-1 bg-slate-100 overflow-hidden relative z-40">
          <div className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 w-1/2 animate-[pulse_1s_infinite] rounded-full" />
        </div>
      )}

      {/* ─── DUAL COLUMN WORKSPACE (INDEPENDENT SEPARATE SCROLLS) ───────────── */}
      <div className="flex-1 flex overflow-hidden h-[calc(100vh-64px)]">
        {/* ─── LEFT: GOOGLE FORMS STYLE EDITOR CANVAS (SCROLL 1) ─────────────── */}
        <div className="w-full lg:w-[540px] xl:w-[600px] border-r border-slate-200 bg-[#f0f2f5] flex flex-col shrink-0 h-full overflow-y-auto p-4 sm:p-6 space-y-4 relative">
          
          {/* ─── CARD 1: PENGATURAN UMUM (ACCORDION DROPDOWN) ──────────────── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden shrink-0">
            <div
              role="button"
              tabIndex={0}
              onClick={() => setIsGeneralOpen(!isGeneralOpen)}
              className="w-full min-h-[64px] p-4 sm:p-5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer select-none"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200/60 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px] text-blue-600">tune</span>
                </div>
                <div>
                  <h2 className="font-display font-bold text-sm text-slate-900 leading-snug">
                    Pengaturan Umum
                  </h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {config.institutionName || 'Instansi'} • {config.eventName || 'Nama Event'}
                  </p>
                </div>
              </div>

              <span className={`material-symbols-outlined text-[20px] text-slate-400 transition-transform ${isGeneralOpen ? 'rotate-180' : ''}`}>
                expand_more
              </span>
            </div>

            {isGeneralOpen && (
              <div className="p-5 pt-0 border-t border-slate-100 space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Instansi / Penyelenggara
                    </label>
                    <input
                      type="text"
                      value={config.institutionName || ''}
                      onChange={(e) => updateConfig((prev) => ({ ...prev, institutionName: e.target.value }))}
                      placeholder="Contoh: BEM Fakultas Teknik"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:border-blue-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Nama Event
                    </label>
                    <input
                      type="text"
                      value={config.eventName || ''}
                      onChange={(e) => updateConfig((prev) => ({ ...prev, eventName: e.target.value }))}
                      placeholder="Contoh: National Tech Summit 2026"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                </div>

                {/* LOGO */}
                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700">Logo Event</label>
                  <div className="flex items-center gap-3">
                    {config.logoUrl ? (
                      <img
                        src={config.logoUrl}
                        alt="Logo"
                        className="w-9 h-9 rounded-lg object-cover border border-slate-200 shrink-0"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-lg border border-dashed border-slate-300 flex items-center justify-center text-slate-400 shrink-0">
                        <span className="material-symbols-outlined text-[18px]">image</span>
                      </div>
                    )}

                    <input
                      type="text"
                      value={config.logoUrl || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateConfig((prev) => ({ ...prev, logoUrl: val }));
                        if (val) adaptThemeFromLogo(val);
                      }}
                      placeholder="Masukkan URL logo gambar (PNG / JPG)"
                      className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-mono focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                </div>

                {/* WARNA & LATAR BELAKANG */}
                <div className="pt-2 border-t border-slate-100 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Warna Utama</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={config.theme?.primaryColor || '#0c1df3'}
                          onChange={(e) => updateConfig((prev) => ({
                            ...prev,
                            theme: { ...(prev.theme || { primaryColor: '#0c1df3', accentColor: '#3b47dc', bgStyle: 'clean-white', fontFamily: 'sans' }), primaryColor: e.target.value }
                          }))}
                          className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200 p-0.5"
                        />
                        <input
                          type="text"
                          value={config.theme?.primaryColor || '#0c1df3'}
                          onChange={(e) => updateConfig((prev) => ({
                            ...prev,
                            theme: { ...(prev.theme || { primaryColor: '#0c1df3', accentColor: '#3b47dc', bgStyle: 'clean-white', fontFamily: 'sans' }), primaryColor: e.target.value }
                          }))}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 font-mono text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Warna Aksen</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={config.theme?.accentColor || '#3b47dc'}
                          onChange={(e) => updateConfig((prev) => ({
                            ...prev,
                            theme: { ...(prev.theme || { primaryColor: '#0c1df3', accentColor: '#3b47dc', bgStyle: 'clean-white', fontFamily: 'sans' }), accentColor: e.target.value }
                          }))}
                          className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200 p-0.5"
                        />
                        <input
                          type="text"
                          value={config.theme?.accentColor || '#3b47dc'}
                          onChange={(e) => updateConfig((prev) => ({
                            ...prev,
                            theme: { ...(prev.theme || { primaryColor: '#0c1df3', accentColor: '#3b47dc', bgStyle: 'clean-white', fontFamily: 'sans' }), accentColor: e.target.value }
                          }))}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 font-mono text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 3 OPSI LATAR BELAKANG */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1.5">Latar Belakang</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'clean-white', label: 'Putih' },
                        { id: 'dark-modern', label: 'Hitam' },
                        { id: 'subtle-gradient', label: 'Gradien' }
                      ].map((style) => (
                        <button
                          key={style.id}
                          type="button"
                          onClick={() => updateConfig((prev) => ({
                            ...prev,
                            theme: { ...(prev.theme || { primaryColor: '#0c1df3', accentColor: '#3b47dc', bgStyle: 'clean-white', fontFamily: 'sans' }), bgStyle: style.id as any }
                          }))}
                          className={`py-2 px-2 rounded-lg border text-center text-xs transition-all cursor-pointer ${
                            config.theme?.bgStyle === style.id
                              ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold shadow-2xs'
                              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-medium'
                          }`}
                        >
                          {style.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ─── CARD 2: FASE & PENJADWALAN (TOGGLE SWITCH & ACCORDION) ───────── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden shrink-0">
            <div className="w-full min-h-[64px] p-4 sm:p-5 flex items-center justify-between select-none">
              <div
                className="flex items-center gap-3 cursor-pointer flex-1"
                onClick={() => {
                  if (config.enablePhases) {
                    setIsPhaseSectionOpen(!isPhaseSectionOpen);
                  } else {
                    handleToggleEnablePhases();
                  }
                }}
              >
                <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200/60 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px] text-blue-600">event_repeat</span>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-display font-bold text-sm text-slate-900 leading-snug">
                      Penjadwalan Fase Website
                    </h3>
                    <span className="material-symbols-outlined text-[13px] text-amber-500" title="Fitur Pro">diamond</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {config.enablePhases ? `${activePhase.name} • ${isPhaseAutoActive(activePhase.scheduledDate) ? 'Aktif' : 'Terjadwal'}` : 'Nonaktif'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                {/* Switch Geser Kiri / Kanan Tanpa Teks dengan Indikator Diamond */}
                <div className="relative">
                  <div
                    role="switch"
                    aria-checked={Boolean(config.enablePhases)}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleEnablePhases();
                    }}
                    className={`w-11 h-6 rounded-full transition-colors p-0.5 cursor-pointer relative shrink-0 ${
                      config.enablePhases ? 'bg-blue-600' : 'bg-slate-300'
                    }`}
                    title={config.enablePhases ? 'Nonaktifkan penjadwalan fase' : 'Aktifkan penjadwalan fase'}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                        config.enablePhases ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </div>
                  <ProDiamondBadge />
                </div>

                {config.enablePhases && (
                  <button
                    type="button"
                    onClick={() => setIsPhaseSectionOpen(!isPhaseSectionOpen)}
                    className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 cursor-pointer"
                  >
                    <span className={`material-symbols-outlined text-[20px] transition-transform ${isPhaseSectionOpen ? 'rotate-180' : ''}`}>
                      expand_more
                    </span>
                  </button>
                )}
              </div>
            </div>

            {config.enablePhases && isPhaseSectionOpen && (
              <div className="p-5 pt-0 border-t border-slate-100 space-y-3.5 text-xs">
                {/* Phase Selector Buttons */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-3">
                  {currentPhases.map((ph, pIdx) => {
                    const isSelected = activePhase.id === ph.id;
                    return (
                      <button
                        key={ph.id || pIdx}
                        type="button"
                        onClick={() => handleSelectPhase(ph.id)}
                        className={`px-3 py-1.5 rounded-lg border text-xs whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-blue-600 bg-blue-600 text-white font-bold shadow-xs'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-medium'
                        }`}
                      >
                        <span>{ph.name || `Fase ${pIdx + 1}`}</span>
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={handleAddPhase}
                    className="px-2.5 py-1.5 rounded-lg border border-dashed border-blue-400 hover:bg-blue-50/50 text-blue-600 text-xs font-semibold whitespace-nowrap flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span className="material-symbols-outlined text-[14px]">add</span>
                    <span>Tambah Fase</span>
                  </button>
                </div>

                {/* Active Phase Settings */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Nama Fase</label>
                      <input
                        type="text"
                        value={activePhase.name || ''}
                        onChange={(e) => handleUpdatePhase(activePhase.id, { name: e.target.value })}
                        placeholder="Contoh: Fase 1: Pendaftaran"
                        className="w-full bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Tanggal Otomatis Aktif</label>
                      <input
                        type="date"
                        value={activePhase.scheduledDate || ''}
                        onChange={(e) => handleUpdatePhase(activePhase.id, { scheduledDate: e.target.value })}
                        className="w-full bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-mono cursor-pointer"
                      />
                    </div>
                  </div>

                  {currentPhases.length > 1 && (
                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => handleDeletePhase(activePhase.id)}
                        className="text-[11px] text-red-600 hover:text-red-700 font-medium flex items-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[14px]">delete</span>
                        <span>Hapus Fase Ini</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* DYNAMIC SEQUENTIAL BLOCK CARDS */}
          {currentBlocks.map((block, idx) => {
            const isActive = activeBlockId === block.id;

            return (
              <div
                key={block.id}
                onClick={() => setActiveBlockId(block.id)}
                className={`bg-white rounded-2xl border transition-all duration-200 shadow-sm relative shrink-0 ${
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
                  {/* Card Header Row: Title & Subtitle + Type Dropdown */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1 space-y-1">
                      <input
                        type="text"
                        value={block.title || ''}
                        onChange={(e) => handleUpdateBlock(block.id, { title: e.target.value })}
                        placeholder="Nama Komponen"
                        className="w-full text-base font-display font-bold text-slate-900 border-b border-transparent hover:border-slate-200 focus:border-blue-600 focus:outline-none transition-colors pb-0.5"
                      />
                      <input
                        type="text"
                        value={block.subtitle || ''}
                        onChange={(e) => handleUpdateBlock(block.id, { subtitle: e.target.value })}
                        placeholder="Sub-judul / deskripsi bagian (opsional)"
                        className="w-full text-xs text-slate-500 border-b border-transparent hover:border-slate-200 focus:border-blue-600 focus:outline-none transition-colors pb-0.5"
                      />
                    </div>

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

                  {/* ─── IN-CARD CONFIGURATION ACCORDING TO TYPE ─────────────────── */}
                  <div className="pt-2">
                    {/* 1. HERO BLOCK OR STANDALONE BUTTONS BLOCK */}
                    {(block.type === 'hero' || block.type === 'buttons') && (
                      <div className="space-y-4 text-xs">
                        {block.type === 'hero' && (
                          <div className="space-y-2">
                            <div>
                              <label className="block text-slate-600 font-bold mb-1">Headline Acara</label>
                              <input
                                type="text"
                                value={block.data?.headline || ''}
                                onChange={(e) => handleUpdateBlock(block.id, { data: { ...block.data, headline: e.target.value } })}
                                placeholder="Judul besar headline"
                                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs"
                              />
                            </div>
                            <div>
                              <label className="block text-slate-600 font-bold mb-1">Sub-headline / Tagline</label>
                              <input
                                type="text"
                                value={block.data?.tagline || ''}
                                onChange={(e) => handleUpdateBlock(block.id, { data: { ...block.data, tagline: e.target.value } })}
                                placeholder="Tagline atau penjelasan singkat acara"
                                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-slate-600 font-bold mb-1">Waktu Pelaksanaan</label>
                                <input
                                  type="text"
                                  value={block.data?.dateText || ''}
                                  onChange={(e) => handleUpdateBlock(block.id, { data: { ...block.data, dateText: e.target.value } })}
                                  placeholder="Contoh: 15-20 Nov 2026"
                                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-slate-600 font-bold mb-1">Lokasi / Format</label>
                                <input
                                  type="text"
                                  value={block.data?.locationText || ''}
                                  onChange={(e) => handleUpdateBlock(block.id, { data: { ...block.data, locationText: e.target.value } })}
                                  placeholder="Contoh: Jakarta / Online Zoom"
                                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs"
                                />
                              </div>
                            </div>
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className="block text-slate-600 font-bold text-xs">Poster / Banner Hero</label>
                                {block.data?.bannerUrl && (
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateBlock(block.id, { data: { ...block.data, bannerUrl: '' } })}
                                    className="text-[11px] text-red-600 hover:text-red-700 font-semibold cursor-pointer"
                                  >
                                    Hapus Gambar
                                  </button>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={block.data?.bannerUrl || ''}
                                  onChange={(e) => handleUpdateBlock(block.id, { data: { ...block.data, bannerUrl: e.target.value } })}
                                  placeholder="https://... (kosongkan jika tanpa gambar)"
                                  className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-mono"
                                />
                                <label className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0">
                                  <span className="material-symbols-outlined text-[16px] text-blue-600">upload_file</span>
                                  <span>Upload (Maks 5MB)</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="sr-only"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (!file) return;
                                      if (file.size > 5 * 1024 * 1024) {
                                        showToast('Ukuran gambar melebihi batas 5 MB.');
                                        return;
                                      }
                                      const reader = new FileReader();
                                      reader.onload = (ev) => {
                                        handleUpdateBlock(block.id, { data: { ...block.data, bannerUrl: ev.target?.result as string } });
                                        showToast('Gambar hero berhasil diunggah!');
                                      };
                                      reader.readAsDataURL(file);
                                    }}
                                  />
                                </label>
                              </div>
                              {block.data?.bannerUrl && (
                                <div className="mt-2 w-full h-24 rounded-lg overflow-hidden border border-slate-200 bg-slate-900">
                                  <img src={block.data.bannerUrl} alt="Preview" className="w-full h-full object-cover" />
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* CONFIGURABLE ACTION BUTTONS SECTION */}
                        <div className="pt-2 border-t border-slate-100 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">
                              Konfigurasi Tombol Aksi ({((block.data?.buttons || []) as HeroButton[]).length}/2)
                            </span>
                            <button
                              type="button"
                              onClick={() => handleAddButtonToBlock(block.id, block.data?.buttons || [])}
                              className="relative text-blue-600 font-bold text-xs hover:underline flex items-center gap-1 cursor-pointer pr-1"
                            >
                              <span className="material-symbols-outlined text-[15px]">add</span>
                              <span>Tambah Tombol</span>
                              {((block.data?.buttons || []) as HeroButton[]).length >= 2 && <ProDiamondBadge />}
                            </button>
                          </div>

                          <div className="space-y-2.5">
                            {((block.data?.buttons || []) as HeroButton[]).map((btn, bIdx) => (
                              <div key={btn.id || bIdx} className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                                <div className="flex items-center justify-between gap-3">
                                  {/* Slider Toggle Switch Without Text (Only Left/Right) */}
                                  <div className="flex items-center gap-2">
                                    <label className="relative inline-flex items-center cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={btn.enabled}
                                        onChange={(e) => {
                                          const nextBtns = [...(block.data?.buttons || [])];
                                          nextBtns[bIdx].enabled = e.target.checked;
                                          handleUpdateBlock(block.id, { data: { ...block.data, buttons: nextBtns } });
                                        }}
                                        className="sr-only peer"
                                      />
                                      <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
                                    </label>
                                    <span className="font-bold text-slate-800 text-xs">Tombol #{bIdx + 1}</span>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      const nextBtns = (block.data?.buttons || []).filter((_: any, i: number) => i !== bIdx);
                                      handleUpdateBlock(block.id, { data: { ...block.data, buttons: nextBtns } });
                                    }}
                                    className="text-slate-400 hover:text-red-600"
                                    title="Hapus tombol"
                                  >
                                    <span className="material-symbols-outlined text-[16px]">close</span>
                                  </button>
                                </div>

                                {btn.enabled && (
                                  <div className="space-y-2 pt-1 border-t border-slate-200/60">
                                    {/* Label Input */}
                                    <div>
                                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Nama Tombol</label>
                                      <input
                                        type="text"
                                        value={btn.label}
                                        onChange={(e) => {
                                          const nextBtns = [...(block.data?.buttons || [])];
                                          nextBtns[bIdx].label = e.target.value;
                                          handleUpdateBlock(block.id, { data: { ...block.data, buttons: nextBtns } });
                                        }}
                                        placeholder="Contoh: Daftar Sekarang"
                                        className="w-full bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs"
                                      />
                                    </div>

                                    {/* Target Dropdown */}
                                    <div>
                                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Tujuan Direct Tombol</label>
                                      <select
                                        value={btn.targetType === 'url' ? 'custom-url' : btn.targetBlockId || ''}
                                        onChange={(e) => {
                                          const nextBtns = [...(block.data?.buttons || [])];
                                          const val = e.target.value;
                                          if (val === 'custom-url') {
                                            nextBtns[bIdx].targetType = 'url';
                                            nextBtns[bIdx].targetBlockId = '';
                                          } else {
                                            nextBtns[bIdx].targetType = 'block';
                                            nextBtns[bIdx].targetBlockId = val;
                                          }
                                          handleUpdateBlock(block.id, { data: { ...block.data, buttons: nextBtns } });
                                        }}
                                        className="w-full bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs cursor-pointer"
                                      >
                                        <option value="">-- Pilih Tujuan Direct --</option>
                                        {currentBlocks
                                          .filter((b) => b.id !== block.id)
                                          .map((otherBlock) => (
                                            <option key={otherBlock.id} value={otherBlock.id}>
                                              Arahkan ke: {otherBlock.title} ({BLOCK_TYPES_META[otherBlock.type]?.label || otherBlock.type})
                                            </option>
                                          ))}
                                        <option value="custom-url">Tautan URL Eksternal (https://...)</option>
                                      </select>
                                    </div>

                                    {btn.targetType === 'url' && (
                                      <div>
                                        <input
                                          type="text"
                                          value={btn.url || ''}
                                          onChange={(e) => {
                                            const nextBtns = [...(block.data?.buttons || [])];
                                            nextBtns[bIdx].url = e.target.value;
                                            handleUpdateBlock(block.id, { data: { ...block.data, buttons: nextBtns } });
                                          }}
                                          placeholder="https://example.com/daftar"
                                          className="w-full bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-mono"
                                        />
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 2. FORM BLOCK WITH MULTI-STEP, 3 FIELD CHOICES & HIDE TOGGLE */}
                    {block.type === 'form' && (
                      <div className="space-y-4">
                        {/* Form Settings: Open Mode & Hide on main page - ONLY VISIBLE WHEN DIRECT BUTTON EXISTS */}
                        {isBlockTargetedByAnyButton(block.id) && (
                          <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/90 space-y-3 text-xs">
                            {/* Open Mode dropdown */}
                            <div>
                              <label className="block text-slate-800 font-bold mb-1">Mode Pembukaan Formulir</label>
                              <select
                                value={block.data?.openMode || 'same-page'}
                                onChange={(e) => handleUpdateBlock(block.id, { data: { ...block.data, openMode: e.target.value } })}
                                className="w-full bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium cursor-pointer"
                              >
                                <option value="same-page">Tampilkan di Halaman ini (Scroll ke formulir)</option>
                                <option value="new-page">Buka di Modal / Halaman Baru</option>
                              </select>
                            </div>

                            {/* Hide Form Toggle */}
                            <div className="pt-2 border-t border-blue-200/60 flex items-center justify-between">
                              <div>
                                <span className="block font-bold text-slate-800">Sembunyikan Form dari Halaman Utama</span>
                                <span className="text-[11px] text-slate-500">
                                  Form hanya terbuka ketika tombol direct diklik
                                </span>
                              </div>

                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={!!block.data?.hideFromMainPage}
                                  onChange={(e) => handleUpdateBlock(block.id, { data: { ...block.data, hideFromMainPage: e.target.checked } })}
                                  className="sr-only peer"
                                />
                                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
                              </label>
                            </div>
                          </div>
                        )}

                        {/* Steps (Alur Formulir) */}
                        <div className="space-y-4">
                          {((block.data?.steps || []) as FormStep[]).map((step, sIdx) => (
                            <div key={step.id || sIdx} className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">
                                    {sIdx + 1}
                                  </span>
                                  <input
                                    type="text"
                                    value={step.title}
                                    onChange={(e) => {
                                      const nextSteps = [...(block.data.steps || [])];
                                      nextSteps[sIdx].title = e.target.value;
                                      handleUpdateBlock(block.id, { data: { ...block.data, steps: nextSteps } });
                                    }}
                                    className="font-bold text-xs text-slate-900 border-b border-transparent hover:border-slate-300 focus:outline-none"
                                  />
                                </div>

                                {sIdx > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const nextSteps = (block.data.steps || []).filter((_: any, i: number) => i !== sIdx);
                                      handleUpdateBlock(block.id, { data: { ...block.data, steps: nextSteps } });
                                    }}
                                    className="text-slate-400 hover:text-red-600 text-xs font-bold"
                                  >
                                    Hapus Alur
                                  </button>
                                )}
                              </div>

                              {/* Fields within this step */}
                              <div className="space-y-2">
                                {(step.fields || []).map((field, fIdx) => (
                                  <div key={field.id || fIdx} className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
                                    <div className="flex items-center justify-between gap-2">
                                      <input
                                        type="text"
                                        value={field.label}
                                        onChange={(e) => {
                                          const nextSteps = [...(block.data.steps || [])];
                                          nextSteps[sIdx].fields[fIdx].label = e.target.value;
                                          handleUpdateBlock(block.id, { data: { ...block.data, steps: nextSteps } });
                                        }}
                                        className="w-full bg-white px-2.5 py-1 rounded-md border border-slate-200 font-semibold"
                                      />

                                      <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px] font-bold uppercase shrink-0">
                                        {field.type === 'text' ? 'Teks' : field.type === 'image' ? 'Gambar' : 'Pilihan'}
                                      </span>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          const nextSteps = [...(block.data.steps || [])];
                                          nextSteps[sIdx].fields = nextSteps[sIdx].fields.filter((_: any, i: number) => i !== fIdx);
                                          handleUpdateBlock(block.id, { data: { ...block.data, steps: nextSteps } });
                                        }}
                                        className="text-slate-400 hover:text-red-600 p-1"
                                      >
                                        <span className="material-symbols-outlined text-[15px]">close</span>
                                      </button>
                                    </div>

                                    {/* Choice options editor */}
                                    {field.type === 'choice' && (
                                      <div className="space-y-1 pt-1 border-t border-slate-200">
                                        <div className="text-[10px] font-bold text-slate-500">Daftar Pilihan (Pisahkan dengan koma):</div>
                                        <input
                                          type="text"
                                          value={(field.options || []).join(', ')}
                                          onChange={(e) => {
                                            const nextSteps = [...(block.data.steps || [])];
                                            nextSteps[sIdx].fields[fIdx].options = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                                            handleUpdateBlock(block.id, { data: { ...block.data, steps: nextSteps } });
                                          }}
                                          placeholder="Opsi 1, Opsi 2, Opsi 3"
                                          className="w-full bg-white px-2 py-1 rounded border border-slate-200 text-xs"
                                        />
                                      </div>
                                    )}

                                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                                      <input
                                        type="text"
                                        value={field.placeholder || ''}
                                        onChange={(e) => {
                                          const nextSteps = [...(block.data.steps || [])];
                                          nextSteps[sIdx].fields[fIdx].placeholder = e.target.value;
                                          handleUpdateBlock(block.id, { data: { ...block.data, steps: nextSteps } });
                                        }}
                                        placeholder="Placeholder..."
                                        className="bg-transparent text-[11px] flex-1 focus:outline-none"
                                      />

                                      <label className="flex items-center gap-1.5 cursor-pointer ml-3">
                                        <span>Wajib</span>
                                        <input
                                          type="checkbox"
                                          checked={field.required}
                                          onChange={(e) => {
                                            const nextSteps = [...(block.data.steps || [])];
                                            nextSteps[sIdx].fields[fIdx].required = e.target.checked;
                                            handleUpdateBlock(block.id, { data: { ...block.data, steps: nextSteps } });
                                          }}
                                          className="rounded text-blue-600"
                                        />
                                      </label>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* 3 Clear Options to Add Column/Field: Teks, Gambar, Pilihan */}
                              <div className="pt-2 border-t border-slate-100">
                                <div className="text-[10px] font-bold uppercase text-slate-400 mb-1.5">Tambah Kolom Form:</div>
                                <div className="grid grid-cols-3 gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleAddFieldToStep(block.id, sIdx, 'text')}
                                    className="py-1.5 px-2 rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 text-slate-700 text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                                  >
                                    <span className="material-symbols-outlined text-[15px] text-blue-600">notes</span>
                                    <span>Teks</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleAddFieldToStep(block.id, sIdx, 'image')}
                                    className="py-1.5 px-2 rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 text-slate-700 text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                                  >
                                    <span className="material-symbols-outlined text-[15px] text-blue-600">image</span>
                                    <span>Gambar</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleAddFieldToStep(block.id, sIdx, 'choice')}
                                    className="py-1.5 px-2 rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 text-slate-700 text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                                  >
                                    <span className="material-symbols-outlined text-[15px] text-blue-600">list</span>
                                    <span>Pilihan</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Button to Add Alur 2 (or subscription gate for Alur 3) */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => handleAddFormStep(block.id, block.data?.steps || [])}
                            className="w-full py-2.5 rounded-xl border border-dashed border-blue-400 text-blue-600 text-xs font-bold hover:bg-blue-50/50 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[16px]">add_circle</span>
                            <span>
                              {(block.data?.steps || []).length < 2
                                ? '+ Tambah Alur ke-2'
                                : `+ Tambah Alur ke-${((block.data?.steps || []) as FormStep[]).length + 1}`}
                            </span>
                          </button>
                          {((block.data?.steps || []) as FormStep[]).length >= 2 && <ProDiamondBadge />}
                        </div>

                        {/* Submit Button Text */}
                        <div className="pt-2 border-t border-slate-100">
                          <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Teks Tombol Submit</label>
                          <input
                            type="text"
                            value={block.data?.buttonText || 'Kirim Pendaftaran'}
                            onChange={(e) => handleUpdateBlock(block.id, { data: { ...block.data, buttonText: e.target.value } })}
                            placeholder="Contoh: Kirim Pendaftaran"
                            className="w-full bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold"
                          />
                        </div>
                      </div>
                    )}

                    {/* 3. TIMELINE BLOCK */}
                    {block.type === 'timeline' && (
                      <div className="space-y-3">
                        <div className="space-y-2.5">
                          {((block.data?.items as TimelineItem[]) || []).map((stage, sIdx) => (
                            <div key={stage.id || sIdx} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-bold text-slate-700 text-xs">Tahapan #{sIdx + 1}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nextStages = block.data.items.filter((_: any, i: number) => i !== sIdx);
                                    handleUpdateBlock(block.id, { data: { ...block.data, items: nextStages } });
                                  }}
                                  className="text-slate-400 hover:text-red-600 transition-colors"
                                  title="Hapus"
                                >
                                  <span className="material-symbols-outlined text-[16px]">close</span>
                                </button>
                              </div>

                              <div className="space-y-2">
                                <div>
                                  <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">Nama Tahapan</label>
                                  <input
                                    type="text"
                                    value={stage.name || ''}
                                    onChange={(e) => {
                                      const nextStages = [...block.data.items];
                                      nextStages[sIdx].name = e.target.value;
                                      handleUpdateBlock(block.id, { data: { ...block.data, items: nextStages } });
                                    }}
                                    placeholder="Contoh: Registrasi Peserta"
                                    className="w-full bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold"
                                  />
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">Tanggal Mulai</label>
                                    <input
                                      type="text"
                                      value={stage.startDate || ''}
                                      onChange={(e) => {
                                        const nextStages = [...block.data.items];
                                        nextStages[sIdx].startDate = e.target.value;
                                        handleUpdateBlock(block.id, { data: { ...block.data, items: nextStages } });
                                      }}
                                      placeholder="01 Nov"
                                      className="w-full bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-mono"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">Tanggal Selesai</label>
                                    <input
                                      type="text"
                                      value={stage.endDate || ''}
                                      onChange={(e) => {
                                        const nextStages = [...block.data.items];
                                        nextStages[sIdx].endDate = e.target.value;
                                        handleUpdateBlock(block.id, { data: { ...block.data, items: nextStages } });
                                      }}
                                      placeholder="15 Nov"
                                      className="w-full bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-mono"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">Keterangan / Deskripsi</label>
                                  <input
                                    type="text"
                                    value={stage.description || ''}
                                    onChange={(e) => {
                                      const nextStages = [...block.data.items];
                                      nextStages[sIdx].description = e.target.value;
                                      handleUpdateBlock(block.id, { data: { ...block.data, items: nextStages } });
                                    }}
                                    placeholder="Penjelasan tahapan kegiatan..."
                                    className="w-full bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600"
                                  />
                                </div>
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
                            handleUpdateBlock(block.id, { data: { ...block.data, items: [...(block.data.items || []), newStage] } });
                          }}
                          className="w-full py-2 rounded-xl border border-dashed border-blue-300 text-blue-600 text-xs font-bold hover:bg-blue-50/50 flex items-center justify-center gap-1 cursor-pointer transition-colors"
                        >
                          <span className="material-symbols-outlined text-[16px]">add</span>
                          <span>Tambah Tahapan Timeline</span>
                        </button>
                      </div>
                    )}

                    {/* 4. TEXT BLOCK */}
                    {block.type === 'text' && (
                      <div className="space-y-2">
                        <textarea
                          value={block.data?.content || ''}
                          onChange={(e) => handleUpdateBlock(block.id, { data: { ...block.data, content: e.target.value } })}
                          rows={4}
                          placeholder="Ketik teks penjelasan atau aturan..."
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 resize-none leading-relaxed"
                        />
                      </div>
                    )}

                    {/* 5. PRIZES BLOCK */}
                    {block.type === 'prizes' && (
                      <div className="space-y-3">
                        <div className="space-y-2.5">
                          {((block.data?.items as CategoryItem[]) || []).map((pz, pzIdx) => (
                            <div key={pz.id || pzIdx} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-bold text-slate-700 text-xs">Kategori Hadiah #{pzIdx + 1}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nextPz = block.data.items.filter((_: any, i: number) => i !== pzIdx);
                                    handleUpdateBlock(block.id, { data: { ...block.data, items: nextPz } });
                                  }}
                                  className="text-slate-400 hover:text-red-600 transition-colors"
                                  title="Hapus"
                                >
                                  <span className="material-symbols-outlined text-[16px]">close</span>
                                </button>
                              </div>

                              <div className="space-y-2">
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">Nama Juara / Kategori</label>
                                    <input
                                      type="text"
                                      value={pz.title || ''}
                                      onChange={(e) => {
                                        const nextPz = [...block.data.items];
                                        nextPz[pzIdx].title = e.target.value;
                                        handleUpdateBlock(block.id, { data: { ...block.data, items: nextPz } });
                                      }}
                                      placeholder="Contoh: Juara 1"
                                      className="w-full bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">Nominal Hadiah</label>
                                    <input
                                      type="text"
                                      value={pz.prizePool || ''}
                                      onChange={(e) => {
                                        const nextPz = [...block.data.items];
                                        nextPz[pzIdx].prizePool = e.target.value;
                                        handleUpdateBlock(block.id, { data: { ...block.data, items: nextPz } });
                                      }}
                                      placeholder="Rp 10.000.000"
                                      className="w-full bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-mono text-blue-600 font-bold"
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">Label Badge</label>
                                    <input
                                      type="text"
                                      value={pz.badge || ''}
                                      onChange={(e) => {
                                        const nextPz = [...block.data.items];
                                        nextPz[pzIdx].badge = e.target.value;
                                        handleUpdateBlock(block.id, { data: { ...block.data, items: nextPz } });
                                      }}
                                      placeholder="Contoh: Juara Utama"
                                      className="w-full bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">Keterangan / Fasilitas</label>
                                    <input
                                      type="text"
                                      value={pz.description || ''}
                                      onChange={(e) => {
                                        const nextPz = [...block.data.items];
                                        nextPz[pzIdx].description = e.target.value;
                                        handleUpdateBlock(block.id, { data: { ...block.data, items: nextPz } });
                                      }}
                                      placeholder="Piala + Piagam + Mentoring"
                                      className="w-full bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600"
                                    />
                                  </div>
                                </div>
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
                              targetAudience: '',
                              description: 'Uang tunai + Sertifikat',
                              prizePool: 'Rp 5.000.000',
                              badge: `Peringkat ${(block.data.items || []).length + 1}`
                            };
                            handleUpdateBlock(block.id, { data: { ...block.data, items: [...(block.data.items || []), newPz] } });
                          }}
                          className="w-full py-2 rounded-xl border border-dashed border-blue-300 text-blue-600 text-xs font-bold hover:bg-blue-50/50 flex items-center justify-center gap-1 cursor-pointer transition-colors"
                        >
                          <span className="material-symbols-outlined text-[16px]">add</span>
                          <span>Tambah Kategori Hadiah</span>
                        </button>
                      </div>
                    )}

                    {/* 6. SPEAKERS BLOCK */}
                    {block.type === 'speakers' && (
                      <div className="space-y-3">
                        <div className="space-y-2.5">
                          {((block.data?.items as SpeakerItem[]) || []).map((spk, spkIdx) => (
                            <div key={spk.id || spkIdx} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-bold text-slate-700 text-xs">Pembicara #{spkIdx + 1}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nextSpk = block.data.items.filter((_: any, i: number) => i !== spkIdx);
                                    handleUpdateBlock(block.id, { data: { ...block.data, items: nextSpk } });
                                  }}
                                  className="text-slate-400 hover:text-red-600 transition-colors"
                                  title="Hapus Pembicara"
                                >
                                  <span className="material-symbols-outlined text-[16px]">close</span>
                                </button>
                              </div>

                              <div className="space-y-2">
                                <div>
                                  <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">Nama Lengkap</label>
                                  <input
                                    type="text"
                                    value={spk.name || ''}
                                    onChange={(e) => {
                                      const nextSpk = [...block.data.items];
                                      nextSpk[spkIdx].name = e.target.value;
                                      handleUpdateBlock(block.id, { data: { ...block.data, items: nextSpk } });
                                    }}
                                    placeholder="Contoh: Dr. Budi Pratama, M.Kom"
                                    className="w-full bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold"
                                  />
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">Peran / Jabatan (Role)</label>
                                    <input
                                      type="text"
                                      value={spk.role || ''}
                                      onChange={(e) => {
                                        const nextSpk = [...block.data.items];
                                        nextSpk[spkIdx].role = e.target.value;
                                        handleUpdateBlock(block.id, { data: { ...block.data, items: nextSpk } });
                                      }}
                                      placeholder="Contoh: Keynote Speaker"
                                      className="w-full bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-blue-600 font-semibold"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">Instansi / Perusahaan</label>
                                    <input
                                      type="text"
                                      value={spk.companyOrCampus || ''}
                                      onChange={(e) => {
                                        const nextSpk = [...block.data.items];
                                        nextSpk[spkIdx].companyOrCampus = e.target.value;
                                        handleUpdateBlock(block.id, { data: { ...block.data, items: nextSpk } });
                                      }}
                                      placeholder="Contoh: Google / Universitas Indonesia"
                                      className="w-full bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">URL Foto</label>
                                  <input
                                    type="text"
                                    value={spk.avatarUrl || ''}
                                    onChange={(e) => {
                                      const nextSpk = [...block.data.items];
                                      nextSpk[spkIdx].avatarUrl = e.target.value;
                                      handleUpdateBlock(block.id, { data: { ...block.data, items: nextSpk } });
                                    }}
                                    placeholder="https://images.unsplash.com/..."
                                    className="w-full bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-mono text-slate-600"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const newSpk: SpeakerItem = {
                              id: `spk-${Date.now()}`,
                              name: 'Nama Pembicara',
                              role: 'Speaker',
                              companyOrCampus: 'Instansi / Organisasi',
                              avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'
                            };
                            handleUpdateBlock(block.id, { data: { ...block.data, items: [...(block.data.items || []), newSpk] } });
                          }}
                          className="w-full py-2 rounded-xl border border-dashed border-blue-300 text-blue-600 text-xs font-bold hover:bg-blue-50/50 flex items-center justify-center gap-1 cursor-pointer transition-colors"
                        >
                          <span className="material-symbols-outlined text-[16px]">add</span>
                          <span>Tambah Pembicara</span>
                        </button>
                      </div>
                    )}

                    {/* 7. FAQ BLOCK */}
                    {block.type === 'faq' && (
                      <div className="space-y-3">
                        <div className="space-y-2">
                          {((block.data?.items as FaqItem[]) || []).map((faq, fIdx) => (
                            <div key={faq.id || fIdx} className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1 text-xs">
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
                                className="w-full bg-white px-2 py-1 rounded border border-slate-200 text-xs resize-none"
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
                              answer: 'Jawaban...'
                            };
                            handleUpdateBlock(block.id, { data: { ...block.data, items: [...(block.data.items || []), newFaq] } });
                          }}
                          className="w-full py-2 rounded-xl border border-dashed border-blue-300 text-blue-600 text-xs font-bold hover:bg-blue-50/50 flex items-center justify-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[16px]">add</span>
                          <span>Tambah FAQ</span>
                        </button>
                      </div>
                    )}

                    {/* 8. CONTACT BLOCK */}
                    {block.type === 'contact' && (
                      <div className="space-y-2.5 text-xs">
                        <div>
                          <label className="block text-slate-600 font-bold mb-1">Nama Panitia / Penyelenggara</label>
                          <input
                            type="text"
                            value={block.data?.committeeName || ''}
                            onChange={(e) => handleUpdateBlock(block.id, { data: { ...block.data, committeeName: e.target.value } })}
                            placeholder="Panitia Pelaksana Acara"
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-slate-600 font-bold mb-1">WhatsApp Narahubung</label>
                            <input
                              type="text"
                              value={block.data?.whatsappNumber || ''}
                              onChange={(e) => handleUpdateBlock(block.id, { data: { ...block.data, whatsappNumber: e.target.value } })}
                              placeholder="6281234567890"
                              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-600 font-bold mb-1">Email Narahubung</label>
                            <input
                              type="text"
                              value={block.data?.email || ''}
                              onChange={(e) => handleUpdateBlock(block.id, { data: { ...block.data, email: e.target.value } })}
                              placeholder="panitia@event.site"
                              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-mono"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 9. GALLERY & IMAGE UPLOAD BLOCK */}
                    {block.type === 'gallery' && (
                      <div className="space-y-3 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">
                            Daftar Foto ({((block.data?.images || []) as any[]).length}/2 Free)
                          </span>
                          <button
                            type="button"
                            onClick={() => handleAddGalleryImage(block.id, block.data?.images || [])}
                            className="relative text-blue-600 font-bold text-xs hover:underline flex items-center gap-1 cursor-pointer pr-1"
                          >
                            <span className="material-symbols-outlined text-[15px]">add_photo_alternate</span>
                            <span>Tambah Foto</span>
                            {((block.data?.images || []) as any[]).length >= 2 && <ProDiamondBadge />}
                          </button>
                        </div>

                        {(((block.data?.images || []) as any[])).map((img, iIdx) => (
                          <div key={img.id || iIdx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-700">Foto #{iIdx + 1}</span>
                              <div className="flex items-center gap-2">
                                <select
                                  value={img.size || 'normal'}
                                  onChange={(e) => {
                                    const nextImages = [...(block.data?.images || [])];
                                    nextImages[iIdx] = { ...nextImages[iIdx], size: e.target.value };
                                    handleUpdateBlock(block.id, { data: { ...block.data, images: nextImages } });
                                  }}
                                  className="px-2 py-1 bg-white border border-slate-200 rounded text-[11px] font-medium"
                                >
                                  <option value="normal">Kecil (Standar)</option>
                                  <option value="featured">Besar (Unggulan)</option>
                                </select>

                                <button
                                  type="button"
                                  onClick={() => {
                                    const nextImages = (block.data?.images || []).filter((_: any, idx2: number) => idx2 !== iIdx);
                                    handleUpdateBlock(block.id, { data: { ...block.data, images: nextImages } });
                                  }}
                                  className="w-6 h-6 rounded hover:bg-slate-200 flex items-center justify-center text-red-500"
                                >
                                  <span className="material-symbols-outlined text-[15px]">delete</span>
                                </button>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={img.url || ''}
                                onChange={(e) => {
                                  const nextImages = [...(block.data?.images || [])];
                                  nextImages[iIdx] = { ...nextImages[iIdx], url: e.target.value };
                                  handleUpdateBlock(block.id, { data: { ...block.data, images: nextImages } });
                                }}
                                placeholder="URL gambar https://..."
                                className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                              />
                              <label className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-700 text-[11px] font-bold flex items-center gap-1 cursor-pointer shrink-0">
                                <span className="material-symbols-outlined text-[15px] text-blue-600">upload</span>
                                <span>Upload (Maks 5MB)</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="sr-only"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    if (file.size > 5 * 1024 * 1024) {
                                      showToast('Ukuran gambar melebihi 5 MB.');
                                      return;
                                    }
                                    const reader = new FileReader();
                                    reader.onload = (ev) => {
                                      const nextImages = [...(block.data?.images || [])];
                                      nextImages[iIdx] = { ...nextImages[iIdx], url: ev.target?.result as string };
                                      handleUpdateBlock(block.id, { data: { ...block.data, images: nextImages } });
                                      showToast('Foto berhasil diunggah!');
                                    };
                                    reader.readAsDataURL(file);
                                  }}
                                />
                              </label>
                            </div>

                            <input
                              type="text"
                              value={img.caption || ''}
                              onChange={(e) => {
                                const nextImages = [...(block.data?.images || [])];
                                nextImages[iIdx] = { ...nextImages[iIdx], caption: e.target.value };
                                handleUpdateBlock(block.id, { data: { ...block.data, images: nextImages } });
                              }}
                              placeholder="Keterangan / Caption foto (opsional)"
                              className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs"
                            />

                            {img.url && (
                              <div className="w-full h-20 rounded-lg overflow-hidden border border-slate-200 bg-slate-900">
                                <img src={img.url} alt="preview" className="w-full h-full object-cover" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* BOTTOM ACTION TOOLBAR WITH CLEAN SLIDER TOGGLE (NO TEXT) */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-slate-400">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveBlockUp(idx);
                        }}
                        disabled={idx === 0}
                        className="w-7 h-7 rounded hover:bg-slate-100 flex items-center justify-center transition-colors disabled:opacity-30 cursor-pointer"
                        title="Geser Naik"
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
                        className="w-7 h-7 rounded hover:bg-slate-100 flex items-center justify-center transition-colors disabled:opacity-30 cursor-pointer"
                        title="Geser Turun"
                      >
                        <span className="material-symbols-outlined text-[18px]">arrow_downward</span>
                      </button>

                      <span className="text-[10px] font-mono text-slate-400 ml-1">
                        #{idx + 1}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicateBlock(block);
                        }}
                        className="w-7 h-7 rounded hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 cursor-pointer"
                        title="Duplikat"
                      >
                        <span className="material-symbols-outlined text-[18px]">content_copy</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteBlock(block.id);
                        }}
                        className="w-7 h-7 rounded hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-red-600 cursor-pointer"
                        title="Hapus"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>

                      <span className="h-4 w-px bg-slate-200" />

                      {/* Clean Slider Switch (Left/Right Only, No Text) */}
                      <label
                        onClick={(e) => e.stopPropagation()}
                        className="relative inline-flex items-center cursor-pointer"
                        title="Aktifkan / Sembunyikan Komponen"
                      >
                        <input
                          type="checkbox"
                          checked={block.enabled}
                          onChange={(e) => handleUpdateBlock(block.id, { enabled: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* TOMBOL TAMBAH FITUR (BERADA DI BAWAH FITUR PALING TERAKHIR) */}
          <div className="pt-2 pb-12">
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
                className="w-full py-3.5 px-4 rounded-2xl border-2 border-dashed border-blue-400/80 hover:border-blue-600 bg-white hover:bg-blue-50/50 text-blue-700 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs hover:shadow-sm active:scale-[0.99]"
              >
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                <span>Tambah Fitur Baru</span>
              </button>

              {isAddMenuOpen && (
                <div className="mt-2 w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-30 space-y-1 animate-fadeIn">
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    PILIH FITUR / KOMPONEN
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                    {Object.entries(BLOCK_TYPES_META).map(([key, item]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleAddBlock(key as EventBlockType)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-blue-50 text-slate-800 transition-colors cursor-pointer group"
                      >
                        <span className="material-symbols-outlined text-[18px] text-blue-600 group-hover:scale-110 transition-transform">
                          {item.icon}
                        </span>
                        <span className="text-xs font-bold text-slate-900 group-hover:text-blue-700">
                          {item.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── RIGHT: LIVE DEVICE PREVIEW (SCROLL 2 - SEPARATE INDEPENDENT SCROLL) ─ */}
        <div className="flex-1 bg-slate-200/80 h-full overflow-y-auto p-4 sm:p-6 flex items-start justify-center">
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

            {/* LIVE EVENT RENDERER */}
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

      {/* ─── PUBLISH MODAL WITH ROCKET LAUNCH ANIMATION ──────────────────────── */}
      {isPublishModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden relative">
            {/* STAGE 1: INPUT NAMA WEBSITE & SUBDOMAIN */}
            {publishModalStep === 'input' && (
              <div className="p-6 sm:p-7 space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[20px]">rocket_launch</span>
                    </div>
                    <div>
                      <h3 className="font-display font-extrabold text-base text-slate-900">
                        Publikasikan Website Event
                      </h3>
                      <p className="text-xs text-slate-500">
                        Luncurkan website ke internet dan dapatkan tautan publik instan.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPublishModalOpen(false)}
                    className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Nama Website / Acara
                    </label>
                    <input
                      type="text"
                      value={publishEventName}
                      onChange={(e) => setPublishEventName(e.target.value)}
                      placeholder="Contoh: Hackathon Nusantara 2026"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:border-blue-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Alamat Domain Publik (Subdomain)
                    </label>
                    <div className="flex items-center px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50">
                      <span className="text-slate-400 font-mono text-xs">https://</span>
                      <input
                        type="text"
                        value={publishSlug}
                        onChange={(e) => setPublishSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                        placeholder="nama-event"
                        className="flex-1 bg-transparent px-1 font-mono font-bold text-blue-600 text-xs focus:outline-none"
                      />
                      <span className="text-slate-400 font-mono text-xs">.iventra.site</span>
                    </div>
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      Tautan dapat diakses oleh peserta di seluruh dunia secara instan.
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200/70 space-y-2">
                    <span className="font-bold text-blue-900 block text-xs">Kesiapan Publikasi:</span>
                    <div className="space-y-1 text-slate-600 text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[15px] text-emerald-600">check_circle</span>
                        <span>Hosting CDN Global &amp; Sertifikat SSL Aktif Otomatis</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[15px] text-emerald-600">check_circle</span>
                        <span>Formulir dan alur pendaftaran siap menerima peserta</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[15px] text-emerald-600">check_circle</span>
                        <span>Dapat diedit dan di-update kembali kapan saja</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsPublishModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-600 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={executePublishWithRocket}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <span className="material-symbols-outlined text-[17px]">rocket_launch</span>
                    <span>Luncurkan Website Sekarang 🚀</span>
                  </button>
                </div>
              </div>
            )}

            {/* STAGE 2: ANIMASI ROKET MELUNCUR */}
            {publishModalStep === 'launching' && (
              <div className="p-10 text-center space-y-6 bg-gradient-to-b from-[#0a0f24] via-[#10193d] to-[#070b18] text-white">
                <div className="py-8 flex flex-col items-center justify-center relative">
                  {/* Space particles */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-40 pointer-events-none">
                    <div className="w-48 h-48 rounded-full border border-blue-400/20 animate-ping" />
                  </div>

                  {/* Rocket Launch Animation Container */}
                  <div className="relative flex flex-col items-center">
                    <div className="w-20 h-20 rounded-full bg-blue-500/20 border-2 border-blue-400/40 flex items-center justify-center mb-4 shadow-[0_0_50px_rgba(59,130,246,0.5)] animate-bounce">
                      <span className="text-5xl transform -rotate-45 block">🚀</span>
                    </div>

                    {/* Rocket Flame / Exhaust Glow */}
                    <div className="w-4 h-12 bg-gradient-to-b from-orange-400 via-amber-300 to-transparent blur-[2px] rounded-full animate-pulse -mt-4 mb-3" />
                  </div>

                  <h3 className="text-xl font-display font-extrabold text-white mt-2">
                    Meluncurkan Website Event...
                  </h3>
                  <p className="text-xs text-blue-200/80 max-w-sm mt-1 animate-pulse">
                    Mengompilasi aset, menghubungkan domain {publishSlug}.iventra.site, dan menyalakan SSL...
                  </p>

                  <div className="w-56 h-1.5 bg-white/10 rounded-full overflow-hidden mt-6">
                    <div className="h-full bg-gradient-to-r from-blue-400 to-emerald-400 w-full animate-[shimmer_1.5s_infinite]" />
                  </div>
                </div>
              </div>
            )}

            {/* STAGE 3: SUKSES PUBLIKASI */}
            {publishModalStep === 'success' && (
              <div className="p-8 text-center space-y-5 bg-white">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-3xl shadow-md border-4 border-emerald-50">
                  🎉
                </div>

                <div>
                  <h3 className="font-display font-black text-xl text-slate-900">
                    Website Telah Berhasil Dipublikasikan!
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                    Website event Anda sekarang aktif secara publik dan siap menerima pengunjung serta pendaftar.
                  </p>
                </div>

                {/* Published Link Box */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left space-y-2">
                  <span className="text-[11px] font-semibold text-slate-500 block">Tautan Langsung Website:</span>
                  <div className="flex items-center justify-between gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200">
                    <a
                      href={`https://${publishSlug}.iventra.site`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-xs font-bold text-blue-600 truncate hover:underline"
                    >
                      https://{publishSlug}.iventra.site
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(`https://${publishSlug}.iventra.site`);
                        showToast('Tautan berhasil disalin ke clipboard!');
                      }}
                      className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition-colors cursor-pointer shrink-0"
                    >
                      Salin Link
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-center gap-3">
                  <a
                    href={`https://${publishSlug}.iventra.site`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-colors"
                  >
                    <span>Kunjungi Website ↗</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => setIsPublishModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                  >
                    Selesai
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── SPARK SUBSCRIPTION MODAL (SUBSCRIPTION GATE FOR 3+ BUTTONS, ALUR, ATAU PENJADWALAN FASE) */}
      <SparkSubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
        onConsultationRequest={() => {
          setIsUserSubscribed(true);
          showToast('Status langganan Spark Pro diaktifkan');
        }}
      />

      {/* ─── EXIT CONFIRMATION MODAL (POPUP ALERT SIMPAN PERUBAHAN SAAT KELUAR) ─── */}
      {isExitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col p-6 space-y-4 animate-scaleUp">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
                <span className="material-symbols-outlined text-[22px]">warning</span>
              </div>
              <div className="space-y-1">
                <h3 className="font-display font-bold text-base text-slate-900">
                  Simpan Perubahan Anda?
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Ada perubahan yang belum disimpan pada website ini. Apakah Anda ingin menyimpannya terlebih dahulu sebelum kembali ke dashboard?
                </p>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setIsExitModalOpen(false)}
                className="w-full sm:w-auto px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 font-bold text-slate-600 cursor-pointer transition-colors"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsExitModalOpen(false);
                  onBackToDashboard();
                }}
                className="w-full sm:w-auto px-4 py-2 rounded-xl hover:bg-red-50 font-bold text-red-600 cursor-pointer transition-colors"
              >
                Keluar Tanpa Menyimpan
              </button>

              <button
                type="button"
                onClick={async () => {
                  await handleSaveDraft(false);
                  setIsExitModalOpen(false);
                  onBackToDashboard();
                }}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs cursor-pointer transition-colors"
              >
                Simpan &amp; Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
