import { describe, expect, it } from 'vitest';

import { productWriteRequestSchema, type Product, type SellerProductDetailResponse } from '@bidplace/contracts';

import {
  emptyProductDraftFormValues,
  productDraftFormSchema,
  productDraftToWriteRequest,
  productToDraftFormValues,
  shouldHydrateProductDraft,
} from './product-draft-form';

const persistedSelection = {
  category: null,
  materialTermIds: ['81111111-1111-4111-8111-111111111111'],
  techniqueTermIds: ['82222222-2222-4222-8222-222222222222'],
  materialTerms: [{ id: '81111111-1111-4111-8111-111111111111', role: 'MATERIAL', slug: 'canvas', name: 'Холст', active: false }],
  techniqueTerms: [{ id: '82222222-2222-4222-8222-222222222222', role: 'TECHNIQUE', slug: 'oil', name: 'Масло', active: true }],
  proposals: [
    { id: '83333333-3333-4333-8333-333333333333', productRevisionId: '84444444-4444-4444-8444-444444444444', kind: 'MATERIAL', rawName: 'Ткань', normalizedName: 'ткань', status: 'PENDING', selected: true, mappedCategoryId: null, mappedTermId: null, rejectionReason: null, reviewedAt: null },
  ],
} satisfies SellerProductDetailResponse['selection'];

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
  it('accepts an incomplete draft and rejects a year outside 0..9999', () => {
    expect(productDraftFormSchema.parse(emptyProductDraftFormValues)).toEqual(
      emptyProductDraftFormValues,
    );
    expect(
      productDraftFormSchema.safeParse({ ...emptyProductDraftFormValues, year: '10000' }).success,
    ).toBe(false);
    expect(
      productDraftFormSchema.safeParse({ ...emptyProductDraftFormValues, year: '2024' }).success,
    ).toBe(true);
  });

  it('hydrates the editable portfolio fields from a persisted Work', () => {
    expect(productToDraftFormValues(persistedProduct, persistedSelection)).toEqual({
      categoryId: persistedProduct.categoryId,
      title: 'Persisted title',
      story: 'Persisted story',
      materialTermIds: persistedSelection.materialTermIds,
      techniqueTermIds: persistedSelection.techniqueTermIds,
      materialProposals: ['Ткань'],
      techniqueProposals: [],
      categoryProposal: '',
      dimensions: '20 × 30 cm',
      year: '2026',
      uniqueness: '1/1',
    });
  });

  it('does not re-propose already approved catalog names after moderation', () => {
    const approved = {
      ...persistedSelection,
      proposals: persistedSelection.proposals.map((proposal) => ({
        ...proposal,
        status: 'APPROVED' as const,
        mappedTermId: persistedSelection.materialTermIds[0],
      })),
    };
    expect(productToDraftFormValues(persistedProduct, approved).materialProposals).toEqual([]);
  });

  it('keeps rejected proposals visible so an author can remove them', () => {
    const rejected = {
      ...persistedSelection,
      proposals: persistedSelection.proposals.map((proposal) => ({
        ...proposal,
        status: 'REJECTED' as const,
        rejectionReason: 'Неоднозначное название',
      })),
    };
    expect(productToDraftFormValues(persistedProduct, rejected).materialProposals).toEqual(['Ткань']);
  });

  it('retains freshly submitted selections until the authoritative detail read arrives', () => {
    const submitted = productToDraftFormValues(persistedProduct, persistedSelection);
    expect(productToDraftFormValues(persistedProduct, undefined, submitted)).toEqual(submitted);
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
      ...productToDraftFormValues(persistedProduct, persistedSelection),
      title: '  Current form title  ',
      story: '',
    });

    expect(productWriteRequestSchema.parse(request)).toEqual(request);
    expect(request).toEqual({
      categoryId: persistedProduct.categoryId,
      title: 'Current form title',
      story: null,
      materialTermIds: persistedSelection.materialTermIds,
      techniqueTermIds: persistedSelection.techniqueTermIds,
      materialProposals: ['Ткань'],
      techniqueProposals: [],
      categoryProposal: null,
      dimensions: '20 × 30 cm',
      year: 2026,
      uniqueness: '1/1',
    });
    expect(request).not.toHaveProperty('technique');
    expect(request).not.toHaveProperty('materials');
    expect(request).not.toHaveProperty('packaging');
    expect(request).not.toHaveProperty('deliveryInfo');
    expect(request).not.toHaveProperty('creationIntro');
  });
});
