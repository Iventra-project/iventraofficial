interface FloatingWhatsAppProps {
  onOpenConsultation: () => void;
}

export default function FloatingWhatsApp({ onOpenConsultation }: FloatingWhatsAppProps) {
  return (
    <aside className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-40 flex items-center justify-center">
      <div
        className="absolute -inset-2 rounded-full bg-[#0c1df3]/25 blur-md animate-pulse pointer-events-none"
        aria-hidden="true"
      />
      <button
        type="button"
        onClick={onOpenConsultation}
        aria-label="Chat WhatsApp Panitia"
        title="Chat WhatsApp Panitia"
        className="relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-[#0c1df3] to-[#3b47dc] text-white shadow-[0_16px_40px_-6px_rgba(12,29,243,0.4)] hover:scale-105 active:scale-95 transition-transform duration-200 cursor-pointer"
      >
        <span className="material-symbols-outlined text-[28px]" aria-hidden="true">
          chat
        </span>
      </button>
    </aside>
  );
}
