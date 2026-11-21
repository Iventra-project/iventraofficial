import 'dotenv/config';
import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import {
  getAllProjects,
  getProjectById,
  saveProject,
  deleteProject,
  getAllConsultations,
  createConsultation,
  updateConsultationStatus,
  deleteConsultation,
  getStats,
  seedDemoData,
  getSiteSettings,
  updateSiteSettings,
  getWorkspaceBySlug,
  getPublishedWorkspaceBySlug,
  incrementWorkspaceStat,
  createWorkspaceSubmission,
  getAdminStats,
  getAllUsersWithTraffic,
  getAdminUserDetail,
  adminCreateUser,
  adminUpdateUser,
  adminDeleteUser,
  getAllWorkspacesForAdmin,
  adminUpdateWorkspace,
  adminDeleteWorkspace,
  getUserByEmail,
  getAllTemplates,
  saveTemplate,
  deleteTemplate,
  upgradeUserPlan
} from './db.ts';
import authRouter from './auth.ts';
import workspacesRouter from './workspaces.ts';
import jwt from 'jsonwebtoken';

export const apiApp = express();

apiApp.use(express.json());

// ─── Auth & Workspace routes ──────────────────────────────────────────────────
apiApp.use('/api/auth', authRouter);
apiApp.use('/api/workspaces', workspacesRouter);

apiApp.post('/api/checkout/spark-pro', (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (email) {
      upgradeUserPlan(email.trim().toLowerCase(), 'spark_pro');
    }
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ─── Public Event Renderer API ────────────────────────────────────────────────
// GET /api/public/events/:slug
// Fetches the public published event configuration, or draft configuration if authorized preview
apiApp.get('/api/public/events/:slug', (req: Request, res: Response) => {
  try {
    const slug = req.params.slug;
    const isPreview = req.query.preview === 'true';

    const ws = getWorkspaceBySlug(slug);
    if (!ws) {
      return res.status(404).json({ error: 'Event tidak ditemukan atau tautan tidak valid.' });
    }

    // If preview requested, verify ownership token
    if (isPreview) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.slice(7);
        try {
          const JWT_SECRET = process.env.JWT_SECRET || 'iventra-dev-secret-change-in-production';
          const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
          if (payload.userId === ws.owner_id) {
            let configObj = null;
            try {
              configObj = ws.draft_config ? JSON.parse(ws.draft_config) : null;
            } catch {}
            return res.json({
              id: ws.id,
              name: ws.name,
              slug: ws.slug,
              status: ws.status,
              template_id: ws.template_id,
              isPreview: true,
              config: configObj,
              updatedAt: ws.updated_at
            });
          }
        } catch {}
      }
    }

    // Public view: check if published
    if (ws.status !== 'published' || !ws.published_config) {
      return res.status(403).json({
        isDraft: true,
        name: ws.name,
        slug: ws.slug,
        message: 'Website event ini masih dalam tahap penyusunan draft dan belum dipublikasikan untuk publik.'
      });
    }

    let configObj = null;
    try {
      configObj = JSON.parse(ws.published_config);
    } catch {}

    // Track public visitor count
    try {
      incrementWorkspaceStat(ws.id, 'visitors');
    } catch {}

    return res.json({
      id: ws.id,
      name: ws.name,
      slug: ws.slug,
      status: ws.status,
      template_id: ws.template_id,
      isPreview: false,
      config: configObj,
      publishedAt: ws.published_at,
      updatedAt: ws.updated_at
    });
  } catch (error: any) {
    console.error('[public/events]', error);
    return res.status(500).json({ error: 'Gagal memuat halaman event.' });
  }
});

// ─── POST /api/public/events/:slug/track-start ────────────────────────────────
// Track when a visitor opens or starts filling the form
apiApp.post('/api/public/events/:slug/track-start', (req: Request, res: Response) => {
  try {
    const ws = getWorkspaceBySlug(req.params.slug);
    if (ws) {
      incrementWorkspaceStat(ws.id, 'form_started');
    }
    return res.json({ success: true });
  } catch {
    return res.json({ success: false });
  }
});

