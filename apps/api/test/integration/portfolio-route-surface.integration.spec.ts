import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import type { PrismaClient } from '@bidplace/database';
import {
  ApiErrorCode,
  apiErrorResponseSchema,
  portfolioAuthorDetailResponseSchema,
  portfolioAuthorsResponseSchema,
  portfolioDiscoveryFacetsResponseSchema,
  portfolioHomeResponseSchema,
  portfolioWorkDetailResponseSchema,
  portfolioWorksResponseSchema,
} from '@bidplace/contracts';

import {
  createHttpTestApp,
  HttpTestClient,
  type HttpTestApp,
} from './http-test-app';
import {
  createPermissionFixture,
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
  http = await createHttpTestApp(database.databaseUrl);
});

afterEach(async () => resetPermissionFixture(prisma));

afterAll(async () => {
  await http?.close();
  await database?.cleanup();
});

describe('portfolio HTTP route surface', () => {
  it('preserves public query results and validation errors', async () => {
    const fixture = await createPermissionFixture(prisma);
    const seller = await prisma.sellerProfile.findUniqueOrThrow({
      where: { id: fixture.sellers.approved.profileId },
      select: { slug: true },
    });
    const guest = new HttpTestClient(http.baseUrl, 'http://localhost:8081');

    for (const path of [
      '/works?page=1&limit=1&sort=newest',
      '/authors?page=1&limit=1&sort=added',
      `/authors/${seller.slug}?page=1&limit=1&sort=newest`,
    ]) {
      expect((await guest.get(path)).status).toBe(200);
    }

    for (const path of [
      '/works?page=not-a-page',
      '/authors?page=not-a-page',
      `/authors/${seller.slug}?page=not-a-page`,
    ]) {
      const response = await guest.get(path);
      expect(response.status).toBe(400);
      expect(apiErrorResponseSchema.parse(await response.json()).code).toBe(
        ApiErrorCode.VALIDATION_ERROR,
      );
    }
  });

  it('returns 404 for removed catalog and commerce routes and 200 for contract-valid portfolio reads', async () => {
    const fixture = await createPermissionFixture(prisma);
    const product = await prisma.product.findUniqueOrThrow({
      where: { id: fixture.approvedProductId },
      select: { publicId: true },
    });
    const seller = await prisma.sellerProfile.findUniqueOrThrow({
      where: { id: fixture.sellers.approved.profileId },
      select: { slug: true },
    });
    const guest = new HttpTestClient(http.baseUrl, 'http://localhost:8081');

    const removedGets = [
      '/products',
      `/products/${product.publicId}`,
      '/sellers',
      `/sellers/${seller.slug}/detail`,
      `/listings/${fixture.approvedListingId}`,
      `/listings/${fixture.approvedListingId}/bids`,
      '/orders',
      `/orders/${product.publicId}`,
    ];

    for (const path of removedGets) {
      const response = await guest.get(path);
      expect({ path, status: response.status }).toEqual({ path, status: 404 });
    }

    const listingCreate = await guest.post(
      `/products/${fixture.approvedProductId}/listings`,
      {
        startsAt: new Date(Date.now() + 3_600_000).toISOString(),
        endsAt: new Date(Date.now() + 7_200_000).toISOString(),
        startPrice: 10,
      },
    );
    expect(listingCreate.status).toBe(404);

    const bidPlace = await guest.post(
      `/listings/${fixture.approvedListingId}/bids`,
      { amount: 20 },
    );
    expect(bidPlace.status).toBe(404);

    const works = await guest.get('/works');
    expect(works.status).toBe(200);
    const worksBody = portfolioWorksResponseSchema.parse(await works.json());
    expect(
      worksBody.works.some((item) => item.work.publicId === product.publicId),
    ).toBe(true);

    const work = await guest.get(`/works/${product.publicId}`);
    expect(work.status).toBe(200);
    expect(
      portfolioWorkDetailResponseSchema.parse(await work.json()).work.publicId,
    ).toBe(product.publicId);

    const authors = await guest.get('/authors');
    expect(authors.status).toBe(200);
    const authorsBody = portfolioAuthorsResponseSchema.parse(
      await authors.json(),
    );
    expect(
      authorsBody.authors.some((item) => item.author.slug === seller.slug),
    ).toBe(true);

    const author = await guest.get(`/authors/${seller.slug}`);
    expect(author.status).toBe(200);
    expect(
      portfolioAuthorDetailResponseSchema.parse(await author.json()).author
        .slug,
    ).toBe(seller.slug);

    const home = await guest.get('/portfolio/home');
    expect(home.status).toBe(200);
    portfolioHomeResponseSchema.parse(await home.json());

    const facets = await guest.get('/portfolio/facets');
    expect(facets.status).toBe(200);
    portfolioDiscoveryFacetsResponseSchema.parse(await facets.json());
  });
});
