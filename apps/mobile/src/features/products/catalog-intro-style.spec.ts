import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { designTokens } from '@bidplace/design-tokens';

const here = dirname(fileURLToPath(import.meta.url));
const authors = readFileSync(
  join(here, '../sellers/public-authors-screen.tsx'),
  'utf8',
);
const works = readFileSync(join(here, 'product-list-screen.tsx'), 'utf8');

describe('Catalog intro typography', () => {
  it('reuses bodySmall ink without changing textSecondary', () => {
    expect(designTokens.typography.bodySmall).toMatchObject({
      fontFamily: 'Inter_400Regular',
      fontSize: 14,
      lineHeight: 20,
      letterSpacing: -0.14,
      fontWeight: '400',
    });
    expect(designTokens.color.ink).toBe('#2A2A2A');
    expect(designTokens.color.textSecondary).toBe('#8A8A8A');
  });

  it('does not apply the secondary tone to catalog intros', () => {
    expect(authors).toContain('<AppText role="bodySmall">{AUTHORS_CATALOG_INTRO}</AppText>');
    expect(works).toContain('<AppText role="bodySmall">{WORKS_CATALOG_INTRO}</AppText>');
    expect(authors).not.toMatch(
      /role="bodySmall" tone="secondary"[\s\S]{0,80}AUTHORS_CATALOG_INTRO/,
    );
    expect(works).not.toMatch(
      /role="bodySmall" tone="secondary"[\s\S]{0,80}WORKS_CATALOG_INTRO/,
    );
  });
});
