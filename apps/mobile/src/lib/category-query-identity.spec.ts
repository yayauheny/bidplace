import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { categoryKeys } from './query-cache';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const categoryConsumers = [
  join(root, 'features/products/product-list-screen.tsx'),
  join(root, 'features/sellers/product-draft-screen.tsx'),
  join(root, 'features/sellers/public-seller-screen.tsx'),
  join(root, 'features/search/panes/CategoriesSearchPane.tsx'),
];

describe('category query identity', () => {
  it('uses one exported key for every live category consumer', () => {
    expect(categoryKeys.all).toEqual(['categories']);
    for (const consumer of categoryConsumers) {
      expect(readFileSync(consumer, 'utf8')).toContain('categoryKeys.all');
    }
  });
});
