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
  prices?: ServicesPrices;
}

export default function ServicesSection({ onSelectPlan, prices }: ServicesSectionProps) {
  const { t } = useLanguage();

  const plans: PricingPlan[] = [
    {
      label: t.services.sparkLabel,
      name: 'Iventra Spark',
      price: 'Rp 0',
      period: '/ event',
      priceNote: 'Gratis selamanya untuk 1 event aktif',
      description: t.services.sparkDesc,
      features: [
        '100+ Template Event Siap Pakai',
        'Live Dynamic Timeline & Stages',
        'Formulir Pendaftaran Terintegrasi',
        'Export Data Peserta ke Excel/CSV',
        'Subdomain iventra.site Resmi'
      ],
      buttonText: t.services.sparkBtn,
      href: '#dashboard'
    },
    {
      label: t.services.proLabel,
      name: 'Iventra Spark Pro',
      price: prices?.sparkPrice || 'Rp 149.000',
      period: prices?.sparkPriceNote || '/ event',
      priceNote: 'Bayar sekali saat event dipublikasikan',
      description: t.services.proDesc,
      features: [
        'Semua fitur Spark Free',
        'Custom Domain (contoh: namaevent.com)',
        'Sistem E-Tiket Barcode & QR Scan',
        'WhatsApp Notifikasi Otomatis',
        'Unlimited Form Responses & Peserta',
        'Priority Server & Fast CDN Global'
      ],
      isPopular: true,
      buttonText: t.services.proBtn,
      href: '#dashboard'
    },
    {
      label: t.services.expertLabel,
      name: 'Iventra Expert',
      price: 'Konsultasi',
      period: '/ custom brief',
      priceNote: 'Proposal & SLA pengerjaan dalam 24 jam',
      description: t.services.expertDesc,
      features: [
        'Desain Kustom Unik dari Tim Desainer UI/UX',
        'Integrasi Payment Gateway (QRIS, BCA, VA)',
        'Sistem Scanner QR On-Site Panitia',
        'Custom Multi-tier Ticketing & Bundling',
        'Dedicated Project Manager & On-Site Support'
      ],
      buttonText: t.services.expertBtn,
      onClick: () => onSelectPlan('flow')
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
