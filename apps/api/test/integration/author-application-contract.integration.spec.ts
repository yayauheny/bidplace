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

async function login(client: HttpTestClient, email: string, password: string) {
  const response = await client.post('/auth/login', { email, password });
  expect(response.status).toBe(201);
}

function applicationForm(overrides: Record<string, string | null> = {}) {
  const form = new FormData();
  const fields = {
    slug: `city-author-${Date.now().toString(36)}`,
    sellerType: 'creator',
    fullName: 'City Author',
    country: 'BY',
    city: 'Minsk',
    socialLink: 'https://example.com/city-author',
    shortDescription: 'Applicant with a required city',
    handoffContactType: 'TELEGRAM',
    handoffContactValue: '@city_author',
    ...overrides,
  };
  for (const [key, value] of Object.entries(fields)) {
    if (value === null) continue;
    form.set(key, value);
  }
  form.set(
    'profilePhoto',
    new Blob([permissionImage], { type: 'image/png' }),
    'profile.png',
  );
  return form;
}

describe('author application HTTP contract', () => {
  it('rejects create without city and persists nullable socialLink with another public link', async () => {
    const fixture = await createPermissionFixture(prisma);
    const applicant = new HttpTestClient(http.baseUrl, 'http://localhost:8081');
    await login(applicant, fixture.buyer.email, fixture.buyer.password);

    const missingCity = await applicant.post(
      '/seller/profile',
      applicationForm({ city: null }),
    );
    expect(missingCity.status).toBe(400);

    const created = await applicant.post(
      '/seller/profile',
      applicationForm({
        socialLink: null,
        telegramUrl: 'https://t.me/city_author',
      }),
    );
    expect(created.status).toBe(201);
    const body = (await created.json()) as {
      sellerProfile: { city: string; socialLink: string | null };
      editingRevision: { status: string } | null;
    };
    expect(body.sellerProfile.city).toBe('Minsk');
    expect(body.sellerProfile.socialLink).toBeNull();
    expect(body.editingRevision?.status).toBe('PENDING_REVIEW');

    const stored = await prisma.sellerProfile.findUniqueOrThrow({
      where: { userId: fixture.buyer.id },
      select: { socialLink: true, city: true },
    });
    expect(stored.city).toBe('Minsk');
    expect(stored.socialLink).toBeNull();

    const mine = await applicant.get('/seller/profile');
    expect(mine.status).toBe(200);
    const mineBody = (await mine.json()) as {
      sellerProfile: { city: string };
      editingRevision: { status: string } | null;
    };
    expect(mineBody.sellerProfile.city).toBe('Minsk');
    expect(mineBody.editingRevision?.status).toBe('PENDING_REVIEW');
  });

  it('keeps the published public projection unchanged while the owner sees draft fields', async () => {
    const fixture = await createPermissionFixture(prisma);
    const owner = new HttpTestClient(http.baseUrl, 'http://localhost:8081');
    const guest = new HttpTestClient(http.baseUrl, 'http://localhost:8081');
    const author = await prisma.sellerProfile.update({
      where: { id: fixture.sellers.approved.profileId },
      data: { city: 'Minsk', fullName: 'Published Author' },
      select: { slug: true },
    });
    await login(
      owner,
      fixture.sellers.approved.email,
      fixture.sellers.approved.password,
    );

    const draft = new FormData();
    draft.set('fullName', 'Draft Author');
    draft.set('city', 'Grodno');
    expect((await owner.patch('/seller/profile', draft)).status).toBe(200);

    const mine = await owner.get('/seller/profile');
    const mineBody = (await mine.json()) as {
      sellerProfile: { fullName: string; city: string; status: string };
      editingRevision: { status: string } | null;
    };
    expect(mineBody.sellerProfile.status).toBe('APPROVED');
    expect(mineBody.sellerProfile.fullName).toBe('Draft Author');
    expect(mineBody.sellerProfile.city).toBe('Grodno');
    expect(mineBody.editingRevision?.status).toBe('DRAFT');

    const publicAuthor = await guest.get(`/authors/${author.slug}`);
    expect(publicAuthor.status).toBe(200);
    const publicBody = (await publicAuthor.json()) as {
      author: { fullName: string; city: string };
    };
    expect(publicBody.author.fullName).toBe('Published Author');
    expect(publicBody.author.city).toBe('Minsk');
  });
});
