import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { Prisma, type PrismaClient } from '@bidplace/database';

import { portfolioCatalogCte } from '../../src/products/products-catalog.query';
import { ProductsService } from '../../src/products/products.service';
import { SellersService } from '../../src/sellers/sellers.service';
import { publicAuthorCte } from '../../src/sellers/sellers-catalog.query';
import { PrismaService } from '../../src/core/database';
import { ImageStore } from '../../src/core/image-store';
import { PublicIdService } from '../../src/core/public-id';
import {
  createHttpTestApp,
  HttpTestClient,
  type HttpTestApp,
} from './http-test-app';
import {
  createPermissionFixture,
  fixturePasswordHash,
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

async function createFacetAuthor(input: {
  slug: string;
  city: string | null;
  discipline: string | null;
  status?: 'APPROVED' | 'DRAFT' | 'PENDING_REVIEW' | 'SUSPENDED';
}) {
  const user = await prisma.user.create({
    data: {
      email: `${input.slug}@facet.test`,
      passwordHash: fixturePasswordHash,
      displayName: input.slug,
    },
    select: { id: true },
  });
  return prisma.sellerProfile.create({
    data: {
      userId: user.id,
      slug: input.slug,
      sellerType: 'creator',
      fullName: input.slug,
      country: 'BY',
      city: input.city,
      discipline: input.discipline,
      profilePhotoMimeType: 'image/png',
      profilePhotoByteLength: permissionImage.byteLength,
      profilePhotoChecksum: 'b'.repeat(64),
      profilePhotoData: permissionImage,
      status: input.status ?? 'APPROVED',
    },
    select: { id: true },
  });
}

async function createFacetWork(input: {
  sellerProfileId: string;
  categoryId: string;
  publicId: string;
  materials?: string | null;
  parentMaterials?: string | null;
  title?: string | null;
  status?: 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'ARCHIVED' | 'REJECTED';
  publishedAt?: Date | null;
  linkPublishedRevision?: boolean;
  withRevisionImage?: boolean;
  revisionCategoryId?: string | null;
  editingMaterials?: string;
}) {
  const status = input.status ?? 'APPROVED';
  const linkPublishedRevision = input.linkPublishedRevision ?? true;
  const withRevisionImage = input.withRevisionImage ?? true;
  const title = input.title === undefined ? input.publicId : input.title;
  const publishedAt =
    input.publishedAt === undefined
      ? new Date('2026-09-01T00:00:00.000Z')
      : input.publishedAt;
  const product = await prisma.product.create({
    data: {
      publicId: input.publicId,
      sellerProfileId: input.sellerProfileId,
      categoryId: input.categoryId,
      title: title ?? input.publicId,
      story: 'Facet fixture',
      materials:
        input.parentMaterials === undefined
          ? (input.materials ?? null)
          : input.parentMaterials,
      status,
      publishedAt,
      ...(withRevisionImage
        ? {
            images: {
              create: {
                position: 0,
                mimeType: 'image/png',
                byteLength: permissionImage.byteLength,
                data: permissionImage,
                checksum: 'a'.repeat(64),
              },
            },
          }
        : {}),
    },
    select: { id: true, images: { select: { id: true } } },
  });
  const revision = await prisma.productRevision.create({
    data: {
      productId: product.id,
      version: 1,
      status,
      categoryId:
        input.revisionCategoryId === undefined
          ? input.categoryId
          : input.revisionCategoryId,
      title,
      story: 'Facet fixture',
      materials: input.materials,
      ...(withRevisionImage && product.images[0]
        ? {
            images: {
              create: {
                imageId: product.images[0].id,
                position: 0,
              },
            },
          }
        : {}),
    },
  });
  let editingRevisionId = revision.id;
  if (input.editingMaterials !== undefined) {
    const editing = await prisma.productRevision.create({
      data: {
        productId: product.id,
        version: 2,
        status: 'DRAFT',
        categoryId: input.categoryId,
        title: `${input.publicId} edit`,
        story: 'Editing revision',
        materials: input.editingMaterials,
      },
    });
    editingRevisionId = editing.id;
  }
  await prisma.product.update({
    where: { id: product.id },
    data: {
      editingRevisionId,
      publishedRevisionId: linkPublishedRevision ? revision.id : null,
    },
  });
  return product;
}

const previousMaterialFacetSql = Prisma.sql`
  SELECT "materials"
  FROM filtered
  WHERE NULLIF(BTRIM("materials"), '') IS NOT NULL`;

const previousAuthorFacetSql = Prisma.sql`
  SELECT "city", "discipline"
  FROM filtered`;

describe('portfolio catalog SQL filters and pagination', () => {
  it.each(['hide', 'suspend', 'ban', 'unpublish'] as const)(
    'excludes a Work when %s commits between catalog selection and hydration',
    async (transition) => {
      const fixture = await createPermissionFixture(prisma);
      const target = await publishWork({
        sellerProfileId: fixture.sellers.approved.profileId,
        categoryId: fixture.categoryId,
        publicId: 'raceWork001',
        title: 'Hydration race target',
        materials: 'Canvas',
        publishedAt: new Date('2026-09-02T00:00:00.000Z'),
      });
      const control = await publishWork({
        sellerProfileId: fixture.sellers.otherApproved.profileId,
        categoryId: fixture.categoryId,
        publicId: 'raceWork002',
        title: 'Hydration race control',
        materials: 'Canvas',
        publishedAt: new Date('2026-09-01T00:00:00.000Z'),
      });
      let hydrated = false;
      const racePrisma = prisma.$extends({
        query: {
          product: {
            async findMany({ args, query }) {
              expect(hydrated).toBe(false);
              expect(args.where?.id).toEqual({ in: [target.id, control.id] });
              if (transition === 'hide' || transition === 'unpublish') {
                await prisma.product.update({
                  where: { id: target.id },
                  data: transition === 'hide'
                    ? { status: 'ARCHIVED' }
                    : { publishedRevisionId: null },
                });
              } else {
                await prisma.sellerProfile.update({
                  where: { id: fixture.sellers.approved.profileId },
                  data: transition === 'suspend'
                    ? { status: 'SUSPENDED' }
                    : { user: { update: { status: 'banned' } } },
                });
              }
              hydrated = true;
              return query(args);
            },
          },
        },
      });
      const service = new ProductsService(
        racePrisma as unknown as PrismaService,
        http.app.get(PublicIdService),
      );

      const response = await service.listPortfolio({
        page: 1, limit: 8, sort: 'newest', q: 'Hydration race',
      });

      expect(hydrated).toBe(true);
      expect(response.items.map((item) => item.product.publicId)).toEqual([control.publicId]);
      expect(response.pagination).toEqual({ page: 1, limit: 8, total: 2 });
    },
  );

  it.each(['suspend', 'ban'] as const)(
    'excludes an Author when %s commits between catalog selection and hydration',
    async (transition) => {
      const fixture = await createPermissionFixture(prisma);
      const targetId = fixture.sellers.approved.profileId;
      const controlId = fixture.sellers.otherApproved.profileId;
      await prisma.sellerProfile.update({
        where: { id: targetId },
        data: { fullName: 'Hydration author target' },
      });
      await prisma.sellerProfile.update({
        where: { id: controlId },
        data: { fullName: 'Hydration author control' },
      });
      let hydrated = false;
      const racePrisma = prisma.$extends({
        query: {
          sellerProfile: {
            async findMany({ args, query }) {
              expect(hydrated).toBe(false);
              expect(args.where?.id).toEqual({ in: [controlId, targetId] });
              await prisma.sellerProfile.update({
                where: { id: targetId },
                data: transition === 'suspend'
                  ? { status: 'SUSPENDED' }
                  : { user: { update: { status: 'banned' } } },
              });
              hydrated = true;
              return query(args);
            },
          },
        },
      });
      const service = new SellersService(
        racePrisma as unknown as PrismaService,
        http.app.get(ImageStore),
      );

      const response = await service.listPortfolioAuthors(
        { page: 1, limit: 8, sort: 'name', q: 'Hydration author' },
        { requireCity: true },
      );

      expect(hydrated).toBe(true);
      expect(response.sellers.map((item) => item.sellerProfile.fullName)).toEqual(['Hydration author control']);
      expect(response.pagination).toEqual({ page: 1, limit: 8, total: 2 });
    },
  );

  it('returns normalized facets from public authors and published works only', async () => {
    const fixture = await createPermissionFixture(prisma);
    const guest = new HttpTestClient(http.baseUrl, 'http://localhost:8081');
    await prisma.sellerProfile.update({
      where: { id: fixture.sellers.approved.profileId },
      data: { city: 'Минск', discipline: 'Живопись' },
    });
    await prisma.sellerProfile.update({
      where: { id: fixture.sellers.otherApproved.profileId },
      data: { city: 'Гродно', discipline: 'Керамика' },
    });
    await prisma.sellerProfile.update({
      where: { id: fixture.sellers.pending.profileId },
      data: { city: 'Секретный город', discipline: 'Секрет' },
    });
    const publicWork = await publishWork({
      sellerProfileId: fixture.sellers.approved.profileId,
      categoryId: fixture.categoryId,
      publicId: 'facetPub001',
      title: 'Public canvas one',
      materials: 'Холст',
      publishedAt: new Date('2026-09-01T00:00:00.000Z'),
    });
    await prisma.product.update({
      where: { id: publicWork.id },
      data: { materials: 'Непубличный черновик' },
    });
    await publishWork({
      sellerProfileId: fixture.sellers.approved.profileId,
      categoryId: fixture.categoryId,
      publicId: 'facetPub002',
      title: 'Public canvas two',
      materials: ' холст ',
      publishedAt: new Date('2026-09-02T00:00:00.000Z'),
    });
    await publishWork({
      sellerProfileId: fixture.sellers.pending.profileId,
      categoryId: fixture.categoryId,
      publicId: 'facetSec001',
      title: 'Non-public material',
      materials: 'Секрет',
      publishedAt: new Date('2026-09-03T00:00:00.000Z'),
    });

    const response = await guest.get('/portfolio/facets');
    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      materials: string[];
      cities: string[];
      tags: string[];
    };
    // 'Холст' and ' холст ' share one locale key. Which spelling is kept is
    // the first unordered DISTINCT row, the same rule as the previous scan.
    expect(body.materials).toHaveLength(1);
    expect(body.materials[0]?.toLocaleLowerCase('ru-RU')).toBe('холст');
    expect(['Холст', 'холст']).toContain(body.materials[0]);
    expect(body.cities).toEqual(['Гродно', 'Минск']);
    expect(body.tags).toEqual(['Живопись', 'Керамика']);
    const publishedFilter = await guest.get('/works?materials=Холст');
    const draftFilter = await guest.get(
      '/works?materials=Непубличный%20черновик',
    );
    expect(
      (
        (await publishedFilter.json()) as {
          works: Array<{ work: { publicId: string } }>;
        }
      ).works.map((item) => item.work.publicId),
    ).toEqual(['facetPub002', 'facetPub001']);
    expect(
      (
        (await draftFilter.json()) as {
          works: Array<{ work: { publicId: string } }>;
        }
      ).works,
    ).toEqual([]);
  });

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

  it('orders authors by profile created_at for sort=added, not latest work', async () => {
    const fixture = await createPermissionFixture(prisma);
    const guest = new HttpTestClient(http.baseUrl, 'http://localhost:8081');
    const older = await prisma.sellerProfile.update({
      where: { id: fixture.sellers.approved.profileId },
      data: {
        fullName: 'Older Added',
        city: 'Minsk',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      },
      select: { slug: true },
    });
    const newer = await prisma.sellerProfile.update({
      where: { id: fixture.sellers.otherApproved.profileId },
      data: {
        fullName: 'Newer Added',
        city: 'Minsk',
        createdAt: new Date('2026-08-01T00:00:00.000Z'),
      },
      select: { slug: true },
    });
    await publishWork({
      sellerProfileId: fixture.sellers.approved.profileId,
      categoryId: fixture.categoryId,
      publicId: 'sortOld001',
      title: 'Recent work on older author',
      materials: 'шамот',
      publishedAt: new Date('2026-09-10T00:00:00.000Z'),
    });
    await publishWork({
      sellerProfileId: fixture.sellers.otherApproved.profileId,
      categoryId: fixture.categoryId,
      publicId: 'sortNew001',
      title: 'Older work on newer author',
      materials: 'дерево',
      publishedAt: new Date('2026-02-01T00:00:00.000Z'),
    });

    const added = await guest.get('/authors?sort=added');
    expect(added.status).toBe(200);
    const addedBody = (await added.json()) as {
      authors: Array<{ author: { slug: string } }>;
    };
    expect(addedBody.authors.map((item) => item.author.slug)).toEqual([
      newer.slug,
      older.slug,
    ]);

    const byName = await guest.get('/authors?sort=name');
    expect(byName.status).toBe(200);
    const nameBody = (await byName.json()) as {
      authors: Array<{ author: { fullName: string } }>;
    };
    expect(nameBody.authors.map((item) => item.author.fullName)).toEqual([
      'Newer Added',
      'Older Added',
    ]);
  });

  it('returns empty facet arrays when no public records exist', async () => {
    const guest = new HttpTestClient(http.baseUrl, 'http://localhost:8081');

    const response = await guest.get('/portfolio/facets');

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      materials: [],
      cities: [],
      tags: [],
    });
  });

  it('keeps public facet values and drops private, blank, and non-published ones', async () => {
    const category = await prisma.category.create({
      data: { slug: 'facet-visibility', name: 'Facet visibility' },
      select: { id: true },
    });
    const visible = await createFacetAuthor({
      slug: 'facet-minsk',
      city: 'Минск',
      discipline: 'Живопись',
    });
    await createFacetAuthor({
      slug: 'facet-minsk-pad',
      city: ' Минск ',
      discipline: 'живопись',
    });
    await createFacetAuthor({
      slug: 'facet-grodno',
      city: 'Гродно',
      discipline: 'Керамика',
    });
    await createFacetAuthor({
      slug: 'facet-gomel',
      city: 'Гомель',
      discipline: 'керамика',
    });
    await createFacetAuthor({
      slug: 'facet-brest',
      city: 'Брест',
      discipline: 'Стекло',
    });
    await createFacetAuthor({
      slug: 'facet-vitebsk',
      city: 'Витебск',
      discipline: null,
    });
    await createFacetAuthor({
      slug: 'facet-vitebsk-blank',
      city: 'Витебск',
      discipline: '   ',
    });
    await createFacetAuthor({
      slug: 'facet-nbsp-city',
      city: '\u00A0',
      discipline: 'Неразрывный',
    });
    await createFacetAuthor({
      slug: 'facet-blank-city',
      city: '   ',
      discipline: 'Пробельный город',
    });
    await createFacetAuthor({
      slug: 'facet-null-city',
      city: null,
      discipline: 'Без города',
    });
    const suspended = await createFacetAuthor({
      slug: 'facet-suspended',
      city: 'Секретный город',
      discipline: 'Секрет',
      status: 'SUSPENDED',
    });
    await createFacetAuthor({
      slug: 'facet-draft-author',
      city: 'Черновик автора',
      discipline: 'Черновик',
      status: 'DRAFT',
    });
    const blankCity = await createFacetAuthor({
      slug: 'facet-work-blank-city',
      city: '   ',
      discipline: 'Материал без города',
    });

    for (const [index, materials] of (
      ['Холст', 'Холст', 'Холст', ' холст ', '\u00A0Холст\u00A0'] as const
    ).entries()) {
      await createFacetWork({
        sellerProfileId: visible.id,
        categoryId: category.id,
        publicId: `facetMat${index}`,
        materials,
        parentMaterials: 'Родительский материал',
      });
    }
    await createFacetWork({
      sellerProfileId: visible.id,
      categoryId: category.id,
      publicId: 'facetWood1',
      materials: 'Дерево',
    });
    await createFacetWork({
      sellerProfileId: visible.id,
      categoryId: category.id,
      publicId: 'facetWood2',
      materials: 'дерево',
    });
    await createFacetWork({
      sellerProfileId: visible.id,
      categoryId: category.id,
      publicId: 'facetBronz',
      materials: 'Бронза',
      editingMaterials: 'Черновик материала',
    });
    await createFacetWork({
      sellerProfileId: visible.id,
      categoryId: category.id,
      publicId: 'facetTab01',
      materials: '\t',
    });
    await createFacetWork({
      sellerProfileId: visible.id,
      categoryId: category.id,
      publicId: 'facetSpace1',
      materials: '   ',
    });
    await createFacetWork({
      sellerProfileId: visible.id,
      categoryId: category.id,
      publicId: 'facetEmpty1',
      materials: '',
    });
    await createFacetWork({
      sellerProfileId: visible.id,
      categoryId: category.id,
      publicId: 'facetNull01',
      materials: null,
    });
    await createFacetWork({
      sellerProfileId: visible.id,
      categoryId: category.id,
      publicId: 'facetDraft1',
      materials: 'Материал черновика',
      status: 'DRAFT',
    });
    await createFacetWork({
      sellerProfileId: visible.id,
      categoryId: category.id,
      publicId: 'facetArchv1',
      materials: 'Материал архива',
      status: 'ARCHIVED',
    });
    await createFacetWork({
      sellerProfileId: visible.id,
      categoryId: category.id,
      publicId: 'facetPend01',
      materials: 'Материал модерации',
      status: 'PENDING_REVIEW',
    });
    await createFacetWork({
      sellerProfileId: suspended.id,
      categoryId: category.id,
      publicId: 'facetSusp01',
      materials: 'Материал суспенда',
    });
    await createFacetWork({
      sellerProfileId: visible.id,
      categoryId: category.id,
      publicId: 'facetTitle1',
      materials: 'Материал без названия',
      title: '   ',
    });
    await createFacetWork({
      sellerProfileId: visible.id,
      categoryId: category.id,
      publicId: 'facetPhoto1',
      materials: 'Материал без фото',
      withRevisionImage: false,
    });
    await createFacetWork({
      sellerProfileId: visible.id,
      categoryId: category.id,
      publicId: 'facetRev001',
      materials: 'Материал без ревизии',
      linkPublishedRevision: false,
    });
    await createFacetWork({
      sellerProfileId: visible.id,
      categoryId: category.id,
      publicId: 'facetDate01',
      materials: 'Материал без даты',
      publishedAt: null,
    });
    await createFacetWork({
      sellerProfileId: blankCity.id,
      categoryId: category.id,
      publicId: 'facetCity01',
      materials: 'Материал без города',
    });
    await createFacetWork({
      sellerProfileId: visible.id,
      categoryId: category.id,
      publicId: 'facetCat001',
      materials: 'Материал без категории',
      revisionCategoryId: null,
    });

    const guest = new HttpTestClient(http.baseUrl, 'http://localhost:8081');
    const response = await guest.get('/portfolio/facets');
    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      materials: string[];
      cities: string[];
      tags: string[];
    };
    expect(body.materials.map((value) => value.toLocaleLowerCase('ru-RU'))).toEqual([
      'бронза',
      'дерево',
      'холст',
    ]);
    expect(body.materials[0]).toBe('Бронза');
    expect(['Дерево', 'дерево']).toContain(body.materials[1]);
    expect(['Холст', 'холст']).toContain(body.materials[2]);
    expect(body.cities).toEqual([
      'Брест',
      'Витебск',
      'Гомель',
      'Гродно',
      'Минск',
    ]);
    expect(body.tags.map((value) => value.toLocaleLowerCase('ru-RU'))).toEqual([
      'живопись',
      'керамика',
      'неразрывный',
      'стекло',
    ]);
    expect(['Живопись', 'живопись']).toContain(body.tags[0]);
    expect(['Керамика', 'керамика']).toContain(body.tags[1]);
    expect(body.tags[2]).toBe('Неразрывный');
    expect(body.tags[3]).toBe('Стекло');
    const privateValues = [
      'Родительский материал',
      'Черновик материала',
      'Материал черновика',
      'Материал архива',
      'Материал модерации',
      'Материал суспенда',
      'Материал без названия',
      'Материал без фото',
      'Материал без ревизии',
      'Материал без даты',
      'Материал без города',
      'Материал без категории',
      'Пробельный город',
      'Без города',
      'Секрет',
      'Секретный город',
      'Черновик',
      'Черновик автора',
    ];
    expect(
      [...body.materials, ...body.cities, ...body.tags].some((value) =>
        privateValues.includes(value),
      ),
    ).toBe(false);

    const materialRows = await http.app
      .get(ProductsService)
      .listPortfolioMaterialFacets();
    const authorRows = await http.app.get(SellersService).listPublicFacets();
    const fullMaterials = await prisma.$queryRaw<Array<{ materials: string | null }>>(
      Prisma.sql`${portfolioCatalogCte({ page: 1, limit: 1, sort: 'newest' })}
        ${previousMaterialFacetSql}`,
    );
    const fullAuthors = await prisma.$queryRaw<
      Array<{ city: string | null; discipline: string | null }>
    >(
      Prisma.sql`${publicAuthorCte({ page: 1, limit: 1, sort: 'added' }, { requireCity: true })}
        ${previousAuthorFacetSql}`,
    );
    expect(fullMaterials).toHaveLength(9);
    expect(materialRows).toHaveLength(7);
    expect(new Set(materialRows)).toEqual(
      new Set(fullMaterials.map((row) => row.materials)),
    );
    expect(fullAuthors).toHaveLength(8);
    expect(authorRows.cities).toHaveLength(7);
    expect(authorRows.tags).toHaveLength(8);
    expect(new Set(authorRows.cities)).toEqual(
      new Set(fullAuthors.map((row) => row.city)),
    );
    expect(new Set(authorRows.tags)).toEqual(
      new Set(fullAuthors.map((row) => row.discipline)),
    );
    expect(materialRows).toContain('\t');
    expect(materialRows).not.toContain('   ');
    expect(authorRows.tags).toContain('Неразрывный');
    expect(authorRows.cities).toContain('\u00A0');
    expect(body.cities).not.toContain('\u00A0');
  });

  it('returns the same facet JSON from distinct rows when many records share values', async () => {
    const category = await prisma.category.create({
      data: { slug: 'facet-volume', name: 'Facet volume' },
      select: { id: true },
    });
    const primary = await createFacetAuthor({
      slug: 'facet-volume-primary',
      city: 'Минск',
      discipline: 'Живопись',
    });
    for (let index = 0; index < 24; index += 1) {
      await createFacetAuthor({
        slug: `facet-volume-author-${index}`,
        city: index < 16 ? 'Минск' : 'Гродно',
        discipline: index < 16 ? 'Живопись' : 'Керамика',
      });
    }
    for (let index = 0; index < 36; index += 1) {
      await createFacetWork({
        sellerProfileId: primary.id,
        categoryId: category.id,
        publicId: `facetVol${index.toString().padStart(2, '0')}`,
        materials: index < 24 ? 'Холст' : 'Дерево',
      });
    }

    const guest = new HttpTestClient(http.baseUrl, 'http://localhost:8081');
    const response = await guest.get('/portfolio/facets');
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      materials: ['Дерево', 'Холст'],
      cities: ['Гродно', 'Минск'],
      tags: ['Живопись', 'Керамика'],
    });

    const materialRows = await http.app
      .get(ProductsService)
      .listPortfolioMaterialFacets();
    const authorRows = await http.app.get(SellersService).listPublicFacets();
    const fullMaterials = await prisma.$queryRaw<Array<{ materials: string | null }>>(
      Prisma.sql`${portfolioCatalogCte({ page: 1, limit: 1, sort: 'newest' })}
        ${previousMaterialFacetSql}`,
    );
    const fullAuthors = await prisma.$queryRaw<
      Array<{ city: string | null; discipline: string | null }>
    >(
      Prisma.sql`${publicAuthorCte({ page: 1, limit: 1, sort: 'added' }, { requireCity: true })}
        ${previousAuthorFacetSql}`,
    );
    expect(fullMaterials).toHaveLength(36);
    expect(materialRows).toHaveLength(2);
    expect(new Set(materialRows)).toEqual(new Set(['Холст', 'Дерево']));
    expect(fullAuthors).toHaveLength(25);
    expect(authorRows.cities).toHaveLength(2);
    expect(authorRows.tags).toHaveLength(2);
    expect(new Set(authorRows.cities)).toEqual(new Set(['Минск', 'Гродно']));
    expect(new Set(authorRows.tags)).toEqual(
      new Set(['Живопись', 'Керамика']),
    );
  });
});
