import { describe, expect, it } from 'vitest';
import type { PortfolioWorkDetailResponse } from '@bidplace/contracts';

import { toAuctionCardItem } from '../../components/ui/auction-card-item';
import { toProductScreenModel } from './portfolio-work-adapter';

const work = {
  id: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
  publicId: 'portfolio01',
  title: 'Work',
  story: null,
  categoryId: '3c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
  technique: null,
  materials: 'Clay',
  dimensions: null,
  year: 2024,
  images: [
    {
      id: '4c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
      position: 0,
      url: '/api/images/4c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
      mimeType: 'image/jpeg',
      byteLength: 1,
      checksum: 'a'.repeat(64),
      width: 1,
      height: 1,
    },
  ],
  publishedAt: '2026-09-08T00:00:00.000Z',
  sharePath: '/works/portfolio01',
};

const author = {
  id: '5c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
  slug: 'author',
  fullName: 'Author',
  country: 'Belarus',
  city: 'Minsk',
  discipline: 'Painting',
  practice: null,
  profilePhotoUrl: '/api/sellers/author/photo',
  telegramUrl: null,
  instagramUrl: null,
  websiteUrl: null,
  shortDescription: 'Bio',
  achievements: [],
  sharePath: '/authors/author',
};

describe('portfolio work adapter', () => {
  it('maps getWork into the current card and product-screen shape', () => {
    const related = {
      work: { ...work, publicId: 'portfolio02', sharePath: '/works/portfolio02' },
      author,
    };
    const model = toProductScreenModel({
      work,
      author,
      relatedWorks: [related],
    } as unknown as PortfolioWorkDetailResponse);

    expect(model.product.title).toBe('Work');
    expect(model.product.city).toBe('Minsk');
    expect(model.sellerProfile.slug).toBe('author');
    expect(toAuctionCardItem(related)).toEqual({
      product: related.work,
      sellerProfile: related.author,
      listing: null,
    });
    expect(model.relatedItems).toHaveLength(1);
    expect(model.relatedItems[0]?.product.publicId).toBe('portfolio02');
  });
});
