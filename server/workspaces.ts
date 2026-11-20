import express, { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import {
  getWorkspacesByOwner,
  getWorkspaceById,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
  saveWorkspaceBuilderConfig,
  publishWorkspace,
  unpublishWorkspace,
  getWorkspaceBySlug,
  getWorkspaceStats,
  getWorkspaceSubmissions,
  updateWorkspaceSubmissionStatus,
  deleteWorkspaceSubmission,
  createWorkspaceSubmission,
  incrementWorkspaceStat
} from './db.ts';
import { requireAuth } from './auth.ts';

const router = express.Router();

// All workspace routes require authentication
router.use(requireAuth);

const VALID_STATUS = ['draft', 'published', 'archived'];
const VALID_SERVICE_TYPES = ['spark', 'expert'];

// ─── GET /api/workspaces ───────────────────────────────────────────────────────
// List all workspaces owned by authenticated user
router.get('/', (req: Request, res: Response) => {
  try {
    const workspaces = getWorkspacesByOwner(req.user!.userId);
    return res.json(workspaces);
  } catch (error: any) {
    console.error('[workspaces/list]', error);
    return res.status(500).json({ error: 'Gagal memuat workspace.' });
  }
});

// ─── POST /api/workspaces ─────────────────────────────────────────────────────
// Create a new workspace (optionally with template_id, slug, and initial draft_config)
router.post('/', (req: Request, res: Response) => {
  try {
    const { name, service_type, description, template_id, draft_config, slug } = req.body;

    // Server-side validation
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ error: 'Nama workspace minimal 2 karakter.' });
    }
    if (name.trim().length > 100) {
      return res.status(400).json({ error: 'Nama workspace maksimal 100 karakter.' });
    }
    if (service_type && !VALID_SERVICE_TYPES.includes(service_type)) {
      return res.status(400).json({ error: `Tipe layanan tidak valid. Pilih: ${VALID_SERVICE_TYPES.join(', ')}.` });
    }

    if (slug) {
      const existingSlug = getWorkspaceBySlug(slug.trim());
      if (existingSlug) {
        return res.status(409).json({ error: `Slug "${slug}" sudah digunakan oleh event lain.` });
      }
    }

    const id = randomUUID();
    const ws = createWorkspace({
      id,
      owner_id: req.user!.userId,
      name: name.trim(),
      service_type: service_type || 'spark',
      description: description?.trim() || undefined,
      template_id: template_id || 'blank',
      slug: slug?.trim() || undefined,
      draft_config: typeof draft_config === 'string' ? draft_config : (draft_config ? JSON.stringify(draft_config) : '')
    });

    return res.status(201).json(ws);
  } catch (error: any) {
    console.error('[workspaces/create]', error);
    return res.status(500).json({ error: 'Gagal membuat workspace.' });
  }
});

// ─── GET /api/workspaces/:id ──────────────────────────────────────────────────
// Get single workspace detail (ownership enforced by query)
router.get('/:id', (req: Request, res: Response) => {
  try {
    const ws = getWorkspaceById(req.params.id, req.user!.userId);
    if (!ws) {
      return res.status(404).json({ error: 'Workspace tidak ditemukan.' });
    }
    return res.json(ws);
  } catch (error: any) {
    console.error('[workspaces/detail]', error);
    return res.status(500).json({ error: 'Gagal memuat workspace.' });
  }
});

// ─── GET /api/workspaces/:id/dashboard ─────────────────────────────────────────
// Get workspace statistics & form submissions
router.get('/:id/dashboard', (req: Request, res: Response) => {
  try {
    const ws = getWorkspaceById(req.params.id, req.user!.userId);
    if (!ws) {
      return res.status(404).json({ error: 'Workspace tidak ditemukan.' });
    }

    const stats = getWorkspaceStats(ws.id);
    const submissions = getWorkspaceSubmissions(ws.id);

    return res.json({
      workspace: ws,
      stats,
      submissions: submissions.map(sub => {
        let parsedData = {};
        try {
          parsedData = JSON.parse(sub.data);
        } catch {
          parsedData = { raw: sub.data };
        }
        return {
          ...sub,
          parsedData
        };
      })
    });
  } catch (error: any) {
    console.error('[workspaces/dashboard]', error);
    return res.status(500).json({ error: 'Gagal memuat data dashboard workspace.' });
  }
});

