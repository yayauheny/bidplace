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
  http = await createHttpTestApp(database.databaseUrl);
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

function applicationForm(
  extras: Record<string, string> = {},
): FormData {
  const form = new FormData();
  form.set('slug', extras.slug ?? 'socials-applicant');
  form.set('sellerType', 'creator');
  form.set('fullName', 'Socials Applicant');
  form.set('country', 'BY');
  form.set('city', 'Minsk');
  form.set('shortDescription', 'Applicant description');
  form.set('handoffContactType', 'TELEGRAM');
  form.set('handoffContactValue', '@socials_applicant');
  form.set(
    'profilePhoto',
    new Blob([permissionImage], { type: 'image/png' }),
    'profile.png',
  );
  for (const [key, value] of Object.entries(extras)) {
    if (key === 'slug') continue;
    form.set(key, value);
  }
  return form;
}

describe('optional public social links HTTP', () => {
  it('creates and submits a profile without public socials and keeps handoff private', async () => {
    const fixture = await createPermissionFixture(prisma);
    const admin = await prisma.user.create({
      data: {
        email: `admin.socials.${fixture.categoryId.slice(0, 8)}@wave3.test`,
        passwordHash: fixturePasswordHash,
        displayName: 'Socials admin',
        role: 'admin',
      },
      select: { email: true },
    });
    const owner = new HttpTestClient(http.baseUrl, 'http://localhost:8081');
    const adminClient = new HttpTestClient(http.baseUrl, 'http://localhost:8081');
    const guest = new HttpTestClient(http.baseUrl, 'http://localhost:8081');
    await login(owner, fixture.buyer.email, fixture.buyer.password);
    await login(adminClient, admin.email, 'password123');

    expect(
      (
        await owner.post(
          '/seller/profile',
          applicationForm({ slug: 'empty-social', socialLink: '' }),
        )
      ).status,
    ).toBe(400);
    expect(
      (
        await owner.post(
          '/seller/profile',
          applicationForm({
            slug: 'invalid-social',
            socialLink: 'http://example.com',
          }),
        )
      ).status,
    ).toBe(400);

    const created = await owner.post('/seller/profile', applicationForm());
    expect(created.status).toBe(201);
    const createdBody = (await created.json()) as {
      sellerProfile: { id: string; socialLink: string | null; slug: string };
    };
    expect(createdBody.sellerProfile.socialLink).toBeNull();

    expect(
      (
        await adminClient.patch(
          `/admin/seller-profiles/${createdBody.sellerProfile.id}/status`,
          { status: 'APPROVED' },
        )
      ).status,
    ).toBe(200);

    const nameForm = new FormData();
    nameForm.set('fullName', 'Socials Applicant Revised');
    expect((await owner.patch('/seller/profile', nameForm)).status).toBe(200);
    const submitted = await owner.post('/author/application/submit');
    expect(submitted.status).toBe(201);
    const application = await owner.get('/author/application');
    expect(application.status).toBe(200);
    const applicationJson = JSON.stringify(await application.json());
    expect(applicationJson).not.toContain('socialLink');
    expect(applicationJson).not.toMatch(/handoff/i);

    expect(
      (
        await adminClient.patch(
          `/admin/seller-profiles/${createdBody.sellerProfile.id}/status`,
          { status: 'APPROVED' },
        )
      ).status,
    ).toBe(200);

    const publicAuthor = await guest.get(
      `/authors/${createdBody.sellerProfile.slug}`,
    );
    expect(publicAuthor.status).toBe(200);
    const publicJson = JSON.stringify(await publicAuthor.json());
    expect(publicJson).not.toContain('socialLink');
    expect(publicJson).not.toMatch(/handoff/i);
  });

  it.each([
    ['socialLink', 'https://example.com/creator'],
    ['telegramUrl', 'https://t.me/creator_name'],
    ['instagramUrl', 'https://instagram.com/creator'],
    ['websiteUrl', 'https://creator.example.com'],
  ])('accepts only %s as a public link', async (field, value) => {
    const fixture = await createPermissionFixture(prisma);
    const owner = new HttpTestClient(http.baseUrl, 'http://localhost:8081');
    await login(owner, fixture.buyer.email, fixture.buyer.password);

    const created = await owner.post(
      '/seller/profile',
      applicationForm({ slug: `link-${field.toLowerCase()}`.slice(0, 32), [field]: value }),
    );
    expect(created.status).toBe(201);
    const body = (await created.json()) as {
      sellerProfile: Record<string, string | null>;
    };
    expect(body.sellerProfile[field]).toBe(value);
    if (field !== 'socialLink') {
      expect(body.sellerProfile.socialLink).toBeNull();
    }
  });
});
