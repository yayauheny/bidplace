import { describe, expect, it, vi } from 'vitest';

import { productWriteRequestSchema, type Product } from '@bidplace/contracts';

import {
  persistProductDraftBeforeSubmit,
  productDraftToWriteRequest,
  productToDraftFormValues,
  shouldHydrateProductDraft,
} from './product-draft-form';

const persistedProduct = {
  id: 'a0d82a10-3170-49eb-904f-a8bc87d311a5',
  publicId: 'publicId001',
  sellerProfileId: '1e14b6f1-e63b-4f6b-8131-a01f6ab4dc61',
  categoryId: 'd0d82a10-3170-49eb-904f-a8bc87d311a8',
  title: 'Persisted title',
  story: 'Persisted story',
  technique: 'Oil',
  materials: 'Canvas',
  dimensions: '20 × 30 cm',
  weight: '1 kg',
  year: 2026,
  condition: null,
  uniqueness: '1/1',
  provenance: 'Author archive',
  city: 'Minsk',
  packaging: 'Legacy packaging',
  deliveryInfo: 'Legacy delivery',
  publishedAt: null,
  status: 'DRAFT',
  images: [],
  createdAt: '2026-09-21T10:00:00.000Z',
  updatedAt: '2026-09-21T10:00:00.000Z',
} satisfies Product;

describe('product draft form lifecycle', () => {
  it('hydrates the editable portfolio fields from a persisted Work', () => {
    expect(productToDraftFormValues(persistedProduct)).toEqual({
      categoryId: persistedProduct.categoryId,
      title: 'Persisted title',
      story: 'Persisted story',
      technique: 'Oil',
      materials: 'Canvas',
      dimensions: '20 × 30 cm',
      year: '2026',
      uniqueness: '1/1',
    });
  });

  it('hydrates a clean form when the persisted editing revision is newer', () => {
    expect(
      shouldHydrateProductDraft({
        hydratedProductId: persistedProduct.id,
        hydratedUpdatedAt: persistedProduct.updatedAt,
        nextProductId: persistedProduct.id,
        nextUpdatedAt: '2026-09-21T11:00:00.000Z',
        isDirty: false,
      }),
    ).toBe(true);
  });

  it('does not overwrite dirty input when the persisted editing revision is newer', () => {
    expect(
      shouldHydrateProductDraft({
        hydratedProductId: persistedProduct.id,
        hydratedUpdatedAt: persistedProduct.updatedAt,
        nextProductId: persistedProduct.id,
        nextUpdatedAt: '2026-09-21T11:00:00.000Z',
        isDirty: true,
      }),
    ).toBe(false);
  });

  it('builds writes through the canonical contract and omits legacy commerce fields', () => {
    const request = productDraftToWriteRequest({
      ...productToDraftFormValues(persistedProduct),
      title: '  Current form title  ',
      story: '',
    });

    expect(productWriteRequestSchema.parse(request)).toEqual(request);
    expect(request).toEqual({
      categoryId: persistedProduct.categoryId,
      title: 'Current form title',
      story: null,
      technique: 'Oil',
      materials: 'Canvas',
      dimensions: '20 × 30 cm',
      year: 2026,
      uniqueness: '1/1',
    });
    expect(request).not.toHaveProperty('packaging');
    expect(request).not.toHaveProperty('deliveryInfo');
    expect(request).not.toHaveProperty('creationIntro');
  });

  it('persists the current values before submit', async () => {
    const calls: string[] = [];
    const result = await persistProductDraftBeforeSubmit(
      async () => {
        calls.push('persist');
      },
      async () => {
        calls.push('submit');
        return 'submitted';
      },
    );

    expect(result).toBe('submitted');
    expect(calls).toEqual(['persist', 'submit']);
  });

  it('does not submit when persistence fails', async () => {
    const submit = vi.fn();

    await expect(
      persistProductDraftBeforeSubmit(async () => {
        throw new Error('save failed');
      }, submit),
    ).rejects.toThrow('save failed');
    expect(submit).not.toHaveBeenCalled();
  });
});
