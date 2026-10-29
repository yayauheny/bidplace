import { type ProductStatus } from '@bidplace/contracts';
import { type Prisma } from '@bidplace/database';
import { describe, expect, it, vi } from 'vitest';

import {
  assertRevisionTransition,
  publishRevision,
  transitionProductVisibility,
  type PublicationActor,
} from './product-publication';

const statuses: ProductStatus[] = [
  'DRAFT',
  'PENDING_REVIEW',
  'CHANGES_REQUESTED',
  'APPROVED',
  'REJECTED',
  'ARCHIVED',
];
const revisionMoves = [
  'DRAFT:PENDING_REVIEW',
  'CHANGES_REQUESTED:PENDING_REVIEW',
  'REJECTED:PENDING_REVIEW',
  'PENDING_REVIEW:APPROVED',
  'PENDING_REVIEW:CHANGES_REQUESTED',
  'PENDING_REVIEW:REJECTED',
];
const visibilityMoves: Record<PublicationActor, string[]> = {
  author: [
    'DRAFT:PENDING_REVIEW',
    'CHANGES_REQUESTED:PENDING_REVIEW',
    'REJECTED:PENDING_REVIEW',
    'APPROVED:ARCHIVED',
    'ARCHIVED:APPROVED',
  ],
  admin: [
    'PENDING_REVIEW:APPROVED',
    'PENDING_REVIEW:CHANGES_REQUESTED',
    'PENDING_REVIEW:REJECTED',
    'APPROVED:ARCHIVED',
    'ARCHIVED:APPROVED',
  ],
  media: [],
};
const conflict = { apiCode: 'PRODUCT_STATE_CONFLICT', status: 409 };
const revisionAt = new Date('2026-10-29T00:00:00Z');

