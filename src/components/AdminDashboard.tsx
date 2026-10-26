import { useState, useEffect } from 'react';
import Logo from './Logo.tsx';

interface TrackStep {
  id: number;
  title: string;
  desc: string;
  status: 'completed' | 'current' | 'upcoming';
  dateCompleted?: string;
}

export interface ProjectItem {
  id: string;
  eventName: string;
  organization: string;
  institutionName?: string;
  logoUrl?: string;
  websiteUrl?: string;
  screenshotUrl?: string;
  packageType: string;
  statusBadge: string;
  currentStepIndex: number;
  registeredCount: number;
  targetCount: number;
  whatsappRemindersSent: number;
  certificatesReady: boolean;
  steps: TrackStep[];
  updatedAt: string;
  createdAt?: string;
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

interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  totalLeads: number;
  newLeads: number;
  totalRegistered: number;
  totalTarget: number;
  totalWaSent: number;
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
  onPreviewProject,
  onSettingsUpdated
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'leads' | 'settings'>('projects');
  const [projectViewMode, setProjectViewMode] = useState<'grid' | 'table'>('grid');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [leads, setLeads] = useState<ConsultationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchProject, setSearchProject] = useState('');
  const [filterProjectStatus, setFilterProjectStatus] = useState<string>('all');
  const [searchLead, setSearchLead] = useState('');
  const [filterLeadStatus, setFilterLeadStatus] = useState<string>('all');

  // Site Settings state
  const [settings, setSettings] = useState<SiteSettings>({
    sparkPrice: 'Rp 150rb - 300rb',
    sparkPriceNote: '/ event',
    flowPrice: 'Mulai Rp 500.000',
    flowPriceNote: '/ event',
    botPrice: 'Rp 70.000',
    botPriceNote: '/ event',
    totalProjectsHandled: '120+',
    totalActiveUsers: '15.000+'
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Modal states for Create/Edit Project
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectItem | null>(null);
  const [formData, setFormData] = useState<Partial<ProjectItem>>({
    id: '',
    eventName: '',
    organization: '',
    institutionName: '',
    logoUrl: '',
    websiteUrl: '',
    screenshotUrl: '',
    packageType: 'Flow (Multi-Stage Competition)',
    statusBadge: 'Konsultasi & Setup',
    currentStepIndex: 1,
    registeredCount: 0,
    targetCount: 500,
    whatsappRemindersSent: 0,
    certificatesReady: false
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Alur / Tracker Preview Modal inside Admin
  const [previewAlurProject, setPreviewAlurProject] = useState<ProjectItem | null>(null);

  // Screenshot Fullview Lightbox Modal
  const [previewScreenshot, setPreviewScreenshot] = useState<{
    url: string;
    title: string;
    instansi?: string;
    link?: string;
  } | null>(null);

  // Custom In-App Delete Confirmation Modal
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'project' | 'lead';
    id: string | number;
    title: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Notification toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [resStats, resProjects, resLeads, resSettings] = await Promise.all([
        fetch('/api/stats').then((r) => r.json()),
        fetch('/api/projects').then((r) => r.json()),
        fetch('/api/consultations').then((r) => r.json()),
        fetch('/api/settings').then((r) => r.json())
      ]);

      setStats(resStats);
      setProjects(Array.isArray(resProjects) ? resProjects : []);
      setLeads(Array.isArray(resLeads) ? resLeads : []);
      if (resSettings && typeof resSettings === 'object') {
        setSettings((prev) => ({ ...prev, ...resSettings }));
      }
    } catch (err) {
      console.error('Error loading admin data:', err);
      showToast('Gagal memuat data dari server SQLite.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle open project modal (Create new or Edit existing)
  const handleOpenCreateModal = (prefill?: Partial<ProjectItem>) => {
    setEditingProject(null);
    const year = new Date().getFullYear();
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    setFormData({
      id: prefill?.id || `IVN-${year}-${randomSuffix}`,
      eventName: prefill?.eventName || '',
      organization: prefill?.organization || '',
      institutionName: prefill?.institutionName || prefill?.organization || '',
      logoUrl:
        prefill?.logoUrl ||
        'https://images.unsplash.com/photo-1592280771190-3e2e4d571952?w=120&auto=format&fit=crop&q=80',
      websiteUrl: prefill?.websiteUrl || 'https://iventra.id/event',
      screenshotUrl:
        prefill?.screenshotUrl ||
        'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80',
      packageType: prefill?.packageType || 'Flow (Multi-Stage Competition)',
      statusBadge: prefill?.statusBadge || 'Konsultasi & Setup',
      currentStepIndex: prefill?.currentStepIndex || 1,
      registeredCount: prefill?.registeredCount || 0,
      targetCount: prefill?.targetCount || 500,
      whatsappRemindersSent: prefill?.whatsappRemindersSent || 0,
      certificatesReady: prefill?.certificatesReady || false
    });
    setFormError('');
    setIsProjectModalOpen(true);
  };

  const handleOpenEditModal = (project: ProjectItem) => {
    setEditingProject(project);
    setFormData({
      ...project,
      institutionName: project.institutionName || project.organization || '',
      logoUrl: project.logoUrl || '',
      websiteUrl: project.websiteUrl || '',
      screenshotUrl: project.screenshotUrl || ''
    });
    setFormError('');
    setIsProjectModalOpen(true);
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.id?.trim()) {
      setFormError('Kode project wajib diisi');
      return;
    }
    if (!formData.eventName?.trim()) {
      setFormError('Nama event wajib diisi');
      return;
    }
    if (!formData.organization?.trim()) {
      setFormError('Nama organisasi/BEM wajib diisi');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      const steps: TrackStep[] = editingProject?.steps || [
        { id: 1, title: 'Konsultasi & Kebutuhan', desc: 'Brief alur seleksi & form pendaftaran', status: formData.currentStepIndex! >= 1 ? 'completed' : 'upcoming' },
        { id: 2, title: 'Setup & Custom Branding', desc: 'Deploy domain & integrasi logo institusi', status: formData.currentStepIndex! > 2 ? 'completed' : formData.currentStepIndex === 2 ? 'current' : 'upcoming' },
        { id: 3, title: 'Event Berjalan & Presensi', desc: 'Scan QR tiket & live analytics panitia', status: formData.currentStepIndex! > 3 ? 'completed' : formData.currentStepIndex === 3 ? 'current' : 'upcoming' },
        { id: 4, title: 'Laporan & LPJ Otomatis', desc: 'Ekspor rekap kehadiran & e-sertifikat', status: formData.currentStepIndex === 4 ? 'completed' : 'upcoming' }
      ];

      const payload = {
        ...formData,
        institutionName: formData.institutionName || formData.organization,
        steps
      };

      const url = editingProject ? `/api/projects/${editingProject.id}` : '/api/projects';
      const method = editingProject ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Gagal menyimpan project');
      }

      showToast(editingProject ? 'Project berhasil diperbarui!' : 'Project baru berhasil ditambahkan!');
      setIsProjectModalOpen(false);
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Terjadi kesalahan');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Perform confirmed deletion
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);

    try {
      if (deleteTarget.type === 'project') {
        const res = await fetch(`/api/projects/${encodeURIComponent(String(deleteTarget.id))}`, {
          method: 'DELETE'
        });
        if (res.ok) {
          showToast(`Project ${deleteTarget.id} berhasil dihapus.`);
          setDeleteTarget(null);
          loadData();
        } else {
          showToast('Gagal menghapus project.');
        }
      } else {
        const res = await fetch(`/api/consultations/${deleteTarget.id}`, {
          method: 'DELETE'
        });
        if (res.ok) {
          showToast(`Lead #${deleteTarget.id} berhasil dihapus.`);
          setDeleteTarget(null);
          loadData();
        } else {
          showToast('Gagal menghapus lead.');
        }
      }
    } catch (err) {
      console.error(err);
      showToast('Error koneksi saat menghapus data.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Quick advance step for project
  const handleAdvanceStep = async (project: ProjectItem) => {
    const nextStep = Math.min(4, project.currentStepIndex + 1);
    const statusMap: Record<number, string> = {
      1: 'Konsultasi & Setup',
      2: 'Setup & Custom Branding',
      3: 'Event Berjalan',
      4: 'Selesai & LPJ'
    };

    const updatedSteps: TrackStep[] = project.steps.map((st) => {
      if (st.id < nextStep) return { ...st, status: 'completed' };
      if (st.id === nextStep) {
        const nextStatus: 'completed' | 'current' = nextStep === 4 ? 'completed' : 'current';
        return { ...st, status: nextStatus };
      }
      return { ...st, status: 'upcoming' };
    });

    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...project,
          currentStepIndex: nextStep,
          statusBadge: statusMap[nextStep] || project.statusBadge,
          steps: updatedSteps
        })
      });
      if (res.ok) {
        showToast(`Tahap project ${project.id} dinaikkan ke Tahap ${nextStep}!`);
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Lead actions
  const handleUpdateLeadStatus = async (id: number, status: string) => {
    try {
      const res = await fetch(`/api/consultations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        showToast(`Status lead #${id} diubah jadi "${status}".`);
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleConvertLeadToProject = (lead: ConsultationItem) => {
    const year = new Date().getFullYear();
    const campusCode = (lead.campus || 'EVT').replace(/[^A-Za-z0-9]/g, '').slice(0, 4).toUpperCase();
    handleOpenCreateModal({
      id: `IVN-${year}-${campusCode}`,
      eventName: lead.eventName,
      organization: `${lead.campus} (${lead.name})`,
      institutionName: lead.campus,
      websiteUrl: `https://${campusCode.toLowerCase()}-event.id`,
      screenshotUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80',
      logoUrl: 'https://images.unsplash.com/photo-1592280771190-3e2e4d571952?w=120&auto=format&fit=crop&q=80',
      packageType:
        lead.planId === 'spark'
          ? 'Spark (Presensi & Tiket)'
          : lead.planId === 'bot'
          ? 'WhatsApp Bot & Blast'
          : 'Flow (Multi-Stage Event)',
      targetCount: lead.estimatedParticipants || 500,
      currentStepIndex: 1,
      statusBadge: 'Konsultasi & Setup'
    });
    handleUpdateLeadStatus(lead.id, 'Deal');
  };

  // Save Site Settings
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
        showToast('Pengaturan harga & statistik landing page berhasil disimpan!');
        onSettingsUpdated?.();
      } else {
        showToast('Gagal menyimpan pengaturan.');
      }
    } catch (err) {
      console.error(err);
      showToast('Error koneksi saat menyimpan pengaturan.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Reset demo data
  const handleResetDemo = async () => {
    if (!window.confirm('Reset database ke data demo awal? Semua perubahan baru akan diganti dengan data demo.')) return;
    try {
      const res = await fetch('/api/reset-demo', { method: 'POST' });
      if (res.ok) {
        showToast('Database berhasil di-reset ke data demo!');
        loadData();
      }
    } catch (err) {
      console.error(err);
      showToast('Gagal me-reset database.');
    }
  };

  // Filtered lists
  const filteredProjects = projects.filter((p) => {
    const matchSearch =
      p.id.toLowerCase().includes(searchProject.toLowerCase()) ||
      p.eventName.toLowerCase().includes(searchProject.toLowerCase()) ||
      p.organization.toLowerCase().includes(searchProject.toLowerCase()) ||
      (p.institutionName && p.institutionName.toLowerCase().includes(searchProject.toLowerCase()));
    const matchStatus = filterProjectStatus === 'all' || p.statusBadge === filterProjectStatus;
    return matchSearch && matchStatus;
  });

  const filteredLeads = leads.filter((l) => {
    const matchSearch =
      l.name.toLowerCase().includes(searchLead.toLowerCase()) ||
      l.campus.toLowerCase().includes(searchLead.toLowerCase()) ||
      l.eventName.toLowerCase().includes(searchLead.toLowerCase()) ||
      l.contactNumber.includes(searchLead);
    const matchStatus = filterLeadStatus === 'all' || l.status === filterLeadStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="min-h-screen bg-[#f8f9fe] text-[#191930] flex flex-col font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-[#191930] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/10 animate-fadeIn">
          <span className="material-symbols-outlined text-emerald-400 text-[20px]">check_circle</span>
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Admin Top Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#e2e1f4] shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <Logo size="sm" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black text-[#000cb8] tracking-tight">Iventra</span>
                  <span className="px-2 py-0.5 rounded-md bg-[#efecff] text-[#0c1df3] text-[11px] font-extrabold uppercase tracking-wider">
                    Admin
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-[#757589]">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Sistem Database Aktif (SQLite)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleResetDemo}
              title="Reset data demo SQLite"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#c5c5da] text-xs font-semibold text-[#454557] hover:bg-[#efecff] hover:text-[#0c1df3] transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">restart_alt</span>
              <span>Reset Demo</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenCreateModal()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0c1df3] hover:bg-[#000cb8] text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span className="hidden xs:inline">Project Baru</span>
            </button>

            <button
              type="button"
              onClick={onBackToSite}
              className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-[#efecff] hover:bg-[#dedaff] text-[#000cb8] text-xs sm:text-sm font-bold transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              <span className="hidden sm:inline">Website Utama</span>
            </button>
          </div>
        </div>

        {/* Tab Sub-navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1 border-t border-[#efecff] overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'overview'
                ? 'border-[#0c1df3] text-[#0c1df3]'
                : 'border-transparent text-[#757589] hover:text-[#191930]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">dashboard</span>
            <span>Ringkasan</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('projects')}
            className={`py-3 px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'projects'
                ? 'border-[#0c1df3] text-[#0c1df3]'
                : 'border-transparent text-[#757589] hover:text-[#191930]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">folder</span>
            <span>Kelola Project</span>
            <span className="px-1.5 py-0.2 rounded-full bg-[#efecff] text-[#0c1df3] text-[10px]">
              {projects.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('leads')}
            className={`py-3 px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'leads'
                ? 'border-[#0c1df3] text-[#0c1df3]'
                : 'border-transparent text-[#757589] hover:text-[#191930]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">support_agent</span>
            <span>Leads &amp; Konsultasi</span>
            {stats && stats.newLeads > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                {stats.newLeads} Baru
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`py-3 px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'settings'
                ? 'border-[#0c1df3] text-[#0c1df3]'
                : 'border-transparent text-[#757589] hover:text-[#191930]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">tune</span>
            <span>Pengaturan Website</span>
          </button>
        </div>
      </header>

      {/* Main Admin Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {loading && !stats ? (
          <div className="py-24 text-center">
            <div className="inline-block w-8 h-8 border-4 border-[#0c1df3] border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm font-semibold text-[#757589]">Memuat data...</p>
          </div>
        ) : (
          <>
            {/* TAB: OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-8 animate-fadeIn">
                {/* 4 Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-[#e2e1f4] shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#757589] uppercase tracking-wider">
                        Total Project
                      </span>
                      <div className="w-9 h-9 rounded-xl bg-[#efecff] text-[#0c1df3] flex items-center justify-center">
                        <span className="material-symbols-outlined text-[20px]">event</span>
                      </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold text-[#191930]">
                        {stats?.totalProjects || 0}
                      </span>
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                        {stats?.activeProjects || 0} Aktif
                      </span>
                    </div>
                    <p className="text-[11px] text-[#757589] mt-2">
                      Project kepanitiaan tercatat di database
                    </p>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-[#e2e1f4] shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#757589] uppercase tracking-wider">
                        Peserta Terkelola
                      </span>
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[20px]">groups</span>
                      </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold text-[#191930]">
                        {stats?.totalRegistered.toLocaleString('id-ID') || 0}
                      </span>
                      <span className="text-xs font-bold text-[#757589]">
                        / {stats?.totalTarget.toLocaleString('id-ID') || 0} target
                      </span>
                    </div>
                    <div className="mt-3 w-full bg-[#efecff] rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-1.5 rounded-full"
                        style={{
                          width: `${Math.min(100, Math.round(((stats?.totalRegistered || 0) / (stats?.totalTarget || 1)) * 100))}%`
                        }}
                      />
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-[#e2e1f4] shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#757589] uppercase tracking-wider">
                        Blast WA Terkirim
                      </span>
                      <div className="w-9 h-9 rounded-xl bg-[#25d366]/10 text-[#25d366] flex items-center justify-center">
                        <span className="material-symbols-outlined text-[20px]">send</span>
                      </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold text-[#191930]">
                        {stats?.totalWaSent.toLocaleString('id-ID') || 0}
                      </span>
                      <span className="text-xs font-semibold text-[#25d366] bg-[#25d366]/10 px-2 py-0.5 rounded-md">
                        100% Delivery
                      </span>
                    </div>
                    <p className="text-[11px] text-[#757589] mt-2">
                      Notifikasi tiket &amp; reminder presensi
                    </p>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-[#e2e1f4] shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#757589] uppercase tracking-wider">
                        Leads Masuk
                      </span>
                      <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[20px]">mark_chat_unread</span>
                      </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold text-[#191930]">
                        {stats?.totalLeads || 0}
                      </span>
                      {stats && stats.newLeads > 0 && (
                        <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
                          {stats.newLeads} Belum Follow-Up
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#757589] mt-2">
                      Permintaan konsultasi via formulir web
                    </p>
                  </div>
                </div>

                {/* 2 Split Columns: Recent Leads & Active Projects */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left: Leads Terbaru */}
                  <div className="bg-white rounded-2xl border border-[#e2e1f4] p-6 shadow-xs">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-base text-[#191930] flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#0c1df3] text-[20px]">inbox</span>
                        <span>Leads Konsultasi Terbaru</span>
                      </h3>
                      <button
                        type="button"
                        onClick={() => setActiveTab('leads')}
                        className="text-xs font-bold text-[#0c1df3] hover:underline cursor-pointer"
                      >
                        Lihat Semua ({leads.length})
                      </button>
                    </div>

                    <div className="space-y-3">
                      {leads.slice(0, 3).map((lead) => (
                        <div
                          key={lead.id}
                          className="p-4 rounded-xl border border-[#efecff] hover:border-[#0c1df3]/40 bg-[#fcf8ff] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-[#191930]">{lead.name}</span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                  lead.status === 'Baru'
                                    ? 'bg-amber-100 text-amber-800'
                                    : lead.status === 'Dihubungi'
                                    ? 'bg-blue-100 text-blue-800'
                                    : lead.status === 'Deal'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {lead.status}
                              </span>
                            </div>
                            <p className="text-xs text-[#454557] mt-0.5">
                              {lead.campus} • <strong>{lead.eventName}</strong>
                            </p>
                            <p className="text-[11px] text-[#757589] mt-1 italic">
                              "{lead.notes || 'Tidak ada catatan'}"
                            </p>
                          </div>

                          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                            <a
                              href={`https://wa.me/${lead.contactNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                                `Halo Kak ${lead.name} dari ${lead.campus}, kami dari tim Iventra menindaklanjuti konsultasi event ${lead.eventName}. Ada yang bisa kami bantu?`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 rounded-lg bg-[#25d366] hover:bg-[#20ba5a] text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                            >
                              <span className="material-symbols-outlined text-[15px]">chat</span>
                              <span>Chat WA</span>
                            </a>
                            <button
                              type="button"
                              onClick={() => handleConvertLeadToProject(lead)}
                              className="px-3 py-1.5 rounded-lg bg-[#efecff] hover:bg-[#dedaff] text-[#000cb8] text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                              title="Jadikan Project Baru"
                            >
                              <span className="material-symbols-outlined text-[15px]">add_circle</span>
                              <span>Jadikan Project</span>
                            </button>
                          </div>
                        </div>
                      ))}

                      {leads.length === 0 && (
                        <p className="text-xs text-[#757589] text-center py-6">
                          Belum ada konsultasi masuk.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Ongoing Projects */}
                  <div className="bg-white rounded-2xl border border-[#e2e1f4] p-6 shadow-xs">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-base text-[#191930] flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#0c1df3] text-[20px]">rocket_launch</span>
                        <span>Project Berjalan</span>
                      </h3>
                      <button
                        type="button"
                        onClick={() => setActiveTab('projects')}
                        className="text-xs font-bold text-[#0c1df3] hover:underline cursor-pointer"
                      >
                        Kelola Semua ({projects.length})
                      </button>
                    </div>

                    <div className="space-y-3">
                      {projects.slice(0, 3).map((p) => (
                        <div
                          key={p.id}
                          className="p-4 rounded-xl border border-[#efecff] bg-[#f8f9fe] flex flex-col gap-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              {p.logoUrl ? (
                                <img
                                  src={p.logoUrl}
                                  alt={p.institutionName || p.organization}
                                  className="w-8 h-8 rounded-lg object-cover border border-[#efecff] shadow-xs"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-lg bg-[#0c1df3] text-white flex items-center justify-center font-bold text-xs">
                                  {(p.institutionName || p.organization || 'E').slice(0, 2).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <span className="text-[10px] font-mono font-bold text-[#0c1df3] bg-white px-2 py-0.5 rounded border border-[#efecff]">
                                  {p.id}
                                </span>
                                <h4 className="font-bold text-sm text-[#191930] mt-0.5">{p.eventName}</h4>
                                <p className="text-xs text-[#757589]">{p.institutionName || p.organization}</p>
                              </div>
                            </div>
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                              {p.statusBadge}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs text-[#454557] mt-1 pt-2 border-t border-[#efecff]">
                            <span>
                              Tahap: <strong>{p.currentStepIndex}/4</strong>
                            </span>
                            {p.websiteUrl && (
                              <a
                                href={p.websiteUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-[#0c1df3] font-semibold hover:underline flex items-center gap-1"
                              >
                                <span>Website</span>
                                <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                              </a>
                            )}
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setPreviewAlurProject(p)}
                                className="text-xs text-[#0c1df3] font-bold hover:underline cursor-pointer"
                              >
                                Alur
                              </button>
                              <span>•</span>
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(p)}
                                className="text-xs text-[#454557] hover:text-[#0c1df3] cursor-pointer"
                              >
                                Edit
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: PROJECTS MANAGEMENT */}
            {activeTab === 'projects' && (
              <div className="space-y-6 animate-fadeIn">
                {/* Search & Filter & View Toggle Toolbar */}
                <div className="bg-white p-4 rounded-2xl border border-[#e2e1f4] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="material-symbols-outlined text-[#757589] text-[20px]">search</span>
                    <input
                      type="text"
                      placeholder="Cari kode, nama event, atau nama instansi kampus..."
                      value={searchProject}
                      onChange={(e) => setSearchProject(e.target.value)}
                      className="w-full text-sm outline-none bg-transparent"
                    />
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto shrink-0">
                    {/* Status filter pills */}
                    {['all', 'Konsultasi & Setup', 'Penjurian Berkas', 'Event Berjalan', 'Selesai & LPJ'].map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setFilterProjectStatus(st)}
                        className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer whitespace-nowrap ${
                          filterProjectStatus === st
                            ? 'bg-[#0c1df3] text-white'
                            : 'bg-[#efecff] text-[#454557] hover:bg-[#dedaff]'
                        }`}
                      >
                        {st === 'all' ? 'Semua Status' : st}
                      </button>
                    ))}

                    {/* View Switcher: Grid vs Table */}
                    <div className="flex items-center border border-[#efecff] rounded-xl bg-[#f8f9fe] p-0.5 ml-1">
                      <button
                        type="button"
                        onClick={() => setProjectViewMode('grid')}
                        title="Tampilan Kartu / Portfolio Showcase"
                        className={`p-1.5 rounded-lg flex items-center transition-colors cursor-pointer ${
                          projectViewMode === 'grid'
                            ? 'bg-[#0c1df3] text-white shadow-xs'
                            : 'text-[#757589] hover:text-[#191930]'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[18px]">grid_view</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setProjectViewMode('table')}
                        title="Tampilan Tabel Data"
                        className={`p-1.5 rounded-lg flex items-center transition-colors cursor-pointer ${
                          projectViewMode === 'table'
                            ? 'bg-[#0c1df3] text-white shadow-xs'
                            : 'text-[#757589] hover:text-[#191930]'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[18px]">table_rows</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* VIEW 1: GRID SHOWCASE (Screenshot, Link, Logo, Instansi) */}
                {projectViewMode === 'grid' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProjects.map((p) => (
                      <div
                        key={p.id}
                        className="bg-white rounded-3xl border border-[#e2e1f4] shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden group"
                      >
                        {/* 1. Screenshot Website Window */}
                        <div className="relative bg-[#191930] aspect-[16/10] overflow-hidden border-b border-[#efecff] group/screen">
                          {/* Browser Mockup Bar */}
                          <div className="absolute top-0 inset-x-0 z-10 bg-[#191930]/80 backdrop-blur-md px-3 py-1.5 flex items-center justify-between border-b border-white/10">
                            <div className="flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block" />
                              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                            </div>
                            <span className="font-mono text-[10px] text-white/70 truncate max-w-[180px]">
                              {p.websiteUrl ? p.websiteUrl.replace(/^https?:\/\//, '') : `${p.id.toLowerCase()}.iventra.id`}
                            </span>
                            <span className="text-[10px] font-mono text-emerald-400 font-bold">HTTPS</span>
                          </div>

                          {/* Screenshot Image */}
                          {p.screenshotUrl ? (
                            <img
                              src={p.screenshotUrl}
                              alt={`Screenshot Website ${p.eventName}`}
                              className="w-full h-full object-cover object-top pt-6 group-hover/screen:scale-105 transition-transform duration-500 cursor-pointer"
                              onClick={() =>
                                setPreviewScreenshot({
                                  url: p.screenshotUrl!,
                                  title: p.eventName,
                                  instansi: p.institutionName || p.organization,
                                  link: p.websiteUrl
                                })
                              }
                            />
                          ) : (
                            <div className="w-full h-full pt-6 flex flex-col items-center justify-center text-white/40">
                              <span className="material-symbols-outlined text-[36px]">image_not_supported</span>
                              <span className="text-xs mt-1">Belum ada screenshot</span>
                            </div>
                          )}

                          {/* Overlay on hover */}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/screen:opacity-100 transition-opacity flex items-center justify-center gap-2 pt-6">
                            <button
                              type="button"
                              onClick={() =>
                                setPreviewScreenshot({
                                  url: p.screenshotUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
                                  title: p.eventName,
                                  instansi: p.institutionName || p.organization,
                                  link: p.websiteUrl
                                })
                              }
                              className="px-3 py-1.5 rounded-full bg-white/90 hover:bg-white text-[#191930] text-xs font-bold shadow-lg flex items-center gap-1 cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[15px]">zoom_in</span>
                              <span>Perbesar</span>
                            </button>
                            {p.websiteUrl && (
                              <a
                                href={p.websiteUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 rounded-full bg-[#0c1df3] hover:bg-[#000cb8] text-white text-xs font-bold shadow-lg flex items-center gap-1"
                              >
                                <span className="material-symbols-outlined text-[15px]">open_in_new</span>
                                <span>Kunjungi</span>
                              </a>
                            )}
                          </div>

                          {/* Status Badge in Screenshot corner */}
                          <div className="absolute bottom-2.5 right-2.5 z-10">
                            <span
                              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-md ${
                                p.statusBadge === 'Event Berjalan'
                                  ? 'bg-emerald-500 text-white'
                                  : p.statusBadge === 'Selesai & LPJ'
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-amber-500 text-white'
                              }`}
                            >
                              {p.statusBadge}
                            </span>
                          </div>
                        </div>

                        {/* 2. Body Details (Logo, Nama Instansi, Event, Link Website) */}
                        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                          <div>
                            {/* Instansi Header with Logo */}
                            <div className="flex items-center gap-3">
                              {p.logoUrl ? (
                                <img
                                  src={p.logoUrl}
                                  alt={p.institutionName || p.organization}
                                  className="w-11 h-11 rounded-2xl object-cover border-2 border-[#efecff] shadow-xs shrink-0"
                                />
                              ) : (
                                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#0c1df3] to-[#3b47dc] text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                                  {(p.institutionName || p.organization || 'IV').slice(0, 2).toUpperCase()}
                                </div>
                              )}

                              <div className="flex-1 min-w-0">
                                <span className="text-[11px] font-extrabold text-[#0c1df3] uppercase tracking-wider block truncate">
                                  {p.institutionName || p.organization}
                                </span>
                                <h4 className="font-bold text-base text-[#191930] leading-snug line-clamp-1 mt-0.5">
                                  {p.eventName}
                                </h4>
                              </div>
                            </div>

                            {/* Link Website Pill */}
                            <div className="mt-3">
                              {p.websiteUrl ? (
                                <a
                                  href={p.websiteUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title={`Buka website ${p.websiteUrl}`}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#f5f2ff] hover:bg-[#dedaff] text-[#000cb8] text-xs font-semibold max-w-full truncate transition-colors"
                                >
                                  <span className="material-symbols-outlined text-[15px] text-[#0c1df3]">link</span>
                                  <span className="truncate">{p.websiteUrl}</span>
                                  <span className="material-symbols-outlined text-[13px] shrink-0">open_in_new</span>
                                </a>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] text-[#757589] italic">
                                  <span className="material-symbols-outlined text-[14px]">link_off</span>
                                  <span>Website belum disetel</span>
                                </span>
                              )}
                            </div>

                            {/* Alur & Peserta Info */}
                            <div className="mt-4 pt-3 border-t border-[#efecff] space-y-2">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-[#757589] font-medium">Alur Tahapan:</span>
                                <span className="font-bold text-[#0c1df3]">
                                  Tahap {p.currentStepIndex} dari 4
                                </span>
                              </div>
                              <div className="w-full bg-[#efecff] h-1.5 rounded-full overflow-hidden">
                                <div
                                  className="bg-[#0c1df3] h-1.5 rounded-full transition-all"
                                  style={{ width: `${(p.currentStepIndex / 4) * 100}%` }}
                                />
                              </div>

                              <div className="flex items-center justify-between text-xs text-[#757589] pt-1">
                                <span>Paket: <strong className="text-[#191930]">{p.packageType}</strong></span>
                                <span>Peserta: <strong className="text-[#191930]">{p.registeredCount}</strong> / {p.targetCount}</span>
                              </div>
                            </div>
                          </div>

                          {/* Card Footer Actions */}
                          <div className="pt-3 border-t border-[#efecff] flex items-center justify-between">
                            <span className="font-mono text-xs font-bold text-[#0c1df3] bg-[#efecff] px-2 py-0.5 rounded-md">
                              {p.id}
                            </span>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => setPreviewAlurProject(p)}
                                title="Lihat Timeline Alur"
                                className="w-8 h-8 rounded-lg bg-[#efecff] hover:bg-[#dedaff] text-[#0c1df3] flex items-center justify-center transition-colors cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[16px]">timeline</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(p)}
                                title="Edit Project & Website"
                                className="w-8 h-8 rounded-lg bg-[#efecff] hover:bg-[#dedaff] text-[#000cb8] flex items-center justify-center transition-colors cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[16px]">edit</span>
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  setDeleteTarget({
                                    type: 'project',
                                    id: p.id,
                                    title: `${p.eventName} (${p.id})`
                                  })
                                }
                                title="Hapus Project"
                                className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center transition-colors cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[16px]">delete</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {filteredProjects.length === 0 && (
                      <div className="col-span-full py-12 text-center text-xs text-[#757589] bg-white rounded-3xl border border-[#e2e1f4]">
                        Tidak ada project yang sesuai dengan pencarian atau filter.
                      </div>
                    )}
                  </div>
                )}

                {/* VIEW 2: TABLE VIEW (Includes Screenshot, Logo, Instansi, Link) */}
                {projectViewMode === 'table' && (
                  <div className="bg-white rounded-2xl border border-[#e2e1f4] overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-[#f5f2ff] text-[#454557] text-xs font-bold uppercase tracking-wider border-b border-[#e2e1f4]">
                          <tr>
                            <th className="py-3.5 px-4">Screenshot</th>
                            <th className="py-3.5 px-4">Instansi &amp; Logo</th>
                            <th className="py-3.5 px-4">Nama Event &amp; Kode</th>
                            <th className="py-3.5 px-4">Link Website</th>
                            <th className="py-3.5 px-4">Paket &amp; Alur</th>
                            <th className="py-3.5 px-4">Peserta</th>
                            <th className="py-3.5 px-4">Status</th>
                            <th className="py-3.5 px-4 text-right">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#efecff]">
                          {filteredProjects.map((p) => (
                            <tr key={p.id} className="hover:bg-[#fcf8ff] transition-colors">
                              {/* Screenshot Thumbnail */}
                              <td className="py-3 px-4">
                                {p.screenshotUrl ? (
                                  <div
                                    className="w-16 h-10 rounded-lg overflow-hidden border border-[#e2e1f4] bg-[#191930] shadow-2xs cursor-pointer group relative"
                                    onClick={() =>
                                      setPreviewScreenshot({
                                        url: p.screenshotUrl!,
                                        title: p.eventName,
                                        instansi: p.institutionName || p.organization,
                                        link: p.websiteUrl
                                      })
                                    }
                                  >
                                    <img
                                      src={p.screenshotUrl}
                                      alt={p.eventName}
                                      className="w-full h-full object-cover object-top group-hover:scale-110 transition-transform"
                                    />
                                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[12px]">
                                      <span className="material-symbols-outlined text-[16px]">zoom_in</span>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="w-16 h-10 rounded-lg bg-[#efecff] flex items-center justify-center text-[#757589]">
                                    <span className="material-symbols-outlined text-[18px]">web</span>
                                  </div>
                                )}
                              </td>

                              {/* Logo & Nama Instansi */}
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2.5">
                                  {p.logoUrl ? (
                                    <img
                                      src={p.logoUrl}
                                      alt={p.institutionName || p.organization}
                                      className="w-8 h-8 rounded-xl object-cover border border-[#efecff] shadow-xs shrink-0"
                                    />
                                  ) : (
                                    <div className="w-8 h-8 rounded-xl bg-[#0c1df3] text-white flex items-center justify-center font-bold text-xs shrink-0">
                                      {(p.institutionName || p.organization || 'IV').slice(0, 2).toUpperCase()}
                                    </div>
                                  )}
                                  <div>
                                    <span className="font-bold text-xs text-[#0c1df3] block">
                                      {p.institutionName || p.organization}
                                    </span>
                                    <span className="text-[11px] text-[#757589]">
                                      {p.organization}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              {/* Nama Event & Kode */}
                              <td className="py-3 px-4">
                                <div className="font-bold text-[#191930] text-sm">{p.eventName}</div>
                                <span className="font-mono text-[11px] font-bold text-[#757589]">
                                  {p.id}
                                </span>
                              </td>

                              {/* Link Website */}
                              <td className="py-3 px-4">
                                {p.websiteUrl ? (
                                  <a
                                    href={p.websiteUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#0c1df3] hover:underline"
                                  >
                                    <span className="truncate max-w-[140px]">{p.websiteUrl.replace(/^https?:\/\//, '')}</span>
                                    <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                                  </a>
                                ) : (
                                  <span className="text-xs text-[#757589] italic">-</span>
                                )}
                              </td>

                              {/* Paket & Alur */}
                              <td className="py-3 px-4">
                                <div className="text-xs font-medium text-[#454557]">{p.packageType}</div>
                                <div className="flex items-center gap-1.5 mt-1">
                                  <span className="text-[11px] font-bold text-[#0c1df3]">
                                    Tahap {p.currentStepIndex}/4
                                  </span>
                                  <div className="w-16 bg-[#efecff] h-1.5 rounded-full overflow-hidden">
                                    <div
                                      className="bg-[#0c1df3] h-1.5 rounded-full"
                                      style={{ width: `${(p.currentStepIndex / 4) * 100}%` }}
                                    />
                                  </div>
                                </div>
                              </td>

                              {/* Peserta */}
                              <td className="py-3 px-4 text-xs">
                                <span className="font-bold text-[#191930]">{p.registeredCount}</span>
                                <span className="text-[#757589]"> / {p.targetCount}</span>
                              </td>

                              {/* Status */}
                              <td className="py-3 px-4">
                                <span
                                  className={`text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${
                                    p.statusBadge === 'Event Berjalan'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : p.statusBadge === 'Selesai & LPJ'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}
                                >
                                  {p.statusBadge}
                                </span>
                              </td>

                              {/* Aksi */}
                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {p.websiteUrl && (
                                    <a
                                      href={p.websiteUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      title="Buka Website"
                                      className="w-8 h-8 rounded-lg bg-[#efecff] hover:bg-[#dedaff] text-[#0c1df3] flex items-center justify-center transition-colors"
                                    >
                                      <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                                    </a>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => setPreviewAlurProject(p)}
                                    title="Preview Alur & Progres"
                                    className="w-8 h-8 rounded-lg bg-[#efecff] hover:bg-[#dedaff] text-[#0c1df3] flex items-center justify-center transition-colors cursor-pointer"
                                  >
                                    <span className="material-symbols-outlined text-[16px]">timeline</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditModal(p)}
                                    title="Edit Project"
                                    className="w-8 h-8 rounded-lg bg-[#efecff] hover:bg-[#dedaff] text-[#000cb8] flex items-center justify-center transition-colors cursor-pointer"
                                  >
                                    <span className="material-symbols-outlined text-[16px]">edit</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setDeleteTarget({
                                        type: 'project',
                                        id: p.id,
                                        title: `${p.eventName} (${p.id})`
                                      })
                                    }
                                    title="Hapus Project"
                                    className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center transition-colors cursor-pointer"
                                  >
                                    <span className="material-symbols-outlined text-[16px]">delete</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}

                          {filteredProjects.length === 0 && (
                            <tr>
                              <td colSpan={8} className="text-center py-8 text-xs text-[#757589]">
                                Tidak ada project yang sesuai dengan pencarian atau filter.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB: LEADS / INQUIRIES */}
            {activeTab === 'leads' && (
              <div className="space-y-6 animate-fadeIn">
                {/* Search & Filter Toolbar */}
                <div className="bg-white p-4 rounded-2xl border border-[#e2e1f4] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="material-symbols-outlined text-[#757589] text-[20px]">search</span>
                    <input
                      type="text"
                      placeholder="Cari nama pemohon, kampus, atau event..."
                      value={searchLead}
                      onChange={(e) => setSearchLead(e.target.value)}
                      className="w-full text-sm outline-none bg-transparent"
                    />
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto shrink-0">
                    {['all', 'Baru', 'Dihubungi', 'Deal', 'Batal'].map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setFilterLeadStatus(st)}
                        className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer whitespace-nowrap ${
                          filterLeadStatus === st
                            ? 'bg-[#0c1df3] text-white'
                            : 'bg-[#efecff] text-[#454557] hover:bg-[#dedaff]'
                        }`}
                      >
                        {st === 'all' ? 'Semua' : st}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Leads Table */}
                <div className="bg-white rounded-2xl border border-[#e2e1f4] overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-[#f5f2ff] text-[#454557] text-xs font-bold uppercase tracking-wider border-b border-[#e2e1f4]">
                        <tr>
                          <th className="py-3.5 px-4">Waktu</th>
                          <th className="py-3.5 px-4">Panitia &amp; WhatsApp</th>
                          <th className="py-3.5 px-4">Kampus &amp; Event</th>
                          <th className="py-3.5 px-4">Paket &amp; Peserta</th>
                          <th className="py-3.5 px-4">Catatan Kebutuhan</th>
                          <th className="py-3.5 px-4">Status Follow-up</th>
                          <th className="py-3.5 px-4 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#efecff]">
                        {filteredLeads.map((lead) => (
                          <tr key={lead.id} className="hover:bg-[#fcf8ff] transition-colors">
                            <td className="py-3.5 px-4 text-xs text-[#757589] whitespace-nowrap">
                              {lead.createdAt}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-[#191930]">{lead.name}</div>
                              <a
                                href={`https://wa.me/${lead.contactNumber.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-[#25d366] font-semibold hover:underline flex items-center gap-1 mt-0.5"
                              >
                                <span>{lead.contactNumber}</span>
                                <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                              </a>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-xs text-[#000cb8]">{lead.campus}</div>
                              <div className="text-xs text-[#454557] font-medium">{lead.eventName}</div>
                            </td>
                            <td className="py-3.5 px-4 text-xs">
                              <div className="font-bold uppercase text-[#0c1df3]">{lead.planId}</div>
                              <div className="text-[#757589]">± {lead.estimatedParticipants} org</div>
                            </td>
                            <td className="py-3.5 px-4 text-xs text-[#454557] max-w-xs truncate" title={lead.notes}>
                              {lead.notes || '-'}
                            </td>
                            <td className="py-3.5 px-4">
                              <select
                                value={lead.status}
                                onChange={(e) => handleUpdateLeadStatus(lead.id, e.target.value)}
                                className={`text-xs font-bold px-2.5 py-1 rounded-lg border outline-none cursor-pointer ${
                                  lead.status === 'Baru'
                                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                                    : lead.status === 'Dihubungi'
                                    ? 'bg-blue-50 text-blue-800 border-blue-200'
                                    : lead.status === 'Deal'
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    : 'bg-red-50 text-red-800 border-red-200'
                                }`}
                              >
                                <option value="Baru">Baru</option>
                                <option value="Dihubungi">Dihubungi</option>
                                <option value="Deal">Deal</option>
                                <option value="Batal">Batal</option>
                              </select>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <a
                                  href={`https://wa.me/${lead.contactNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                                    `Halo Kak ${lead.name} dari ${lead.campus}, kami dari tim Iventra menindaklanjuti konsultasi event ${lead.eventName}. Ada yang bisa kami bantu?`
                                  )}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="Chat WhatsApp"
                                  className="w-8 h-8 rounded-lg bg-[#25d366]/15 hover:bg-[#25d366]/30 text-[#128c7e] flex items-center justify-center transition-colors"
                                >
                                  <span className="material-symbols-outlined text-[16px]">chat</span>
                                </a>

                                <button
                                  type="button"
                                  onClick={() => handleConvertLeadToProject(lead)}
                                  title="Jadikan Project Baru"
                                  className="w-8 h-8 rounded-lg bg-[#efecff] hover:bg-[#dedaff] text-[#000cb8] flex items-center justify-center transition-colors cursor-pointer"
                                >
                                  <span className="material-symbols-outlined text-[16px]">add_task</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    setDeleteTarget({
                                      type: 'lead',
                                      id: lead.id,
                                      title: `Lead dari ${lead.name} (${lead.campus})`
                                    })
                                  }
                                  title="Hapus Lead"
                                  className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center transition-colors cursor-pointer"
                                >
                                  <span className="material-symbols-outlined text-[16px]">delete</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}

                        {filteredLeads.length === 0 && (
                          <tr>
                            <td colSpan={7} className="text-center py-8 text-xs text-[#757589]">
                              Tidak ada data lead konsultasi.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: PENGATURAN WEBSITE (PRICES & HERO STATS) */}
            {activeTab === 'settings' && (
              <div className="space-y-6 max-w-4xl animate-fadeIn">
                <div className="bg-white rounded-2xl border border-[#e2e1f4] p-6 shadow-xs">
                  <div className="flex items-center gap-3 pb-4 border-b border-[#efecff]">
                    <div className="w-10 h-10 rounded-xl bg-[#efecff] text-[#0c1df3] flex items-center justify-center">
                      <span className="material-symbols-outlined text-[24px]">tune</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-[#191930]">
                        Pengaturan Tampilan Landing Page
                      </h3>
                      <p className="text-xs text-[#757589]">
                        Ubah harga paket layanan dan angka statistik hero yang tampil di website utama.
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleSaveSettings} className="mt-6 space-y-6">
                    {/* Section 1: Hero Stats */}
                    <div className="p-5 rounded-2xl bg-[#f8f9fe] border border-[#efecff] space-y-4">
                      <h4 className="text-xs font-bold text-[#0c1df3] uppercase tracking-wider flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">query_stats</span>
                        <span>Angka Statistik Hero Section (Live Mockup)</span>
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-[#454557] mb-1">
                            Total Project Ditangani
                          </label>
                          <input
                            type="text"
                            required
                            value={settings.totalProjectsHandled}
                            onChange={(e) =>
                              setSettings({ ...settings, totalProjectsHandled: e.target.value })
                            }
                            placeholder="Contoh: 120+"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-[#c5c5da] bg-white text-xs font-bold focus:border-[#0c1df3]"
                          />
                          <p className="text-[11px] text-[#757589] mt-1">
                            Muncul pada card "Project Ditangani" di landing page.
                          </p>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-[#454557] mb-1">
                            Total User Aktif
                          </label>
                          <input
                            type="text"
                            required
                            value={settings.totalActiveUsers}
                            onChange={(e) =>
                              setSettings({ ...settings, totalActiveUsers: e.target.value })
                            }
                            placeholder="Contoh: 15.000+"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-[#c5c5da] bg-white text-xs font-bold focus:border-[#0c1df3]"
                          />
                          <p className="text-[11px] text-[#757589] mt-1">
                            Muncul pada card "Total User Aktif" di landing page.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Package Pricing */}
                    <div className="p-5 rounded-2xl bg-[#f8f9fe] border border-[#efecff] space-y-4">
                      <h4 className="text-xs font-bold text-[#0c1df3] uppercase tracking-wider flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">payments</span>
                        <span>Harga Paket Layanan (Services Section)</span>
                      </h4>

                      {/* Spark */}
                      <div className="p-4 rounded-xl bg-white border border-[#efecff] space-y-2">
                        <span className="text-xs font-bold text-[#191930] flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#0c1df3]" />
                          <span>Paket Spark (Self-Service)</span>
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-[#757589] mb-1">
                              Label Harga
                            </label>
                            <input
                              type="text"
                              value={settings.sparkPrice}
                              onChange={(e) => setSettings({ ...settings, sparkPrice: e.target.value })}
                              placeholder="Rp 150rb - 300rb"
                              className="w-full px-3 py-2 rounded-lg border border-[#c5c5da] text-xs font-bold"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-[#757589] mb-1">
                              Keterangan / Satuan
                            </label>
                            <input
                              type="text"
                              value={settings.sparkPriceNote}
                              onChange={(e) =>
                                setSettings({ ...settings, sparkPriceNote: e.target.value })
                              }
                              placeholder="/ event"
                              className="w-full px-3 py-2 rounded-lg border border-[#c5c5da] text-xs"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Flow */}
                      <div className="p-4 rounded-xl bg-white border border-[#efecff] space-y-2">
                        <span className="text-xs font-bold text-[#191930] flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#0c1df3]" />
                          <span>Paket Flow (Pilihan Utama)</span>
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-[#757589] mb-1">
                              Label Harga
                            </label>
                            <input
                              type="text"
                              value={settings.flowPrice}
                              onChange={(e) => setSettings({ ...settings, flowPrice: e.target.value })}
                              placeholder="Mulai Rp 500.000"
                              className="w-full px-3 py-2 rounded-lg border border-[#c5c5da] text-xs font-bold"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-[#757589] mb-1">
                              Keterangan / Satuan
                            </label>
                            <input
                              type="text"
                              value={settings.flowPriceNote}
                              onChange={(e) =>
                                setSettings({ ...settings, flowPriceNote: e.target.value })
                              }
                              placeholder="/ event"
                              className="w-full px-3 py-2 rounded-lg border border-[#c5c5da] text-xs"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Bot */}
                      <div className="p-4 rounded-xl bg-white border border-[#efecff] space-y-2">
                        <span className="text-xs font-bold text-[#191930] flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#0c1df3]" />
                          <span>Paket Bot (WhatsApp Engine)</span>
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-[#757589] mb-1">
                              Label Harga
                            </label>
                            <input
                              type="text"
                              value={settings.botPrice}
                              onChange={(e) => setSettings({ ...settings, botPrice: e.target.value })}
                              placeholder="Rp 70.000"
                              className="w-full px-3 py-2 rounded-lg border border-[#c5c5da] text-xs font-bold"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-[#757589] mb-1">
                              Keterangan / Satuan
                            </label>
                            <input
                              type="text"
                              value={settings.botPriceNote}
                              onChange={(e) =>
                                setSettings({ ...settings, botPriceNote: e.target.value })
                              }
                              placeholder="/ event"
                              className="w-full px-3 py-2 rounded-lg border border-[#c5c5da] text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex items-center justify-between pt-4 border-t border-[#efecff]">
                      <button
                        type="button"
                        onClick={() =>
                          setSettings({
                            sparkPrice: 'Rp 150rb - 300rb',
                            sparkPriceNote: '/ event',
                            flowPrice: 'Mulai Rp 500.000',
                            flowPriceNote: '/ event',
                            botPrice: 'Rp 70.000',
                            botPriceNote: '/ event',
                            totalProjectsHandled: '120+',
                            totalActiveUsers: '15.000+'
                          })
                        }
                        className="text-xs font-bold text-[#757589] hover:text-[#ba1a1a] transition-colors cursor-pointer"
                      >
                        Reset ke Nilai Bawaan
                      </button>

                      <button
                        type="submit"
                        disabled={isSavingSettings}
                        className="px-6 py-2.5 rounded-xl bg-[#0c1df3] hover:bg-[#000cb8] text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-[18px]">save</span>
                        <span>{isSavingSettings ? 'Menyimpan...' : 'Simpan Perubahan ke Website'}</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* MODAL: LIGHTBOX FULLSCREEN PREVIEW SCREENSHOT */}
      {previewScreenshot && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
          onClick={() => setPreviewScreenshot(null)}
        >
          <div
            className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 bg-[#191930] text-white flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-[#0c1df3] bg-white/10 px-2 py-0.5 rounded-md uppercase">
                  {previewScreenshot.instansi || 'Instansi'}
                </span>
                <h4 className="font-bold text-base text-white mt-1">{previewScreenshot.title}</h4>
              </div>

              <div className="flex items-center gap-2">
                {previewScreenshot.link && (
                  <a
                    href={previewScreenshot.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0c1df3] hover:bg-[#000cb8] text-white text-xs font-bold shadow transition-colors"
                  >
                    <span>Kunjungi Website</span>
                    <span className="material-symbols-outlined text-[15px]">open_in_new</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setPreviewScreenshot(null)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
            </div>

            {/* Screenshot Viewer */}
            <div className="p-4 bg-[#0d0d1a] overflow-auto flex-1 flex items-center justify-center">
              <img
                src={previewScreenshot.url}
                alt={previewScreenshot.title}
                className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-2xl border border-white/10"
              />
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PREVIEW ALUR & TRACKER DETAIL */}
      {previewAlurProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div
            className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-[#efecff] overflow-hidden max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 bg-gradient-to-r from-[#0c1df3] to-[#3b47dc] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[22px]">timeline</span>
                <div>
                  <h3 className="font-bold text-base text-white">Preview Alur Kepanitiaan</h3>
                  <p className="text-xs text-white/80">Kode: {previewAlurProject.id}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewAlurProject(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              {/* Event Info Card */}
              <div className="p-4 rounded-2xl bg-[#f5f2ff] border border-[#efecff] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {previewAlurProject.logoUrl && (
                    <img
                      src={previewAlurProject.logoUrl}
                      alt={previewAlurProject.institutionName || previewAlurProject.organization}
                      className="w-10 h-10 rounded-xl object-cover border border-[#efecff]"
                    />
                  )}
                  <div>
                    <span className="text-[11px] font-bold text-[#0c1df3] uppercase">
                      {previewAlurProject.institutionName || previewAlurProject.organization}
                    </span>
                    <h4 className="font-bold text-base text-[#191930]">{previewAlurProject.eventName}</h4>
                    <div className="text-xs text-[#757589] mt-0.5">
                      Paket: <strong>{previewAlurProject.packageType}</strong> • Update:{' '}
                      {previewAlurProject.updatedAt}
                    </div>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold shrink-0">
                  {previewAlurProject.statusBadge}
                </span>
              </div>

              {/* Step Timeline */}
              <div>
                <h5 className="text-xs font-bold text-[#454557] uppercase tracking-wider mb-4">
                  Tahapan Alur Event ({previewAlurProject.currentStepIndex} dari 4)
                </h5>

                <div className="space-y-3">
                  {previewAlurProject.steps.map((st) => (
                    <div
                      key={st.id}
                      className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 ${
                        st.status === 'completed'
                          ? 'bg-emerald-50/50 border-emerald-200'
                          : st.status === 'current'
                          ? 'bg-[#efecff]/60 border-[#0c1df3] ring-2 ring-[#0c1df3]/20 shadow-xs'
                          : 'bg-[#fcf8ff] border-[#efecff] opacity-75'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 mt-0.5 ${
                          st.status === 'completed'
                            ? 'bg-emerald-600 text-white'
                            : st.status === 'current'
                            ? 'bg-[#0c1df3] text-white animate-pulse'
                            : 'bg-[#e2e1f4] text-[#757589]'
                        }`}
                      >
                        {st.status === 'completed' ? (
                          <span className="material-symbols-outlined text-[18px]">check</span>
                        ) : (
                          st.id
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h6 className="font-bold text-sm text-[#191930]">{st.title}</h6>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              st.status === 'completed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : st.status === 'current'
                                ? 'bg-[#0c1df3] text-white'
                                : 'bg-[#e2e1f4] text-[#757589]'
                            }`}
                          >
                            {st.status === 'completed'
                              ? 'Selesai'
                              : st.status === 'current'
                              ? 'Sedang Berlangsung'
                              : 'Akan Datang'}
                          </span>
                        </div>
                        <p className="text-xs text-[#757589] mt-0.5">{st.desc}</p>
                        {st.dateCompleted && (
                          <span className="text-[10px] text-emerald-700 font-semibold mt-1 inline-block">
                            Diselesaikan: {st.dateCompleted}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Progress Summary */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 bg-[#f8f9fe] rounded-xl border border-[#efecff] text-center">
                  <span className="text-xs text-[#757589]">Peserta Terdaftar</span>
                  <div className="text-lg font-bold text-[#191930] mt-0.5">
                    {previewAlurProject.registeredCount} / {previewAlurProject.targetCount}
                  </div>
                </div>
                <div className="p-3.5 bg-[#f8f9fe] rounded-xl border border-[#efecff] text-center">
                  <span className="text-xs text-[#757589]">E-Sertifikat</span>
                  <div
                    className={`text-sm font-bold mt-1 ${
                      previewAlurProject.certificatesReady ? 'text-emerald-600' : 'text-amber-600'
                    }`}
                  >
                    {previewAlurProject.certificatesReady ? 'Siap Diterbitkan' : 'Dalam Penyiapan'}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-[#f8f9fe] border-t border-[#efecff] flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  const pId = previewAlurProject.id;
                  setPreviewAlurProject(null);
                  onPreviewProject?.(pId);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0c1df3] text-white text-xs font-bold hover:bg-[#000cb8] transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                <span>Buka di Live Project Tracker Publik</span>
              </button>

              <button
                type="button"
                onClick={() => setPreviewAlurProject(null)}
                className="px-4 py-2 rounded-xl border border-[#c5c5da] text-xs font-semibold text-[#454557] hover:bg-white transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CUSTOM IN-APP DELETE CONFIRMATION */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div
            className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-red-100 overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 mx-auto flex items-center justify-center">
                <span className="material-symbols-outlined text-[32px]">warning</span>
              </div>

              <h4 className="text-lg font-bold text-[#191930]">Konfirmasi Penghapusan</h4>

              <p className="text-xs text-[#757589] leading-relaxed">
                Apakah Anda yakin ingin menghapus{' '}
                <strong className="text-[#191930]">{deleteTarget.title}</strong> dari database? Data
                yang dihapus tidak dapat dikembalikan.
              </p>
            </div>

            <div className="p-4 bg-[#f8f9fe] border-t border-[#efecff] flex items-center justify-center gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteTarget(null)}
                className="px-5 py-2.5 rounded-xl border border-[#c5c5da] text-xs font-semibold text-[#454557] hover:bg-white transition-colors cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>

              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">delete</span>
                <span>{isDeleting ? 'Menghapus...' : 'Ya, Hapus Data'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE / EDIT PROJECT */}
      {isProjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div
            className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-[#efecff] overflow-hidden max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-[#0c1df3] to-[#3b47dc] text-white flex items-center justify-between">
              <h3 className="font-bold text-base text-white">
                {editingProject ? `Edit Project: ${editingProject.id}` : 'Tambah Project Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setIsProjectModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveProject} className="p-6 overflow-y-auto space-y-5">
              {formError && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl font-medium border border-red-200">
                  {formError}
                </div>
              )}

              {/* Section 1: Identitas Instansi & Event */}
              <div className="p-4 bg-[#f8f9fe] rounded-2xl border border-[#efecff] space-y-4">
                <span className="text-xs font-bold text-[#0c1df3] uppercase tracking-wider block">
                  1. Identitas Instansi &amp; Logo
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#454557] mb-1">
                      Nama Instansi / Universitas *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.institutionName || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          institutionName: e.target.value,
                          organization: formData.organization || e.target.value
                        })
                      }
                      placeholder="Contoh: Universitas Indonesia"
                      className="w-full px-3.5 py-2 rounded-xl border border-[#c5c5da] bg-white text-xs font-medium focus:border-[#0c1df3]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#454557] mb-1">
                      Kepanitiaan / Organisasi / BEM *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.organization || ''}
                      onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                      placeholder="Contoh: BEM Fakultas Teknik UI"
                      className="w-full px-3.5 py-2 rounded-xl border border-[#c5c5da] bg-white text-xs font-medium focus:border-[#0c1df3]"
                    />
                  </div>
                </div>

                {/* Logo URL Input & Preview */}
                <div>
                  <label className="block text-xs font-bold text-[#454557] mb-1">
                    URL Logo Instansi / Event
                  </label>
                  <div className="flex items-center gap-3">
                    {formData.logoUrl ? (
                      <img
                        src={formData.logoUrl}
                        alt="Logo preview"
                        className="w-10 h-10 rounded-xl object-cover border border-[#c5c5da] shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-[#efecff] text-[#0c1df3] flex items-center justify-center font-bold text-xs shrink-0">
                        Logo
                      </div>
                    )}
                    <input
                      type="url"
                      value={formData.logoUrl || ''}
                      onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                      placeholder="https://contoh.com/logo.png"
                      className="flex-1 px-3.5 py-2 rounded-xl border border-[#c5c5da] bg-white text-xs font-mono focus:border-[#0c1df3]"
                    />
                  </div>
                  {/* Preset Quick Chips */}
                  <div className="flex items-center gap-2 mt-2 flex-wrap text-[11px]">
                    <span className="text-[#757589]">Pilihan Contoh Logo:</span>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          logoUrl: 'https://images.unsplash.com/photo-1592280771190-3e2e4d571952?w=120&auto=format&fit=crop&q=80'
                        })
                      }
                      className="px-2 py-0.5 rounded bg-white border border-[#efecff] text-[#000cb8] hover:bg-[#efecff] cursor-pointer"
                    >
                      Emblem Kampus
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          logoUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=120&auto=format&fit=crop&q=80'
                        })
                      }
                      className="px-2 py-0.5 rounded bg-white border border-[#efecff] text-[#000cb8] hover:bg-[#efecff] cursor-pointer"
                    >
                      BEM Logo
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          logoUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=120&auto=format&fit=crop&q=80'
                        })
                      }
                      className="px-2 py-0.5 rounded bg-white border border-[#efecff] text-[#000cb8] hover:bg-[#efecff] cursor-pointer"
                    >
                      Komunitas Youth
                    </button>
                  </div>
                </div>
              </div>

              {/* Section 2: Website & Screenshot */}
              <div className="p-4 bg-[#f8f9fe] rounded-2xl border border-[#efecff] space-y-4">
                <span className="text-xs font-bold text-[#0c1df3] uppercase tracking-wider block">
                  2. Website &amp; Screenshot Portofolio
                </span>

                <div>
                  <label className="block text-xs font-bold text-[#454557] mb-1">
                    Link Website Event (URL)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={formData.websiteUrl || ''}
                      onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                      placeholder="https://expotech.eng.ui.ac.id"
                      className="flex-1 px-3.5 py-2 rounded-xl border border-[#c5c5da] bg-white text-xs font-mono focus:border-[#0c1df3]"
                    />
                    {formData.websiteUrl && (
                      <a
                        href={formData.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-2 rounded-xl bg-[#efecff] hover:bg-[#dedaff] text-[#000cb8] text-xs font-bold flex items-center gap-1"
                      >
                        <span>Tes Link</span>
                        <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                      </a>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#454557] mb-1">
                    URL Screenshot Website
                  </label>
                  <input
                    type="url"
                    value={formData.screenshotUrl || ''}
                    onChange={(e) => setFormData({ ...formData, screenshotUrl: e.target.value })}
                    placeholder="https://images.unsplash.com/photo-1540575467063-178a50c2df87"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#c5c5da] bg-white text-xs font-mono focus:border-[#0c1df3]"
                  />

                  {/* Screenshot Thumbnail Preview */}
                  {formData.screenshotUrl && (
                    <div className="mt-2.5 rounded-xl border border-[#c5c5da] overflow-hidden bg-[#191930] h-28 relative">
                      <img
                        src={formData.screenshotUrl}
                        alt="Preview Screenshot"
                        className="w-full h-full object-cover object-top"
                      />
                      <div className="absolute top-1 right-1 px-2 py-0.5 rounded bg-black/60 text-[10px] text-white">
                        Preview Screenshot
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-2 flex-wrap text-[11px]">
                    <span className="text-[#757589]">Pilihan Screenshot Cepat:</span>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          screenshotUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80'
                        })
                      }
                      className="px-2 py-0.5 rounded bg-white border border-[#efecff] text-[#000cb8] hover:bg-[#efecff] cursor-pointer"
                    >
                      Portal Expo
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          screenshotUrl: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&auto=format&fit=crop&q=80'
                        })
                      }
                      className="px-2 py-0.5 rounded bg-white border border-[#efecff] text-[#000cb8] hover:bg-[#efecff] cursor-pointer"
                    >
                      Portal Lomba &amp; Juri
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          screenshotUrl: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&auto=format&fit=crop&q=80'
                        })
                      }
                      className="px-2 py-0.5 rounded bg-white border border-[#efecff] text-[#000cb8] hover:bg-[#efecff] cursor-pointer"
                    >
                      Landing Summit
                    </button>
                  </div>
                </div>
              </div>

              {/* Section 3: Detail Event & Paket */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#454557] mb-1">
                    Kode Tiket / Project ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.id || ''}
                    disabled={!!editingProject}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value.toUpperCase() })}
                    placeholder="Contoh: IVN-2025-FTUI"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#c5c5da] text-xs font-mono font-bold uppercase focus:border-[#0c1df3] focus:ring-1 focus:ring-[#0c1df3]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#454557] mb-1">
                    Paket Layanan
                  </label>
                  <select
                    value={formData.packageType || 'Flow (Multi-Stage Competition)'}
                    onChange={(e) => setFormData({ ...formData, packageType: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#c5c5da] text-xs font-medium focus:border-[#0c1df3]"
                  >
                    <option value="Spark (Presensi & Tiket)">Spark (Presensi &amp; Tiket)</option>
                    <option value="Flow (Multi-Stage Competition)">Flow (Multi-Stage Competition)</option>
                    <option value="Flow (Penjurian Terpusat)">Flow (Penjurian Terpusat)</option>
                    <option value="Spark + WA Bot Reminder">Spark + WA Bot Reminder</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#454557] mb-1">
                  Nama Event *
                </label>
                <input
                  type="text"
                  required
                  value={formData.eventName || ''}
                  onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
                  placeholder="Contoh: National Technology & Business Summit 2025"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#c5c5da] text-xs font-medium focus:border-[#0c1df3]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#454557] mb-1">
                    Tahap Progres (1 - 4)
                  </label>
                  <select
                    value={formData.currentStepIndex || 1}
                    onChange={(e) => setFormData({ ...formData, currentStepIndex: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#c5c5da] text-xs font-medium focus:border-[#0c1df3]"
                  >
                    <option value={1}>Tahap 1: Konsultasi &amp; Kebutuhan</option>
                    <option value={2}>Tahap 2: Setup &amp; Custom Branding</option>
                    <option value={3}>Tahap 3: Event Berjalan &amp; Presensi</option>
                    <option value={4}>Tahap 4: Laporan &amp; LPJ Otomatis</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#454557] mb-1">
                    Badge Status Event
                  </label>
                  <select
                    value={formData.statusBadge || 'Konsultasi & Setup'}
                    onChange={(e) => setFormData({ ...formData, statusBadge: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#c5c5da] text-xs font-medium focus:border-[#0c1df3]"
                  >
                    <option value="Konsultasi & Setup">Konsultasi &amp; Setup</option>
                    <option value="Penjurian Berkas">Penjurian Berkas</option>
                    <option value="Event Berjalan">Event Berjalan</option>
                    <option value="Selesai & LPJ">Selesai &amp; LPJ</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#454557] mb-1">
                    Peserta Terdaftar
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.registeredCount || 0}
                    onChange={(e) => setFormData({ ...formData, registeredCount: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#c5c5da] text-xs font-medium focus:border-[#0c1df3]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#454557] mb-1">
                    Target Peserta
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.targetCount || 500}
                    onChange={(e) => setFormData({ ...formData, targetCount: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#c5c5da] text-xs font-medium focus:border-[#0c1df3]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#454557] mb-1">
                    WA Broadcast Sent
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.whatsappRemindersSent || 0}
                    onChange={(e) => setFormData({ ...formData, whatsappRemindersSent: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#c5c5da] text-xs font-medium focus:border-[#0c1df3]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="cert-ready"
                  checked={Boolean(formData.certificatesReady)}
                  onChange={(e) => setFormData({ ...formData, certificatesReady: e.target.checked })}
                  className="w-4 h-4 text-[#0c1df3] rounded border-gray-300 focus:ring-[#0c1df3]"
                />
                <label htmlFor="cert-ready" className="text-xs font-medium text-[#191930] cursor-pointer">
                  E-Sertifikat otomatis sudah siap diterbitkan / dikirim
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#efecff]">
                <button
                  type="button"
                  onClick={() => setIsProjectModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#c5c5da] text-xs font-semibold text-[#454557] hover:bg-[#efecff] transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#0c1df3] hover:bg-[#000cb8] text-white text-xs font-bold shadow-md transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan ke Database'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
