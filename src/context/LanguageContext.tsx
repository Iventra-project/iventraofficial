import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'id' | 'en';

export interface Translations {
  nav: {
    overview: string;
    services: string;
    features: string;
    process: string;
    login: string;
    consultation: string;
  };
  hero: {
    headline1: string;
    headlineHighlight: string;
    headline2: string;
    subtitle: string;
    ctaPrimary: string;
    ctaSecondary: string;
    trustSetup: string;
    trustTicket: string;
    trustedBy: string;
  };
  services: {
    eyebrow: string;
    title: string;
    description: string;
    sparkLabel: string;
    sparkDesc: string;
    sparkBtn: string;
    proLabel: string;
    proDesc: string;
    proBtn: string;
    popularBadge: string;
    expertLabel: string;
    expertDesc: string;
    expertBtn: string;
  };
  comparison: {
    eyebrow: string;
    title: string;
    description: string;
    card1Title: string;
    card1Desc: string;
    card2Title: string;
    card2Desc: string;
    card3Title: string;
    card3Desc: string;
    card3Pill: string;
    card4Title: string;
    card4Desc: string;
    card4Metric: string;
  };
  process: {
    eyebrow: string;
    title: string;
    description: string;
    step1Title: string;
    step1Desc: string;
    step2Title: string;
    step2Desc: string;
    step3Title: string;
    step3Desc: string;
    copyLink: string;
    linkCopied: string;
    officialUrl: string;
    realtimeVisitor: string;
    visitorSub: string;
    spreadsheet: string;
    spreadsheetSub: string;
    tahap: string;
    dari: string;
  };
  cta: {
    title: string;
    description: string;
    btnStart: string;
    btnConsult: string;
  };
  footer: {
    stayConnected: string;
    newsletterDesc: string;
    quickLinks: string;
    contactUs: string;
    followUs: string;
    home: string;
    contactBtn: string;
    privacy: string;
    terms: string;
    cookie: string;
    rights: string;
  };
}

