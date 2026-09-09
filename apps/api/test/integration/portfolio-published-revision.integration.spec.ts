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

    expect((await owner.post(`/products/${productId}/images`, imageForm())).status).toBe(
      201,
    );
    const ownerDetail = await owner.get(`/seller/products/${productId}`);
    expect(ownerDetail.status).toBe(200);
    const ownerBody = (await ownerDetail.json()) as {
      product: { images: Array<{ id: string }> };
    };
    expect(ownerBody.product.images).toHaveLength(2);
    const pendingImageId = ownerBody.product.images.find(
      (image) => image.id !== publishedImageId,
    )!.id;

    const pendingPublic = await guest.get(`/works/${publicId}`);
    expect(pendingPublic.status).toBe(200);
    expect(
      ((await pendingPublic.json()) as { work: { images: unknown[] } }).work
        .images,
    ).toHaveLength(1);
    expect((await guest.get(`/images/${pendingImageId}`)).status).toBe(404);
    expect((await guest.get(`/images/${publishedImageId}`)).status).toBe(200);

    expect((await owner.post(`/products/${productId}/submit`)).status).toBe(201);
    expect(
      (
        await adminClient.patch(`/admin/products/${productId}/status`, {
          status: 'APPROVED',
        })
      ).status,
    ).toBe(200);

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

    expect(
      (
        await owner.post('/author/application/achievements', (() => {
          const form = new FormData();
          form.set('body', 'Show');
          form.append(
            'image',
            new Blob([permissionImage], { type: 'image/png' }),
            'show.png',
          );
          return form;
        })())
      ).status,
    ).toBe(503);

    const created = await owner.post('/author/application/achievements', (() => {
      const form = new FormData();
      form.set('body', 'Show');
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
      select: { slug: true },
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
    expect((await owner.patch('/seller/profile', photoForm)).status).toBe(503);

    const textForm = new FormData();
    textForm.set('fullName', 'Pending name author');
    expect((await owner.patch('/seller/profile', textForm)).status).toBe(200);

    const publicPhoto = await guest.get(`/sellers/${author.slug}/photo`);
    expect(publicPhoto.status).toBe(200);
    expect(Buffer.from(await publicPhoto.arrayBuffer())).toEqual(permissionImage);

    const ownerPhoto = await owner.get('/author/application/photo');
    expect([200, 404]).toContain(ownerPhoto.status);
    if (ownerPhoto.status === 200) {
      expect(Buffer.from(await ownerPhoto.arrayBuffer())).toEqual(permissionImage);
    }
  });
});
