import { useState, useEffect, useCallback, useRef } from 'react';
import Logo from './Logo.tsx';
import type { AuthUser } from './AuthPage.tsx';
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
        setProfileSuccess('Profil berhasil diperbarui!');
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
        {/* Left: Brand + Badge */}
        <div className="flex items-center gap-3 w-60 shrink-0">
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

        {/* Right Actions: Notifications, Create Website, User Profile */}
        <div className="flex items-center gap-3">
          {/* Create Website CTA Button */}
          <button
            type="button"
            onClick={() => setIsTemplateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#1f2de6] hover:bg-[#1622b8] text-white text-xs font-semibold tracking-tight shadow-xs transition-all active:scale-[0.98] cursor-pointer"
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
            <button
              type="button"
              onClick={onLogout}
              className="ml-1 w-7 h-7 rounded hover:bg-[#f4f5f8] text-[#585d6b] hover:text-red-600 flex items-center justify-center transition-colors cursor-pointer"
              title="Keluar dari akun"
            >
              <span className="material-symbols-outlined text-[16px]">logout</span>
            </button>
          </div>
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

                {/* 7. Settings */}
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

                {/* Admin Console shortcut if available */}
                {onOpenAdmin && (
                  <button
                    type="button"
                    onClick={onOpenAdmin}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-mono font-bold text-[#585d6b] hover:text-[#1f2de6] hover:bg-[#f8f9fb] transition-all cursor-pointer mt-2 border-t border-[#e2e5ea] pt-3"
                  >
                    <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
                    <span>Admin Console</span>
                  </button>
                )}
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
          {/* VIEW 1: DASHBOARD (Matching media_1794898032219_5c434358.png) */}
          {currentNav === 'dashboard' && (
            <div className="space-y-6 max-w-7xl mx-auto animate-fadeIn">
              {/* Header Greeting */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#0b0c0e] tracking-tight">
                    Selamat Datang Kembali, {user.name.split(' ')[0]}! 👋
                  </h1>
                  <p className="text-xs sm:text-sm text-[#585d6b] mt-1">
                    Kelola website event Anda dan pantau performa pendaftaran secara real-time.
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setCurrentNav('expert')}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-[#e2e5ea] bg-white hover:bg-[#f4f5f8] text-[#0b0c0e] text-xs font-semibold tracking-tight shadow-xs transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px] text-[#1f2de6]">support_agent</span>
                    <span>Pesan Iventra Expert</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsTemplateModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#1f2de6] hover:bg-[#1622b8] text-white text-xs font-semibold tracking-tight shadow-xs transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    <span>Buat Website Baru</span>
                  </button>
                </div>
              </div>

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

                {/* 4. Subscription Status */}
                <div className="p-5 rounded-xl bg-white border border-[#e2e5ea] flex flex-col justify-between shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-[#585d6b] uppercase">Subscription Status</span>
                    <span className="material-symbols-outlined text-[20px] text-amber-600">workspace_premium</span>
                  </div>
                  <div className="mt-3 flex items-baseline justify-between">
                    <div>
                      <span className="font-heading text-xl font-black text-[#0b0c0e]">Spark Pro</span>
                      <span className="ml-2 text-[10px] font-mono font-bold bg-[#edf2ff] text-[#1f2de6] px-1.5 py-0.5 rounded">
                        Aktif
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCurrentNav('subscription')}
                      className="text-xs font-mono text-[#1f2de6] hover:underline"
                    >
                      Kelola
                    </button>
                  </div>
                  <p className="text-[10px] font-mono text-[#8c93a0] mt-2">Diperbarui Nov 2025 • Billing tahunan</p>
                </div>
              </div>

              {/* Middle Section: Chart (Left) + Recent Activity (Right) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left (7 cols): Registration Performance Chart */}
                <div className="lg:col-span-8 p-6 rounded-xl bg-white border border-[#e2e5ea] shadow-2xs flex flex-col justify-between">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#e2e5ea]">
                    <div>
                      <h3 className="font-heading text-base font-extrabold text-[#0b0c0e]">
                        Performa Registrasi &amp; Kunjungan
                      </h3>
                      <p className="text-xs text-[#585d6b] mt-0.5">
                        Metrik gabungan seluruh website aktif 7 hari terakhir
                      </p>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-mono">
                      <span className="flex items-center gap-1.5 text-[#0b0c0e]">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#1f2de6]"></span>
                        Registrasi
                      </span>
                      <span className="flex items-center gap-1.5 text-[#8c93a0]">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#cbd5e1]"></span>
                        Kunjungan
                      </span>
                    </div>
                  </div>

                  {/* Summary Metric Header */}
                  <div className="my-5 flex items-baseline justify-between">
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="font-heading text-3xl font-black text-[#0b0c0e]">1,842</span>
                        <span className="text-xs font-mono text-emerald-700 font-bold">+18.4% minggu ini</span>
                      </div>
                      <span className="text-xs font-mono text-[#8c93a0]">Total peserta terdaftar</span>
                    </div>
                    <div className="text-right text-xs font-mono text-[#585d6b]">
                      Peak: <strong className="text-[#0b0c0e]">Sabtu (380 registrasi)</strong>
                    </div>
                  </div>

                  {/* Interactive SVG Area Chart */}
                  <div className="w-full h-44 relative">
                    <svg viewBox="0 0 600 160" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="blueArea" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#1f2de6" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#1f2de6" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Grid Lines */}
                      <line x1="0" y1="40" x2="600" y2="40" stroke="#f1f3f7" strokeWidth="1" />
                      <line x1="0" y1="80" x2="600" y2="80" stroke="#f1f3f7" strokeWidth="1" />
                      <line x1="0" y1="120" x2="600" y2="120" stroke="#f1f3f7" strokeWidth="1" />

                      {/* Area Fill */}
                      <path
                        d="M 20,120 Q 110,110 200,95 T 380,70 T 500,30 T 580,45 L 580,150 L 20,150 Z"
                        fill="url(#blueArea)"
                      />

                      {/* Smooth Trend Line */}
                      <path
                        d="M 20,120 Q 110,110 200,95 T 380,70 T 500,30 T 580,45"
                        fill="none"
                        stroke="#1f2de6"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />

                      {/* Key Data Points */}
                      <circle cx="20" cy="120" r="3.5" fill="#1f2de6" />
                      <circle cx="200" cy="95" r="3.5" fill="#1f2de6" />
                      <circle cx="380" cy="70" r="3.5" fill="#1f2de6" />
                      <circle cx="500" cy="30" r="4.5" fill="#ffffff" stroke="#1f2de6" strokeWidth="2.5" />
                      <circle cx="580" cy="45" r="3.5" fill="#1f2de6" />
                    </svg>

                    {/* Day Labels */}
                    <div className="flex justify-between text-[11px] font-mono text-[#8c93a0] mt-2 px-2">
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

                {/* Right (4 cols): Recent Activity Feed */}
                <div className="lg:col-span-4 p-6 rounded-xl bg-white border border-[#e2e5ea] shadow-2xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-[#e2e5ea]">
                      <h3 className="font-heading text-base font-extrabold text-[#0b0c0e]">
                        Aktivitas Terkini
                      </h3>
                      <span className="material-symbols-outlined text-[18px] text-[#8c93a0]">schedule</span>
                    </div>

                    <div className="divide-y divide-[#f1f3f7] mt-3 space-y-3">
                      <div className="pt-2 text-xs">
                        <div className="flex items-start gap-2.5">
                          <span className="w-2 h-2 rounded-full bg-[#1f2de6] mt-1 shrink-0"></span>
                          <div>
                            <p className="text-[#0b0c0e] font-semibold leading-snug">
                              Form registrasi baru masuk pada <span className="text-[#1f2de6]">Hackathon Nusantara 2025</span>
                            </p>
                            <span className="text-[10px] font-mono text-[#8c93a0] block mt-0.5">
                              Budi Prasetyo (Team Alpha) • 10 menit lalu
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 text-xs">
                        <div className="flex items-start gap-2.5">
                          <span className="w-2 h-2 rounded-full bg-amber-500 mt-1 shrink-0"></span>
                          <div>
                            <p className="text-[#0b0c0e] leading-snug">
                              Draft website <strong className="text-[#0b0c0e]">Webinar UI/UX Masterclass</strong> disimpan otomatis
                            </p>
                            <span className="text-[10px] font-mono text-[#8c93a0] block mt-0.5">
                              1 jam yang lalu
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 text-xs">
                        <div className="flex items-start gap-2.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1 shrink-0"></span>
                          <div>
                            <p className="text-[#0b0c0e] leading-snug">
                              Iventra Expert Designer mengunggah pratinjau mockup v2 untuk <strong className="text-[#0b0c0e]">Tech Conference Asia</strong>
                            </p>
                            <span className="text-[10px] font-mono text-[#8c93a0] block mt-0.5">
                              3 jam yang lalu
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 text-xs">
                        <div className="flex items-start gap-2.5">
                          <span className="w-2 h-2 rounded-full bg-[#585d6b] mt-1 shrink-0"></span>
                          <div>
                            <p className="text-[#0b0c0e] leading-snug">
                              Sertifikat SSL otomatis aktif pada custom domain event
                            </p>
                            <span className="text-[10px] font-mono text-[#8c93a0] block mt-0.5">
                              Kemarin, 21:14 WIB
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Section: Workspace Terbaru List (Left) + Template Spotlight (Right) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left (8 cols): Workspace Terbaru */}
                <div className="lg:col-span-8 p-6 rounded-xl bg-white border border-[#e2e5ea] shadow-2xs">
                  <div className="flex items-center justify-between pb-4 border-b border-[#e2e5ea] mb-4">
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
                      className="text-xs font-mono font-bold text-[#1f2de6] hover:underline"
                    >
                      Lihat Semua →
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Item 1 */}
                    <div className="p-4 rounded-xl border border-[#e2e5ea] bg-[#f8f9fb] flex flex-col sm:flex-row sm:items-center justify-between gap-4 card-lift">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold uppercase bg-[#edf2ff] text-[#1f2de6] px-2 py-0.5 rounded">
                            Spark Pro
                          </span>
                          <span className="text-[10px] font-mono font-bold uppercase bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded">
                            ● Published
                          </span>
                        </div>
                        <h4 className="font-heading text-base font-bold text-[#0b0c0e]">
                          {workspaces[0]?.name || 'Hackathon Nusantara 2025'}
                        </h4>
                        <div className="text-xs font-mono text-[#585d6b]">
                          hackathon-nusantara25.iventra.live • Diedit 2 jam lalu
                        </div>
                        <div className="flex items-center gap-4 text-xs font-mono pt-1 text-[#0b0c0e]">
                          <span>Total: <strong>482 / 500 Kuota</strong></span>
                          <span>•</span>
                          <span>Conversion: <strong className="text-emerald-700">24.8%</strong></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            if (workspaces[0]) onOpenBuilder(workspaces[0]);
                          }}
                          className="px-3.5 py-1.5 rounded-lg bg-[#0b0c0e] hover:bg-[#1f2de6] text-white text-xs font-mono uppercase font-bold transition-colors cursor-pointer"
                        >
                          Edit Builder
                        </button>
                        {workspaces[0]?.slug && (
                          <a
                            href={`/#event/${workspaces[0].slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3.5 py-1.5 rounded-lg border border-[#e2e5ea] bg-white hover:bg-[#f4f5f8] text-[#0b0c0e] text-xs font-mono font-bold transition-colors"
                          >
                            Lihat ↗
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Item 2: Tech Conference Asia (Iventra Expert) */}
                    <div className="p-4 rounded-xl border border-[#e2e5ea] bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 card-lift">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold uppercase bg-[#f4f5f8] text-[#0b0c0e] border border-[#e2e5ea] px-2 py-0.5 rounded">
                            Iventra Expert
                          </span>
                          <span className="text-[10px] font-mono font-bold uppercase bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded">
                            In Progress by Iventra Dev Team
                          </span>
                        </div>
                        <h4 className="font-heading text-base font-bold text-[#0b0c0e]">
                          Tech Conference Asia 2026
                        </h4>
                        <div className="text-xs font-mono text-[#585d6b]">
                          techasia-summit.com • Milestone 3: Dynamic Ticketing Flow
                        </div>
                        <div className="w-48 h-1.5 bg-[#e2e5ea] rounded-full overflow-hidden mt-2">
                          <div className="h-full bg-[#1f2de6] rounded-full" style={{ width: '75%' }}></div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setCurrentNav('expert')}
                          className="px-3.5 py-1.5 rounded-lg bg-[#1f2de6] hover:bg-[#1622b8] text-white text-xs font-mono uppercase font-bold transition-colors cursor-pointer"
                        >
                          Hubungi Designer
                        </button>
                      </div>
                    </div>

                    {/* Item 3 */}
                    <div className="p-4 rounded-xl border border-[#e2e5ea] bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 card-lift">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold uppercase bg-[#f4f5f8] text-[#585d6b] border border-[#e2e5ea] px-2 py-0.5 rounded">
                            Spark Free
                          </span>
                          <span className="text-[10px] font-mono font-bold uppercase bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded">
                            Draft
                          </span>
                        </div>
                        <h4 className="font-heading text-base font-bold text-[#0b0c0e]">
                          Webinar UI/UX Masterclass
                        </h4>
                        <p className="text-xs text-[#585d6b]">
                          4 tahapan form dikonfigurasi • Terakhir disimpan 1 jam lalu
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (workspaces[1]) onOpenBuilder(workspaces[1]);
                          else setIsTemplateModalOpen(true);
                        }}
                        className="px-3.5 py-1.5 rounded-lg border border-[#e2e5ea] bg-white hover:bg-[#f4f5f8] text-[#0b0c0e] text-xs font-mono font-bold transition-colors cursor-pointer shrink-0"
                      >
                        Lanjutkan Desain
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right (4 cols): Template Spotlight & Help Prompt */}
                <div className="lg:col-span-4 space-y-4">
                  {/* Spotlight Card */}
                  <div className="p-5 rounded-xl bg-white border border-[#e2e5ea] shadow-2xs">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#1f2de6] block mb-2">
                      Template Spotlight
                    </span>
                    <div className="h-28 rounded-lg bg-gradient-to-tr from-[#0b0c0e] via-[#1f2de6] to-[#3b47dc] p-3 text-white flex flex-col justify-between mb-3 relative overflow-hidden">
                      <span className="text-[10px] font-mono font-bold uppercase bg-white/20 backdrop-blur-xs px-2 py-0.5 rounded w-max">
                        AI &amp; Tech
                      </span>
                      <h4 className="font-heading text-lg font-bold text-white">
                        AI Summit 2026
                      </h4>
                    </div>
                    <p className="text-xs text-[#585d6b] leading-relaxed mb-3">
                      Dirancang khusus untuk konferensi teknologi mutakhir dengan fitur call-for-papers dan dynamic stage agenda.
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsTemplateModalOpen(true)}
                      className="w-full py-2 rounded-lg bg-[#0b0c0e] hover:bg-[#1f2de6] text-white text-xs font-mono uppercase font-bold tracking-wider transition-colors cursor-pointer"
                    >
                      Gunakan Template →
                    </button>
                  </div>

                  {/* Consultation Prompt */}
                  <div className="p-4 rounded-xl bg-[#f8f9fb] border border-[#e2e5ea] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-lg bg-white border border-[#e2e5ea] flex items-center justify-center text-[#1f2de6] font-mono text-xs font-bold shrink-0">
                        ?
                      </span>
                      <div>
                        <h5 className="font-heading text-xs font-bold text-[#0b0c0e]">Butuh bantuan custom layout?</h5>
                        <p className="text-[10px] font-mono text-[#585d6b]">Konsultasi 1-on-1 dengan engineer.</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCurrentNav('expert')}
                      className="px-3 py-1.5 rounded-lg border border-[#e2e5ea] bg-white hover:border-[#0b0c0e] text-[#0b0c0e] text-xs font-mono font-bold transition-colors cursor-pointer shrink-0"
                    >
                      Chat
                    </button>
                  </div>
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
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#1f2de6] font-bold block mb-1">
                  Koleksi Desain Terstandarisasi
                </span>
                <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#0b0c0e] tracking-tight">
                  Template Event Siap Pakai
                </h1>
                <p className="text-xs sm:text-sm text-[#585d6b] mt-1">
                  Pilih struktur layout yang dirancang khusus untuk berbagai format kegiatan kampus dan komunitas.
                </p>
              </div>

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

                      <div className="p-5 space-y-2.5">
                        <p className="text-xs text-[#585d6b] leading-relaxed">
                          {tmpl.description}
                        </p>
                        <div className="pt-2 border-t border-[#f1f3f4]">
                          <span className="text-[10px] font-mono uppercase text-[#8c93a0] block">Rekomendasi Format:</span>
                          <span className="text-xs font-semibold text-[#0b0c0e]">{tmpl.recommendedFor}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-[#f8f9fb] border-t border-[#e2e5ea]">
                      <button
                        type="button"
                        onClick={() => {
                          setIsTemplateModalOpen(true);
                        }}
                        className="w-full py-2.5 rounded-lg bg-[#0b0c0e] hover:bg-[#1f2de6] text-white text-xs font-mono uppercase font-bold tracking-wider transition-colors cursor-pointer"
                      >
                        Gunakan Template Ini →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW 4: EXPERT SERVICES */}
          {currentNav === 'expert' && (
            <div className="space-y-6 max-w-5xl mx-auto animate-fadeIn">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#1f2de6] font-bold block mb-1">
                  Bespoke Engineering
                </span>
                <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#0b0c0e] tracking-tight">
                  Iventra Expert Services
                </h1>
                <p className="text-xs sm:text-sm text-[#585d6b] mt-1">
                  Layanan pengembangan sistem khusus kepanitiaan: kompetisi bertingkat, dewan juri independen, payment gateway resmi, dan WhatsApp blast automation.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-xl bg-white border border-[#e2e5ea] shadow-2xs space-y-4">
                  <div className="w-10 h-10 rounded-xl bg-[#edf2ff] text-[#1f2de6] flex items-center justify-center font-mono font-bold text-sm">
                    01
                  </div>
                  <h3 className="font-heading text-lg font-bold text-[#0b0c0e]">
                    Iventra Flow (Lomba &amp; Penjurian Bertingkat)
                  </h3>
                  <p className="text-xs text-[#585d6b] leading-relaxed">
                    Arsitektur khusus pendaftaran tim, submisi proposal PDF terenkripsi, portal dewan juri dengan form rubrik nilai rahasia, serta pengumuman finalis otomatis.
                  </p>
                  <ul className="text-xs font-mono space-y-2 text-[#0b0c0e]">
                    <li>✓ Portal Juri dengan akses terenkripsi</li>
                    <li>✓ Dashboard rekap ranking otomatis</li>
                    <li>✓ Upload berkas karya tim hingga 50MB</li>
                  </ul>
                  <button
                    type="button"
                    onClick={() => setIsSubscriptionModalOpen(true)}
                    className="w-full py-2.5 rounded-lg bg-[#0b0c0e] hover:bg-[#1f2de6] text-white text-xs font-mono uppercase font-bold transition-colors cursor-pointer"
                  >
                    Konsultasikan Alur Lomba →
                  </button>
                </div>

                <div className="p-6 rounded-xl bg-white border border-[#e2e5ea] shadow-2xs space-y-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-mono font-bold text-sm">
                    02
                  </div>
                  <h3 className="font-heading text-lg font-bold text-[#0b0c0e]">
                    WhatsApp Gateway &amp; QR Attendance Gate
                  </h3>
                  <p className="text-xs text-[#585d6b] leading-relaxed">
                    Pengiriman blast e-tiket QR terenkripsi via nomor WhatsApp resmi, auto-reminder H-3 dan H-1, serta scanner presensi pintu masuk dengan latensi &lt;0.5 detik.
                  </p>
                  <ul className="text-xs font-mono space-y-2 text-[#0b0c0e]">
                    <li>✓ Tiket QR unik anti-duplikasi</li>
                    <li>✓ Scanner kamera tanpa instalasi aplikasi</li>
                    <li>✓ Export log kehadiran realtime siap LPJ</li>
                  </ul>
                  <button
                    type="button"
                    onClick={() => setIsSubscriptionModalOpen(true)}
                    className="w-full py-2.5 rounded-lg bg-[#1f2de6] hover:bg-[#1622b8] text-white text-xs font-mono uppercase font-bold transition-colors cursor-pointer"
                  >
                    Aktivasi WhatsApp Bot →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 5: SUBSCRIPTION */}
          {currentNav === 'subscription' && (
            <div className="space-y-6 max-w-4xl mx-auto animate-fadeIn">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#1f2de6] font-bold block mb-1">
                  Billing &amp; Kuota
                </span>
                <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#0b0c0e] tracking-tight">
                  Status Berlangganan &amp; Kuota Event
                </h1>
                <p className="text-xs sm:text-sm text-[#585d6b] mt-1">
                  Kelola paket Spark Pro dan kuota penerbitan website acara Anda.
                </p>
              </div>

              <div className="p-6 rounded-xl bg-white border border-[#e2e5ea] shadow-2xs space-y-5">
                <div className="flex items-center justify-between pb-4 border-b border-[#e2e5ea]">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase bg-[#edf2ff] text-[#1f2de6] px-2 py-0.5 rounded">
                      Paket Aktif
                    </span>
                    <h3 className="font-heading text-xl font-bold text-[#0b0c0e] mt-1">Spark Pro Workspace</h3>
                  </div>
                  <span className="font-heading text-lg font-black text-[#1f2de6]">Rp 150.000 / event</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
                  <div className="p-3.5 rounded-lg bg-[#f8f9fb] border border-[#e2e5ea]">
                    <span className="text-[#8c93a0] block">Kuota Website Live</span>
                    <strong className="text-sm text-[#0b0c0e] mt-1 block">8 / 10 Website</strong>
                  </div>
                  <div className="p-3.5 rounded-lg bg-[#f8f9fb] border border-[#e2e5ea]">
                    <span className="text-[#8c93a0] block">Batas Kuota Peserta</span>
                    <strong className="text-sm text-[#0b0c0e] mt-1 block">Hingga 5.000 / event</strong>
                  </div>
                  <div className="p-3.5 rounded-lg bg-[#f8f9fb] border border-[#e2e5ea]">
                    <span className="text-[#8c93a0] block">Status Domain</span>
                    <strong className="text-sm text-emerald-700 mt-1 block">SSL Aktif</strong>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setIsSubscriptionModalOpen(true)}
                    className="px-5 py-2.5 rounded-lg bg-[#1f2de6] hover:bg-[#1622b8] text-white text-xs font-semibold tracking-tight shadow-xs transition-all cursor-pointer"
                  >
                    Tambah Kuota / Upgrade Paket
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 6: SETTINGS */}
          {currentNav === 'settings' && (
            <div className="space-y-6 max-w-xl mx-auto animate-fadeIn">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#1f2de6] font-bold block mb-1">
                  Akun &amp; Keamanan
                </span>
                <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#0b0c0e] tracking-tight">
                  Pengaturan Profil Panitia
                </h1>
                <p className="text-xs sm:text-sm text-[#585d6b] mt-1">
                  Kelola nama identitas panitia dan preferensi akun Anda.
                </p>
              </div>

              <div className="p-6 rounded-xl bg-white border border-[#e2e5ea] shadow-2xs">
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#0b0c0e] uppercase">
                      Nama Lengkap Panitia
                    </label>
                    <input
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-lg border border-[#e2e5ea] bg-white text-sm text-[#0b0c0e] focus:border-[#0b0c0e] focus:outline-none"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#0b0c0e] uppercase">
                      Email Akun
                    </label>
                    <input
                      type="email"
                      value={user.email}
                      disabled
                      className="w-full px-3.5 py-2 rounded-lg border border-[#e2e5ea] bg-[#f8f9fb] text-sm text-[#8c93a0] cursor-not-allowed font-mono"
                    />
                  </div>

                  {profileError && (
                    <p className="text-xs font-mono text-red-600">{profileError}</p>
                  )}
                  {profileSuccess && (
                    <p className="text-xs font-mono text-emerald-700">{profileSuccess}</p>
                  )}

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSavingProfile}
                      className="px-5 py-2.5 rounded-lg bg-[#0b0c0e] hover:bg-[#1f2de6] text-white text-xs font-semibold tracking-tight transition-colors cursor-pointer"
                    >
                      {isSavingProfile ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </button>
                  </div>
                </form>
              </div>
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
      />
    </div>
  );
}
