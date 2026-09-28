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
import { productModerationRequest } from './admin-status-request';

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
        await adminClient.patch(
          `/admin/products/${productId}/status`,
          await productModerationRequest(prisma, productId, 'APPROVED'),
        )
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

  it('rejects unsupported achievement images and hides unpublished bytes from guests', async () => {
    const fixture = await createPermissionFixture(prisma);
    const owner = new HttpTestClient(http.baseUrl, 'http://localhost:8081');
    const stranger = new HttpTestClient(http.baseUrl, 'http://localhost:8081');
    const guest = new HttpTestClient(http.baseUrl, 'http://localhost:8081');
    await login(
      owner,
      fixture.sellers.changes.email,
      fixture.sellers.changes.password,
    );
    await login(
      stranger,
      fixture.sellers.otherApproved.email,
      fixture.sellers.otherApproved.password,
    );

    const gif = new FormData();
    gif.set('body', 'Show');
    gif.set('occurredDate', JSON.stringify({ year: 2025, month: 3, day: null }));
    gif.append(
      'image',
      new Blob(
        [
          Buffer.from(
            'GIF89a\x01\x00\x01\x00\x80\x00\x00\xff\x00\x00\x00\x00\x00!\xf9\x04\x01\x00\x00\x00\x00,\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;',
          ),
        ],
        { type: 'image/gif' },
      ),
      'animation.gif',
    );
    expect((await owner.post('/author/application/achievements', gif)).status).toBe(
      400,
    );

    const uploaded = await owner.post(
      '/author/application/achievements',
      (() => {
        const form = new FormData();
        form.set('body', 'Show');
        form.set('occurredDate', JSON.stringify({ year: 2025, month: 3, day: null }));
        form.append(
          'image',
          new Blob([permissionImage], { type: 'image/png' }),
          'show.png',
        );
        return form;
      })(),
    );
    expect(uploaded.status).toBe(201);
    const uploadedId = (
      (await uploaded.json()) as { achievement: { id: string } }
    ).achievement.id;
    const ownerImage = await owner.get(
      `/author-achievements/${uploadedId}/image`,
    );
    expect(ownerImage.status).toBe(200);
    expect(ownerImage.headers.get('content-type')).toMatch(/image\/png/);
    expect(Buffer.from(await ownerImage.arrayBuffer()).subarray(0, 8)).toEqual(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    );
    expect(
      (await guest.get(`/author-achievements/${uploadedId}/image`)).status,
    ).toBe(404);
    expect(
      (await stranger.get(`/author-achievements/${uploadedId}/image`)).status,
    ).toBe(404);

    const created = await owner.post('/author/application/achievements', (() => {
      const form = new FormData();
      form.set('body', 'Show text only');
      form.set('occurredDate', JSON.stringify({ year: 2025, month: 3, day: null }));
      return form;
    })());
    expect(created.status).toBe(201);
    const achievementId = (
      (await created.json()) as { achievement: { id: string } }
    ).achievement.id;

    expect((await guest.get(`/author-achievements/${achievementId}/image`)).status).toBe(
      404,
    );
    expect(
      (await stranger.delete(`/author/application/achievements/${achievementId}`))
        .status,
    ).toBe(404);
  });

  it('keeps the public profile photo on the published object after a pending owner edit', async () => {
    const fixture = await createPermissionFixture(prisma);
    const owner = new HttpTestClient(http.baseUrl, 'http://localhost:8081');
    const guest = new HttpTestClient(http.baseUrl, 'http://localhost:8081');
    const author = await prisma.sellerProfile.findUniqueOrThrow({
      where: { id: fixture.sellers.approved.profileId },
      select: { slug: true, editingRevisionId: true },
    });
    await prisma.sellerProfileRevision.update({
      where: { id: author.editingRevisionId! },
      data: {
        profilePhotoMimeType: 'image/png',
        profilePhotoByteLength: permissionImage.byteLength,
        profilePhotoChecksum: '0'.repeat(64),
        profilePhotoObjectKey: `seller-photo:${fixture.sellers.approved.profileId}`,
        profilePhotoData: permissionImage,
      },
    });
    await login(
      owner,
      fixture.sellers.approved.email,
      fixture.sellers.approved.password,
    );

    const nextPhoto = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64',
    );
    const photoForm = new FormData();
    photoForm.set('fullName', 'Pending photo author');
    photoForm.append(
      'profilePhoto',
      new Blob([nextPhoto], { type: 'image/png' }),
      'next.png',
    );
    expect((await owner.patch('/seller/profile', photoForm)).status).toBe(200);

    const publicPhoto = await guest.get(`/sellers/${author.slug}/photo`);
    expect(publicPhoto.status).toBe(200);
    expect(Buffer.from(await publicPhoto.arrayBuffer())).toEqual(permissionImage);

    const ownerPhoto = await owner.get('/author/application/photo');
    expect(ownerPhoto.status).toBe(200);
    const ownerPhotoBytes = Buffer.from(await ownerPhoto.arrayBuffer());
    expect(ownerPhoto.headers.get('content-type')).toMatch(/image\/png/);
    expect(ownerPhotoBytes.subarray(0, 8)).toEqual(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    );
    expect(ownerPhotoBytes).not.toEqual(permissionImage);
  });
});