// ─── PATCH /api/workspaces/:id/submissions/:subId ──────────────────────────────
// Update verification status (e.g. 'verified', 'rejected', 'submitted')
router.patch('/:id/submissions/:subId', (req: Request, res: Response) => {
  try {
    const ws = getWorkspaceById(req.params.id, req.user!.userId);
    if (!ws) {
      return res.status(404).json({ error: 'Workspace tidak ditemukan.' });
    }

    const { status } = req.body;
    if (!status || !['submitted', 'verified', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status tidak valid.' });
    }

    const updated = updateWorkspaceSubmissionStatus(req.params.subId, status);
    if (!updated) {
      return res.status(404).json({ error: 'Data formulir tidak ditemukan.' });
    }

    return res.json({ success: true, status });
  } catch (error: any) {
    console.error('[workspaces/submissions/patch]', error);
    return res.status(500).json({ error: 'Gagal memperbarui status.' });
  }
});

// ─── DELETE /api/workspaces/:id/submissions/:subId ────────────────────────────
// Delete submission
router.delete('/:id/submissions/:subId', (req: Request, res: Response) => {
  try {
    const ws = getWorkspaceById(req.params.id, req.user!.userId);
    if (!ws) {
      return res.status(404).json({ error: 'Workspace tidak ditemukan.' });
    }

    const deleted = deleteWorkspaceSubmission(req.params.subId);
    if (!deleted) {
      return res.status(404).json({ error: 'Data formulir tidak ditemukan.' });
    }

    return res.json({ success: true });
  } catch (error: any) {
    console.error('[workspaces/submissions/delete]', error);
    return res.status(500).json({ error: 'Gagal menghapus data formulir.' });
  }
});

// ─── POST /api/workspaces/:id/submissions/seed-demo ────────────────────────────
// Seed simulation submission data for demonstration
router.post('/:id/submissions/seed-demo', (req: Request, res: Response) => {
  try {
    const ws = getWorkspaceById(req.params.id, req.user!.userId);
    if (!ws) {
      return res.status(404).json({ error: 'Workspace tidak ditemukan.' });
    }

    const samples = [
      {
        'Nama Lengkap': 'Aditya Pratama',
        'Email': 'aditya.p@gmail.com',
        'Nomor WhatsApp': '081234567890',
        'Nama Tim': 'Tim Garuda Cyber',
        'Kategori': 'Mahasiswa',
        'Institusi': 'Universitas Indonesia'
      },
      {
        'Nama Lengkap': 'Siti Rahmawati',
        'Email': 'siti.rahma@campus.ac.id',
        'Nomor WhatsApp': '085712345678',
        'Nama Tim': 'Inovasi Muda',
        'Kategori': 'Pelajar SMA/SMK',
        'Institusi': 'SMK Negeri 1 Surabaya'
      },
      {
        'Nama Lengkap': 'Budi Santoso',
        'Email': 'budi.santoso@techmail.id',
        'Nomor WhatsApp': '082198765432',
        'Nama Tim': 'Solo Project',
        'Kategori': 'Umum / Profesional',
        'Institusi': 'PT Teknologi Maju'
      }
    ];

    for (const sample of samples) {
      createWorkspaceSubmission({
        workspace_id: ws.id,
        data: sample,
        status: 'submitted',
        payment_email: sample['Email'],
        payment_proof_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&auto=format&fit=crop&q=80'
      });
    }

    incrementWorkspaceStat(ws.id, 'visitors');
    incrementWorkspaceStat(ws.id, 'visitors');
    incrementWorkspaceStat(ws.id, 'visitors');
    incrementWorkspaceStat(ws.id, 'visitors');
    incrementWorkspaceStat(ws.id, 'visitors');
    incrementWorkspaceStat(ws.id, 'form_started');
    incrementWorkspaceStat(ws.id, 'form_started');

    return res.json({ success: true, message: 'Data simulasi berhasil ditambahkan.' });
  } catch (error: any) {
    console.error('[workspaces/seed-demo]', error);
    return res.status(500).json({ error: 'Gagal menambahkan simulasi.' });
  }
});

// ─── PUT /api/workspaces/:id/builder ──────────────────────────────────────────
// Save builder draft configuration & event details
router.put('/:id/builder', (req: Request, res: Response) => {
  try {
    const { name, slug, description, template_id, draft_config } = req.body;

    if (!draft_config) {
      return res.status(400).json({ error: 'Data konfigurasi (draft_config) wajib disertakan.' });
    }

    // Check slug uniqueness if changed
    if (slug) {
      const existingSlug = getWorkspaceBySlug(slug.trim());
      if (existingSlug && existingSlug.id !== req.params.id) {
        return res.status(409).json({ error: `Slug "${slug}" sudah digunakan oleh event lain. Silakan pilih slug berbeda.` });
      }
    }

    const stringConfig = typeof draft_config === 'string' ? draft_config : JSON.stringify(draft_config);

    const updated = saveWorkspaceBuilderConfig(req.params.id, req.user!.userId, {
      name: name?.trim(),
      slug: slug?.trim(),
      description: description !== undefined ? description?.trim() : undefined,
      template_id: template_id?.trim(),
      draft_config: stringConfig
    });

    if (!updated) {
      return res.status(404).json({ error: 'Workspace tidak ditemukan.' });
    }

    return res.json(updated);
  } catch (error: any) {
    console.error('[workspaces/builder]', error);
    return res.status(500).json({ error: 'Gagal menyimpan draft builder.' });
  }
});

// ─── POST /api/workspaces/:id/publish ─────────────────────────────────────────
// Publish workspace to live URL
router.post('/:id/publish', (req: Request, res: Response) => {
  try {
    const result = publishWorkspace(req.params.id, req.user!.userId);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    return res.json({
      success: true,
      message: 'Website event berhasil dipublikasikan!',
      workspace: result.workspace
    });
  } catch (error: any) {
    console.error('[workspaces/publish]', error);
    return res.status(500).json({ error: 'Gagal mempublikasikan website event.' });
  }
});

// ─── POST /api/workspaces/:id/unpublish ───────────────────────────────────────
// Revert published workspace to draft
router.post('/:id/unpublish', (req: Request, res: Response) => {
  try {
    const result = unpublishWorkspace(req.params.id, req.user!.userId);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    return res.json({
      success: true,
      message: 'Website event telah ditarik kembali ke mode Draft.',
      workspace: result.workspace
    });
  } catch (error: any) {
    console.error('[workspaces/unpublish]', error);
    return res.status(500).json({ error: 'Gagal mengubah status ke draft.' });
  }
});

// ─── PUT /api/workspaces/:id ─────────────────────────────────────────────────
// Update workspace basic info (ownership enforced)
router.put('/:id', (req: Request, res: Response) => {
  try {
    const { name, status, description, slug, template_id } = req.body;

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length < 2) {
        return res.status(400).json({ error: 'Nama workspace minimal 2 karakter.' });
      }
      if (name.trim().length > 100) {
        return res.status(400).json({ error: 'Nama workspace maksimal 100 karakter.' });
      }
    }

    if (status !== undefined && !VALID_STATUS.includes(status)) {
      return res.status(400).json({ error: `Status tidak valid. Pilih: ${VALID_STATUS.join(', ')}.` });
    }

    if (slug) {
      const existingSlug = getWorkspaceBySlug(slug.trim());
      if (existingSlug && existingSlug.id !== req.params.id) {
        return res.status(409).json({ error: `Slug "${slug}" sudah digunakan.` });
      }
    }

    const updated = updateWorkspace(req.params.id, req.user!.userId, {
      name: name?.trim(),
      status,
      description: description?.trim(),
      slug: slug?.trim(),
      template_id: template_id?.trim()
    });

    if (!updated) {
      return res.status(404).json({ error: 'Workspace tidak ditemukan.' });
    }

    return res.json(updated);
  } catch (error: any) {
    console.error('[workspaces/update]', error);
    return res.status(500).json({ error: 'Gagal memperbarui workspace.' });
  }
});

// ─── DELETE /api/workspaces/:id ───────────────────────────────────────────────
// Delete workspace (ownership enforced)
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const deleted = deleteWorkspace(req.params.id, req.user!.userId);
    if (!deleted) {
      return res.status(404).json({ error: 'Workspace tidak ditemukan.' });
    }
    return res.json({ success: true, message: 'Workspace berhasil dihapus.' });
  } catch (error: any) {
    console.error('[workspaces/delete]', error);
    return res.status(500).json({ error: 'Gagal menghapus workspace.' });
  }
});

export default router;
