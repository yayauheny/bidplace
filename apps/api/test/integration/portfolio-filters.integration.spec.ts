import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import type { PrismaClient } from '@bidplace/database';

import {
  createHttpTestApp,
  HttpTestClient,
  type HttpTestApp,
} from './http-test-app';
import {
  createPermissionFixture,
  permissionImage,
  resetPermissionFixture,
} from './permission-fixtures';
import {
  createIntegrationDatabaseContext,
  type IntegrationDatabaseContext,
} from './test-database';

let database: IntegrationDatabaseContext;
let http: HttpTestApp;
let prisma: PrismaClient;

beforeAll(async () => {
  database = await createIntegrationDatabaseContext();
  prisma = database.prisma;
  http = await createHttpTestApp(database.databaseUrl, 'http://localhost:8081');
});

afterEach(async () => resetPermissionFixture(prisma));

afterAll(async () => {
  await http?.close();
  await database?.cleanup();
});

async function publishWork(
  input: {
    sellerProfileId: string;
    categoryId: string;
    publicId: string;
    title: string;
    materials: string;
    publishedAt: Date;
    createdAt?: Date;
  },
) {
  const product = await prisma.product.create({
    data: {
      publicId: input.publicId,
      sellerProfileId: input.sellerProfileId,
      categoryId: input.categoryId,
      title: input.title,
      story: input.title,
      materials: input.materials,
      uniqueness: 'One',
      provenance: 'Studio',
      city: 'Minsk',
      deliveryInfo: 'Pickup',
      status: 'APPROVED',
      publishedAt: input.publishedAt,
      createdAt: input.createdAt ?? input.publishedAt,
      images: {
        create: {
          position: 0,
          mimeType: 'image/png',
          byteLength: permissionImage.byteLength,
          data: permissionImage,
          checksum: '3'.repeat(64),
        },
      },
    },
    select: { id: true, images: { select: { id: true } }, publicId: true },
  });
  const revision = await prisma.productRevision.create({
    data: {
      productId: product.id,
      version: 1,
      status: 'APPROVED',
      categoryId: input.categoryId,
      title: input.title,
      story: input.title,
      materials: input.materials,
      uniqueness: 'One',
      provenance: 'Studio',
      city: 'Minsk',
      deliveryInfo: 'Pickup',
      images: {
        create: {
          imageId: product.images[0]!.id,
          position: 0,
        },
      },
    },
  });
  await prisma.product.update({
    where: { id: product.id },
    data: {
      editingRevisionId: revision.id,
      publishedRevisionId: revision.id,
    },
  });
  return product;
}

