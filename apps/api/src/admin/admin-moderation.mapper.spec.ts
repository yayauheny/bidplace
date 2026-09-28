import { describe, expect, it } from 'vitest';

import { imageKey } from '../core/image-store/image-key';
import {
  selectSellerRevisionPhotoSource,
  toAdminProduct,
  toAdminSellerProfile,
  type AdminProductListRecord,
  type AdminSellerListRecord,
} from './admin-moderation.mapper';

const now = new Date('2026-09-26T12:00:00.000Z');
const sellerId = '00000000-0000-4000-8000-000000000001';
const userId = '00000000-0000-4000-8000-000000000004';
const revisionId = '00000000-0000-4000-8000-000000000005';
const productId = '00000000-0000-4000-8000-000000000002';
const parentChecksum = 'a'.repeat(64);
const revisionChecksum = 'b'.repeat(64);

function sellerRecord(
  revision: AdminSellerListRecord['editingRevision'],
): AdminSellerListRecord {
  return {
    id: sellerId,
    userId,
    status: 'APPROVED',
    updatedAt: now,
    sellerType: 'creator',
    applicationStage: null,
    createdAt: now,
    slug: 'published-author',
    fullName: 'Published author',
    discipline: 'Керамика',
    country: 'BY',
    city: 'Minsk',
    practice: 'Published practice',
    biography: null,
    socialLink: null,
    telegramUrl: null,
    instagramUrl: null,
    websiteUrl: null,
    publicEmail: null,
    shortDescription: 'Published description',
    profilePhotoMimeType: 'image/png',
    profilePhotoByteLength: 12,
    profilePhotoChecksum: parentChecksum,
    profilePhotoObjectKey: imageKey.sellerPhoto(sellerId),
    editingRevision: revision,
  };
}

describe('admin moderation mapper', () => {
  it('keeps a null revision city instead of copying the parent city', () => {
    const mapped = toAdminSellerProfile(
      sellerRecord({
        id: revisionId,
        version: 2,
        status: 'PENDING_REVIEW',
        updatedAt: now,
        submittedAt: now,
        slug: 'published-author',
        fullName: 'Pending author',
        discipline: 'Керамика',
        country: 'BY',
        city: null,
        practice: null,
        biography: null,
        socialLink: null,
        telegramUrl: null,
        instagramUrl: null,
        websiteUrl: null,
        publicEmail: null,
        shortDescription: 'Pending description',
        profilePhotoMimeType: null,
        profilePhotoByteLength: null,
        profilePhotoChecksum: null,
        profilePhotoObjectKey: null,
        achievements: [],
      }),
      null,
      false,
    );

    expect(mapped.parent.city).toBe('Minsk');
    expect(mapped.reviewTarget?.content.city).toBeNull();
    expect(mapped.reviewTarget?.content.fullName).toBe('Pending author');
  });

  it('uses one complete photo source and leaves missing media empty', () => {
    const mixed = selectSellerRevisionPhotoSource(
      {
        profilePhotoMimeType: 'image/jpeg',
        profilePhotoByteLength: 4,
        profilePhotoChecksum: null,
        profilePhotoObjectKey: null,
      },
      {
        id: sellerId,
        profilePhotoMimeType: 'image/png',
        profilePhotoByteLength: 12,
        profilePhotoChecksum: parentChecksum,
        profilePhotoObjectKey: imageKey.sellerPhoto(sellerId),
      },
    );
    expect(mixed).toEqual({
      objectKey: imageKey.sellerPhoto(sellerId),
      mimeType: 'image/png',
      byteLength: 12,
      checksum: parentChecksum,
    });

    const revisionPhoto = selectSellerRevisionPhotoSource(
      {
        profilePhotoMimeType: 'image/jpeg',
        profilePhotoByteLength: 9,
        profilePhotoChecksum: revisionChecksum,
        profilePhotoObjectKey: imageKey.sellerProfileRevision(revisionId),
      },
      {
        id: sellerId,
        profilePhotoMimeType: 'image/png',
        profilePhotoByteLength: 12,
        profilePhotoChecksum: parentChecksum,
        profilePhotoObjectKey: imageKey.sellerPhoto(sellerId),
      },
    );
    expect(revisionPhoto).toEqual({
      objectKey: imageKey.sellerProfileRevision(revisionId),
      mimeType: 'image/jpeg',
      byteLength: 9,
      checksum: revisionChecksum,
    });

    expect(
      selectSellerRevisionPhotoSource(
        {
          profilePhotoMimeType: null,
          profilePhotoByteLength: null,
          profilePhotoChecksum: null,
          profilePhotoObjectKey: null,
        },
        {
          id: sellerId,
          profilePhotoMimeType: null,
          profilePhotoByteLength: null,
          profilePhotoChecksum: null,
          profilePhotoObjectKey: null,
        },
      ),
    ).toBeNull();
  });

  it('does not replace a null revision product field with the parent value', () => {
    const imageId = '00000000-0000-4000-8000-000000000006';
    const product = {
      id: productId,
      publicId: 'abcdefghijk',
      sellerProfileId: sellerId,
      status: 'APPROVED',
      updatedAt: now,
      publishedAt: now,
      categoryId: '00000000-0000-4000-8000-000000000007',
      title: 'Published title',
      story: 'Published story',
      technique: null,
      materials: null,
      dimensions: null,
      weight: null,
      year: null,
      condition: null,
      uniqueness: null,
      provenance: null,
      city: 'Minsk',
      packaging: null,
      deliveryInfo: null,
      creationIntro: null,
      images: [],
      creationSteps: [],
      sellerProfile: {
        slug: 'published-author',
        fullName: 'Published author',
        status: 'APPROVED',
      },
      listings: [],
      editingRevision: {
        id: revisionId,
        version: 2,
        status: 'PENDING_REVIEW',
        updatedAt: now,
        submittedAt: now,
        categoryId: '00000000-0000-4000-8000-000000000008',
        title: 'Pending title',
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
        creationIntro: null,
        images: [
          {
            position: 0,
            image: {
              id: imageId,
              mimeType: 'image/png',
              byteLength: 8,
              checksum: parentChecksum,
              width: null,
              height: null,
            },
          },
        ],
      },
    } as AdminProductListRecord;

    const mapped = toAdminProduct(product, null);
    expect(mapped.parent.story).toBe('Published story');
    expect(mapped.parent.city).toBe('Minsk');
    expect(mapped.reviewTarget?.content.story).toBeNull();
    expect(mapped.reviewTarget?.content.city).toBeNull();
    expect(mapped.reviewTarget?.content.images.map((image) => image.id)).toEqual([
      imageId,
    ]);
    expect(mapped.creationSteps).toEqual([]);
  });
});
