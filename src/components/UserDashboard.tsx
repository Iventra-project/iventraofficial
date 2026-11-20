import { useState, useEffect, useCallback, useRef } from 'react';
import Logo from './Logo.tsx';
import type { AuthUser } from './AuthPage.tsx';
import GalleryHoverCarousel from '../../components/ui/gallery-hover-carousel.tsx';
import TemplateSelectorModal from './spark/TemplateSelectorModal.tsx';
import SparkSubscriptionModal from './spark/SparkSubscriptionModal.tsx';
import RealtimeWorkspaceThumbnail from './spark/RealtimeWorkspaceThumbnail.tsx';
import { getTemplateById, type TemplateId, SPARK_TEMPLATES, type EventConfig } from '../types/builder.ts';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Workspace {
  id: string;
  owner_id: string;
  name: string;
  service_type: string;
  status: string;
  slug: string | null;
  description: string | null;
  template_id?: string;
  draft_config?: string;
  published_config?: string;
  published_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  id: string;
  date: string;
  planName: string;
  amount: string;
  status: 'Lunas' | 'Menunggu';
}

export interface SubscriptionState {
  planName: string;
  priceFormatted: string;
  billingCycle: string;
  status: 'active' | 'expiring_soon' | 'expired';
  purchasedAt: string;
  expiresAt: string;
  totalTokens: number;
  usedTokens: number;
  paymentMethod: string;
  autoRenew: boolean;
  invoices: InvoiceItem[];
}

export function formatIndonesianDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(d);
  } catch {
    return isoString;
  }
}

export function getSubscriptionMetrics(sub: SubscriptionState) {
  const now = Date.now();
  const purchaseTime = new Date(sub.purchasedAt).getTime();
  const expireTime = new Date(sub.expiresAt).getTime();
  const totalDuration = Math.max(1, expireTime - purchaseTime);
  const elapsed = Math.max(0, now - purchaseTime);
  const remainingMs = Math.max(0, expireTime - now);
  const remainingDays = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));
  const progressPercent = Math.min(100, Math.max(0, Math.round((elapsed / totalDuration) * 100)));

  let statusText = 'Aktif';
  let badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  let pulseDot = 'bg-emerald-500';

  if (remainingDays <= 0) {
    statusText = 'Kedaluwarsa';
    badgeClass = 'bg-red-50 text-red-700 border-red-200';
    pulseDot = 'bg-red-500';
  } else if (remainingDays <= 5) {
    statusText = 'Segera Berakhir';
    badgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
    pulseDot = 'bg-amber-500';
  }

  return {
    remainingDays,
    progressPercent,
    statusText,
    badgeClass,
    pulseDot
  };
}

interface UserDashboardProps {
  user: AuthUser;
  token: string;
  onLogout: () => void;
  onBackToSite: () => void;
  onOpenBuilder: (workspace: Workspace) => void;
  onOpenAdmin?: () => void;
}

export type DashboardSidebarNav =
  | 'dashboard'
  | 'workspaces'
  | 'templates'
  | 'expert'
  | 'subscription'
  | 'notifications'
  | 'settings';

interface FormPresetItem {
  id: string;
  title: string;
  accentColor: string;
  getConfig: () => EventConfig;
}

