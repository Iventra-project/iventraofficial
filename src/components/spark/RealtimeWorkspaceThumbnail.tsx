import { useState, useRef, useLayoutEffect, useMemo, Component, type ReactNode } from 'react';
import type { Workspace } from '../UserDashboard.tsx';
import type { EventConfig } from '../../types/builder.ts';
import { getTemplateById } from '../../types/builder.ts';
import SparkEventRenderer from './SparkEventRenderer.tsx';

interface RealtimeWorkspaceThumbnailProps {
  workspace: Workspace;
  className?: string;
}

// Error boundary to gracefully catch any rendering errors inside the thumbnail
class ThumbnailErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: any) {
    console.warn('RealtimeWorkspaceThumbnail render error:', error);
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export default function RealtimeWorkspaceThumbnail({ workspace, className = '' }: RealtimeWorkspaceThumbnailProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(280);

  // Measure the container width accurately for dynamic scale computation
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const measure = () => {
      if (el.clientWidth > 0) {
        setContainerWidth(el.clientWidth);
      }
    };

    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Parse draft_config safely in real-time
  const config = useMemo<EventConfig>(() => {
    if (workspace.draft_config) {
      try {
        const parsed = typeof workspace.draft_config === 'string'
          ? JSON.parse(workspace.draft_config)
          : workspace.draft_config;

        if (parsed && typeof parsed === 'object') {
          return {
            ...parsed,
            eventName: parsed.eventName || workspace.name || 'Untitled Event',
            theme: {
              primaryColor: parsed.theme?.primaryColor || '#1f2de6',
              accentColor: parsed.theme?.accentColor || '#3b47dc',
              bgStyle: parsed.theme?.bgStyle || 'clean-white',
              fontFamily: parsed.theme?.fontFamily || 'sans',
              ...parsed.theme
            }
          };
        }
      } catch (err) {
        console.warn('Failed to parse draft_config for thumbnail', err);
      }
    }

    // Fallback to template preset if draft_config is empty
    const tmpl = getTemplateById(workspace.template_id);
    if (tmpl) {
      return {
        ...tmpl.defaultConfig,
        eventName: workspace.name || tmpl.defaultConfig.eventName
      };
    }

    return {
      eventName: workspace.name || 'Untitled Event',
      tagline: '',
      description: workspace.description || '',
      theme: {
        primaryColor: '#1f2de6',
        accentColor: '#3b47dc',
        bgStyle: 'clean-white',
        fontFamily: 'sans'
      },
      blocks: []
    };
  }, [workspace.draft_config, workspace.template_id, workspace.name, workspace.description]);

  // Virtual desktop width for rendering (1024px standard viewport)
  const baseWidth = 1024;
  const scale = containerWidth > 0 ? containerWidth / baseWidth : 0.273;
  const targetHeight = 148;
  const virtualHeight = Math.ceil(targetHeight / scale);

  const fallbackView = (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#f8f9fb] text-[#8c93a0] p-4 text-center">
      <span className="material-symbols-outlined text-[28px] mb-1 text-[#1f2de6]">web</span>
      <span className="font-heading font-bold text-xs text-[#0b0c0e] truncate max-w-full">
        {workspace.name}
      </span>
      <span className="text-[10px] font-mono text-[#8c93a0] mt-0.5">Iventra Spark Live</span>
    </div>
  );

  return (
    <div
      ref={containerRef}
      className={`w-full h-[148px] bg-white relative overflow-hidden select-none pointer-events-none border-b border-[#e2e5ea] ${className}`}
    >
      <ThumbnailErrorBoundary fallback={fallbackView}>
        <div
          style={{
            width: `${baseWidth}px`,
            height: `${virtualHeight}px`,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            pointerEvents: 'none',
            userSelect: 'none',
            position: 'absolute',
            top: 0,
            left: 0,
            overflow: 'hidden'
          }}
        >
          <SparkEventRenderer config={config} isPreviewMode={true} slug={workspace.slug || undefined} />
        </div>
      </ThumbnailErrorBoundary>

      {/* Subtle bottom gradient shadow overlay for crisp separation */}
      <div className="absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-black/5 to-transparent pointer-events-none" />
    </div>
  );
}
