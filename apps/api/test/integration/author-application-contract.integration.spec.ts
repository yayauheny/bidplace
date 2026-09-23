import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import type { PrismaClient } from '@bidplace/database';

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

async function login(client: HttpTestClient, email: string, password: string) {
  const response = await client.post('/auth/login', { email, password });
  expect(response.status).toBe(201);
}

async function createAdminClient() {
  const admin = await prisma.user.create({
    data: { email: `author-draft-admin-${Date.now()}@wave3.test`, passwordHash: fixturePasswordHash, displayName: 'Author draft admin', role: 'admin' },
    select: { email: true },
  });
  const client = new HttpTestClient(http.baseUrl, 'http://localhost:8081');
  await login(client, admin.email, 'password123');
  return client;
}

function applicationForm(overrides: Record<string, string | null> = {}) {
  const form = new FormData();
  const fields = {
    slug: `city-author-${Date.now().toString(36)}`,
    discipline: 'Керамика',
    fullName: 'City Author',
    country: 'BY',
    city: 'Minsk',
    shortDescription: 'Applicant with a required city',
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
  it('persists a private draft, synchronizes updates, then submits the same revision', async () => {
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
      applicationForm(),
    );
    expect(created.status).toBe(201);
    const body = (await created.json()) as {
      sellerProfile: { id: string; slug: string; city: string; socialLink: string | null; status: string };
      editingRevision: { status: string; id: string } | null;
    };
    expect(body.sellerProfile.city).toBe('Minsk');
    expect(body.sellerProfile.socialLink).toBeNull();
    expect(body.sellerProfile.status).toBe('DRAFT');
    expect(body.editingRevision?.status).toBe('DRAFT');

    const publicDraft = await applicant.get(`/authors/${body.sellerProfile.slug}`);
    expect(publicDraft.status).toBe(404);

    const stored = await prisma.sellerProfile.findUniqueOrThrow({
      where: { userId: fixture.buyer.id },
      select: { socialLink: true, city: true, status: true, editingRevision: { select: { status: true, submittedAt: true } } },
    });
    expect(stored.city).toBe('Minsk');
    expect(stored.socialLink).toBeNull();
    expect(stored.status).toBe('DRAFT');
    expect(stored.editingRevision).toMatchObject({ status: 'DRAFT', submittedAt: null });

    const admin = await createAdminClient();
    const draftQueue = (await (await admin.get('/admin/seller-profiles')).json()) as { sellerProfiles: Array<{ id: string }> };
    expect(draftQueue.sellerProfiles.map((item) => item.id)).not.toContain(body.sellerProfile.id);

    const mine = await applicant.get('/seller/profile');
    expect(mine.status).toBe(200);
    const mineBody = (await mine.json()) as {
      sellerProfile: { city: string; status: string };
      editingRevision: { status: string } | null;
    };
    expect(mineBody.sellerProfile.city).toBe('Minsk');
    expect(mineBody.sellerProfile.status).toBe('DRAFT');
    expect(mineBody.editingRevision?.status).toBe('DRAFT');

    const update = new FormData();
    update.set('fullName', 'Latest draft author');
    update.set('shortDescription', 'Latest draft description');
    expect((await applicant.patch('/seller/profile', update)).status).toBe(200);
    const canonical = await prisma.sellerProfile.findUniqueOrThrow({
      where: { id: body.sellerProfile.id },
      select: { fullName: true, editingRevision: { select: { fullName: true, shortDescription: true } } },
    });
    expect(canonical.fullName).toBe('Latest draft author');
    expect(canonical.editingRevision).toMatchObject({ fullName: 'Latest draft author', shortDescription: 'Latest draft description' });

    expect((await applicant.post('/author/application/submit')).status).toBe(201);
    const submitted = await prisma.sellerProfile.findUniqueOrThrow({
      where: { id: body.sellerProfile.id },
      select: { status: true, editingRevision: { select: { status: true, submittedAt: true } } },
    });
    expect(submitted.status).toBe('PENDING_REVIEW');
    expect(submitted.editingRevision?.status).toBe('PENDING_REVIEW');
    expect(submitted.editingRevision?.submittedAt).toBeInstanceOf(Date);

    const pendingQueue = (await (await admin.get('/admin/seller-profiles')).json()) as { sellerProfiles: Array<{ id: string }> };
    expect(pendingQueue.sellerProfiles.map((item) => item.id)).toContain(body.sellerProfile.id);
    expect((await admin.patch(`/admin/seller-profiles/${body.sellerProfile.id}/status`, { status: 'APPROVED' })).status).toBe(200);
    const published = await applicant.get(`/authors/${body.sellerProfile.slug}`);
    expect(published.status).toBe(200);
    expect(((await published.json()) as { author: { fullName: string; shortDescription: string } }).author).toMatchObject({ fullName: 'Latest draft author', shortDescription: 'Latest draft description' });
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
