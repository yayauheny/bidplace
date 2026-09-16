import { designTokens } from '@bidplace/design-tokens';

export const STICKY_DOCK_SURFACE_EASING = 'cubic-bezier(0.2, 0, 0, 1)';

export function stickyDockSurfaceStyle(active: boolean, reducedMotion: boolean) {
  return {
    position: 'absolute' as const,
    inset: 0,
    backgroundColor: designTokens.color.canvas,
    opacity: active ? 1 : 0,
    pointerEvents: 'none' as const,
    transition: reducedMotion
      ? 'none'
      : `opacity ${designTokens.motion.control}ms ${STICKY_DOCK_SURFACE_EASING}`,
  };
}
