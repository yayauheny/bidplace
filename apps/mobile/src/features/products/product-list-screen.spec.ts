import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const screen = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), 'product-list-screen.tsx'),
  'utf8',
);

describe('Works catalog back', () => {
  it('uses history-first Back, not a category scenario flag', () => {
    expect(screen).toContain('router.canGoBack()');
    expect(screen).toContain('navigateWorksCatalogBack(router)');
    expect(screen).toContain('testID="works-back"');
    expect(screen).not.toContain('worksCatalogShowsBack');
    expect(screen).not.toContain('fromSearch');
    expect(screen).not.toContain('returnToSearch');
    expect(screen).not.toMatch(/state\.category.*works-back|works-back.*state\.category/);
  });
});
