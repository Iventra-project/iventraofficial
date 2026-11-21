import { useEffect, useState } from 'react';

/**
 * Top skeleton progress bar that sweeps smoothly across the top of the viewport
 * during site load or route navigation.
 */
export function TopSkeletonBar({ isLoading }: { isLoading: boolean }) {
  const [progress, setProgress] = useState(15);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (isLoading) {
      setVisible(true);
      setProgress(25);
      const timer1 = setTimeout(() => setProgress(65), 180);
      const timer2 = setTimeout(() => setProgress(88), 450);
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    } else {
      setProgress(100);
      const hideTimer = setTimeout(() => {
        setVisible(false);
      }, 400);
      return () => clearTimeout(hideTimer);
    }
  }, [isLoading]);

  if (!visible) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[99999] h-[3px] bg-transparent pointer-events-none"
      role="progressbar"
      aria-label="Loading website"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={progress}
    >
      {/* Progress Track */}
      <div
        className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-400 shadow-[0_0_12px_rgba(37,99,235,0.85)] transition-all ease-out"
        style={{
          width: `${progress}%`,
          transitionDuration: progress === 100 ? '250ms' : '500ms',
          opacity: progress === 100 ? 0 : 1
        }}
      />
    </div>
  );
}

/**
 * Modern minimalist initial skeleton loader with shimmer bars.
 * Fades out gracefully once the initial page data is ready.
 */
export function InitialSiteSkeleton({ isVisible }: { isVisible: boolean }) {
  const [mounted, setMounted] = useState(true);

  useEffect(() => {
    if (!isVisible) {
      const timer = setTimeout(() => setMounted(false), 500);
      return () => clearTimeout(timer);
    } else {
      setMounted(true);
    }
  }, [isVisible]);

  if (!mounted) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col bg-white transition-opacity duration-500 ease-out pointer-events-none ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Top glowing skeleton bar */}
      <div className="h-1 w-full bg-slate-100 skeleton-shimmer" />

      {/* Navbar Skeleton */}
      <div className="w-full border-b border-slate-100 px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg skeleton-shimmer" />
          <div className="w-24 h-5 rounded-md skeleton-shimmer" />
        </div>
        <div className="hidden md:flex items-center gap-6">
          <div className="w-16 h-4 rounded-md skeleton-shimmer" />
          <div className="w-20 h-4 rounded-md skeleton-shimmer" />
          <div className="w-16 h-4 rounded-md skeleton-shimmer" />
        </div>
        <div className="flex items-center gap-3">
          <div className="w-20 h-8 rounded-lg skeleton-shimmer" />
          <div className="w-28 h-8 rounded-lg skeleton-shimmer" />
        </div>
      </div>

      {/* Hero Skeleton Content */}
      <div className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 pt-16 sm:pt-24 flex flex-col items-center text-center">
        {/* Pill Badge Skeleton */}
        <div className="w-48 h-7 rounded-full skeleton-shimmer mb-6" />

        {/* Big Title Skeleton Bars */}
        <div className="w-3/4 max-w-2xl h-10 sm:h-12 rounded-xl skeleton-shimmer mb-3" />
        <div className="w-1/2 max-w-md h-10 sm:h-12 rounded-xl skeleton-shimmer mb-6" />

        {/* Subtitle Skeleton Bars */}
        <div className="w-4/5 max-w-lg h-4 rounded-md skeleton-shimmer mb-2.5" />
        <div className="w-3/5 max-w-md h-4 rounded-md skeleton-shimmer mb-8" />

        {/* Action Buttons Skeleton */}
        <div className="flex items-center gap-3 mb-12">
          <div className="w-36 h-11 rounded-xl skeleton-shimmer" />
          <div className="w-36 h-11 rounded-xl skeleton-shimmer" />
        </div>

        {/* Card Mockup Skeleton Frame */}
        <div className="w-full max-w-3xl h-64 sm:h-80 rounded-2xl border border-slate-200/80 bg-slate-50/50 p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-200/60 pb-4">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-slate-200" />
              <div className="w-3 h-3 rounded-full bg-slate-200" />
              <div className="w-3 h-3 rounded-full bg-slate-200" />
            </div>
            <div className="w-32 h-4 rounded-md skeleton-shimmer" />
          </div>
          <div className="grid grid-cols-3 gap-4 my-auto">
            <div className="h-24 rounded-xl skeleton-shimmer" />
            <div className="h-24 rounded-xl skeleton-shimmer" />
            <div className="h-24 rounded-xl skeleton-shimmer" />
          </div>
        </div>
      </div>
    </div>
  );
}
