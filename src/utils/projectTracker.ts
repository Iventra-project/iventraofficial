export interface TrackStep {
  id: number;
  title: string;
  desc: string;
  status: 'completed' | 'current' | 'upcoming';
  dateCompleted?: string;
}

export interface ProjectData {
  id: string;
  eventName: string;
  organization: string;
  packageType: string;
  statusBadge: string;
  currentStepIndex: number; // 1-4
  registeredCount: number;
  targetCount: number;
  whatsappRemindersSent: number;
  certificatesReady: boolean;
  steps: TrackStep[];
  updatedAt: string;
}

export const DEMO_PROJECTS: Record<string, ProjectData> = {
  'IVN-2025-FTUI': {
    id: 'IVN-2025-FTUI',
    eventName: 'Engineering Career & Tech Expo 2025',
    organization: 'BEM FT Universitas Indonesia',
    packageType: 'Flow (Multi-Stage Competition)',
    statusBadge: 'Event Berjalan',
    currentStepIndex: 3,
    registeredCount: 1420,
    targetCount: 1500,
    whatsappRemindersSent: 1420,
    certificatesReady: true,
    updatedAt: 'Hari ini, 10:45 WIB',
    steps: [
      { id: 1, title: 'Konsultasi & Kebutuhan', desc: 'Brief alur seleksi & form pendaftaran', status: 'completed', dateCompleted: '12 Okt 2025' },
      { id: 2, title: 'Setup & Custom Branding', desc: 'Deploy domain & integrasi logo institusi', status: 'completed', dateCompleted: '14 Okt 2025' },
      { id: 3, title: 'Event Berjalan & Presensi', desc: 'Scan QR tiket & live analytics panitia', status: 'current' },
      { id: 4, title: 'Laporan & LPJ Otomatis', desc: 'Ekspor rekap kehadiran & e-sertifikat', status: 'upcoming' }
    ]
  },
  'IVN-2025-UGM': {
    id: 'IVN-2025-UGM',
    eventName: 'National Student Business Case Competition',
    organization: 'BEM KM Universitas Gadjah Mada',
    packageType: 'Flow (Penjurian Terpusat)',
    statusBadge: 'Penjurian Berkas',
    currentStepIndex: 2,
    registeredCount: 450,
    targetCount: 500,
    whatsappRemindersSent: 450,
    certificatesReady: false,
    updatedAt: 'Kemarin, 16:20 WIB',
    steps: [
      { id: 1, title: 'Konsultasi & Kebutuhan', desc: 'Diskusi format proposal & rubrik nilai', status: 'completed', dateCompleted: '18 Okt 2025' },
      { id: 2, title: 'Setup & Custom Branding', desc: 'Portal juri dan upload berkas tim', status: 'current' },
      { id: 3, title: 'Event Berjalan & Presensi', desc: 'Presentasi finalis & penilaian live', status: 'upcoming' },
      { id: 4, title: 'Laporan & LPJ Otomatis', desc: 'Pengumuman juara & sertifikat digital', status: 'upcoming' }
    ]
  },
  'IVN-2025-TEDX': {
    id: 'IVN-2025-TEDX',
    eventName: 'TEDxYouth Innovation Summit',
    organization: 'TEDx Kampus Komunitas',
    packageType: 'Spark + WA Bot Reminder',
    statusBadge: 'Selesai & LPJ',
    currentStepIndex: 4,
    registeredCount: 820,
    targetCount: 800,
    whatsappRemindersSent: 820,
    certificatesReady: true,
    updatedAt: '20 Okt 2025',
    steps: [
      { id: 1, title: 'Konsultasi & Kebutuhan', desc: 'Pemilihan tema & alur tiket masuk', status: 'completed', dateCompleted: '01 Okt 2025' },
      { id: 2, title: 'Setup & Custom Branding', desc: 'Landing page tiket ber-barcode unik', status: 'completed', dateCompleted: '04 Okt 2025' },
      { id: 3, title: 'Event Berjalan & Presensi', desc: 'Gate scanner lancar tanpa antre', status: 'completed', dateCompleted: '15 Okt 2025' },
      { id: 4, title: 'Laporan & LPJ Otomatis', desc: 'Laporan keuangan & sertifikat terbit', status: 'completed', dateCompleted: '16 Okt 2025' }
    ]
  }
};

export function lookupProject(id: string): ProjectData | null {
  const normalized = id.trim().toUpperCase();
  return DEMO_PROJECTS[normalized] || null;
}
