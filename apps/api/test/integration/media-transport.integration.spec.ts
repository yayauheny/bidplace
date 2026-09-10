import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import type { PrismaClient } from '@bidplace/database';
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
    const images = await Promise.all(
      Array.from({ length: productImageUploadLimits.maxFiles }, (_, position) =>
        prisma.productImage.create({
          data: {
            productId: product.id,
            position,
            mimeType: 'image/png',
            byteLength: permissionImage.byteLength,
            data: permissionImage,
            checksum: position.toString().padStart(64, '0'),
          },
        }),
      ),
    );
    const revision = await prisma.productRevision.create({
      data: {
        productId: product.id,
        version: 1,
        status: 'DRAFT',
        title: 'Capacity test',
        images: {
          create: images.map((image, position) => ({
            imageId: image.id,
            position,
          })),
        },
      },
      select: { id: true },
    });
    await prisma.product.update({
      where: { id: product.id },
      data: { editingRevisionId: revision.id },
    });
    const service = new ImagesService(prisma as never, {
      put: async () => undefined,
      get: async () => null,
      delete: async () => undefined,
    } as never);

    await expect(
      service.add(fixture.sellers.approved.id, product.id, [
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
      'public, max-age=31536000, immutable',
    );
    expect((await guest.get(`/authors/${seller.slug}`)).status).toBe(200);

    const photoResponse = await guest.get(`/sellers/${seller.slug}/photo`);
    await expectImageResponse(photoResponse);
    expect(photoResponse.headers.get('cache-control')).toBe(
      'public, max-age=0, must-revalidate',
    );
    expect((await guest.get(`/authors/${seller.slug}`)).status).toBe(200);

    await prisma.sellerProfile.update({
      where: { id: fixture.sellers.approved.profileId },
      data: { status: 'SUSPENDED' },
    });

    expect((await guest.get(`/images/${productImage.id}`)).status).toBe(404);
    expect((await guest.get(`/authors/${seller.slug}`)).status).toBe(404);
  });
});