// ─── POST /api/public/events/:slug/submit ─────────────────────────────────────
// Submit form response for an event
apiApp.post('/api/public/events/:slug/submit', (req: Request, res: Response) => {
  try {
    const ws = getWorkspaceBySlug(req.params.slug);
    if (!ws) {
      return res.status(404).json({ error: 'Event tidak ditemukan.' });
    }

    const { formData, paymentProofUrl, paymentEmail } = req.body;

    const submission = createWorkspaceSubmission({
      workspace_id: ws.id,
      data: formData || {},
      status: 'submitted',
      payment_proof_url: paymentProofUrl,
      payment_email: paymentEmail
    });

    return res.status(201).json({
      success: true,
      submissionId: submission.id,
      message: 'Pendaftaran berhasil dikirim!'
    });
  } catch (error: any) {
    console.error('[public/submit]', error);
    return res.status(500).json({ error: 'Gagal memproses pendaftaran.' });
  }
});

// ─── ADMIN REAL CRUD & MONITORING ENDPOINTS ───────────────────────────────────

// GET /api/admin/stats - Real aggregated metrics
apiApp.get('/api/admin/stats', (_req: Request, res: Response) => {
  try {
    const stats = getAdminStats();
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/users - Users with traffic tracking (500 vs 5000 limits)
apiApp.get('/api/admin/users', (_req: Request, res: Response) => {
  try {
    const users = getAllUsersWithTraffic();
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/users/:id - User detailed profile with workspaces and traffic breakdown
apiApp.get('/api/admin/users/:id', (req: Request, res: Response) => {
  try {
    const detail = getAdminUserDetail(req.params.id);
    if (!detail) {
      return res.status(404).json({ error: 'User tidak ditemukan.' });
    }
    res.json(detail);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/users - Create new user
apiApp.post('/api/admin/users', async (req: Request, res: Response) => {
  try {
    const { name, email, password, plan, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nama, email, dan password wajib diisi.' });
    }
    const existing = getUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'Email sudah terdaftar.' });
    }
    const password_hash = await bcrypt.hash(password, 10);
    const created = adminCreateUser({
      name,
      email,
      password_hash,
      plan: plan === 'spark_pro' ? 'spark_pro' : 'spark',
      role: role === 'admin' ? 'admin' : 'user'
    });
    res.status(201).json(created);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/admin/users/:id - Update user
apiApp.put('/api/admin/users/:id', async (req: Request, res: Response) => {
  try {
    const { name, email, plan, role, password } = req.body;
    let password_hash: string | undefined = undefined;
    if (password && password.trim().length >= 6) {
      password_hash = await bcrypt.hash(password.trim(), 10);
    }
    const updated = adminUpdateUser(req.params.id, {
      name,
      email,
      plan,
      role,
      password_hash
    });
    if (!updated) {
      return res.status(404).json({ error: 'User tidak ditemukan.' });
    }
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/admin/users/:id - Delete user
apiApp.delete('/api/admin/users/:id', (req: Request, res: Response) => {
  try {
    const success = adminDeleteUser(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'User tidak ditemukan.' });
    }
    res.json({ success: true, message: 'User dan seluruh data terkait berhasil dihapus.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/workspaces - All workspaces across users
apiApp.get('/api/admin/workspaces', (_req: Request, res: Response) => {
  try {
    const workspaces = getAllWorkspacesForAdmin();
    res.json(workspaces);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/admin/workspaces/:id - Admin update workspace
apiApp.put('/api/admin/workspaces/:id', (req: Request, res: Response) => {
  try {
    const { name, slug, status, service_type, visitors_count } = req.body;
    const updated = adminUpdateWorkspace(req.params.id, {
      name,
      slug,
      status,
      service_type,
      visitors_count: visitors_count !== undefined ? Number(visitors_count) : undefined
    });
    if (!updated) {
      return res.status(404).json({ error: 'Workspace tidak ditemukan.' });
    }
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/admin/workspaces/:id - Admin delete workspace
apiApp.delete('/api/admin/workspaces/:id', (req: Request, res: Response) => {
  try {
    const success = adminDeleteWorkspace(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Workspace tidak ditemukan.' });
    }
    res.json({ success: true, message: 'Workspace berhasil dihapus.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ─── Overview stats (admin legacy fallback) ───────────────────────────────────
apiApp.get('/api/stats', (_req: Request, res: Response) => {
  try {
    const stats = getStats();
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Projects CRUD
apiApp.get('/api/projects', (_req: Request, res: Response) => {
  try {
    const projects = getAllProjects();
    res.json(projects);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiApp.get('/api/projects/:id', (req: Request, res: Response) => {
  try {
    const project = getProjectById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(project);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiApp.post('/api/projects', (req: Request, res: Response) => {
  try {
    const body = req.body;
    if (!body.eventName || !body.organization) {
      return res.status(400).json({ error: 'Event name & organization are required' });
    }

    // Auto-generate ID if not provided
    if (!body.id) {
      const year = new Date().getFullYear();
      const code = (body.organization || 'ORG')
        .replace(/[^A-Za-z0-9]/g, '')
        .toUpperCase()
        .slice(0, 4);
      body.id = `IVN-${year}-${code || 'EVT'}`;
    }

    // Default steps if not provided
    if (!body.steps || !Array.isArray(body.steps) || body.steps.length === 0) {
      body.steps = [
        { id: 1, title: 'Konsultasi & Kebutuhan', desc: 'Brief alur & form pendaftaran', status: 'completed' },
        { id: 2, title: 'Setup & Custom Branding', desc: 'Deploy domain & integrasi logo institusi', status: 'current' },
        { id: 3, title: 'Event Berjalan & Presensi', desc: 'Scan QR tiket & live analytics panitia', status: 'upcoming' },
        { id: 4, title: 'Laporan & LPJ Otomatis', desc: 'Ekspor rekap kehadiran & e-sertifikat', status: 'upcoming' }
      ];
    }

    const saved = saveProject(body);
    res.status(201).json(saved);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiApp.put('/api/projects/:id', (req: Request, res: Response) => {
  try {
    const body = req.body;
    body.id = req.params.id;
    const saved = saveProject(body);
    res.json(saved);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiApp.delete('/api/projects/:id', (req: Request, res: Response) => {
  try {
    const deleted = deleteProject(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json({ success: true, message: `Project ${req.params.id} deleted` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Consultations / Leads CRUD
apiApp.get('/api/consultations', (_req: Request, res: Response) => {
  try {
    const consultations = getAllConsultations();
    res.json(consultations);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiApp.post('/api/consultations', (req: Request, res: Response) => {
  try {
    const body = req.body;
    if (!body.name || !body.contactNumber) {
      return res.status(400).json({ error: 'Name and contact number are required' });
    }
    const created = createConsultation(body);
    res.status(201).json(created);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiApp.patch('/api/consultations/:id', (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    const updated = updateConsultationStatus(id, status);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiApp.delete('/api/consultations/:id', (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const deleted = deleteConsultation(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Consultation not found' });
    }
    res.json({ success: true, message: `Consultation #${id} deleted` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Reset demo data
apiApp.post('/api/reset-demo', (_req: Request, res: Response) => {
  try {
    seedDemoData();
    res.json({ success: true, message: 'Database reset to demo state' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Site Settings (Hero Stats & Package Prices)
apiApp.get('/api/settings', (_req: Request, res: Response) => {
  try {
    const settings = getSiteSettings();
    res.json(settings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiApp.post('/api/settings', (req: Request, res: Response) => {
  try {
    const updated = updateSiteSettings(req.body);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ─── Templates API (Admin & Showcase) ─────────────────────────────────────────
apiApp.get('/api/templates', (_req: Request, res: Response) => {
  try {
    const list = getAllTemplates();
    res.json(list.map(t => {
      let conf = {};
      try {
        conf = typeof t.default_config === 'string' ? JSON.parse(t.default_config) : t.default_config;
      } catch {}
      return {
        id: t.id,
        name: t.name,
        badge: t.badge,
        category: t.category,
        description: t.description,
        previewGradient: t.preview_gradient,
        recommendedFor: t.recommended_for,
        defaultConfig: conf,
        created_at: t.created_at
      };
    }));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiApp.post('/api/templates', (req: Request, res: Response) => {
  try {
    const { id, name, badge, category, description, previewGradient, recommendedFor, defaultConfig } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Nama template wajib diisi.' });
    }
    const cleanId = (id || name).toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').trim();
    const success = saveTemplate({
      id: cleanId,
      name,
      badge: badge || 'Event',
      category: category || 'Umum',
      description: description || '',
      preview_gradient: previewGradient || 'from-[#0c1df3] via-[#3b47dc] to-[#1e1b4b]',
      recommended_for: recommendedFor || '',
      default_config: JSON.stringify(defaultConfig || {}),
      created_at: new Date().toISOString()
    });
    if (!success) {
      return res.status(500).json({ error: 'Gagal menyimpan template ke database.' });
    }
    res.json({ success: true, id: cleanId });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiApp.delete('/api/templates/:id', (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const success = deleteTemplate(id);
    if (!success) {
      return res.status(404).json({ error: 'Template tidak ditemukan atau gagal dihapus.' });
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

