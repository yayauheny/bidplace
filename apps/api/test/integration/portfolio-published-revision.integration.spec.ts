import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import type { PrismaClient } from '@bidplace/database';

import {
  createIntegrationDatabaseContext,
  type IntegrationDatabaseContext,
} from './test-database';
import {
  createPermissionFixture,
  fixturePasswordHash,
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

function imageForm(): FormData {
  const form = new FormData();
  form.append(
    'images',
    new Blob([permissionImage], { type: 'image/png' }),
    'photo.png',
  );
  return form;
}

async function login(client: HttpTestClient, email: string, password: string) {
  const response = await client.post('/auth/login', { email, password });
  expect(response.status).toBe(201);
}

describe('portfolio published revision HTTP transport', () => {
  it('keeps RFC-minimal Work public JSON on the published revision through edit, approve, hide and unhide', async () => {
    const fixture = await createPermissionFixture(prisma);
    await prisma.sellerProfile.update({
      where: { id: fixture.sellers.approved.profileId },
      data: { city: 'Minsk', discipline: 'Автор' },
    });
    const admin = await prisma.user.create({
      data: {
        email: `admin.portfolio.${fixture.categoryId.slice(0, 8)}@wave3.test`,
        passwordHash: fixturePasswordHash,
        displayName: 'Portfolio admin',
        role: 'admin',
      },
      select: { email: true },
    });
    const owner = new HttpTestClient(http.baseUrl, 'http://localhost:8081');
    const guest = new HttpTestClient(http.baseUrl, 'http://localhost:8081');
    const adminClient = new HttpTestClient(http.baseUrl, 'http://localhost:8081');

    await login(
      owner,
      fixture.sellers.approved.email,
      fixture.sellers.approved.password,
    );
    await login(adminClient, admin.email, 'password123');

    const created = await owner.post('/products', {
      title: 'RFC minimal work',
      categoryId: fixture.categoryId,
    });
    expect(created.status).toBe(201);
    const createdBody = (await created.json()) as {
      product: { id: string; publicId: string };
    };
    const productId = createdBody.product.id;
    const publicId = createdBody.product.publicId;

    expect(
      (await owner.post(`/products/${productId}/images`, imageForm())).status,
    ).toBe(201);
    expect((await owner.post(`/products/${productId}/submit`)).status).toBe(201);
    expect(
      (
        await adminClient.patch(`/admin/products/${productId}/status`, {
          status: 'APPROVED',
        })
      ).status,
    ).toBe(200);

    const published = await guest.get(`/works/${publicId}`);
    expect(published.status).toBe(200);
    const publishedBody = (await published.json()) as {
      work: { story: string | null; images: Array<{ id: string }> };
    };
    expect(publishedBody.work.story).toBeNull();
    expect(publishedBody.work.images).toHaveLength(1);
    const publishedImageId = publishedBody.work.images[0]!.id;

    const product = await prisma.product.findUniqueOrThrow({
      where: { id: productId },
      select: {
        publishedRevisionId: true,
        publishedRevision: {
          select: {
            categoryId: true,
            title: true,
            story: true,
            version: true,
          },
        },
      },
    });
    const pendingImage = await prisma.productImage.create({
      data: {
        productId,
        position: 1,
        mimeType: 'image/png',
        byteLength: permissionImage.byteLength,
        data: permissionImage,
        checksum: '9'.repeat(64),
      },
      select: { id: true },
    });
    const pendingRevision = await prisma.productRevision.create({
      data: {
        productId,
        version: (product.publishedRevision?.version ?? 1) + 1,
        status: 'PENDING_REVIEW',
        categoryId: product.publishedRevision?.categoryId ?? fixture.categoryId,
        title: product.publishedRevision?.title ?? 'RFC minimal work',
        story: product.publishedRevision?.story ?? null,
        images: {
          create: [
            { imageId: publishedImageId, position: 0 },
            { imageId: pendingImage.id, position: 1 },
          ],
        },
      },
      select: { id: true },
    });
    await prisma.product.update({
      where: { id: productId },
      data: { editingRevisionId: pendingRevision.id },
    });

    const pendingPublic = await guest.get(`/works/${publicId}`);
    expect(pendingPublic.status).toBe(200);
    expect(
      ((await pendingPublic.json()) as { work: { images: unknown[] } }).work
        .images,
    ).toHaveLength(1);
    expect((await guest.get(`/images/${pendingImage.id}`)).status).toBe(404);
    expect((await guest.get(`/images/${publishedImageId}`)).status).toBe(200);

    await prisma.productRevision.update({
      where: { id: pendingRevision.id },
      data: { status: 'APPROVED' },
    });
    await prisma.product.update({
      where: { id: productId },
      data: { publishedRevisionId: pendingRevision.id },
    });

    const approvedAgain = await guest.get(`/works/${publicId}`);
    expect(approvedAgain.status).toBe(200);
    expect(
      ((await approvedAgain.json()) as { work: { images: unknown[] } }).work
        .images,
    ).toHaveLength(2);

    expect((await owner.post(`/products/${productId}/hide`)).status).toBe(201);
    expect((await guest.get(`/works/${publicId}`)).status).toBe(404);
    expect((await guest.get(`/images/${publishedImageId}`)).status).toBe(404);

    expect((await owner.post(`/products/${productId}/unhide`)).status).toBe(201);
    const restored = await guest.get(`/works/${publicId}`);
    expect(restored.status).toBe(200);
    expect(
      ((await restored.json()) as { work: { images: unknown[] } }).work.images,
    ).toHaveLength(2);
  });

  it('keeps an author without listings visible on the public author route', async () => {
    const fixture = await createPermissionFixture(prisma);
    await prisma.listing.deleteMany({
      where: { product: { sellerProfileId: fixture.sellers.approved.profileId } },
    });
    const author = await prisma.sellerProfile.findUniqueOrThrow({
      where: { id: fixture.sellers.approved.profileId },
      select: { slug: true },
    });
    const guest = new HttpTestClient(http.baseUrl, 'http://localhost:8081');

    const response = await guest.get(`/authors/${author.slug}`);
    expect(response.status).toBe(200);
    expect(
      ((await response.json()) as { author: { slug: string } }).author.slug,
    ).toBe(author.slug);
  });
});
