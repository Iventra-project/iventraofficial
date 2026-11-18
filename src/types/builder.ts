export type TemplateId = 'blank' | 'tech-summit' | 'campus-competition' | 'creative-fest';

export type EventBlockType =
  | 'hero'
  | 'buttons'
  | 'text'
  | 'timeline'
  | 'form'
  | 'prizes'
  | 'speakers'
  | 'gallery'
  | 'tickets'
  | 'faq'
  | 'contact';

export interface GalleryImageItem {
  id: string;
  url: string;
  caption?: string;
  size?: 'normal' | 'featured';
}

export interface HeroButton {
  id: string;
  enabled: boolean;
  label: string;
  targetType: 'block' | 'url';
  targetBlockId?: string;
  url?: string;
}

export type FormFieldType = 'text' | 'image' | 'choice';

export interface FormFieldItem {
  id: string;
  label: string;
  type: FormFieldType;
  placeholder?: string;
  required: boolean;
  options?: string[]; // for choice (pilihan ganda)
}

export interface FormStep {
  id: string;
  title: string;
  fields: FormFieldItem[];
}

export interface EventBlock {
  id: string;
  type: EventBlockType;
  title: string;
  subtitle?: string;
  description?: string;
  enabled: boolean;
  data: any; // Type-specific configuration
}

export interface TimelineItem {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  order: number;
  status: 'upcoming' | 'active' | 'completed';
  isRegistrationStage?: boolean;
}

export interface SpeakerItem {
  id: string;
  name: string;
  role: string;
  companyOrCampus: string;
  avatarUrl: string;
  topic?: string;
}

export interface CategoryItem {
  id: string;
  title: string;
  targetAudience: string;
  description: string;
  prizePool?: string;
  badge?: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface WebsitePhase {
  id: string;
  name: string;
  scheduledDate?: string; // YYYY-MM-DD
  statusBadge?: string;
  headlineOverride?: string;
  taglineOverride?: string;
  active?: boolean;
  blocks?: EventBlock[];
}

export interface EventConfig {
  // General & Hero
  eventName: string;
  tagline: string;
  description: string;
  institutionName: string;
  logoUrl: string;
  bannerUrl: string;
  eventDateText: string;
  eventLocationText: string;
  isOnline: boolean;
  statusBadgeText: string;

  // Website Scheduling Phases (Fase 1, Fase 2, dst)
  enablePhases?: boolean;
  phases?: WebsitePhase[];
  activePhaseId?: string;

  // The sequential list of modular blocks (Google Forms Architecture)
  blocks?: EventBlock[];

  // Theme & Appearance
  theme: {
    primaryColor: string;
    accentColor: string;
    bgStyle: 'clean-white' | 'subtle-gradient' | 'dark-modern' | 'campus-emerald';
    fontFamily: 'sans' | 'display' | 'mono';
  };

  // Legacy properties (preserved for backward-compatibility)
  timeline?: {
    enabled: boolean;
    sectionTitle: string;
    sectionSubtitle: string;
    items: TimelineItem[];
  };

  registration?: {
    enabled: boolean;
    buttonText: string;
    formType: 'external' | 'internal';
    externalUrl: string;
    deadlineNotice: string;
    closedNotice: string;
    linkedTimelineId?: string;
  };

  speakers?: {
    enabled: boolean;
    sectionTitle: string;
    sectionSubtitle: string;
    items: SpeakerItem[];
  };

  categories?: {
    enabled: boolean;
    sectionTitle: string;
    sectionSubtitle: string;
    items: CategoryItem[];
  };

  faq?: {
    enabled: boolean;
    sectionTitle: string;
    sectionSubtitle: string;
    items: FaqItem[];
  };

