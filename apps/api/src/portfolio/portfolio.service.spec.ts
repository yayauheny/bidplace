import { ConflictException, NotFoundException } from '@nestjs/common';
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
    const service = new PortfolioService(
      products as never,
      {} as never,
      {} as never,
    );

    await service.listWorks({ page: 1, limit: 20, sort: 'newest' });

    expect(products.listPortfolio).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, limit: 20, sort: 'newest' }),
    );
  });

  it('requires a city when selecting public portfolio authors', async () => {
    const sellers = {
      listPortfolioAuthors: vi.fn().mockResolvedValue({
        sellers: [],
        pagination: { page: 1, limit: 20, total: 0 },
      }),
    };
    const service = new PortfolioService(
      {} as never,
      sellers as never,
      {} as never,
    );

    await service.listAuthors({ page: 1, limit: 20, sort: 'added' });

    expect(sellers.listPortfolioAuthors).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, limit: 20, sort: 'added' }),
      { requireCity: true },
    );
  });

  it('requires a city when loading a public portfolio author', async () => {
    const sellers = {
      getApprovedPublicAuthor: vi.fn().mockResolvedValue(null),
    };
    const service = new PortfolioService(
      {} as never,
      sellers as never,
      {} as never,
    );

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
              uniqueness: 'Единственный экземпляр',
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
              biography: null,
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
    const service = new PortfolioService(
      products as never,
      {} as never,
      {} as never,
    );

    const response = await service.listWorks({
      page: 1,
      limit: 20,
      sort: 'newest',
    });

    expect(response.works[0]?.work.sharePath).toBe('/works/portfolio01');
    expect(response.works[0]?.work.uniqueness).toBe('Единственный экземпляр');
    expect(response.works[0]?.author.sharePath).toBe('/authors/author');
  });

  it('forwards author work filters to the published-revision catalog query', async () => {
    const sellers = {
      getApprovedPublicAuthor: vi.fn().mockResolvedValue({
        sellerProfile: {
          id: '5c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
          slug: 'author',
          fullName: 'Author',
          country: 'Belarus',
          city: 'Minsk',
          discipline: 'Painting',
          practice: null,
          biography: null,
          profilePhotoUrl: '/api/sellers/author/photo',
          telegramUrl: null,
          instagramUrl: null,
          websiteUrl: null,
          shortDescription: 'Bio',
          achievements: [],
        },
      }),
    };
    const products = {
      listPortfolio: vi.fn().mockResolvedValue({
        items: [],
        pagination: { page: 2, limit: 10, total: 0 },
      }),
    };
    const service = new PortfolioService(
      products as never,
      sellers as never,
      {} as never,
    );

    await service.getAuthor('author', {
      page: 2,
      limit: 10,
      q: 'clay',
      category: '3c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
      materials: ['шамот'],
      sort: 'oldest',
    });

    expect(products.listPortfolio).toHaveBeenCalledWith({
      page: 2,
      limit: 10,
      q: 'clay',
      category: '3c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
      materials: ['шамот'],
      sort: 'oldest',
      author: 'author',
    });
  });

  it('returns a visible curator selection and hides unpublished pointers', async () => {
    const item = {
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
        uniqueness: null,
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
        biography: null,
        profilePhotoUrl: '/api/sellers/author/photo',
        telegramUrl: null,
        instagramUrl: null,
        websiteUrl: null,
        shortDescription: 'Bio',
        achievements: [],
      },
    };
    const products = {
      listPortfolio: vi.fn().mockResolvedValue({
        items: [item],
        pagination: { page: 1, limit: 6, total: 1 },
      }),
      getPortfolio: vi.fn().mockResolvedValue(item),
    };
    const sellers = {
      listPortfolioAuthors: vi.fn().mockResolvedValue({
        sellers: [],
        pagination: { page: 1, limit: 6, total: 0 },
      }),
      getApprovedPublicAuthor: vi.fn().mockResolvedValue({
        sellerProfile: {
          ...item.sellerProfile,
          id: '7c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
          slug: 'vex',
          profilePhotoUrl: '/api/sellers/vex/photo',
        },
      }),
    };
    const prisma = {
      curatorSelection: {
        findUnique: vi.fn().mockResolvedValue({
          productId: item.product.id,
          note: null,
          curator: { slug: 'vex' },
        }),
      },
      product: {
        findUnique: vi.fn().mockResolvedValue({ publicId: 'portfolio01' }),
      },
    };
    const visible = new PortfolioService(
      products as never,
      sellers as never,
      prisma as never,
    );

    await expect(visible.home()).resolves.toEqual(
      expect.objectContaining({
        curatorSelection: expect.objectContaining({
          curator: expect.objectContaining({ slug: 'vex' }),
          work: expect.objectContaining({
            publicId: 'portfolio01',
            author: expect.objectContaining({ slug: 'author' }),
          }),
          note: null,
        }),
      }),
    );

    products.getPortfolio.mockRejectedValue(
      new NotFoundException('Work not found'),
    );
    const hidden = new PortfolioService(
      products as never,
      sellers as never,
      prisma as never,
    );
    await expect(hidden.home()).resolves.toEqual(
      expect.objectContaining({ curatorSelection: null }),
    );
  });

  it('returns the curator note and treats blank notes as null', async () => {
    const item = {
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
        uniqueness: null,
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
        biography: null,
        profilePhotoUrl: '/api/sellers/author/photo',
        telegramUrl: null,
        instagramUrl: null,
        websiteUrl: null,
        shortDescription: 'Bio',
        achievements: [],
      },
    };
    const products = {
      listPortfolio: vi.fn().mockResolvedValue({
        items: [item],
        pagination: { page: 1, limit: 6, total: 1 },
      }),
      getPortfolio: vi.fn().mockResolvedValue(item),
    };
    const sellers = {
      listPortfolioAuthors: vi.fn().mockResolvedValue({
        sellers: [],
        pagination: { page: 1, limit: 6, total: 0 },
      }),
      getApprovedPublicAuthor: vi.fn().mockResolvedValue({
        sellerProfile: {
          ...item.sellerProfile,
          id: '7c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
          slug: 'vex',
          profilePhotoUrl: '/api/sellers/vex/photo',
        },
      }),
    };
    const prisma = {
      curatorSelection: {
        findUnique: vi.fn().mockResolvedValue({
          productId: item.product.id,
          note: '  Главная визуальная находка этой недели.  ',
          curator: { slug: 'vex' },
        }),
      },
      product: {
        findUnique: vi.fn().mockResolvedValue({ publicId: 'portfolio01' }),
      },
    };

    await expect(
      new PortfolioService(
        products as never,
        sellers as never,
        prisma as never,
      ).home(),
    ).resolves.toEqual(
      expect.objectContaining({
        curatorSelection: expect.objectContaining({
          note: 'Главная визуальная находка этой недели.',
        }),
      }),
    );

    prisma.curatorSelection.findUnique.mockResolvedValue({
      productId: item.product.id,
      note: '   ',
      curator: { slug: 'vex' },
    });
    await expect(
      new PortfolioService(
        products as never,
        sellers as never,
        prisma as never,
      ).home(),
    ).resolves.toEqual(
      expect.objectContaining({
        curatorSelection: expect.objectContaining({ note: null }),
      }),
    );
  });

  it('hides Opening when the curator profile is not publicly visible', async () => {
    const item = {
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
        uniqueness: null,
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
        biography: null,
        profilePhotoUrl: '/api/sellers/author/photo',
        telegramUrl: null,
        instagramUrl: null,
        websiteUrl: null,
        shortDescription: 'Bio',
        achievements: [],
      },
    };
    const products = {
      listPortfolio: vi.fn().mockResolvedValue({
        items: [item],
        pagination: { page: 1, limit: 6, total: 1 },
      }),
      getPortfolio: vi.fn().mockResolvedValue(item),
    };
    const sellers = {
      listPortfolioAuthors: vi.fn().mockResolvedValue({
        sellers: [],
        pagination: { page: 1, limit: 6, total: 0 },
      }),
      getApprovedPublicAuthor: vi.fn().mockResolvedValue(null),
    };

    await expect(
      new PortfolioService(
        products as never,
        sellers as never,
        {
          curatorSelection: {
            findUnique: vi.fn().mockResolvedValue({
              productId: item.product.id,
              note: 'note',
              curator: { slug: 'vex' },
            }),
          },
          product: {
            findUnique: vi.fn().mockResolvedValue({ publicId: 'portfolio01' }),
          },
        } as never,
      ).home(),
    ).resolves.toEqual(expect.objectContaining({ curatorSelection: null }));
  });

  it('stores a public curator independently of the work owner', async () => {
    const item = {
      product: {
        id: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
        publicId: 'daliEstate1',
        title: 'Work',
        story: null,
        categoryId: '3c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
        technique: null,
        materials: null,
        dimensions: null,
        year: null,
        uniqueness: null,
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
        slug: 'pixelp',
        fullName: 'Owner',
        country: 'Belarus',
        city: 'Minsk',
        discipline: 'Painting',
        practice: null,
        biography: null,
        profilePhotoUrl: '/api/sellers/pixelp/photo',
        telegramUrl: null,
        instagramUrl: null,
        websiteUrl: null,
        shortDescription: 'Bio',
        achievements: [],
      },
    };
    const products = {
      getPortfolio: vi.fn().mockResolvedValue(item),
    };
    const sellers = {
      getApprovedPublicAuthor: vi.fn().mockResolvedValue({
        sellerProfile: {
          id: '8c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
          slug: 'vex',
        },
      }),
    };
    const prisma = {
      curatorSelection: {
        upsert: vi.fn().mockResolvedValue({}),
      },
    };
    const service = new PortfolioService(
      products as never,
      sellers as never,
      prisma as never,
    );

    await expect(
      service.setCuratorSelection('daliEstate1', 'vex', null, 'admin-id'),
    ).resolves.toEqual(
      expect.objectContaining({
        publicId: 'daliEstate1',
        curatorSlug: 'vex',
        note: null,
      }),
    );
    expect(sellers.getApprovedPublicAuthor).toHaveBeenCalledWith('vex', {
      requireCity: true,
    });
    expect(prisma.curatorSelection.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          productId: item.product.id,
          curatorSellerProfileId: '8c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
          selectedByUserId: 'admin-id',
        }),
      }),
    );

    sellers.getApprovedPublicAuthor.mockResolvedValue(null);
    await expect(
      service.setCuratorSelection('daliEstate1', 'hidden', null, 'admin-id'),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('omits the current work from related works', async () => {
    const item = {
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
        uniqueness: null,
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
        biography: null,
        profilePhotoUrl: '/api/sellers/author/photo',
        telegramUrl: null,
        instagramUrl: null,
        websiteUrl: null,
        shortDescription: 'Bio',
        achievements: [],
      },
    };
    const related = {
      ...item,
      product: {
        ...item.product,
        id: '6c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
        publicId: 'portfolio02',
      },
    };
    const products = {
      getPortfolio: vi.fn().mockResolvedValue(item),
      listPortfolio: vi.fn().mockResolvedValue({
        items: [item, related],
        pagination: { page: 1, limit: 4, total: 2 },
      }),
    };
    const service = new PortfolioService(
      products as never,
      {} as never,
      {} as never,
    );

    const response = await service.getWork('portfolio01');

    expect(response.relatedWorks).toHaveLength(1);
    expect(response.relatedWorks[0]?.work.publicId).toBe('portfolio02');
  });
});
