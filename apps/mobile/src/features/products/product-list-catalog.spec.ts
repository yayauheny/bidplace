import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const catalogScreen = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), 'product-list-screen.tsx'),
  'utf8',
);

describe('Works catalog chrome', () => {
  it('hides the HIDE_FOR_FIRST_MVP catalog-segment tab', () => {
    expect(catalogScreen).not.toContain('Все работы');
    expect(catalogScreen).not.toContain('profileTab');
  });

  it('keeps title, intro, Filter/Sort, then cards', () => {
    const render = catalogScreen.slice(catalogScreen.indexOf('return ('));
    expect(render).toMatch(
      /role="screenTitle"[\s\S]+\{WORKS_CATALOG_INTRO\}[\s\S]+<FilterSortBar[\s\S]+\{content\}/,
    );
  });
});
