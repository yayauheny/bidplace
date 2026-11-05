import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import type { PrismaClient } from '@bidplace/database';
import { PostgresImageStore } from '../../src/core/image-store';
import { ImagesService } from '../../src/images/images.service';
import { productImageUploadLimits } from '../../src/images/image-policy';

import {
  createIntegrationDatabaseContext,
  type IntegrationDatabaseContext,
} from './test-database';
import {
  createPermissionFixture,
  permissionImage,
  resetPermissionFixture,
} from './permission-fixtures';
import {
  createHttpTestApp,
  HttpTestClient,
  type HttpTestApp,
} from './http-test-app';

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

async function expectImageResponse(response: Response): Promise<void> {
  expect(response.status).toBe(200);
  expect(response.headers.get('content-type')).toMatch(/^image\/png/);
  expect(Buffer.from(await response.arrayBuffer())).toEqual(permissionImage);
}

describe('public media transport over HTTP and PostgreSQL', () => {
  it.each(['hidden', 'deleted', 'suspended', 'banned'] as const)(
    'requires API preview revalidation before a work becomes %s',
    async (revocation) => {
      const fixture = await createPermissionFixture(prisma);
      const guest = new HttpTestClient(http.baseUrl);
      const image = await prisma.productImage.findFirstOrThrow({ where: { productId: fixture.approvedProductId } });
      const path = `/images/${image.id}`;
      const publicImage = await guest.get(path);
      await expectImageResponse(publicImage);
      expect(publicImage.headers.get('cache-control')).toBe('public, max-age=0, must-revalidate');
      expect((await guest.get(`${path}?source=true`)).status).toBe(404);
      if (revocation === 'hidden' || revocation === 'deleted') {
        await prisma.product.update({ where: { id: fixture.approvedProductId }, data:
          revocation === 'hidden' ? { status: 'ARCHIVED' } : { deletedAt: new Date() },
        });
      } else if (revocation === 'suspended') {
        await prisma.sellerProfile.update({ where: { id: fixture.sellers.approved.profileId }, data: { status: 'SUSPENDED' } });
      } else {
        await prisma.user.update({ where: { id: fixture.sellers.approved.id }, data: { status: 'banned' } });
      }
      expect((await guest.get(path)).status).toBe(404);
    },
  );

  it('rechecks current visibility before honoring a public image ETag', async () => {
    const fixture = await createPermissionFixture(prisma);
    const image = await prisma.productImage.findFirstOrThrow({ where: { productId: fixture.approvedProductId } });
    const guest = new HttpTestClient(http.baseUrl);
    const path = `/images/${image.id}`;
    const first = await guest.get(path);
    await expectImageResponse(first);
    const etag = first.headers.get('etag');
    expect(etag).toBeTruthy();
    const headers = { 'if-none-match': etag!, 'cache-control': 'max-age=0' };
    const unchanged = await guest.get(path, { headers });
    expect(unchanged.status).toBe(304);
    expect((await unchanged.arrayBuffer()).byteLength).toBe(0);
    await prisma.product.update({ where: { id: fixture.approvedProductId }, data: { status: 'ARCHIVED' } });
    expect((await guest.get(path, { headers })).status).toBe(404);
  });

  it('enforces aggregate Product image capacity in PostgreSQL', async () => {
    const fixture = await createPermissionFixture(prisma);
    const product = await prisma.product.create({
      data: {
        publicId: 'capacity001',
        sellerProfileId: fixture.sellers.approved.profileId,
        title: 'Capacity test',
        status: 'DRAFT',
      },
    });
    await prisma.productImage.createMany({
      data: Array.from(
        { length: productImageUploadLimits.maxFiles },
        (_, position) => ({
          productId: product.id,
          position,
          mimeType: 'image/png',
          byteLength: permissionImage.byteLength,
          data: permissionImage,
          checksum: position.toString().padStart(64, '0'),
        }),
      ),
    });
    const images = new ImagesService(prisma as never, new PostgresImageStore(prisma as never));

    await expect(
      images.add(fixture.sellers.approved.id, product.id, [
        { buffer: permissionImage, mimetype: 'image/png' },
      ]),
    ).rejects.toThrow(
      `A Product can have at most ${productImageUploadLimits.maxFiles} images`,
    );
    expect(
      await prisma.productImage.count({ where: { productId: product.id } }),
    ).toBe(productImageUploadLimits.maxFiles);
  });

  it('serves guest ProductImage and SellerProfile photo responses without breaking the next API request', async () => {
    const fixture = await createPermissionFixture(prisma);
    const seller = await prisma.sellerProfile.findUniqueOrThrow({
      where: { id: fixture.sellers.approved.profileId },
      select: { slug: true },
    });
    const productImage = await prisma.productImage.findFirstOrThrow({
      where: { productId: fixture.approvedProductId },
      select: { id: true },
    });

    const guest = new HttpTestClient(
      http.baseUrl,
      'http://localhost:8081',
      '10.0.3.2',
    );

    const imageResponse = await guest.get(`/images/${productImage.id}`);
    await expectImageResponse(imageResponse);
    expect(imageResponse.headers.get('cache-control')).toBe(
      'public, max-age=0, must-revalidate',
    );
    const bids = await guest.get(`/listings/${fixture.approvedListingId}/bids`);
    expect(bids.status).toBe(200);
    expect(await bids.json()).toEqual({ bids: [] });
    expect((await guest.get(`/sellers/${seller.slug}/detail`)).status).toBe(
      404,
    );

    const photoResponse = await guest.get(`/sellers/${seller.slug}/photo`);
    await expectImageResponse(photoResponse);
    expect(photoResponse.headers.get('cache-control')).toBe(
      'public, max-age=0, must-revalidate',
    );

    await prisma.sellerProfile.update({
      where: { id: fixture.sellers.approved.profileId },
      data: { status: 'SUSPENDED' },
    });

    expect((await guest.get(`/images/${productImage.id}`)).status).toBe(404);
    const bidsAfterSuspension = await guest.get(
      `/listings/${fixture.approvedListingId}/bids`,
    );
    expect(bidsAfterSuspension.status).toBe(200);
    expect(await bidsAfterSuspension.json()).toEqual({ bids: [] });
  });
});
