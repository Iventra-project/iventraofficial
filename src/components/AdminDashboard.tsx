import { useState, useEffect, useCallback } from 'react';
import Logo from './Logo.tsx';
import { SPARK_TEMPLATES, type TemplateDefinition } from '../types/builder.ts';
import RealtimeWorkspaceThumbnail from './spark/RealtimeWorkspaceThumbnail.tsx';

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  plan: 'spark' | 'spark_pro' | string;
  role: 'user' | 'admin' | string;
  created_at: string;
  updated_at: string;
  workspaces_count: number;
  total_traffic: number;
  traffic_limit: number;
  traffic_percent: number;
  submissions_count: number;
  age?: number | null;
  gender?: string | null;
  onboarding_role?: string | null;
  onboarding_purpose?: string | null;
  onboarding_source?: string | null;
}

export interface AdminUserDetailWorkspace {
  id: string;
  name: string;
  slug: string | null;
  status: string;
  service_type: string;
  visitors_count: number;
  submissions_count: number;
  created_at: string;
  updated_at: string;
}

export interface AdminUserDetail {
  id: string;
  name: string;
  email: string;
  plan: 'spark' | 'spark_pro' | string;
  role: 'user' | 'admin' | string;
  created_at: string;
  updated_at: string;
  traffic_limit: number;
  total_traffic: number;
  traffic_percent: number;
  total_submissions: number;
  workspaces_count: number;
  age?: number | null;
  gender?: string | null;
  onboarding_role?: string | null;
  onboarding_purpose?: string | null;
  onboarding_source?: string | null;
  workspaces: AdminUserDetailWorkspace[];
}

