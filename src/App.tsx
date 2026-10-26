import { useState } from 'react';
import Navbar from './components/Navbar.tsx';
import Hero from './components/Hero.tsx';
import ServicesSection from './components/ServicesSection.tsx';
import ComparisonSection from './components/ComparisonSection.tsx';
import ProcessSection from './components/ProcessSection.tsx';
import FaqSection from './components/FaqSection.tsx';
import CtaSection from './components/CtaSection.tsx';
import Footer from './components/Footer.tsx';
import FloatingWhatsApp from './components/FloatingWhatsApp.tsx';
import ConsultationModal from './components/ConsultationModal.tsx';
import ProjectTrackerModal from './components/ProjectTrackerModal.tsx';
import InfoModal from './components/InfoModal.tsx';

export default function App() {
  const [isConsultationOpen, setIsConsultationOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'spark' | 'flow' | 'bot' | null>('flow');
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);
  const [infoModalType, setInfoModalType] = useState<'profile' | 'terms' | 'privacy' | null>(null);

  const handleOpenConsultation = (plan?: 'spark' | 'flow' | 'bot') => {
    setSelectedPlan(plan || 'flow');
    setIsConsultationOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fcf8ff] text-[#191930] selection:bg-[#0c1df3] selection:text-white">
      {/* Sticky Top Bar */}
      <Navbar
        onOpenTracker={() => setIsTrackerOpen(true)}
        onOpenConsultation={() => handleOpenConsultation()}
        onOpenProfile={() => setInfoModalType('profile')}
      />

      {/* Main Content Sections */}
      <main className="w-full pt-20 bg-[#fcf8ff] flex-1">
        <Hero
          onOpenConsultation={() => handleOpenConsultation()}
          onSelectCampus={() => {}}
        />

        <ServicesSection
          onSelectPlan={(planId) => handleOpenConsultation(planId)}
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
        onClose={() => setIsTrackerOpen(false)}
      />

      <InfoModal
        type={infoModalType}
        onClose={() => setInfoModalType(null)}
      />
    </div>
  );
}
