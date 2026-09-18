import { type ReactNode } from 'react';
import { createPortal } from 'react-dom';

import { designTokens } from '@bidplace/design-tokens';

import { SearchOverlayLayer } from './search-overlay-layer';

export function SearchOverlaySurface({
  surfaceId,
  children,
}: {
  surfaceId: string;
  onClose: () => void;
  children: ReactNode;
}) {
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: designTokens.layer.modal,
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <SearchOverlayLayer surfaceId={surfaceId}>{children}</SearchOverlayLayer>
    </div>,
    document.body,
  );
}
