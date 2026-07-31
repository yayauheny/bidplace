import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { productSchema } from '../src/product';

const seedSource = readFileSync(
  resolve(__dirname, '../../database/prisma/seed.js'),
  'utf8',
);

const seedProductPublicIds = [
  ...seedSource.matchAll(
    /createProductWithImages\(\{[\s\S]*?publicId:\s*'([^']+)'/g,
  ),
]
  .map((match) => match[1])
  .filter(
    (publicId): publicId is string => publicId?.startsWith('seed') ?? false,
  );

describe('demo seed contract', () => {
  it('uses public Product IDs accepted by the Product schema', () => {
    expect(seedProductPublicIds).toEqual([
      'seedSched01',
      'seedLive002',
      'seedEnded03',
      'seedPend004',
    ]);

    for (const publicId of seedProductPublicIds) {
      const result = productSchema.safeParse({
        id: '00000000-0000-4000-8000-000000000000',
        publicId,
        sellerProfileId: '00000000-0000-4000-8000-000000000001',
        categoryId: null,
        title: null,
        story: null,
        technique: null,
        materials: null,
        dimensions: null,
        weight: null,
        year: null,
        condition: null,
        uniqueness: null,
        provenance: null,
        city: null,
        deliveryInfo: null,
        publishedAt: null,
        status: 'DRAFT',
        images: [],
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      });

      expect(result.success, publicId).toBe(true);
    }
  });
});
