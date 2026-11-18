import { useState, useEffect, useCallback } from 'react';
import Logo from './Logo.tsx';
import type { AuthUser } from './AuthPage.tsx';
import TemplateSelectorModal from './spark/TemplateSelectorModal.tsx';
import SparkSubscriptionModal from './spark/SparkSubscriptionModal.tsx';
import { getTemplateById, type TemplateId, SPARK_TEMPLATES } from '../types/builder.ts';

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
  const [workspaceFilterTab, setWorkspaceFilterTab] = useState<'all' | 'spark' | 'expert'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
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

  // Create Workspace with selected template
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
        description: data.description || tmpl.defaultConfig.description
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

  // Quick edit
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

  // Delete
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

  // Copy URL
  const handleCopyUrl = (slug: string) => {
    const url = `${window.location.origin}/#event/${slug}`;
    navigator.clipboard.writeText(url);
    showToast('Tautan website event disalin!');
  };

  // Profile update
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

  // Filtered workspaces for My Workspaces
  const filteredWorkspaces = workspaces.filter((ws) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = ws.name.toLowerCase().includes(q);
      const matchSlug = (ws.slug || '').toLowerCase().includes(q);
      const matchDesc = (ws.description || '').toLowerCase().includes(q);
      if (!matchName && !matchSlug && !matchDesc) return false;
    }
    if (workspaceFilterTab === 'spark' && ws.service_type !== 'spark') return false;
    if (workspaceFilterTab === 'expert' && ws.service_type === 'spark') return false;
    if (statusFilter !== 'all' && ws.status !== statusFilter) return false;
    return true;
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
            EVENT PLATFORM
          </span>
        </div>

        {/* Center: Search input with shortcut / */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
          <div className="relative w-full">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[#8c93a0]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search workspaces, templates, events... /"
              className="w-full pl-9 pr-8 py-2 rounded-lg bg-[#f8f9fb] border border-[#e2e5ea] text-xs text-[#0b0c0e] placeholder-[#8c93a0] focus:bg-white focus:border-[#1f2de6] focus:outline-none transition-all"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded bg-white border border-[#e2e5ea] text-[10px] font-mono text-[#8c93a0]">
              /
            </span>
          </div>
        </div>

        {/* Right Actions: Notifications, Create Website, User Profile */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <button
            type="button"
            className="w-9 h-9 rounded-lg border border-[#e2e5ea] bg-white hover:bg-[#f8f9fb] text-[#585d6b] flex items-center justify-center transition-colors cursor-pointer relative"
            aria-label="Notifikasi"
            onClick={() => showToast('Tidak ada notifikasi baru.')}
          >
            <span className="material-symbols-outlined text-[18px]">notifications</span>
            <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[#1f2de6]"></span>
          </button>

          {/* Create Website CTA Button */}
          <button
            type="button"
            onClick={() => setIsTemplateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#1f2de6] hover:bg-[#1622b8] text-white text-xs font-semibold tracking-tight shadow-xs transition-all active:scale-[0.98] cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">add_circle</span>
            <span>Create Website</span>
          </button>

          {/* User Profile Pill */}
          <div className="flex items-center gap-2 pl-2 border-l border-[#e2e5ea]">
            <div className="w-8 h-8 rounded-full bg-[#0b0c0e] text-white flex items-center justify-center font-heading font-bold text-xs shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="hidden lg:flex flex-col text-left leading-tight">
              <span className="text-xs font-bold text-[#0b0c0e]">{user.name}</span>
              <span className="text-[10px] font-mono text-[#8c93a0]">Pro Workspace</span>
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
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    currentNav === 'dashboard'
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
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    currentNav === 'workspaces'
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
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    currentNav === 'templates'
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
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    currentNav === 'expert'
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
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    currentNav === 'subscription'
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
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    currentNav === 'settings'
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

          {/* Sidebar Footer: Pro Plan Usage Card */}
          <div className="p-3 rounded-xl bg-[#f8f9fb] border border-[#e2e5ea]">
            <div className="flex items-center justify-between text-xs font-bold text-[#0b0c0e] mb-1.5">
              <span className="font-heading">Pro Plan Usage</span>
              <span className="font-mono text-[11px] text-[#1f2de6]">8/10 Live</span>
            </div>
            {/* Progress Bar */}
            <div className="w-full h-1.5 rounded-full bg-[#e2e5ea] overflow-hidden mb-1.5">
              <div className="h-full bg-[#1f2de6] rounded-full" style={{ width: '80%' }}></div>
            </div>
            <p className="text-[10px] font-mono text-[#8c93a0]">2 site slots available</p>
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

          {/* VIEW 2: MY WORKSPACES (Matching media_1794898032229_e867d2e7.png) */}
          {currentNav === 'workspaces' && (
            <div className="space-y-6 max-w-7xl mx-auto animate-fadeIn">
              {/* Header Title & CTA */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-[#1f2de6] font-bold mb-1">
                    <span>Workspace Hub</span>
                    <span>•</span>
                    <span className="text-[#585d6b]">Organisasi &amp; Kolaborasi</span>
                  </div>
                  <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#0b0c0e] tracking-tight">
                    My Workspaces
                  </h1>
                  <p className="text-xs sm:text-sm text-[#585d6b] mt-1">
                    Pantau, edit, dan kelola seluruh website event Spark dan proyek Expert Anda dalam satu tempat.
                  </p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={loadWorkspaces}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#e2e5ea] bg-white hover:bg-[#f4f5f8] text-[#0b0c0e] text-xs font-mono font-bold transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">sync</span>
                    <span>Sync Status</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsTemplateModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1f2de6] hover:bg-[#1622b8] text-white text-xs font-semibold tracking-tight shadow-xs transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    <span>+ Create New Workspace</span>
                  </button>
                </div>
              </div>

              {/* 4 Summary Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-white border border-[#e2e5ea] shadow-2xs">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#585d6b] block">
                    Total Ruang Kerja
                  </span>
                  <div className="mt-1 font-heading text-2xl font-black text-[#0b0c0e]">
                    {workspaces.length > 0 ? workspaces.length : 6} Active
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white border border-[#e2e5ea] shadow-2xs">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#585d6b] block">
                    Trafik Bulan Ini
                  </span>
                  <div className="mt-1 font-heading text-2xl font-black text-[#1f2de6]">
                    42.8K
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white border border-[#e2e5ea] shadow-2xs">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#585d6b] block">
                    Pendaftar Terverifikasi
                  </span>
                  <div className="mt-1 font-heading text-2xl font-black text-[#0b0c0e]">
                    1,940
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white border border-[#e2e5ea] shadow-2xs">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#585d6b] block">
                    Status Tim Expert
                  </span>
                  <div className="mt-1 font-heading text-2xl font-black text-emerald-700">
                    2 Ongoing
                  </div>
                </div>
              </div>

              {/* Filter & Search Bar */}
              <div className="p-3 rounded-xl bg-white border border-[#e2e5ea] shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
                {/* Search */}
                <div className="relative w-full md:w-80">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[16px] text-[#8c93a0]">
                    search
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari nama workspace, event, atau klien..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#f8f9fb] border border-[#e2e5ea] text-xs text-[#0b0c0e] focus:bg-white focus:border-[#1f2de6] focus:outline-none"
                  />
                </div>

                {/* Filter Tabs & Dropdowns */}
                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                  <div className="flex items-center rounded-lg bg-[#f8f9fb] border border-[#e2e5ea] p-0.5">
                    <button
                      type="button"
                      onClick={() => setWorkspaceFilterTab('all')}
                      className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all cursor-pointer ${
                        workspaceFilterTab === 'all'
                          ? 'bg-white text-[#0b0c0e] shadow-2xs'
                          : 'text-[#585d6b] hover:text-[#0b0c0e]'
                      }`}
                    >
                      All ({workspaces.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setWorkspaceFilterTab('spark')}
                      className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all cursor-pointer ${
                        workspaceFilterTab === 'spark'
                          ? 'bg-white text-[#0b0c0e] shadow-2xs'
                          : 'text-[#585d6b] hover:text-[#0b0c0e]'
                      }`}
                    >
                      Spark Websites
                    </button>
                    <button
                      type="button"
                      onClick={() => setWorkspaceFilterTab('expert')}
                      className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all cursor-pointer ${
                        workspaceFilterTab === 'expert'
                          ? 'bg-white text-[#0b0c0e] shadow-2xs'
                          : 'text-[#585d6b] hover:text-[#0b0c0e]'
                      }`}
                    >
                      Expert Projects
                    </button>
                  </div>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-lg bg-[#f8f9fb] border border-[#e2e5ea] text-xs font-mono text-[#0b0c0e] focus:outline-none cursor-pointer"
                  >
                    <option value="all">All Status</option>
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>

                  <div className="flex items-center border border-[#e2e5ea] rounded-lg bg-[#f8f9fb] p-0.5">
                    <button
                      type="button"
                      onClick={() => setViewMode('grid')}
                      className={`p-1.5 rounded transition-colors cursor-pointer ${
                        viewMode === 'grid' ? 'bg-white text-[#1f2de6] shadow-2xs' : 'text-[#8c93a0]'
                      }`}
                      title="Tampilan Grid"
                    >
                      <span className="material-symbols-outlined text-[16px]">grid_view</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('list')}
                      className={`p-1.5 rounded transition-colors cursor-pointer ${
                        viewMode === 'list' ? 'bg-white text-[#1f2de6] shadow-2xs' : 'text-[#8c93a0]'
                      }`}
                      title="Tampilan List"
                    >
                      <span className="material-symbols-outlined text-[16px]">view_list</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Workspace Grid Cards (Image 3 Style) */}
              {isLoading ? (
                <div className="py-24 text-center">
                  <div className="w-6 h-6 border-2 border-[#1f2de6] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-xs font-mono text-[#585d6b]">Memuat daftar workspace...</p>
                </div>
              ) : filteredWorkspaces.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-xl border border-[#e2e5ea]">
                  <h4 className="font-heading text-base font-bold text-[#0b0c0e]">Belum Ada Workspace Ditemukan</h4>
                  <p className="text-xs text-[#585d6b] mt-1 mb-4">
                    Buat website event baru Anda sekarang dengan template yang siap pakai.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsTemplateModalOpen(true)}
                    className="px-5 py-2.5 rounded-lg bg-[#1f2de6] text-white text-xs font-semibold"
                  >
                    + Buat Workspace Pertama
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredWorkspaces.map((ws, idx) => {
                    const isPublished = ws.status === 'published';
                    const tmpl = getTemplateById(ws.template_id || 'tech-summit');
                    return (
                      <div
                        key={ws.id}
                        className="rounded-xl border border-[#e2e5ea] bg-white overflow-hidden shadow-2xs flex flex-col justify-between card-lift"
                      >
                        <div>
                          {/* Visual Card Header */}
                          <div className={`h-28 bg-gradient-to-tr ${tmpl.previewGradient} p-3.5 text-white flex flex-col justify-between relative`}>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono font-bold uppercase bg-black/40 backdrop-blur-xs px-2 py-0.5 rounded text-white">
                                {ws.service_type === 'spark' ? 'Spark Pro' : 'Iventra Expert'}
                              </span>
                              <span
                                className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                                  isPublished ? 'bg-emerald-600 text-white' : 'bg-white text-[#0b0c0e]'
                                }`}
                              >
                                {isPublished ? '● Published' : 'Draft'}
                              </span>
                            </div>
                            <div className="text-[11px] font-mono text-white/90 truncate">
                              {ws.slug ? `${ws.slug}.iventra.site` : 'Unpublished draft'}
                            </div>
                          </div>

                          {/* Body Information */}
                          <div className="p-4 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="font-heading text-base font-bold text-[#0b0c0e] tracking-tight line-clamp-1" title={ws.name}>
                                {ws.name}
                              </h3>
                              <button
                                type="button"
                                onClick={() => setEditingWs(ws)}
                                className="text-[#8c93a0] hover:text-[#0b0c0e] p-0.5 rounded"
                                title="Edit info workspace"
                              >
                                <span className="material-symbols-outlined text-[16px]">more_vert</span>
                              </button>
                            </div>

                            <p className="text-xs text-[#585d6b] line-clamp-2 min-h-[32px] leading-relaxed">
                              {ws.description || tmpl.description}
                            </p>

                            {/* Metrics snippet */}
                            <div className="pt-2 border-t border-[#f1f3f7] flex items-center justify-between text-xs font-mono">
                              <div>
                                <span className="text-[#8c93a0] block text-[10px]">Visitors</span>
                                <strong className="text-[#0b0c0e]">2,450 <span className="text-emerald-700 text-[10px]">+18%</span></strong>
                              </div>
                              <div className="text-right">
                                <span className="text-[#8c93a0] block text-[10px]">Form Submissions</span>
                                <strong className="text-[#0b0c0e]">482 teams</strong>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="p-3 bg-[#f8f9fb] border-t border-[#e2e5ea] flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => onOpenBuilder(ws)}
                            className="flex-1 py-1.5 rounded-lg bg-[#1f2de6] hover:bg-[#1622b8] text-white text-xs font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer"
                          >
                            Edit Builder
                          </button>

                          {isPublished && ws.slug && (
                            <button
                              type="button"
                              onClick={() => handleCopyUrl(ws.slug!)}
                              className="px-2.5 py-1.5 rounded-lg border border-[#e2e5ea] bg-white hover:bg-[#f4f5f8] text-[#0b0c0e] text-xs font-mono transition-colors cursor-pointer"
                              title="Salin Link"
                            >
                              <span className="material-symbols-outlined text-[16px]">link</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setDeletingWs(ws)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-[#8c93a0] hover:text-red-600 transition-colors cursor-pointer"
                            title="Hapus Workspace"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Bottom Callout Banner */}
              <div className="p-6 rounded-xl bg-white border border-[#e2e5ea] shadow-2xs flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#edf2ff] text-[#1f2de6] flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[24px]">rocket_launch</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-heading text-base font-extrabold text-[#0b0c0e]">
                        Butuh event website custom dengan fitur kompleks?
                      </h4>
                      <span className="text-[10px] font-mono font-bold uppercase bg-[#edf2ff] text-[#1f2de6] px-2 py-0.5 rounded">
                        Expert Services
                      </span>
                    </div>
                    <p className="text-xs text-[#585d6b] mt-1 max-w-2xl leading-relaxed">
                      Tim developer dan desainer Iventra siap membangun custom event tech: integrasi RFID barcode gate, custom multi-tier payment, hingga streaming multi-room hanya dalam 7 hari kerja.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setCurrentNav('expert')}
                    className="px-4 py-2 rounded-lg border border-[#e2e5ea] bg-white hover:bg-[#f4f5f8] text-[#0b0c0e] text-xs font-mono font-bold transition-colors cursor-pointer"
                  >
                    Jadwalkan Konsultasi Gratis
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentNav('expert')}
                    className="px-4 py-2 rounded-lg bg-[#1f2de6] hover:bg-[#1622b8] text-white text-xs font-semibold tracking-tight shadow-xs transition-all active:scale-[0.98] cursor-pointer"
                  >
                    Pesan Proyek Expert
                  </button>
                </div>
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
                    className="rounded-xl border border-[#e2e5ea] bg-white overflow-hidden shadow-2xs flex flex-col justify-between card-lift"
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
                        <div className="pt-2 border-t border-[#f1f3f7]">
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
