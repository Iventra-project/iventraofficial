import { Pricing, type PricingPlan } from './ui/pricing';

export interface ServicesPrices {
  sparkPrice?: string;
  sparkPriceNote?: string;
  flowPrice?: string;
  flowPriceNote?: string;
  botPrice?: string;
  botPriceNote?: string;
}

interface ServicesSectionProps {
  onSelectPlan: (planId: 'spark' | 'flow' | 'bot') => void;
  prices?: ServicesPrices;
}

export default function ServicesSection({ onSelectPlan, prices }: ServicesSectionProps) {
  const plans: PricingPlan[] = [
    {
      label: 'MANDIRI',
      name: 'Iventra Spark',
      price: 'Rp 0',
      period: '/ event',
      priceNote: 'Gratis selamanya untuk 1 event aktif',
      description: 'Untuk panitia mandiri yang ingin meluncurkan website event cepat tanpa menunggu tim teknis.',
      features: [
        '100+ Template Event Siap Pakai',
        'Live Dynamic Timeline & Stages',
        'Formulir Pendaftaran Terintegrasi',
        'Export Data Peserta ke Excel/CSV',
        'Subdomain iventra.site Resmi'
      ],
      buttonText: 'Pakai Gratis Sekarang',
      href: '#dashboard'
    },
    {
      label: 'SPARK PRO',
      name: 'Iventra Spark Pro',
      price: prices?.sparkPrice || 'Rp 149.000',
      period: prices?.sparkPriceNote || '/ event',
      priceNote: 'Bayar sekali saat event dipublikasikan',
      description: 'Solusi serba otomatis dengan fitur lanjutan untuk event komersial atau berskala nasional.',
      features: [
        'Semua fitur Spark Free',
        'Custom Domain (contoh: namaevent.com)',
        'Sistem E-Tiket Barcode & QR Scan',
        'WhatsApp Notifikasi Otomatis',
        'Unlimited Form Responses & Peserta',
        'Priority Server & Fast CDN Global'
      ],
      isPopular: true,
      buttonText: 'Pilih Spark Pro',
      href: '#dashboard'
    },
    {
      label: 'FULL SERVICE',
      name: 'Iventra Expert',
      price: 'Konsultasi',
      period: '/ custom brief',
      priceNote: 'Proposal & SLA pengerjaan dalam 24 jam',
      description: 'Percayakan seluruh website, integrasi pembayaran, hingga teknis live event pada tim engineer profesional.',
      features: [
        'Desain Kustom Unik dari Tim Desainer UI/UX',
        'Integrasi Payment Gateway (QRIS, BCA, VA)',
        'Sistem Scanner QR On-Site Panitia',
        'Custom Multi-tier Ticketing & Bundling',
        'Dedicated Project Manager & On-Site Support'
      ],
      buttonText: 'Hubungi Tim Expert',
      onClick: () => onSelectPlan('flow')
    }
  ];

  return (
    <Pricing
      plans={plans}
      eyebrow="PILIH MODEL EVENT"
      title="Pilih Cara Anda Menjalankan Event"
      description="Bisa buat sendiri secara instan dengan builder mandiri, atau percayakan sepenuhnya kepada tim expert desainer & developer kami."
    />
  );
}
