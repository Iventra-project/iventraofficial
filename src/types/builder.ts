export type TemplateId =
  | 'blank'
  | 'tech-summit'
  | 'campus-competition'
  | 'creative-fest'
  | 'workshop-bootcamp'
  | 'career-expo'
  | 'charity-volunteer'
  | string;

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

export interface FormPaymentConfig {
  enabled: boolean;
  price?: string;
  qrCodeUrl?: string;
  bankInfo?: string;
  verificationEmailRequired?: boolean;
}

export interface FormStep {
  id: string;
  title: string;
  type?: 'standard' | 'payment';
  payment?: FormPaymentConfig;
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
    bgStyle: 'clean-white' | 'subtle-gradient' | 'dark-modern' | 'campus-emerald' | 'custom';
    bgColor?: string;
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
  if (Array.isArray(config.blocks)) {
    if (config.blocks.length === 0) {
      return [];
    }
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

export const BLANK_TEMPLATE: TemplateDefinition = {
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
    blocks: []
  }
};

export const SPARK_TEMPLATES: TemplateDefinition[] = [
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
      logoUrl: '',
      bannerUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
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
            bannerUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
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
      bannerUrl: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=1200&auto=format&fit=crop&q=80',
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
          id: 'cc-timeline',
          type: 'timeline',
          title: 'Tahapan Kompetisi',
          subtitle: 'Rangkaian seleksi dari tahap proposal hingga grand final',
          enabled: true,
          data: {
            items: [
              { id: 't-1', name: 'Submisi Proposal', description: 'Pengunggahan berkas proposal bisnis.', startDate: '01 Nov 2026', endDate: '15 Nov 2026', order: 1, status: 'active', isRegistrationStage: true },
              { id: 't-2', name: 'Pengumuman Finalis', description: 'Top 10 tim melaju ke babak pitching.', startDate: '20 Nov 2026', endDate: '20 Nov 2026', order: 2, status: 'upcoming' },
              { id: 't-3', name: 'Grand Final Pitching', description: 'Presentasi langsung di hadapan dewan juri.', startDate: '28 Nov 2026', endDate: '29 Nov 2026', order: 3, status: 'upcoming' }
            ]
          }
        },
        {
          id: 'cc-form',
          type: 'form',
          title: 'Formulir Pendaftaran Tim',
          subtitle: 'Pendaftaran 1 tim beranggotakan 3 mahasiswa aktif',
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
                  { id: 'f-1', label: 'Nama Tim', type: 'text', required: true, placeholder: 'Contoh: Tim Garuda Inovasi' },
                  { id: 'f-2', label: 'Email Ketua', type: 'text', required: true, placeholder: 'ketua@kampus.ac.id' },
                  { id: 'f-3', label: 'Asal Perguruan Tinggi', type: 'text', required: true, placeholder: 'Universitas / Institut' }
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
      description: 'Panggung seni dan musik terbesar di lingkungan kampus menampilkan deretan musisi indie dan pameran instalasi seni.',
      institutionName: 'Dewan Kesenian & BEM Mahasiswa',
      logoUrl: '',
      bannerUrl: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=1200&auto=format&fit=crop&q=80',
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
              { id: 'btn-1', enabled: true, label: 'Beli Tiket Sekarang', targetType: 'block', targetBlockId: 'cf-form' }
            ]
          }
        },
        {
          id: 'cf-text',
          type: 'text',
          title: 'Tentang Festival',
          subtitle: 'Pengalaman Seni & Musik Imersif',
          enabled: true,
          data: {
            content: 'Perayaan seni lintas disiplin menghadirkan konser live musik, mural live painting, dan pasar kreatif kriya mahasiswa.'
          }
        },
        {
          id: 'cf-form',
          type: 'form',
          title: 'Formulir Reservasi Tiket',
          subtitle: 'Amankan e-voucher festival resmi sebelum kuota presale habis',
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
                  { id: 'f-2', label: 'Email Tiket', type: 'text', required: true, placeholder: 'email@anda.com' },
                  { id: 'f-3', label: 'Kategori Tiket', type: 'choice', required: true, options: ['Presale 1 (Rp 45.000)', 'VIP Pass + Merchandise (Rp 95.000)'] }
                ]
              }
            ]
          }
        }
      ]
    }
  },

  // ─── 4. WORKSHOP & BOOTCAMP ──────────────────────────────────────────────────
  {
    id: 'workshop-bootcamp',
    name: 'Interactive Workshop & Masterclass',
    badge: 'Hands-on Lab',
    category: 'Workshop & Pelatihan',
    description: 'Format fokus instruksional untuk kelas intensif koding, desain UI/UX, data science, dan workshop teknis interaktif.',
    previewGradient: 'from-[#0284c7] via-[#0ea5e9] to-[#0369a1]',
    recommendedFor: 'Bootcamp Koding, UI/UX Masterclass, Pelatihan Bisnis, Sertifikasi',
    defaultConfig: {
      eventName: 'Fullstack & AI Engineering Masterclass 2026',
      tagline: 'Pelatihan Praktis Intensif Membangun Aplikasi Skalabel Berbasis AI Agent',
      description: 'Program akselerasi kompetensi digital 2 hari bersama principal engineer industri teknologi papan atas.',
      institutionName: 'Himpunan Mahasiswa Informatika & Komputer',
      logoUrl: '',
      bannerUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&auto=format&fit=crop&q=80',
      eventDateText: 'Sabtu - Minggu, 14-15 November 2026 • 09.00 - 16.30 WIB',
      eventLocationText: 'Lab Komputasi Gedung Baru & Online Zoom Room',
      isOnline: true,
      statusBadgeText: '',
      theme: {
        primaryColor: '#0284c7',
        accentColor: '#0ea5e9',
        bgStyle: 'clean-white',
        fontFamily: 'sans'
      },
      blocks: [
        {
          id: 'wb-hero',
          type: 'hero',
          title: 'Hero Workshop',
          subtitle: '',
          enabled: true,
          data: {
            headline: 'Fullstack & AI Engineering Masterclass 2026',
            tagline: 'Pelatihan Praktis Intensif Membangun Aplikasi Skalabel Berbasis AI Agent',
            dateText: 'Sabtu - Minggu, 14-15 November 2026 • 09.00 - 16.30 WIB',
            locationText: 'Lab Komputasi Gedung Baru & Online Zoom Room',
            bannerUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&auto=format&fit=crop&q=80',
            buttons: [
              { id: 'btn-1', enabled: true, label: 'Daftar Kelas Sekarang', targetType: 'block', targetBlockId: 'wb-form' }
            ]
          }
        },
        {
          id: 'wb-timeline',
          type: 'timeline',
          title: 'Silabus & Materi Workshop',
          subtitle: 'Jadwal pembelajaran kurikulum industri terstruktur selama dua hari',
          enabled: true,
          data: {
            items: [
              { id: 't-1', name: 'Hari 1: Modern Fullstack Architecture', description: 'State management, edge computing, dan clean backend REST/GraphQL.', startDate: '14 Nov 2026', endDate: '14 Nov 2026', order: 1, status: 'active' },
              { id: 't-2', name: 'Hari 2: Autonomous AI Agents & Production', description: 'Implementasi model LLM, tool calling, vector database, dan deployment CI/CD.', startDate: '15 Nov 2026', endDate: '15 Nov 2026', order: 2, status: 'upcoming' }
            ]
          }
        },
        {
          id: 'wb-form',
          type: 'form',
          title: 'Formulir Pendaftaran Peserta',
          subtitle: 'Kuota terbatas hanya untuk 60 peserta terpilih',
          enabled: true,
          data: {
            buttonText: 'Amankan Kursi Pelatihan',
            openMode: 'same-page',
            hideFromMainPage: false,
            steps: [
              {
                id: 'step-1',
                title: 'Alur 1',
                fields: [
                  { id: 'f-1', label: 'Nama Lengkap', type: 'text', required: true, placeholder: 'Nama lengkap untuk e-sertifikat' },
                  { id: 'f-2', label: 'Email Utama', type: 'text', required: true, placeholder: 'email@domain.com' },
                  { id: 'f-3', label: 'Tingkat Kemampuan Koding', type: 'choice', required: true, options: ['Pemula (Dasar)', 'Menengah (Fullstack)', 'Mahir / Praktisi'] }
                ]
              }
            ]
          }
        }
      ]
    }
  },

  // ─── 5. CAREER FAIR & EXPO ───────────────────────────────────────────────────
  {
    id: 'career-expo',
    name: 'Campus Career Fair & Expo',
    badge: 'Walk-in Interview',
    category: 'Bursa Kerja & Karir',
    description: 'Tata letak elegan bernuansa profesional untuk bursa lowongan kerja kampus, expo industri, dan rekrutmen magang nasional.',
    previewGradient: 'from-[#7c3aed] via-[#8b5cf6] to-[#4c1d95]',
    recommendedFor: 'Job Fair Kampus, Internship Expo, Info Session Perusahaan, Rekrutmen BUMN',
    defaultConfig: {
      eventName: 'National University Career & Internship Fair 2026',
      tagline: 'Membuka Gerbang Karir Emas Bersama 50+ Perusahaan Multinasional Terkemuka',
      description: 'Pusat rekrutmen karir dan magang terintegrasi menghubungkan mahasiswa tingkat akhir dan alumni muda dengan para perekrut industri.',
      institutionName: 'Career Development Center (CDC)',
      logoUrl: '',
      bannerUrl: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=1200&auto=format&fit=crop&q=80',
      eventDateText: 'Rabu - Kamis, 02-03 Desember 2026 • 09.00 - 17.00 WIB',
      eventLocationText: 'Exhibition Hall Kampus Pusat & Portal Online',
      isOnline: false,
      statusBadgeText: '',
      theme: {
        primaryColor: '#7c3aed',
        accentColor: '#8b5cf6',
        bgStyle: 'subtle-gradient',
        fontFamily: 'sans'
      },
      blocks: [
        {
          id: 'ce-hero',
          type: 'hero',
          title: 'Hero Job Fair',
          subtitle: '',
          enabled: true,
          data: {
            headline: 'National University Career & Internship Fair 2026',
            tagline: 'Membuka Gerbang Karir Emas Bersama 50+ Perusahaan Multinasional Terkemuka',
            dateText: 'Rabu - Kamis, 02-03 Desember 2026 • 09.00 - 17.00 WIB',
            locationText: 'Exhibition Hall Kampus Pusat & Portal Online',
            bannerUrl: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=1200&auto=format&fit=crop&q=80',
            buttons: [
              { id: 'btn-1', enabled: true, label: 'Klaim E-Pass Pengunjung', targetType: 'block', targetBlockId: 'ce-form' }
            ]
          }
        },
        {
          id: 'ce-text',
          type: 'text',
          title: 'Petunjuk & Persiapan Berkas',
          subtitle: 'Persyaratan wajib bagi pengunjung bursa karir',
          enabled: true,
          data: {
            content: 'Peserta diharapkan membawa CV cetak atau tautan CV digital, mengenakan pakaian formal rapi, dan menyimpan QR Code tiket masuk yang diterbitkan sistem.'
          }
        },
        {
          id: 'ce-form',
          type: 'form',
          title: 'Formulir Tiket Masuk Pengunjung',
          subtitle: 'Registrasi gratis bagi seluruh mahasiswa aktif dan fresh graduate',
          enabled: true,
          data: {
            buttonText: 'Dapatkan QR Pass Masuk',
            openMode: 'same-page',
            hideFromMainPage: false,
            steps: [
              {
                id: 'step-1',
                title: 'Alur 1',
                fields: [
                  { id: 'f-1', label: 'Nama Lengkap', type: 'text', required: true, placeholder: 'Nama sesuai identitas' },
                  { id: 'f-2', label: 'Email Pengunjung', type: 'text', required: true, placeholder: 'email@alumni.ac.id' },
                  { id: 'f-3', label: 'Bidang Karir Minat', type: 'choice', required: true, options: ['Teknologi & Engineering', 'Finance & Accounting', 'Marketing & Sales', 'Human Resources & General'] }
                ]
              }
            ]
          }
        }
      ]
    }
  },

  // ─── 6. SOCIAL & CHARITY MOVEMENT ─────────────────────────────────────────────
  {
    id: 'charity-volunteer',
    name: 'Social Movement & Volunteer Gathering',
    badge: 'Aksi Nyata',
    category: 'Sosial & Volunteer',
    description: 'Format berjiwa sosial dan komunitas untuk penggalangan relawan muda, aksi lingkungan, ekspedisi mengajar, dan bakti sosial.',
    previewGradient: 'from-[#ea580c] via-[#f97316] to-[#c2410c]',
    recommendedFor: 'Open Recruitment Relawan, Ekspedisi Mengajar, Program Bakti Sosial, Gerakan Peduli Lingkungan',
    defaultConfig: {
      eventName: 'Ekspedisi Relawan Mengajar Nusantara 2026',
      tagline: 'Langkah Nyata Pemuda Memajukan Pendidikan dan Literasi Anak Bangsa',
      description: 'Gerakan pengabdian masyarakat mengajak generasi muda untuk terjun langsung membimbing adik-adik di daerah pelosok.',
      institutionName: 'Komunitas Peduli Literasi & BEM Universitas',
      logoUrl: '',
      bannerUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1200&auto=format&fit=crop&q=80',
      eventDateText: 'Pendaftaran Relawan: 10 - 25 Desember 2026',
      eventLocationText: 'Pemberangkatan: Wilayah Indonesia Timur',
      isOnline: false,
      statusBadgeText: '',
      theme: {
        primaryColor: '#ea580c',
        accentColor: '#f97316',
        bgStyle: 'clean-white',
        fontFamily: 'sans'
      },
      blocks: [
        {
          id: 'cv-hero',
          type: 'hero',
          title: 'Hero Relawan',
          subtitle: '',
          enabled: true,
          data: {
            headline: 'Ekspedisi Relawan Mengajar Nusantara 2026',
            tagline: 'Langkah Nyata Pemuda Memajukan Pendidikan dan Literasi Anak Bangsa',
            dateText: 'Pendaftaran Relawan: 10 - 25 Desember 2026',
            locationText: 'Pemberangkatan: Wilayah Indonesia Timur',
            bannerUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1200&auto=format&fit=crop&q=80',
            buttons: [
              { id: 'btn-1', enabled: true, label: 'Gabung Jadi Relawan', targetType: 'block', targetBlockId: 'cv-form' }
            ]
          }
        },
        {
          id: 'cv-timeline',
          type: 'timeline',
          title: 'Alur Seleksi Relawan',
          subtitle: 'Tahapan seleksi calon relawan sebelum masa pembekalan dan pemberangkatan',
          enabled: true,
          data: {
            items: [
              { id: 't-1', name: 'Pendaftaran Berkas', description: 'Pengisian form dan esai motivasi.', startDate: '10 Des 2026', endDate: '25 Des 2026', order: 1, status: 'active', isRegistrationStage: true },
              { id: 't-2', name: 'Wawancara & FGD', description: 'Uji komitmen dan diskusi kelompok.', startDate: '28 Des 2026', endDate: '30 Des 2026', order: 2, status: 'upcoming' },
              { id: 't-3', name: 'Pembekalan & Pelepasan', description: 'Pelatihan pedagogik dan kesiapan fisik.', startDate: '05 Jan 2027', endDate: '08 Jan 2027', order: 3, status: 'upcoming' }
            ]
          }
        },
        {
          id: 'cv-form',
          type: 'form',
          title: 'Formulir Seleksi Relawan',
          subtitle: 'Tunjukkan kepedulian dan aksi nyatamu untuk perubahan positif',
          enabled: true,
          data: {
            buttonText: 'Kirim Formulir Relawan',
            openMode: 'same-page',
            hideFromMainPage: false,
            steps: [
              {
                id: 'step-1',
                title: 'Alur 1',
                fields: [
                  { id: 'f-1', label: 'Nama Lengkap', type: 'text', required: true, placeholder: 'Nama lengkap' },
                  { id: 'f-2', label: 'Nomor WhatsApp', type: 'text', required: true, placeholder: '08xxxxxxxxxx' },
                  { id: 'f-3', label: 'Divisi Relawan Minat', type: 'choice', required: true, options: ['Divisi Pengajar Kreatif', 'Divisi Medis & P3K', 'Divisi Dokumentasi & Media', 'Divisi Logistik & Dapur'] }
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
  if (id === 'blank') {
    return BLANK_TEMPLATE;
  }
  const found = SPARK_TEMPLATES.find((t) => t.id === id);
  return found || SPARK_TEMPLATES[0];
}
