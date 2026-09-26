import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const here = dirname(fileURLToPath(import.meta.url));
const worksPane = readFileSync(join(here, 'WorksSearchPane.tsx'), 'utf8');
const authorsPane = readFileSync(join(here, 'AuthorsSearchPane.tsx'), 'utf8');

describe('search result pagination', () => {
  it.each([
    ['works', worksPane],
    ['authors', authorsPane],
  ])('%s exposes the next-page action without replacing loaded rows', (_, pane) => {
    expect(pane).toContain('label="Показать ещё"');
    expect(pane).toContain('hasNextPage');
    expect(pane).toContain('isFetchingNextPage');
    expect(pane).toContain('fetchNextPage()');
  });
});
