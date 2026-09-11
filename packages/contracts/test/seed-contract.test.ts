import { describe, expect, it } from 'vitest';

import { productSchema } from '../src/product';

describe('Product public ID contract', () => {
  it('accepts the deterministic local fixture ID shape', () => {
    const result = productSchema.safeParse({
      id: '00000000-0000-4000-8000-000000000000',
      publicId: 'seedAnna001',
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
      packaging: null,
      deliveryInfo: null,
      publishedAt: null,
      status: 'DRAFT',
      images: [],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });

    expect(result.success).toBe(true);
  });
});
