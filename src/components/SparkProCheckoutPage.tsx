import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Check,
  CreditCard,
  QrCode,
  Building2,
  Clock,
  ExternalLink,
  Copy
} from 'lucide-react';
import Logo from './Logo.tsx';

interface SparkProCheckoutPageProps {
  onBack: () => void;
  onOpenDashboard?: () => void;
  defaultPrice?: string;
  userEmail?: string;
}

function getSavedUserEmail(propEmail?: string): string {
  if (propEmail && propEmail.trim()) return propEmail.trim();
  try {
    const raw = localStorage.getItem('iventra_user');
    if (raw) {
      const u = JSON.parse(raw);
      if (u && u.email) return u.email;
    }
  } catch {}
  return '';
}

export default function SparkProCheckoutPage({
  onBack,
  onOpenDashboard,
  defaultPrice = 'Rp 150.000 / bulan',
  userEmail
}: SparkProCheckoutPageProps) {
  const [email, setEmail] = useState(() => getSavedUserEmail(userEmail));
  const [paymentTab, setPaymentTab] = useState<'qris' | 'va' | 'card'>('qris');

  // Card fields
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardName, setCardName] = useState('');

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
    if (userEmail) {
      setEmail(userEmail);
    } else {
      const saved = getSavedUserEmail();
      if (saved) setEmail(saved);
    }
  }, [userEmail]);

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
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleCardNumberChange = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
  };

  const handleExpiryChange = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 3) {
      setCardExpiry(`${raw.slice(0, 2)} / ${raw.slice(2)}`);
    } else {
      setCardExpiry(raw);
    }
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      alert('Masukkan alamat email yang valid.');
      return;
    }
    setIsProcessing(true);
    try {
      await fetch('/api/checkout/spark-pro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() })
      });
      const savedUserStr = localStorage.getItem('iventra_auth_user');
      if (savedUserStr) {
        try {
          const userObj = JSON.parse(savedUserStr);
          if (userObj && userObj.email?.toLowerCase() === email.trim().toLowerCase()) {
            userObj.plan = 'spark_pro';
            localStorage.setItem('iventra_auth_user', JSON.stringify(userObj));
          }
        } catch {}
      }
    } catch (err) {
      console.error('Failed to notify payment upgrade:', err);
    }
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
    }, 1200);
  };

  // SUCCESS VIEW
  if (isSuccess) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#f8fafc] p-4 text-slate-900">
        <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl p-8 text-center space-y-6">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-2xs">
            <Check className="h-7 w-7 stroke-[3]" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Pembayaran Berhasil
            </h2>
            <p className="text-xs text-slate-500 font-mono">
              {invoiceId}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-left text-xs space-y-2.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Produk</span>
              <span className="font-semibold text-slate-900">Iventra Spark Pro (1 Bulan)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Email Akun</span>
              <span className="font-semibold text-slate-900">{email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Total Dibayar</span>
              <span className="font-bold text-blue-600">{defaultPrice}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Metode</span>
              <span className="font-semibold text-slate-900 uppercase">{paymentTab}</span>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            {onOpenDashboard && (
              <button
                type="button"
                onClick={onOpenDashboard}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-600/20"
              >
                <span>Buka Dashboard</span>
                <ExternalLink className="h-4 w-4" />
              </button>
            )}

            <button
              type="button"
              onClick={onBack}
              className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium text-xs hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Kembali ke Beranda
            </button>
          </div>
        </div>
      </div>
    );
  }

  // SPLIT CHECKOUT VIEW
  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#f8fafc] text-slate-900">
      {/* SECTION KIRI: TABEL KEUNGGULAN SPARK PRO */}
      <section className="w-full lg:w-1/2 p-6 sm:p-10 lg:p-12 xl:p-16 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-200">
        <div className="max-w-xl w-full mx-auto space-y-6">
          {/* Header Navigasi */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="flex items-center justify-center h-8 w-8 rounded-full border border-slate-200 bg-white hover:bg-slate-100 transition-colors text-slate-600 cursor-pointer"
              aria-label="Kembali"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2">
              <Logo size="sm" />
              <span className="font-display font-extrabold text-slate-900 text-base tracking-tight">
                IVENTRA
              </span>
            </div>
          </div>

          {/* Judul Bersih Tanpa Teks Tambahan */}
          <h1 className="text-2xl sm:text-3xl font-display font-black tracking-tight text-slate-900">
            Keunggulan Spark Pro
          </h1>

          {/* Tabel Keunggulan */}
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-700 font-semibold">
                <tr>
                  <th className="py-3 px-4">Fitur</th>
                  <th className="py-3 px-3 text-slate-500">Spark Gratis</th>
                  <th className="py-3 px-4 text-blue-600 font-bold bg-blue-50/50">Spark Pro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr>
                  <td className="py-2.5 px-4 font-medium">Kuota Trafik</td>
                  <td className="py-2.5 px-3 text-slate-500">1.000 / minggu</td>
                  <td className="py-2.5 px-4 font-semibold text-slate-900 bg-blue-50/20">10.000 / minggu</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-medium">Batas Workspace</td>
                  <td className="py-2.5 px-3 text-slate-500">5 Workspace</td>
                  <td className="py-2.5 px-4 font-semibold text-slate-900 bg-blue-50/20">30 Workspace</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-medium">Fitur Pembuatan Web</td>
                  <td className="py-2.5 px-3 text-slate-500">11 Fitur Dasar</td>
                  <td className="py-2.5 px-4 font-semibold text-blue-600 bg-blue-50/20">Akses Seluruh Fitur Pro</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-medium">Koleksi Template</td>
                  <td className="py-2.5 px-3 text-slate-500">Semua Template</td>
                  <td className="py-2.5 px-4 font-semibold text-slate-900 bg-blue-50/20">Semua Template &amp; Pro</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-medium">Publikasi Website</td>
                  <td className="py-2.5 px-3 text-slate-500">Gratis</td>
                  <td className="py-2.5 px-4 font-semibold text-slate-900 bg-blue-50/20">Gratis</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-medium">Domain Kustom</td>
                  <td className="py-2.5 px-3 text-slate-400">—</td>
                  <td className="py-2.5 px-4 font-semibold text-emerald-600 bg-blue-50/20">Dukungan Domain Sendiri</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-medium">Sistem E-Tiket &amp; QR Scanner</td>
                  <td className="py-2.5 px-3 text-slate-400">—</td>
                  <td className="py-2.5 px-4 font-semibold text-emerald-600 bg-blue-50/20">Barcode &amp; Scanner QR</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-medium">Notifikasi WhatsApp</td>
                  <td className="py-2.5 px-3 text-slate-400">—</td>
                  <td className="py-2.5 px-4 font-semibold text-emerald-600 bg-blue-50/20">Blast &amp; Pengingat Otomatis</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-medium">Integrasi Pembayaran</td>
                  <td className="py-2.5 px-3 text-slate-500">1x Transaksi</td>
                  <td className="py-2.5 px-4 font-semibold text-emerald-600 bg-blue-50/20">Multi-Channel Terintegrasi</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Ringkasan Biaya */}
          <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white shadow-2xs">
            <span className="text-sm font-semibold text-slate-700">Total Harga</span>
            <span className="text-xl font-display font-black text-blue-600">{defaultPrice}</span>
          </div>
        </div>

        <div className="max-w-xl w-full mx-auto pt-6 text-[11px] text-slate-400 font-mono">
          IVENTRA SPARK PRO · LISENSI RESMI
        </div>
      </section>

      {/* SECTION KANAN: FORM PEMBAYARAN BERLATAR PUTIH (PROFESIONAL & MINIMALIS) */}
      <section className="w-full lg:w-1/2 bg-white p-6 sm:p-10 lg:p-12 xl:p-16 flex flex-col justify-center">
        <form
          onSubmit={handlePay}
          className="max-w-md w-full mx-auto space-y-5 text-left"
        >
          {/* Judul Bersih Tanpa Teks Tambahan */}
          <h2 className="text-2xl font-display font-bold tracking-tight text-slate-900 pb-1">
            Pembayaran
          </h2>

          {/* Ringkasan Item Pesanan Minimalis */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between text-xs">
            <span className="font-bold text-slate-900">Iventra Spark Pro</span>
            <span className="font-mono font-bold text-sm text-slate-900">{defaultPrice}</span>
          </div>

          {/* Input Email (Otomatis Terisi Jika User Login) */}
          <div className="space-y-1.5">
            <label htmlFor="checkout-email" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Email
            </label>
            <input
              id="checkout-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 font-medium outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all shadow-2xs"
            />
          </div>

          {/* Pilihan Metode Pembayaran */}
          <div className="space-y-2.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Metode Pembayaran
            </label>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentTab('qris')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  paymentTab === 'qris'
                    ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-2xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <QrCode className="h-4 w-4" />
                <span>QRIS</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentTab('va')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  paymentTab === 'va'
                    ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-2xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Building2 className="h-4 w-4" />
                <span>VA Bank</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentTab('card')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  paymentTab === 'card'
                    ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-2xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <CreditCard className="h-4 w-4" />
                <span>Kartu</span>
              </button>
            </div>

            {/* TAB QRIS: STANDAR RESMI INDONESIA */}
            {paymentTab === 'qris' && (
              <div className="rounded-xl border border-slate-200 bg-white p-4 text-center space-y-3 shadow-2xs">
                <div className="flex items-center justify-between text-xs text-slate-600 pb-2 border-b border-slate-100">
                  <span className="font-semibold">Pindai Kode QRIS</span>
                  <div className="flex items-center gap-1 font-mono font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60">
                    <Clock className="h-3 w-3" />
                    <span>{formatTimer(qrisTimer)}</span>
                  </div>
                </div>

                <div className="mx-auto w-44 h-44 bg-white rounded-xl border border-slate-200 p-2.5 shadow-xs flex flex-col items-center justify-center relative">
                  <div className="grid grid-cols-6 gap-1.5 w-full h-full p-1 bg-slate-50/80 rounded-lg">
                    {Array.from({ length: 36 }).map((_, i) => (
                      <div
                        key={i}
                        className={`rounded-xs ${
                          (i % 2 === 0 && i % 3 === 0) || i === 0 || i === 5 || i === 30
                            ? 'bg-slate-900'
                            : i % 5 === 0
                            ? 'bg-blue-600'
                            : 'bg-slate-300'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-white px-2 py-0.5 rounded shadow-xs border border-slate-200">
                      <span className="text-[10px] font-black text-rose-600 tracking-tight">QRIS</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 pt-1 text-[11px] font-semibold text-slate-500">
                  <span>BCA</span>
                  <span>·</span>
                  <span>Mandiri</span>
                  <span>·</span>
                  <span>GoPay</span>
                  <span>·</span>
                  <span>OVO</span>
                  <span>·</span>
                  <span>ShopeePay</span>
                  <span>·</span>
                  <span>DANA</span>
                </div>
              </div>
            )}

            {/* TAB VIRTUAL ACCOUNT: PER BANK */}
            {paymentTab === 'va' && (
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-2xs">
                <div className="grid grid-cols-4 gap-1.5">
                  {(['bca', 'mandiri', 'bni', 'bri'] as const).map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setSelectedBank(b)}
                      className={`py-1.5 rounded-lg border text-xs font-bold uppercase transition-all cursor-pointer ${
                        selectedBank === b
                          ? 'border-blue-600 bg-blue-600 text-white shadow-2xs'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>

                <div className="bg-slate-50/80 rounded-xl border border-slate-200 p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                      Nomor Virtual Account {selectedBank.toUpperCase()}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy('8277085850881664', 'va')}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer shadow-2xs transition-colors"
                    >
                      {copiedText === 'va' ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-600" />
                          <span className="text-emerald-600">Tersalin</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3 text-slate-500" />
                          <span>Salin</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="font-mono font-bold text-slate-900 text-base tracking-wide">
                    8277 0858 5088 1664
                  </div>
                  <div className="text-[11px] text-slate-500 flex justify-between pt-1 border-t border-slate-200/60">
                    <span>Nama Akun:</span>
                    <span className="font-semibold text-slate-800">IVENTRA SPARK PRO</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB KARTU KREDIT / DEBIT: STRIPE-STYLE */}
            {paymentTab === 'card' && (
              <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Nomor Kartu
                  </label>
                  <input
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    onChange={(e) => handleCardNumberChange(e.target.value)}
                    className="w-full p-2.5 text-sm font-mono text-slate-900 placeholder:text-slate-400 outline-none border border-slate-200 rounded-lg focus:border-blue-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Masa Berlaku
                    </label>
                    <input
                      type="text"
                      placeholder="MM / YY"
                      value={cardExpiry}
                      onChange={(e) => handleExpiryChange(e.target.value)}
                      className="w-full p-2.5 text-sm font-mono text-slate-900 placeholder:text-slate-400 outline-none border border-slate-200 rounded-lg focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Kode CVC
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      placeholder="123"
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, ''))}
                      className="w-full p-2.5 text-sm font-mono text-slate-900 placeholder:text-slate-400 outline-none border border-slate-200 rounded-lg focus:border-blue-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Nama Pemegang Kartu
                  </label>
                  <input
                    type="text"
                    placeholder="Nama sesuai kartu"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    className="w-full p-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none border border-slate-200 rounded-lg focus:border-blue-600"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Tombol Aksi Pembayaran */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 active:scale-[0.99]"
            >
              {isProcessing ? (
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>Bayar {defaultPrice}</span>
              )}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
