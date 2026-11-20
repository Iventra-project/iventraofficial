import { useState, useEffect, useMemo, useRef } from 'react';
import type { EventConfig, EventBlock, FormFieldItem, FormStep } from '../../types/builder.ts';

interface SubmissionItem {
  id: string;
  workspace_id: string;
  data: string;
  parsedData: Record<string, any>;
  status: 'submitted' | 'verified' | 'rejected' | string;
  payment_proof_url?: string | null;
  payment_email?: string | null;
  created_at: string;
}

interface WorkspaceStats {
  visitors: number;
  form_started: number;
  submitted: number;
}

interface WorkspaceAnalyticsDashboardProps {
  workspaceId: string;
  workspaceSlug?: string;
  workspaceName?: string;
  config: EventConfig;
  token: string;
}

interface FormTableInfo {
  id: string;
  title: string;
  hasPayment: boolean;
  columns: string[];
  submissions: SubmissionItem[];
}

export default function WorkspaceAnalyticsDashboard({
  workspaceId,
  workspaceSlug,
  workspaceName,
  config,
  token
}: WorkspaceAnalyticsDashboardProps) {
  const [stats, setStats] = useState<WorkspaceStats>({ visitors: 0, form_started: 0, submitted: 0 });
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQueries, setSearchQueries] = useState<Record<string, string>>({});
  const [statusFilters, setStatusFilters] = useState<Record<string, string>>({});
  const [activeProofModal, setActiveProofModal] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const authHeaders = useMemo(() => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  }), [token]);

  const showNotification = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  // Close export menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/dashboard`, {
        headers: authHeaders
      });
      if (res.ok) {
        const json = await res.json();
        setStats(json.stats || { visitors: 0, form_started: 0, submitted: 0 });
        setSubmissions(json.submissions || []);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [workspaceId]);

  // Extract all form blocks from config
  const formBlocks = useMemo<EventBlock[]>(() => {
    return (config.blocks || []).filter((b) => b.type === 'form' && b.enabled !== false);
  }, [config.blocks]);

  // Build table info for each form block
  const formTables: FormTableInfo[] = useMemo(() => {
    if (formBlocks.length === 0) {
      // Fallback: 1 general table for submissions
      const uniqueKeys: string[] = [];
      submissions.forEach((s) => {
        if (s.parsedData && typeof s.parsedData === 'object') {
          Object.keys(s.parsedData).forEach((k) => {
            if (!uniqueKeys.includes(k) && !['_formId', 'proof', 'bukti_pembayaran', 'paymentProof', 'email_konfirmasi', 'paymentEmail'].includes(k)) {
              uniqueKeys.push(k);
            }
          });
        }
      });
      return [
        {
          id: 'general',
          title: 'Formulir Pendaftaran',
          hasPayment: submissions.some((s) => Boolean(s.payment_proof_url)),
          columns: uniqueKeys.length > 0 ? uniqueKeys : ['Nama Lengkap', 'Email', 'Nomor Kontak'],
          submissions
        }
      ];
    }

    return formBlocks.map((fb, idx) => {
      const steps: FormStep[] = fb.data?.steps || [];
      const hasPayment = steps.some((s: any) => s.type === 'payment' || s.payment?.enabled);

      const fields: FormFieldItem[] = steps.flatMap((s: any) => s.fields || []);
      const fieldLabels: string[] = [];
      fields.forEach((f) => {
        if (f.label && !fieldLabels.includes(f.label)) {
          fieldLabels.push(f.label);
        }
      });

      // Match submissions for this specific form strictly
      const matchingSubmissions = submissions.filter((sub) => {
        if (sub.parsedData?._formId) {
          return sub.parsedData._formId === fb.id;
        }
        if (formBlocks.length === 1) return true;

        // If no _formId recorded, match against field labels
        const subKeys = Object.keys(sub.parsedData || {});
        const myMatchCount = fieldLabels.filter((lbl) => subKeys.includes(lbl)).length;
        if (myMatchCount === 0) return false;

        const otherScores = formBlocks
          .filter((other) => other.id !== fb.id)
          .map((other) => {
            const otherFields: FormFieldItem[] = (other.data?.steps || []).flatMap((s: any) => s.fields || []);
            const otherLabels = otherFields.map((f) => f.label);
            return otherLabels.filter((lbl) => subKeys.includes(lbl)).length;
          });
        const maxOtherScore = Math.max(0, ...otherScores);
        return myMatchCount > maxOtherScore;
      });

      return {
        id: fb.id,
        title: fb.data?.title || fb.data?.headline || `Formulir #${idx + 1}`,
        hasPayment,
        columns: fieldLabels.length > 0 ? fieldLabels : ['Nama Lengkap', 'Email', 'Nomor Kontak'],
        submissions: matchingSubmissions
      };
    });
  }, [formBlocks, submissions]);

  const handleUpdateStatus = async (subId: string, newStatus: string) => {
    setUpdatingId(subId);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/submissions/${subId}`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setSubmissions((prev) =>
          prev.map((s) => (s.id === subId ? { ...s, status: newStatus } : s))
        );
        showNotification(newStatus === 'verified' ? 'Status di-ACC' : 'Status diperbarui');
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteSubmission = async (subId: string) => {
    if (!window.confirm('Hapus data formulir ini?')) return;
    setUpdatingId(subId);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/submissions/${subId}`, {
        method: 'DELETE',
        headers: authHeaders
      });
      if (res.ok) {
        setSubmissions((prev) => prev.filter((s) => s.id !== subId));
        showNotification('Data formulir dihapus');
      }
    } catch (err) {
      console.error('Failed to delete submission:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  // ─── EXPORT PDF ─────────────────────────────────────────────────────────────
  const handleExportPdf = () => {
    const printWindow = window.open('', '_blank', 'width=950,height=750');
    if (!printWindow) {
      alert('Pop-up terblokir. Izinkan pop-up untuk mengekspor PDF.');
      return;
    }

    const eventTitle = workspaceName || config.eventName || 'Event';
    const dateStr = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    let tablesHtml = '';
    formTables.forEach((table) => {
      const thHtml = table.columns
        .map(
          (col) =>
            `<th style="border:1px solid #cbd5e1;padding:8px 10px;text-align:left;background:#f8fafc;font-size:11px;font-weight:700;">${col}</th>`
        )
        .join('');

      const rowsHtml = table.submissions
        .map((sub, i) => {
          const time = new Date(sub.created_at).toLocaleString('id-ID');
          const tdHtml = table.columns
            .map((col) => {
              let val = sub.parsedData?.[col];
              if (val === undefined || val === null) {
                const lowerCol = col.toLowerCase();
                const matchKey = Object.keys(sub.parsedData || {}).find(
                  (k) => k.toLowerCase().includes(lowerCol) || lowerCol.includes(k.toLowerCase())
                );
                val = matchKey ? sub.parsedData[matchKey] : '-';
              }
              return `<td style="border:1px solid #e2e8f0;padding:8px 10px;font-size:11px;">${val}</td>`;
            })
            .join('');

          const statusBadge =
            sub.status === 'verified'
              ? '<span style="color:#059669;font-weight:700;">ACC</span>'
              : sub.status === 'rejected'
              ? '<span style="color:#e11d48;font-weight:700;">Ditolak</span>'
              : '<span style="color:#d97706;font-weight:700;">Menunggu</span>';

          return `<tr>
            <td style="border:1px solid #e2e8f0;padding:8px 10px;text-align:center;font-size:11px;">${i + 1}</td>
            <td style="border:1px solid #e2e8f0;padding:8px 10px;font-size:11px;white-space:nowrap;">${time}</td>
            ${tdHtml}
            <td style="border:1px solid #e2e8f0;padding:8px 10px;font-size:11px;">${statusBadge}</td>
          </tr>`;
        })
        .join('');

      tablesHtml += `
        <div style="margin-top:24px;margin-bottom:28px;">
          <h3 style="font-size:14px;font-weight:800;color:#0f172a;margin-bottom:8px;">${table.title} (${table.submissions.length})</h3>
          <table style="width:100%;border-collapse:collapse;font-family:sans-serif;">
            <thead>
              <tr>
                <th style="border:1px solid #cbd5e1;padding:8px 10px;text-align:center;background:#f8fafc;font-size:11px;width:35px;">No</th>
                <th style="border:1px solid #cbd5e1;padding:8px 10px;text-align:left;background:#f8fafc;font-size:11px;width:110px;">Waktu</th>
                ${thHtml}
                <th style="border:1px solid #cbd5e1;padding:8px 10px;text-align:left;background:#f8fafc;font-size:11px;width:80px;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml || '<tr><td colspan="100" style="padding:16px;text-align:center;color:#94a3b8;font-size:11px;">Belum ada data respons</td></tr>'}
            </tbody>
          </table>
        </div>
      `;
    });

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${eventTitle} - Laporan Data Formulir</title>
          <style>
            @page { size: A4 landscape; margin: 12mm; }
            body { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; padding: 10px; margin: 0; }
            .header-bar { border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 18px; display: flex; justify-content: space-between; align-items: flex-end; }
            .metrics-row { display: flex; gap: 14px; margin-bottom: 20px; }
            .metric-box { border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px 14px; flex: 1; }
            .metric-title { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 4px; }
            .metric-value { font-size: 20px; font-weight: 900; color: #0f172a; }
          </style>
        </head>
        <body>
          <div class="header-bar">
            <div>
              <h1 style="font-size:18px;font-weight:900;margin:0;">${eventTitle}</h1>
              <p style="font-size:11px;color:#64748b;margin:4px 0 0 0;">Laporan Data Formulir Peserta • ${dateStr}</p>
            </div>
            <div style="font-size:11px;font-weight:900;letter-spacing:1px;color:#1e40af;">IVENTRA</div>
          </div>

          <div class="metrics-row">
            <div class="metric-box">
              <div class="metric-title">Total Mengunjungi</div>
              <div class="metric-value">${stats.visitors.toLocaleString('id-ID')}</div>
            </div>
            <div class="metric-box">
              <div class="metric-title">Mengisi Form</div>
              <div class="metric-value">${stats.form_started.toLocaleString('id-ID')}</div>
            </div>
            <div class="metric-box">
              <div class="metric-title">Submit</div>
              <div class="metric-value">${stats.submitted.toLocaleString('id-ID')}</div>
            </div>
          </div>

          ${tablesHtml}

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 250);
            };
          <\/script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // ─── EXPORT PNG ─────────────────────────────────────────────────────────────
  const handleExportPng = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Calculate canvas size
    const width = 1200;
    let totalRows = 0;
    formTables.forEach((t) => {
      totalRows += Math.max(t.submissions.length, 1) + 3;
    });
    const height = Math.max(650, 260 + totalRows * 36);

    canvas.width = width;
    canvas.height = height;

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Header bar
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.fillText(workspaceName || config.eventName || 'Event', 40, 50);

    ctx.fillStyle = '#64748b';
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText(`Laporan Data Formulir • ${new Date().toLocaleDateString('id-ID')}`, 40, 72);

    ctx.fillStyle = '#2563eb';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('IVENTRA', width - 40, 50);
    ctx.textAlign = 'left';

    // Divider
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(40, 90);
    ctx.lineTo(width - 40, 90);
    ctx.stroke();

    // 3 Stat cards
    const cardWidth = (width - 80 - 32) / 3;
    const statItems = [
      { label: 'TOTAL MENGUNJUNGI', val: stats.visitors.toLocaleString('id-ID'), color: '#2563eb' },
      { label: 'MENGISI FORM', val: stats.form_started.toLocaleString('id-ID'), color: '#d97706' },
      { label: 'SUBMIT', val: stats.submitted.toLocaleString('id-ID'), color: '#059669' }
    ];

    statItems.forEach((st, idx) => {
      const cx = 40 + idx * (cardWidth + 16);
      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.roundRect(cx, 105, cardWidth, 65, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 10px system-ui, sans-serif';
      ctx.fillText(st.label, cx + 16, 128);

      ctx.fillStyle = st.color;
      ctx.font = 'bold 20px system-ui, sans-serif';
      ctx.fillText(st.val, cx + 16, 154);
    });

    let currentY = 205;

    // Draw each form table
    formTables.forEach((table) => {
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 15px system-ui, sans-serif';
      ctx.fillText(`${table.title} (${table.submissions.length})`, 40, currentY);
      currentY += 16;

      // Table Header Row
      const tableW = width - 80;
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(40, currentY, tableW, 28);
      ctx.strokeStyle = '#cbd5e1';
      ctx.strokeRect(40, currentY, tableW, 28);

      const colCount = Math.min(table.columns.length, 5);
      const colWidth = (tableW - 140) / colCount;

      ctx.fillStyle = '#334155';
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.fillText('No', 50, currentY + 18);

      table.columns.slice(0, colCount).forEach((c, ci) => {
        ctx.fillText(c, 80 + ci * colWidth, currentY + 18);
      });
      ctx.fillText('Status', tableW - 30, currentY + 18);

      currentY += 28;

      if (table.submissions.length === 0) {
        ctx.fillStyle = '#94a3b8';
        ctx.font = '11px system-ui, sans-serif';
        ctx.fillText('Belum ada data respons pendaftaran', 50, currentY + 22);
        currentY += 36;
      } else {
        table.submissions.slice(0, 15).forEach((sub, ri) => {
          ctx.fillStyle = ri % 2 === 0 ? '#ffffff' : '#f8fafc';
          ctx.fillRect(40, currentY, tableW, 26);
          ctx.strokeStyle = '#e2e8f0';
          ctx.strokeRect(40, currentY, tableW, 26);

          ctx.fillStyle = '#64748b';
          ctx.font = '11px system-ui, sans-serif';
          ctx.fillText(String(ri + 1), 50, currentY + 17);

          table.columns.slice(0, colCount).forEach((c, ci) => {
            const val = String(sub.parsedData?.[c] || '-');
            const truncated = val.length > 25 ? val.substring(0, 22) + '...' : val;
            ctx.fillStyle = '#1e293b';
            ctx.fillText(truncated, 80 + ci * colWidth, currentY + 17);
          });

          const statusText = sub.status === 'verified' ? 'ACC' : sub.status === 'rejected' ? 'Ditolak' : 'Menunggu';
          ctx.fillStyle = sub.status === 'verified' ? '#059669' : sub.status === 'rejected' ? '#e11d48' : '#d97706';
          ctx.font = 'bold 11px system-ui, sans-serif';
          ctx.fillText(statusText, tableW - 30, currentY + 17);

          currentY += 26;
        });
      }

      currentY += 24;
    });

    // Download canvas as PNG
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `laporan_${workspaceSlug || workspaceId}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-b from-blue-50/20 via-white to-slate-50 text-slate-900 select-none">
      {/* Toast Notification */}
      {feedbackMsg && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-lg shadow-blue-500/30 animate-[fadeIn_0.2s_ease-out]">
          {feedbackMsg}
        </div>
      )}

      {/* CONTAINER DENGAN MARGIN KANAN-KIRI AGAR TIDAK TERLALU LEBAR */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-7 space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-slate-200/80">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {workspaceName || config.eventName || 'Dashboard Workspace'}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                {workspaceSlug || 'draft'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Statistik kunjungan &amp; tabel data respons formulir pendaftaran
            </p>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto shrink-0">
            <button
              type="button"
              onClick={loadData}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
              title="Segarkan Data"
            >
              <span className={`material-symbols-outlined text-[16px] ${isLoading ? 'animate-spin' : ''}`}>
                refresh
              </span>
              <span>Segarkan</span>
            </button>

            {/* Tombol Export dengan Dropdown PDF / PNG */}
            <div className="relative" ref={exportMenuRef}>
              <button
                type="button"
                onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-blue-500/20"
              >
                <span className="material-symbols-outlined text-[16px]">download</span>
                <span>Export</span>
                <span className="material-symbols-outlined text-[16px] leading-none">expand_more</span>
              </button>

              {isExportMenuOpen && (
                <div className="absolute right-0 mt-1.5 w-44 bg-white rounded-xl shadow-xl border border-blue-100 py-1 z-50 animate-[scaleUp_0.1s_ease-out]">
                  <button
                    type="button"
                    onClick={() => {
                      setIsExportMenuOpen(false);
                      handleExportPdf();
                    }}
                    className="w-full px-3 py-2 text-left text-xs font-bold text-slate-700 hover:bg-blue-50 flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <span className="material-symbols-outlined text-[17px] text-rose-500">picture_as_pdf</span>
                    <span>Export PDF (.pdf)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsExportMenuOpen(false);
                      handleExportPng();
                    }}
                    className="w-full px-3 py-2 text-left text-xs font-bold text-slate-700 hover:bg-blue-50 flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <span className="material-symbols-outlined text-[17px] text-blue-600">image</span>
                    <span>Export PNG (.png)</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── 3 STAT CARDS (Clean White & Soft Blue) ─────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Total Mengunjungi */}
          <div className="bg-white rounded-2xl p-5 border border-blue-100/80 shadow-xs flex flex-col justify-between hover:border-blue-200 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Total Mengunjungi
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">visibility</span>
              </div>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-black text-slate-900 tracking-tight">
                {stats.visitors.toLocaleString('id-ID')}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Pengunjung halaman event</div>
            </div>
          </div>

          {/* Card 2: Mengisi Form */}
          <div className="bg-white rounded-2xl p-5 border border-indigo-100/80 shadow-xs flex flex-col justify-between hover:border-indigo-200 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Mengisi Form
              </span>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">edit_note</span>
              </div>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-black text-slate-900 tracking-tight">
                {stats.form_started.toLocaleString('id-ID')}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Membuka formulir pendaftaran</div>
            </div>
          </div>

          {/* Card 3: Submit */}
          <div className="bg-white rounded-2xl p-5 border border-emerald-100/80 shadow-xs flex flex-col justify-between hover:border-emerald-200 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Submit
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">task_alt</span>
              </div>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-black text-slate-900 tracking-tight">
                {stats.submitted.toLocaleString('id-ID')}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Pendaftaran selesai dikirim</div>
            </div>
          </div>
        </div>

        {/* ─── TABEL DATA (MENYESUAIKAN JUMLAH FORM) ────────────────────────── */}
        <div className="space-y-6">
          {formTables.map((table, tIdx) => {
            const tableSearch = (searchQueries[table.id] || '').toLowerCase();
            const tableStatus = statusFilters[table.id] || 'all';

            const filteredSubs = table.submissions.filter((sub) => {
              if (tableStatus !== 'all' && sub.status !== tableStatus) return false;
              if (!tableSearch) return true;
              const matchInParsed = Object.values(sub.parsedData || {}).some((v) =>
                String(v).toLowerCase().includes(tableSearch)
              );
              const matchInMeta =
                sub.id.toLowerCase().includes(tableSearch) ||
                (sub.payment_email && sub.payment_email.toLowerCase().includes(tableSearch));
              return matchInParsed || matchInMeta;
            });

            return (
              <div
                key={table.id || tIdx}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden"
              >
                {/* Table Header & Toolbar */}
                <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    <h2 className="font-bold text-sm text-slate-900">
                      {table.title}
                    </h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                      {filteredSubs.length} data
                    </span>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {/* Search */}
                    <div className="relative flex-1 sm:w-56">
                      <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[16px]">
                        search
                      </span>
                      <input
                        type="text"
                        value={searchQueries[table.id] || ''}
                        onChange={(e) =>
                          setSearchQueries((prev) => ({ ...prev, [table.id]: e.target.value }))
                        }
                        placeholder="Cari peserta..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white"
                      />
                    </div>

                    {/* Filter Status */}
                    <select
                      value={statusFilters[table.id] || 'all'}
                      onChange={(e) =>
                        setStatusFilters((prev) => ({ ...prev, [table.id]: e.target.value }))
                      }
                      className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-600 cursor-pointer"
                    >
                      <option value="all">Semua Status</option>
                      <option value="submitted">Menunggu</option>
                      <option value="verified">ACC</option>
                      <option value="rejected">Ditolak</option>
                    </select>
                  </div>
                </div>

                {/* Table Data */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                        <th className="py-2.5 px-4 w-12 text-center">No</th>
                        <th className="py-2.5 px-4 whitespace-nowrap">Waktu</th>
                        {table.columns.map((col) => (
                          <th key={col} className="py-2.5 px-4 whitespace-nowrap">
                            {col}
                          </th>
                        ))}
                        {(table.hasPayment || table.submissions.some((s) => s.payment_proof_url)) && (
                          <th className="py-2.5 px-4 whitespace-nowrap">Bukti Bayar</th>
                        )}
                        <th className="py-2.5 px-4 whitespace-nowrap">Status</th>
                        <th className="py-2.5 px-4 text-right whitespace-nowrap">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {filteredSubs.length === 0 ? (
                        <tr>
                          <td
                            colSpan={table.columns.length + 5}
                            className="py-10 text-center text-slate-400"
                          >
                            <span className="material-symbols-outlined text-3xl text-slate-300 block mb-1">
                              inbox
                            </span>
                            <span>Belum ada data pendaftaran pada formulir ini.</span>
                          </td>
                        </tr>
                      ) : (
                        filteredSubs.map((sub, idx) => {
                          const dateStr = new Date(sub.created_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          });
                          const timeStr = new Date(sub.created_at).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit'
                          });

                          return (
                            <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-2.5 px-4 text-center text-slate-400 font-mono text-[11px]">
                                {idx + 1}
                              </td>
                              <td className="py-2.5 px-4 whitespace-nowrap">
                                <div className="font-semibold text-slate-800">{dateStr}</div>
                                <div className="text-[10px] text-slate-400">{timeStr}</div>
                              </td>

                              {/* Form Field Values */}
                              {table.columns.map((col) => {
                                let val = sub.parsedData?.[col];
                                if (val === undefined || val === null) {
                                  const lowerCol = col.toLowerCase();
                                  const matchKey = Object.keys(sub.parsedData || {}).find(
                                    (k) =>
                                      k.toLowerCase().includes(lowerCol) ||
                                      lowerCol.includes(k.toLowerCase())
                                  );
                                  val = matchKey ? sub.parsedData[matchKey] : '-';
                                }
                                return (
                                  <td
                                    key={col}
                                    className="py-2.5 px-4 max-w-[200px] truncate"
                                    title={String(val)}
                                  >
                                    {String(val)}
                                  </td>
                                );
                              })}

                              {/* Bukti Bayar */}
                              {(table.hasPayment || table.submissions.some((s) => s.payment_proof_url)) && (
                                <td className="py-2.5 px-4 whitespace-nowrap">
                                  {sub.payment_proof_url ? (
                                    <button
                                      type="button"
                                      onClick={() => setActiveProofModal(sub.payment_proof_url || null)}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-[11px] cursor-pointer transition-colors"
                                    >
                                      <span className="material-symbols-outlined text-[13px]">image</span>
                                      <span>Bukti</span>
                                    </button>
                                  ) : (
                                    <span className="text-slate-400 text-[11px]">-</span>
                                  )}
                                </td>
                              )}

                              {/* Status Badge */}
                              <td className="py-2.5 px-4 whitespace-nowrap">
                                {sub.status === 'verified' ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <span className="material-symbols-outlined text-[12px]">check_circle</span>
                                    <span>ACC</span>
                                  </span>
                                ) : sub.status === 'rejected' ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                    <span className="material-symbols-outlined text-[12px]">cancel</span>
                                    <span>Ditolak</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                    <span className="material-symbols-outlined text-[12px]">schedule</span>
                                    <span>Menunggu</span>
                                  </span>
                                )}
                              </td>

                              {/* Actions */}
                              <td className="py-2.5 px-4 text-right whitespace-nowrap">
                                <div className="inline-flex items-center gap-1 justify-end">
                                  {sub.status !== 'verified' && (
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateStatus(sub.id, 'verified')}
                                      disabled={updatingId === sub.id}
                                      className="p-1 rounded text-emerald-600 hover:bg-emerald-50 cursor-pointer transition-colors"
                                      title="ACC Pendaftaran"
                                    >
                                      <span className="material-symbols-outlined text-[17px]">check</span>
                                    </button>
                                  )}

                                  {sub.status !== 'rejected' && (
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateStatus(sub.id, 'rejected')}
                                      disabled={updatingId === sub.id}
                                      className="p-1 rounded text-amber-600 hover:bg-amber-50 cursor-pointer transition-colors"
                                      title="Tolak Pendaftaran"
                                    >
                                      <span className="material-symbols-outlined text-[17px]">close</span>
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => handleDeleteSubmission(sub.id)}
                                    disabled={updatingId === sub.id}
                                    className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors"
                                    title="Hapus Data"
                                  >
                                    <span className="material-symbols-outlined text-[17px]">delete</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Table Footer */}
                <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
                  <span>
                    Menampilkan {filteredSubs.length} dari {table.submissions.length} data respons
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── PAYMENT PROOF MODAL ────────────────────────────────────────── */}
      {activeProofModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-[scaleUp_0.15s_ease-out]">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-800">Bukti Pembayaran</h3>
              <button
                type="button"
                onClick={() => setActiveProofModal(null)}
                className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <div className="p-4 bg-slate-900 flex items-center justify-center max-h-[70vh] overflow-auto">
              <img
                src={activeProofModal}
                alt="Bukti Transfer"
                className="max-h-[60vh] max-w-full object-contain rounded-lg"
              />
            </div>
            <div className="p-3 bg-slate-50 flex items-center justify-end gap-2 border-t border-slate-200">
              <a
                href={activeProofModal}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors"
              >
                Buka Ukuran Penuh ↗
              </a>
              <button
                type="button"
                onClick={() => setActiveProofModal(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-100 cursor-pointer transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
