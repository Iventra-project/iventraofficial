import { useState, useMemo } from 'react';
import type { EventConfig, EventBlock, TimelineItem, SpeakerItem, CategoryItem, FaqItem, FormFieldItem } from '../../types/builder.ts';
import { ensureConfigBlocks } from '../../types/builder.ts';

interface SparkEventRendererProps {
  config: EventConfig;
  isPreviewMode?: boolean;
}

export default function SparkEventRenderer({ config }: SparkEventRendererProps) {
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});

  const themePrimary = config.theme?.primaryColor || '#1f2de6';
  const themeAccent = config.theme?.accentColor || '#3b47dc';
  const bgStyle = config.theme?.bgStyle || 'clean-white';

  const blocks = useMemo(() => ensureConfigBlocks(config), [config]);
  const activeBlocks = useMemo(() => blocks.filter((b) => b.enabled), [blocks]);

  const isDarkMode = bgStyle === 'dark-modern';

  const bgContainerClass = useMemo(() => {
    switch (bgStyle) {
      case 'dark-modern':
        return 'bg-[#0f111a] text-white';
      case 'campus-emerald':
        return 'bg-[#f0fdf4] text-[#064e3b]';
      case 'subtle-gradient':
        return 'bg-gradient-to-b from-[#f8f9fe] via-[#ffffff] to-[#f4f2ff] text-[#191930]';
      case 'clean-white':
      default:
        return 'bg-white text-[#191930]';
    }
  }, [bgStyle]);

  const toggleFaq = (id: string) => {
    setOpenFaqId(openFaqId === id ? null : id);
  };

  const handleInputChange = (fieldId: string, val: string) => {
    setFormData((prev) => ({ ...prev, [fieldId]: val }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
    setTimeout(() => setFormSubmitted(false), 4000);
  };

  return (
    <div className={`w-full min-h-screen ${bgContainerClass} font-sans selection:bg-blue-600 selection:text-white transition-colors duration-300 relative overflow-x-hidden`}>
      {/* Top Header / Brand Bar */}
      <header className={`sticky top-0 z-30 backdrop-blur-md border-b ${isDarkMode ? 'bg-[#0f111a]/85 border-white/10' : 'bg-white/90 border-slate-200/80'} transition-colors`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {config.logoUrl ? (
              <img
                src={config.logoUrl}
                alt={config.institutionName || config.eventName}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl object-cover border border-black/5 shadow-xs shrink-0"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <div
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-white font-extrabold text-sm shadow-xs shrink-0"
                style={{ background: `linear-gradient(135deg, ${themePrimary}, ${themeAccent})` }}
              >
                {(config.eventName || 'E').charAt(0)}
              </div>
            )}
            <div className="min-w-0">
              <span className="block text-[11px] font-semibold text-slate-500 truncate">
                {config.institutionName || 'Iventra Official Event'}
              </span>
              <span className={`block font-extrabold text-sm sm:text-base truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                {config.eventName || 'Untitled Event'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="#block-form"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-white text-xs font-bold shadow-sm transition-transform active:scale-95"
              style={{
                background: `linear-gradient(135deg, ${themePrimary}, ${themeAccent})`
              }}
            >
              <span>Daftar Sekarang</span>
              <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
            </a>
          </div>
        </div>
      </header>

      {/* SEQUENTIAL BLOCK RENDERING IN USER-DEFINED ORDER */}
      <main className="w-full">
        {activeBlocks.length === 0 ? (
          <div className="py-24 text-center max-w-md mx-auto px-4">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-400">
              <span className="material-symbols-outlined text-[32px]">note_add</span>
            </div>
            <h3 className="font-bold text-lg text-slate-800 mb-1">{config.eventName || 'Untitled Event'}</h3>
            <p className="text-xs text-slate-500 mb-4">{config.description || 'Halaman ini masih kosong. Tambahkan blok komponen melalui builder di sisi kiri.'}</p>
          </div>
        ) : (
          activeBlocks.map((block, idx) => {
            switch (block.type) {
              // ─── 1. HERO BLOCK ─────────────────────────────────────────────
              case 'hero': {
                const data = block.data || {};
                const headline = data.headline || block.title || config.eventName;
                const tagline = data.tagline || block.subtitle || config.tagline;
                const dateText = data.dateText || config.eventDateText;
                const locationText = data.locationText || config.eventLocationText;
                const bannerUrl = data.bannerUrl || config.bannerUrl;
                const badgeText = data.badgeText || config.statusBadgeText || 'Pendaftaran Dibuka';

                return (
                  <section key={block.id} className="relative pt-12 pb-16 sm:pt-20 sm:pb-24 px-4 sm:px-6">
                    <div className="max-w-5xl mx-auto text-center flex flex-col items-center">
                      {badgeText && (
                        <div
                          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-extrabold tracking-wide mb-6 shadow-xs border ${
                            isDarkMode ? 'bg-white/10 border-white/20 text-white' : 'bg-blue-50 border-blue-200 text-blue-700'
                          }`}
                        >
                          <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: themePrimary }} />
                          <span>{badgeText}</span>
                        </div>
                      )}

                      <h1
                        className={`text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight max-w-4xl ${
                          isDarkMode ? 'text-white' : 'text-slate-900'
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
                            <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl border text-xs sm:text-sm font-bold shadow-xs ${
                              isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800'
                            }`}>
                              <span className="material-symbols-outlined text-[18px]" style={{ color: themePrimary }}>
                                calendar_month
                              </span>
                              <span>{dateText}</span>
                            </div>
                          )}

                          {locationText && (
                            <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl border text-xs sm:text-sm font-bold shadow-xs ${
                              isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800'
                            }`}>
                              <span className="material-symbols-outlined text-[18px]" style={{ color: themePrimary }}>
                                location_on
                              </span>
                              <span>{locationText}</span>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
                        <a
                          href="#block-form"
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-full text-white text-sm font-bold shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
                          style={{
                            background: `linear-gradient(135deg, ${themePrimary}, ${themeAccent})`
                          }}
                        >
                          <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
                          <span>Daftar Sekarang</span>
                        </a>
                      </div>

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

              // ─── 2. TEXT / DESKRIPSI BLOCK ─────────────────────────────────
              case 'text': {
                const data = block.data || {};
                const content = data.content || block.description || '';

                return (
                  <section key={block.id} className={`py-12 sm:py-16 px-4 sm:px-6 border-t ${isDarkMode ? 'border-white/10' : 'border-slate-100'}`}>
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
                const data = block.data || {};
                const items: TimelineItem[] = data.items || [];

                return (
                  <section key={block.id} className={`py-14 sm:py-20 px-4 sm:px-6 border-t ${isDarkMode ? 'border-white/10 bg-white/[0.02]' : 'border-slate-100 bg-slate-50/50'}`}>
                    <div className="max-w-4xl mx-auto">
                      <div className="text-center mb-12">
                        <span className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: themePrimary }}>
                          TIMELINE &amp; JADWAL
                        </span>
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
                              className={`p-5 rounded-xl border transition-all ${
                                isActive
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
                                    className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                      isDone
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

              // ─── 4. FORMULIR PENDAFTARAN BLOCK ──────────────────────────────
              case 'form': {
                const data = block.data || {};
                const fields: FormFieldItem[] = data.fields || [
                  { id: 'f-name', label: 'Nama Lengkap', type: 'text', required: true, placeholder: 'Nama Anda' },
                  { id: 'f-email', label: 'Alamat Email', type: 'email', required: true, placeholder: 'email@domain.com' }
                ];
                const buttonText = data.buttonText || 'Kirim Pendaftaran';

                return (
                  <section id="block-form" key={block.id} className={`py-14 sm:py-20 px-4 sm:px-6 border-t ${isDarkMode ? 'border-white/10' : 'border-slate-100'}`}>
                    <div className="max-w-2xl mx-auto">
                      <div className="text-center mb-8">
                        <span className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: themePrimary }}>
                          REGISTRASI PESERTA
                        </span>
                        <h2 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                          {block.title || 'Formulir Pendaftaran'}
                        </h2>
                        {block.subtitle && (
                          <p className={`text-xs sm:text-sm mt-1.5 ${isDarkMode ? 'text-white/60' : 'text-slate-500'}`}>
                            {block.subtitle}
                          </p>
                        )}
                      </div>

                      <div className={`p-6 sm:p-8 rounded-2xl border shadow-xl ${isDarkMode ? 'bg-[#151928] border-white/10' : 'bg-white border-slate-200'}`}>
                        {formSubmitted ? (
                          <div className="text-center py-10 space-y-3">
                            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-2xl font-bold">
                              ✓
                            </div>
                            <h3 className="font-bold text-lg text-slate-900">Pendaftaran Berhasil Dikirim!</h3>
                            <p className="text-xs text-slate-500 max-w-sm mx-auto">
                              Terima kasih telah mendaftar. Tiket barcode dan informasi pelaksanaan kegiatan telah dikirimkan ke email terdaftar Anda.
                            </p>
                          </div>
                        ) : (
                          <form onSubmit={handleFormSubmit} className="space-y-4">
                            {fields.map((field) => (
                              <div key={field.id} className="space-y-1 text-left">
                                <label className={`block text-xs font-bold ${isDarkMode ? 'text-white/90' : 'text-slate-700'}`}>
                                  {field.label} {field.required && <span className="text-red-500">*</span>}
                                </label>

                                {field.type === 'paragraph' ? (
                                  <textarea
                                    required={field.required}
                                    placeholder={field.placeholder || 'Tuliskan jawaban Anda di sini...'}
                                    rows={3}
                                    value={formData[field.id] || ''}
                                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                                    className={`w-full px-3.5 py-2 rounded-xl text-xs border transition-colors ${
                                      isDarkMode
                                        ? 'bg-white/5 border-white/10 text-white placeholder-white/30 focus:border-blue-500'
                                        : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-600'
                                    } focus:outline-none`}
                                  />
                                ) : field.type === 'select' ? (
                                  <select
                                    required={field.required}
                                    value={formData[field.id] || ''}
                                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs border transition-colors ${
                                      isDarkMode
                                        ? 'bg-[#1a1f33] border-white/10 text-white focus:border-blue-500'
                                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-blue-600'
                                    } focus:outline-none`}
                                  >
                                    <option value="">Pilih opsi...</option>
                                    {(field.options || ['Umum', 'Mahasiswa', 'Pelajar']).map((opt, oi) => (
                                      <option key={oi} value={opt}>
                                        {opt}
                                      </option>
                                    ))}
                                  </select>
                                ) : field.type === 'file' ? (
                                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center cursor-pointer hover:border-blue-500 bg-slate-50/50">
                                    <span className="material-symbols-outlined text-[24px] text-slate-400">upload_file</span>
                                    <span className="block text-xs text-slate-600 font-medium mt-1">Upload Berkas / Bukti (PDF, JPG, PNG)</span>
                                  </div>
                                ) : (
                                  <input
                                    type={field.type === 'email' ? 'email' : field.type === 'whatsapp' ? 'tel' : 'text'}
                                    required={field.required}
                                    placeholder={field.placeholder || ''}
                                    value={formData[field.id] || ''}
                                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs border transition-colors ${
                                      isDarkMode
                                        ? 'bg-white/5 border-white/10 text-white placeholder-white/30 focus:border-blue-500'
                                        : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-600'
                                    } focus:outline-none`}
                                  />
                                )}
                              </div>
                            ))}

                            <div className="pt-2">
                              <button
                                type="submit"
                                className="w-full py-3 rounded-xl text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all cursor-pointer"
                                style={{
                                  background: `linear-gradient(135deg, ${themePrimary}, ${themeAccent})`
                                }}
                              >
                                {buttonText}
                              </button>
                            </div>
                          </form>
                        )}
                      </div>
                    </div>
                  </section>
                );
              }

              // ─── 5. PRIZES / BENEFIT BLOCK ─────────────────────────────────
              case 'prizes': {
                const data = block.data || {};
                const items: CategoryItem[] = data.items || [];

                return (
                  <section key={block.id} className={`py-14 sm:py-20 px-4 sm:px-6 border-t ${isDarkMode ? 'border-white/10' : 'border-slate-100'}`}>
                    <div className="max-w-5xl mx-auto">
                      <div className="text-center mb-12">
                        <span className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: themePrimary }}>
                          HADIAH &amp; PENGHARGAAN
                        </span>
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
                            className={`p-6 rounded-2xl border flex flex-col justify-between shadow-xs hover:shadow-md transition-all ${
                              isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'
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

              // ─── 6. SPEAKERS / JURI BLOCK ──────────────────────────────────
              case 'speakers': {
                const data = block.data || {};
                const items: SpeakerItem[] = data.items || [];

                return (
                  <section key={block.id} className={`py-14 sm:py-20 px-4 sm:px-6 border-t ${isDarkMode ? 'border-white/10 bg-white/[0.02]' : 'border-slate-100 bg-slate-50/50'}`}>
                    <div className="max-w-5xl mx-auto">
                      <div className="text-center mb-12">
                        <span className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: themePrimary }}>
                          PEMBICARA &amp; PANELIS
                        </span>
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
                            className={`p-6 rounded-2xl border text-center flex flex-col items-center ${
                              isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-xs'
                            }`}
                          >
                            <img
                              src={spk.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'}
                              alt={spk.name}
                              className="w-20 h-20 rounded-full object-cover shadow-md mb-4 border-2 border-white"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80';
                              }}
                            />
                            <h3 className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                              {spk.name}
                            </h3>
                            <span className="text-xs font-semibold mt-0.5" style={{ color: themePrimary }}>
                              {spk.role}
                            </span>
                            <span className="text-[11px] text-slate-500 mt-0.5">
                              {spk.companyOrCampus}
                            </span>
                            {spk.topic && (
                              <p className={`text-[11px] mt-3 pt-3 border-t w-full ${isDarkMode ? 'border-white/10 text-white/60' : 'border-slate-100 text-slate-500'}`}>
                                "{spk.topic}"
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>
                );
              }

              // ─── 7. FAQ BLOCK ──────────────────────────────────────────────
              case 'faq': {
                const data = block.data || {};
                const items: FaqItem[] = data.items || [];

                return (
                  <section key={block.id} className={`py-14 sm:py-20 px-4 sm:px-6 border-t ${isDarkMode ? 'border-white/10' : 'border-slate-100'}`}>
                    <div className="max-w-3xl mx-auto">
                      <div className="text-center mb-10">
                        <span className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: themePrimary }}>
                          FREQUENTLY ASKED QUESTIONS
                        </span>
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
                              className={`rounded-xl border transition-all ${
                                isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-2xs'
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => toggleFaq(faq.id)}
                                className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 font-bold text-xs sm:text-sm"
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
                const data = block.data || {};
                const wa = data.whatsappNumber || '6281234567890';
                const email = data.email || 'panitia@event.site';
                const committee = data.committeeName || 'Panitia Pelaksana Event';

                return (
                  <footer key={block.id} className={`py-12 px-4 sm:px-6 border-t ${isDarkMode ? 'border-white/10 bg-[#090b12]' : 'border-slate-200 bg-slate-50'}`}>
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
    </div>
  );
}
