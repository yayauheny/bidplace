import { describe, expect, it, vi } from 'vitest';

import { PortfolioService } from './portfolio.service';

describe('PortfolioService', () => {
  it('lists portfolio works from the published-revision projection', async () => {
    const products = {
      listPortfolio: vi.fn().mockResolvedValue({
        items: [],
        pagination: { page: 1, limit: 20, total: 0 },
      }),
    };
    const service = new PortfolioService(products as never, {} as never);

    await service.listWorks({ page: 1, limit: 20, sort: 'newest' });

    expect(products.listPortfolio).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, limit: 20, sort: 'newest' }),
    );
  });
  it('requires a city when selecting public portfolio authors', async () => {
    const sellers = {
      listPublic: vi.fn().mockResolvedValue({
        sellers: [],
        pagination: { page: 1, limit: 20, total: 0 },
      }),
    };
    const service = new PortfolioService({} as never, sellers as never);

    await service.listAuthors({ page: 1, limit: 20, sort: 'added' });

    expect(sellers.listPublic).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, limit: 20, sort: 'activity' }),
      { requireCity: true },
    );
  });

  it('requires a city when loading a public portfolio author', async () => {
    const sellers = {
      getApprovedPublicAuthor: vi.fn().mockResolvedValue(null),
    };
    const service = new PortfolioService({} as never, sellers as never);

    await expect(
      service.getAuthor('author-slug', { page: 1, limit: 20, sort: 'newest' }),
    ).rejects.toThrow('Author not found');

    expect(sellers.getApprovedPublicAuthor).toHaveBeenCalledWith(
      'author-slug',
      { requireCity: true },
    );
  });

  it('adds canonical share paths to public portfolio DTOs', async () => {
    const products = {
      listPortfolio: vi.fn().mockResolvedValue({
        items: [
          {
            product: {
              id: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
              publicId: 'portfolio01',
              title: 'Work',
              story: null,
              categoryId: '3c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
              technique: null,
              materials: null,
              dimensions: null,
              year: null,
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
            },
            sellerProfile: {
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
            },
          },
        ],
        pagination: { page: 1, limit: 20, total: 1 },
      }),
    };
    const service = new PortfolioService(products as never, {} as never);

    const response = await service.listWorks({
      page: 1,
      limit: 20,
      sort: 'newest',
    });

    expect(response.works[0]?.work.sharePath).toBe('/works/portfolio01');
    expect(response.works[0]?.author.sharePath).toBe('/authors/author');
  });
});
