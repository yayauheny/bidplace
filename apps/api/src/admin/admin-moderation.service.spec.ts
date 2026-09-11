import { describe, expect, it, vi } from 'vitest';

import { ConflictException } from '@nestjs/common';

import { AdminModerationService } from './admin-moderation.service';
import {
  sellerProfileAuthSelect,
  sellerProfileResponseSelect,
} from '../sellers/seller-profile.mapper';

function transactionPrisma(tx: object) {
  return {
    $transaction: vi.fn(
      async (callback: (client: object) => Promise<unknown>) => callback(tx),
    ),
  };
}

describe('AdminModerationService', () => {
  it('approves a pending profile revision without exposing it before moderation', async () => {
    const revision = {
      id: 'revision-id',
      status: 'PENDING_REVIEW',
      slug: 'updated-author',
      discipline: 'Painting',
      fullName: 'Updated author',
      country: 'BY',
      city: 'Minsk',
      practice: null,
      socialLink: 'https://example.com',
      telegramUrl: null,
      instagramUrl: null,
      websiteUrl: null,
      shortDescription: 'Updated description',
      profilePhotoMimeType: 'image/png',
      profilePhotoByteLength: 1,
      profilePhotoChecksum: 'a'.repeat(64),
      profilePhotoObjectKey: 'seller-profile-revision:revision-id',
    };
    const sellerProfile = {
      id: 'seller-id',
      status: 'APPROVED',
      profilePhotoData: new Uint8Array([1]),
      editingRevision: revision,
    };
    const tx = {
      sellerProfile: {
        findUnique: vi.fn().mockResolvedValue(sellerProfile),
        update: vi.fn().mockResolvedValue({ ...sellerProfile }),
      },
      sellerProfileRevision: { update: vi.fn() },
      auditEvent: { create: vi.fn() },
    };
    const service = new AdminModerationService(transactionPrisma(tx) as never);

    await service.updateSellerStatus('admin-id', 'seller-id', {
      status: 'APPROVED',
    });

    expect(tx.sellerProfileRevision.update).toHaveBeenCalledWith({
      where: { id: 'revision-id' },
      data: expect.objectContaining({ status: 'APPROVED' }),
    });
    expect(tx.sellerProfile.update).toHaveBeenCalledWith({
      where: { id: 'seller-id' },
      data: expect.objectContaining({
        publishedRevisionId: 'revision-id',
        fullName: 'Updated author',
      }),
      select: sellerProfileResponseSelect,
    });
  });

  it('requests changes for an editing revision without hiding the published product', async () => {
    const product = {
      id: 'product-id',
      status: 'APPROVED',
      sellerProfile: { status: 'APPROVED' },
      images: [{ id: 'image-id' }],
      editingRevision: {
        id: 'revision-editing',
        status: 'PENDING_REVIEW',
        images: [{ imageId: 'image-id' }],
      },
    };
    const tx = {
      $queryRaw: vi.fn().mockResolvedValue([{ id: 'product-id' }]),
      product: {
        findUnique: vi.fn().mockResolvedValue(product),
        update: vi.fn().mockResolvedValue(product),
      },
      productRevision: { update: vi.fn() },
      auditEvent: { create: vi.fn() },
    };
    const service = new AdminModerationService(transactionPrisma(tx) as never);

    await service.updateProductStatus('admin-id', 'product-id', {
      status: 'CHANGES_REQUESTED',
      reason: 'Добавьте подтверждение происхождения',
    });

    expect(tx.product.update).not.toHaveBeenCalled();
    expect(tx.productRevision.update).toHaveBeenCalledWith({
      where: { id: 'revision-editing' },
      data: expect.objectContaining({ status: 'CHANGES_REQUESTED' }),
    });
    expect(tx.product.findUnique).toHaveBeenCalledWith({
      where: { id: 'product-id' },
      include: {
        sellerProfile: { select: sellerProfileAuthSelect },
        images: { select: { id: true } },
        editingRevision: {
          include: { images: { select: { imageId: true } } },
        },
      },
    });
    expect(tx.auditEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          reason: 'Добавьте подтверждение происхождения',
          newStatus: 'CHANGES_REQUESTED',
        }),
      }),
    );
  });

  it('publishes an approved revision as the new public work', async () => {
    const editingRevision = {
      id: 'revision-editing',
      status: 'PENDING_REVIEW',
      categoryId: 'category-id',
      title: 'Approved title',
      story: 'Approved story',
      technique: null,
      materials: null,
      dimensions: null,
      weight: null,
      year: null,
      condition: 'New',
      uniqueness: 'Unique',
      provenance: 'Created by author',
      city: 'Minsk',
      packaging: 'Box',
      deliveryInfo: 'Contact author',
      creationIntro: null,
      images: [{ imageId: 'image-id' }],
    };
    const product = {
      id: 'product-id',
      status: 'PENDING_REVIEW',
      sellerProfile: { status: 'APPROVED' },
      images: [{ id: 'image-id' }],
      editingRevision,
    };
    const tx = {
      $queryRaw: vi.fn().mockResolvedValue([{ id: 'product-id' }]),
      product: {
        findUnique: vi.fn().mockResolvedValue(product),
        update: vi.fn().mockResolvedValue({ ...product, status: 'APPROVED' }),
      },
      productRevision: { update: vi.fn() },
      auditEvent: { create: vi.fn() },
    };
    const service = new AdminModerationService(transactionPrisma(tx) as never);

    await service.updateProductStatus('admin-id', 'product-id', {
      status: 'APPROVED',
    });

    expect(tx.productRevision.update).toHaveBeenCalledWith({
      where: { id: 'revision-editing' },
      data: expect.objectContaining({ status: 'APPROVED' }),
    });
    expect(tx.product.update).toHaveBeenCalledWith({
      where: { id: 'product-id' },
      data: expect.objectContaining({
        status: 'APPROVED',
        publishedRevisionId: 'revision-editing',
        title: 'Approved title',
        publishedAt: expect.any(Date),
      }),
    });
  });

  it('blocks admin from reopening a REJECTED product', async () => {
    const tx = {
      $queryRaw: vi.fn().mockResolvedValue([{ id: 'product-id' }]),
      product: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'product-id',
          status: 'REJECTED',
          sellerProfile: { status: 'APPROVED' },
          images: [{ id: 'image-id' }],
          editingRevision: undefined,
        }),
        update: vi.fn(),
      },
      auditEvent: { create: vi.fn() },
    };
    const service = new AdminModerationService(transactionPrisma(tx) as never);

    await expect(
      service.updateProductStatus('admin-id', 'product-id', {
        status: 'APPROVED',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(tx.product.update).not.toHaveBeenCalled();
    expect(tx.auditEvent.create).not.toHaveBeenCalled();
  });

  it('allows seller suspension while leftover scheduled listings exist', async () => {
    const updated = {
      id: 'seller-id',
      status: 'SUSPENDED',
    };
    const tx = {
      sellerProfile: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'seller-id',
          status: 'APPROVED',
          editingRevision: null,
        }),
        update: vi.fn().mockResolvedValue(updated),
      },
      auditEvent: { create: vi.fn() },
    };
    const service = new AdminModerationService(transactionPrisma(tx) as never);

    await expect(
      service.updateSellerStatus('admin-id', 'seller-id', {
        status: 'SUSPENDED',
        reason: 'Нужна проверка',
      }),
    ).resolves.toEqual(updated);
    expect(tx.sellerProfile.update).toHaveBeenCalledWith({
      where: { id: 'seller-id' },
      data: { status: 'SUSPENDED' },
      select: sellerProfileResponseSelect,
    });
    expect(tx.auditEvent.create).toHaveBeenCalled();
  });

  it('blocks profile approval when the editing revision has no photo', async () => {
    const revision = {
      id: 'revision-id',
      status: 'PENDING_REVIEW',
      slug: 'updated-author',
      discipline: 'Painting',
      fullName: 'Updated author',
      country: 'BY',
      city: 'Minsk',
      practice: null,
      socialLink: 'https://example.com',
      telegramUrl: null,
      instagramUrl: null,
      websiteUrl: null,
      shortDescription: 'Updated description',
      profilePhotoMimeType: null,
      profilePhotoByteLength: null,
      profilePhotoChecksum: null,
      profilePhotoObjectKey: null,
    };
    const tx = {
      sellerProfile: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'seller-id',
          status: 'APPROVED',
          editingRevision: revision,
        }),
        update: vi.fn(),
      },
      sellerProfileRevision: { update: vi.fn() },
      auditEvent: { create: vi.fn() },
    };
    const service = new AdminModerationService(transactionPrisma(tx) as never);

    await expect(
      service.updateSellerStatus('admin-id', 'seller-id', {
        status: 'APPROVED',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(tx.sellerProfile.update).not.toHaveBeenCalled();
    expect(tx.sellerProfileRevision.update).not.toHaveBeenCalled();
  });
});