function fixture(status: ProductStatus = 'PENDING_REVIEW') {
  const revision = {
    id: 'revision',
    productId: 'product',
    status: 'PENDING_REVIEW',
    updatedAt: revisionAt,
    categoryId: 'category',
    title: 'New title',
    story: 'New story',
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
    creationIntro: null,
  };
  const product = {
    id: 'product',
    status,
    editingRevisionId: 'revision',
    publishedRevisionId: null as string | null,
    publishedAt: null as Date | null,
    editingRevision: revision,
    sellerProfile: { status: 'APPROVED', user: { status: 'active' } },
  };
  const db = {
    $queryRaw: vi.fn().mockResolvedValue([{ id: 'product', timeout: '0' }]),
    listing: { findFirst: vi.fn().mockResolvedValue(null) },
    product: {
      findUnique: vi.fn().mockResolvedValue(product),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    productRevision: {
      findUnique: vi.fn().mockResolvedValue(revision),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
  };
  const tx = db as unknown as Prisma.TransactionClient;
  return { revision, product, db, tx };
}

describe('product publication owner', () => {
  it.each(statuses.flatMap((from) => statuses.map((to) => ({ from, to }))))(
    'revision $from → $to',
    ({ from, to }) => {
      const transition = () => assertRevisionTransition(from, to);
      if (revisionMoves.includes(`${from}:${to}`))
        expect(transition).not.toThrow();
      else expect(transition).toThrowError(expect.objectContaining(conflict));
    },
  );

  it.each(
    (['author', 'admin', 'media'] as PublicationActor[]).flatMap((actor) =>
      statuses.flatMap((from) => statuses.map((to) => ({ actor, from, to }))),
    ),
  )('visibility $actor $from → $to', async ({ actor, from, to }) => {
    const { tx, db } = fixture(from);
    const result = transitionProductVisibility(tx, {
      productId: 'product',
      expected: [from],
      next: to,
      actor,
    });
    if (visibilityMoves[actor].includes(`${from}:${to}`)) {
      await expect(result).resolves.toBeUndefined();
      expect(db.$queryRaw).toHaveBeenCalledTimes(3);
      expect(db.product.updateMany).toHaveBeenCalledWith({
        where: { id: 'product', status: { in: [from] } },
        data: { status: to },
      });
    } else {
      await expect(result).rejects.toMatchObject(conflict);
      expect(db.product.updateMany).not.toHaveBeenCalled();
    }
  });

  it('rejects an in-sale archive at the publication owner before mutation', async () => {
    const { tx, db } = fixture('APPROVED');
    db.listing.findFirst.mockResolvedValue({ id: 'listing' });
    await expect(transitionProductVisibility(tx, { productId: 'product', expected: ['APPROVED'], next: 'ARCHIVED', actor: 'author' })).rejects.toMatchObject({ apiCode: 'PRODUCT_IN_SALE', status: 409 });
    expect(db.product.updateMany).not.toHaveBeenCalled();
  });

  it('rejects stale conditional visibility writes', async () => {
    const { tx, db } = fixture();
    db.product.updateMany.mockResolvedValue({ count: 0 });
    await expect(
      transitionProductVisibility(tx, {
        productId: 'product',
        expected: ['APPROVED'],
        next: 'ARCHIVED',
        actor: 'author',
      }),
    ).rejects.toMatchObject(conflict);
  });

  it('rejects empty or mixed invalid expected states before writing', async () => {
    for (const expected of [[], ['APPROVED', 'DRAFT']] as ProductStatus[][]) {
      const { tx, db } = fixture();
      await expect(
        transitionProductVisibility(tx, {
          productId: 'product',
          expected,
          next: 'ARCHIVED',
          actor: 'author',
        }),
      ).rejects.toMatchObject(conflict);
      expect(db.product.updateMany).not.toHaveBeenCalled();
    }
  });

  it.each(['PENDING_REVIEW', 'APPROVED', 'ARCHIVED'] as const)(
    'publishes new revision on %s and preserves hidden visibility',
    async (status) => {
      const { tx, db, product } = fixture(status);
      if (status !== 'PENDING_REVIEW') product.publishedRevisionId = 'previous';
      await expect(
        publishRevision(tx, {
          productId: 'product',
          revisionId: 'revision',
          expectedPublishedRevisionId: product.publishedRevisionId,
          expectedRevisionAt: revisionAt,
        }),
      ).resolves.toBe('published');
      expect(db.$queryRaw).toHaveBeenCalledTimes(6);
      expect(db.productRevision.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'revision',
          productId: 'product',
          status: 'PENDING_REVIEW',
          updatedAt: revisionAt,
        },
        data: { status: 'APPROVED', reviewedAt: expect.any(Date) },
      });
      expect(db.product.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'product',
          status,
          publishedRevisionId: product.publishedRevisionId,
        },
        data: expect.objectContaining({
          title: 'New title',
          story: 'New story',
          publishedRevisionId: 'revision',
          status: status === 'ARCHIVED' ? 'ARCHIVED' : 'APPROVED',
          publishedAt: expect.any(Date),
        }),
      });
    },
  );

  it('restores only the approved current published revision and preserves publication date', async () => {
    const { tx, db, product, revision } = fixture('ARCHIVED');
    product.editingRevisionId = 'another-draft';
    product.publishedRevisionId = revision.id;
    product.publishedAt = revisionAt;
    revision.status = 'APPROVED';
    await expect(
      publishRevision(tx, {
        productId: 'product',
        revisionId: revision.id,
        expectedPublishedRevisionId: revision.id,
        expectedRevisionAt: revisionAt,
      }),
    ).resolves.toBe('published');
    expect(db.productRevision.updateMany).not.toHaveBeenCalled();
    expect(db.product.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'APPROVED',
          publishedAt: revisionAt,
        }),
      }),
    );
  });

  it.each(['revision', 'product'] as const)(
    'throws to roll back when conditional %s write loses its CAS',
    async (target) => {
      const { tx, db } = fixture();
      if (target === 'revision')
        db.productRevision.updateMany.mockResolvedValue({ count: 0 });
      else db.product.updateMany.mockResolvedValue({ count: 0 });
      await expect(
        publishRevision(tx, {
          productId: 'product',
          revisionId: 'revision',
          expectedPublishedRevisionId: null,
          expectedRevisionAt: revisionAt,
        }),
      ).rejects.toMatchObject(conflict);
      if (target === 'revision')
        expect(db.product.updateMany).not.toHaveBeenCalled();
    },
  );

  it.each([
    'pointer',
    'timestamp',
    'revision-id',
    'editing-pointer',
    'foreign-product',
    'revision-status',
    'unapproved-profile',
    'inactive-user',
    'invalid-product-status',
    'unpublished-approved',
    'missing-product',
    'missing-revision',
  ] as const)('returns stale without writes for %s', async (reason) => {
    const { tx, db, product, revision } = fixture();
    if (reason === 'pointer') product.publishedRevisionId = 'changed';
    if (reason === 'timestamp') revision.updatedAt = new Date(0);
    if (reason === 'revision-id') revision.id = 'changed';
    if (reason === 'editing-pointer') product.editingRevisionId = 'changed';
    if (reason === 'foreign-product') revision.productId = 'other';
    if (reason === 'revision-status') revision.status = 'REJECTED';
    if (reason === 'unapproved-profile')
      product.sellerProfile.status = 'SUSPENDED';
    if (reason === 'inactive-user')
      product.sellerProfile.user.status = 'banned';
    if (reason === 'invalid-product-status') product.status = 'DRAFT';
    if (reason === 'unpublished-approved') revision.status = 'APPROVED';
    if (reason === 'missing-product')
      db.product.findUnique.mockResolvedValue(null);
    if (reason === 'missing-revision')
      db.productRevision.findUnique.mockResolvedValue(null);
    await expect(
      publishRevision(tx, {
        productId: 'product',
        revisionId: 'revision',
        expectedPublishedRevisionId: null,
        expectedRevisionAt: revisionAt,
      }),
    ).resolves.toBe('stale');
    expect(db.product.updateMany).not.toHaveBeenCalled();
    expect(db.productRevision.updateMany).not.toHaveBeenCalled();
  });
});
