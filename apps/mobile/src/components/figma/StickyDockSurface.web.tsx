import { useReducedMotion } from '../../lib/reduced-motion';
import { stickyDockSurfaceStyle } from './sticky-dock-surface-style.web';

export function StickyDockSurface({
  active,
  testID = 'sticky-dock-surface',
}: {
  active: boolean;
  testID?: string;
}) {
  const reducedMotion = useReducedMotion();
  return (
    <div
      data-testid={testID}
      data-active={active ? 'true' : 'false'}
      aria-hidden="true"
      style={stickyDockSurfaceStyle(active, reducedMotion)}
    />
  );
}