export interface AdminWorkspace {
  id: string;
  owner_id: string;
  name: string;
  service_type: string;
  status: string;
  slug: string | null;
  description: string | null;
  template_id?: string;
  visitors_count: number;
  form_started_count: number;
  submitted_count: number;
  submissions_count: number;
  owner_name: string;
  owner_email: string;
  owner_plan: string;
  published_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConsultationItem {
  id: number;
  name: string;
  campus: string;
  eventName: string;
  planId: string;
  estimatedParticipants: number;
  contactNumber: string;
  notes?: string;
  status: 'Baru' | 'Dihubungi' | 'Deal' | 'Batal';
  createdAt: string;
}

export interface AdminStatsData {
  totalUsers: number;
  proUsers: number;
  freeUsers: number;
  totalWorkspaces: number;
  publishedWorkspaces: number;
  totalTraffic: number;
  totalSubmissions: number;
  totalLeads: number;
}

export interface SiteSettings {
  sparkPrice: string;
  sparkPriceNote: string;
  flowPrice: string;
  flowPriceNote: string;
  botPrice: string;
  botPriceNote: string;
  totalProjectsHandled: string;
  totalActiveUsers: string;
}

interface AdminDashboardProps {
  onBackToSite: () => void;
  onPreviewProject?: (id: string) => void;
  onSettingsUpdated?: () => void;
}

export default function AdminDashboard({
  onBackToSite,
  onSettingsUpdated
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'users' | 'workspaces' | 'templates' | 'overview' | 'leads' | 'settings'>('users');
  const [stats, setStats] = useState<AdminStatsData | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [workspaces, setWorkspaces] = useState<AdminWorkspace[]>([]);
  const [leads, setLeads] = useState<ConsultationItem[]>([]);
  const [templatesList, setTemplatesList] = useState<TemplateDefinition[]>(SPARK_TEMPLATES);
  const [loading, setLoading] = useState(true);

  // User Detail View State
  const [selectedUserDetail, setSelectedUserDetail] = useState<AdminUserDetail | null>(null);
  const [detailForm, setDetailForm] = useState<{
    name: string;
    email: string;
    plan: string;
    role: string;
    password?: string;
  }>({ name: '', email: '', plan: 'spark', role: 'user', password: '' });
  const [isSavingUserDetail, setIsSavingUserDetail] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  // Filters & Search
  const [searchUser, setSearchUser] = useState('');
  const [filterUserPlan, setFilterUserPlan] = useState<string>('all');
  const [searchWorkspace, setSearchWorkspace] = useState('');
  const [filterWsStatus, setFilterWsStatus] = useState<string>('all');
  const [searchLead, setSearchLead] = useState('');
  const [filterLeadStatus, setFilterLeadStatus] = useState<string>('all');
  const [searchTemplate, setSearchTemplate] = useState('');
  const [filterTemplateCategory, setFilterTemplateCategory] = useState<string>('all');

  // Site Settings state
  const [settings, setSettings] = useState<SiteSettings>({
    sparkPrice: 'Rp 150.000',
    sparkPriceNote: '/ bulan',
    flowPrice: 'Mulai Rp 500.000',
    flowPriceNote: '/ event',
    botPrice: 'Rp 70.000',
    botPriceNote: '/ event',
    totalProjectsHandled: '120+',
    totalActiveUsers: '15.000+'
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Modals
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<AdminUser | null>(null);
  const [editingWs, setEditingWs] = useState<AdminWorkspace | null>(null);
  const [deletingWs, setDeletingWs] = useState<AdminWorkspace | null>(null);
  const [isCreateTemplateModalOpen, setIsCreateTemplateModalOpen] = useState(false);
  const [deletingTemplate, setDeletingTemplate] = useState<TemplateDefinition | null>(null);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  // Create Template Form State
  const [templateForm, setTemplateForm] = useState({
    id: '',
    name: '',
    category: 'Seminar & Konferensi',
    badge: 'Paling Populer',
    description: '',
    primaryColor: '#1f2de6',
    accentColor: '#3b47dc',
    headline: '',
    tagline: '',
    dateText: '',
    locationText: '',
    bannerUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80'
  });

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [resStats, resUsers, resWorkspaces, resLeads, resSettings, resTemplates] = await Promise.all([
        fetch('/api/admin/stats').then((r) => r.json()),
        fetch('/api/admin/users').then((r) => r.json()),
        fetch('/api/admin/workspaces').then((r) => r.json()),
        fetch('/api/consultations').then((r) => r.json()),
        fetch('/api/settings').then((r) => r.json()),
        fetch('/api/templates').then((r) => r.json()).catch(() => [])
      ]);

      if (resStats && !resStats.error) setStats(resStats);
      if (Array.isArray(resUsers)) setUsers(resUsers);
      if (Array.isArray(resWorkspaces)) setWorkspaces(resWorkspaces);
      if (Array.isArray(resLeads)) setLeads(resLeads);
      if (resSettings && typeof resSettings === 'object') {
        setSettings((prev) => ({ ...prev, ...resSettings }));
      }
      if (Array.isArray(resTemplates) && resTemplates.length > 0) {
        setTemplatesList(resTemplates);
      }
    } catch {
      showToast('Gagal memuat data administrasi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ─── Template Management Handlers ──────────────────────────────────────────

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateForm.name.trim()) {
      setModalError('Nama template wajib diisi.');
      return;
    }
    setIsSavingTemplate(true);
    setModalError('');
    try {
      const cleanId = (templateForm.id.trim() || templateForm.name.trim())
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .trim();

      const defaultConfig = {
        eventName: templateForm.headline.trim() || templateForm.name.trim(),
        tagline: templateForm.tagline.trim(),
        description: templateForm.description.trim(),
        institutionName: 'Panitia Pelaksana',
        bannerUrl: templateForm.bannerUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
        eventDateText: templateForm.dateText || 'Segera Diumumkan',
        eventLocationText: templateForm.locationText || 'Kampus / Gedung Acara',
        isOnline: false,
        theme: {
          primaryColor: templateForm.primaryColor,
          accentColor: templateForm.accentColor,
          bgStyle: 'clean-white',
          fontFamily: 'sans'
        },
        blocks: [
          {
            id: `${cleanId}-hero`,
            type: 'hero',
            title: 'Hero Banner',
            enabled: true,
            data: {
              headline: templateForm.headline.trim() || templateForm.name.trim(),
              tagline: templateForm.tagline.trim(),
              dateText: templateForm.dateText || '',
              locationText: templateForm.locationText || '',
              bannerUrl: templateForm.bannerUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
              buttons: [{ id: 'btn-1', enabled: true, label: 'Daftar Sekarang', targetType: 'block', targetBlockId: `${cleanId}-form` }]
            }
          },
          {
            id: `${cleanId}-form`,
            type: 'form',
            title: 'Formulir Registrasi Peserta',
            enabled: true,
            data: {
              buttonText: 'Kirim Pendaftaran',
              openMode: 'same-page',
              steps: [
                {
                  id: 'step-1',
                  title: 'Alur 1',
                  fields: [
                    { id: 'f-1', label: 'Nama Lengkap', type: 'text', required: true, placeholder: 'Nama lengkap' },
                    { id: 'f-2', label: 'Email Aktif', type: 'text', required: true, placeholder: 'nama@domain.com' },
                    { id: 'f-3', label: 'Nomor WhatsApp', type: 'text', required: true, placeholder: '08xxxxxxxxxx' }
                  ]
                }
              ]
            }
          }
        ]
      };

      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: cleanId,
          name: templateForm.name.trim(),
          category: templateForm.category,
          badge: templateForm.badge,
          description: templateForm.description,
          defaultConfig
        })
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Gagal menyimpan template');
      }

      showToast('Template berhasil dibuat!');
      setIsCreateTemplateModalOpen(false);

      // Refresh templates
      const refRes = await fetch('/api/templates');
      const refData = await refRes.json();
      if (Array.isArray(refData) && refData.length > 0) setTemplatesList(refData);
    } catch (err: any) {
      setModalError(err.message || 'Terjadi kesalahan');
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const handleDeleteTemplate = async (tmpl: TemplateDefinition) => {
    try {
      const res = await fetch(`/api/templates/${tmpl.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal menghapus template');
      showToast('Template berhasil dihapus.');
      setDeletingTemplate(null);
      const refRes = await fetch('/api/templates');
      const refData = await refRes.json();
      if (Array.isArray(refData)) setTemplatesList(refData);
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus template.');
    }
  };

  // ─── Open User Detail View ────────────────────────────────────────────────

  const handleViewUser = async (u: AdminUser) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${u.id}`);
      if (res.ok) {
        const data: AdminUserDetail = await res.json();
        setSelectedUserDetail(data);
        setDetailForm({
          name: data.name,
          email: data.email,
          plan: data.plan,
          role: data.role,
          password: ''
        });
      } else {
        showToast('Gagal memuat profil detail pengguna.');
      }
    } catch {
      showToast('Gagal memuat detail pengguna.');
    } finally {
      setDetailLoading(false);
    }
  };

  // ─── Save User Detail Directly ────────────────────────────────────────────

  const handleSaveUserDetail = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedUserDetail) return;
    setIsSavingUserDetail(true);
    try {
      const body: any = {
        name: detailForm.name.trim(),
        email: detailForm.email.trim(),
        plan: detailForm.plan,
        role: detailForm.role
      };
      if (detailForm.password && detailForm.password.trim().length >= 6) {
        body.password = detailForm.password.trim();
      }

      const res = await fetch(`/api/admin/users/${selectedUserDetail.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Gagal menyimpan data.');
      }

      showToast('Data pengguna berhasil disimpan!');

      // Re-fetch detail
      const refRes = await fetch(`/api/admin/users/${selectedUserDetail.id}`);
      if (refRes.ok) {
        const refreshed: AdminUserDetail = await refRes.json();
        setSelectedUserDetail(refreshed);
        setDetailForm((prev) => ({ ...prev, password: '' }));
      }
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan perubahan.');
    } finally {
      setIsSavingUserDetail(false);
    }
  };

  // ─── User CRUD Handlers ───────────────────────────────────────────────────

  const handleCreateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setModalError('');
    setIsSubmitting(true);
    const form = e.currentTarget;
    const data = {
      name: (form.elements.namedItem('userName') as HTMLInputElement).value.trim(),
      email: (form.elements.namedItem('userEmail') as HTMLInputElement).value.trim(),
      password: (form.elements.namedItem('userPassword') as HTMLInputElement).value,
      plan: (form.elements.namedItem('userPlan') as HTMLSelectElement).value,
      role: (form.elements.namedItem('userRole') as HTMLSelectElement).value
    };

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal membuat user.');

      showToast(`User ${data.name} berhasil ditambahkan.`);
      setIsCreateUserModalOpen(false);
      loadData();
    } catch (err: any) {
      setModalError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/users/${deletingUser.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal menghapus user.');
      showToast(`User ${deletingUser.name} berhasil dihapus.`);
      setDeletingUser(null);
      if (selectedUserDetail?.id === deletingUser.id) {
        setSelectedUserDetail(null);
      }
      loadData();
    } catch {
      showToast('Gagal menghapus user.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Workspace CRUD Handlers ──────────────────────────────────────────────

  const handleUpdateWorkspace = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingWs) return;
    setModalError('');
    setIsSubmitting(true);
    const form = e.currentTarget;
    const data = {
      name: (form.elements.namedItem('wsName') as HTMLInputElement).value.trim(),
      slug: (form.elements.namedItem('wsSlug') as HTMLInputElement).value.trim(),
      status: (form.elements.namedItem('wsStatus') as HTMLSelectElement).value,
      service_type: (form.elements.namedItem('wsService') as HTMLSelectElement).value,
      visitors_count: Number((form.elements.namedItem('wsVisitors') as HTMLInputElement).value || 0)
    };

    try {
      const res = await fetch(`/api/admin/workspaces/${editingWs.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal memperbarui workspace.');

      showToast('Workspace berhasil diperbarui.');
      setEditingWs(null);
      loadData();
      if (selectedUserDetail) {
        const refRes = await fetch(`/api/admin/users/${selectedUserDetail.id}`);
        if (refRes.ok) setSelectedUserDetail(await refRes.json());
      }
    } catch (err: any) {
      setModalError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteWorkspace = async () => {
    if (!deletingWs) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/workspaces/${deletingWs.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal menghapus workspace.');
      showToast('Workspace berhasil dihapus.');
      setDeletingWs(null);
      loadData();
      if (selectedUserDetail) {
        const refRes = await fetch(`/api/admin/users/${selectedUserDetail.id}`);
        if (refRes.ok) setSelectedUserDetail(await refRes.json());
      }
    } catch {
      showToast('Gagal menghapus workspace.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Leads Status Update ──────────────────────────────────────────────────

  const handleUpdateLeadStatus = async (id: number, status: string) => {
    try {
      const res = await fetch(`/api/consultations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        showToast('Status leads diperbarui.');
        loadData();
      }
    } catch {
      showToast('Gagal mengubah status.');
    }
  };

  const handleDeleteLead = async (id: number) => {
    try {
      const res = await fetch(`/api/consultations/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Leads dihapus.');
        loadData();
      }
    } catch {
      showToast('Gagal menghapus.');
    }
  };

  // ─── Save Settings ────────────────────────────────────────────────────────

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        showToast('Pengaturan tarif berhasil disimpan!');
        if (onSettingsUpdated) onSettingsUpdated();
      }
    } catch {
      showToast('Gagal menyimpan pengaturan.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  // ─── Filtered Data ────────────────────────────────────────────────────────

  const filteredUsers = users.filter((u) => {
    if (searchUser.trim()) {
      const q = searchUser.toLowerCase();
      if (!u.name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false;
    }
    if (filterUserPlan !== 'all' && u.plan !== filterUserPlan) return false;
    return true;
  });

  const filteredWorkspaces = workspaces.filter((ws) => {
    if (searchWorkspace.trim()) {
      const q = searchWorkspace.toLowerCase();
      const matchName = ws.name.toLowerCase().includes(q);
      const matchSlug = (ws.slug || '').toLowerCase().includes(q);
      const matchOwner = ws.owner_name.toLowerCase().includes(q) || ws.owner_email.toLowerCase().includes(q);
      if (!matchName && !matchSlug && !matchOwner) return false;
    }
    if (filterWsStatus !== 'all' && ws.status !== filterWsStatus) return false;
    return true;
  });

  const filteredLeads = leads.filter((l) => {
    if (searchLead.trim()) {
      const q = searchLead.toLowerCase();
      if (!l.name.toLowerCase().includes(q) && !l.campus.toLowerCase().includes(q) && !l.eventName.toLowerCase().includes(q)) {
        return false;
      }
    }
    if (filterLeadStatus !== 'all' && l.status !== filterLeadStatus) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#f8f9fb] text-[#0b0c0e] flex flex-col font-sans select-none selection:bg-[#1f2de6] selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-[#0b0c0e] text-white px-4 py-2.5 rounded-lg shadow-xl flex items-center gap-2 border border-white/10 animate-fadeIn font-mono text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ─── 1. TOP HEADER ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#e2e5ea] h-16 flex items-center px-4 sm:px-6 justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToSite}
            className="flex items-center gap-2 hover:opacity-85 transition-opacity cursor-pointer text-left"
            title="Kembali ke landing page"
          >
            <Logo size="sm" />
            <span className="font-heading text-lg font-black tracking-tight text-[#0b0c0e]">
              IVENTRA
            </span>
          </button>
          <span className="px-2 py-0.5 rounded bg-[#0b0c0e] text-white text-[10px] font-mono font-bold tracking-wider uppercase">
            ADMIN CONSOLE
          </span>
          <span className="hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-mono font-semibold border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            SQLite Engine Online
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsCreateUserModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#1f2de6] hover:bg-[#1622b8] text-white text-xs font-semibold tracking-tight shadow-xs transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">person_add</span>
            <span>+ Tambah User</span>
          </button>

          <button
            type="button"
            onClick={onBackToSite}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#e2e5ea] bg-white hover:bg-[#f8f9fb] text-[#0b0c0e] text-xs font-mono font-bold transition-colors cursor-pointer"
          >
            <span>Website Utama</span>
            <span className="material-symbols-outlined text-[15px]">open_in_new</span>
          </button>
        </div>
      </header>

      {/* ─── 2. MAIN CONTAINER WITH SIDEBAR ─────────────────────────────────── */}
      <div className="flex flex-1 w-full overflow-hidden">
        {/* Sidebar Navigation */}
        <aside className="w-60 bg-white border-r border-[#e2e5ea] flex flex-col justify-between py-5 px-3 shrink-0">
          <div className="space-y-6">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8c93a0] px-3 block mb-2">
                Menu Administrasi
              </span>
              <nav className="space-y-1">
                {/* 1. Manajemen User */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('users');
                    setSelectedUserDetail(null);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'users'
                      ? 'bg-[#edf2ff] text-[#1f2de6] font-bold'
                      : 'text-[#585d6b] hover:text-[#0b0c0e] hover:bg-[#f8f9fb]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[18px]">manage_accounts</span>
                    <span>Manajemen User</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-[#f4f5f8] border border-[#e2e5ea] text-[#585d6b]">
                    {users.length}
                  </span>
                </button>

                {/* 2. Semua Workspace */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('workspaces');
                    setSelectedUserDetail(null);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'workspaces'
                      ? 'bg-[#edf2ff] text-[#1f2de6] font-bold'
                      : 'text-[#585d6b] hover:text-[#0b0c0e] hover:bg-[#f8f9fb]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[18px]">layers</span>
                    <span>Semua Workspace</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-[#f4f5f8] border border-[#e2e5ea] text-[#585d6b]">
                    {workspaces.length}
                  </span>
                </button>

                {/* 3. Kelola Template */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('templates');
                    setSelectedUserDetail(null);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'templates'
                      ? 'bg-[#edf2ff] text-[#1f2de6] font-bold'
                      : 'text-[#585d6b] hover:text-[#0b0c0e] hover:bg-[#f8f9fb]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[18px]">dashboard_customize</span>
                    <span>Kelola Template</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-[#f4f5f8] border border-[#e2e5ea] text-[#585d6b]">
                    {templatesList.length}
                  </span>
                </button>

                {/* 4. Ringkasan */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('overview');
                    setSelectedUserDetail(null);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'overview'
                      ? 'bg-[#edf2ff] text-[#1f2de6] font-bold'
                      : 'text-[#585d6b] hover:text-[#0b0c0e] hover:bg-[#f8f9fb]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">space_dashboard</span>
                  <span>Ringkasan Metrik</span>
                </button>

                {/* 4. Leads & Konsultasi */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('leads');
                    setSelectedUserDetail(null);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'leads'
                      ? 'bg-[#edf2ff] text-[#1f2de6] font-bold'
                      : 'text-[#585d6b] hover:text-[#0b0c0e] hover:bg-[#f8f9fb]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[18px]">support_agent</span>
                    <span>Leads Konsultasi</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-[#f4f5f8] border border-[#e2e5ea] text-[#585d6b]">
                    {leads.length}
                  </span>
                </button>

                {/* 5. Pengaturan Tarif */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('settings');
                    setSelectedUserDetail(null);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'settings'
                      ? 'bg-[#edf2ff] text-[#1f2de6] font-bold'
                      : 'text-[#585d6b] hover:text-[#0b0c0e] hover:bg-[#f8f9fb]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">tune</span>
                  <span>Pengaturan Tarif</span>
                </button>
              </nav>
            </div>
          </div>

          {/* Sidebar Traffic Rules Reference */}
          <div className="p-3 rounded-xl bg-[#f8f9fb] border border-[#e2e5ea] space-y-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#0b0c0e] block">
              Batas Kuota Trafik
            </span>
            <div className="text-[11px] font-mono text-[#585d6b] space-y-1">
              <div className="flex justify-between">
                <span>Spark Biasa:</span>
                <strong className="text-[#0b0c0e]">500 visit</strong>
              </div>
              <div className="flex justify-between">
                <span>Spark Pro:</span>
                <strong className="text-[#1f2de6]">5.000 visit</strong>
              </div>
            </div>
          </div>
        </aside>

        {/* ─── MAIN CONTENT VIEWPORT ───────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {loading ? (
            <div className="py-24 text-center">
              <div className="w-8 h-8 border-3 border-[#1f2de6] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs font-mono text-[#585d6b]">Memuat data administrasi...</p>
            </div>
          ) : (
            <>
              {/* ─────────────────────────────────────────────────────────────
                  TAB 1: MANAJEMEN USER & KUOTA TRAFIK
                  ───────────────────────────────────────────────────────────── */}
              {activeTab === 'users' && (
                <>
                  {/* VIEW A: DEDICATED USER DETAIL PAGE */}
                  {selectedUserDetail ? (
                    <div className="space-y-6 max-w-5xl mx-auto animate-fadeIn">
                      {/* Detail Header & Action Buttons */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#e2e5ea]">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setSelectedUserDetail(null)}
                            className="p-2 rounded-lg border border-[#e2e5ea] bg-white hover:bg-[#f4f5f8] text-[#0b0c0e] text-xs font-mono font-bold transition-colors cursor-pointer flex items-center gap-1"
                            title="Kembali ke Daftar User"
                          >
                            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                            <span>Kembali</span>
                          </button>

                          <div>
                            <div className="flex items-center gap-2">
                              <h1 className="font-heading text-xl sm:text-2xl font-extrabold text-[#0b0c0e] tracking-tight">
                                {selectedUserDetail.name}
                              </h1>
                              <span
                                className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                                  selectedUserDetail.plan === 'spark_pro'
                                    ? 'bg-[#edf2ff] text-[#1f2de6] border-[#1f2de6]/30'
                                    : 'bg-[#f4f5f8] text-[#585d6b] border-[#e2e5ea]'
                                }`}
                              >
                                {selectedUserDetail.plan === 'spark_pro' ? 'Spark Pro (5.000)' : 'Spark Biasa (500)'}
                              </span>
                              {selectedUserDetail.role === 'admin' && (
                                <span className="text-[9px] font-mono font-bold uppercase bg-[#0b0c0e] text-white px-1.5 py-0.5 rounded">
                                  Admin
                                </span>
                              )}
                            </div>
                            <p className="text-xs font-mono text-[#8c93a0] mt-0.5">
                              ID: {selectedUserDetail.id} • Terdaftar sejak {new Date(selectedUserDetail.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                          </div>
                        </div>

                        {/* Top Save & Delete Buttons */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const found = users.find((u) => u.id === selectedUserDetail.id);
                              if (found) setDeletingUser(found);
                            }}
                            className="px-3.5 py-2 rounded-lg border border-red-200 bg-white hover:bg-red-50 text-red-600 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                            <span>Hapus</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSaveUserDetail()}
                            disabled={isSavingUserDetail}
                            className="px-4 py-2 rounded-lg bg-[#1f2de6] hover:bg-[#1622b8] disabled:opacity-50 text-white text-xs font-semibold tracking-tight shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            <span className="material-symbols-outlined text-[16px]">save</span>
                            <span>{isSavingUserDetail ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Profil & Personalized Setup Info Panel */}
                      <div className="p-4 rounded-xl bg-white border border-[#e2e5ea] shadow-2xs">
                        <div className="text-[11px] font-mono font-bold text-[#585d6b] uppercase mb-3 flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px] text-[#1f2de6]">badge</span>
                          <span>Profil &amp; Personalized Setup</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                          <div>
                            <span className="text-[#8c93a0] block text-[10px] font-mono uppercase">Umur &amp; Gender</span>
                            <span className="font-semibold text-[#0b0c0e]">
                              {selectedUserDetail.age ? `${selectedUserDetail.age} tahun` : '-'} {selectedUserDetail.gender ? `(${selectedUserDetail.gender})` : ''}
                            </span>
                          </div>
                          <div>
                            <span className="text-[#8c93a0] block text-[10px] font-mono uppercase">Peran / Profesi</span>
                            <span className="font-semibold text-[#0b0c0e]">{selectedUserDetail.onboarding_role || '-'}</span>
                          </div>
                          <div>
                            <span className="text-[#8c93a0] block text-[10px] font-mono uppercase">Kebutuhan Event</span>
                            <span className="font-semibold text-[#0b0c0e]">{selectedUserDetail.onboarding_purpose || '-'}</span>
                          </div>
                          <div>
                            <span className="text-[#8c93a0] block text-[10px] font-mono uppercase">Sumber Informasi</span>
                            <span className="font-semibold text-[#0b0c0e]">{selectedUserDetail.onboarding_source || '-'}</span>
                          </div>
                        </div>
                      </div>

                      {/* 3 Metric Cards for this User */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* 1. Traffic Quota */}
                        <div className="p-4 rounded-xl bg-white border border-[#e2e5ea] shadow-2xs space-y-2">
                          <div className="flex items-center justify-between text-xs font-mono">
                            <span className="text-[#585d6b] uppercase font-bold">Pemakaian Kuota</span>
                            <span
                              className={`font-bold ${
                                selectedUserDetail.traffic_percent >= 100
                                  ? 'text-red-600'
                                  : selectedUserDetail.traffic_percent >= 80
                                  ? 'text-amber-600'
                                  : 'text-emerald-700'
                              }`}
                            >
                              {selectedUserDetail.traffic_percent}%
                            </span>
                          </div>
                          <div className="flex items-baseline gap-1">
                            <span className="font-heading text-2xl font-black text-[#0b0c0e]">
                              {selectedUserDetail.total_traffic.toLocaleString('id-ID')}
                            </span>
                            <span className="text-xs font-mono text-[#8c93a0]">
                              / {selectedUserDetail.traffic_limit.toLocaleString('id-ID')} visit
                            </span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-[#e2e5ea] overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                selectedUserDetail.traffic_percent >= 100
                                  ? 'bg-red-600'
                                  : selectedUserDetail.traffic_percent >= 80
                                  ? 'bg-amber-500'
                                  : 'bg-[#1f2de6]'
                              }`}
                              style={{ width: `${selectedUserDetail.traffic_percent}%` }}
                            />
                          </div>
                        </div>

                        {/* 2. Total Workspaces */}
                        <div className="p-4 rounded-xl bg-white border border-[#e2e5ea] shadow-2xs space-y-1">
                          <span className="text-xs font-mono font-bold text-[#585d6b] uppercase block">Total Website / Form</span>
                          <div className="flex items-baseline gap-2">
                            <span className="font-heading text-2xl font-black text-[#0b0c0e]">
                              {selectedUserDetail.workspaces_count}
                            </span>
                            <span className="text-xs font-mono text-emerald-700">
                              {selectedUserDetail.workspaces.filter((w) => w.status === 'published').length} Live
                            </span>
                          </div>
                          <p className="text-[10px] font-mono text-[#8c93a0]">Dibuat oleh pengguna ini</p>
                        </div>

                        {/* 3. Total Submissions */}
                        <div className="p-4 rounded-xl bg-white border border-[#e2e5ea] shadow-2xs space-y-1">
                          <span className="text-xs font-mono font-bold text-[#585d6b] uppercase block">Respon Terkumpul</span>
                          <div className="flex items-baseline gap-2">
                            <span className="font-heading text-2xl font-black text-[#0b0c0e]">
                              {selectedUserDetail.total_submissions}
                            </span>
                            <span className="text-xs font-mono text-[#8c93a0]">pendaftar</span>
                          </div>
                          <p className="text-[10px] font-mono text-[#8c93a0]">Total dari seluruh formulir</p>
                        </div>
                      </div>

                      {/* Editable Form Section */}
                      <div className="p-6 rounded-xl bg-white border border-[#e2e5ea] shadow-2xs">
                        <div className="flex items-center justify-between pb-3.5 border-b border-[#e2e5ea] mb-5">
                          <h3 className="font-heading text-sm font-bold text-[#0b0c0e]">
                            Edit Informasi &amp; Hak Akses Pengguna
                          </h3>
                          <span className="text-[11px] font-mono text-[#8c93a0]">
                            Perubahan berlaku langsung di database
                          </span>
                        </div>

                        <form onSubmit={handleSaveUserDetail} className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Nama Lengkap */}
                            <div className="space-y-1">
                              <label className="text-xs font-bold text-[#0b0c0e] uppercase">
                                Nama Lengkap
                              </label>
                              <input
                                type="text"
                                value={detailForm.name}
                                onChange={(e) => setDetailForm({ ...detailForm, name: e.target.value })}
                                required
                                className="w-full px-3.5 py-2 rounded-lg border border-[#e2e5ea] text-xs text-[#0b0c0e] focus:outline-none focus:border-[#1f2de6]"
                              />
                            </div>

                            {/* Email */}
                            <div className="space-y-1">
                              <label className="text-xs font-bold text-[#0b0c0e] uppercase">
                                Email Pengguna
                              </label>
                              <input
                                type="email"
                                value={detailForm.email}
                                onChange={(e) => setDetailForm({ ...detailForm, email: e.target.value })}
                                required
                                className="w-full px-3.5 py-2 rounded-lg border border-[#e2e5ea] text-xs font-mono text-[#0b0c0e] focus:outline-none focus:border-[#1f2de6]"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Paket Layanan */}
                            <div className="space-y-1">
                              <label className="text-xs font-bold text-[#0b0c0e] uppercase">
                                Paket Layanan (Batas Trafik)
                              </label>
                              <select
                                value={detailForm.plan}
                                onChange={(e) => setDetailForm({ ...detailForm, plan: e.target.value })}
                                className="w-full px-3.5 py-2 rounded-lg border border-[#e2e5ea] text-xs font-mono text-[#0b0c0e] focus:outline-none focus:border-[#1f2de6]"
                              >
                                <option value="spark">Spark Biasa (Batas Maksimal 500 Kunjungan)</option>
                                <option value="spark_pro">Spark Pro (Batas Maksimal 5.000 Kunjungan)</option>
                              </select>
                            </div>

                            {/* Role */}
                            <div className="space-y-1">
                              <label className="text-xs font-bold text-[#0b0c0e] uppercase">
                                Role Akses
                              </label>
                              <select
                                value={detailForm.role}
                                onChange={(e) => setDetailForm({ ...detailForm, role: e.target.value })}
                                className="w-full px-3.5 py-2 rounded-lg border border-[#e2e5ea] text-xs font-mono text-[#0b0c0e] focus:outline-none focus:border-[#1f2de6]"
                              >
                                <option value="user">User Panitia</option>
                                <option value="admin">Administrator</option>
                              </select>
                            </div>
                          </div>

                          {/* Reset Password */}
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-[#0b0c0e] uppercase">
                              Reset Password <span className="text-[#8c93a0] font-normal">(kosongkan jika tidak ingin mengubah password)</span>
                            </label>
                            <input
                              type="password"
                              value={detailForm.password || ''}
                              onChange={(e) => setDetailForm({ ...detailForm, password: e.target.value })}
                              placeholder="Ketik password baru minimal 6 karakter..."
                              className="w-full px-3.5 py-2 rounded-lg border border-[#e2e5ea] text-xs font-mono text-[#0b0c0e] focus:outline-none focus:border-[#1f2de6]"
                            />
                          </div>

                          <div className="pt-2 flex justify-end">
                            <button
                              type="submit"
                              disabled={isSavingUserDetail}
                              className="px-5 py-2 rounded-lg bg-[#1f2de6] hover:bg-[#1622b8] disabled:opacity-50 text-white text-xs font-semibold tracking-tight shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                            >
                              <span className="material-symbols-outlined text-[16px]">save</span>
                              <span>{isSavingUserDetail ? 'Menyimpan...' : 'Simpan Data'}</span>
                            </button>
                          </div>
                        </form>
                      </div>

                      {/* Workspaces Owned by this user */}
                      <div className="border border-[#e2e5ea] rounded-xl bg-white overflow-hidden shadow-2xs">
                        <div className="p-4 border-b border-[#e2e5ea] flex items-center justify-between">
                          <h3 className="font-heading text-sm font-bold text-[#0b0c0e]">
                            Daftar Website &amp; Formulir Milik Pengguna Ini
                          </h3>
                          <span className="text-[11px] font-mono text-[#585d6b]">
                            {selectedUserDetail.workspaces.length} website
                          </span>
                        </div>

                        {selectedUserDetail.workspaces.length === 0 ? (
                          <div className="py-12 text-center text-xs text-[#8c93a0]">
                            Pengguna ini belum membuat website atau formulir apa pun.
                          </div>
                        ) : (
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="border-b border-[#e2e5ea] bg-[#f8f9fb] text-[#585d6b] font-mono uppercase text-[10px]">
                                <th className="py-3 px-4">Nama Event &amp; Slug</th>
                                <th className="py-3 px-4">Status</th>
                                <th className="py-3 px-4 text-center">Trafik Kunjungan</th>
                                <th className="py-3 px-4 text-center">Respon Form</th>
                                <th className="py-3 px-4">Terakhir Diperbarui</th>
                                <th className="py-3 px-4 text-right">Aksi</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#e2e5ea]">
                              {selectedUserDetail.workspaces.map((ws) => {
                                const isPublished = ws.status === 'published';
                                return (
                                  <tr key={ws.id} className="hover:bg-[#f8f9fb]/80 transition-colors">
                                    <td className="py-3 px-4">
                                      <div className="font-heading font-bold text-[#0b0c0e]">{ws.name}</div>
                                      <div className="text-[11px] font-mono text-[#1f2de6]">
                                        {ws.slug ? `${ws.slug}.iventra.site` : 'draft-only'}
                                      </div>
                                    </td>
                                    <td className="py-3 px-4">
                                      <span
                                        className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                                          isPublished
                                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                            : 'bg-[#f4f5f8] text-[#585d6b] border-[#e2e5ea]'
                                        }`}
                                      >
                                        {isPublished ? '● Live' : 'Draft'}
                                      </span>
                                    </td>
                                    <td className="py-3 px-4 text-center font-mono font-bold text-[#0b0c0e]">
                                      {ws.visitors_count}
                                    </td>
                                    <td className="py-3 px-4 text-center font-mono text-[#585d6b]">
                                      {ws.submissions_count}
                                    </td>
                                    <td className="py-3 px-4 text-[11px] font-mono text-[#8c93a0]">
                                      {new Date(ws.updated_at || ws.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                      {ws.slug && (
                                        <a
                                          href={`/#event/${ws.slug}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-[#e2e5ea] hover:bg-[#f4f5f8] text-[#1f2de6] font-mono text-xs font-bold"
                                        >
                                          <span>Buka</span>
                                          <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                                        </a>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* VIEW B: MAIN USERS TABLE LIST */
                    <div className="space-y-6 max-w-7xl mx-auto animate-fadeIn">
                      {/* Header Title */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <h1 className="font-heading text-2xl font-extrabold text-[#0b0c0e] tracking-tight">
                            Manajemen User &amp; Kuota Trafik
                          </h1>
                          <p className="text-xs text-[#585d6b] mt-1">
                            Pantau penggunaan trafik setiap akun (Spark Biasa: maks 500 kunjungan, Spark Pro: maks 5.000 kunjungan).
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={loadData}
                            className="p-2 rounded-lg border border-[#e2e5ea] bg-white hover:bg-[#f8f9fb] text-[#585d6b]"
                            title="Segarkan data"
                          >
                            <span className="material-symbols-outlined text-[18px]">sync</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setIsCreateUserModalOpen(true)}
                            className="px-4 py-2 rounded-lg bg-[#1f2de6] hover:bg-[#1622b8] text-white text-xs font-semibold tracking-tight shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            <span className="material-symbols-outlined text-[16px]">add</span>
                            <span>Tambah User Baru</span>
                          </button>
                        </div>
                      </div>

                      {/* Toolbar & Filter */}
                      <div className="p-3.5 rounded-xl bg-white border border-[#e2e5ea] shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
                        {/* Search */}
                        <div className="relative w-full md:w-80">
                          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[16px] text-[#8c93a0]">
                            search
                          </span>
                          <input
                            type="text"
                            value={searchUser}
                            onChange={(e) => setSearchUser(e.target.value)}
                            placeholder="Cari nama atau email pengguna..."
                            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#f8f9fb] border border-[#e2e5ea] text-xs text-[#0b0c0e] focus:bg-white focus:border-[#1f2de6] focus:outline-none"
                          />
                        </div>

                        {/* Filter Tabs */}
                        <div className="flex items-center gap-2 w-full md:w-auto">
                          <div className="flex items-center rounded-lg bg-[#f8f9fb] border border-[#e2e5ea] p-0.5 text-xs font-mono">
                            <button
                              type="button"
                              onClick={() => setFilterUserPlan('all')}
                              className={`px-3 py-1 rounded font-bold transition-all cursor-pointer ${
                                filterUserPlan === 'all' ? 'bg-white text-[#0b0c0e] shadow-2xs' : 'text-[#585d6b]'
                              }`}
                            >
                              Semua ({users.length})
                            </button>
                            <button
                              type="button"
                              onClick={() => setFilterUserPlan('spark')}
                              className={`px-3 py-1 rounded font-bold transition-all cursor-pointer ${
                                filterUserPlan === 'spark' ? 'bg-white text-[#0b0c0e] shadow-2xs' : 'text-[#585d6b]'
                              }`}
                            >
                              Spark Biasa (500)
                            </button>
                            <button
                              type="button"
                              onClick={() => setFilterUserPlan('spark_pro')}
                              className={`px-3 py-1 rounded font-bold transition-all cursor-pointer ${
                                filterUserPlan === 'spark_pro' ? 'bg-white text-[#1f2de6] shadow-2xs' : 'text-[#585d6b]'
                              }`}
                            >
                              Spark Pro (5.000)
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Users Table */}
                      <div className="border border-[#e2e5ea] rounded-xl bg-white overflow-hidden shadow-2xs">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-[#e2e5ea] bg-[#f8f9fb] text-[#585d6b] font-mono uppercase text-[10px]">
                              <th className="py-3 px-4">Pengguna</th>
                              <th className="py-3 px-4">Paket Akun</th>
                              <th className="py-3 px-4 min-w-[200px]">Pemakaian Trafik</th>
                              <th className="py-3 px-4 text-center">Workspaces</th>
                              <th className="py-3 px-4 text-center">Respon Form</th>
                              <th className="py-3 px-4">Bergabung</th>
                              <th className="py-3 px-4 text-right">Aksi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#e2e5ea]">
                            {filteredUsers.map((u) => {
                              const isPro = u.plan === 'spark_pro';
                              const isNearLimit = u.traffic_percent >= 80 && u.traffic_percent < 100;
                              const isOverLimit = u.traffic_percent >= 100;

                              return (
                                <tr key={u.id} className="hover:bg-[#f8f9fb]/80 transition-colors">
                                  {/* User Info */}
                                  <td className="py-3 px-4">
                                    <div className="flex items-center gap-2.5">
                                      <div className="w-8 h-8 rounded-full bg-[#edf2ff] text-[#1f2de6] flex items-center justify-center font-bold text-xs shrink-0">
                                        {u.name.charAt(0).toUpperCase()}
                                      </div>
                                      <div className="min-w-0">
                                        <div className="font-heading font-bold text-[#0b0c0e] truncate">{u.name}</div>
                                        <div className="text-[11px] font-mono text-[#8c93a0] truncate">
                                          {u.email}
                                          {(u.age || u.gender) && (
                                            <span className="text-[#585d6b]"> · {u.age ? `${u.age} thn` : ''} {u.gender ? `(${u.gender})` : ''}</span>
                                          )}
                                        </div>
                                        {(u.onboarding_role || u.onboarding_purpose) && (
                                          <div className="text-[10px] text-[#1f2de6] font-medium truncate mt-0.5">
                                            {u.onboarding_role ? `${u.onboarding_role}` : ''}
                                            {u.onboarding_role && u.onboarding_purpose ? ' • ' : ''}
                                            {u.onboarding_purpose ? `${u.onboarding_purpose}` : ''}
                                          </div>
                                        )}
                                      </div>
                                      {u.role === 'admin' && (
                                        <span className="ml-1 text-[9px] font-mono font-bold uppercase bg-[#0b0c0e] text-white px-1.5 py-0.2 rounded">
                                          Admin
                                        </span>
                                      )}
                                    </div>
                                  </td>

                                  {/* Plan Badge */}
                                  <td className="py-3 px-4">
                                    <span
                                      className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                                        isPro
                                          ? 'bg-[#edf2ff] text-[#1f2de6] border-[#1f2de6]/30'
                                          : 'bg-[#f4f5f8] text-[#585d6b] border-[#e2e5ea]'
                                      }`}
                                    >
                                      {isPro ? 'Spark Pro' : 'Spark Biasa'}
                                    </span>
                                  </td>

                                  {/* Traffic Usage Progress */}
                                  <td className="py-3 px-4">
                                    <div className="space-y-1">
                                      <div className="flex items-center justify-between text-[11px] font-mono">
                                        <span className="font-bold text-[#0b0c0e]">
                                          {u.total_traffic.toLocaleString('id-ID')} / {u.traffic_limit.toLocaleString('id-ID')}
                                        </span>
                                        <span
                                          className={`font-bold ${
                                            isOverLimit ? 'text-red-600' : isNearLimit ? 'text-amber-600' : 'text-emerald-700'
                                          }`}
                                        >
                                          {u.traffic_percent}%
                                        </span>
                                      </div>
                                      <div className="w-full h-2 rounded-full bg-[#e2e5ea] overflow-hidden">
                                        <div
                                          className={`h-full rounded-full transition-all ${
                                            isOverLimit
                                              ? 'bg-red-600'
                                              : isNearLimit
                                              ? 'bg-amber-500'
                                              : 'bg-[#1f2de6]'
                                          }`}
                                          style={{ width: `${Math.min(100, u.traffic_percent)}%` }}
                                        />
                                      </div>
                                    </div>
                                  </td>

                                  {/* Workspaces count */}
                                  <td className="py-3 px-4 text-center font-mono font-bold text-[#0b0c0e]">
                                    {u.workspaces_count}
                                  </td>

                                  {/* Submissions count */}
                                  <td className="py-3 px-4 text-center font-mono text-[#585d6b]">
                                    {u.submissions_count}
                                  </td>

                                  {/* Created date */}
                                  <td className="py-3 px-4 text-[11px] font-mono text-[#8c93a0]">
                                    {new Date(u.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                  </td>

                                  {/* Actions: Replaced Edit with View Button */}
                                  <td className="py-3 px-4 text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => handleViewUser(u)}
                                        className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#edf2ff] hover:bg-[#1f2de6] text-[#1f2de6] hover:text-white font-mono text-xs font-bold transition-all cursor-pointer"
                                        title="Buka Data Lengkap User"
                                      >
                                        <span className="material-symbols-outlined text-[15px]">visibility</span>
                                        <span>View</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => setDeletingUser(u)}
                                        className="p-1 rounded-lg hover:bg-red-50 text-[#8c93a0] hover:text-red-600 transition-colors cursor-pointer"
                                        title="Hapus User"
                                      >
                                        <span className="material-symbols-outlined text-[16px]">delete</span>
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* ─────────────────────────────────────────────────────────────
                  TAB 2: SEMUA WORKSPACE (MONITORING EVENT SELURUH PENGGUNA)
                  ───────────────────────────────────────────────────────────── */}
              {activeTab === 'workspaces' && (
                <div className="space-y-6 max-w-7xl mx-auto animate-fadeIn">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h1 className="font-heading text-2xl font-extrabold text-[#0b0c0e] tracking-tight">
                        Monitoring Semua Workspace
                      </h1>
                      <p className="text-xs text-[#585d6b] mt-1">
                        Daftar lengkap seluruh website formulir yang dibuat oleh user beserta status penerbitannya.
                      </p>
                    </div>
                  </div>

                  {/* Toolbar */}
                  <div className="p-3.5 rounded-xl bg-white border border-[#e2e5ea] shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
                    <div className="relative w-full md:w-80">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[16px] text-[#8c93a0]">
                        search
                      </span>
                      <input
                        type="text"
                        value={searchWorkspace}
                        onChange={(e) => setSearchWorkspace(e.target.value)}
                        placeholder="Cari judul event, slug, atau pemilik..."
                        className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#f8f9fb] border border-[#e2e5ea] text-xs text-[#0b0c0e] focus:bg-white focus:border-[#1f2de6] focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={filterWsStatus}
                        onChange={(e) => setFilterWsStatus(e.target.value)}
                        className="px-3 py-1.5 rounded-lg bg-[#f8f9fb] border border-[#e2e5ea] text-xs font-mono text-[#0b0c0e] focus:outline-none cursor-pointer"
                      >
                        <option value="all">Semua Status</option>
                        <option value="published">Published (Live)</option>
                        <option value="draft">Draft</option>
                      </select>
                    </div>
                  </div>

                  {/* Workspace Table */}
                  <div className="border border-[#e2e5ea] rounded-xl bg-white overflow-hidden shadow-2xs">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-[#e2e5ea] bg-[#f8f9fb] text-[#585d6b] font-mono uppercase text-[10px]">
                          <th className="py-3 px-4">Event &amp; Slug</th>
                          <th className="py-3 px-4">Pemilik (User)</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-center">Trafik Kunjungan</th>
                          <th className="py-3 px-4 text-center">Respon Form</th>
                          <th className="py-3 px-4">Diperbarui</th>
                          <th className="py-3 px-4 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#e2e5ea]">
                        {filteredWorkspaces.map((ws) => {
                          const isPublished = ws.status === 'published';
                          return (
                            <tr key={ws.id} className="hover:bg-[#f8f9fb]/80 transition-colors">
                              <td className="py-3 px-4">
                                <div>
                                  <div className="font-heading font-bold text-[#0b0c0e]">{ws.name}</div>
                                  <div className="text-[11px] font-mono text-[#1f2de6]">
                                    {ws.slug ? `${ws.slug}.iventra.site` : 'draft-only'}
                                  </div>
                                </div>
                              </td>

                              <td className="py-3 px-4">
                                <div className="text-[#0b0c0e] font-semibold">{ws.owner_name}</div>
                                <div className="text-[10px] font-mono text-[#8c93a0]">{ws.owner_email}</div>
                              </td>

                              <td className="py-3 px-4">
                                <span
                                  className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                                    isPublished
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                      : 'bg-[#f4f5f8] text-[#585d6b] border-[#e2e5ea]'
                                  }`}
                                >
                                  {isPublished ? '● Live' : 'Draft'}
                                </span>
                              </td>

                              <td className="py-3 px-4 text-center font-mono font-bold text-[#0b0c0e]">
                                {ws.visitors_count.toLocaleString('id-ID')}
                              </td>

                              <td className="py-3 px-4 text-center font-mono text-[#585d6b]">
                                {ws.submissions_count}
                              </td>

                              <td className="py-3 px-4 text-[11px] font-mono text-[#8c93a0]">
                                {new Date(ws.updated_at || ws.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                              </td>

                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  {ws.slug && (
                                    <a
                                      href={`/#event/${ws.slug}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="p-1.5 rounded-lg hover:bg-[#edf2ff] text-[#1f2de6]"
                                      title="Buka Website Event"
                                    >
                                      <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                                    </a>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => setEditingWs(ws)}
                                    className="p-1.5 rounded-lg hover:bg-[#edf2ff] text-[#1f2de6]"
                                    title="Edit Workspace"
                                  >
                                    <span className="material-symbols-outlined text-[16px]">edit</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDeletingWs(ws)}
                                    className="p-1.5 rounded-lg hover:bg-red-50 text-[#8c93a0] hover:text-red-600"
                                    title="Hapus Workspace"
                                  >
                                    <span className="material-symbols-outlined text-[16px]">delete</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ─────────────────────────────────────────────────────────────
                  TAB: MANAJEMEN TEMPLATE WEBSITE EVENT
                  ───────────────────────────────────────────────────────────── */}
              {activeTab === 'templates' && (
                <div className="space-y-6 max-w-7xl mx-auto animate-fadeIn">
                  {/* Header Title & CTA Button */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h1 className="font-heading text-2xl font-extrabold text-[#0b0c0e] tracking-tight">
                        Manajemen Template Website Event
                      </h1>
                      <p className="text-xs text-[#585d6b] mt-0.5">
                        Kelola katalog template siap pakai yang tampil di dashboard panitia. Tambah template baru langsung ke sistem.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setTemplateForm({
                          id: '',
                          name: '',
                          category: 'Seminar & Konferensi',
                          badge: 'Paling Populer',
                          description: '',
                          primaryColor: '#1f2de6',
                          accentColor: '#3b47dc',
                          headline: '',
                          tagline: '',
                          dateText: '',
                          locationText: '',
                          bannerUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80'
                        });
                        setModalError('');
                        setIsCreateTemplateModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1f2de6] hover:bg-[#1622b8] text-white text-xs font-semibold shadow-xs transition-all active:scale-[0.98] cursor-pointer shrink-0"
                    >
                      <span className="material-symbols-outlined text-[16px]">add_circle</span>
                      <span>+ Tambah Template Baru</span>
                    </button>
                  </div>

                  {/* Filter & Search Bar */}
                  <div className="p-4 rounded-xl bg-white border border-[#e2e5ea] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                    <div className="flex-1 relative">
                      <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#8c93a0] text-[18px]">
                        search
                      </span>
                      <input
                        type="text"
                        placeholder="Cari nama template atau kategori..."
                        value={searchTemplate}
                        onChange={(e) => setSearchTemplate(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 rounded-lg border border-[#e2e5ea] text-xs text-[#0b0c0e] placeholder-[#8c93a0] focus:outline-none focus:border-[#1f2de6]"
                      />
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <select
                        value={filterTemplateCategory}
                        onChange={(e) => setFilterTemplateCategory(e.target.value)}
                        className="px-3 py-2 rounded-lg border border-[#e2e5ea] bg-white text-xs text-[#0b0c0e] focus:outline-none focus:border-[#1f2de6]"
                      >
                        <option value="all">Semua Kategori</option>
                        <option value="Seminar & Konferensi">Seminar & Konferensi</option>
                        <option value="Kompetisi Mahasiswa">Kompetisi Mahasiswa</option>
                        <option value="Dies Natalis & Pentas Seni">Festival & Seni</option>
                        <option value="Workshop & Pelatihan">Workshop & Pelatihan</option>
                        <option value="Bursa Kerja & Karir">Bursa Kerja & Karir</option>
                        <option value="Sosial & Volunteer">Sosial & Volunteer</option>
                      </select>
                    </div>
                  </div>

                  {/* Templates Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {templatesList
                      .filter((t) => {
                        if (searchTemplate) {
                          const query = searchTemplate.toLowerCase();
                          if (!t.name.toLowerCase().includes(query) && !t.category.toLowerCase().includes(query)) {
                            return false;
                          }
                        }
                        if (filterTemplateCategory !== 'all' && t.category !== filterTemplateCategory) {
                          return false;
                        }
                        return true;
                      })
                      .map((tmpl) => {
                        const mockWorkspace = {
                          id: `preview-${tmpl.id}`,
                          owner_id: 'admin',
                          name: tmpl.defaultConfig?.eventName || tmpl.name,
                          slug: tmpl.id,
                          description: tmpl.description || null,
                          service_type: 'spark' as const,
                          template_id: tmpl.id,
                          status: 'draft' as const,
                          draft_config: JSON.stringify(tmpl.defaultConfig || {}),
                          published_config: null,
                          created_at: '',
                          updated_at: ''
                        };

                        return (
                          <div
                            key={tmpl.id}
                            className="flex flex-col rounded-xl border border-[#e2e5ea] bg-white hover:border-[#1f2de6] hover:shadow-md transition-all p-3.5 space-y-3"
                          >
                            {/* Browser Mockup Box */}
                            <div className="relative h-[160px] w-full rounded-lg overflow-hidden bg-[#f8f9fb] border border-[#e2e5ea] flex flex-col">
                              {/* Top Bar */}
                              <div className="h-5 bg-[#f4f5f8] border-b border-[#e2e5ea] px-2 flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-1">
                                  <div className="w-1.5 h-1.5 rounded-full bg-[#cbd5e1]" />
                                  <div className="w-1.5 h-1.5 rounded-full bg-[#cbd5e1]" />
                                  <div className="w-1.5 h-1.5 rounded-full bg-[#cbd5e1]" />
                                </div>
                                <span className="text-[9px] font-mono text-[#8c93a0] truncate max-w-[120px]">
                                  {tmpl.id}
                                </span>
                              </div>

                              {/* Preview */}
                              <div className="flex-1 w-full relative overflow-hidden bg-white">
                                <RealtimeWorkspaceThumbnail
                                  workspace={mockWorkspace}
                                  height={140}
                                  className="w-full h-full border-none"
                                />
                              </div>
                            </div>

                            {/* Template Info */}
                            <div className="space-y-1.5 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#edf2ff] text-[#1f2de6] truncate">
                                  {tmpl.category}
                                </span>
                                {tmpl.badge && (
                                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#f4f5f8] border border-[#e2e5ea] text-[#585d6b] truncate">
                                    {tmpl.badge}
                                  </span>
                                )}
                              </div>
                              <h3 className="font-heading text-sm font-bold text-[#0b0c0e] truncate">
                                {tmpl.name}
                              </h3>
                              {tmpl.description && (
                                <p className="text-xs text-[#585d6b] line-clamp-2 leading-relaxed">
                                  {tmpl.description}
                                </p>
                              )}
                            </div>

                            {/* Footer Actions */}
                            <div className="pt-2 border-t border-[#e2e5ea] flex items-center justify-between">
                              <span className="text-[10px] font-mono text-[#8c93a0]">
                                ID: {tmpl.id}
                              </span>
                              <button
                                type="button"
                                onClick={() => setDeletingTemplate(tmpl)}
                                className="p-1 rounded text-[#8c93a0] hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                title="Hapus Template"
                              >
                                <span className="material-symbols-outlined text-[16px]">delete</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* ─────────────────────────────────────────────────────────────
                  TAB 3: RINGKASAN METRIK NYATA
                  ───────────────────────────────────────────────────────────── */}
              {activeTab === 'overview' && (
                <div className="space-y-6 max-w-7xl mx-auto animate-fadeIn">
                  <h1 className="font-heading text-2xl font-extrabold text-[#0b0c0e] tracking-tight">
                    Ringkasan Sistem &amp; Database
                  </h1>

                  {/* 4 Metric Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-5 rounded-xl bg-white border border-[#e2e5ea] shadow-2xs">
                      <span className="text-xs font-mono font-bold text-[#585d6b] uppercase">Total Pengguna</span>
                      <div className="mt-3 flex items-baseline gap-2">
                        <span className="font-heading text-3xl font-black text-[#0b0c0e]">{stats?.totalUsers || 0}</span>
                        <span className="text-[11px] font-mono text-[#1f2de6] bg-[#edf2ff] px-2 py-0.5 rounded font-bold">
                          {stats?.proUsers || 0} Pro • {stats?.freeUsers || 0} Biasa
                        </span>
                      </div>
                    </div>

                    <div className="p-5 rounded-xl bg-white border border-[#e2e5ea] shadow-2xs">
                      <span className="text-xs font-mono font-bold text-[#585d6b] uppercase">Total Workspace</span>
                      <div className="mt-3 flex items-baseline gap-2">
                        <span className="font-heading text-3xl font-black text-[#0b0c0e]">{stats?.totalWorkspaces || 0}</span>
                        <span className="text-[11px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded font-bold">
                          {stats?.publishedWorkspaces || 0} Live
                        </span>
                      </div>
                    </div>

                    <div className="p-5 rounded-xl bg-white border border-[#e2e5ea] shadow-2xs">
                      <span className="text-xs font-mono font-bold text-[#585d6b] uppercase">Total Trafik Pengunjung</span>
                      <div className="mt-3 flex items-baseline gap-2">
                        <span className="font-heading text-3xl font-black text-[#1f2de6]">
                          {(stats?.totalTraffic || 0).toLocaleString('id-ID')}
                        </span>
                        <span className="text-[11px] font-mono text-[#585d6b]">kunjungan</span>
                      </div>
                    </div>

                    <div className="p-5 rounded-xl bg-white border border-[#e2e5ea] shadow-2xs">
                      <span className="text-xs font-mono font-bold text-[#585d6b] uppercase">Total Respon Formulir</span>
                      <div className="mt-3 flex items-baseline gap-2">
                        <span className="font-heading text-3xl font-black text-[#0b0c0e]">{stats?.totalSubmissions || 0}</span>
                        <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">
                          terkumpul
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Top Active Users by Traffic */}
                  <div className="p-6 rounded-xl bg-white border border-[#e2e5ea] shadow-2xs">
                    <h3 className="font-heading text-base font-extrabold text-[#0b0c0e] mb-4">
                      Pengguna Teraktif Berdasarkan Trafik
                    </h3>
                    <div className="space-y-3">
                      {users.slice(0, 5).map((u) => (
                        <div key={u.id} className="p-3 rounded-lg border border-[#e2e5ea] flex items-center justify-between gap-4">
                          <div className="min-w-0">
                            <span className="font-heading text-sm font-bold text-[#0b0c0e]">{u.name}</span>
                            <span className="text-xs font-mono text-[#8c93a0] ml-2">({u.email})</span>
                          </div>
                          <div className="w-48">
                            <div className="flex justify-between text-[10px] font-mono mb-1">
                              <span>{u.total_traffic} / {u.traffic_limit}</span>
                              <strong className="text-[#1f2de6]">{u.traffic_percent}%</strong>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-[#e2e5ea] overflow-hidden">
                              <div className="h-full bg-[#1f2de6] rounded-full" style={{ width: `${u.traffic_percent}%` }} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ─────────────────────────────────────────────────────────────
                  TAB 4: LEADS KONSULTASI
                  ───────────────────────────────────────────────────────────── */}
              {activeTab === 'leads' && (
                <div className="space-y-6 max-w-7xl mx-auto animate-fadeIn">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h1 className="font-heading text-2xl font-extrabold text-[#0b0c0e] tracking-tight">
                        Leads &amp; Permintaan Konsultasi
                      </h1>
                      <p className="text-xs text-[#585d6b] mt-1">
                        Formulir konsultasi yang masuk dari calon panitia di landing page.
                      </p>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="border border-[#e2e5ea] rounded-xl bg-white overflow-hidden shadow-2xs">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-[#e2e5ea] bg-[#f8f9fb] text-[#585d6b] font-mono uppercase text-[10px]">
                          <th className="py-3 px-4">Nama &amp; Instansi</th>
                          <th className="py-3 px-4">Nama Acara</th>
                          <th className="py-3 px-4">Paket &amp; Estimasi</th>
                          <th className="py-3 px-4">Kontak WhatsApp</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#e2e5ea]">
                        {filteredLeads.map((l) => (
                          <tr key={l.id} className="hover:bg-[#f8f9fb]/80 transition-colors">
                            <td className="py-3 px-4">
                              <div className="font-bold text-[#0b0c0e]">{l.name}</div>
                              <div className="text-[11px] font-mono text-[#8c93a0]">{l.campus}</div>
                            </td>
                            <td className="py-3 px-4 text-[#0b0c0e] font-medium">{l.eventName}</td>
                            <td className="py-3 px-4">
                              <span className="font-mono text-[10px] font-bold uppercase bg-[#edf2ff] text-[#1f2de6] px-1.5 py-0.5 rounded">
                                {l.planId}
                              </span>
                              <span className="text-[10px] font-mono text-[#8c93a0] ml-1.5">
                                ~{l.estimatedParticipants} org
                              </span>
                            </td>
                            <td className="py-3 px-4 font-mono text-xs">
                              <a
                                href={`https://wa.me/${l.contactNumber.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-emerald-700 hover:underline flex items-center gap-1 font-semibold"
                              >
                                <span>{l.contactNumber}</span>
                                <span className="material-symbols-outlined text-[13px]">chat</span>
                              </a>
                            </td>
                            <td className="py-3 px-4">
                              <select
                                value={l.status}
                                onChange={(e) => handleUpdateLeadStatus(l.id, e.target.value)}
                                className="px-2 py-1 rounded border border-[#e2e5ea] text-xs font-mono font-bold cursor-pointer"
                              >
                                <option value="Baru">Baru</option>
                                <option value="Dihubungi">Dihubungi</option>
                                <option value="Deal">Deal</option>
                                <option value="Batal">Batal</option>
                              </select>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                type="button"
                                onClick={() => handleDeleteLead(l.id)}
                                className="p-1.5 rounded-lg hover:bg-red-50 text-[#8c93a0] hover:text-red-600"
                              >
                                <span className="material-symbols-outlined text-[16px]">delete</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ─────────────────────────────────────────────────────────────
                  TAB 5: PENGATURAN TARIF
                  ───────────────────────────────────────────────────────────── */}
              {activeTab === 'settings' && (
                <div className="space-y-6 max-w-3xl mx-auto animate-fadeIn">
                  <h1 className="font-heading text-2xl font-extrabold text-[#0b0c0e] tracking-tight">
                    Pengaturan Tarif &amp; Batas Kuota
                  </h1>

                  <div className="p-6 rounded-xl bg-white border border-[#e2e5ea] shadow-2xs">
                    <form onSubmit={handleSaveSettings} className="space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-[#0b0c0e] uppercase">
                            Harga Paket Spark Biasa
                          </label>
                          <input
                            type="text"
                            value={settings.sparkPrice}
                            onChange={(e) => setSettings({ ...settings, sparkPrice: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border border-[#e2e5ea] text-xs font-mono"
                          />
                          <p className="text-[10px] font-mono text-[#8c93a0]">Batas trafik: 500 kunjungan</p>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-[#0b0c0e] uppercase">
                            Harga Paket Spark Pro
                          </label>
                          <input
                            type="text"
                            value={settings.flowPrice}
                            onChange={(e) => setSettings({ ...settings, flowPrice: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border border-[#e2e5ea] text-xs font-mono"
                          />
                          <p className="text-[10px] font-mono text-[#8c93a0]">Batas trafik: 5.000 kunjungan</p>
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          type="submit"
                          disabled={isSavingSettings}
                          className="px-5 py-2.5 rounded-lg bg-[#1f2de6] hover:bg-[#1622b8] text-white text-xs font-semibold cursor-pointer"
                        >
                          {isSavingSettings ? 'Menyimpan...' : 'Simpan Pengaturan'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* ─── MODAL: TAMBAH USER BARU ───────────────────────────────────────── */}
      {isCreateUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-[#e2e5ea] p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#e2e5ea]">
              <h3 className="font-heading text-base font-bold text-[#0b0c0e]">Tambah Pengguna Baru</h3>
              <button
                type="button"
                onClick={() => setIsCreateUserModalOpen(false)}
                className="text-[#8c93a0] hover:text-[#0b0c0e]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#0b0c0e] uppercase">Nama Lengkap</label>
                <input
                  name="userName"
                  required
                  placeholder="Nama Panitia"
                  className="w-full px-3 py-2 rounded-lg border border-[#e2e5ea] text-xs text-[#0b0c0e] focus:outline-none focus:border-[#1f2de6]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#0b0c0e] uppercase">Email</label>
                <input
                  type="email"
                  name="userEmail"
                  required
                  placeholder="panitia@kampus.ac.id"
                  className="w-full px-3 py-2 rounded-lg border border-[#e2e5ea] text-xs font-mono text-[#0b0c0e] focus:outline-none focus:border-[#1f2de6]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#0b0c0e] uppercase">Password</label>
                <input
                  type="password"
                  name="userPassword"
                  required
                  placeholder="Minimal 6 karakter"
                  className="w-full px-3 py-2 rounded-lg border border-[#e2e5ea] text-xs font-mono text-[#0b0c0e] focus:outline-none focus:border-[#1f2de6]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#0b0c0e] uppercase">Paket Layanan</label>
                  <select
                    name="userPlan"
                    defaultValue="spark"
                    className="w-full px-3 py-2 rounded-lg border border-[#e2e5ea] text-xs font-mono text-[#0b0c0e] focus:outline-none"
                  >
                    <option value="spark">Spark Biasa (500 visit)</option>
                    <option value="spark_pro">Spark Pro (5.000 visit)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#0b0c0e] uppercase">Hak Akses Role</label>
                  <select
                    name="userRole"
                    defaultValue="user"
                    className="w-full px-3 py-2 rounded-lg border border-[#e2e5ea] text-xs font-mono text-[#0b0c0e] focus:outline-none"
                  >
                    <option value="user">User Biasa</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>

              {modalError && <p className="text-xs font-mono text-red-600">{modalError}</p>}

              <div className="flex justify-end gap-2 pt-2 border-t border-[#e2e5ea]">
                <button
                  type="button"
                  onClick={() => setIsCreateUserModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-[#e2e5ea] text-xs font-mono"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded-lg bg-[#1f2de6] hover:bg-[#1622b8] text-white text-xs font-semibold cursor-pointer"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Tambah User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: HAPUS USER ──────────────────────────────────────────────── */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-sm bg-white rounded-xl shadow-2xl border border-[#e2e5ea] p-6 space-y-4">
            <h3 className="font-heading text-base font-bold text-red-600">Hapus Pengguna?</h3>
            <p className="text-xs text-[#585d6b] leading-relaxed">
              Anda akan menghapus user <strong>{deletingUser.name}</strong> ({deletingUser.email}). Seluruh workspace dan formulir miliknya akan ikut terhapus secara permanen.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="px-3.5 py-1.5 rounded-lg border border-[#e2e5ea] text-xs font-mono"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                disabled={isSubmitting}
                className="px-4 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold cursor-pointer"
              >
                {isSubmitting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: EDIT WORKSPACE ──────────────────────────────────────────── */}
      {editingWs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-[#e2e5ea] p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#e2e5ea]">
              <h3 className="font-heading text-base font-bold text-[#0b0c0e]">Edit Workspace Event</h3>
              <button
                type="button"
                onClick={() => setEditingWs(null)}
                className="text-[#8c93a0] hover:text-[#0b0c0e]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateWorkspace} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#0b0c0e] uppercase">Nama Acara</label>
                <input
                  name="wsName"
                  defaultValue={editingWs.name}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-[#e2e5ea] text-xs text-[#0b0c0e] focus:outline-none focus:border-[#1f2de6]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#0b0c0e] uppercase">Slug Domain (.iventra.site)</label>
                <input
                  name="wsSlug"
                  defaultValue={editingWs.slug || ''}
                  className="w-full px-3 py-2 rounded-lg border border-[#e2e5ea] text-xs font-mono text-[#0b0c0e] focus:outline-none focus:border-[#1f2de6]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#0b0c0e] uppercase">Status</label>
                  <select
                    name="wsStatus"
                    defaultValue={editingWs.status}
                    className="w-full px-3 py-2 rounded-lg border border-[#e2e5ea] text-xs font-mono text-[#0b0c0e] focus:outline-none"
                  >
                    <option value="published">Published (Live)</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#0b0c0e] uppercase">Tipe Paket</label>
                  <select
                    name="wsService"
                    defaultValue={editingWs.service_type}
                    className="w-full px-3 py-2 rounded-lg border border-[#e2e5ea] text-xs font-mono text-[#0b0c0e] focus:outline-none"
                  >
                    <option value="spark">Spark Biasa</option>
                    <option value="spark_pro">Spark Pro</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#0b0c0e] uppercase">Trafik Kunjungan (Visitors)</label>
                <input
                  type="number"
                  name="wsVisitors"
                  defaultValue={editingWs.visitors_count}
                  className="w-full px-3 py-2 rounded-lg border border-[#e2e5ea] text-xs font-mono text-[#0b0c0e] focus:outline-none focus:border-[#1f2de6]"
                />
              </div>

              {modalError && <p className="text-xs font-mono text-red-600">{modalError}</p>}

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
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded-lg bg-[#1f2de6] hover:bg-[#1622b8] text-white text-xs font-semibold cursor-pointer"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: HAPUS WORKSPACE ─────────────────────────────────────────── */}
      {deletingWs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-sm bg-white rounded-xl shadow-2xl border border-[#e2e5ea] p-6 space-y-4">
            <h3 className="font-heading text-base font-bold text-red-600">Hapus Workspace?</h3>
            <p className="text-xs text-[#585d6b] leading-relaxed">
              Anda yakin ingin menghapus workspace <strong>{deletingWs.name}</strong> milik <strong>{deletingWs.owner_name}</strong>?
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
                onClick={handleDeleteWorkspace}
                disabled={isSubmitting}
                className="px-4 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold cursor-pointer"
              >
                {isSubmitting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: TAMBAH TEMPLATE BARU ────────────────────────────────────── */}
      {isCreateTemplateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-[#e2e5ea] p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#e2e5ea]">
              <div>
                <h3 className="font-heading text-base font-bold text-[#0b0c0e]">Tambah Template Baru</h3>
                <p className="text-xs text-[#585d6b]">Buat template siap pakai baru untuk seluruh pengguna Iventra.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateTemplateModalOpen(false)}
                className="w-7 h-7 rounded-lg text-[#8c93a0] hover:text-[#0b0c0e] hover:bg-[#f4f5f8] flex items-center justify-center text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTemplate} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#0b0c0e]">
                  Nama Template <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: International Medical Conference 2026"
                  value={templateForm.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setTemplateForm((prev) => ({
                      ...prev,
                      name,
                      headline: prev.headline || name,
                      id: prev.id || name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')
                    }));
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-[#e2e5ea] text-xs text-[#0b0c0e] focus:outline-none focus:border-[#1f2de6]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#0b0c0e]">Kategori Event</label>
                  <select
                    value={templateForm.category}
                    onChange={(e) => setTemplateForm((prev) => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-[#e2e5ea] text-xs text-[#0b0c0e] bg-white focus:outline-none focus:border-[#1f2de6]"
                  >
                    <option value="Seminar & Konferensi">Seminar & Konferensi</option>
                    <option value="Kompetisi Mahasiswa">Kompetisi Mahasiswa</option>
                    <option value="Dies Natalis & Pentas Seni">Festival & Seni</option>
                    <option value="Workshop & Pelatihan">Workshop & Pelatihan</option>
                    <option value="Bursa Kerja & Karir">Bursa Kerja & Karir</option>
                    <option value="Sosial & Volunteer">Sosial & Volunteer</option>
                    <option value="Umum & Mandiri">Umum & Mandiri</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#0b0c0e]">Badge Label</label>
                  <input
                    type="text"
                    placeholder="Contoh: Paling Populer / Lab"
                    value={templateForm.badge}
                    onChange={(e) => setTemplateForm((prev) => ({ ...prev, badge: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-[#e2e5ea] text-xs text-[#0b0c0e] focus:outline-none focus:border-[#1f2de6]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#0b0c0e]">Warna Utama (Primary)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={templateForm.primaryColor}
                      onChange={(e) => setTemplateForm((prev) => ({ ...prev, primaryColor: e.target.value }))}
                      className="w-8 h-8 rounded border border-[#e2e5ea] cursor-pointer"
                    />
                    <input
                      type="text"
                      value={templateForm.primaryColor}
                      onChange={(e) => setTemplateForm((prev) => ({ ...prev, primaryColor: e.target.value }))}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-[#e2e5ea] text-xs font-mono text-[#0b0c0e] focus:outline-none focus:border-[#1f2de6]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#0b0c0e]">Warna Aksen</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={templateForm.accentColor}
                      onChange={(e) => setTemplateForm((prev) => ({ ...prev, accentColor: e.target.value }))}
                      className="w-8 h-8 rounded border border-[#e2e5ea] cursor-pointer"
                    />
                    <input
                      type="text"
                      value={templateForm.accentColor}
                      onChange={(e) => setTemplateForm((prev) => ({ ...prev, accentColor: e.target.value }))}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-[#e2e5ea] text-xs font-mono text-[#0b0c0e] focus:outline-none focus:border-[#1f2de6]"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#0b0c0e]">Headline Acara</label>
                <input
                  type="text"
                  placeholder="Judul utama hero section"
                  value={templateForm.headline}
                  onChange={(e) => setTemplateForm((prev) => ({ ...prev, headline: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-[#e2e5ea] text-xs text-[#0b0c0e] focus:outline-none focus:border-[#1f2de6]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#0b0c0e]">Tagline Acara</label>
                <input
                  type="text"
                  placeholder="Slogan atau subjudul acara"
                  value={templateForm.tagline}
                  onChange={(e) => setTemplateForm((prev) => ({ ...prev, tagline: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-[#e2e5ea] text-xs text-[#0b0c0e] focus:outline-none focus:border-[#1f2de6]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#0b0c0e]">Jadwal Pelaksanaan</label>
                  <input
                    type="text"
                    placeholder="Contoh: Sabtu, 28 Nov 2026"
                    value={templateForm.dateText}
                    onChange={(e) => setTemplateForm((prev) => ({ ...prev, dateText: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-[#e2e5ea] text-xs text-[#0b0c0e] focus:outline-none focus:border-[#1f2de6]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#0b0c0e]">Lokasi / Tempat</label>
                  <input
                    type="text"
                    placeholder="Contoh: Gedung Rektorat / Zoom"
                    value={templateForm.locationText}
                    onChange={(e) => setTemplateForm((prev) => ({ ...prev, locationText: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-[#e2e5ea] text-xs text-[#0b0c0e] focus:outline-none focus:border-[#1f2de6]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#0b0c0e]">Deskripsi Singkat</label>
                <textarea
                  rows={2}
                  placeholder="Penjelasan ringkas perihal format acara..."
                  value={templateForm.description}
                  onChange={(e) => setTemplateForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-[#e2e5ea] text-xs text-[#0b0c0e] focus:outline-none focus:border-[#1f2de6] resize-none"
                />
              </div>

              {modalError && <p className="text-xs font-mono text-red-600">{modalError}</p>}

              <div className="flex justify-end gap-2 pt-2 border-t border-[#e2e5ea]">
                <button
                  type="button"
                  onClick={() => setIsCreateTemplateModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-[#e2e5ea] text-xs font-mono text-[#585d6b] hover:bg-[#f4f5f8]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingTemplate}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#1f2de6] hover:bg-[#1622b8] text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
                >
                  {isSavingTemplate ? (
                    <>
                      <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Simpan Template</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: HAPUS TEMPLATE ──────────────────────────────────────────── */}
      {deletingTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-sm bg-white rounded-xl shadow-2xl border border-[#e2e5ea] p-6 space-y-4">
            <h3 className="font-heading text-base font-bold text-red-600">Hapus Template?</h3>
            <p className="text-xs text-[#585d6b] leading-relaxed">
              Anda yakin ingin menghapus template <strong>{deletingTemplate.name}</strong> ({deletingTemplate.id})? Template tidak akan lagi muncul di katalog panitia.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingTemplate(null)}
                className="px-3.5 py-1.5 rounded-lg border border-[#e2e5ea] text-xs font-mono"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleDeleteTemplate(deletingTemplate)}
                className="px-4 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
