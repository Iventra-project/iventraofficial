import { useState, useMemo } from 'react';
import type {
  EventConfig,
  EventBlock,
  FormFieldItem,
  TimelineItem,
  SpeakerItem,
  CategoryItem,
  FaqItem,
  HeroButton,
  FormStep,
  GalleryImageItem
} from '../../types/builder.ts';
import { ensureConfigBlocks } from '../../types/builder.ts';

interface SparkEventRendererProps {
  config: EventConfig;
  isPreviewMode?: boolean;
  slug?: string;
}

export default function SparkEventRenderer({ config, isPreviewMode, slug }: SparkEventRendererProps) {
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [activeFormStep, setActiveFormStep] = useState<number>(0);
  const [modalFormBlock, setModalFormBlock] = useState<EventBlock | null>(null);

  const themePrimary = config.theme?.primaryColor || '#1f2de6';
  const themeAccent = config.theme?.accentColor || '#3b47dc';
  const bgStyle = config.theme?.bgStyle || 'clean-white';

  const isCustomDark = useMemo(() => {
    if (bgStyle !== 'custom' || !config.theme?.bgColor) return false;
    const hex = config.theme.bgColor.replace('#', '');
    if (hex.length === 6) {
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return (0.299 * r + 0.587 * g + 0.114 * b) < 140;
    }
    return false;
  }, [bgStyle, config.theme?.bgColor]);

  const isDarkMode = bgStyle === 'dark-modern' || isCustomDark;

  const rootBgStyle = useMemo<React.CSSProperties>(() => {
    if (bgStyle === 'subtle-gradient') {
      return {
        background: `radial-gradient(ellipse at 50% -10%, ${themePrimary}20 0%, transparent 60%), linear-gradient(160deg, ${themePrimary}18 0%, #ffffff 40%, ${themeAccent}20 100%)`
      };
    }
    if (bgStyle === 'custom') {
      return {
        backgroundColor: config.theme?.bgColor || '#f0f4f8'
      };
    }
    if (bgStyle === 'dark-modern') {
      return {
        backgroundColor: '#090b11'
      };
    }
    return {
      backgroundColor: '#ffffff'
    };
  }, [bgStyle, config.theme?.bgColor, themePrimary, themeAccent]);

  const activePhase = useMemo(() => {
    if (!config.phases || config.phases.length === 0) return null;
    return config.phases.find((p) => p.id === config.activePhaseId) || config.phases[0];
  }, [config.phases, config.activePhaseId]);

  const blocks = useMemo(() => {
    if (config.enablePhases && activePhase && Array.isArray(activePhase.blocks)) {
      return activePhase.blocks;
    }
    return ensureConfigBlocks(config);
  }, [config, activePhase]);
  const activeBlocks = useMemo(() => blocks.filter((b) => b.enabled), [blocks]);

  const bgContainerClass = useMemo(() => {
    if (isDarkMode) return 'text-white';
    return 'text-[#191930]';
  }, [isDarkMode]);

  const toggleFaq = (id: string) => {
    setOpenFaqId(openFaqId === id ? null : id);
  };

  const handleInputChange = (fieldId: string, val: string) => {
    setFormData((prev) => ({ ...prev, [fieldId]: val }));
  };

  const handleFormSubmit = async (e: React.FormEvent, formBlockId?: string) => {
    e.preventDefault();
    if (slug) {
      try {
        const targetBlock = blocks.find((b) => b.id === formBlockId) || modalFormBlock;
        const targetSteps = targetBlock?.data?.steps || [];
        const targetFields: FormFieldItem[] = targetSteps.flatMap((s: any) => s.fields || []);

        const enrichedData: Record<string, any> = {
          ...formData,
          _formId: formBlockId || targetBlock?.id
        };

        targetFields.forEach((field) => {
          if (field.label && formData[field.id] !== undefined) {
            enrichedData[field.label] = formData[field.id];
          }
        });

        let proofUrl = formData['proof'] || formData['bukti_pembayaran'] || formData['paymentProof'] || null;
        let payEmail = formData['email'] || formData['email_konfirmasi'] || formData['paymentEmail'] || null;

        Object.entries(formData).forEach(([k, v]) => {
          if (k.startsWith('payment_proof_') && v) proofUrl = v;
          if (k.startsWith('payment_email_') && v) payEmail = v;
        });

        await fetch(`/api/public/events/${encodeURIComponent(slug)}/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            formId: formBlockId || targetBlock?.id,
            formData: enrichedData,
            paymentProofUrl: proofUrl,
            paymentEmail: payEmail
          })
        });
      } catch (err) {
        console.error('Failed to submit form to server:', err);
      }
    }
    setFormSubmitted(true);
  };

  // Handle action button click (direct to block or modal)
  const handleButtonClick = (btn: HeroButton) => {
    if (btn.targetType === 'url') {
      if (btn.url) {
        window.open(btn.url, '_blank');
      }
      return;
    }

    if (btn.targetType === 'block' && btn.targetBlockId) {
      const targetBlock = blocks.find((b) => b.id === btn.targetBlockId);
      if (targetBlock && targetBlock.type === 'form') {
        if (slug && !isPreviewMode) {
          fetch(`/api/public/events/${encodeURIComponent(slug)}/track-start`, { method: 'POST' }).catch(() => {});
        }
        const isModal = targetBlock.data?.openMode === 'new-page' || targetBlock.data?.hideFromMainPage;
        if (isModal) {
          setModalFormBlock(targetBlock);
          return;
        }
      }

      // Smooth scroll to element
      const el = document.getElementById(btn.targetBlockId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <div
      className={`w-full min-h-screen ${bgContainerClass} font-sans selection:bg-blue-600 selection:text-white transition-colors duration-200 relative overflow-x-hidden`}
      style={rootBgStyle}
    >
      {/* Top Header / Brand Bar */}
      <header className={`sticky top-0 z-30 backdrop-blur-md border-b ${isDarkMode ? 'bg-[#0f111a]/85 border-white/10' : 'bg-white/85 border-slate-200/70'} transition-colors`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {config.logoUrl ? (
              <img
                src={config.logoUrl}
                alt={config.institutionName || config.eventName || 'Logo'}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl object-cover border border-black/5 shadow-xs shrink-0"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ): config.eventName ? (
            <div
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-white font-extrabold text-sm shadow-xs shrink-0"
              style={{ background: `linear-gradient(135deg, ${themePrimary}, ${themeAccent})` }}
            >
              {config.eventName.charAt(0)}
            </div>
            ) : null}
            <div className="min-w-0">
              {config.institutionName && (
                <span className="block text-[11px] font-semibold text-slate-500 truncate">
                  {config.institutionName}
                </span>
              )}
              {config.eventName && (
                <span className={`block font-extrabold text-sm sm:text-base truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  {config.eventName}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* SEQUENTIAL BLOCK RENDERING IN USER-DEFINED ORDER */}
      <main className="w-full">
        {activeBlocks.length === 0 ? (
          <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center text-slate-400 text-xs">
            <span className="material-symbols-outlined text-[36px] text-slate-300 mb-2">dashboard_customize</span>
            <span className={`font-semibold ${isDarkMode ? 'text-white/60' : 'text-slate-500'}`}>Halaman Masih Kosong</span>
            <span className="text-[11px] text-slate-400 mt-0.5">Tambahkan fitur baru dari panel sebelah kiri</span>
          </div>
        ) : (
          activeBlocks.map((block) => {
            switch (block.type) {
              // ─── 1. HERO BLOCK ─────────────────────────────────────────────
              case 'hero': {
                const data = block.data || { };
            const headline = activePhase?.headlineOverride || data.headline || block.title || config.eventName;
            const tagline = activePhase?.taglineOverride || data.tagline || block.subtitle || config.tagline;
            const dateText = data.dateText || config.eventDateText;
            const locationText = data.locationText || config.eventLocationText;
            const bannerUrl = (data.bannerUrl !== undefined ? data.bannerUrl : config.bannerUrl)?.trim();
            const badgeText = activePhase?.statusBadge || data.badgeText;
                const buttons: HeroButton[] = (data.buttons || []).filter((b: HeroButton) => b.enabled);

            return (
            <section id={block.id} key={block.id} className="relative pt-12 pb-16 sm:pt-20 sm:pb-24 px-4 sm:px-6 overflow-hidden">
              {/* Dynamic ambient background glow reflecting theme */}
              <div className="absolute inset-0 pointer-events-none -z-0 overflow-hidden">
                <div
                  className="absolute -top-32 left-1/2 -translate-x-1/2 w-[720px] h-[360px] rounded-full blur-3xl opacity-25"
                  style={{ background: `radial-gradient(circle, ${themePrimary} 0%, ${themeAccent} 100%)` }}
                />
              </div>

              <div className="max-w-5xl mx-auto text-center flex flex-col items-center relative z-10">
                {badgeText && (
                  <div
                    className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-extrabold tracking-wide mb-6 shadow-xs border ${isDarkMode ? 'bg-white/10 border-white/20 text-white' : 'bg-blue-50 border-blue-200 text-blue-700'
                      }`}
                  >
                    <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: themePrimary }} />
                    <span>{badgeText}</span>
                  </div>
                )}

                <h1
                  className={`text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight max-w-4xl ${isDarkMode ? 'text-white' : 'text-slate-900'
                    }`}
                >
                  {headline || 'Nama Acara Event'}
                </h1>

                {tagline && (
                  <p className="mt-4 text-base sm:text-xl font-bold max-w-2xl text-balance" style={{ color: themePrimary }}>
                    {tagline}
                  </p>
                )}

                {config.description && (
                  <p className={`mt-4 text-sm sm:text-base max-w-2xl leading-relaxed ${isDarkMode ? 'text-white/70' : 'text-slate-600'}`}>
                    {config.description}
                  </p>
                )}

                {(dateText || locationText) && (
                  <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                    {dateText && (
                      <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl border text-xs sm:text-sm font-bold shadow-xs ${isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800'
                        }`}>
                        <span className="material-symbols-outlined text-[18px]" style={{ color: themePrimary }}>
                          calendar_month
                        </span>
                        <span>{dateText}</span>
                      </div>
                    )}

                    {locationText && (
                      <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl border text-xs sm:text-sm font-bold shadow-xs ${isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800'
                        }`}>
                        <span className="material-symbols-outlined text-[18px]" style={{ color: themePrimary }}>
                          location_on
                        </span>
                        <span>{locationText}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Configurable Action Buttons (Side-by-side) */}
                {buttons.length > 0 && (
                  <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                    {buttons.map((btn, bIdx) => (
                      <button
                        key={btn.id || bIdx}
                        type="button"
                        onClick={() => handleButtonClick(btn)}
                        className={`px-7 py-3 rounded-full text-xs sm:text-sm font-bold shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer ${bIdx === 0
                            ? 'text-white'
                            : isDarkMode
                              ? 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
                              : 'bg-white text-slate-800 border border-slate-200 hover:bg-slate-50'
                          }`}
                        style={bIdx === 0 ? { background: `linear-gradient(135deg, ${themePrimary}, ${themeAccent})` } : {}}
                      >
                        <span>{btn.label || 'Tombol Tindakan'}</span>
                      </button>
                    ))}
                  </div>
                )}

                {bannerUrl && (
                  <div className="mt-12 w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl border border-slate-200 max-h-[440px] bg-slate-900">
                    <img
                      src={bannerUrl}
                      alt={headline}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
            </section>
            );
              }

            // ─── STANDALONE BUTTONS BLOCK ──────────────────────────────────
            case 'buttons': {
                const buttons: HeroButton[] = (block.data?.buttons || []).filter((b: HeroButton) => b.enabled);
            if (buttons.length === 0) return null;

            return (
            <section id={block.id} key={block.id} className="py-8 px-4 text-center">
              <div className="flex flex-wrap items-center justify-center gap-3">
                {buttons.map((btn, bIdx) => (
                  <button
                    key={btn.id || bIdx}
                    type="button"
                    onClick={() => handleButtonClick(btn)}
                    className={`px-6 py-2.5 rounded-full text-xs sm:text-sm font-bold shadow-sm transition-transform active:scale-95 cursor-pointer ${bIdx === 0
                        ? 'text-white'
                        : isDarkMode
                          ? 'bg-white/10 text-white border border-white/20'
                          : 'bg-white text-slate-800 border border-slate-200'
                      }`}
                    style={bIdx === 0 ? { background: `linear-gradient(135deg, ${themePrimary}, ${themeAccent})` } : {}}
                  >
                    <span>{btn.label || 'Aksi'}</span>
                  </button>
                ))}
              </div>
            </section>
            );
              }

            // ─── 2. TEXT / DESKRIPSI BLOCK ─────────────────────────────────
            case 'text': {
                const data = block.data || { };
            const content = data.content || block.description || '';

            return (
            <section id={block.id} key={block.id} className={`py-12 sm:py-16 px-4 sm:px-6 border-t ${isDarkMode ? 'border-white/10' : 'border-slate-100'}`}>
              <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                  <h2 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    {block.title || 'Informasi Acara'}
                  </h2>
                  {block.subtitle && (
                    <p className="text-sm font-semibold mt-1" style={{ color: themePrimary }}>
                      {block.subtitle}
                    </p>
                  )}
                </div>
                <div className={`text-sm sm:text-base leading-relaxed space-y-4 whitespace-pre-line ${isDarkMode ? 'text-white/80' : 'text-slate-600'}`}>
                  {content}
                </div>
              </div>
            </section>
            );
              }

            // ─── 3. TIMELINE BLOCK ─────────────────────────────────────────
            case 'timeline': {
                const data = block.data || { };
            const items: TimelineItem[] = data.items || [];

            return (
            <section id={block.id} key={block.id} className={`py-14 sm:py-20 px-4 sm:px-6 border-t ${isDarkMode ? 'border-white/10 bg-white/[0.02]' : 'border-slate-100 bg-slate-50/50'}`}>
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                  <h2 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    {block.title || 'Alur & Jadwal Kegiatan'}
                  </h2>
                  {block.subtitle && (
                    <p className={`text-xs sm:text-sm mt-1.5 ${isDarkMode ? 'text-white/60' : 'text-slate-500'}`}>
                      {block.subtitle}
                    </p>
                  )}
                </div>

                <div className="space-y-4">
                  {items.map((item, i) => {
                    const isActive = item.status === 'active';
                    const isDone = item.status === 'completed';

                    return (
                      <div
                        key={item.id || i}
                        className={`p-5 rounded-xl border transition-all ${isActive
                          ? isDarkMode
                            ? 'bg-blue-950/40 border-blue-500 shadow-md ring-1 ring-blue-500'
                            : 'bg-white border-blue-500 shadow-md ring-1 ring-blue-500'
                          : isDarkMode
                            ? 'bg-white/5 border-white/10'
                            : 'bg-white border-slate-200'
                          }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${isDone
                                ? 'bg-emerald-500 text-white'
                                : isActive
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-slate-200 text-slate-600'
                                }`}
                            >
                              {isDone ? '✓' : i + 1}
                            </div>
                            <h3 className={`font-bold text-sm sm:text-base ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                              {item.name}
                            </h3>
                          </div>

                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-mono text-slate-500">
                              {item.startDate} {item.endDate && item.endDate !== item.startDate ? `- ${item.endDate}` : ''}
                            </span>
                            {isActive && (
                              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px]">
                                AKTIF
                              </span>
                            )}
                            {isDone && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[10px]">
                                SELESAI
                              </span>
                            )}
                          </div>
                        </div>

                        {item.description && (
                          <p className={`text-xs pl-10 ${isDarkMode ? 'text-white/70' : 'text-slate-500'}`}>
                            {item.description}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
            );
              }

            // ─── 4. FORMULIR PENDAFTARAN BLOCK (WITH MULTI-STEP & HIDE SUPPORT) ─────
            case 'form': {
              const data = block.data || {};

              // If user toggled "Sembunyikan form di halaman utama", skip rendering in main flow!
              if (data.hideFromMainPage) {
                return null;
              }

              const steps: FormStep[] = data.steps || [
                {
                  id: 'step-1',
                  title: 'Alur 1',
                  fields: [
                    { id: 'f-name', label: 'Nama Lengkap', type: 'text', required: true, placeholder: 'Nama Anda' },
                    { id: 'f-email', label: 'Alamat Email', type: 'text', required: true, placeholder: 'email@domain.com' }
                  ]
                }
              ];

              const currentStepData = steps[activeFormStep] || steps[0];
              const isFinalStep = activeFormStep === steps.length - 1;
              const buttonText = data.buttonText || 'Kirim Pendaftaran';
              const isPaymentStep = currentStepData?.type === 'payment' || currentStepData?.payment?.enabled;
              const paymentConfig = currentStepData?.payment;

              return (
                <section id={block.id} key={block.id} className={`py-14 sm:py-20 px-4 sm:px-6 border-t ${isDarkMode ? 'border-white/10' : 'border-slate-200/60'}`}>
                  <div className="max-w-2xl mx-auto">
                    <div className="text-center mb-8">
                      <h2 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        {block.title || 'Formulir Pendaftaran'}
                      </h2>
                      {block.subtitle && (
                        <p className={`text-xs sm:text-sm mt-1.5 ${isDarkMode ? 'text-white/60' : 'text-slate-500'}`}>
                          {block.subtitle}
                        </p>
                      )}

                      {/* Step indicator pills if multiple steps */}
                      {steps.length > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-4">
                          {steps.map((st, sIdx) => (
                            <div
                              key={st.id || sIdx}
                              className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
                                sIdx === activeFormStep
                                  ? 'text-white shadow-xs'
                                  : sIdx < activeFormStep
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : isDarkMode ? 'bg-white/10 text-white/50' : 'bg-slate-100 text-slate-500'
                              }`}
                              style={sIdx === activeFormStep ? { backgroundColor: themePrimary } : {}}
                            >
                              {sIdx < activeFormStep ? `✓ ${st.title}` : `${sIdx + 1}. ${st.title}`}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className={`p-6 sm:p-8 rounded-2xl border shadow-xl ${isDarkMode ? 'bg-[#151928] border-white/10' : 'bg-white border-slate-200'}`}>
                      {formSubmitted ? (
                        <div className="text-center py-10 space-y-4 animate-scaleUp">
                          <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                            <span className="material-symbols-outlined text-[32px]">check_circle</span>
                          </div>
                          <div>
                            <h3 className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                              Form sudah di-submit
                            </h3>
                            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                              Data pendaftaran Anda telah berhasil terkirim.
                            </p>
                          </div>
                          <div className="pt-2">
                            <button
                              type="button"
                              onClick={() => {
                                setFormSubmitted(false);
                                setActiveFormStep(0);
                              }}
                              className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 hover:bg-slate-50 text-slate-700 cursor-pointer transition-colors"
                            >
                              Kirim Formulir Baru
                            </button>
                          </div>
                        </div>
                      ) : (
                        <form
                          onSubmit={(e) => {
                            if (!isFinalStep) {
                              e.preventDefault();
                              setActiveFormStep((prev) => prev + 1);
                            } else {
                              handleFormSubmit(e, block.id);
                            }
                          }}
                          className="space-y-4"
                        >
                          {/* JIKA ALUR PEMBAYARAN: TAMPILKAN RINCIAN PEMBAYARAN, QR CODE, BUKTI PEMBAYARAN, & EMAIL VERIFIKASI ACC */}
                          {isPaymentStep && (
                            <div className="space-y-4 pb-2 border-b border-slate-100">
                              {/* Kotak Rincian Biaya */}
                              <div className={`p-4 rounded-xl border text-center space-y-1.5 ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Biaya Pendaftaran</span>
                                <span className="font-display font-black text-2xl sm:text-3xl block" style={{ color: themePrimary }}>
                                  {paymentConfig?.price || 'Rp 50.000'}
                                </span>
                                {paymentConfig?.bankInfo && (
                                  <p className={`text-xs font-semibold pt-1 ${isDarkMode ? 'text-white/80' : 'text-slate-700'}`}>
                                    {paymentConfig.bankInfo}
                                  </p>
                                )}

                                {/* QR Code Display */}
                                {paymentConfig?.qrCodeUrl && (
                                  <div className="pt-2">
                                    <div className="inline-block p-2.5 bg-white rounded-xl border border-slate-200 shadow-xs">
                                      <img
                                        src={paymentConfig.qrCodeUrl}
                                        alt="QR Code Pembayaran"
                                        className="w-40 h-40 object-contain rounded-lg mx-auto"
                                      />
                                      <span className="block text-[10px] font-semibold text-slate-400 mt-1.5">
                                        Pindai QR Code untuk Pembayaran
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Upload Bukti Pembayaran */}
                              <div className="space-y-1.5 text-left">
                                <label className={`block text-xs font-bold ${isDarkMode ? 'text-white/90' : 'text-slate-700'}`}>
                                  Upload Bukti Pembayaran <span className="text-red-500">*</span>
                                </label>
                                <div className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors relative ${
                                  isDarkMode ? 'border-white/10 bg-white/5 hover:bg-white/10' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                                }`}>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    required={!formData[`payment_proof_${currentStepData.id}`]}
                                    onChange={(e) => {
                                      const f = e.target.files?.[0];
                                      if (!f) return;
                                      if (f.size > 5 * 1024 * 1024) {
                                        alert('Ukuran berkas bukti pembayaran maksimal 5 MB.');
                                        return;
                                      }
                                      const reader = new FileReader();
                                      reader.onload = (ev) => {
                                        handleInputChange(`payment_proof_${currentStepData.id}`, ev.target?.result as string);
                                      };
                                      reader.readAsDataURL(f);
                                    }}
                                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                  />
                                  {formData[`payment_proof_${currentStepData.id}`] ? (
                                    <div className="flex items-center justify-center gap-2 text-emerald-600 text-xs font-bold">
                                      <span className="material-symbols-outlined text-[18px]">check_circle</span>
                                      <span>Bukti Pembayaran Terpilih (Maks 5 MB)</span>
                                    </div>
                                  ) : (
                                    <div className="space-y-1">
                                      <span className="material-symbols-outlined text-[24px] text-slate-400">upload_file</span>
                                      <span className="block text-xs text-slate-600 font-bold">Upload Bukti Transfer / Pembayaran</span>
                                      <span className="block text-[11px] text-slate-400">Maksimal ukuran 5 MB (JPG, PNG)</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Email Konfirmasi Verifikasi ACC */}
                              <div className="space-y-1.5 text-left">
                                <label className={`block text-xs font-bold ${isDarkMode ? 'text-white/90' : 'text-slate-700'}`}>
                                  Email untuk Menerima Konfirmasi ACC <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="email"
                                  required
                                  placeholder="nama@email.com"
                                  value={formData[`payment_email_${currentStepData.id}`] || ''}
                                  onChange={(e) => handleInputChange(`payment_email_${currentStepData.id}`, e.target.value)}
                                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs border transition-colors ${
                                    isDarkMode
                                      ? 'bg-[#1a1f33] border-white/10 text-white placeholder-white/30 focus:border-blue-500'
                                      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-600'
                                  } focus:outline-none`}
                                />
                              </div>
                            </div>
                          )}

                          {/* Bidang Form Kustom */}
                          {(currentStepData.fields || []).map((field: FormFieldItem) => (
                            <div key={field.id} className="space-y-1 text-left">
                              <label className={`block text-xs font-bold ${isDarkMode ? 'text-white/90' : 'text-slate-700'}`}>
                                {field.label} {field.required && <span className="text-red-500">*</span>}
                              </label>

                              {field.type === 'choice' ? (
                                <select
                                  required={field.required}
                                  value={formData[field.id] || ''}
                                  onChange={(e) => handleInputChange(field.id, e.target.value)}
                                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs border transition-colors ${isDarkMode
                                    ? 'bg-[#1a1f33] border-white/10 text-white focus:border-blue-500'
                                    : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-blue-600'
                                    } focus:outline-none`}
                                >
                                  <option value="">Pilih opsi...</option>
                                  {(field.options || ['Opsi 1', 'Opsi 2']).map((opt, oi) => (
                                    <option key={oi} value={opt}>
                                      {opt}
                                    </option>
                                  ))}
                                </select>
                              ) : field.type === 'image' ? (
                                <div className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors relative ${
                                  isDarkMode ? 'border-white/10 bg-white/5 hover:bg-white/10' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                                }`}>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    required={field.required && !formData[field.id]}
                                    onChange={(e) => {
                                      const f = e.target.files?.[0];
                                      if (!f) return;
                                      if (f.size > 5 * 1024 * 1024) {
                                        alert('Ukuran berkas maksimal 5 MB.');
                                        return;
                                      }
                                      const reader = new FileReader();
                                      reader.onload = (ev) => {
                                        handleInputChange(field.id, ev.target?.result as string);
                                      };
                                      reader.readAsDataURL(f);
                                    }}
                                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                  />
                                  {formData[field.id] ? (
                                    <div className="flex items-center justify-center gap-2 text-emerald-600 text-xs font-bold">
                                      <span className="material-symbols-outlined text-[18px]">check_circle</span>
                                      <span>Berkas Terpilih (Maks 5 MB)</span>
                                    </div>
                                  ) : (
                                    <div className="space-y-1">
                                      <span className="material-symbols-outlined text-[24px] text-slate-400">upload_file</span>
                                      <span className="block text-xs text-slate-600 font-bold">{field.placeholder || 'Upload Berkas Gambar (Maks 5 MB)'}</span>
                                      <span className="block text-[11px] text-slate-400">Klik untuk memilih berkas</span>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <input
                                  type="text"
                                  required={field.required}
                                  placeholder={field.placeholder || ''}
                                  value={formData[field.id] || ''}
                                  onChange={(e) => handleInputChange(field.id, e.target.value)}
                                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs border transition-colors ${isDarkMode
                                    ? 'bg-white/5 border-white/10 text-white placeholder-white/30 focus:border-blue-500'
                                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-600'
                                    } focus:outline-none`}
                                />
                              )}
                            </div>
                          ))}

                          <div className="pt-2 flex items-center justify-between gap-3">
                            {activeFormStep > 0 && (
                              <button
                                type="button"
                                onClick={() => setActiveFormStep((prev) => prev - 1)}
                                className={`px-4 py-2.5 rounded-xl border text-xs font-bold cursor-pointer transition-colors ${
                                  isDarkMode ? 'border-white/20 text-white/80 hover:bg-white/10' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                              >
                                ← Kembali
                              </button>
                            )}

                            <button
                              type="submit"
                              className="flex-1 py-3 rounded-xl text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all cursor-pointer"
                              style={{
                                background: `linear-gradient(135deg, ${themePrimary}, ${themeAccent})`
                              }}
                            >
                              {isFinalStep ? buttonText : 'Lanjut ke Alur Berikutnya →'}
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  </div>
                </section>
              );
            }

            // ─── 5. PRIZES BLOCK ───────────────────────────────────────────
            case 'prizes': {
                const data = block.data || { };
            const items: CategoryItem[] = data.items || [];

            return (
            <section id={block.id} key={block.id} className={`py-14 sm:py-20 px-4 sm:px-6 border-t ${isDarkMode ? 'border-white/10' : 'border-slate-100'}`}>
              <div className="max-w-5xl mx-auto">
                <div className="text-center mb-12">
                  <h2 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    {block.title || 'Total Hadiah & Apresiasi'}
                  </h2>
                  {block.subtitle && (
                    <p className={`text-xs sm:text-sm mt-1.5 ${isDarkMode ? 'text-white/60' : 'text-slate-500'}`}>
                      {block.subtitle}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {items.map((cat, i) => (
                    <div
                      key={cat.id || i}
                      className={`p-6 rounded-2xl border flex flex-col justify-between shadow-xs hover:shadow-md transition-all ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'
                        }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-blue-50 text-blue-700">
                            {cat.badge || `Peringkat ${i + 1}`}
                          </span>
                          <span className="material-symbols-outlined text-[20px] text-amber-500">
                            emoji_events
                          </span>
                        </div>

                        <h3 className={`font-bold text-base mb-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                          {cat.title}
                        </h3>

                        {cat.prizePool && (
                          <div className="text-xl font-black font-display my-2" style={{ color: themePrimary }}>
                            {cat.prizePool}
                          </div>
                        )}

                        <p className={`text-xs mt-2 leading-relaxed ${isDarkMode ? 'text-white/70' : 'text-slate-500'}`}>
                          {cat.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
            );
              }

            // ─── 6. SPEAKERS BLOCK ─────────────────────────────────────────
            case 'speakers': {
                const data = block.data || { };
            const items: SpeakerItem[] = data.items || [];

            return (
            <section id={block.id} key={block.id} className={`py-14 sm:py-20 px-4 sm:px-6 border-t ${isDarkMode ? 'border-white/10 bg-white/[0.02]' : 'border-slate-100 bg-slate-50/50'}`}>
              <div className="max-w-5xl mx-auto">
                <div className="text-center mb-12">
                  <h2 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    {block.title || 'Pembicara Tamu & Juri'}
                  </h2>
                  {block.subtitle && (
                    <p className={`text-xs sm:text-sm mt-1.5 ${isDarkMode ? 'text-white/60' : 'text-slate-500'}`}>
                      {block.subtitle}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {items.map((spk, i) => (
                    <div
                      key={spk.id || i}
                      className={`p-6 rounded-2xl border text-center flex flex-col items-center ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-xs'
                        }`}
                    >
                      <img
                        src={spk.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'}
                        alt={spk.name || 'Speaker'}
                        className="w-20 h-20 rounded-full object-cover shadow-md mb-4 border-2 border-white"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80';
                        }}
                      />
                      <h3 className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        {spk.name || 'Nama Pembicara'}
                      </h3>
                      {spk.role && (
                        <span className="text-xs font-semibold mt-0.5" style={{ color: themePrimary }}>
                          {spk.role}
                        </span>
                      )}
                      {spk.companyOrCampus && (
                        <span className="text-[11px] text-slate-500 mt-0.5">
                          {spk.companyOrCampus}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </section>
            );
              }

            // ─── GALLERY BLOCK ─────────────────────────────────────────────
            case 'gallery': {
              const images: GalleryImageItem[] = block.data?.images || [];
              if (images.length === 0) return null;

              return (
                <section id={block.id} key={block.id} className={`py-14 sm:py-20 px-4 sm:px-6 border-t ${isDarkMode ? 'border-white/10' : 'border-slate-100'}`}>
                  <div className="max-w-5xl mx-auto">
                    {(block.title || block.subtitle) && (
                      <div className="text-center mb-10">
                        <h2 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                          {block.title || 'Dokumentasi & Galeri'}
                        </h2>
                        {block.subtitle && (
                          <p className={`text-xs sm:text-sm mt-1.5 ${isDarkMode ? 'text-white/60' : 'text-slate-500'}`}>
                            {block.subtitle}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {images.map((img, iIdx) => {
                        const isFeatured = img.size === 'featured';
                        return (
                          <div
                            key={img.id || iIdx}
                            className={`relative rounded-2xl overflow-hidden shadow-sm group border border-slate-200/60 bg-slate-100 transition-all ${
                              isFeatured ? 'sm:col-span-2 sm:row-span-2 min-h-[300px] sm:min-h-[380px]' : 'min-h-[190px] sm:min-h-[220px]'
                            }`}
                          >
                            <img
                              src={img.url}
                              alt={img.caption || 'Foto Dokumentasi'}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                            {img.caption && (
                              <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent text-white text-xs font-semibold backdrop-blur-2xs">
                                {img.caption}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </section>
              );
            }

            // ─── 7. FAQ BLOCK ──────────────────────────────────────────────
            case 'faq': {
                const data = block.data || { };
            const items: FaqItem[] = data.items || [];

            return (
            <section id={block.id} key={block.id} className={`py-14 sm:py-20 px-4 sm:px-6 border-t ${isDarkMode ? 'border-white/10' : 'border-slate-100'}`}>
              <div className="max-w-3xl mx-auto">
                <div className="text-center mb-10">
                  <h2 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    {block.title || 'Pertanyaan yang Sering Diajukan'}
                  </h2>
                  {block.subtitle && (
                    <p className={`text-xs sm:text-sm mt-1.5 ${isDarkMode ? 'text-white/60' : 'text-slate-500'}`}>
                      {block.subtitle}
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  {items.map((faq, i) => {
                    const isOpen = openFaqId === faq.id;
                    return (
                      <div
                        key={faq.id || i}
                        className={`rounded-xl border transition-all ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-2xs'
                          }`}
                      >
                        <button
                          type="button"
                          onClick={() => toggleFaq(faq.id)}
                          className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 font-bold text-xs sm:text-sm cursor-pointer"
                        >
                          <span className={isDarkMode ? 'text-white' : 'text-slate-900'}>
                            {faq.question}
                          </span>
                          <span className="material-symbols-outlined text-[18px] text-slate-400 shrink-0">
                            {isOpen ? 'expand_less' : 'expand_more'}
                          </span>
                        </button>
                        {isOpen && (
                          <div className={`px-5 pb-4 text-xs leading-relaxed ${isDarkMode ? 'text-white/70' : 'text-slate-600'}`}>
                            {faq.answer}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
            );
              }

            // ─── 8. CONTACT / FOOTER BLOCK ─────────────────────────────────
            case 'contact': {
                const data = block.data || { };
            const wa = data.whatsappNumber || '6281234567890';
            const email = data.email || 'panitia@event.site';
            const committee = data.committeeName || 'Panitia Pelaksana Event';

            return (
            <footer id={block.id} key={block.id} className={`py-12 px-4 sm:px-6 border-t ${isDarkMode ? 'border-white/10 bg-[#090b12]' : 'border-slate-200 bg-slate-50'}`}>
              <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
                <div>
                  <h4 className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    {committee}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Narahubung: {email}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <a
                    href={`https://wa.me/${wa.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">chat</span>
                    <span>WhatsApp Panitia</span>
                  </a>
                </div>
              </div>
            </footer>
            );
              }

            default:
            return null;
            }
          })
        )}
          </main>

      {/* ─── DEDICATED FULL-PAGE FORM VIEW (GANTI PAGE SAJA, BUKAN POPUP KECIL) ─── */}
      {modalFormBlock && (
        <div
          className={`fixed inset-0 z-50 ${bgContainerClass} overflow-y-auto flex flex-col transition-colors duration-200 animate-fadeIn`}
          style={rootBgStyle}
        >
          {/* Header Bar */}
          <header className={`sticky top-0 z-30 backdrop-blur-md border-b ${isDarkMode ? 'bg-[#0f111a]/85 border-white/10' : 'bg-white/85 border-slate-200/70'} px-4 sm:px-6 py-3.5 flex items-center justify-between`}>
            <button
              type="button"
              onClick={() => {
                setModalFormBlock(null);
                setActiveFormStep(0);
                setFormSubmitted(false);
              }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200/80 hover:bg-slate-100 text-xs font-bold text-slate-700 cursor-pointer transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              <span>Kembali ke Halaman Utama</span>
            </button>

            <div className="flex items-center gap-2 text-xs font-bold">
              {config.logoUrl && (
                <img src={config.logoUrl} alt="Logo" className="w-6 h-6 rounded object-cover" />
              )}
              <span className={isDarkMode ? 'text-white' : 'text-slate-900'}>{config.eventName || 'Website Event'}</span>
            </div>
          </header>

          {/* Body Content */}
          <div className="flex-1 max-w-2xl w-full mx-auto p-4 sm:p-8 flex flex-col justify-center">
            {formSubmitted ? (
              <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-xl text-center space-y-4 animate-scaleUp">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                  <span className="material-symbols-outlined text-[36px]">check_circle</span>
                </div>
                <div>
                  <h3 className="font-display font-extrabold text-xl text-slate-900">
                    Form sudah di-submit
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto mt-1 leading-relaxed">
                    Data dan berkas pendaftaran Anda telah berhasil terkirim.
                  </p>
                </div>
                <div className="pt-4 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setModalFormBlock(null);
                      setActiveFormStep(0);
                      setFormSubmitted(false);
                    }}
                    className="px-6 py-2.5 rounded-xl text-white text-xs font-bold shadow-md cursor-pointer transition-transform active:scale-95"
                    style={{ background: `linear-gradient(135deg, ${themePrimary}, ${themeAccent})` }}
                  >
                    Kembali ke Halaman Acara
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 block mb-1">
                    FORMULIR PENDAFTARAN
                  </span>
                  <h2 className="font-display font-extrabold text-xl sm:text-2xl text-slate-900">
                    {modalFormBlock.title || 'Formulir Pendaftaran'}
                  </h2>
                  {modalFormBlock.subtitle && (
                    <p className="text-xs text-slate-500 mt-1">{modalFormBlock.subtitle}</p>
                  )}
                </div>

                {/* ALUR / STEP TIMELINE INDICATOR */}
                {((modalFormBlock.data?.steps || []).length > 1) && (
                  <div className="pt-2 pb-4 border-b border-slate-100">
                    <div className="flex items-center justify-between">
                      {((modalFormBlock.data?.steps || []) as FormStep[]).map((step, sIdx) => {
                        const isCurrent = activeFormStep === sIdx;
                        const isDone = activeFormStep > sIdx;
                        return (
                          <div key={step.id || sIdx} className="flex-1 flex items-center">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                                  isDone
                                    ? 'bg-emerald-500 text-white'
                                    : isCurrent
                                    ? 'text-white shadow-xs'
                                    : 'bg-slate-100 text-slate-400'
                                }`}
                                style={isCurrent ? { backgroundColor: themePrimary } : {}}
                              >
                                {isDone ? '✓' : sIdx + 1}
                              </div>
                              <span className={`text-[11px] font-bold hidden sm:block ${
                                isCurrent ? 'text-slate-900' : 'text-slate-400'
                              }`}>
                                {step.title || `Alur ${sIdx + 1}`}
                              </span>
                            </div>
                            {sIdx < ((modalFormBlock.data?.steps || []).length - 1) && (
                              <div className={`flex-1 h-0.5 mx-2 rounded ${
                                isDone ? 'bg-emerald-500' : 'bg-slate-200'
                              }`} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* FORM FIELDS */}
                {(() => {
                  const modalSteps: FormStep[] = modalFormBlock.data?.steps || [];
                  const currentModalStep = modalSteps[activeFormStep] || modalSteps[0];
                  const isModalPayment = currentModalStep?.type === 'payment' || currentModalStep?.payment?.enabled;
                  const modalPayment = currentModalStep?.payment;

                  return (
                    <form
                      onSubmit={(e) => {
                        const isFinal = activeFormStep >= modalSteps.length - 1;
                        if (!isFinal) {
                          e.preventDefault();
                          setActiveFormStep((prev) => prev + 1);
                        } else {
                          handleFormSubmit(e, modalFormBlock?.id);
                        }
                      }}
                      className="space-y-4"
                    >
                      {/* JIKA ALUR PEMBAYARAN */}
                      {isModalPayment && (
                        <div className="space-y-4 pb-2 border-b border-slate-100">
                          {/* Kotak Rincian Biaya */}
                          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-center space-y-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Biaya Pendaftaran</span>
                            <span className="font-display font-black text-2xl sm:text-3xl block text-slate-900" style={{ color: themePrimary }}>
                              {modalPayment?.price || 'Rp 50.000'}
                            </span>
                            {modalPayment?.bankInfo && (
                              <p className="text-xs font-semibold pt-1 text-slate-700">
                                {modalPayment.bankInfo}
                              </p>
                            )}

                            {/* QR Code Display */}
                            {modalPayment?.qrCodeUrl && (
                              <div className="pt-2">
                                <div className="inline-block p-2.5 bg-white rounded-xl border border-slate-200 shadow-xs">
                                  <img
                                    src={modalPayment.qrCodeUrl}
                                    alt="QR Code Pembayaran"
                                    className="w-44 h-44 object-contain rounded-lg mx-auto"
                                  />
                                  <span className="block text-[10px] font-semibold text-slate-400 mt-1.5">
                                    Pindai QR Code untuk Pembayaran
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Upload Bukti Pembayaran */}
                          <div className="space-y-1.5 text-left">
                            <label className="block text-xs font-bold text-slate-700">
                              Upload Bukti Pembayaran <span className="text-red-500">*</span>
                            </label>
                            <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative">
                              <input
                                type="file"
                                accept="image/*"
                                required={!formData[`payment_proof_${currentModalStep.id}`]}
                                onChange={(e) => {
                                  const f = e.target.files?.[0];
                                  if (!f) return;
                                  if (f.size > 5 * 1024 * 1024) {
                                    alert('Ukuran berkas bukti pembayaran maksimal 5 MB.');
                                    return;
                                  }
                                  const reader = new FileReader();
                                  reader.onload = (ev) => {
                                    handleInputChange(`payment_proof_${currentModalStep.id}`, ev.target?.result as string);
                                  };
                                  reader.readAsDataURL(f);
                                }}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                              />
                              {formData[`payment_proof_${currentModalStep.id}`] ? (
                                <div className="flex items-center justify-center gap-2 text-emerald-600 text-xs font-bold">
                                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                                  <span>Bukti Pembayaran Terpilih (Maks 5 MB)</span>
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  <span className="material-symbols-outlined text-[24px] text-slate-400">upload_file</span>
                                  <span className="block text-xs text-slate-600 font-bold">Upload Bukti Transfer / Pembayaran</span>
                                  <span className="block text-[11px] text-slate-400">Maksimal 5 MB (JPG, PNG)</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Email Konfirmasi Verifikasi ACC */}
                          <div className="space-y-1.5 text-left">
                            <label className="block text-xs font-bold text-slate-700">
                              Email untuk Menerima Konfirmasi ACC <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="email"
                              required
                              placeholder="nama@email.com"
                              value={formData[`payment_email_${currentModalStep.id}`] || ''}
                              onChange={(e) => handleInputChange(`payment_email_${currentModalStep.id}`, e.target.value)}
                              className="w-full px-3.5 py-2.5 rounded-xl text-xs border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none"
                            />
                          </div>
                        </div>
                      )}

                      {/* Custom Fields */}
                      <div className="space-y-3.5">
                        {(currentModalStep?.fields || []).map((field: FormFieldItem) => (
                          <div key={field.id} className="space-y-1.5 text-left">
                            <label className="block text-xs font-bold text-slate-700">
                              {field.label} {field.required && <span className="text-red-500">*</span>}
                            </label>
                            {field.type === 'choice' ? (
                              <select
                                required={field.required}
                                value={formData[field.id] || ''}
                                onChange={(e) => handleInputChange(field.id, e.target.value)}
                                className="w-full px-3.5 py-2.5 rounded-xl text-xs border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-600 focus:outline-none"
                              >
                                <option value="">Pilih salah satu opsi...</option>
                                {(field.options || ['Opsi 1', 'Opsi 2']).map((opt, oi) => (
                                  <option key={oi} value={opt}>{opt}</option>
                                ))}
                              </select>
                            ) : field.type === 'image' ? (
                              <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative">
                                <input
                                  type="file"
                                  accept="image/*"
                                  required={field.required && !formData[field.id]}
                                  onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (!f) return;
                                    if (f.size > 5 * 1024 * 1024) {
                                      alert('Ukuran berkas maksimal 5 MB.');
                                      return;
                                    }
                                    const reader = new FileReader();
                                    reader.onload = (ev) => {
                                      handleInputChange(field.id, ev.target?.result as string);
                                    };
                                    reader.readAsDataURL(f);
                                  }}
                                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                />
                                {formData[field.id] ? (
                                  <div className="flex items-center justify-center gap-2 text-emerald-600 text-xs font-bold">
                                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                                    <span>Berkas Terpilih (Maks 5 MB)</span>
                                  </div>
                                ) : (
                                  <div className="space-y-1">
                                    <span className="material-symbols-outlined text-[24px] text-slate-400">upload_file</span>
                                    <span className="block text-xs text-slate-600 font-bold">{field.placeholder || 'Upload Berkas / Gambar (Maks 5 MB)'}</span>
                                    <span className="block text-[11px] text-slate-400">Klik untuk memilih berkas</span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <input
                                type="text"
                                required={field.required}
                                placeholder={field.placeholder || ''}
                                value={formData[field.id] || ''}
                                onChange={(e) => handleInputChange(field.id, e.target.value)}
                                className="w-full px-3.5 py-2.5 rounded-xl text-xs border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-600 focus:outline-none"
                              />
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="pt-4 flex items-center justify-between gap-3 border-t border-slate-100">
                        {activeFormStep > 0 && (
                          <button
                            type="button"
                            onClick={() => setActiveFormStep((prev) => prev - 1)}
                            className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 cursor-pointer transition-colors"
                          >
                            ← Alur Sebelumnya
                          </button>
                        )}

                        <button
                          type="submit"
                          className="flex-1 py-3 rounded-xl text-white font-bold text-xs shadow-md transition-all cursor-pointer hover:opacity-95"
                          style={{ background: `linear-gradient(135deg, ${themePrimary}, ${themeAccent})` }}
                        >
                          {activeFormStep >= modalSteps.length - 1
                            ? (modalFormBlock.data?.buttonText || 'Kirim Pendaftaran')
                            : 'Lanjut ke Alur Berikutnya →'}
                        </button>
                      </div>
                    </form>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
