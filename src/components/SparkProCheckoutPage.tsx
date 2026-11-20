import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Lock,
  Check,
  CreditCard,
  QrCode,
  Building2,
  Copy,
  Clock,
  CheckCircle2,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import Logo from './Logo.tsx';

interface SparkProCheckoutPageProps {
  onBack: () => void;
  onOpenDashboard?: () => void;
  defaultPrice?: string;
}

export default function SparkProCheckoutPage({
  onBack,
  onOpenDashboard
}: SparkProCheckoutPageProps) {
  const [currency, setCurrency] = useState<'IDR' | 'USD'>('IDR');
  const [email, setEmail] = useState('');
  const [paymentTab, setPaymentTab] = useState<'card' | 'qris' | 'va'>('card');

  // Card fields
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardName, setCardName] = useState('');
  const [country, setCountry] = useState('Indonesia');
  const [saveInfo, setSaveInfo] = useState(false);
  const [isBusiness, setIsBusiness] = useState(false);

  // Promo code
  const [showPromoInput, setShowPromoInput] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [promoError, setPromoError] = useState('');

  // VA selection
  const [selectedBank, setSelectedBank] = useState<'bca' | 'mandiri' | 'bni' | 'bri'>('bca');

  // Process & Success
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [invoiceId, setInvoiceId] = useState('');
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [qrisTimer, setQrisTimer] = useState(15 * 60);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setInvoiceId(`INV-${Date.now().toString().slice(-6)}`);
  }, []);

  useEffect(() => {
    if (paymentTab !== 'qris') return;
    const interval = setInterval(() => {
      setQrisTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [paymentTab]);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2500);
  };

  const handleApplyPromo = () => {
    setPromoError('');
    const code = promoCode.trim().toUpperCase();
    if (code === 'KAMPUS10' || code === 'IVENTRA2026' || code === 'SPARKPRO') {
      setAppliedPromo(code);
      setShowPromoInput(false);
    } else if (!code) {
      setPromoError('Masukkan kode promo');
    } else {
      setPromoError('Kode promo tidak valid');
    }
  };

  // Prices calculation
  const baseIdr = 149000;
  const discountIdr = appliedPromo ? 20000 : 0;
  const finalIdr = baseIdr - discountIdr;

  const baseUsd = 9.99;
  const discountUsd = appliedPromo ? 1.5 : 0;
  const finalUsd = baseUsd - discountUsd;

  const formattedMainPrice =
    currency === 'IDR'
      ? `IDR ${finalIdr.toLocaleString('id-ID')}.00`
      : `$${finalUsd.toFixed(2)}`;

  const formattedSubtotal =
    currency === 'IDR'
      ? `IDR ${baseIdr.toLocaleString('id-ID')}.00`
      : `$${baseUsd.toFixed(2)}`;

  const formattedFinalTotal =
    currency === 'IDR'
      ? `IDR ${finalIdr.toLocaleString('id-ID')}.00`
      : `$${finalUsd.toFixed(2)}`;

  // Formatting card number (XXXX XXXX XXXX XXXX)
  const handleCardNumberChange = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
  };

  // Formatting MM/YY
  const handleExpiryChange = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 3) {
      setCardExpiry(`${raw.slice(0, 2)} / ${raw.slice(2)}`);
    } else {
      setCardExpiry(raw);
    }
  };

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      alert('Mohon masukkan alamat email yang valid.');
      return;
    }
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
    }, 1200);
  };

  // ════════════════════════════════════════════════════════════════════════════
  // SUCCESS VIEW
  // ════════════════════════════════════════════════════════════════════════════
  if (isSuccess) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#f8fafc] p-4 sm:p-6 text-slate-900">
        <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
            <Check className="h-8 w-8 stroke-[3]" />
          </div>

          <div className="space-y-1">
            <span className="text-xs font-mono font-bold text-emerald-600 uppercase tracking-widest block">
              STATUS: LUNAS &amp; AKTIF
            </span>
            <h2 className="text-2xl font-display font-extrabold text-slate-900 tracking-tight">
              Pembayaran Berhasil!
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Tanda terima dan lisensi Spark Pro telah dikirim ke <strong>{email}</strong>.
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-left text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Nomor Tagihan:</span>
              <span className="font-mono font-bold text-slate-900">{invoiceId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Produk:</span>
              <span className="font-bold text-slate-900">Iventra Spark Pro (1 Event)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Total Dibayar:</span>
              <span className="font-bold text-emerald-600">{formattedFinalTotal}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Metode:</span>
              <span className="font-semibold text-slate-700 uppercase">{paymentTab}</span>
            </div>
          </div>

          <div className="space-y-2.5 pt-2">
            {onOpenDashboard && (
              <button
                type="button"
                onClick={onOpenDashboard}
                className="w-full py-3.5 rounded-xl bg-[#0066cc] hover:bg-[#0055b3] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Buka Dashboard &amp; Kelola Event</span>
                <ExternalLink className="h-4 w-4" />
              </button>
            )}

            <button
              type="button"
              onClick={onBack}
              className="w-full py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Kembali ke Beranda
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // STRIPE-STYLE SPLIT CHECKOUT VIEW
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-white text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* ──────────────────────────────────────────────────────────────────────
          LEFT PANEL: STRIPE-STYLE ORDER SUMMARY & PRICING
         ────────────────────────────────────────────────────────────────────── */}
      <section className="w-full lg:w-1/2 bg-[#f8fafc] border-b lg:border-b-0 lg:border-r border-slate-200/80 p-6 sm:p-10 lg:p-14 xl:p-16 flex flex-col justify-between">
        <div className="max-w-md w-full mx-auto lg:mr-auto lg:ml-0 space-y-7">
          {/* Back button with Logo */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="flex items-center justify-center h-8 w-8 rounded-full hover:bg-slate-200/80 transition-colors text-slate-600 hover:text-slate-900 cursor-pointer"
              aria-label="Kembali ke beranda"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2">
              <Logo size="sm" />
              <span className="font-display font-extrabold text-slate-900 text-lg tracking-tight">
                IVENTRA
              </span>
            </div>
          </div>

          {/* Title & Giant Price */}
          <div className="space-y-1 text-left">
            <span className="text-sm font-semibold text-slate-500 block">
              Beli Lisensi Iventra Spark Pro
            </span>
            <div className="flex items-baseline gap-2">
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 font-display">
                {formattedMainPrice}
              </h1>
              <span className="text-xs text-slate-500 font-semibold">sekali bayar</span>
            </div>
            <p className="text-xs text-slate-400">
              Lisensi aktif penuh untuk satu event hingga selesai
            </p>
          </div>

          {/* Currency Toggle (IDR / USD) */}
          <div className="grid grid-cols-2 p-1 bg-slate-200/70 rounded-xl text-xs font-bold text-slate-700">
            <button
              type="button"
              onClick={() => setCurrency('IDR')}
              className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                currency === 'IDR'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>🇮🇩</span>
              <span>IDR</span>
            </button>
            <button
              type="button"
              onClick={() => setCurrency('USD')}
              className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                currency === 'USD'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>🇺🇸</span>
              <span>USD</span>
            </button>
          </div>

          {/* Line Items Breakdown */}
          <div className="pt-2 space-y-4 border-t border-slate-200/80 text-sm">
            <div className="flex items-start justify-between">
              <div>
                <span className="font-bold text-slate-800 block">Iventra Spark Pro</span>
                <span className="text-xs text-slate-500">Termasuk domain kustom &amp; tiket QR</span>
              </div>
              <span className="font-semibold text-slate-900 font-mono">{formattedSubtotal}</span>
            </div>

            <div className="flex items-center justify-between text-slate-600 pt-2 border-t border-slate-100">
              <span className="text-xs">Subtotal</span>
              <span className="font-mono text-xs">{formattedSubtotal}</span>
            </div>

            {appliedPromo && (
              <div className="flex items-center justify-between text-emerald-600 font-semibold text-xs">
                <span>Diskon Promo ({appliedPromo})</span>
                <span className="font-mono">
                  {currency === 'IDR' ? '- IDR 20,000.00' : '- $1.50'}
                </span>
              </div>
            )}

            {/* Promotion Code Toggle / Input */}
            <div>
              {!showPromoInput && !appliedPromo ? (
                <button
                  type="button"
                  onClick={() => setShowPromoInput(true)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
                >
                  Tambahkan kode promo
                </button>
              ) : !appliedPromo ? (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Kode promo (cth: KAMPUS10)"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-mono uppercase outline-none focus:border-blue-600"
                    />
                    <button
                      type="button"
                      onClick={handleApplyPromo}
                      className="px-3 py-1.5 text-xs font-bold bg-slate-900 text-white rounded-lg hover:bg-blue-600 transition-colors cursor-pointer"
                    >
                      Terapkan
                    </button>
                  </div>
                  {promoError && (
                    <p className="text-[11px] text-rose-500">{promoError}</p>
                  )}
                </div>
              ) : null}
            </div>

            {/* Total due today */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200 text-slate-900 font-bold">
              <span>Total bayar hari ini</span>
              <span className="text-base font-extrabold font-mono text-slate-900">
                {formattedFinalTotal}
              </span>
            </div>
          </div>
        </div>

        {/* Brand note bottom */}
        <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400 pt-8 max-w-md">
          <Lock className="h-3.5 w-3.5 text-slate-400" />
          <span>Iventra Payments · Didukung sistem keamanan enkripsi 256-bit</span>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────
          RIGHT PANEL: STRIPE-STYLE PAYMENT DETAILS & FORM
         ────────────────────────────────────────────────────────────────────── */}
      <section className="w-full lg:w-1/2 bg-white p-6 sm:p-10 lg:p-14 xl:p-16 flex flex-col justify-center">
        <form
          onSubmit={handlePay}
          className="max-w-md w-full mx-auto lg:ml-auto lg:mr-0 space-y-6 text-left"
        >
          {/* Quick Pay / Express Buttons (Apple Pay / QRIS Link) */}
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setPaymentTab('card')}
                className="h-11 rounded-lg bg-black text-white hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5 text-sm font-semibold shadow-xs cursor-pointer"
              >
                <span className="text-base font-sans font-bold">Pay</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentTab('qris')}
                className="h-11 rounded-lg bg-[#00d66f] hover:bg-[#00c063] text-slate-900 transition-colors flex items-center justify-center gap-1.5 text-sm font-bold shadow-xs cursor-pointer"
              >
                <QrCode className="h-4 w-4" />
                <span>QRIS Instan</span>
              </button>
            </div>

            <div className="relative flex items-center justify-center my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <span className="relative bg-white px-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                Atau
              </span>
            </div>
          </div>

          {/* Contact Information (Email only, exactly as user requested) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Informasi Kontak
            </label>
            <div className="space-y-1">
              <label htmlFor="checkout-email" className="text-xs text-slate-500 font-medium">
                Email
              </label>
              <input
                id="checkout-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 shadow-2xs outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-3 pt-1">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Metode Pembayaran
            </label>

            {/* Selector Tabs: Card | QRIS | VA */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentTab('card')}
                className={`py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  paymentTab === 'card'
                    ? 'border-blue-600 bg-blue-50/70 text-blue-700 ring-2 ring-blue-500/20'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <CreditCard className="h-3.5 w-3.5" />
                <span>Kartu</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentTab('qris')}
                className={`py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  paymentTab === 'qris'
                    ? 'border-blue-600 bg-blue-50/70 text-blue-700 ring-2 ring-blue-500/20'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <QrCode className="h-3.5 w-3.5" />
                <span>QRIS</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentTab('va')}
                className={`py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  paymentTab === 'va'
                    ? 'border-blue-600 bg-blue-50/70 text-blue-700 ring-2 ring-blue-500/20'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Building2 className="h-3.5 w-3.5" />
                <span>VA Bank</span>
              </button>
            </div>

            {/* TAB 1: CARD (Stripe Nested Fields Box) */}
            {paymentTab === 'card' && (
              <div className="space-y-3">
                <div className="rounded-lg border border-slate-300 bg-white shadow-2xs overflow-hidden">
                  {/* Card Number */}
                  <div className="p-3 border-b border-slate-200 flex items-center justify-between gap-2">
                    <input
                      type="text"
                      placeholder="1234 1234 1234 1234"
                      value={cardNumber}
                      onChange={(e) => handleCardNumberChange(e.target.value)}
                      className="w-full text-sm font-mono text-slate-800 placeholder:text-slate-400 outline-none bg-transparent"
                    />
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-600 text-white tracking-tighter">
                        VISA
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500 text-white tracking-tighter">
                        MC
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-600 text-white tracking-tighter">
                        GPN
                      </span>
                    </div>
                  </div>

                  {/* MM/YY & CVC */}
                  <div className="grid grid-cols-2 divide-x divide-slate-200 border-b border-slate-200">
                    <input
                      type="text"
                      placeholder="MM / YY"
                      value={cardExpiry}
                      onChange={(e) => handleExpiryChange(e.target.value)}
                      className="p-3 text-sm font-mono text-slate-800 placeholder:text-slate-400 outline-none bg-transparent"
                    />
                    <input
                      type="password"
                      maxLength={4}
                      placeholder="CVC"
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, ''))}
                      className="p-3 text-sm font-mono text-slate-800 placeholder:text-slate-400 outline-none bg-transparent"
                    />
                  </div>

                  {/* Name on card */}
                  <input
                    type="text"
                    placeholder="Nama pada kartu"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    className="w-full p-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none bg-transparent"
                  />
                </div>

                {/* Country Dropdown */}
                <div className="space-y-1">
                  <label className="text-xs text-slate-500 font-medium">Negara / Wilayah</label>
                  <div className="relative">
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full appearance-none rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 shadow-2xs outline-none focus:border-blue-600 cursor-pointer"
                    >
                      <option value="Indonesia">Indonesia</option>
                      <option value="Malaysia">Malaysia</option>
                      <option value="Singapore">Singapore</option>
                      <option value="United States">United States</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: QRIS */}
            {paymentTab === 'qris' && (
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-center space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-200">
                  <span>Pindai QRIS (Semua Bank &amp; E-Wallet)</span>
                  <div className="flex items-center gap-1 font-mono font-bold text-amber-600">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{formatTimer(qrisTimer)}</span>
                  </div>
                </div>

                <div className="mx-auto w-44 h-44 bg-white rounded-xl border-2 border-slate-900 p-2.5 shadow-sm flex flex-col items-center justify-center relative">
                  <div className="grid grid-cols-6 gap-1 w-full h-full p-1 bg-slate-50 rounded-lg">
                    {Array.from({ length: 36 }).map((_, i) => (
                      <div
                        key={i}
                        className={`rounded-xs ${
                          (i % 2 === 0 && i % 3 === 0) || i === 0 || i === 5 || i === 30
                            ? 'bg-slate-900'
                            : i % 5 === 0
                            ? 'bg-blue-600'
                            : 'bg-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-white px-1.5 py-0.5 rounded shadow-xs border border-slate-200">
                      <span className="text-[9px] font-black text-rose-600 tracking-tighter">QRIS</span>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500">
                  BCA Mobile, Livin', GoPay, OVO, ShopeePay, DANA langsung terverifikasi.
                </p>
              </div>
            )}

            {/* TAB 3: VIRTUAL ACCOUNT */}
            {paymentTab === 'va' && (
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-3">
                <div className="grid grid-cols-4 gap-1.5">
                  {(['bca', 'mandiri', 'bni', 'bri'] as const).map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setSelectedBank(b)}
                      className={`py-1.5 rounded-lg border text-xs font-bold uppercase transition-all cursor-pointer ${
                        selectedBank === b
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>

                <div className="bg-white rounded-lg border border-blue-200 p-3 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block uppercase">
                      Nomor VA {selectedBank.toUpperCase()}
                    </span>
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      8277 0858 5088 1664
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy('8277085850881664', 'va')}
                    className="px-2.5 py-1 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                  >
                    {copiedText === 'va' ? 'Tersalin' : 'Salin'}
                  </button>
                </div>
              </div>
            )}

            {/* Checkboxes like Stripe */}
            <div className="space-y-2 pt-2 text-xs text-slate-600">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={saveInfo}
                  onChange={(e) => setSaveInfo(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Simpan informasi saya untuk pembayaran lebih cepat</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isBusiness}
                  onChange={(e) => setIsBusiness(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Saya membeli atas nama organisasi / instansi</span>
              </label>
            </div>
          </div>

          {/* Big Stripe-style Blue Action Button */}
          <button
            type="submit"
            disabled={isProcessing}
            className="w-full py-3.5 rounded-lg bg-[#0066cc] hover:bg-[#0055b3] text-white font-bold text-sm shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
          >
            {isProcessing ? (
              <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span>Bayar {formattedFinalTotal}</span>
            )}
          </button>

          {/* Disclaimer text */}
          <p className="text-[11px] text-slate-400 text-center leading-relaxed">
            Dengan mengonfirmasi pembayaran, Anda menyetujui Ketentuan Layanan dan Kebijakan Privasi Iventra. Lisensi langsung aktif seketika setelah pembayaran terverifikasi.
          </p>
        </form>
      </section>
    </div>
  );
}
