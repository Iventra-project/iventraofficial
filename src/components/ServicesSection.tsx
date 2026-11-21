import { Pricing, type PricingPlan } from './ui/pricing';
import { useLanguage } from '../context/LanguageContext.tsx';

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
  onOpenSparkProCheckout?: () => void;
  onOpenExpertConsultation?: () => void;
  prices?: ServicesPrices;
}

export default function ServicesSection({ onSelectPlan, onOpenSparkProCheckout, onOpenExpertConsultation, prices }: ServicesSectionProps) {
  const { t } = useLanguage();

  const plans: PricingPlan[] = [
    {
      name: 'Iventra Spark',
      price: 'Gratis',
      period: '',
      priceNote: '',
      features: [
        '1.000 Kuota Trafik / Minggu',
        'Akses hingga 5 Workspace',
        'Akses 11 Fitur Unik Pembuatan Web',
        'Akses Seluruh Koleksi Template',
        'Publikasi Website Gratis',
        'Dashboard Admin Terintegrasi',
        'Akses Integrasi Pembayaran 1x'
      ],
      buttonText: t.services.sparkBtn || 'Pakai Gratis Sekarang',
      href: '#dashboard'
    },
    {
      name: 'Iventra Spark Pro',
      price: 'Rp 150.000',
      period: '/ bulan',
      priceNote: '',
      features: [
        '10.000 Kuota Trafik / Minggu',
        'Akses hingga 30 Workspace',
        'Akses Lengkap Seluruh Fitur Pro',
        'Termasuk Semua Fitur Iventra Spark',
        'Dukungan Domain Kustom Sendiri',
        'Sistem E-Tiket & Scanner QR Code',
        'Notifikasi WhatsApp Blast Otomatis'
      ],
      isPopular: true,
      buttonText: t.services.proBtn || 'Pilih Spark Pro',
      onClick: () => {
        if (onOpenSparkProCheckout) {
          onOpenSparkProCheckout();
        } else {
          window.location.hash = '#spark-pro-checkout';
        }
      }
    },
    {
      name: 'Iventra Expert',
      price: 'Konsultasi',
      period: '',
      priceNote: '',
      features: [
        'Desain Kustom Eksklusif Tim UI/UX',
        'Kapasitas Trafik & Peserta Tanpa Batas',
        'Integrasi Payment Gateway Multi-bank',
        'Sistem Scanner QR On-Site Panitia',
        'Dedicated Project Manager & On-Site Support'
      ],
      buttonText: t.services.expertBtn || 'Hubungi Tim Expert',
      onClick: () => {
        if (onOpenExpertConsultation) {
          onOpenExpertConsultation();
        } else {
          window.location.hash = '#expert-consultation';
        }
      }
    }
  ];

  return (
    <Pricing
      plans={plans}
      title={t.services.title}
      description={t.services.description}
    />
  );
}
