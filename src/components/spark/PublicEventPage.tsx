import { useState, useEffect } from 'react';
import SparkEventRenderer from './SparkEventRenderer.tsx';
import type { EventConfig } from '../../types/builder.ts';
import Logo from '../Logo.tsx';

interface PublicEventPageProps {
  slug: string;
  onBackToHome: () => void;
  onOpenBuilder?: (workspaceId: string) => void;
}

interface EventDataResponse {
  id: string;
  name: string;
  slug: string;
  status: string;
  template_id?: string;
  isPreview?: boolean;
  config: EventConfig;
  publishedAt?: string;
  updatedAt?: string;
  isDraft?: boolean;
  message?: string;
}

export default function PublicEventPage({ slug, onBackToHome, onOpenBuilder }: PublicEventPageProps) {
  const [data, setData] = useState<EventDataResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const isPreview = window.location.search.includes('preview=true') || window.location.hash.includes('preview=true');
    const token = localStorage.getItem('iventra_token');

    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = `/api/public/events/${encodeURIComponent(slug)}${isPreview ? '?preview=true' : ''}`;

    setIsLoading(true);
    fetch(url, { headers })
      .then(async (res) => {
        if (res.status === 404) {
          setErrorStatus(404);
          throw new Error('Event tidak ditemukan. Periksa kembali tautan yang Anda buka.');
        }
        if (res.status === 403) {
          setErrorStatus(403);
          const json = await res.json();
          throw new Error(json.message || 'Website event ini masih dalam tahap persiapan dan belum dipublikasikan.');
        }
        if (!res.ok) {
          throw new Error('Gagal memuat halaman event.');
        }
        return res.json();
      })
      .then((json) => {
        setData(json);
      })
      .catch((err) => {
        setErrorMessage(err.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [slug]);

  // Loading Screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f4f5f8] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-8 h-8 border-2 border-[#0b0c0e] border-t-transparent rounded-full animate-spin mb-4" />
        <h3 className="font-bold text-base text-[#0b0c0e]">Memuat Website Event...</h3>
        <p className="text-xs font-mono text-[#585d6b] mt-1">Platform Manajemen Event Mahasiswa Iventra</p>
      </div>
    );
  }

  // Draft / Not Yet Published State
  if (errorStatus === 403) {
    return (
      <div className="min-h-screen bg-[#f4f5f8] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center mx-auto mb-4 font-mono font-bold text-xl">
          !
        </div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-mono font-bold uppercase tracking-wider mb-3">
          <span>Mode Draft</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0b0c0e] tracking-tight max-w-lg">
          Website Event Sedang Disiapkan
        </h1>
        <p className="text-sm text-[#585d6b] mt-2 max-w-md leading-relaxed">
          Panitia pelaksana sedang merapikan jadwal dan informasi pendaftaran. Silakan kunjungi kembali tautan ini setelah diterbitkan.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={onBackToHome}
            className="px-5 py-2.5 rounded-lg bg-[#0b0c0e] hover:bg-[#1f2de6] text-white text-xs font-mono uppercase tracking-wider font-bold transition-colors cursor-pointer"
          >
            ← Kembali ke Beranda Iventra
          </button>
        </div>
      </div>
    );
  }

  // 404 Not Found State
  if (errorStatus === 404 || !data || !data.config) {
    return (
      <div className="min-h-screen bg-[#f4f5f8] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-xl bg-white border border-[#e2e5ea] text-[#0b0c0e] flex items-center justify-center mx-auto mb-4 font-mono font-bold text-xl">
          404
        </div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-[#0b0c0e] tracking-tight">Event Tidak Ditemukan</h1>
        <p className="text-sm text-[#585d6b] mt-1 max-w-md">
          {errorMessage || 'Tautan slug yang Anda tuju tidak terdaftar di sistem Iventra.'}
        </p>
        <button
          type="button"
          onClick={onBackToHome}
          className="mt-6 px-5 py-2.5 rounded-lg bg-[#0b0c0e] hover:bg-[#1f2de6] text-white text-xs font-mono uppercase tracking-wider font-bold transition-colors cursor-pointer"
        >
          Ke Beranda Utama
        </button>
      </div>
    );
  }

  // Live Published / Preview Renderer
  return (
    <div className="relative min-h-screen flex flex-col">
      {/* Floating Panitia Preview Bar (if owner is previewing) */}
      {data.isPreview && (
        <div className="sticky top-0 z-50 bg-[#0b0c0e] text-white px-4 py-2.5 flex items-center justify-between text-xs font-mono border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>Mode Pratinjau Panitia (Draft Preview) — Hanya terlihat oleh Anda</span>
          </div>
          {onOpenBuilder && (
            <button
              type="button"
              onClick={() => onOpenBuilder(data.id)}
              className="px-3 py-1 rounded bg-[#1f2de6] hover:bg-[#1622b8] text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Kembali ke Builder
            </button>
          )}
        </div>
      )}

      {/* Render Website */}
      <SparkEventRenderer config={data.config} isPreviewMode={data.isPreview} />
    </div>
  );
}
