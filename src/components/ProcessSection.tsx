import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../context/LanguageContext.tsx';
import {
  Layers3,
  SlidersHorizontal,
  Rocket,
  Check,
  Copy,
  TrendingUp,
  ArrowRight,
  ArrowDown
} from 'lucide-react';

export default function ProcessSection() {
  const { t } = useLanguage();
  const [activeStep, setActiveStep] = useState(0);
  const [copied, setCopied] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState<'tech' | 'lomba' | 'fest'>('tech');
  const [formFields, setFormFields] = useState([
    { id: 'name', label: 'Nama Lengkap Peserta', enabled: true },
    { id: 'email', label: 'Email & WhatsApp Aktif', enabled: true },
    { id: 'ktm', label: 'Upload Kartu Mahasiswa (KTM)', enabled: true },
    { id: 'track', label: 'Kategori Lomba / Jalur Peserta', enabled: false }
  ]);

  const handleCopyLink = () => {
    navigator.clipboard?.writeText('https://tech-summit.iventra.site');
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const toggleField = (id: string) => {
    setFormFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, enabled: !f.enabled } : f))
    );
  };

  const steps = [
    {
      id: '01',
      title: t.process.step1Title,
      icon: Layers3,
      desc: t.process.step1Desc
    },
    {
      id: '02',
      title: t.process.step2Title,
      icon: SlidersHorizontal,
      desc: t.process.step2Desc
    },
    {
      id: '03',
      title: t.process.step3Title,
      icon: Rocket,
      desc: t.process.step3Desc
    }
  ];

  return (
    <section className="w-full py-20 md:py-28 bg-[#f8fafc] border-b border-slate-200/80 relative overflow-hidden" id="process">
      {/* Subtle Background Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[42rem] h-[42rem] bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="max-w-2xl mx-auto text-center mb-14 md:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-extrabold text-slate-900 tracking-tight mb-4">
            {t.process.title}
          </h2>
          <p className="text-base text-slate-600 leading-relaxed font-normal">
            {t.process.description}
          </p>
        </div>

        {/* Interactive Workspace Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: 3 Interactive Step Triggers */}
          <div className="lg:col-span-5 space-y-4">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              const isActive = activeStep === idx;

              return (
                <div
                  key={step.id}
                  onClick={() => setActiveStep(idx)}
                  className={`relative cursor-pointer rounded-2xl p-5 sm:p-6 text-left transition-all duration-300 border ${
                    isActive
                      ? 'bg-white border-blue-500 shadow-xl shadow-blue-500/8 ring-1 ring-blue-500/20 translate-x-1 sm:translate-x-2'
                      : 'bg-white/70 border-slate-200/80 hover:bg-white hover:border-slate-300 shadow-xs'
                  }`}
                >
                  {/* Step Indicator Bar on Active */}
                  {isActive && (
                    <motion.div
                      layoutId="step-indicator-bar"
                      className="absolute left-0 top-4 bottom-4 w-1.5 bg-blue-600 rounded-r-full"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}

                  <div className="flex items-start gap-4">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-display font-bold text-sm transition-all duration-300 ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3
                          className={`text-base sm:text-lg font-display font-bold tracking-tight transition-colors ${
                            isActive ? 'text-slate-900' : 'text-slate-700'
                          }`}
                        >
                          {step.title}
                        </h3>

                        <div
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
                            isActive ? 'bg-blue-50 text-blue-600' : 'text-slate-400'
                          }`}
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Live Interactive Device Preview Showcase */}
          <div className="lg:col-span-7">
            <div className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-7 shadow-2xl shadow-slate-900/10 min-h-[420px] flex flex-col justify-between relative overflow-hidden">
              {/* Clean Browser Header Bar without excess text */}
              <div className="flex items-center pb-4 border-b border-slate-100 mb-6">
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-rose-400 inline-block" />
                  <span className="h-3 w-3 rounded-full bg-amber-400 inline-block" />
                  <span className="h-3 w-3 rounded-full bg-emerald-400 inline-block" />
                </div>
              </div>

              {/* Dynamic Step Content */}
              <div className="flex-1 flex flex-col justify-center">
                <AnimatePresence mode="wait">
                  {/* STEP 1 PREVIEW: Interactive Template Chooser */}
                  {activeStep === 0 && (
                    <motion.div
                      key="step-0"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Pilih Preset Desain Siap Pakai:
                        </span>
                        <span className="text-xs font-semibold text-blue-600 flex items-center gap-1">
                          1-Click Generate <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[
                          { id: 'tech', title: 'Tech Summit' },
                          { id: 'lomba', title: 'Hackathon ID' },
                          { id: 'fest', title: 'Campus Fest' }
                        ].map((tpl) => (
                          <div
                            key={tpl.id}
                            onClick={() => setActiveTemplate(tpl.id as any)}
                            className={`cursor-pointer rounded-xl p-3.5 border transition-all text-left ${
                              activeTemplate === tpl.id
                                ? 'border-blue-600 bg-blue-50/40 ring-2 ring-blue-500/20 shadow-md'
                                : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                            }`}
                          >
                            <div className="h-16 w-full rounded-lg bg-slate-100 border border-slate-200/60 mb-2.5" />
                            <h4 className="text-sm font-bold text-slate-900">{tpl.title}</h4>
                            <p className="text-[11px] text-slate-500 mt-0.5">Lengkap formulir &amp; jadwal</p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 2 PREVIEW: Visual Builder & Form Toggles */}
                  {activeStep === 1 && (
                    <motion.div
                      key="step-1"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-500 uppercase tracking-wider">
                          Konfigurasi Blok &amp; Formulir Pendaftaran:
                        </span>
                        <span className="text-slate-400">Klik untuk mengaktifkan field</span>
                      </div>

                      <div className="space-y-2">
                        {formFields.map((field) => (
                          <div
                            key={field.id}
                            onClick={() => toggleField(field.id)}
                            className={`cursor-pointer rounded-xl p-3 border flex items-center justify-between transition-all ${
                              field.enabled
                                ? 'border-blue-500 bg-blue-50/40 shadow-xs'
                                : 'border-slate-200 bg-slate-50/60 opacity-60'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`h-5 w-5 rounded-md flex items-center justify-center text-xs font-bold transition-colors ${
                                  field.enabled
                                    ? 'bg-blue-600 text-white'
                                    : 'border border-slate-300 bg-white text-transparent'
                                }`}
                              >
                                ✓
                              </div>
                              <span className="text-xs sm:text-sm font-semibold text-slate-800">
                                {field.label}
                              </span>
                            </div>

                            <span className="text-[11px] font-mono text-slate-400">
                              {field.enabled ? 'Aktif' : 'Nonaktif'}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between text-xs text-emerald-800">
                        <span className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-emerald-600" />
                          <span>Penyimpanan Google Drive &amp; database terenkripsi otomatis</span>
                        </span>
                        <span className="font-mono font-bold text-emerald-700">Auto-Save</span>
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 3 PREVIEW: Published Card & Live Sharing */}
                  {activeStep === 2 && (
                    <motion.div
                      key="step-2"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-4"
                    >
                      {/* URL Box with 1-Click Copy */}
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                          {t.process.officialUrl}
                        </label>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs sm:text-sm font-mono text-blue-700 truncate shadow-2xs">
                            https://tech-summit.iventra.site
                          </div>
                          <button
                            type="button"
                            onClick={handleCopyLink}
                            className={`px-4 py-2 rounded-lg font-semibold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                              copied
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-900 text-white hover:bg-blue-600 active:scale-95'
                            }`}
                          >
                            {copied ? (
                              <>
                                <Check className="h-3.5 w-3.5" />
                                <span>{t.process.linkCopied}</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3.5 w-3.5" />
                                <span>{t.process.copyLink}</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Live Metrics: Realtime Visitor & Spreadsheet */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-xl border border-slate-200/90 bg-white p-3 flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                            <TrendingUp className="h-5 w-5" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-900 block">{t.process.realtimeVisitor}</span>
                            <span className="text-[11px] text-slate-500">{t.process.visitorSub}</span>
                          </div>
                        </div>

                        <div className="rounded-xl border border-slate-200/90 bg-white p-3 flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                            <Check className="h-5 w-5" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-900 block">{t.process.spreadsheet}</span>
                            <span className="text-[11px] text-slate-500">{t.process.spreadsheetSub}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Bottom Step Switcher Pills */}
              <div className="pt-6 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">
                  {t.process.tahap} <span className="font-bold text-blue-600">{activeStep + 1}</span> {t.process.dari} 3
                </span>
                <div className="flex gap-1.5">
                  {[0, 1, 2].map((idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveStep(idx)}
                      className={`h-2 rounded-full transition-all cursor-pointer ${
                        activeStep === idx
                          ? 'w-7 bg-blue-600'
                          : 'w-2 bg-slate-200 hover:bg-slate-300'
                      }`}
                      aria-label={`Buka Langkah ${idx + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
