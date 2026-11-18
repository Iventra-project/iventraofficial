export type TemplateId = 'blank' | 'tech-summit' | 'campus-competition' | 'creative-fest';

export type EventBlockType =
  | 'hero'
  | 'text'
  | 'timeline'
  | 'form'
  | 'prizes'
  | 'speakers'
  | 'tickets'
  | 'faq'
  | 'contact';

export interface FormFieldItem {
  id: string;
  label: string;
  type: 'text' | 'paragraph' | 'email' | 'whatsapp' | 'select' | 'radio' | 'file';
  placeholder?: string;
  required: boolean;
  options?: string[]; // for select/radio
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
    return config.blocks;
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
      isOnline: config.isOnline
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
      fields: [
        { id: 'f-1', label: 'Nama Lengkap / Tim', type: 'text', required: true, placeholder: 'Masukkan nama Anda atau nama tim' },
        { id: 'f-2', label: 'Email Ketua / Kontak', type: 'email', required: true, placeholder: 'email@domain.com' },
        { id: 'f-3', label: 'Nomor WhatsApp', type: 'whatsapp', required: true, placeholder: '081234567890' },
        { id: 'f-4', label: 'Institusi / Universitas', type: 'text', required: false, placeholder: 'Nama kampus atau instansi' },
        { id: 'f-5', label: 'Kategori Acara', type: 'select', required: true, options: ['Umum', 'Mahasiswa', 'Pelajar'] }
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
  // ─── 0. BLANK CANVAS (KOSONGAN - GOOGLE FORMS STYLE) ──────────────────────────
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
      statusBadgeText: 'Pendaftaran Dibuka',
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
            formType: 'internal',
            externalUrl: '',
            fields: [
              { id: 'f-1', label: 'Nama Lengkap', type: 'text', required: true, placeholder: 'Masukkan nama lengkap Anda' },
              { id: 'f-2', label: 'Email', type: 'email', required: true, placeholder: 'nama@email.com' },
              { id: 'f-3', label: 'Nomor WhatsApp', type: 'whatsapp', required: true, placeholder: '081234567890' }
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
      statusBadgeText: 'Pendaftaran Dibuka',
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
            badgeText: 'Pendaftaran Dibuka',
            isOnline: true
          }
        },
        {
          id: 'ts-text',
          type: 'text',
          title: 'Tentang Konferensi',
          subtitle: 'Membuka Wawasan Inovasi Digital Mahasiswa',
          enabled: true,
          data: {
            content: 'Konferensi tahunan mahasiswa terdepan menghadirkan pakar industri kecerdasan buatan, cloud computing, dan rekayasa perangkat lunak se-Indonesia. Bergabunglah bersama ratusan delegasi dari berbagai universitas untuk mendiskusikan terobosan teknologi terkini.'
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
              { id: 't-1', name: 'Pendaftaran Early Bird', description: 'Registrasi peserta kuota terbatas dengan potongan biaya.', startDate: '01 Okt 2026', endDate: '10 Okt 2026', order: 1, status: 'completed' },
              { id: 't-2', name: 'Pendaftaran Reguler & Verifikasi', description: 'Batas akhir pendaftaran peserta umum dan verifikasi data.', startDate: '11 Okt 2026', endDate: '20 Okt 2026', order: 2, status: 'active', isRegistrationStage: true },
              { id: 't-3', name: 'Hari-H Konferensi & Keynote', description: 'Sesi plenary dan panel diskusi bersama pembicara tamu.', startDate: '24 Okt 2026', endDate: '24 Okt 2026', order: 3, status: 'upcoming' },
              { id: 't-4', name: 'Distribusi E-Sertifikat', description: 'Penerbitan e-sertifikat resmi dan materi.', startDate: '26 Okt 2026', endDate: '28 Okt 2026', order: 4, status: 'upcoming' }
            ]
          }
        },
        {
          id: 'ts-speakers',
          type: 'speakers',
          title: 'Pembicara Tamu & Panelis Ahli',
          subtitle: 'Praktisi teknologi, VP Engineering, dan Founder Startup Indonesia',
          enabled: true,
          data: {
            items: [
              { id: 'sp-1', name: 'Bambang Sudarmono, M.Sc.', role: 'Head of Applied AI Research', companyOrCampus: 'Nusantara AI Labs', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', topic: 'Peluang LLM Lokal dalam Layanan Publik' },
              { id: 'sp-2', name: 'Farah Anindita', role: 'VP of Engineering', companyOrCampus: 'Fintech Maju Bersama', avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80', topic: 'Arsitektur Cloud Resilient Skala Jutaan Pengguna' }
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
            buttonText: 'Daftar Sekarang (Gratis)',
            formType: 'internal',
            externalUrl: '',
            fields: [
              { id: 'f-1', label: 'Nama Lengkap (untuk E-Sertifikat)', type: 'text', required: true, placeholder: 'Nama lengkap beserta gelar jika ada' },
              { id: 'f-2', label: 'Email Aktif', type: 'email', required: true, placeholder: 'nama@instansi.ac.id' },
              { id: 'f-3', label: 'Nomor WhatsApp Aktif', type: 'whatsapp', required: true, placeholder: '081234567890' },
              { id: 'f-4', label: 'Asal Kampus / Instansi', type: 'text', required: true, placeholder: 'Universitas Indonesia' },
              { id: 'f-5', label: 'Jalur Kehadiran', type: 'select', required: true, options: ['Offline (Auditorium Utama)', 'Online (Zoom Webinar)'] }
            ]
          }
        },
        {
          id: 'ts-faq',
          type: 'faq',
          title: 'Pertanyaan Seputar Konferensi (FAQ)',
          subtitle: 'Informasi teknis kehadiran, sertifikat, dan materi acara',
          enabled: true,
          data: {
            items: [
              { id: 'faq-1', question: 'Apakah peserta akan mendapatkan sertifikat resmi?', answer: 'Ya, seluruh peserta yang hadir minimal 80% sesi dan mengisi presensi akan menerima e-sertifikat ber-SK resmi.' },
              { id: 'faq-2', question: 'Apakah acara ini berbayar atau gratis?', answer: 'Konferensi ini 100% gratis didukung oleh sponsor dan kampus penyelenggara.' }
            ]
          }
        },
        {
          id: 'ts-contact',
          type: 'contact',
          title: 'Kontak Panitia',
          subtitle: 'Hubungi narahubung resmi untuk pertanyaan kemitraan dan informasi teknis',
          enabled: true,
          data: {
            committeeName: 'Sekretariat BEM Fasilkom UI',
            email: 'sekretariat@techsummit.id',
            whatsappNumber: '6281234567890',
            whatsappText: 'Halo Panitia Summit, saya ingin bertanya perihal pendaftaran.',
            instagramUrl: 'https://instagram.com/iventra.id',
            linkedinUrl: 'https://linkedin.com/company/iventra',
            youtubeUrl: 'https://youtube.com/@iventra'
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
      description: 'Ajang kompetisi studi kasus bisnis bergengsi tingkat nasional memperebutkan total hadiah 45 Juta Rupiah serta kesempatan fast-track interview magang.',
      institutionName: 'Management Student Society (MSS)',
      logoUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=160&auto=format&fit=crop&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=1200&auto=format&fit=crop&q=80',
      eventDateText: 'Pendaftaran Dibuka s/d 15 November 2026',
      eventLocationText: 'Online Preliminary & Grand Final di Jakarta',
      isOnline: false,
      statusBadgeText: 'Pendaftaran Tim Dibuka',
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
            dateText: 'Pendaftaran Dibuka s/d 15 November 2026',
            locationText: 'Online Preliminary & Grand Final di Jakarta',
            bannerUrl: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=1200&auto=format&fit=crop&q=80',
            badgeText: 'Pendaftaran Tim Dibuka',
            isOnline: false
          }
        },
        {
          id: 'cc-prizes',
          type: 'prizes',
          title: 'Total Hadiah & Apresiasi Juara',
          subtitle: 'Total Hadiah Rp 45.000.000 + Sertifikat & Fast Track Magang',
          enabled: true,
          data: {
            items: [
              { id: 'cat-1', title: 'Juara 1 (Main Winner)', targetAudience: 'Juara Utama Nasional', description: 'Uang Tunai Rp 20.000.000 + Piala Bergilir + Fast-track internship program.', prizePool: 'Rp 20.000.000', badge: 'Juara 1' },
              { id: 'cat-2', title: 'Juara 2 (Runner Up)', targetAudience: 'Peringkat Kedua', description: 'Uang Tunai Rp 12.000.000 + Plakat Penghargaan + E-Sertifikat.', prizePool: 'Rp 12.000.000', badge: 'Juara 2' },
              { id: 'cat-3', title: 'Juara 3 & Best Presentation', targetAudience: 'Peringkat Ketiga & Presentasi', description: 'Uang Tunai Rp 8.000.000 + Merchandise Eksklusif + Rekomendasi Karir.', prizePool: 'Rp 8.000.000', badge: 'Juara 3' }
            ]
          }
        },
        {
          id: 'cc-timeline',
          type: 'timeline',
          title: 'Tahapan Kompetisi & Seleksi',
          subtitle: 'Perhatikan jadwal rilis studi kasus dan batas akhir submisi proposal',
          enabled: true,
          data: {
            items: [
              { id: 'c-t1', name: 'Pendaftaran Tim & Download Case', description: 'Registrasi data tim dan unduh dokumen studi kasus resmi.', startDate: '01 Nov 2026', endDate: '15 Nov 2026', order: 1, status: 'active', isRegistrationStage: true },
              { id: 'c-t2', name: 'Batas Pengumpulan Executive Summary', description: 'Submisi berkas proposal PDF maksimal 10 halaman.', startDate: '16 Nov 2026', endDate: '25 Nov 2026', order: 2, status: 'upcoming' },
              { id: 'c-t3', name: 'Pengumuman 10 Finalis Nasional', description: 'Penetapan 10 tim terbaik untuk maju ke babak presentasi juri.', startDate: '30 Nov 2026', endDate: '30 Nov 2026', order: 3, status: 'upcoming' },
              { id: 'c-t4', name: 'Grand Final Pitching & Awarding', description: 'Presentasi langsung di hadapan dewan juri C-level eksekutif.', startDate: '12 Des 2026', endDate: '12 Des 2026', order: 4, status: 'upcoming' }
            ]
          }
        },
        {
          id: 'cc-form',
          type: 'form',
          title: 'Formulir Pendaftaran Tim',
          subtitle: 'Pastikan 1 tim beranggotakan 3 mahasiswa aktif dari perguruan tinggi yang sama',
          enabled: true,
          data: {
            buttonText: 'Submit Pendaftaran Tim',
            formType: 'internal',
            externalUrl: '',
            fields: [
              { id: 'f-1', label: 'Nama Tim', type: 'text', required: true, placeholder: 'Contoh: Tim Sinergi Solusi' },
              { id: 'f-2', label: 'Nama Ketua Tim', type: 'text', required: true, placeholder: 'Nama lengkap ketua' },
              { id: 'f-3', label: 'Email Ketua Tim', type: 'email', required: true, placeholder: 'ketua@kampus.ac.id' },
              { id: 'f-4', label: 'WhatsApp Ketua Tim', type: 'whatsapp', required: true, placeholder: '081234567890' },
              { id: 'f-5', label: 'Asal Universitas', type: 'text', required: true, placeholder: 'Universitas Gadjah Mada' },
              { id: 'f-6', label: 'Link Drive Berkas KTM / Bukti Mahasiswa Aktif', type: 'text', required: true, placeholder: 'https://drive.google.com/...' }
            ]
          }
        },
        {
          id: 'cc-faq',
          type: 'faq',
          title: 'Pertanyaan Seputar Kompetisi',
          subtitle: 'Kriteria peserta, anggota lintas jurusan, dan format proposal',
          enabled: true,
          data: {
            items: [
              { id: 'cc-faq1', question: 'Apakah anggota tim boleh berasal dari jurusan yang berbeda?', answer: 'Ya, sangat dianjurkan! Anggota tim boleh berasal dari fakultas atau program studi berbeda selama dalam satu universitas yang sama.' },
              { id: 'cc-faq2', question: 'Bagaimana format pengumpulan proposal awal?', answer: 'Proposal dikumpulkan dalam format PDF maksimal 10 halaman (tidak termasuk lampiran) menggunakan font standar.' }
            ]
          }
        },
        {
          id: 'cc-contact',
          type: 'contact',
          title: 'Helpdesk Panitia Lomba',
          subtitle: 'Saluran bantuan dan pertanyaan seputar rulebook kompetisi',
          enabled: true,
          data: {
            committeeName: 'Panitia Nusantara Business Case 2026',
            email: 'helpdesk@casechallenge.id',
            whatsappNumber: '6285566778899',
            whatsappText: 'Halo Panitia Case Challenge, saya ingin menanyakan perihal ketentuan anggota tim.',
            instagramUrl: 'https://instagram.com/iventra.id',
            linkedinUrl: 'https://linkedin.com/company/iventra',
            youtubeUrl: 'https://youtube.com/@iventra'
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
      description: 'Panggung seni dan musik terbesar di lingkungan kampus menampilkan deretan musisi indie papan atas, festival kuliner UMKM, serta pameran instalasi seni interaktif.',
      institutionName: 'Dewan Kesenian & BEM Mahasiswa',
      logoUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=160&auto=format&fit=crop&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1200&auto=format&fit=crop&q=80',
      eventDateText: 'Jumat - Minggu, 20-22 November 2026',
      eventLocationText: 'Lapangan Terbuka Kampus Utama',
      isOnline: false,
      statusBadgeText: 'Tiket Presale Segera Tersedia',
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
            tagline: 'Merayakan Ekspresi Seni, Budaya Kreatif, dan Harmoni Musik Generasi Muda',
            dateText: 'Jumat - Minggu, 20-22 November 2026',
            locationText: 'Lapangan Terbuka Kampus Utama',
            bannerUrl: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1200&auto=format&fit=crop&q=80',
            badgeText: 'Tiket Presale Segera Tersedia',
            isOnline: false
          }
        },
        {
          id: 'cf-speakers',
          type: 'speakers',
          title: 'Lineup Guest Star & Musisi',
          subtitle: 'Penampil utama panggung spektakuler Gelora Mahakarya',
          enabled: true,
          data: {
            items: [
              { id: 'guest-1', name: 'The Nusantara Echo', role: 'Indie Rock Ensemble', companyOrCampus: 'Guest Star Utama Hari ke-1', avatarUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop&q=80', topic: 'Live Concert Stage' },
              { id: 'guest-2', name: 'Suara Senja Collective', role: 'Folk & Pop Harmonies', companyOrCampus: 'Guest Star Hari ke-2', avatarUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&auto=format&fit=crop&q=80', topic: 'Acoustic Sunset Session' }
            ]
          }
        },
        {
          id: 'cf-form',
          type: 'form',
          title: 'Formulir Reservasi Tiket',
          subtitle: 'Amankan e-voucher festival sebelum kuota harian habis',
          enabled: true,
          data: {
            buttonText: 'Pesan Tiket Sekarang',
            formType: 'internal',
            externalUrl: '',
            fields: [
              { id: 'f-1', label: 'Nama Pemesan', type: 'text', required: true, placeholder: 'Nama sesuai KTP/KTM' },
              { id: 'f-2', label: 'Email Pengiriman Tiket', type: 'email', required: true, placeholder: 'email@anda.com' },
              { id: 'f-3', label: 'Nomor WhatsApp', type: 'whatsapp', required: true, placeholder: '081234567890' },
              { id: 'f-4', label: 'Kategori Tiket', type: 'select', required: true, options: ['Presale 1 (Rp 45.000)', 'Presale 2 (Rp 65.000)', '3-Days All Pass (Rp 120.000)'] }
            ]
          }
        },
        {
          id: 'cf-faq',
          type: 'faq',
          title: 'Panduan Penonton & Pengunjung',
          subtitle: 'Hal penting seputar penukaran tiket fisik dan tata tertib venue',
          enabled: true,
          data: {
            items: [
              { id: 'faq-f1', question: 'Bagaimana mekanisme penukaran tiket barcode menjadi gelang festival?', answer: 'Penukaran gelang dapat dilakukan di Gate Barat mulai H-1 acara dengan menunjukkan e-voucher QR Code.' },
              { id: 'faq-f2', question: 'Apakah boleh membawa kamera profesional?', answer: 'Pengunjung umum diperbolehkan membawa smartphone. Kamera profesional memerlukan ID Badge Media resmi panitia.' }
            ]
          }
        },
        {
          id: 'cf-contact',
          type: 'contact',
          title: 'Helpdesk Tiket Festival',
          subtitle: 'Pertanyaan seputar penukaran tiket dan akses disabilitas',
          enabled: true,
          data: {
            committeeName: 'Sekretariat Panitia Creative & Art Festival 2026',
            email: 'info@fest-mahasiswa.org',
            whatsappNumber: '6289988776655',
            whatsappText: 'Halo Panitia Festival, saya ingin bertanya perihal tiket.',
            instagramUrl: 'https://instagram.com/iventra.id',
            linkedinUrl: 'https://linkedin.com/company/iventra',
            youtubeUrl: 'https://youtube.com/@iventra'
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