export default function UserDashboard({
  user,
  token,
  onLogout,
  onBackToSite,
  onOpenBuilder,
  onOpenAdmin
}: UserDashboardProps) {
  const [currentNav, setCurrentNav] = useState<DashboardSidebarNav>('dashboard');
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortOrder, setSortOrder] = useState<'date' | 'alpha'>('date');
  const [ownershipFilter, setOwnershipFilter] = useState<'anyone' | 'me'>('anyone');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [activeMenuWsId, setActiveMenuWsId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [editingWs, setEditingWs] = useState<Workspace | null>(null);
  const [deletingWs, setDeletingWs] = useState<Workspace | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editError, setEditError] = useState('');
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const [templateCreateError, setTemplateCreateError] = useState('');

  // Settings State
  const [profileName, setProfileName] = useState(user.name);
  const [displayedName, setDisplayedName] = useState(user.name);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  const filterRef = useRef<HTMLDivElement>(null);

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadWorkspaces = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/workspaces', { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setWorkspaces(Array.isArray(data) ? data : []);
      } else if (res.status === 401) {
        onLogout();
      }
    } catch {
      showToast('Gagal memuat workspace.');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadWorkspaces();
  }, [loadWorkspaces]);

  useEffect(() => {
    if (currentNav === 'workspaces') {
      loadWorkspaces();
    }
  }, [currentNav, loadWorkspaces]);

  // Global click listener to close popovers
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setIsFilterDropdownOpen(false);
      }
      if (activeMenuWsId) {
        const target = e.target as HTMLElement;
        if (!target.closest('.ws-card-menu')) {
          setActiveMenuWsId(null);
        }
      }
    };
    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, [activeMenuWsId]);

  // ─── 5 Google Forms Presets adapted to Iventra ─────────────────────────────

  const FORM_PRESETS: FormPresetItem[] = [
    {
      id: 'blank',
      title: 'Blank form',
      accentColor: '#1f2de6',
      getConfig: () => {
        const tmpl = getTemplateById('blank');
        return {
          ...tmpl.defaultConfig,
          eventName: 'Untitled form',
          description: '',
          blocks: []
        };
      }
    },
    {
      id: 'contact',
      title: 'Contact Information',
      accentColor: '#059669',
      getConfig: () => ({
        eventName: 'Contact Information',
        tagline: '',
        description: 'Silakan isi formulir kontak untuk terhubung dengan tim kami.',
        institutionName: '',
        logoUrl: '',
        bannerUrl: '',
        eventDateText: '',
        eventLocationText: '',
        isOnline: false,
        statusBadgeText: '',
        theme: {
          primaryColor: '#059669',
          accentColor: '#10b981',
          bgStyle: 'clean-white',
          fontFamily: 'sans'
        },
        blocks: [
          {
            id: 'block-form-contact',
            type: 'form',
            title: 'Contact Information',
            subtitle: '',
            enabled: true,
            data: {
              buttonText: 'Submit',
              openMode: 'same-page',
              steps: [
                {
                  id: 'step-1',
                  title: 'Informasi Kontak',
                  fields: [
                    { id: 'f-name', label: 'Name', type: 'text', required: true, placeholder: 'Nama Lengkap' },
                    { id: 'f-email', label: 'Email', type: 'text', required: true, placeholder: 'email@domain.com' },
                    { id: 'f-address', label: 'Address', type: 'text', required: false, placeholder: 'Alamat' },
                    { id: 'f-phone', label: 'Phone number', type: 'text', required: false, placeholder: '08123456789' },
                    { id: 'f-comments', label: 'Comments', type: 'text', required: false, placeholder: 'Pesan / catatan' }
                  ]
                }
              ]
            }
          }
        ]
      })
    },
    {
      id: 'rsvp',
      title: 'RSVP',
      accentColor: '#1f2de6',
      getConfig: () => ({
        eventName: 'Event RSVP',
        tagline: '',
        description: 'Konfirmasi kehadiran Anda pada acara.',
        institutionName: '',
        logoUrl: '',
        bannerUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&auto=format&fit=crop&q=80',
        eventDateText: 'Sabtu, 28 November 2026',
        eventLocationText: 'Auditorium Utama',
        isOnline: false,
        statusBadgeText: '',
        theme: {
          primaryColor: '#1f2de6',
          accentColor: '#3b82f6',
          bgStyle: 'clean-white',
          fontFamily: 'sans'
        },
        blocks: [
          {
            id: 'block-form-rsvp',
            type: 'form',
            title: 'RSVP',
            subtitle: 'Mohon konfirmasi kehadiran sebelum kuota penuh',
            enabled: true,
            data: {
              buttonText: 'Submit',
              openMode: 'same-page',
              steps: [
                {
                  id: 'step-1',
                  title: 'Kehadiran',
                  fields: [
                    { id: 'f-name', label: 'Can you attend?', type: 'choice', required: true, options: ['Yes, I will be there', 'Sorry, cannot make it'] },
                    { id: 'f-attendees', label: 'What are the names of people attending?', type: 'text', required: false, placeholder: 'Nama peserta' },
                    { id: 'f-source', label: 'How did you hear about this event?', type: 'text', required: false, placeholder: 'Media sosial, teman, dsb.' }
                  ]
                }
              ]
            }
          }
        ]
      })
    },
    {
      id: 'party',
      title: 'Party Invite',
      accentColor: '#ea580c',
      getConfig: () => ({
        eventName: 'Party Invite',
        tagline: '',
        description: 'Bergabung dalam acara perayaan kami.',
        institutionName: '',
        logoUrl: '',
        bannerUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&auto=format&fit=crop&q=80',
        eventDateText: 'Jumat Malam, 19.30 WIB',
        eventLocationText: 'Lounge Hall',
        isOnline: false,
        statusBadgeText: '',
        theme: {
          primaryColor: '#ea580c',
          accentColor: '#f97316',
          bgStyle: 'clean-white',
          fontFamily: 'sans'
        },
        blocks: [
          {
            id: 'block-form-party',
            type: 'form',
            title: 'Party Invite',
            subtitle: '',
            enabled: true,
            data: {
              buttonText: 'Submit',
              openMode: 'same-page',
              steps: [
                {
                  id: 'step-1',
                  title: 'Undangan',
                  fields: [
                    { id: 'f-name', label: 'What is your name?', type: 'text', required: true, placeholder: 'Nama Anda' },
                    { id: 'f-makeit', label: 'Can you make it?', type: 'choice', required: true, options: ['Yes, definitely!', 'Maybe', 'No, sorry'] },
                    { id: 'f-count', label: 'How many of you will attend?', type: 'choice', required: false, options: ['1 orang', '2 orang', '3+ orang'] },
                    { id: 'f-bring', label: 'What will you bring?', type: 'choice', required: false, options: ['Makanan Ringan', 'Minuman', 'Dessert', 'Lainnya'] }
                  ]
                }
              ]
            }
          }
        ]
      })
    },
    {
      id: 'tshirt',
      title: 'T-Shirt Sign Up',
      accentColor: '#7c3aed',
      getConfig: () => ({
        eventName: 'T-Shirt Sign Up',
        tagline: '',
        description: 'Pendaftaran ukuran merchandise dan seragam kegiatan.',
        institutionName: '',
        logoUrl: '',
        bannerUrl: '',
        eventDateText: '',
        eventLocationText: '',
        isOnline: false,
        statusBadgeText: '',
        theme: {
          primaryColor: '#7c3aed',
          accentColor: '#a855f7',
          bgStyle: 'clean-white',
          fontFamily: 'sans'
        },
        blocks: [
          {
            id: 'block-form-tshirt',
            type: 'form',
            title: 'T-Shirt Sign Up',
            subtitle: 'Pilih ukuran kaos yang sesuai',
            enabled: true,
            data: {
              buttonText: 'Submit',
              openMode: 'same-page',
              steps: [
                {
                  id: 'step-1',
                  title: 'Data Kaos',
                  fields: [
                    { id: 'f-name', label: 'Full Name', type: 'text', required: true, placeholder: 'Nama lengkap' },
                    { id: 'f-email', label: 'Email', type: 'text', required: true, placeholder: 'email@domain.com' },
                    { id: 'f-size', label: 'Shirt Size', type: 'choice', required: true, options: ['S', 'M', 'L', 'XL', 'XXL'] },
                    { id: 'f-notes', label: 'Other thoughts or questions?', type: 'text', required: false, placeholder: 'Catatan tambahan' }
                  ]
                }
              ]
            }
          }
        ]
      })
    }
  ];

  // ─── Quick Create from Google Forms Preset ─────────────────────────────────

  const handleQuickCreateForm = async (preset: FormPresetItem) => {
    setIsCreatingWorkspace(true);
    try {
      const config = preset.getConfig();
      const slugBase = preset.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'form';
      const uniqueSlug = `${slugBase}-${Date.now().toString().slice(-4)}`;

      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          name: preset.title,
          service_type: 'spark',
          description: config.description || '',
          template_id: preset.id,
          slug: uniqueSlug,
          draft_config: JSON.stringify(config)
        })
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Gagal membuat workspace formulir.');
      }

      showToast('Formulir berhasil dibuat!');
      onOpenBuilder(json);
    } catch (err: any) {
      showToast(err.message || 'Terjadi kesalahan.');
    } finally {
      setIsCreatingWorkspace(false);
    }
  };

  // ─── Create Workspace via Full Template Selector Modal ────────────────────

  const handleCreateWithTemplate = async (data: {
    name: string;
    template_id: TemplateId;
    slug: string;
    description: string;
  }) => {
    setIsCreatingWorkspace(true);
    setTemplateCreateError('');
    try {
      const tmpl = getTemplateById(data.template_id);
      const initialConfig = {
        ...tmpl.defaultConfig,
        eventName: data.name,
        description: data.description || tmpl.defaultConfig.description,
        blocks: data.template_id === 'blank' ? [] : (tmpl.defaultConfig.blocks || [])
      };

      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          name: data.name,
          service_type: 'spark',
          description: data.description,
          template_id: data.template_id,
          slug: data.slug || undefined,
          draft_config: JSON.stringify(initialConfig)
        })
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Gagal membuat workspace.');
      }

      setIsTemplateModalOpen(false);
      showToast('Workspace berhasil dibuat! Membuka Event Builder...');
      onOpenBuilder(json);
    } catch (err: any) {
      setTemplateCreateError(err.message || 'Terjadi kesalahan.');
    } finally {
      setIsCreatingWorkspace(false);
    }
  };

  // ─── Quick Edit ────────────────────────────────────────────────────────────

  const handleSaveEdit = async (data: { name: string; description: string; slug?: string }) => {
    if (!editingWs) return;
    setIsSavingEdit(true);
    setEditError('');
    try {
      const res = await fetch(`/api/workspaces/${editingWs.id}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify(data)
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Gagal menyimpan.');
      }
      showToast('Informasi workspace diperbarui.');
      setEditingWs(null);
      loadWorkspaces();
    } catch (err: any) {
      setEditError(err.message);
    } finally {
      setIsSavingEdit(false);
    }
  };

  // ─── Delete ────────────────────────────────────────────────────────────────

  const handleConfirmDelete = async () => {
    if (!deletingWs) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/workspaces/${deletingWs.id}`, {
        method: 'DELETE',
        headers: authHeaders
      });
      if (res.ok) {
        showToast('Workspace berhasil dihapus.');
        setDeletingWs(null);
        loadWorkspaces();
      }
    } catch {
      showToast('Gagal menghapus workspace.');
      setDeletingWs(null);
    } finally {
      setIsDeleting(false);
    }
  };

  // ─── Copy URL ──────────────────────────────────────────────────────────────

  const handleCopyUrl = (slug: string) => {
    const url = `${window.location.origin}/#event/${slug}`;
    navigator.clipboard.writeText(url);
    showToast('Tautan website event disalin!');
  };

  // ─── Open Dashboard Directly ───────────────────────────────────────────────

  const handleOpenDashboardDirectly = (ws: Workspace) => {
    sessionStorage.setItem('spark_default_tab', 'dashboard');
    onOpenBuilder(ws);
  };

  // ─── Profile Update ────────────────────────────────────────────────────────

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');
    setIsSavingProfile(true);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ name: profileName.trim() })
      });
      const json = await res.json();
      if (res.ok) {
        setProfileSuccess('Profil dan identitas panitia berhasil disimpan.');
        setDisplayedName(profileName.trim());
        localStorage.setItem('iventra_org_name', organization.trim());
        localStorage.setItem('iventra_committee_role', committeeRole);
        localStorage.setItem('iventra_phone', phone.trim());
        localStorage.setItem('iventra_bio', bio.trim());
        showToast('Profil panitia berhasil diperbarui.');
      } else {
        setProfileError(json.error || 'Gagal memperbarui profil.');
      }
    } catch {
      setProfileError('Gagal terhubung ke server.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // ─── Format Date ───────────────────────────────────────────────────────────

  const formatOpenedDate = (dateStr?: string) => {
    if (!dateStr) return 'Baru saja';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return 'Baru saja';
    }
  };

  // ─── Filtered Workspaces ───────────────────────────────────────────────────

  const filteredWorkspaces = workspaces
    .filter((ws) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = ws.name.toLowerCase().includes(q);
        const matchSlug = (ws.slug || '').toLowerCase().includes(q);
        const matchDesc = (ws.description || '').toLowerCase().includes(q);
        if (!matchName && !matchSlug && !matchDesc) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortOrder === 'alpha') {
        return a.name.localeCompare(b.name);
      }
      return new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime();
    });

  const totalCount = Math.max(workspaces.length, 6);
  const activeProjectsCount = 3;
  const publishedCount = Math.max(workspaces.filter((w) => w.status === 'published').length, 2);

  return (
    <div className="min-h-screen bg-[#f8f9fb] text-[#0b0c0e] flex flex-col font-sans selection:bg-[#1f2de6] selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-[#0b0c0e] text-white px-4 py-2.5 rounded-lg shadow-xl flex items-center gap-2.5 border border-white/10 animate-fadeIn font-mono text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ─── 1. TOP HEADER (Unified Global Bar) ─────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#e2e5ea] h-16 flex items-center px-4 sm:px-6 justify-between select-none shrink-0">
        {/* Left: Brand */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onBackToSite}
            className="flex items-center gap-2.5 hover:opacity-85 transition-opacity cursor-pointer text-left"
            title="Kembali ke landing page"
          >
            <Logo size="sm" />
            <span className="font-heading text-lg font-black tracking-tight text-[#0b0c0e]">
              IVENTRA
            </span>
          </button>
          <span className="px-2 py-0.5 rounded bg-[#f4f5f8] border border-[#e2e5ea] text-[#585d6b] text-[10px] font-mono font-bold tracking-wider uppercase">
            WORKSPACE
          </span>
        </div>

        {/* Center: Search input */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
          <div className="relative w-full">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[#8c93a0]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari workspace, formulir, event... /"
              className="w-full pl-9 pr-8 py-2 rounded-lg bg-[#f8f9fb] border border-[#e2e5ea] text-xs text-[#0b0c0e] placeholder-[#8c93a0] focus:bg-white focus:border-[#1f2de6] focus:outline-none transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8c93a0] hover:text-[#0b0c0e]"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Right Actions: Notifications & User Profile */}
        <div className="flex items-center gap-3">
          {/* Create Website CTA Button */}
          <button
            type="button"
            onClick={() => {
              setCurrentNav('settings');
              setSettingsTab('profile');
            }}
            className="flex items-center gap-2 pl-2 border-l border-[#e2e5ea] hover:opacity-85 transition-opacity cursor-pointer text-left focus:outline-none"
            title="Buka Pengaturan Profil Panitia"
          >
            <span className="material-symbols-outlined text-[16px]">add_circle</span>
            <span>Buat Website Baru</span>
          </button>

          {/* User Profile Pill */}
          <div className="flex items-center gap-2 pl-2 border-l border-[#e2e5ea]">
            <div className="w-8 h-8 rounded-full bg-[#1f2de6] text-white flex items-center justify-center font-heading font-bold text-xs shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="hidden lg:flex flex-col text-left leading-tight">
              <span className="text-xs font-bold text-[#0b0c0e]">{user.name}</span>
              <span className="text-[10px] font-mono text-[#8c93a0]">Panitia Event</span>
            </div>
          </button>
        </div>
      </header>

      {/* ─── 2. MAIN APP CONTAINER WITH SIDEBAR ─────────────────────────────── */}
      <div className="flex flex-1 w-full overflow-hidden">
        {/* ─── LEFT SIDEBAR (Fixed Workspace Navigation) ──────────────────────── */}
        <aside className="w-60 bg-white border-r border-[#e2e5ea] flex flex-col justify-between py-5 px-3 shrink-0 select-none">
          <div className="space-y-6">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8c93a0] px-3 block mb-2">
                Workspace Navigation
              </span>
              <nav className="space-y-1">
                {/* 1. Dashboard */}
                <button
                  type="button"
                  onClick={() => setCurrentNav('dashboard')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${currentNav === 'dashboard'
                    ? 'bg-[#edf2ff] text-[#1f2de6] font-bold'
                    : 'text-[#585d6b] hover:text-[#0b0c0e] hover:bg-[#f8f9fb]'
                    }`}
                >
                  <span className="material-symbols-outlined text-[18px]">space_dashboard</span>
                  <span>Dashboard</span>
                </button>

                {/* 2. My Workspaces */}
                <button
                  type="button"
                  onClick={() => setCurrentNav('workspaces')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${currentNav === 'workspaces'
                    ? 'bg-[#edf2ff] text-[#1f2de6] font-bold'
                    : 'text-[#585d6b] hover:text-[#0b0c0e] hover:bg-[#f8f9fb]'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[18px]">layers</span>
                    <span>My Workspaces</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-[#f4f5f8] border border-[#e2e5ea] text-[#585d6b]">
                    {workspaces.length}
                  </span>
                </button>

                {/* 3. Spark Builder */}
                <button
                  type="button"
                  onClick={() => {
                    if (workspaces.length > 0) {
                      onOpenBuilder(workspaces[0]);
                    } else {
                      setIsTemplateModalOpen(true);
                    }
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-[#585d6b] hover:text-[#0b0c0e] hover:bg-[#f8f9fb] transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">auto_fix_high</span>
                  <span>Spark Builder</span>
                </button>

                {/* 4. Templates */}
                <button
                  type="button"
                  onClick={() => setCurrentNav('templates')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${currentNav === 'templates'
                    ? 'bg-[#edf2ff] text-[#1f2de6] font-bold'
                    : 'text-[#585d6b] hover:text-[#0b0c0e] hover:bg-[#f8f9fb]'
                    }`}
                >
                  <span className="material-symbols-outlined text-[18px]">dashboard_customize</span>
                  <span>Templates</span>
                </button>

                {/* 5. Expert Services */}
                <button
                  type="button"
                  onClick={() => setCurrentNav('expert')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${currentNav === 'expert'
                    ? 'bg-[#edf2ff] text-[#1f2de6] font-bold'
                    : 'text-[#585d6b] hover:text-[#0b0c0e] hover:bg-[#f8f9fb]'
                    }`}
                >
                  <span className="material-symbols-outlined text-[18px]">support_agent</span>
                  <span>Expert Services</span>
                </button>

                {/* 6. Subscription */}
                <button
                  type="button"
                  onClick={() => setCurrentNav('subscription')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${currentNav === 'subscription'
                    ? 'bg-[#edf2ff] text-[#1f2de6] font-bold'
                    : 'text-[#585d6b] hover:text-[#0b0c0e] hover:bg-[#f8f9fb]'
                    }`}
                >
                  <span className="material-symbols-outlined text-[18px]">credit_card</span>
                  <span>Subscription</span>
                </button>

                {/* 7. Notifikasi */}
                <button
                  type="button"
                  onClick={() => setCurrentNav('notifications')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    currentNav === 'notifications'
                      ? 'bg-[#edf2ff] text-[#1f2de6] font-bold'
                      : 'text-[#585d6b] hover:text-[#0b0c0e] hover:bg-[#f8f9fb]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[18px]">notifications</span>
                    <span>Notifikasi</span>
                  </div>
                  {unreadNotifsCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-[#1f2de6] text-white text-[10px] font-mono font-bold">
                      {unreadNotifsCount}
                    </span>
                  )}
                </button>

                {/* 8. Settings */}
                <button
                  type="button"
                  onClick={() => setCurrentNav('settings')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${currentNav === 'settings'
                    ? 'bg-[#edf2ff] text-[#1f2de6] font-bold'
                    : 'text-[#585d6b] hover:text-[#0b0c0e] hover:bg-[#f8f9fb]'
                    }`}
                >
                  <span className="material-symbols-outlined text-[18px]">settings</span>
                  <span>Settings</span>
                </button>
              </nav>
            </div>
          </div>

          {/* Sidebar Footer */}
          <div className="p-3 rounded-xl bg-[#f8f9fb] border border-[#e2e5ea]">
            <div className="flex items-center justify-between text-xs font-bold text-[#0b0c0e] mb-1">
              <span className="font-heading">Spark Pro</span>
              <span className="font-mono text-[11px] text-[#1f2de6]">Aktif</span>
            </div>
            <p className="text-[10px] font-mono text-[#8c93a0]">Semua fitur kustomisasi aktif</p>
          </div>
        </aside>

        {/* ─── MAIN CONTENT VIEWPORT ─────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto bg-[#f8f9fb] p-6 lg:p-8">
          {/* VIEW 1: DASHBOARD (Clean Executive Overview) */}
          {currentNav === 'dashboard' && (
            <div className="space-y-6 max-w-7xl mx-auto animate-fadeIn">
              {/* 4 Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Total Workspaces */}
                <div className="p-5 rounded-xl bg-white border border-[#e2e5ea] flex flex-col justify-between shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-[#585d6b] uppercase">Total Workspaces</span>
                    <span className="material-symbols-outlined text-[20px] text-[#1f2de6]">folder_open</span>
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="font-heading text-3xl font-black text-[#0b0c0e]">{totalCount}</span>
                    <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                      +2 bln ini
                    </span>
                  </div>
                  <div className="w-full h-1 bg-[#1f2de6] rounded-full mt-3"></div>
                </div>

                {/* 2. Active Projects */}
                <div className="p-5 rounded-xl bg-white border border-[#e2e5ea] flex flex-col justify-between shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-[#585d6b] uppercase">Active Projects</span>
                    <span className="material-symbols-outlined text-[20px] text-[#1f2de6]">task_alt</span>
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="font-heading text-3xl font-black text-[#0b0c0e]">{activeProjectsCount}</span>
                    <span className="text-[11px] font-mono text-[#585d6b]">
                      2 Spark <strong className="text-[#0b0c0e]">1 Expert</strong>
                    </span>
                  </div>
                  <div className="w-full h-1 bg-[#0b0c0e] rounded-full mt-3"></div>
                </div>

                {/* 3. Published Websites */}
                <div className="p-5 rounded-xl bg-white border border-[#e2e5ea] flex flex-col justify-between shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-[#585d6b] uppercase">Published Websites</span>
                    <span className="material-symbols-outlined text-[20px] text-emerald-600">public</span>
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="font-heading text-3xl font-black text-[#0b0c0e]">{publishedCount}</span>
                    <span className="text-[11px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Live &amp; Accepting
                    </span>
                  </div>
                  <div className="w-full h-1 bg-emerald-500 rounded-full mt-3"></div>
                </div>

                {/* 4. Total Limit Kunjungan Website */}
                {(() => {
                  const used = 192;
                  const max = 1000;
                  const percent = Math.min(100, Math.round((used / max) * 100));
                  const isNearLimit = percent >= 80;
                  const isWarning = percent >= 65 && percent < 80;

                  const colorClass = isNearLimit
                    ? 'text-red-600'
                    : isWarning
                    ? 'text-amber-600'
                    : 'text-[#0b0c0e]';

                  const badgeBg = isNearLimit
                    ? 'bg-red-50 text-red-700 border-red-200'
                    : isWarning
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200';

                  const barColor = isNearLimit
                    ? 'bg-red-500'
                    : isWarning
                    ? 'bg-amber-500'
                    : 'bg-[#1f2de6]';

                  const iconColor = isNearLimit
                    ? 'text-red-600'
                    : isWarning
                    ? 'text-amber-600'
                    : 'text-[#1f2de6]';

                  return (
                    <div
                      className={`p-5 rounded-xl bg-white border ${
                        isNearLimit ? 'border-red-200' : 'border-[#e2e5ea]'
                      } flex flex-col justify-between shadow-2xs`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-[#585d6b] uppercase">
                          Limit Kunjungan Website
                        </span>
                        <span className={`material-symbols-outlined text-[20px] ${iconColor}`}>
                          data_usage
                        </span>
                      </div>
                      <div className="mt-3 flex items-baseline justify-between gap-1">
                        <div className="flex items-baseline gap-1">
                          <span className={`font-heading text-2xl font-black ${colorClass}`}>
                            {used}
                          </span>
                          <span className="text-xs font-mono text-[#8c93a0]">
                            / {max.toLocaleString('id-ID')} Traffic
                          </span>
                        </div>
                        <span className={`text-[11px] font-mono font-bold border px-1.5 py-0.5 rounded ${badgeBg}`}>
                          {percent}%
                        </span>
                      </div>
                      <div className="w-full bg-[#f1f3f7] h-1.5 rounded-full overflow-hidden mt-3">
                        <div
                          className={`h-full ${barColor} rounded-full transition-all duration-500`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Middle Section: Total Traffic Website Publikasi (Left: 8 cols) + Notifikasi Pembayaran Masuk (Right: 4 cols) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* 1. Total Traffic Website Publikasi */}
                <div className="lg:col-span-8 p-6 rounded-xl bg-white border border-[#e2e5ea] shadow-2xs flex flex-col justify-between">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#e2e5ea]">
                    <div>
                      <h3 className="font-heading text-base font-extrabold text-[#0b0c0e]">
                        Total Traffic Website Publikasi
                      </h3>
                      <p className="text-xs text-[#585d6b] mt-0.5">
                        Akumulasi kunjungan &amp; tayangan halaman website aktif
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>Realtime Traffic</span>
                    </div>
                  </div>

                  {/* Summary Metric Header */}
                  <div className="my-5 flex items-baseline justify-between">
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="font-heading text-3xl font-black text-[#0b0c0e]">24,850</span>
                        <span className="text-xs font-mono text-emerald-700 font-bold">+28.4% minggu ini</span>
                      </div>
                      <span className="text-xs font-mono text-[#8c93a0]">Total kunjungan unik</span>
                    </div>
                    <div className="text-right text-xs font-mono text-[#585d6b]">
                      Puncak: <strong className="text-[#0b0c0e]">Sabtu (5,420 kunjungan)</strong>
                    </div>
                  </div>

                  {/* Interactive SVG Area Chart */}
                  <div className="w-full h-44 relative">
                    <svg viewBox="0 0 700 150" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="trafficGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#1f2de6" stopOpacity="0.22" />
                          <stop offset="100%" stopColor="#1f2de6" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Grid Lines */}
                      <line x1="0" y1="35" x2="700" y2="35" stroke="#f1f3f7" strokeWidth="1" />
                      <line x1="0" y1="75" x2="700" y2="75" stroke="#f1f3f7" strokeWidth="1" />
                      <line x1="0" y1="115" x2="700" y2="115" stroke="#f1f3f7" strokeWidth="1" />

                      {/* Area Fill */}
                      <path
                        d="M 20,115 Q 130,105 240,90 T 460,65 T 590,25 T 680,40 L 680,145 L 20,145 Z"
                        fill="url(#trafficGradient)"
                      />

                      {/* Smooth Trend Line */}
                      <path
                        d="M 20,115 Q 130,105 240,90 T 460,65 T 590,25 T 680,40"
                        fill="none"
                        stroke="#1f2de6"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />

                      {/* Key Data Points */}
                      <circle cx="20" cy="115" r="3.5" fill="#1f2de6" />
                      <circle cx="240" cy="90" r="3.5" fill="#1f2de6" />
                      <circle cx="460" cy="65" r="3.5" fill="#1f2de6" />
                      <circle cx="590" cy="25" r="4.5" fill="#ffffff" stroke="#1f2de6" strokeWidth="2.5" />
                      <circle cx="680" cy="40" r="3.5" fill="#1f2de6" />
                    </svg>

                    {/* Day Labels */}
                    <div className="flex justify-between text-[11px] font-mono text-[#8c93a0] mt-2 px-1">
                      <span>Sen</span>
                      <span>Sel</span>
                      <span>Rab</span>
                      <span>Kam</span>
                      <span>Jum</span>
                      <span className="font-bold text-[#1f2de6]">Sab</span>
                      <span>Min</span>
                    </div>
                  </div>
                </div>

                {/* 2. Notifikasi Pembayaran Masuk */}
                <div className="lg:col-span-4 p-6 rounded-xl bg-white border border-[#e2e5ea] shadow-2xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-[#e2e5ea]">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px] text-[#1f2de6]">payments</span>
                        <h3 className="font-heading text-base font-extrabold text-[#0b0c0e]">
                          Pembayaran Masuk
                        </h3>
                      </div>
                      <span className="text-[10px] font-mono font-bold uppercase bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded">
                        Live
                      </span>
                    </div>

                    <div className="divide-y divide-[#f1f3f7] mt-3">
                      {INCOMING_PAYMENTS.map((payment) => (
                        <div key={payment.id} className="py-2.5 flex items-center justify-between gap-3">
                          <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-xs font-bold text-[#0b0c0e] truncate">{payment.name}</p>
                              <span className="text-[10px] font-mono text-[#8c93a0] shrink-0">• {payment.time}</span>
                            </div>
                            <p className="text-[11px] text-[#585d6b] truncate">{payment.event}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-xs font-mono font-extrabold text-[#0b0c0e] block">
                              {payment.amount}
                            </span>
                            <span className="text-[9px] font-mono font-bold uppercase text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 inline-block mt-0.5">
                              {payment.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#f1f3f7] mt-3 flex items-center justify-between text-xs font-mono">
                    <span className="text-[#8c93a0]">Total Hari Ini</span>
                    <span className="font-bold text-[#0b0c0e]">Rp 1.100.000</span>
                  </div>
                </div>
              </div>

              {/* Bottom Section: Workspace Terbaru (Minimalist Cards Grid) */}
              <div className="p-6 rounded-xl bg-white border border-[#e2e5ea] shadow-2xs">
                <div className="flex items-center justify-between pb-4 border-b border-[#e2e5ea] mb-5">
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading text-base font-extrabold text-[#0b0c0e]">
                      Workspace Terbaru
                    </h3>
                    <span className="text-[11px] font-mono bg-[#f4f5f8] border border-[#e2e5ea] px-2 py-0.5 rounded text-[#585d6b]">
                      {workspaces.length > 0 ? workspaces.length : 3} aktif
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setCurrentNav('workspaces')}
                    className="text-xs font-mono font-bold text-[#1f2de6] hover:underline cursor-pointer"
                  >
                    Lihat Semua →
                  </button>
                </div>

                {/* Horizontal Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(workspaces.length > 0
                    ? workspaces
                    : [
                        {
                          id: 'demo-1',
                          owner_id: user.id,
                          name: 'National Tech Innovation Summit 2026',
                          service_type: 'spark',
                          status: 'published',
                          slug: 'tech-summit-2026',
                          description: null,
                          created_at: new Date().toISOString(),
                          updated_at: new Date().toISOString(),
                        },
                        {
                          id: 'demo-2',
                          owner_id: user.id,
                          name: 'Untitled Event',
                          service_type: 'spark',
                          status: 'draft',
                          slug: 'untitled-event',
                          description: null,
                          created_at: new Date().toISOString(),
                          updated_at: new Date().toISOString(),
                        },
                      ]
                  ).map((ws, idx) => (
                    <div
                      key={ws.id}
                      onClick={() => onOpenBuilder(ws)}
                      className="group rounded-xl border border-[#e2e5ea] bg-white overflow-hidden shadow-2xs hover:shadow-md hover:border-[#1f2de6]/40 transition-all cursor-pointer flex flex-row items-stretch h-36"
                    >
                      {/* 1. Gambar Website Aslinya Realtime (ala Google Docs) */}
                      <div className="w-48 sm:w-56 h-full shrink-0 border-r border-[#e2e5ea] bg-slate-950 overflow-hidden relative">
                        <RealtimeWebsiteThumbnail ws={ws} />
                        <span className="absolute bottom-2 left-2 text-[9px] font-mono font-bold uppercase bg-black/70 backdrop-blur-xs text-white px-1.5 py-0.5 rounded z-20">
                          {ws.service_type === 'expert' ? 'Expert' : 'Spark Pro'}
                        </span>
                      </div>

                      {/* 2. Judul Workspace & 3. Total Pengunjung */}
                      <div className="p-4 flex flex-col justify-between flex-1 min-w-0">
                        <div className="space-y-1">
                          <h4 className="font-heading font-bold text-sm sm:text-base text-[#0b0c0e] group-hover:text-[#1f2de6] transition-colors line-clamp-2 tracking-tight">
                            {ws.name}
                          </h4>
                          <span className="text-[10px] font-mono text-[#8c93a0] block truncate">
                            {ws.slug ? `${ws.slug}.iventra.live` : 'Draft Workspace'}
                          </span>
                        </div>

                        <div className="pt-2 border-t border-[#f1f3f7] flex items-center justify-between text-xs font-mono text-[#585d6b]">
                          <span className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[16px] text-[#1f2de6]">visibility</span>
                            <strong className="text-[#0b0c0e] font-bold">{getWorkspaceVisitorCount(ws, idx)}</strong>
                            <span className="hidden sm:inline">Pengunjung</span>
                          </span>
                          <span className="text-[#1f2de6] font-bold group-hover:translate-x-1 transition-transform">
                            →
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* VIEW 2: MY WORKSPACES (OVERHAULED: Google Forms Layout + Iventra Clean Design) */}
          {currentNav === 'workspaces' && (
            <div className="space-y-6 max-w-7xl mx-auto animate-fadeIn">
              {/* Header Title & Quick Action */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-[#1f2de6] font-bold mb-1">
                    <span>Workspace Hub</span>
                    <span>•</span>
                    <span className="text-[#585d6b]">Formulir &amp; Website Event</span>
                  </div>
                  <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#0b0c0e] tracking-tight">
                    My Workspaces
                  </h1>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={loadWorkspaces}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#e2e5ea] bg-white hover:bg-[#f4f5f8] text-[#0b0c0e] text-xs font-mono font-bold transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">sync</span>
                    <span>Sync</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsTemplateModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1f2de6] hover:bg-[#1622b8] text-white text-xs font-semibold tracking-tight shadow-xs transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    <span>+ Template Lengkap</span>
                  </button>
                </div>
              </div>

              {/* ─── SECTION 1: START A NEW FORM (Google Forms Top Bar in Iventra Style) ─── */}
              <div className="rounded-2xl border border-[#e2e5ea] bg-white p-5 sm:p-6 shadow-2xs">
                {/* Section Header */}
                <div className="flex items-center justify-between pb-3.5">
                  <h3 className="font-heading text-sm font-bold text-[#0b0c0e] tracking-tight">
                    Mulai Formulir Baru
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsTemplateModalOpen(true)}
                    className="text-xs font-mono font-bold text-[#1f2de6] hover:underline flex items-center gap-1"
                  >
                    <span>Galeri Template</span>
                    <span className="material-symbols-outlined text-[15px]">unfold_more</span>
                  </button>
                </div>

                {/* 5 Preset Template Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                  {FORM_PRESETS.map((tmpl) => {
                    const isBlank = tmpl.id === 'blank';
                    return (
                      <div
                        key={tmpl.id}
                        onClick={() => handleQuickCreateForm(tmpl)}
                        className="flex flex-col cursor-pointer group select-none"
                      >
                        {/* Card Box */}
                        <div className="h-[124px] rounded-xl border border-[#e2e5ea] bg-[#f8f9fb] group-hover:bg-white group-hover:border-[#1f2de6] group-hover:shadow-md transition-all relative flex flex-col overflow-hidden">
                          {isBlank ? (
                            /* Google Plus Style with Iventra Palette */
                            <div className="flex items-center justify-center w-full h-full bg-white">
                              <div className="w-11 h-11 rounded-full bg-[#edf2ff] group-hover:bg-[#1f2de6] flex items-center justify-center transition-colors">
                                <span className="material-symbols-outlined text-[26px] text-[#1f2de6] group-hover:text-white transition-colors">
                                  add
                                </span>
                              </div>
                            </div>
                          ) : (
                            /* Document Preview Mockup */
                            <div className="w-full h-full p-2.5 flex flex-col">
                              {/* Accent Top Strip */}
                              <div
                                className="h-2 rounded-t-sm w-full mb-2 shrink-0"
                                style={{ backgroundColor: tmpl.accentColor }}
                              />
                              {/* Document Body */}
                              <div className="bg-white rounded-md p-2 shadow-2xs border border-[#e2e5ea] flex-1 flex flex-col gap-1.5 overflow-hidden">
                                <div className="h-2 bg-[#0b0c0e]/80 rounded-xs w-3/4 mb-0.5" />
                                <div className="h-1 bg-[#e2e5ea] rounded-xs w-full" />
                                <div className="h-1 bg-[#e2e5ea] rounded-xs w-2/3" />
                                <div className="mt-1 pt-1 border-t border-[#f1f3f4] flex flex-col gap-1">
                                  <div className="h-1.5 bg-[#8c93a0] rounded-xs w-1/2" />
                                  <div className="h-2 border border-[#e2e5ea] rounded-xs w-full bg-[#f8f9fb]" />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Title Label Underneath */}
                        <span className="mt-2 text-xs font-semibold text-[#0b0c0e] group-hover:text-[#1f2de6] transition-colors truncate">
                          {tmpl.title}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ─── SECTION 2: RECENT FORMS (Google Forms Grid/List in Iventra Style) ─── */}
              <div className="rounded-2xl border border-[#e2e5ea] bg-white p-5 sm:p-6 shadow-2xs">
                {/* Toolbar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#e2e5ea]">
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading text-base font-extrabold text-[#0b0c0e]">
                      Formulir Terbaru
                    </h3>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#f4f5f8] border border-[#e2e5ea] text-[#585d6b]">
                      {filteredWorkspaces.length} formulir
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Owned by anyone Dropdown */}
                    <div className="relative" ref={filterRef}>
                      <button
                        type="button"
                        onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#e2e5ea] bg-[#f8f9fb] hover:bg-white text-xs font-mono font-bold text-[#0b0c0e] transition-colors cursor-pointer"
                      >
                        <span>{ownershipFilter === 'anyone' ? 'Semua Pemilik' : 'Milik Saya'}</span>
                        <span className="material-symbols-outlined text-[16px]">arrow_drop_down</span>
                      </button>

                      {isFilterDropdownOpen && (
                        <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-xl border border-[#e2e5ea] py-1 z-30 animate-fadeIn">
                          <button
                            type="button"
                            onClick={() => {
                              setOwnershipFilter('anyone');
                              setIsFilterDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-1.5 text-xs font-mono transition-colors ${ownershipFilter === 'anyone' ? 'bg-[#edf2ff] text-[#1f2de6] font-bold' : 'text-[#0b0c0e] hover:bg-[#f8f9fb]'
                              }`}
                          >
                            Semua Pemilik
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setOwnershipFilter('me');
                              setIsFilterDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-1.5 text-xs font-mono transition-colors ${ownershipFilter === 'me' ? 'bg-[#edf2ff] text-[#1f2de6] font-bold' : 'text-[#0b0c0e] hover:bg-[#f8f9fb]'
                              }`}
                          >
                            Milik Saya
                          </button>
                        </div>
                      )}
                    </div>

                    {/* View Switcher: Grid / List */}
                    <div className="flex items-center border border-[#e2e5ea] rounded-lg bg-[#f8f9fb] p-0.5">
                      <button
                        type="button"
                        onClick={() => setViewMode('grid')}
                        className={`p-1.5 rounded transition-colors cursor-pointer ${viewMode === 'grid' ? 'bg-white text-[#1f2de6] shadow-2xs font-bold' : 'text-[#8c93a0]'
                          }`}
                        title="Tampilan Grid"
                      >
                        <span className="material-symbols-outlined text-[16px]">grid_view</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewMode('list')}
                        className={`p-1.5 rounded transition-colors cursor-pointer ${viewMode === 'list' ? 'bg-white text-[#1f2de6] shadow-2xs font-bold' : 'text-[#8c93a0]'
                          }`}
                        title="Tampilan List"
                      >
                        <span className="material-symbols-outlined text-[16px]">view_list</span>
                      </button>
                    </div>

                    {/* Sort Order */}
                    <button
                      type="button"
                      onClick={() => setSortOrder(sortOrder === 'date' ? 'alpha' : 'date')}
                      className={`p-1.5 rounded-lg border border-[#e2e5ea] transition-colors cursor-pointer ${sortOrder === 'alpha' ? 'bg-[#edf2ff] text-[#1f2de6] border-[#1f2de6]/30' : 'bg-white text-[#585d6b] hover:bg-[#f8f9fb]'
                        }`}
                      title={sortOrder === 'date' ? 'Urutkan Berdasarkan Abjad (A-Z)' : 'Urutkan Berdasarkan Waktu'}
                    >
                      <span className="material-symbols-outlined text-[18px]">sort_by_alpha</span>
                    </button>
                  </div>
                </div>

                {/* Content */}
                {isLoading ? (
                  <div className="py-20 text-center">
                    <div className="w-7 h-7 border-3 border-[#1f2de6] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-xs font-mono text-[#585d6b]">Memuat formulir...</p>
                  </div>
                ) : filteredWorkspaces.length === 0 ? (
                  /* Empty State */
                  <div className="py-16 text-center flex flex-col items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-[#f4f5f8] flex items-center justify-center text-[#585d6b] mb-3">
                      <span className="material-symbols-outlined text-[28px]">assignment</span>
                    </div>
                    <h4 className="font-heading text-sm font-bold text-[#0b0c0e]">Belum Ada Formulir Ditemukan</h4>
                    <p className="text-xs text-[#585d6b] mt-1 mb-4">
                      Klik salah satu template di atas untuk mulai membuat formulir pendaftaran.
                    </p>
                  </div>
                ) : viewMode === 'grid' ? (
                  /* ─── Grid View (Google Forms Card Architecture in Iventra Style) ─── */
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 mt-4">
                    {filteredWorkspaces.map((ws) => {
                      const isPublished = ws.status === 'published';
                      const isMenuOpen = activeMenuWsId === ws.id;

                      let bannerColor = '#1f2de6';
                      if (ws.template_id === 'contact') bannerColor = '#059669';
                      else if (ws.template_id === 'rsvp') bannerColor = '#2563eb';
                      else if (ws.template_id === 'party') bannerColor = '#ea580c';
                      else if (ws.template_id === 'tshirt') bannerColor = '#7c3aed';

                      return (
                        <div
                          key={ws.id}
                          onClick={() => onOpenBuilder(ws)}
                          className="border border-[#e2e5ea] rounded-xl bg-white overflow-hidden hover:border-[#1f2de6] hover:shadow-md transition-all cursor-pointer flex flex-col group relative"
                        >
                          {/* Realtime Live Website Thumbnail (Google Docs style) */}
                          <RealtimeWorkspaceThumbnail workspace={ws} />

                          {/* Lower Metadata Area */}
                          <div className="p-3.5 bg-white border-t border-[#e2e5ea] flex flex-col justify-between">
                            {/* Title */}
                            <div
                              className="font-heading text-xs font-bold text-[#0b0c0e] truncate group-hover:text-[#1f2de6] transition-colors mb-2.5"
                              title={ws.name}
                            >
                              {ws.name}
                            </div>

                            {/* Subrow */}
                            <div className="flex items-center justify-between text-xs text-[#585d6b]">
                              <div className="flex items-center gap-1.5 min-w-0">
                                {/* Iventra Blue Document Icon */}
                                <div className="w-5 h-5 rounded bg-[#edf2ff] text-[#1f2de6] flex items-center justify-center shrink-0">
                                  <span className="material-symbols-outlined text-[13px]">assignment</span>
                                </div>

                                {isPublished && (
                                  <span className="material-symbols-outlined text-[15px] text-emerald-600 shrink-0" title="Published">
                                    public
                                  </span>
                                )}

                                <span className="text-[10px] font-mono text-[#8c93a0] truncate">
                                  {formatOpenedDate(ws.updated_at || ws.created_at)}
                                </span>
                              </div>

                              {/* 3-dots Menu Button */}
                              <div className="relative ws-card-menu">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveMenuWsId(isMenuOpen ? null : ws.id);
                                  }}
                                  className="w-7 h-7 rounded-lg hover:bg-[#f4f5f8] text-[#585d6b] hover:text-[#0b0c0e] flex items-center justify-center transition-colors cursor-pointer"
                                  title="Opsi workspace"
                                >
                                  <span className="material-symbols-outlined text-[18px]">more_vert</span>
                                </button>

                                {/* Dropdown Menu */}
                                {isMenuOpen && (
                                  <div className="absolute right-0 bottom-8 w-44 bg-white rounded-xl shadow-xl border border-[#e2e5ea] py-1.5 z-40 animate-fadeIn text-xs text-[#0b0c0e]">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveMenuWsId(null);
                                        onOpenBuilder(ws);
                                      }}
                                      className="w-full text-left px-3.5 py-2 hover:bg-[#f8f9fb] flex items-center gap-2.5 transition-colors cursor-pointer font-semibold"
                                    >
                                      <span className="material-symbols-outlined text-[16px] text-[#1f2de6]">edit_document</span>
                                      <span>Buka Canvas</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveMenuWsId(null);
                                        handleOpenDashboardDirectly(ws);
                                      }}
                                      className="w-full text-left px-3.5 py-2 hover:bg-[#f8f9fb] flex items-center gap-2.5 transition-colors cursor-pointer font-semibold"
                                    >
                                      <span className="material-symbols-outlined text-[16px] text-emerald-600">table_chart</span>
                                      <span>Buka Dashboard</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveMenuWsId(null);
                                        setEditingWs(ws);
                                      }}
                                      className="w-full text-left px-3.5 py-2 hover:bg-[#f8f9fb] flex items-center gap-2.5 transition-colors cursor-pointer"
                                    >
                                      <span className="material-symbols-outlined text-[16px] text-[#585d6b]">drive_file_rename_outline</span>
                                      <span>Ganti Nama</span>
                                    </button>

                                    {isPublished && ws.slug && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setActiveMenuWsId(null);
                                          handleCopyUrl(ws.slug!);
                                        }}
                                        className="w-full text-left px-3.5 py-2 hover:bg-[#f8f9fb] flex items-center gap-2.5 transition-colors cursor-pointer"
                                      >
                                        <span className="material-symbols-outlined text-[16px] text-[#585d6b]">link</span>
                                        <span>Salin Tautan</span>
                                      </button>
                                    )}

                                    <div className="border-t border-[#f1f3f4] my-1" />

                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveMenuWsId(null);
                                        setDeletingWs(ws);
                                      }}
                                      className="w-full text-left px-3.5 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2.5 transition-colors cursor-pointer font-semibold"
                                    >
                                      <span className="material-symbols-outlined text-[16px]">delete</span>
                                      <span>Hapus</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* ─── List View (Clean Table) ─── */
                  <div className="border border-[#e2e5ea] rounded-xl overflow-hidden mt-4">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-[#e2e5ea] bg-[#f8f9fb] text-[#585d6b] font-mono uppercase text-[10px]">
                          <th className="py-3 px-4">Nama Formulir</th>
                          <th className="py-3 px-4 hidden sm:table-cell">Status</th>
                          <th className="py-3 px-4">Terakhir Diperbarui</th>
                          <th className="py-3 px-4 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#e2e5ea]">
                        {filteredWorkspaces.map((ws) => (
                          <tr
                            key={ws.id}
                            onClick={() => onOpenBuilder(ws)}
                            className="hover:bg-[#f8f9fb] transition-colors cursor-pointer group"
                          >
                            <td className="py-3.5 px-4 flex items-center gap-3">
                              <div className="w-7 h-7 rounded-lg bg-[#edf2ff] text-[#1f2de6] flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-[15px]">assignment</span>
                              </div>
                              <span className="font-heading font-bold text-xs text-[#0b0c0e] group-hover:text-[#1f2de6] transition-colors truncate max-w-xs sm:max-w-md">
                                {ws.name}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 hidden sm:table-cell">
                              <span
                                className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded ${ws.status === 'published'
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : 'bg-[#f4f5f8] text-[#585d6b] border border-[#e2e5ea]'
                                  }`}
                              >
                                {ws.status === 'published' ? '● Live' : 'Draft'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-[11px] font-mono text-[#585d6b]">
                              {formatOpenedDate(ws.updated_at || ws.created_at)}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenDashboardDirectly(ws);
                                }}
                                className="px-3 py-1 rounded-lg border border-[#e2e5ea] hover:bg-white text-[#0b0c0e] text-xs font-mono font-bold mr-2 cursor-pointer"
                              >
                                Dashboard
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeletingWs(ws);
                                }}
                                className="p-1 rounded-lg hover:bg-red-50 text-[#8c93a0] hover:text-red-600 transition-colors cursor-pointer"
                                title="Hapus"
                              >
                                <span className="material-symbols-outlined text-[16px]">delete</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VIEW 3: TEMPLATES SHOWCASE */}
          {currentNav === 'templates' && (
            <div className="space-y-6 max-w-7xl mx-auto animate-fadeIn">
              <div className="p-6 rounded-2xl bg-white border border-[#e2e5ea] shadow-2xs">
                <GalleryHoverCarousel
                  heading="Template Event Siap Pakai"
                  subheading="Pilih arsitektur desain yang dirancang khusus untuk konferensi, kompetisi nasional, maupun festival kampus."
                  onSelectItem={() => {
                    setIsTemplateModalOpen(true);
                  }}
                  className="py-0"
                />
              </div>
            </div>
          )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {SPARK_TEMPLATES.map((tmpl) => (
                  <div
                    key={tmpl.id}
                    className="rounded-xl border border-[#e2e5ea] bg-white overflow-hidden shadow-2xs flex flex-col justify-between"
                  >
                    <div>
                      <div className={`h-36 bg-gradient-to-tr ${tmpl.previewGradient} p-4 text-white flex flex-col justify-between`}>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold uppercase bg-black/40 px-2 py-0.5 rounded text-white">
                            {tmpl.category}
                          </span>
                          <span className="text-[10px] font-mono font-bold uppercase bg-white text-[#0b0c0e] px-2 py-0.5 rounded">
                            {tmpl.badge}
                          </span>
                        </div>
                        <h3 className="font-heading text-lg font-bold text-white">
                          {tmpl.name}
                        </h3>
                      </div>
                      <h2 className="font-heading text-xl sm:text-2xl font-black text-[#0b0c0e] tracking-tight">
                        {subscription.planName}
                      </h2>
                    </div>

                      <div className="p-5 space-y-2.5">
                        <p className="text-xs text-[#585d6b] leading-relaxed">
                          {tmpl.description}
                        </p>
                        <div className="pt-2 border-t border-[#f1f3f4]">
                          <span className="text-[10px] font-mono uppercase text-[#8c93a0] block">Rekomendasi Format:</span>
                          <span className="text-xs font-semibold text-[#0b0c0e]">{tmpl.recommendedFor}</span>
                        </div>
                      </div>
                      <strong className="text-sm font-heading font-bold text-[#0b0c0e] block">
                        {formatIndonesianDate(subscription.purchasedAt)}
                      </strong>
                      <span className="text-[10px] font-mono text-[#585d6b] block">
                        Aktivasi Terkonfirmasi
                      </span>
                    </div>

                    {/* 2. Habis Masa Aktif / Expired */}
                    <div className="p-4 rounded-xl bg-[#f8f9fb] border border-[#e2e5ea] space-y-1.5">
                      <div className="flex items-center gap-2 text-[#8c93a0]">
                        <span className="material-symbols-outlined text-[16px] text-amber-600">
                          event_busy
                        </span>
                        <span className="font-mono text-[11px] uppercase tracking-wide">Habis Masa Berlaku</span>
                      </div>
                      <strong className="text-sm font-heading font-bold text-[#0b0c0e] block">
                        {formatIndonesianDate(subscription.expiresAt)}
                      </strong>
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {metrics.remainingDays > 0 ? `${metrics.remainingDays} Hari Tersisa` : 'Masa Aktif Habis'}
                      </span>
                    </div>

                    {/* 3. Kuota Token Website */}
                    <div className="p-4 rounded-xl bg-[#f8f9fb] border border-[#e2e5ea] space-y-1.5">
                      <div className="flex items-center gap-2 text-[#8c93a0]">
                        <span className="material-symbols-outlined text-[16px] text-[#1f2de6]">
                          token
                        </span>
                        <span className="font-mono text-[11px] uppercase tracking-wide">Token Website Event</span>
                      </div>
                      <strong className="text-sm font-heading font-bold text-[#0b0c0e] block">
                        {subscription.usedTokens} / {subscription.totalTokens} Digunakan
                      </strong>
                      <span className="text-[10px] font-mono text-[#585d6b] block">
                        {Math.max(0, subscription.totalTokens - subscription.usedTokens)} Token Slot Tersedia
                      </span>
                    </div>

                    {/* 4. Kapasitas Peserta */}
                    <div className="p-4 rounded-xl bg-[#f8f9fb] border border-[#e2e5ea] space-y-1.5">
                      <div className="flex items-center gap-2 text-[#8c93a0]">
                        <span className="material-symbols-outlined text-[16px] text-[#0b0c0e]">
                          group
                        </span>
                        <span className="font-mono text-[11px] uppercase tracking-wide">Batas Peserta</span>
                      </div>
                      <strong className="text-sm font-heading font-bold text-[#0b0c0e] block">
                        5.000 / Event
                      </strong>
                      <span className="text-[10px] font-mono text-emerald-700 block font-semibold">
                        SSL &amp; QR Presensi Aktif
                      </span>
                    </div>
                  </div>

                  {/* Progress Timeline Masa Aktif */}
                  <div className="p-4 rounded-xl bg-[#f8f9fb] border border-[#e2e5ea] space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#0b0c0e] font-heading">
                        Masa Berlangganan Berjalan
                      </span>
                      <span className="font-mono text-[11px] text-[#1f2de6] font-bold">
                        {metrics.remainingDays > 0 ? `${metrics.remainingDays} hari menuju perpanjangan` : 'Perlu diperpanjang'}
                      </span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-[#e2e5ea] overflow-hidden">
                      <div
                        className="h-full bg-[#1f2de6] rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(5, metrics.progressPercent))}%` }}
                      ></div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono text-[#8c93a0]">
                      <span>Mulai: {formatIndonesianDate(subscription.purchasedAt)}</span>
                      <span>Selesai: {formatIndonesianDate(subscription.expiresAt)}</span>
                    </div>
                  </div>

                  {/* Bottom Actions */}
                  <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setIsSubscriptionModalOpen(true)}
                        className="px-5 py-2.5 rounded-lg bg-[#1f2de6] hover:bg-[#1622b8] text-white text-xs font-semibold tracking-tight shadow-xs transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
                      >
                        <span className="material-symbols-outlined text-[16px]">add_card</span>
                        <span>Perpanjang / Tambah Kuota Token</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleToggleAutoRenew}
                        className="px-4 py-2.5 rounded-lg border border-[#e2e5ea] hover:bg-[#f8f9fb] text-xs font-semibold text-[#0b0c0e] transition-colors cursor-pointer"
                      >
                        Auto-Renew: {subscription.autoRenew ? 'Aktif (Nonaktifkan)' : 'Mati (Aktifkan)'}
                      </button>
                    </div>

                    <span className="text-xs font-mono text-[#8c93a0] text-center sm:text-right">
                      Invoice resmi diterbitkan otomatis
                    </span>
                  </div>
                </div>

                {/* Billing History / Invoices Table */}
                <div className="p-6 rounded-2xl bg-white border border-[#e2e5ea] shadow-2xs space-y-4">
                  <div className="flex items-center justify-between pb-2">
                    <div>
                      <h2 className="font-heading text-base font-bold text-[#0b0c0e]">
                        Riwayat Transaksi &amp; Invoice
                      </h2>
                      <p className="text-xs text-[#585d6b] mt-0.5">
                        Daftar bukti pembayaran resmi aktivasi paket Spark Pro Anda.
                      </p>
                    </div>
                  </div>

                  <div className="border border-[#e2e5ea] rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#f8f9fb] border-b border-[#e2e5ea] text-[#585d6b] font-mono text-[11px] uppercase">
                        <tr>
                          <th className="px-4 py-3 font-semibold">No. Invoice</th>
                          <th className="px-4 py-3 font-semibold">Tanggal Beli</th>
                          <th className="px-4 py-3 font-semibold">Rincian Paket</th>
                          <th className="px-4 py-3 font-semibold">Total</th>
                          <th className="px-4 py-3 font-semibold">Status</th>
                          <th className="px-4 py-3 font-semibold text-right">Struk</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#f0f2f5]">
                        {subscription.invoices.map((inv) => (
                          <tr key={inv.id} className="hover:bg-[#fafbfc] transition-colors">
                            <td className="px-4 py-3 font-mono font-bold text-[#0b0c0e]">
                              {inv.id}
                            </td>
                            <td className="px-4 py-3 text-[#585d6b] font-mono">
                              {formatIndonesianDate(inv.date)}
                            </td>
                            <td className="px-4 py-3 text-[#0b0c0e] font-medium">
                              {inv.planName}
                            </td>
                            <td className="px-4 py-3 font-mono font-bold text-[#0b0c0e]">
                              {inv.amount}
                            </td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                {inv.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                type="button"
                                onClick={() => showToast(`Mengunduh invoice ${inv.id}...`)}
                                className="px-2.5 py-1 rounded border border-[#e2e5ea] hover:bg-white text-[11px] font-mono text-[#0b0c0e] transition-colors cursor-pointer"
                              >
                                Unduh PDF
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* VIEW: NOTIFICATIONS (Dedicated Notification Center) */}
          {currentNav === 'notifications' && (
            <div className="space-y-6 max-w-4xl mx-auto animate-fadeIn pb-12">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#1f2de6] font-bold block mb-1">
                    Pusat Pemberitahuan
                  </span>
                  <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#0b0c0e] tracking-tight">
                    Notifikasi Event
                  </h1>
                  <p className="text-xs sm:text-sm text-[#585d6b] mt-1">
                    Pantau pendaftaran peserta, konfirmasi transaksi tiket, dan aktivitas sistem event secara real-time.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {unreadNotifsCount > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllAsRead}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#e2e5ea] hover:bg-[#f8f9fb] text-[#0b0c0e] text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px] text-emerald-600">done_all</span>
                      <span>Tandai Semua Dibaca</span>
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAllNotifications}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#e2e5ea] hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-[#585d6b] text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
                      <span>Bersihkan</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {[
                  { id: 'all', label: 'Semua', count: notifications.length },
                  { id: 'unread', label: 'Belum Dibaca', count: unreadNotifsCount },
                  {
                    id: 'registration',
                    label: 'Pendaftaran & Lomba',
                    count: notifications.filter((n) => n.category === 'registration' || n.category === 'submission').length
                  },
                  {
                    id: 'payment',
                    label: 'Tiket & Transaksi',
                    count: notifications.filter((n) => n.category === 'payment' || n.category === 'quota').length
                  },
                  {
                    id: 'system',
                    label: 'Sistem & Gateway',
                    count: notifications.filter((n) => n.category === 'broadcast' || n.category === 'system').length
                  }
                ].map((tab) => {
                  const isActive = notifFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setNotifFilter(tab.id as any)}
                      className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                        isActive
                          ? 'bg-[#0b0c0e] text-white shadow-2xs'
                          : 'bg-white border border-[#e2e5ea] text-[#585d6b] hover:text-[#0b0c0e] hover:bg-[#f8f9fb]'
                      }`}
                    >
                      <span>{tab.label}</span>
                      {tab.count !== undefined && (
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                            isActive ? 'bg-white/20 text-white' : 'bg-[#f0f2f5] text-[#585d6b]'
                          }`}
                        >
                          {tab.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Notification Cards Feed */}
              <div className="space-y-3">
                {filteredNotifications.length === 0 ? (
                  <div className="bg-white rounded-xl border border-[#e2e5ea] p-12 text-center space-y-3 shadow-2xs">
                    <div className="w-12 h-12 rounded-full bg-[#f8f9fb] border border-[#e2e5ea] flex items-center justify-center mx-auto text-[#8c93a0]">
                      <span className="material-symbols-outlined text-2xl">notifications_off</span>
                    </div>
                    <h3 className="font-heading text-sm font-bold text-[#0b0c0e]">Tidak Ada Notifikasi</h3>
                    <p className="text-xs text-[#585d6b] max-w-sm mx-auto">
                      Semua aktivitas event telah ditinjau atau belum ada pemberitahuan baru dalam kategori ini.
                    </p>
                  </div>
                ) : (
                  filteredNotifications.map((notif) => {
                    let badgeText = 'INFORMASI';
                    let badgeBg = 'bg-slate-100 text-slate-700 border-slate-200';
                    let iconBg = 'bg-slate-100 text-slate-700';

                    if (notif.category === 'registration') {
                      badgeText = 'REGISTRASI';
                      badgeBg = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                      iconBg = 'bg-emerald-50 text-emerald-600';
                    } else if (notif.category === 'payment') {
                      badgeText = 'TRANSAKSI';
                      badgeBg = 'bg-blue-50 text-[#1f2de6] border-blue-200';
                      iconBg = 'bg-[#edf2ff] text-[#1f2de6]';
                    } else if (notif.category === 'quota') {
                      badgeText = 'KUOTA EVENT';
                      badgeBg = 'bg-amber-50 text-amber-700 border-amber-200';
                      iconBg = 'bg-amber-50 text-amber-600';
                    } else if (notif.category === 'submission') {
                      badgeText = 'SUBMISI KARYA';
                      badgeBg = 'bg-purple-50 text-purple-700 border-purple-200';
                      iconBg = 'bg-purple-50 text-purple-600';
                    } else if (notif.category === 'broadcast') {
                      badgeText = 'WHATSAPP GATEWAY';
                      badgeBg = 'bg-teal-50 text-teal-700 border-teal-200';
                      iconBg = 'bg-teal-50 text-teal-600';
                    } else if (notif.category === 'system') {
                      badgeText = 'SISTEM IVENTRA';
                      badgeBg = 'bg-indigo-50 text-indigo-700 border-indigo-200';
                      iconBg = 'bg-indigo-50 text-indigo-600';
                    }

                    return (
                      <div
                        key={notif.id}
                        className={`group bg-white rounded-xl border transition-all duration-200 p-4 sm:p-5 flex items-start gap-4 ${
                          !notif.read
                            ? 'border-[#1f2de6]/30 shadow-xs bg-gradient-to-r from-blue-50/25 via-white to-white'
                            : 'border-[#e2e5ea] hover:border-[#ccd2db]'
                        }`}
                      >
                        {/* Icon */}
                        <div className="relative shrink-0 mt-0.5">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
                            <span className="material-symbols-outlined text-[20px]">{notif.icon}</span>
                          </div>
                          {!notif.read && (
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#1f2de6] ring-2 ring-white"></span>
                          )}
                        </div>

                        {/* Middle Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider border ${badgeBg}`}>
                              {badgeText}
                            </span>
                            <span className="text-[11px] font-mono text-[#8c93a0] flex items-center gap-1">
                              <span className="material-symbols-outlined text-[13px]">schedule</span>
                              {notif.timestamp}
                            </span>
                          </div>

                          <h4 className="font-heading text-sm font-bold text-[#0b0c0e]">
                            {notif.title}
                          </h4>
                          <p className="text-xs text-[#585d6b] mt-1 leading-relaxed">
                            {notif.message}
                          </p>

                          {/* Link Button */}
                          {notif.linkNav && notif.linkLabel && (
                            <div className="mt-3">
                              <button
                                type="button"
                                onClick={() => {
                                  handleToggleRead(notif.id, true);
                                  setCurrentNav(notif.linkNav!);
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#f8f9fb] hover:bg-[#edf2ff] border border-[#e2e5ea] hover:border-[#1f2de6]/30 text-xs font-semibold text-[#0b0c0e] hover:text-[#1f2de6] transition-all cursor-pointer"
                              >
                                <span>{notif.linkLabel}</span>
                                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => handleToggleRead(notif.id)}
                            className="w-8 h-8 rounded-lg hover:bg-[#f8f9fb] text-[#8c93a0] hover:text-[#0b0c0e] flex items-center justify-center transition-colors cursor-pointer"
                            title={notif.read ? 'Tandai belum dibaca' : 'Tandai sudah dibaca'}
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              {notif.read ? 'mark_chat_unread' : 'done'}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteNotification(notif.id)}
                            className="w-8 h-8 rounded-lg hover:bg-red-50 text-[#8c93a0] hover:text-red-600 flex items-center justify-center transition-colors cursor-pointer"
                            title="Hapus notifikasi"
                          >
                            <span className="material-symbols-outlined text-[18px]">close</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* VIEW 6: SETTINGS */}
          {currentNav === 'settings' && (
            <div className="space-y-6 max-w-4xl mx-auto animate-fadeIn pb-12">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#1f2de6] font-bold block mb-1">
                  Akun &amp; Keamanan
                </span>
                <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#0b0c0e] tracking-tight">
                  Pengaturan Akun Panitia
                </h1>
                <p className="text-xs sm:text-sm text-[#585d6b] mt-1">
                  Kelola identitas kepanitiaan, keamanan akun, dan preferensi operasional event Anda.
                </p>
              </div>

              {/* Sub-navigation Tabs */}
              <div className="flex items-center gap-1.5 p-1 bg-[#f0f2f5] rounded-xl border border-[#e2e5ea] overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setSettingsTab('profile')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    settingsTab === 'profile'
                      ? 'bg-white text-[#0b0c0e] shadow-2xs font-bold'
                      : 'text-[#585d6b] hover:text-[#0b0c0e]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">person</span>
                  <span>Profil Panitia</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSettingsTab('security')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    settingsTab === 'security'
                      ? 'bg-white text-[#0b0c0e] shadow-2xs font-bold'
                      : 'text-[#585d6b] hover:text-[#0b0c0e]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">shield</span>
                  <span>Keamanan &amp; Sandi</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSettingsTab('notifications')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    settingsTab === 'notifications'
                      ? 'bg-white text-[#0b0c0e] shadow-2xs font-bold'
                      : 'text-[#585d6b] hover:text-[#0b0c0e]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">tune</span>
                  <span>Preferensi Alert</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSettingsTab('account')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    settingsTab === 'account'
                      ? 'bg-white text-[#0b0c0e] shadow-2xs font-bold'
                      : 'text-[#585d6b] hover:text-[#0b0c0e]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">power_settings_new</span>
                  <span>Sesi &amp; Keluar</span>
                </button>
              </div>

              {/* TAB 1: PROFIL PANITIA */}
              {settingsTab === 'profile' && (
                <div className="space-y-6">
                  {/* Identity Card */}
                  <div className="p-6 rounded-xl bg-white border border-[#e2e5ea] shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-[#0b0c0e] text-white flex items-center justify-center font-heading font-black text-2xl shrink-0 shadow-xs border-2 border-white ring-2 ring-[#e2e5ea]">
                        {displayedName.charAt(0).toUpperCase()}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h2 className="font-heading text-lg font-bold text-[#0b0c0e]">
                            {displayedName}
                          </h2>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Terverifikasi
                          </span>
                        </div>
                        <p className="text-xs text-[#585d6b] flex items-center gap-1.5">
                          <span>{organization}</span>
                          <span>•</span>
                          <span className="font-medium text-[#0b0c0e]">{committeeRole}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span className="px-2.5 py-1 rounded-md bg-[#f8f9fb] border border-[#e2e5ea] text-[#585d6b]">
                        ID: {user.id.slice(0, 8)}...
                      </span>
                    </div>
                  </div>

                  {/* Profile Edit Form */}
                  <div className="p-6 rounded-xl bg-white border border-[#e2e5ea] shadow-2xs">
                    <form onSubmit={handleSaveProfile} className="space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-[#0b0c0e] uppercase tracking-wider">
                            Nama Lengkap Panitia
                          </label>
                          <input
                            type="text"
                            value={profileName}
                            onChange={(e) => setProfileName(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-lg border border-[#e2e5ea] bg-white text-sm text-[#0b0c0e] focus:border-[#1f2de6] focus:outline-none transition-all"
                            required
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-[#0b0c0e] uppercase tracking-wider flex items-center justify-between">
                            <span>Email Akun</span>
                            <span className="text-[10px] font-normal text-emerald-600 lowercase font-mono">Terkunci</span>
                          </label>
                          <input
                            type="email"
                            value={user.email}
                            disabled
                            className="w-full px-3.5 py-2.5 rounded-lg border border-[#e2e5ea] bg-[#f8f9fb] text-sm text-[#8c93a0] cursor-not-allowed font-mono"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-[#0b0c0e] uppercase tracking-wider">
                            Asal Instansi / Kampus / Komunitas
                          </label>
                          <input
                            type="text"
                            value={organization}
                            onChange={(e) => setOrganization(e.target.value)}
                            placeholder="Contoh: SMK Telkom Sidoarjo / BEM UI"
                            className="w-full px-3.5 py-2.5 rounded-lg border border-[#e2e5ea] bg-white text-sm text-[#0b0c0e] focus:border-[#1f2de6] focus:outline-none transition-all"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-[#0b0c0e] uppercase tracking-wider">
                            Nomor WhatsApp Panitia
                          </label>
                          <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+62 812-3456-7890"
                            className="w-full px-3.5 py-2.5 rounded-lg border border-[#e2e5ea] bg-white text-sm text-[#0b0c0e] focus:border-[#1f2de6] focus:outline-none transition-all"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-[#0b0c0e] uppercase tracking-wider">
                            Peran dalam Kepanitiaan
                          </label>
                          <select
                            value={committeeRole}
                            onChange={(e) => setCommitteeRole(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-lg border border-[#e2e5ea] bg-white text-sm text-[#0b0c0e] focus:border-[#1f2de6] focus:outline-none transition-all"
                          >
                            <option value="Ketua Panitia / Project Lead">Ketua Panitia / Project Lead</option>
                            <option value="Koordinator Divisi Acara">Koordinator Divisi Acara</option>
                            <option value="Divisi Registrasi &amp; Tiket">Divisi Registrasi &amp; Tiket</option>
                            <option value="Divisi Publikasi &amp; Desain">Divisi Publikasi &amp; Desain</option>
                            <option value="Divisi Sponsorship &amp; Dana">Divisi Sponsorship &amp; Dana</option>
                            <option value="Bendahara Event">Bendahara Event</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-[#0b0c0e] uppercase tracking-wider">
                            Zona Waktu Event
                          </label>
                          <select
                            value={eventTimezone}
                            onChange={(e) => setEventTimezone(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-lg border border-[#e2e5ea] bg-white text-sm text-[#0b0c0e] focus:border-[#1f2de6] focus:outline-none transition-all font-mono text-xs"
                          >
                            <option value="Asia/Jakarta">Asia/Jakarta (WIB - UTC+7)</option>
                            <option value="Asia/Makassar">Asia/Makassar (WITA - UTC+8)</option>
                            <option value="Asia/Jayapura">Asia/Jayapura (WIT - UTC+9)</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-[#0b0c0e] uppercase tracking-wider">
                          Catatan Operasional Panitia
                        </label>
                        <textarea
                          rows={2}
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          placeholder="Deskripsi singkat tanggung jawab kepanitiaan Anda..."
                          className="w-full px-3.5 py-2 rounded-lg border border-[#e2e5ea] bg-white text-sm text-[#0b0c0e] focus:border-[#1f2de6] focus:outline-none transition-all resize-none"
                        />
                      </div>

                      {profileError && (
                        <p className="text-xs font-mono text-red-600">{profileError}</p>
                      )}
                      {profileSuccess && (
                        <p className="text-xs font-mono text-emerald-700">{profileSuccess}</p>
                      )}

                      <div className="pt-2 flex items-center justify-between border-t border-[#e2e5ea]">
                        <span className="text-xs text-[#8c93a0]">
                          Perubahan langsung terhubung ke sistem tiket &amp; email event.
                        </span>
                        <button
                          type="submit"
                          disabled={isSavingProfile}
                          className="px-5 py-2.5 rounded-lg bg-[#0b0c0e] hover:bg-[#1f2de6] text-white text-xs font-semibold tracking-tight transition-colors cursor-pointer shadow-xs active:scale-[0.98]"
                        >
                          {isSavingProfile ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* TAB 2: KEAMANAN & SANDI */}
              {settingsTab === 'security' && (
                <div className="space-y-6">
                  {/* Change Password Card */}
                  <div className="p-6 rounded-xl bg-white border border-[#e2e5ea] shadow-2xs space-y-4">
                    <div>
                      <h2 className="font-heading text-base font-bold text-[#0b0c0e]">
                        Perbarui Kata Sandi
                      </h2>
                      <p className="text-xs text-[#585d6b] mt-0.5">
                        Gunakan kombinasi minimal 8 karakter dengan huruf, angka, dan simbol.
                      </p>
                    </div>

                    <form onSubmit={handleSavePassword} className="space-y-4 max-w-lg">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-[#0b0c0e] uppercase tracking-wider">
                          Password Saat Ini
                        </label>
                        <input
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full px-3.5 py-2.5 rounded-lg border border-[#e2e5ea] bg-white text-sm text-[#0b0c0e] focus:border-[#1f2de6] focus:outline-none transition-all"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-[#0b0c0e] uppercase tracking-wider">
                            Password Baru
                          </label>
                          <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Minimal 8 karakter"
                            className="w-full px-3.5 py-2.5 rounded-lg border border-[#e2e5ea] bg-white text-sm text-[#0b0c0e] focus:border-[#1f2de6] focus:outline-none transition-all"
                            required
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-[#0b0c0e] uppercase tracking-wider">
                            Konfirmasi Password Baru
                          </label>
                          <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Ulangi password baru"
                            className="w-full px-3.5 py-2.5 rounded-lg border border-[#e2e5ea] bg-white text-sm text-[#0b0c0e] focus:border-[#1f2de6] focus:outline-none transition-all"
                            required
                          />
                        </div>
                      </div>

                      {passwordError && (
                        <p className="text-xs font-mono text-red-600">{passwordError}</p>
                      )}
                      {passwordSuccess && (
                        <p className="text-xs font-mono text-emerald-700">{passwordSuccess}</p>
                      )}

                      <div className="pt-2">
                        <button
                          type="submit"
                          disabled={isSavingPassword}
                          className="px-5 py-2.5 rounded-lg bg-[#0b0c0e] hover:bg-[#1f2de6] text-white text-xs font-semibold tracking-tight transition-colors cursor-pointer shadow-xs active:scale-[0.98]"
                        >
                          {isSavingPassword ? 'Menyimpan...' : 'Perbarui Password'}
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* 2FA Card */}
                  <div className="p-6 rounded-xl bg-white border border-[#e2e5ea] shadow-2xs flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h2 className="font-heading text-base font-bold text-[#0b0c0e]">
                          Autentikasi Dua Langkah (2FA)
                        </h2>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold ${
                          twoFactorEnabled
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
                        }`}>
                          {twoFactorEnabled ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </div>
                      <p className="text-xs text-[#585d6b]">
                        Wajibkan verifikasi OTP kode saat panitia login dari perangkat baru.
                      </p>
                    </div>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={twoFactorEnabled}
                      onClick={handleToggle2FA}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        twoFactorEnabled ? 'bg-[#1f2de6]' : 'bg-[#d1d5dc]'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          twoFactorEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Active Sessions Card */}
                  <div className="p-6 rounded-xl bg-white border border-[#e2e5ea] shadow-2xs space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="font-heading text-base font-bold text-[#0b0c0e]">
                          Sesi Login Aktif
                        </h2>
                        <p className="text-xs text-[#585d6b] mt-0.5">
                          Perangkat yang saat ini sedang terhubung ke akun panitia ini.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => showToast('Semua sesi eksternal berhasil dihentikan.')}
                        className="px-3 py-1.5 rounded-lg border border-[#e2e5ea] hover:bg-[#f8f9fb] text-xs font-semibold text-[#0b0c0e] transition-colors cursor-pointer"
                      >
                        Keluar Sesi Lain
                      </button>
                    </div>

                    <div className="divide-y divide-[#f0f2f5] border border-[#e2e5ea] rounded-lg overflow-hidden text-xs">
                      <div className="p-3.5 flex items-center justify-between bg-white">
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-[20px] text-[#585d6b]">
                            laptop_mac
                          </span>
                          <div>
                            <span className="font-semibold text-[#0b0c0e] block">
                              Windows 11 • Google Chrome
                            </span>
                            <span className="text-[#8c93a0] text-[11px] font-mono">
                              IP: 127.0.0.1 • Jakarta, Indonesia
                            </span>
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          Sesi Ini (Aktif)
                        </span>
                      </div>
                      <div className="p-3.5 flex items-center justify-between bg-[#fafbfc]">
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-[20px] text-[#8c93a0]">
                            smartphone
                          </span>
                          <div>
                            <span className="font-medium text-[#585d6b] block">
                              Android Mobile • Chrome Mobile
                            </span>
                            <span className="text-[#8c93a0] text-[11px] font-mono">
                              Terakhir aktif 2 hari lalu
                            </span>
                          </div>
                        </div>
                        <span className="text-[#8c93a0] text-[11px] font-mono">
                          Offline
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: NOTIFIKASI EVENT */}
              {settingsTab === 'notifications' && (
                <div className="p-6 rounded-xl bg-white border border-[#e2e5ea] shadow-2xs space-y-6">
                  <div>
                    <h2 className="font-heading text-base font-bold text-[#0b0c0e]">
                      Preferensi Notifikasi &amp; Alert Event
                    </h2>
                    <p className="text-xs text-[#585d6b] mt-0.5">
                      Tentukan notifikasi yang dikirimkan ke email akun dan nomor WhatsApp panitia.
                    </p>
                  </div>

                  <form onSubmit={handleSaveNotifications} className="space-y-4">
                    <div className="divide-y divide-[#f0f2f5] border border-[#e2e5ea] rounded-xl overflow-hidden">
                      {/* Item 1 */}
                      <div className="p-4 flex items-center justify-between gap-4 bg-white hover:bg-[#fafbfc] transition-colors">
                        <div className="space-y-0.5">
                          <h3 className="text-xs font-bold text-[#0b0c0e]">
                            Pendaftaran Peserta Baru
                          </h3>
                          <p className="text-xs text-[#585d6b]">
                            Pemberitahuan real-time setiap kali peserta selesai mengisi form pendaftaran lomba/event.
                          </p>
                        </div>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={notifNewRegistration}
                          onClick={() => setNotifNewRegistration(!notifNewRegistration)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            notifNewRegistration ? 'bg-[#1f2de6]' : 'bg-[#d1d5dc]'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                              notifNewRegistration ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>

                      {/* Item 2 */}
                      <div className="p-4 flex items-center justify-between gap-4 bg-white hover:bg-[#fafbfc] transition-colors">
                        <div className="space-y-0.5">
                          <h3 className="text-xs font-bold text-[#0b0c0e]">
                            Peringatan Kuota Tiket Menipis
                          </h3>
                          <p className="text-xs text-[#585d6b]">
                            Peringatkan panitia ketika sisa slot tiket seminar/lomba tersisa kurang dari 10%.
                          </p>
                        </div>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={notifTicketLow}
                          onClick={() => setNotifTicketLow(!notifTicketLow)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            notifTicketLow ? 'bg-[#1f2de6]' : 'bg-[#d1d5dc]'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                              notifTicketLow ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>

                      {/* Item 3 */}
                      <div className="p-4 flex items-center justify-between gap-4 bg-white hover:bg-[#fafbfc] transition-colors">
                        <div className="space-y-0.5">
                          <h3 className="text-xs font-bold text-[#0b0c0e]">
                            WhatsApp Gateway Otomatis
                          </h3>
                          <p className="text-xs text-[#585d6b]">
                            Kirim e-tiket dan kode QR verifikasi langsung ke nomor WhatsApp peserta yang lolos verifikasi.
                          </p>
                        </div>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={notifWaTickets}
                          onClick={() => setNotifWaTickets(!notifWaTickets)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            notifWaTickets ? 'bg-[#1f2de6]' : 'bg-[#d1d5dc]'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                              notifWaTickets ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>

                      {/* Item 4 */}
                      <div className="p-4 flex items-center justify-between gap-4 bg-white hover:bg-[#fafbfc] transition-colors">
                        <div className="space-y-0.5">
                          <h3 className="text-xs font-bold text-[#0b0c0e]">
                            Rekapitulasi Harian Event
                          </h3>
                          <p className="text-xs text-[#585d6b]">
                            Kirim ringkasan harian total pendaftar, nominal tiket masuk, dan performa website setiap pukul 21:00 WIB.
                          </p>
                        </div>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={notifDailyRecap}
                          onClick={() => setNotifDailyRecap(!notifDailyRecap)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            notifDailyRecap ? 'bg-[#1f2de6]' : 'bg-[#d1d5dc]'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                              notifDailyRecap ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>

                      {/* Item 5 */}
                      <div className="p-4 flex items-center justify-between gap-4 bg-white hover:bg-[#fafbfc] transition-colors">
                        <div className="space-y-0.5">
                          <h3 className="text-xs font-bold text-[#0b0c0e]">
                            Pembaruan Sistem &amp; Template Baru
                          </h3>
                          <p className="text-xs text-[#585d6b]">
                            Dapatkan info fitur baru Iventra Spark Builder dan template event kampus terkini.
                          </p>
                        </div>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={notifSystemBroadcast}
                          onClick={() => setNotifSystemBroadcast(!notifSystemBroadcast)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            notifSystemBroadcast ? 'bg-[#1f2de6]' : 'bg-[#d1d5dc]'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                              notifSystemBroadcast ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {notifSuccess && (
                      <p className="text-xs font-mono text-emerald-700">{notifSuccess}</p>
                    )}

                    <div className="pt-2">
                      <button
                        type="submit"
                        className="px-5 py-2.5 rounded-lg bg-[#0b0c0e] hover:bg-[#1f2de6] text-white text-xs font-semibold tracking-tight transition-colors cursor-pointer shadow-xs active:scale-[0.98]"
                      >
                        Simpan Preferensi Notifikasi
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* TAB 4: SESI & KELUAR AKUN */}
              {settingsTab === 'account' && (
                <div className="space-y-6">
                  {/* Workspace & Plan Info Card */}
                  <div className="p-6 rounded-xl bg-white border border-[#e2e5ea] shadow-2xs space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-[#e2e5ea]">
                      <div>
                        <h2 className="font-heading text-base font-bold text-[#0b0c0e]">
                          Paket &amp; Kapasitas Event
                        </h2>
                        <p className="text-xs text-[#585d6b] mt-0.5">
                          Paket kepanitiaan yang sedang aktif untuk workspace ini.
                        </p>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-[#edf2ff] text-[#1f2de6] border border-[#cbd5e1]">
                        {subscription.planName}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                      <div className="p-3.5 rounded-lg bg-[#f8f9fb] border border-[#e2e5ea]">
                        <span className="text-[#8c93a0] block">Kuota Event Live</span>
                        <strong className="text-sm text-[#0b0c0e] mt-1 block">{subscription.usedTokens} dari {subscription.totalTokens} Live</strong>
                      </div>
                      <div className="p-3.5 rounded-lg bg-[#f8f9fb] border border-[#e2e5ea]">
                        <span className="text-[#8c93a0] block">Kapasitas Pendaftar</span>
                        <strong className="text-sm text-[#0b0c0e] mt-1 block">5.000 Peserta / Event</strong>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => setCurrentNav('subscription')}
                        className="px-4 py-2 rounded-lg border border-[#e2e5ea] hover:bg-[#f8f9fb] text-xs font-semibold text-[#0b0c0e] transition-colors cursor-pointer"
                      >
                        Kelola Kuota &amp; Upgrade Paket
                      </button>
                    </div>
                  </div>

                  {/* LOGOUT / KELUAR AKUN CARD (Requested by user) */}
                  <div className="p-6 rounded-xl bg-white border border-[#e2e5ea] shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 border border-red-200 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[20px]">logout</span>
                      </div>
                      <div className="space-y-0.5">
                        <h2 className="font-heading text-base font-bold text-[#0b0c0e]">
                          Keluar dari Akun Panitia
                        </h2>
                        <p className="text-xs text-[#585d6b] max-w-md">
                          Akhiri sesi login di perangkat ini. Semua data website event, form pendaftaran, dan data peserta tetap tersimpan dengan aman di server Iventra.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={onLogout}
                      className="px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold tracking-tight shadow-xs transition-all cursor-pointer flex items-center gap-2 shrink-0 active:scale-[0.98]"
                    >
                      <span className="material-symbols-outlined text-[16px]">logout</span>
                      <span>Keluar Akun</span>
                    </button>
                  </div>

                  {/* Danger Zone */}
                  <div className="p-6 rounded-xl bg-red-50/40 border border-red-200/80 shadow-2xs space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-red-600 text-[18px]">
                        warning
                      </span>
                      <h2 className="font-heading text-sm font-bold text-red-900 uppercase tracking-wider">
                        Zona Bahaya
                      </h2>
                    </div>
                    <p className="text-xs text-red-700/90 leading-relaxed max-w-xl">
                      Menghapus akun panitia akan membatalkan lisensi aktif dan mengarsipkan seluruh website pendaftaran yang sedang dipublikasikan. Tindakan ini tidak dapat dibatalkan.
                    </p>
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm('Apakah Anda yakin ingin menonaktifkan akun panitia ini? Hubungi tim support Iventra untuk pemulihan data.')) {
                            showToast('Permintaan penonaktifan telah dicatat.');
                          }
                        }}
                        className="px-4 py-2 rounded-lg border border-red-300 bg-white hover:bg-red-100/50 text-red-700 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Nonaktifkan Akun Panitia...
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* ─── QUICK EDIT WORKSPACE MODAL ─────────────────────────────────────── */}
      {editingWs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-[#e2e5ea] p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#e2e5ea]">
              <h3 className="font-heading text-base font-bold text-[#0b0c0e]">Edit Workspace Info</h3>
              <button
                type="button"
                onClick={() => setEditingWs(null)}
                className="text-[#8c93a0] hover:text-[#0b0c0e]"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const name = (form.elements.namedItem('wsName') as HTMLInputElement).value;
                const desc = (form.elements.namedItem('wsDesc') as HTMLTextAreaElement).value;
                const slug = (form.elements.namedItem('wsSlug') as HTMLInputElement).value;
                await handleSaveEdit({ name, description: desc, slug });
              }}
              className="space-y-3"
            >
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#0b0c0e] uppercase">Nama Workspace</label>
                <input
                  name="wsName"
                  defaultValue={editingWs.name}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-[#e2e5ea] text-xs text-[#0b0c0e] focus:outline-none focus:border-[#0b0c0e]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#0b0c0e] uppercase">Slug URL</label>
                <input
                  name="wsSlug"
                  defaultValue={editingWs.slug || ''}
                  className="w-full px-3 py-2 rounded-lg border border-[#e2e5ea] text-xs font-mono text-[#0b0c0e] focus:outline-none focus:border-[#0b0c0e]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#0b0c0e] uppercase">Deskripsi</label>
                <textarea
                  name="wsDesc"
                  defaultValue={editingWs.description || ''}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-[#e2e5ea] text-xs text-[#0b0c0e] focus:outline-none focus:border-[#0b0c0e] resize-none"
                />
              </div>

              {editError && <p className="text-xs font-mono text-red-600">{editError}</p>}

              <div className="flex justify-end gap-2 pt-2 border-t border-[#e2e5ea]">
                <button
                  type="button"
                  onClick={() => setEditingWs(null)}
                  className="px-3.5 py-1.5 rounded-lg border border-[#e2e5ea] text-xs font-mono"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-4 py-1.5 rounded-lg bg-[#1f2de6] text-white text-xs font-semibold cursor-pointer"
                >
                  {isSavingEdit ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── CONFIRM DELETE MODAL ───────────────────────────────────────────── */}
      {deletingWs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-sm bg-white rounded-xl shadow-2xl border border-[#e2e5ea] p-6 space-y-4">
            <h3 className="font-heading text-base font-bold text-red-600">Hapus Workspace?</h3>
            <p className="text-xs text-[#585d6b] leading-relaxed">
              Anda yakin ingin menghapus workspace <strong>{deletingWs.name}</strong>? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingWs(null)}
                className="px-3.5 py-1.5 rounded-lg border border-[#e2e5ea] text-xs font-mono"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold cursor-pointer"
              >
                {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── TEMPLATE SELECTOR MODAL ─────────────────────────────────────────── */}
      <TemplateSelectorModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onCreate={handleCreateWithTemplate}
        isCreating={isCreatingWorkspace}
        error={templateCreateError}
      />

      {/* ─── SPARK SUBSCRIPTION MODAL ───────────────────────────────────────── */}
      <SparkSubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
        onRenewSuccess={handleRenewSubscription}
      />
    </div>
  );
}