  contact?: {
    committeeName: string;
    email: string;
    whatsappNumber: string;
    whatsappText: string;
    instagramUrl: string;
    linkedinUrl: string;
    youtubeUrl: string;
  };
}

export interface TemplateDefinition {
  id: TemplateId;
  name: string;
  badge: string;
  category: string;
  description: string;
  previewGradient: string;
  recommendedFor: string;
  defaultConfig: EventConfig;
}

export function ensureConfigBlocks(config: EventConfig): EventBlock[] {
  if (config.blocks && Array.isArray(config.blocks) && config.blocks.length > 0) {
    // Normalization for blocks with steps
    return config.blocks.map((block) => {
      if (block.type === 'form') {
        const data = block.data || {};
        if (!data.steps || !Array.isArray(data.steps) || data.steps.length === 0) {
          const rawFields: FormFieldItem[] = (data.fields || []).map((f: any) => ({
            id: f.id || `f-${Date.now()}`,
            label: f.label || 'Pertanyaan',
            type: f.type === 'file' ? 'image' : f.type === 'select' || f.type === 'radio' ? 'choice' : 'text',
            placeholder: f.placeholder || '',
            required: !!f.required,
            options: f.options || (f.type === 'select' ? ['Opsi 1', 'Opsi 2'] : undefined)
          }));
          return {
            ...block,
            data: {
              ...data,
              steps: [
                {
                  id: 'step-1',
                  title: 'Alur 1',
                  fields: rawFields.length > 0 ? rawFields : [
                    { id: 'f-1', label: 'Nama Lengkap', type: 'text', required: true, placeholder: 'Nama Anda' },
                    { id: 'f-2', label: 'Email', type: 'text', required: true, placeholder: 'email@domain.com' }
                  ]
                }
              ],
              openMode: data.openMode || 'same-page',
              hideFromMainPage: !!data.hideFromMainPage
            }
          };
        }
      }
      if (block.type === 'hero' || block.type === 'buttons') {
        const data = block.data || {};
        if (!data.buttons || !Array.isArray(data.buttons)) {
          return {
            ...block,
            data: {
              ...data,
              buttons: [
                {
                  id: 'btn-1',
                  enabled: true,
                  label: 'Daftar Sekarang',
                  targetType: 'block',
                  targetBlockId: 'block-form'
                }
              ]
            }
          };
        }
      }
      return block;
    });
  }

  const blocks: EventBlock[] = [];

  // 1. Hero Block
  blocks.push({
    id: 'block-hero',
    type: 'hero',
    title: config.eventName || 'Hero Banner & Judul',
    subtitle: config.tagline || '',
    enabled: true,
    data: {
      headline: config.eventName,
      tagline: config.tagline,
      dateText: config.eventDateText,
      locationText: config.eventLocationText,
      bannerUrl: config.bannerUrl,
      badgeText: config.statusBadgeText,
      isOnline: config.isOnline,
      buttons: [
        {
          id: 'btn-1',
          enabled: true,
          label: 'Daftar Sekarang',
          targetType: 'block',
          targetBlockId: 'block-form'
        }
      ]
    }
  });

  // 2. Description / Text block
  if (config.description) {
    blocks.push({
      id: 'block-text-intro',
      type: 'text',
      title: 'Tentang Acara',
      subtitle: 'Informasi dan latar belakang kegiatan',
      enabled: true,
      data: {
        content: config.description
      }
    });
  }

  // 3. Timeline
  if (config.timeline?.items?.length) {
    blocks.push({
      id: 'block-timeline',
      type: 'timeline',
      title: config.timeline.sectionTitle || 'Alur & Jadwal Kegiatan',
      subtitle: config.timeline.sectionSubtitle || 'Tahapan penting pelaksanaan kegiatan',
      enabled: config.timeline.enabled ?? true,
      data: {
        items: config.timeline.items
      }
    });
  }

  // 4. Categories / Hadiah
  if (config.categories?.items?.length) {
    blocks.push({
      id: 'block-prizes',
      type: 'prizes',
      title: config.categories.sectionTitle || 'Kategori & Total Hadiah',
      subtitle: config.categories.sectionSubtitle || '',
      enabled: config.categories.enabled ?? true,
      data: {
        items: config.categories.items
      }
    });
  }

  // 5. Speakers
  if (config.speakers?.items?.length) {
    blocks.push({
      id: 'block-speakers',
      type: 'speakers',
      title: config.speakers.sectionTitle || 'Pembicara & Juri',
      subtitle: config.speakers.sectionSubtitle || '',
      enabled: config.speakers.enabled ?? true,
      data: {
        items: config.speakers.items
      }
    });
  }

  // 6. Registration Form
  blocks.push({
    id: 'block-form',
    type: 'form',
    title: 'Formulir Pendaftaran',
    subtitle: 'Silakan isi formulir di bawah ini untuk pendaftaran peserta',
    enabled: config.registration?.enabled ?? true,
    data: {
      buttonText: config.registration?.buttonText || 'Kirim Pendaftaran',
      formType: config.registration?.formType || 'internal',
      externalUrl: config.registration?.externalUrl || '',
      openMode: 'same-page',
      hideFromMainPage: false,
      steps: [
        {
          id: 'step-1',
          title: 'Alur 1',
          fields: [
            { id: 'f-1', label: 'Nama Lengkap / Tim', type: 'text', required: true, placeholder: 'Masukkan nama Anda atau nama tim' },
            { id: 'f-2', label: 'Email Ketua / Kontak', type: 'text', required: true, placeholder: 'email@domain.com' },
            { id: 'f-3', label: 'Nomor WhatsApp', type: 'text', required: true, placeholder: '081234567890' },
            { id: 'f-4', label: 'Kategori Acara', type: 'choice', required: true, options: ['Umum', 'Mahasiswa', 'Pelajar'] }
          ]
        }
      ]
    }
  });

  // 7. FAQ
  if (config.faq?.items?.length) {
    blocks.push({
      id: 'block-faq',
      type: 'faq',
      title: config.faq.sectionTitle || 'Pertanyaan yang Sering Diajukan',
      subtitle: config.faq.sectionSubtitle || '',
      enabled: config.faq.enabled ?? true,
      data: {
        items: config.faq.items
      }
    });
  }

  // 8. Contact
  if (config.contact) {
    blocks.push({
      id: 'block-contact',
      type: 'contact',
      title: 'Hubungi Panitia',
      subtitle: 'Narahubung resmi dan saluran komunikasi',
      enabled: true,
      data: config.contact
    });
  }

  return blocks;
}

export const SPARK_TEMPLATES: TemplateDefinition[] = [
  // ─── 0. BLANK CANVAS ─────────────────────────────────────────────────────────
  {
    id: 'blank',
    name: 'Blank Canvas (Kosongan)',
    badge: 'Mulai dari Nol',
    category: 'Formulir Bebas',
    description: 'Halaman kosong tanpa blok bawaan, seperti membuat formulir Google Form baru. Tambahkan fitur judul, formulir, rundown, dan komponen sesuka Anda.',
    previewGradient: 'from-slate-100 via-slate-200 to-slate-300',
    recommendedFor: 'Event Kustom, Formulir Pendaftaran Bebas, Acara Mandiri',
    defaultConfig: {
      eventName: 'Untitled Event',
      tagline: '',
      description: 'Deskripsi acara dan petunjuk pendaftaran peserta.',
      institutionName: '',
      logoUrl: '',
      bannerUrl: '',
      eventDateText: '',
      eventLocationText: '',
      isOnline: false,
      statusBadgeText: '',
      theme: {
        primaryColor: '#1f2de6',
        accentColor: '#3b47dc',
        bgStyle: 'clean-white',
        fontFamily: 'sans'
      },
      blocks: [
        {
          id: 'block-b1',
          type: 'form',
          title: 'Formulir Pendaftaran',
          subtitle: 'Silakan isi data berikut untuk mendaftar',
          enabled: true,
          data: {
            buttonText: 'Kirim Pendaftaran',
            openMode: 'same-page',
            hideFromMainPage: false,
            steps: [
              {
                id: 'step-1',
                title: 'Alur 1',
                fields: [
                  { id: 'f-1', label: 'Nama Lengkap', type: 'text', required: true, placeholder: 'Masukkan nama lengkap Anda' },
                  { id: 'f-2', label: 'Email', type: 'text', required: true, placeholder: 'nama@email.com' }
                ]
              }
            ]
          }
        }
      ]
    }
  },

  // ─── 1. TECH SUMMIT ──────────────────────────────────────────────────────────
  {
    id: 'tech-summit',
    name: 'Academic & Tech Summit',
    badge: 'Paling Populer',
    category: 'Seminar & Konferensi',
    description: 'Desain modern bernuansa tech indigo untuk konferensi ilmiah, tech talk, dan seminar nasional kampus.',
    previewGradient: 'from-[#0c1df3] via-[#3b47dc] to-[#1e1b4b]',
    recommendedFor: 'Seminar Nasional, Tech Talk, Webinar, Hackathon',
    defaultConfig: {
      eventName: 'National Tech Innovation Summit 2026',
      tagline: 'Membangun Ekosistem Digital Berkelanjutan Melalui Inovasi Mahasiswa',
      description: 'Konferensi tahunan mahasiswa terdepan menghadirkan pakar industri kecerdasan buatan, cloud computing, dan rekayasa perangkat lunak se-Indonesia.',
      institutionName: 'BEM Fakultas Teknik & Ilmu Komputer',
      logoUrl: 'https://images.unsplash.com/photo-1592280771190-3e2e4d571952?w=160&auto=format&fit=crop&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80',
      eventDateText: 'Sabtu, 24 Oktober 2026 • 08.30 - 16.00 WIB',
      eventLocationText: 'Auditorium Utama & Hybrid Zoom Meeting',
      isOnline: true,
      statusBadgeText: '',
      theme: {
        primaryColor: '#0c1df3',
        accentColor: '#3b47dc',
        bgStyle: 'subtle-gradient',
        fontFamily: 'sans'
      },
      blocks: [
        {
          id: 'ts-hero',
          type: 'hero',
          title: 'Hero Banner & Judul',
          subtitle: '',
          enabled: true,
          data: {
            headline: 'National Tech Innovation Summit 2026',
            tagline: 'Membangun Ekosistem Digital Berkelanjutan Melalui Inovasi Mahasiswa',
            dateText: 'Sabtu, 24 Oktober 2026 • 08.30 - 16.00 WIB',
            locationText: 'Auditorium Utama & Hybrid Zoom Meeting',
            bannerUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80',
            badgeText: '',
            buttons: [
              { id: 'btn-1', enabled: true, label: 'Daftar Sekarang', targetType: 'block', targetBlockId: 'ts-form' },
              { id: 'btn-2', enabled: true, label: 'Lihat Jadwal', targetType: 'block', targetBlockId: 'ts-timeline' }
            ]
          }
        },
        {
          id: 'ts-text',
          type: 'text',
          title: 'Tentang Konferensi',
          subtitle: 'Membuka Wawasan Inovasi Digital Mahasiswa',
          enabled: true,
          data: {
            content: 'Konferensi tahunan mahasiswa terdepan menghadirkan pakar industri kecerdasan buatan, cloud computing, dan rekayasa perangkat lunak se-Indonesia.'
          }
        },
        {
          id: 'ts-timeline',
          type: 'timeline',
          title: 'Alur & Jadwal Kegiatan',
          subtitle: 'Tahapan penting pelaksanaan kegiatan yang perlu diperhatikan peserta',
          enabled: true,
          data: {
            items: [
              { id: 't-1', name: 'Pendaftaran Early Bird', description: 'Registrasi peserta kuota terbatas.', startDate: '01 Okt 2026', endDate: '10 Okt 2026', order: 1, status: 'completed' },
              { id: 't-2', name: 'Pendaftaran Reguler', description: 'Batas akhir pendaftaran.', startDate: '11 Okt 2026', endDate: '20 Okt 2026', order: 2, status: 'active', isRegistrationStage: true }
            ]
          }
        },
        {
          id: 'ts-form',
          type: 'form',
          title: 'Formulir Registrasi Peserta',
          subtitle: 'Pendaftaran bebas biaya untuk seluruh mahasiswa & umum',
          enabled: true,
          data: {
            buttonText: 'Kirim Pendaftaran',
            openMode: 'same-page',
            hideFromMainPage: false,
            steps: [
              {
                id: 'step-1',
                title: 'Alur 1',
                fields: [
                  { id: 'f-1', label: 'Nama Lengkap', type: 'text', required: true, placeholder: 'Nama lengkap Anda' },
                  { id: 'f-2', label: 'Email Aktif', type: 'text', required: true, placeholder: 'nama@domain.ac.id' },
                  { id: 'f-3', label: 'Jalur Kehadiran', type: 'choice', required: true, options: ['Offline (Auditorium)', 'Online (Zoom)'] }
                ]
              }
            ]
          }
        }
      ]
    }
  },

  // ─── 2. CAMPUS COMPETITION ───────────────────────────────────────────────────
  {
    id: 'campus-competition',
    name: 'National Campus Competition',
    badge: 'Lomba & Hackathon',
    category: 'Kompetisi Mahasiswa',
    description: 'Format dinamis terfokus pada tahapan seleksi proposal, pengumpulan berkas, timeline bertingkat, dan total hadiah.',
    previewGradient: 'from-[#059669] via-[#10b981] to-[#064e3b]',
    recommendedFor: 'Business Case, Hackathon, LKTIN, UI/UX Design, Debat',
    defaultConfig: {
      eventName: 'Nusantara Business Case Challenge 2026',
      tagline: 'Memecahkan Masalah Industri Riil Melalui Strategi Bisnis Berkelanjutan',
      description: 'Ajang kompetisi studi kasus bisnis bergengsi tingkat nasional memperebutkan total hadiah 45 Juta Rupiah.',
      institutionName: 'Management Student Society (MSS)',
      logoUrl: '',
      bannerUrl: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=1200&auto=format&fit=crop&q=80',
      eventDateText: 'Pendaftaran Dibuka s/d 15 November 2026',
      eventLocationText: 'Online Preliminary & Grand Final di Jakarta',
      isOnline: false,
      statusBadgeText: '',
      theme: {
        primaryColor: '#059669',
        accentColor: '#10b981',
        bgStyle: 'clean-white',
        fontFamily: 'sans'
      },
      blocks: [
        {
          id: 'cc-hero',
          type: 'hero',
          title: 'Hero Banner & Hadiah',
          subtitle: '',
          enabled: true,
          data: {
            headline: 'Nusantara Business Case Challenge 2026',
            tagline: 'Memecahkan Masalah Industri Riil Melalui Strategi Bisnis Berkelanjutan',
            buttons: [
              { id: 'btn-1', enabled: true, label: 'Daftar Tim Sekarang', targetType: 'block', targetBlockId: 'cc-form' }
            ]
          }
        },
        {
          id: 'cc-form',
          type: 'form',
          title: 'Formulir Pendaftaran Tim',
          subtitle: 'Pendaftaran 1 tim beranggotakan 3 mahasiswa',
          enabled: true,
          data: {
            buttonText: 'Submit Pendaftaran Tim',
            openMode: 'same-page',
            hideFromMainPage: false,
            steps: [
              {
                id: 'step-1',
                title: 'Alur 1',
                fields: [
                  { id: 'f-1', label: 'Nama Tim', type: 'text', required: true, placeholder: 'Contoh: Tim Garuda' },
                  { id: 'f-2', label: 'Email Ketua', type: 'text', required: true, placeholder: 'ketua@kampus.ac.id' }
                ]
              }
            ]
          }
        }
      ]
    }
  },

  // ─── 3. CREATIVE FEST ────────────────────────────────────────────────────────
  {
    id: 'creative-fest',
    name: 'Creative & Art Campus Fest',
    badge: 'Festival & Seni',
    category: 'Dies Natalis & Pentas Seni',
    description: 'Visual dinamis, penuh warna, dan energik cocok untuk festival musik kampus, pameran seni rupa, dan bazaar kreatif.',
    previewGradient: 'from-[#ec4899] via-[#8b5cf6] to-[#3b82f6]',
    recommendedFor: 'Pensi Musik, Pameran Seni, Dies Natalis, Bazaar Kampus',
    defaultConfig: {
      eventName: 'Gelora Mahakarya Festival 2026',
      tagline: 'Merayakan Ekspresi Seni, Budaya Kreatif, dan Harmoni Musik Generasi Muda',
      description: 'Panggung seni dan musik terbesar di lingkungan kampus menampilkan deretan musisi indie.',
      institutionName: 'Dewan Kesenian & BEM Mahasiswa',
      logoUrl: '',
      bannerUrl: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1200&auto=format&fit=crop&q=80',
      eventDateText: 'Jumat - Minggu, 20-22 November 2026',
      eventLocationText: 'Lapangan Terbuka Kampus Utama',
      isOnline: false,
      statusBadgeText: '',
      theme: {
        primaryColor: '#ec4899',
        accentColor: '#8b5cf6',
        bgStyle: 'dark-modern',
        fontFamily: 'display'
      },
      blocks: [
        {
          id: 'cf-hero',
          type: 'hero',
          title: 'Hero Festival',
          subtitle: '',
          enabled: true,
          data: {
            headline: 'Gelora Mahakarya Festival 2026',
            tagline: 'Merayakan Ekspresi Seni dan Harmoni Musik',
            buttons: [
              { id: 'btn-1', enabled: true, label: 'Beli Tiket', targetType: 'block', targetBlockId: 'cf-form' }
            ]
          }
        },
        {
          id: 'cf-form',
          type: 'form',
          title: 'Formulir Reservasi Tiket',
          subtitle: 'Amankan e-voucher festival sebelum kuota habis',
          enabled: true,
          data: {
            buttonText: 'Pesan Tiket Sekarang',
            openMode: 'same-page',
            hideFromMainPage: false,
            steps: [
              {
                id: 'step-1',
                title: 'Alur 1',
                fields: [
                  { id: 'f-1', label: 'Nama Pemesan', type: 'text', required: true, placeholder: 'Nama sesuai KTP/KTM' },
                  { id: 'f-2', label: 'Email Tiket', type: 'text', required: true, placeholder: 'email@anda.com' }
                ]
              }
            ]
          }
        }
      ]
    }
  }
];

export function getTemplateById(id: string): TemplateDefinition {
  const found = SPARK_TEMPLATES.find((t) => t.id === id);
  return found || SPARK_TEMPLATES[0];
}
