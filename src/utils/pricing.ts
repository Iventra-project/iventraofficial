export interface PackageInfo {
  id: 'spark' | 'flow' | 'bot';
  name: string;
  badge?: string;
  isPopular?: boolean;
  tagline: string;
  priceLabel: string;
  priceNote: string;
  basePrice: number;
  tags: string[];
  features: string[];
  idealFor: string;
}

export const PACKAGES: Record<string, PackageInfo> = {
  spark: {
    id: 'spark',
    name: 'Spark',
    badge: 'Self-Service',
    isPopular: false,
    tagline: 'Untuk event simpel & cepat tanpa repot seperti webinar, seminar, & talkshow kampus.',
    priceLabel: 'Rp 150rb - 300rb',
    priceNote: '/ event',
    basePrice: 200000,
    tags: ['Form custom', 'Pendaftaran', 'Self-service'],
    features: [
      'Form pendaftaran kustom instan',
      'Integrasi data peserta ke Spreadsheet',
      'Konfirmasi pendaftaran otomatis via email',
      'Dashboard statistik pendaftar',
      'Support panitia standar'
    ],
    idealFor: 'Webinar, Seminar Nasional, & Talkshow Kampus'
  },
  flow: {
    id: 'flow',
    name: 'Flow',
    badge: 'Pilihan Utama',
    isPopular: true,
    tagline: 'Untuk kompetisi & event bertingkat multi-tahap dengan seleksi ketat dan penilaian terpusat.',
    priceLabel: 'Mulai Rp 500.000',
    priceNote: '/ event',
    basePrice: 500000,
    tags: ['Dashboard', 'Penjurian', 'Sertifikat'],
    features: [
      'Alur seleksi berkas multi-tahap',
      'Dashboard panitia & dewan juri khusus',
      'Sistem skoring & rekap nilai otomatis',
      'E-sertifikat instan ber-QR code',
      'Landing page branding eksklusif kampus',
      'Support teknis prioritas 24/7'
    ],
    idealFor: 'Lomba Ilmiah, Business Plan, Hackathon, & Olimpiade Kampus'
  },
  bot: {
    id: 'bot',
    name: 'Bot',
    badge: 'WhatsApp Engine',
    isPopular: false,
    tagline: 'WhatsApp reminder bot otomatis H-1, tiket barcode, pengingat jadwal, dan FAQ 24/7 resmi.',
    priceLabel: 'Rp 70.000',
    priceNote: '/ event',
    basePrice: 70000,
    tags: ['Reminder', 'Auto-reply FAQ', 'Pesan sambutan'],
    features: [
      'Pengiriman tiket ber-QR otomatis via WA',
      'Broadcast pengingat H-1 dan H-0',
      'Auto-reply chatbot FAQ kepanitiaan',
      'Format pesan kustom nama peserta',
      'Report deliverability real-time'
    ],
    idealFor: 'Semua event yang membutuhkan reminder & ticketing praktis'
  }
};

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(amount);
}

export interface ConsultationFormData {
  name: string;
  campus: string;
  eventName: string;
  planId: 'spark' | 'flow' | 'bot' | 'custom';
  estimatedParticipants: number;
  contactNumber: string;
  notes?: string;
}

export function validateConsultationForm(data: Partial<ConsultationFormData>): {
  isValid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  if (!data.name || data.name.trim().length < 2) {
    errors.name = 'Nama kontak wajib diisi (minimal 2 karakter)';
  }
  if (!data.campus || data.campus.trim().length < 2) {
    errors.campus = 'Organisasi / Nama Kampus wajib diisi';
  }
  if (!data.eventName || data.eventName.trim().length < 2) {
    errors.eventName = 'Nama event wajib diisi';
  }
  if (!data.contactNumber || data.contactNumber.trim().length < 9) {
    errors.contactNumber = 'Nomor WhatsApp aktif wajib diisi (minimal 9 digit)';
  }
  if (!data.estimatedParticipants || data.estimatedParticipants < 10) {
    errors.estimatedParticipants = 'Estimasi peserta minimal 10 orang';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

export function generateWhatsAppMessage(data: ConsultationFormData): string {
  const planName = data.planId === 'custom' ? 'Kustomisasi Khusus' : PACKAGES[data.planId]?.name || data.planId;
  const message = [
    `*Halo Tim Iventra!* Saya ingin konsultasi sistem event kampus 🚀`,
    ``,
    `*Nama Panitia:* ${data.name}`,
    `*Organisasi / Kampus:* ${data.campus}`,
    `*Nama Acara:* ${data.eventName}`,
    `*Paket Diminati:* ${planName}`,
    `*Estimasi Peserta:* ${data.estimatedParticipants} orang`,
    `*No. WhatsApp:* ${data.contactNumber}`,
    data.notes ? `*Catatan Tambahan:* ${data.notes}` : ``,
    ``,
    `Mohon info alur kolaborasi dan ketersediaan jadwal setup. Terima kasih!`
  ].filter(Boolean).join('\n');

  return encodeURIComponent(message);
}
