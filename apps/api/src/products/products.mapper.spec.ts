import { productSchema } from '@bidplace/contracts';
import { describe, expect, it } from 'vitest';

import { publicSellerProfileSelect } from '../sellers/seller-profile.mapper';
import {
  portfolioCatalogProductSelect,
  toContractProduct,
  toOwnerContractProduct,
  type ProductRecord,
  type ProductRevisionOwnerRecord,
} from './products.mapper';

const publishedImageId = 'b0d82a10-3170-49eb-904f-a8bc87d311a6';
const editingImageId = 'c0d82a10-3170-49eb-904f-a8bc87d311a7';
const laterImageId = 'd0d82a10-3170-49eb-904f-a8bc87d311a8';

function productWithImages(
  images: ProductRecord['images'],
): ProductRecord {
  return {
    id: 'a0d82a10-3170-49eb-904f-a8bc87d311a5',
    publicId: 'pubId000001',
    sellerProfileId: '1e14b6f1-e63b-4f6b-8131-a01f6ab4dc61',
    categoryId: null,
    title: 'Предмет',
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
    createdAt: new Date('2026-07-18T00:00:00.000Z'),
    updatedAt: new Date('2026-07-18T00:00:00.000Z'),
    images,
  } as ProductRecord;
}

describe('product image contracts', () => {
  it('keeps published image order, urls, and null dimensions', () => {
    const product = toContractProduct(
      productWithImages([
        {
          id: laterImageId,
          position: 1,
          mimeType: 'image/png',
          byteLength: 20,
          checksum: 'b'.repeat(64),
          width: null,
          height: null,
        },
        {
          id: publishedImageId,
          position: 0,
          mimeType: 'image/jpeg',
          byteLength: 10,
          checksum: 'a'.repeat(64),
          width: 800,
          height: 600,
        },
      ] as ProductRecord['images']),
    );

    expect(productSchema.parse(product).images).toEqual([
      {
        id: laterImageId,
        position: 1,
        url: `/api/images/${laterImageId}`,
        mimeType: 'image/png',
        byteLength: 20,
        checksum: 'b'.repeat(64),
        width: null,
        height: null,
      },
      {
        id: publishedImageId,
        position: 0,
        url: `/api/images/${publishedImageId}`,
        mimeType: 'image/jpeg',
        byteLength: 10,
        checksum: 'a'.repeat(64),
        width: 800,
        height: 600,
      },
    ]);
  });

  it('projects editing images in revision order with null dimensions', () => {
    const product = toOwnerContractProduct(
      productWithImages([
        {
          id: publishedImageId,
          position: 0,
          mimeType: 'image/jpeg',
          byteLength: 10,
          checksum: 'a'.repeat(64),
          width: 800,
          height: 600,
        },
      ] as ProductRecord['images']),
      {
        categoryId: null,
        title: 'Черновик',
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
        images: [
          {
            position: 0,
            image: {
              id: editingImageId,
              mimeType: 'image/png',
              byteLength: 12,
              checksum: 'c'.repeat(64),
              width: null,
              height: null,
            },
          },
        ],
      } as ProductRevisionOwnerRecord,
    );

    expect(product.images).toEqual([
      {
        id: editingImageId,
        position: 0,
        url: `/api/images/${editingImageId}`,
        mimeType: 'image/png',
        byteLength: 12,
        checksum: 'c'.repeat(64),
        width: null,
        height: null,
      },
    ]);
    expect(product.title).toBe('Черновик');
  });
});

describe('portfolioCatalogProductSelect', () => {
  it('reads identity, the public author, and the published gallery', () => {
    expect(Object.keys(portfolioCatalogProductSelect).sort()).toEqual([
      'id',
      'publicId',
      'publishedAt',
      'publishedRevision',
      'sellerProfile',
    ]);
    expect(portfolioCatalogProductSelect.sellerProfile.select).toBe(
      publicSellerProfileSelect,
    );
    expect(
      portfolioCatalogProductSelect.publishedRevision.select.images.orderBy,
    ).toEqual({ position: 'asc' });
    expect(
      portfolioCatalogProductSelect.publishedRevision.select.images.select.image
        .select,
    ).toEqual({
      id: true,
      mimeType: true,
      byteLength: true,
      checksum: true,
      width: true,
      height: true,
    });
  });
});
