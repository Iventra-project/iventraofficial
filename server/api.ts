import express, { Request, Response } from 'express';
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
  updateSiteSettings
} from './db.ts';

export const apiApp = express();

apiApp.use(express.json());

// Overview stats
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