const translations: Record<Language, Translations> = {
  id: {
    nav: {
      overview: 'Overview',
      services: 'Layanan Iventra',
      features: 'Fitur Khusus',
      process: 'Alur Kerja',
      login: 'Masuk',
      consultation: 'Konsultasi Panitia Expert →'
    },
    hero: {
      headline1: 'Buat Website Event Profesional',
      headlineHighlight: 'Tanpa Koding,',
      headline2: 'Hitungan Menit.',
      subtitle: 'Dari kompetisi kampus, hackathon hingga konferensi internasional. Luncurkan landing page elegan dengan formulir kustom, verifikasi tiket otomatis, dan manajemen peserta terintegrasi.',
      ctaPrimary: 'Mulai Sekarang Gratis',
      ctaSecondary: 'Pelajari Layanan',
      trustSetup: 'Setup < 10 Menit',
      trustTicket: 'Terintegrasi Tiket & Validasi',
      trustedBy: 'Telah dipercaya oleh berbagai penyelenggara event & kampus terkemuka'
    },
    services: {
      eyebrow: 'LAYANAN IVENTRA',
      title: 'Pilihan Layanan Iventra',
      description: 'Bisa buat sendiri secara instan dengan builder mandiri, atau percayakan sepenuhnya kepada tim expert desainer & developer kami.',
      sparkLabel: 'MANDIRI',
      sparkDesc: 'Untuk panitia mandiri yang ingin meluncurkan website event cepat tanpa menunggu tim teknis.',
      sparkBtn: 'Pakai Gratis Sekarang',
      proLabel: 'SPARK PRO',
      proDesc: 'Solusi serba otomatis dengan fitur lanjutan untuk event komersial atau berskala nasional.',
      proBtn: 'Pilih Spark Pro',
      popularBadge: 'Paling Populer',
      expertLabel: 'FULL SERVICE',
      expertDesc: 'Percayakan seluruh website, integrasi pembayaran, hingga teknis live event pada tim engineer profesional.',
      expertBtn: 'Hubungi Tim Expert'
    },
    comparison: {
      eyebrow: 'KEUNGGULAN UTAMA',
      title: 'Kenapa Memilih Iventra?',
      description: 'Platform all-in-one yang dirancang khusus untuk ekosistem event kampus dan komunitas di Indonesia.',
      card1Title: 'Live Builder Modern',
      card1Desc: 'Desain visual intuitif untuk menyusun blok hero, timeline, dan deskripsi event secara real-time.',
      card2Title: 'Integrated Forms',
      card2Desc: 'Formulir pendaftaran cerdas bawaan dengan validasi berkas, upload proposal, dan link drive otomatis tanpa perlu Google Forms terpisah.',
      card3Title: 'Insight Data Otomatis',
      card3Desc: 'Dapatkan rekap data peserta, tren pendaftaran harian, dan metrik performa event secara otomatis tanpa perlu olah spreadsheet manual.',
      card3Pill: 'Sinkronisasi Data Real-Time',
      card4Title: 'Real-time Visitor & Conversion Analytics',
      card4Desc: 'Pantau berapa pengunjung yang melihat poster, membuka web, dan mengisi form secara real-time tanpa setup Google Analytics yang rumit.',
      card4Metric: 'Rata-rata Konversi Form'
    },
    process: {
      eyebrow: 'CARA KERJA CEPAT',
      title: 'Luncurkan Dalam Tiga Langkah Mudah',
      description: 'Daripada berminggu-minggu coding dari nol, aktifkan website event profesional Anda dalam hitungan menit.',
      step1Title: 'Pilih Template atau Request Custom',
      step1Desc: 'Pilih template siap pakai atau ajukan desain kustom.',
      step2Title: 'Kustomisasi Info, Form & Timeline',
      step2Desc: 'Atur jadwal, poster, dan form pendaftaran visual.',
      step3Title: 'Publish & Bagikan ke Calon Peserta',
      step3Desc: 'Publikasikan link resmi dan terima pendaftaran secara live.',
      copyLink: 'Salin Link',
      linkCopied: 'Tersalin!',
      officialUrl: 'Tautan Resmi Website Event:',
      realtimeVisitor: 'Realtime Visitor',
      visitorSub: 'Pantau Lalu Lintas Pengunjung',
      spreadsheet: 'Spreadsheet Live',
      spreadsheetSub: 'Ekspor CSV/Excel Seketika',
      tahap: 'Tahap',
      dari: 'dari'
    },
    cta: {
      title: 'Siap Meluncurkan Website Event Anda?',
      description: 'Mulai sekarang secara gratis dengan builder instan atau konsultasikan kebutuhan teknis event Anda bersama tim engineer kami.',
      btnStart: 'Mulai Sekarang Gratis',
      btnConsult: 'Konsultasi Panitia Expert'
    },
    footer: {
      stayConnected: 'Stay Connected',
      newsletterDesc: 'Dapatkan pembaruan fitur terbaru, tips peluncuran event kampus, dan penawaran eksklusif langsung di email Anda.',
      quickLinks: 'Quick Links',
      contactUs: 'Contact Us',
      followUs: 'Follow Us',
      home: 'Home / Overview',
      contactBtn: 'Hubungi Panitia',
      privacy: 'Privacy Policy',
      terms: 'Terms of Service',
      cookie: 'Cookie Settings',
      rights: 'All rights reserved.'
    }
  },
  en: {
    nav: {
      overview: 'Overview',
      services: 'Iventra Services',
      features: 'Key Features',
      process: 'How It Works',
      login: 'Sign In',
      consultation: 'Expert Event Consultation →'
    },
    hero: {
      headline1: 'Build Professional Event Websites',
      headlineHighlight: 'Without Coding,',
      headline2: 'In Minutes.',
      subtitle: 'From university competitions and hackathons to international conferences. Launch elegant landing pages with custom forms, automated ticket verification, and integrated attendee management.',
      ctaPrimary: 'Start for Free',
      ctaSecondary: 'Explore Services',
      trustSetup: 'Setup < 10 Minutes',
      trustTicket: 'Integrated Tickets & Validation',
      trustedBy: 'Trusted by leading event organizers & top universities'
    },
    services: {
      eyebrow: 'IVENTRA SERVICES',
      title: 'Explore Iventra Services',
      description: 'Build it yourself instantly with our visual builder, or entrust it completely to our expert design and engineering team.',
      sparkLabel: 'SELF-SERVE',
      sparkDesc: 'For independent organizers who want to launch event landing pages quickly without waiting for a technical team.',
      sparkBtn: 'Get Started Free',
      proLabel: 'SPARK PRO',
      proDesc: 'Fully automated solution with advanced features for commercial or national events.',
      proBtn: 'Choose Spark Pro',
      popularBadge: 'Most Popular',
      expertLabel: 'FULL SERVICE',
      expertDesc: 'Entrust the entire website, payment gateways, and technical live ops to professional engineers.',
      expertBtn: 'Contact Expert Team'
    },
    comparison: {
      eyebrow: 'KEY ADVANTAGES',
      title: 'Why Choose Iventra?',
      description: 'An all-in-one platform engineered specifically for university and community event ecosystems.',
      card1Title: 'Modern Live Builder',
      card1Desc: 'Intuitive visual layout builder to customize hero blocks, schedules, and event descriptions in real time.',
      card2Title: 'Integrated Forms',
      card2Desc: 'Built-in smart registration forms with file uploads, proposal reviews, and cloud storage without external tools.',
      card3Title: 'Automated Data Insights',
      card3Desc: 'Get attendee summaries, daily registration trends, and event performance metrics automatically without spreadsheets.',
      card3Pill: 'Real-Time Data Sync',
      card4Title: 'Real-time Visitor & Conversion Analytics',
      card4Desc: 'Track how many visitors view posters, open pages, and complete registrations in real time without complex setups.',
      card4Metric: 'Average Form Conversion'
    },
    process: {
      eyebrow: 'FAST WORKFLOW',
      title: 'Launch in Three Easy Steps',
      description: 'Instead of spending weeks coding from scratch, activate your professional event website in minutes.',
      step1Title: 'Pick a Template or Request Custom',
      step1Desc: 'Choose a ready-made template or submit a custom design request.',
      step2Title: 'Customize Info, Forms & Timeline',
      step2Desc: 'Configure schedules, banners, and visual registration forms.',
      step3Title: 'Publish & Share with Attendees',
      step3Desc: 'Publish your official link and receive live registrations.',
      copyLink: 'Copy Link',
      linkCopied: 'Copied!',
      officialUrl: 'Official Event Website Link:',
      realtimeVisitor: 'Realtime Visitor',
      visitorSub: 'Live Visitor Traffic Monitoring',
      spreadsheet: 'Live Spreadsheet',
      spreadsheetSub: 'Instant CSV / Excel Export',
      tahap: 'Step',
      dari: 'of'
    },
    cta: {
      title: 'Ready to Launch Your Event Website?',
      description: 'Start now for free with our instant builder or consult your event technical requirements with our engineering team.',
      btnStart: 'Start Building Now',
      btnConsult: 'Free Expert Consultation'
    },
    footer: {
      stayConnected: 'Stay Connected',
      newsletterDesc: 'Get the latest feature updates, campus event guides, and exclusive offers delivered straight to your inbox.',
      quickLinks: 'Quick Links',
      contactUs: 'Contact Us',
      followUs: 'Follow Us',
      home: 'Home / Overview',
      contactBtn: 'Contact Committee',
      privacy: 'Privacy Policy',
      terms: 'Terms of Service',
      cookie: 'Cookie Settings',
      rights: 'All rights reserved.'
    }
  }
};

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'id',
  setLang: () => {},
  t: translations.id
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    if (typeof window === 'undefined') return 'id';
    return (localStorage.getItem('iventra_lang') as Language) || 'id';
  });

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    try {
      localStorage.setItem('iventra_lang', newLang);
    } catch {}
  };

  const value = {
    lang,
    setLang,
    t: translations[lang]
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
