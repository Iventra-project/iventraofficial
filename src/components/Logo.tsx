import { useState } from 'react';

interface LogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export default function Logo({ className = '', size = 'md' }: LogoProps) {
  const [imageError, setImageError] = useState(false);

  const dimClass =
    size === 'xs'
      ? 'w-6 h-6'
      : size === 'sm'
      ? 'w-8 h-8'
      : size === 'lg'
      ? 'w-12 h-12'
      : size === 'xl'
      ? 'w-16 h-16'
      : 'w-10 h-10';

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
      src="/assets/LogoIventraOfc.svg"
      alt="Iventra Logo"
      className={`${dimClass} object-contain shrink-0 ${className}`}
      onError={() => setImageError(true)}
    />
  );
}
