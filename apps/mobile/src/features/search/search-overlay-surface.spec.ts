import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const root = dirname(fileURLToPath(import.meta.url));

describe('Search overlay surface', () => {
  it('paints the web overlay in the same commit via a body portal, not Modal', () => {
    const web = readFileSync(join(root, 'search-overlay-surface.web.tsx'), 'utf8');
    const native = readFileSync(join(root, 'search-overlay-surface.tsx'), 'utf8');
    expect(web).toContain('createPortal');
    expect(web).toContain('document.body');
    expect(web).not.toContain('Modal');
    expect(native).toContain('Modal');
    expect(native).toContain('SearchOverlayLayer');
  });

  it('lets useDismissibleOverlay own Search outside dismissal on web', () => {
    const layer = readFileSync(join(root, 'search-overlay-layer.tsx'), 'utf8');
    expect(layer).toContain("Platform.OS === 'web' ? undefined : onClose");
    expect(layer).not.toContain('<OverlayDimmer onPress={onClose} />');
  });
});
