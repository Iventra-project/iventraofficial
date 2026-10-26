import { useState, useEffect } from 'react';
import Navbar from './components/Navbar.tsx';
import Hero from './components/Hero.tsx';
import ServicesSection, { ServicesPrices } from './components/ServicesSection.tsx';
import ComparisonSection from './components/ComparisonSection.tsx';
import ProcessSection from './components/ProcessSection.tsx';
import FaqSection from './components/FaqSection.tsx';
import CtaSection from './components/CtaSection.tsx';
import Footer from './components/Footer.tsx';
import FloatingWhatsApp from './components/FloatingWhatsApp.tsx';
import ConsultationModal from './components/ConsultationModal.tsx';
import ProjectTrackerModal from './components/ProjectTrackerModal.tsx';
import InfoModal from './components/InfoModal.tsx';
import AdminDashboard, { SiteSettings } from './components/AdminDashboard.tsx';

export default function App() {
  const [isAdminView, setIsAdminView] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.location.hash === '#admin' ||
      window.location.pathname.startsWith('/admin') ||
      window.location.search.includes('admin')
    );
  });

  const [isConsultationOpen, setIsConsultationOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'spark' | 'flow' | 'bot' | null>('flow');
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);
  const [trackerInitialId, setTrackerInitialId] = useState('IVN-2025-FTUI');
  const [infoModalType, setInfoModalType] = useState<'profile' | 'terms' | 'privacy' | null>(null);

  // Dynamic Site Settings from SQLite (Pricing & Hero Stats)
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({
    sparkPrice: 'Rp 150rb - 300rb',
    sparkPriceNote: '/ event',
    flowPrice: 'Mulai Rp 500.000',
    flowPriceNote: '/ event',
    botPrice: 'Rp 70.000',
    botPriceNote: '/ event',
    totalProjectsHandled: '120+',
    totalActiveUsers: '15.000+'
  });

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setSiteSettings((prev) => ({ ...prev, ...data }));
      }
    } catch (err) {
      console.warn('Could not load site settings from server:', err);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  // Sync hash change
  useEffect(() => {
    const handleHashOrUrlChange = () => {
      const isNowAdmin =
        window.location.hash === '#admin' ||
        window.location.pathname.startsWith('/admin') ||
        window.location.search.includes('admin');
      setIsAdminView(isNowAdmin);
    };

    window.addEventListener('hashchange', handleHashOrUrlChange);
    window.addEventListener('popstate', handleHashOrUrlChange);

    return () => {
      window.removeEventListener('hashchange', handleHashOrUrlChange);
      window.removeEventListener('popstate', handleHashOrUrlChange);
    };
  }, []);

  const handleOpenConsultation = (plan?: 'spark' | 'flow' | 'bot') => {
    setSelectedPlan(plan || 'flow');
    setIsConsultationOpen(true);
  };

  const handleOpenAdmin = () => {
    window.location.hash = '#admin';
    setIsAdminView(true);
  };

  const handleBackToSite = () => {
    if (window.location.hash === '#admin') {
      window.history.pushState(null, '', window.location.pathname);
    }
    setIsAdminView(false);
  };

  const handlePreviewInTracker = (id: string) => {
    setTrackerInitialId(id);
    setIsTrackerOpen(true);
  };

  const pricesForServices: ServicesPrices = {
    sparkPrice: siteSettings.sparkPrice,
    sparkPriceNote: siteSettings.sparkPriceNote,
    flowPrice: siteSettings.flowPrice,
    flowPriceNote: siteSettings.flowPriceNote,
    botPrice: siteSettings.botPrice,
    botPriceNote: siteSettings.botPriceNote
  };

  // If Admin View is active, render the dedicated Admin Dashboard
  if (isAdminView) {
    return (
      <div className="min-h-screen bg-[#f8f9fe] text-[#191930] selection:bg-[#0c1df3] selection:text-white">
        <AdminDashboard
          onBackToSite={handleBackToSite}
          onPreviewProject={handlePreviewInTracker}
          onSettingsUpdated={loadSettings}
        />

        {/* Project Tracker Modal for quick preview */}
        <ProjectTrackerModal
          isOpen={isTrackerOpen}
          initialProjectId={trackerInitialId}
          onClose={() => setIsTrackerOpen(false)}
        />
      </div>
    );
  }

  // Public Landing Page
  return (
    <div className="min-h-screen flex flex-col bg-[#fcf8ff] text-[#191930] selection:bg-[#0c1df3] selection:text-white">
      {/* Sticky Top Bar */}
      <Navbar
        onOpenTracker={() => {
          setTrackerInitialId('IVN-2025-FTUI');
          setIsTrackerOpen(true);
        }}
        onOpenConsultation={() => handleOpenConsultation()}
        onOpenProfile={() => setInfoModalType('profile')}
        onOpenAdmin={handleOpenAdmin}
      />

      {/* Main Content Sections */}
      <main className="w-full pt-20 bg-[#fcf8ff] flex-1">
        <Hero
          onOpenConsultation={() => handleOpenConsultation()}
          onSelectCampus={() => {}}
          totalProjectsHandled={siteSettings.totalProjectsHandled}
          totalActiveUsers={siteSettings.totalActiveUsers}
        />

        <ServicesSection
          onSelectPlan={(planId) => handleOpenConsultation(planId)}
          prices={pricesForServices}
        />

        <ComparisonSection />

        <ProcessSection />

        <FaqSection />

        <CtaSection
          onOpenConsultation={() => handleOpenConsultation()}
        />
      </main>

      {/* Footer */}
      <Footer
        onOpenConsultation={() => handleOpenConsultation()}
        onOpenTerms={(type) => setInfoModalType(type)}
        onOpenAdmin={handleOpenAdmin}
      />

      {/* Floating WhatsApp Action Pill */}
      <FloatingWhatsApp
        onOpenConsultation={() => handleOpenConsultation()}
      />

      {/* Modals */}
      <ConsultationModal
        isOpen={isConsultationOpen}
        onClose={() => setIsConsultationOpen(false)}
        initialPlan={selectedPlan}
      />

      <ProjectTrackerModal
        isOpen={isTrackerOpen}
        initialProjectId={trackerInitialId}
        onClose={() => setIsTrackerOpen(false)}
      />

      <InfoModal
        type={infoModalType}
        onClose={() => setInfoModalType(null)}
      />
    </div>
  );
}