describe('portfolio catalog SQL filters and pagination', () => {
  it.each([
    {
      name: 'q',
      query: 'q=Clay',
      expected: ['filtClay001'],
    },
    {
      name: 'materials',
      query: 'materials=дерево',
      expected: ['filtWood002'],
    },
    {
      name: 'q and materials',
      query: 'q=Clay&materials=шамот',
      expected: ['filtClay001'],
    },
    {
      name: 'empty combination',
      query: 'q=Clay&materials=дерево',
      expected: [],
    },
  ])('filters public works by $name', async ({ query, expected }) => {
    const fixture = await createPermissionFixture(prisma);
    const guest = new HttpTestClient(http.baseUrl, 'http://localhost:8081');
    const publishedAt = new Date('2026-09-01T00:00:00.000Z');
    await publishWork({
      sellerProfileId: fixture.sellers.approved.profileId,
      categoryId: fixture.categoryId,
      publicId: 'filtClay001',
      title: 'Clay vessel',
      materials: 'шамот',
      publishedAt,
    });
    await publishWork({
      sellerProfileId: fixture.sellers.approved.profileId,
      categoryId: fixture.categoryId,
      publicId: 'filtWood002',
      title: 'Wood lamp',
      materials: 'дерево',
      publishedAt: new Date('2026-09-02T00:00:00.000Z'),
    });

    const response = await guest.get(`/works?limit=20&${query}`);
    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      works: Array<{ work: { publicId: string } }>;
      pagination: { total: number };
    };
    expect(body.works.map((item) => item.work.publicId)).toEqual(expected);
    expect(body.pagination.total).toBe(expected.length);
  });

  it('filters works by category and paginates with a stable newest order', async () => {
    const fixture = await createPermissionFixture(prisma);
    const guest = new HttpTestClient(http.baseUrl, 'http://localhost:8081');
    const woodCategory = await prisma.category.create({
      data: { slug: `wood-${fixture.categoryId.slice(0, 8)}`, name: 'Wood' },
    });
    const older = new Date('2026-08-20T00:00:00.000Z');
    const newer = new Date('2026-09-01T00:00:00.000Z');
    await publishWork({
      sellerProfileId: fixture.sellers.approved.profileId,
      categoryId: fixture.categoryId,
      publicId: 'filtClay001',
      title: 'Clay vessel',
      materials: 'шамот',
      publishedAt: older,
    });
    await publishWork({
      sellerProfileId: fixture.sellers.approved.profileId,
      categoryId: woodCategory.id,
      publicId: 'filtWood002',
      title: 'Wood lamp',
      materials: 'дерево',
      publishedAt: newer,
    });

    const byCategory = await guest.get(
      `/works?limit=20&category=${woodCategory.id}`,
    );
    expect(byCategory.status).toBe(200);
    const categoryBody = (await byCategory.json()) as {
      works: Array<{ work: { publicId: string } }>;
      pagination: { total: number };
    };
    expect(categoryBody.works.map((item) => item.work.publicId)).toEqual([
      'filtWood002',
    ]);
    expect(categoryBody.pagination.total).toBe(1);

    const page1 = await guest.get('/works?limit=1&sort=newest');
    const page2 = await guest.get('/works?page=2&limit=1&sort=newest');
    expect(page1.status).toBe(200);
    expect(page2.status).toBe(200);
    const first = (await page1.json()) as {
      works: Array<{ work: { publicId: string } }>;
      pagination: { total: number; page: number };
    };
    const second = (await page2.json()) as {
      works: Array<{ work: { publicId: string } }>;
      pagination: { total: number; page: number };
    };
    expect(first.pagination).toEqual({ page: 1, limit: 1, total: 3 });
    expect(second.pagination).toEqual({ page: 2, limit: 1, total: 3 });
    expect(first.works[0]?.work.publicId).toBe('filtWood002');
    expect(second.works[0]?.work.publicId).not.toBe(
      first.works[0]?.work.publicId,
    );
    expect(second.works[0]?.work.publicId).toBe('filtClay001');
  });

  it('forwards author work filters and SQL-filters the author directory', async () => {
    const fixture = await createPermissionFixture(prisma);
    const guest = new HttpTestClient(http.baseUrl, 'http://localhost:8081');
    const approved = await prisma.sellerProfile.update({
      where: { id: fixture.sellers.approved.profileId },
      data: {
        fullName: 'Alpha Author',
        discipline: 'Керамика',
        city: 'Minsk',
      },
      select: { slug: true },
    });
    const other = await prisma.sellerProfile.update({
      where: { id: fixture.sellers.otherApproved.profileId },
      data: {
        fullName: 'Beta Author',
        discipline: 'Дерево',
        city: 'Grodno',
      },
      select: { slug: true },
    });
    await publishWork({
      sellerProfileId: fixture.sellers.approved.profileId,
      categoryId: fixture.categoryId,
      publicId: 'filtClay001',
      title: 'Clay vessel',
      materials: 'шамот',
      publishedAt: new Date('2026-09-01T00:00:00.000Z'),
    });
    await publishWork({
      sellerProfileId: fixture.sellers.approved.profileId,
      categoryId: fixture.categoryId,
      publicId: 'filtWood002',
      title: 'Wood lamp',
      materials: 'дерево',
      publishedAt: new Date('2026-09-02T00:00:00.000Z'),
    });

    const authorWorks = await guest.get(
      `/authors/${approved.slug}?q=Clay&materials=шамот`,
    );
    expect(authorWorks.status).toBe(200);
    const authorBody = (await authorWorks.json()) as {
      works: Array<{ work: { publicId: string } }>;
      pagination: { total: number };
    };
    expect(authorBody.works.map((item) => item.work.publicId)).toEqual([
      'filtClay001',
    ]);
    expect(authorBody.pagination.total).toBe(1);

    const byName = await guest.get('/authors?q=Alpha');
    const byTag = await guest.get('/authors?tag=Керамика');
    const byCity = await guest.get('/authors?city=Grodno');
    const empty = await guest.get('/authors?q=zzzz-missing');
    expect(byName.status).toBe(200);
    expect(byTag.status).toBe(200);
    expect(byCity.status).toBe(200);
    expect(empty.status).toBe(200);
    const nameBody = (await byName.json()) as {
      authors: Array<{ author: { slug: string } }>;
      pagination: { total: number };
    };
    const tagBody = (await byTag.json()) as {
      authors: Array<{ author: { slug: string } }>;
      pagination: { total: number };
    };
    const cityBody = (await byCity.json()) as {
      authors: Array<{ author: { slug: string } }>;
      pagination: { total: number };
    };
    const emptyBody = (await empty.json()) as {
      authors: Array<{ author: { slug: string } }>;
      pagination: { total: number };
    };
    expect(nameBody.authors.map((item) => item.author.slug)).toEqual([
      approved.slug,
    ]);
    expect(tagBody.authors.map((item) => item.author.slug)).toEqual([
      approved.slug,
    ]);
    expect(cityBody.authors.map((item) => item.author.slug)).toEqual([
      other.slug,
    ]);
    expect(emptyBody.authors).toEqual([]);
    expect(emptyBody.pagination.total).toBe(0);

    const page1 = await guest.get('/authors?sort=name&limit=1');
    const page2 = await guest.get('/authors?sort=name&page=2&limit=1');
    const first = (await page1.json()) as {
      authors: Array<{ author: { slug: string; fullName: string } }>;
      pagination: { total: number; page: number };
    };
    const second = (await page2.json()) as {
      authors: Array<{ author: { slug: string; fullName: string } }>;
      pagination: { total: number; page: number };
    };
    expect(first.pagination.total).toBe(2);
    expect(second.pagination.total).toBe(2);
    expect(first.authors[0]?.author.fullName).toBe('Alpha Author');
    expect(second.authors[0]?.author.fullName).toBe('Beta Author');
    expect(first.authors[0]?.author.slug).not.toBe(
      second.authors[0]?.author.slug,
    );
  });
});
