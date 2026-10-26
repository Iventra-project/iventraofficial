import { useState } from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function Logo({ className = '', size = 'md' }: LogoProps) {
  const [imageError, setImageError] = useState(false);

  const dimClass = size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-12 h-12' : 'w-10 h-10';

  if (imageError) {
    return (
      <div
        className={`${dimClass} rounded-xl bg-gradient-to-tr from-[#0c1df3] to-[#3b47dc] flex items-center justify-center text-white shadow-sm shrink-0 ${className}`}
        aria-hidden="true"
      >
        <span className="material-symbols-outlined text-[20px]">event</span>
      </div>
    );
  }

  return (
    <img
      src="https://lh3.googleusercontent.com/aida-public/AB6AXuBVXBTW2IForbJpqne6y_GU3i0FAYDxU2ifS7WPSwfUkYj02UFD9MmQRilTwJrUUTT4CsZRD6e36mmeUfhCpFlNkZ11mggJ-30J5rKNcqULtnarVbnJ4ut3lFiDjYIVCJHolBJUvAgaOzbZSrFpZKK7Z_kwNpQnxC3h8x9LncyPoR_ela6wBJk8tfxDJmU02e9Gug7LYXT0gZz1JUfGgIAxAalrQVUTaZlz6elfEkeHsdxl2XMfyQaP--PQ6phhG4EKFuU"
      alt="Iventra Logo"
      className={`${dimClass} rounded-xl object-contain shadow-sm shrink-0 ${className}`}
      onError={() => setImageError(true)}
      referrerPolicy="no-referrer"
    />
  );
}
