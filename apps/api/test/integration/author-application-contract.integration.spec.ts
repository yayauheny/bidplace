import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import type { PrismaClient } from '@bidplace/database';
import { readFile, rm } from 'node:fs/promises';
import sharp from 'sharp';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

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
import { idempotencyKey, turnstileToken } from './abuse-request';
import {
  createIntegrationDatabaseContext,
  type IntegrationDatabaseContext,
} from './test-database';
import { sellerModerationRequest } from './admin-status-request';
import { sellerProfileForm } from './seller-profile-form';

let database: IntegrationDatabaseContext;
let http: HttpTestApp;
let prisma: PrismaClient;
let emailFilePath: string;

beforeAll(async () => {
  emailFilePath = join(tmpdir(), `bidplace-author-email-${Date.now()}.jsonl`);
  process.env.TEST_EMAIL_FILE = emailFilePath;
  database = await createIntegrationDatabaseContext();
  prisma = database.prisma;
  http = await createHttpTestApp(database.databaseUrl, 'http://localhost:8081');
});

afterEach(async () => {
  await resetPermissionFixture(prisma);
  await rm(emailFilePath, { force: true });
});

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
    data: {
      email: `author-draft-admin-${Date.now()}@wave3.test`,
      passwordHash: fixturePasswordHash,
      displayName: 'Author draft admin',
      role: 'admin',
    },
    select: { email: true },
  });
  const client = new HttpTestClient(http.baseUrl, 'http://localhost:8081');
  await login(client, admin.email, 'password123');
  return client;
}

async function assignSlug(
  userId: string,
  slug = `city-author-${Date.now().toString(36)}`,
) {
  await prisma.user.update({ where: { id: userId }, data: { slug } });
  return slug;
}

function applicationForm(overrides: Record<string, string | null> = {}) {
  const fields: Record<string, string> = {
    discipline: 'Керамика',
    fullName: 'City Author',
    country: 'BY',
    city: 'Minsk',
    shortDescription: 'Applicant with a required city',
  };
  for (const [key, value] of Object.entries(overrides)) {
    if (key === 'slug') continue;
    if (value === null) delete fields[key];
    else fields[key] = value;
  }
  return sellerProfileForm(
    fields,
    new Blob([permissionImage], { type: 'image/png' }),
  );
}

async function readVerificationCode(): Promise<string> {
  const contents = await readFile(emailFilePath, 'utf8');
  const line = contents.trim().split('\n').at(-1);
  const payload = JSON.parse(line!) as { code?: string };
  expect(payload.code).toMatch(/^\d{6}$/);
  return payload.code!;
}

describe('author application HTTP contract', () => {
  it('clears saved about text in one multipart draft write and blocks advance until it is restored', async () => {
    const fixture = await createPermissionFixture(prisma);
    const applicant = new HttpTestClient(http.baseUrl, 'http://localhost:8081');
    await login(applicant, fixture.buyer.email, fixture.buyer.password);
    await assignSlug(fixture.buyer.id);
    expect(
      (await applicant.post('/seller/profile', applicationForm())).status,
    ).toBe(201);
    const category = await prisma.category.findFirstOrThrow({
      where: { active: true },
    });
    const cleared = await applicant.patch(
      '/seller/profile',
      sellerProfileForm({
        directionCategoryIds: [category.id],
        shortDescription: null,
      }),
    );
    expect(cleared.status).toBe(200);
    expect((await cleared.json()) as unknown).toMatchObject({
      sellerProfile: {
        shortDescription: null,
        directionCategoryIds: [category.id],
      },
    });
    expect(
      (await (await applicant.get('/seller/profile')).json()) as unknown,
    ).toMatchObject({ sellerProfile: { shortDescription: null } });
    expect((await applicant.post('/author/application/advance')).status).toBe(
      201,
    );
    expect((await applicant.post('/author/application/advance')).status).toBe(
      409,
    );
    expect(
      (
        await applicant.patch('/seller/profile', {
          shortDescription: 'Restored about text',
        })
      ).status,
    ).toBe(200);
    expect((await applicant.post('/author/application/advance')).status).toBe(
      201,
    );
  });

  it('requires verified email for Author writes while keeping public reads available', async () => {
    const fixture = await createPermissionFixture(prisma);
    const applicant = new HttpTestClient(http.baseUrl, 'http://localhost:8081');
    const guest = new HttpTestClient(http.baseUrl, 'http://localhost:8081');
    const approved = await prisma.sellerProfile.findUniqueOrThrow({
      where: { id: fixture.sellers.approved.profileId },
      select: { slug: true },
    });
    await prisma.user.update({
      where: { id: fixture.buyer.id },
      data: { emailVerifiedAt: null },
    });
    await login(applicant, fixture.buyer.email, fixture.buyer.password);

    const create = await applicant.post('/seller/profile', applicationForm());
    expect(create.status).toBe(403);
    expect((await create.json()) as { message: string }).toMatchObject({
      message: 'Email verification is required',
    });
    expect((await guest.get(`/authors/${approved.slug}`)).status).not.toBe(403);

    await prisma.user.update({
      where: { id: fixture.buyer.id },
      data: { emailVerifiedAt: new Date() },
    });
    await assignSlug(fixture.buyer.id);
    expect(
      (await applicant.post('/seller/profile', applicationForm())).status,
    ).toBe(201);

    await prisma.user.update({
      where: { id: fixture.buyer.id },
      data: { emailVerifiedAt: null },
    });
    const update = sellerProfileForm({
      fullName: 'Blocked draft author',
    });
    expect((await applicant.patch('/seller/profile', update)).status).toBe(403);
    expect((await applicant.post('/author/application/advance')).status).toBe(
      403,
    );
    expect((await applicant.post('/author/application/submit')).status).toBe(
      403,
    );

    await prisma.user.update({
      where: { id: fixture.buyer.id },
      data: { emailVerifiedAt: new Date() },
    });
    expect((await applicant.patch('/seller/profile', update)).status).toBe(200);
  });

  it('allows an existing Author draft to continue after OTP verification', async () => {
    const fixture = await createPermissionFixture(prisma);
    const applicant = new HttpTestClient(http.baseUrl, 'http://localhost:8081');
    await login(applicant, fixture.buyer.email, fixture.buyer.password);
    await assignSlug(fixture.buyer.id);
    expect(
      (await applicant.post('/seller/profile', applicationForm())).status,
    ).toBe(201);

    await prisma.user.update({
      where: { id: fixture.buyer.id },
      data: { emailVerifiedAt: null },
    });
    const update = sellerProfileForm({
      fullName: 'Blocked until OTP',
    });
    expect((await applicant.patch('/seller/profile', update)).status).toBe(403);

    expect(
      (
        await applicant.post('/auth/email/request', {
          idempotencyKey: idempotencyKey(),
          turnstileToken: turnstileToken('email_verification'),
        })
      ).status,
    ).toBe(201);
    expect(
      (
        await applicant.post('/auth/email/verify', {
          code: await readVerificationCode(),
          idempotencyKey: idempotencyKey(),
        })
      ).status,
    ).toBe(201);
    await expect(
      prisma.user.findUniqueOrThrow({
        where: { id: fixture.buyer.id },
        select: { emailVerifiedAt: true },
      }),
    ).resolves.toMatchObject({ emailVerifiedAt: expect.any(Date) });

    expect((await applicant.patch('/seller/profile', update)).status).toBe(200);
  });

  it('persists a private draft, synchronizes updates, then submits the same revision', async () => {
    const fixture = await createPermissionFixture(prisma);
    const applicant = new HttpTestClient(http.baseUrl, 'http://localhost:8081');
    await login(applicant, fixture.buyer.email, fixture.buyer.password);
    await assignSlug(fixture.buyer.id);

    const created = await applicant.post(
      '/seller/profile',
      applicationForm({ city: null, discipline: null, shortDescription: null }),
    );
    expect(created.status).toBe(201);
    const body = (await created.json()) as {
      sellerProfile: {
        id: string;
        slug: string;
        city: string | null;
        socialLink: string | null;
        status: string;
        applicationStage: string | null;
      };
      editingRevision: { status: string; id: string } | null;
    };
    expect(body.sellerProfile.city).toBeNull();
    expect(body.sellerProfile.socialLink).toBeNull();
    expect(body.sellerProfile.status).toBe('DRAFT');
    expect(body.sellerProfile.applicationStage).toBe('CONTACTS');
    expect(body.editingRevision?.status).toBe('DRAFT');

    const publicDraft = await applicant.get(
      `/authors/${body.sellerProfile.slug}`,
    );
    expect(publicDraft.status).toBe(404);

    const stored = await prisma.sellerProfile.findUniqueOrThrow({
      where: { userId: fixture.buyer.id },
      select: {
        socialLink: true,
        city: true,
        status: true,
        applicationStage: true,
        editingRevision: { select: { status: true, submittedAt: true } },
      },
    });
    expect(stored.city).toBeNull();
    expect(stored.socialLink).toBeNull();
    expect(stored.status).toBe('DRAFT');
    expect(stored.applicationStage).toBe('CONTACTS');
    expect(stored.editingRevision).toMatchObject({
      status: 'DRAFT',
      submittedAt: null,
    });

    const admin = await createAdminClient();
    const draftQueue = (await (
      await admin.get('/admin/seller-profiles')
    ).json()) as { sellerProfiles: Array<{ id: string }> };
    expect(draftQueue.sellerProfiles.map((item) => item.id)).not.toContain(
      body.sellerProfile.id,
    );

    const mine = await applicant.get('/seller/profile');
    expect(mine.status).toBe(200);
    const mineBody = (await mine.json()) as {
      sellerProfile: { city: string | null; status: string };
      editingRevision: { status: string } | null;
    };
    expect(mineBody.sellerProfile.city).toBeNull();
    expect(mineBody.sellerProfile.status).toBe('DRAFT');
    expect(mineBody.editingRevision?.status).toBe('DRAFT');

    const applicationDraft = (await (
      await applicant.get('/author/application')
    ).json()) as {
      application: {
        status: string;
        applicationStage: string | null;
        discipline: string | null;
        shortDescription: string | null;
      };
      editingRevision: { status: string; updatedAt: string } | null;
    };
    expect(applicationDraft.application.status).toBe('DRAFT');
    expect(applicationDraft.application.applicationStage).toBe('CONTACTS');
    expect(applicationDraft.application.discipline).toBeNull();
    expect(applicationDraft.application.shortDescription).toBeNull();
    expect(applicationDraft.editingRevision?.status).toBe('DRAFT');
    expect(applicationDraft.editingRevision?.updatedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T/,
    );

    const contactsAdvance = await applicant.post('/author/application/advance');
    expect(contactsAdvance.status).toBe(201);
    expect(
      (
        (await contactsAdvance.json()) as {
          application: { applicationStage: string | null };
        }
      ).application.applicationStage,
    ).toBe('ABOUT');
    expect((await applicant.post('/author/application/advance')).status).toBe(
      409,
    );

    expect(
      (
        await applicant.patch(
          '/seller/profile',
          sellerProfileForm({ city: 'Minsk' }),
        )
      ).status,
    ).toBe(200);
    const withCity = await prisma.sellerProfile.findUniqueOrThrow({
      where: { userId: fixture.buyer.id },
      select: { city: true, profilePhotoChecksum: true },
    });
    expect(withCity.city).toBe('Minsk');

    const replacement = await sharp({
      create: { width: 8, height: 8, channels: 3, background: '#2f6fed' },
    })
      .png()
      .toBuffer();
    const cleared = await applicant.patch(
      '/seller/profile',
      sellerProfileForm(
        { city: null },
        new Blob([new Uint8Array(replacement)], { type: 'image/png' }),
      ),
    );
    expect(cleared.status).toBe(200);
    const afterClear = await prisma.sellerProfile.findUniqueOrThrow({
      where: { userId: fixture.buyer.id },
      select: { city: true, profilePhotoChecksum: true },
    });
    expect(afterClear.city).toBeNull();
    expect(afterClear.profilePhotoChecksum).not.toBe(
      withCity.profilePhotoChecksum,
    );

    const malformed = new FormData();
    malformed.set('data', '{"city":');
    expect((await applicant.patch('/seller/profile', malformed)).status).toBe(
      400,
    );
    const unknownField = sellerProfileForm({ city: 'Grodno' });
    unknownField.set('city', 'Grodno');
    expect(
      (await applicant.patch('/seller/profile', unknownField)).status,
    ).toBe(400);
    await expect(
      prisma.sellerProfile.findUniqueOrThrow({
        where: { userId: fixture.buyer.id },
        select: { city: true },
      }),
    ).resolves.toEqual({ city: null });

    const update = sellerProfileForm({
      fullName: 'Latest draft author',
      shortDescription: 'Latest draft description',
      publicEmail: 'PUBLIC@EXAMPLE.COM',
    });
    expect((await applicant.patch('/seller/profile', update)).status).toBe(200);

    const painting = await prisma.category.findUniqueOrThrow({
      where: { slug: 'painting' },
      select: { id: true },
    });
    await prisma.sellerProfileRevisionDirection.create({
      data: {
        revisionId: body.editingRevision!.id,
        categoryId: painting.id,
        position: 0,
      },
    });
    const achievementsAdvance = await applicant.post(
      '/author/application/advance',
    );
    expect(achievementsAdvance.status).toBe(201);
    expect(
      (
        (await achievementsAdvance.json()) as {
          application: { applicationStage: string | null };
        }
      ).application.applicationStage,
    ).toBe('ACHIEVEMENTS');
    const canonical = await prisma.sellerProfile.findUniqueOrThrow({
      where: { id: body.sellerProfile.id },
      select: {
        fullName: true,
        publicEmail: true,
        applicationStage: true,
        editingRevision: {
          select: { fullName: true, shortDescription: true, publicEmail: true },
        },
      },
    });
    expect(canonical.fullName).toBe('Latest draft author');
    expect(canonical.publicEmail).toBe('public@example.com');
    expect(canonical.applicationStage).toBe('ACHIEVEMENTS');
    expect(canonical.editingRevision).toMatchObject({
      fullName: 'Latest draft author',
      shortDescription: 'Latest draft description',
      publicEmail: 'public@example.com',
    });

    const submitResponse = await applicant.post('/author/application/submit');
    expect(submitResponse.status).toBe(201);
    expect((await applicant.post('/seller/profile/submit')).status).toBe(404);
    const applicationSubmitted = (await submitResponse.json()) as {
      application: { status: string; applicationStage: string | null };
      editingRevision: { status: string; updatedAt: string } | null;
    };
    expect(applicationSubmitted.application.status).toBe('PENDING_REVIEW');
    expect((await applicant.get('/author/application')).status).toBe(200);
    expect(applicationSubmitted.application.applicationStage).toBeNull();
    expect(applicationSubmitted.editingRevision?.status).toBe('PENDING_REVIEW');
    expect(applicationSubmitted.editingRevision?.updatedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T/,
    );
    const submitted = await prisma.sellerProfile.findUniqueOrThrow({
      where: { id: body.sellerProfile.id },
      select: {
        status: true,
        editingRevision: { select: { status: true, submittedAt: true } },
      },
    });
    expect(submitted.status).toBe('PENDING_REVIEW');
    expect(submitted.editingRevision?.status).toBe('PENDING_REVIEW');
    expect(submitted.editingRevision?.submittedAt).toBeInstanceOf(Date);

    const pendingQueue = (await (
      await admin.get('/admin/seller-profiles')
    ).json()) as { sellerProfiles: Array<{ id: string }> };
    expect(pendingQueue.sellerProfiles.map((item) => item.id)).toContain(
      body.sellerProfile.id,
    );
    expect(
      (
        await admin.patch(
          `/admin/seller-profiles/${body.sellerProfile.id}/status`,
          await sellerModerationRequest(
            prisma,
            body.sellerProfile.id,
            'APPROVED',
          ),
        )
      ).status,
    ).toBe(200);
    const published = await applicant.get(
      `/authors/${body.sellerProfile.slug}`,
    );
    expect(published.status).toBe(200);
    expect(
      (
        (await published.json()) as {
          author: {
            fullName: string;
            shortDescription: string;
            publicEmail: string | null;
          };
        }
      ).author,
    ).toMatchObject({
      fullName: 'Latest draft author',
      shortDescription: 'Latest draft description',
      publicEmail: 'public@example.com',
    });
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

    const draft = sellerProfileForm({
      fullName: 'Draft Author',
      city: 'Grodno',
    });
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

  it('returns every invalid application field and keeps profile conflicts distinct', async () => {
    const fixture = await createPermissionFixture(prisma);
    await prisma.user.update({
      where: { id: fixture.buyer.id },
      data: { emailVerifiedAt: new Date() },
    });
    const applicant = new HttpTestClient(http.baseUrl, 'http://localhost:8081');
    await login(applicant, fixture.buyer.email, fixture.buyer.password);
    const slug = `taken-${Date.now().toString(36)}`;

    const invalidNickname = await applicant.post('/auth/slug', { slug: 'БЕ' });
    expect(invalidNickname.status).toBe(400);
    const invalid = await applicant.post(
      '/seller/profile',
      applicationForm({
        publicEmail: 'not-an-email',
        websiteUrl: 'http://example.com',
      }),
    );
    expect(invalid.status).toBe(400);
    const invalidBody = (await invalid.json()) as {
      code: string;
      message: string;
      requestId: string;
      details: { fieldErrors: Record<string, string[]> };
    };
    expect(invalidBody.code).toBe('validation_error');
    expect(invalidBody.message).toBe('Request validation failed');
    expect(invalidBody.requestId).toEqual(expect.any(String));
    expect(
      (
        (await invalidNickname.json()) as {
          details: { fieldErrors: { slug?: string[] } };
        }
      ).details.fieldErrors.slug?.[0],
    ).toContain('маленькие латинские');
    expect(invalidBody.details.fieldErrors.publicEmail).toEqual([
      'Введите корректный email',
    ]);
    expect(invalidBody.details.fieldErrors.websiteUrl?.[0]).toContain(
      'https://',
    );
    expect(JSON.stringify(invalidBody)).not.toContain('password123');

    await assignSlug(fixture.buyer.id, slug);
    const partial = await applicant.post(
      '/seller/profile',
      applicationForm({
        shortDescription: null,
        discipline: null,
      }),
    );
    expect(partial.status).toBe(201);

    const again = await applicant.post('/seller/profile', applicationForm());
    expect(again.status).toBe(409);
    expect(await again.json()).toMatchObject({
      code: 'conflict',
      details: { reason: 'profile_exists' },
    });

    const other = await prisma.user.create({
      data: {
        email: `slug-taken-${Date.now()}@wave3.test`,
        passwordHash: fixturePasswordHash,
        displayName: 'Second author',
        emailVerifiedAt: new Date(),
      },
      select: { email: true },
    });
    const second = new HttpTestClient(http.baseUrl, 'http://localhost:8081');
    await login(second, other.email, 'password123');
    const taken = await second.post('/auth/slug', { slug });
    expect(taken.status).toBe(409);
    expect(await taken.json()).toMatchObject({
      code: 'conflict',
      details: { reason: 'slug_taken' },
    });
  });

  it('rejects a product year, an achievement date, a short password, and an empty moderation reason', async () => {
    const fixture = await createPermissionFixture(prisma);
    const author = new HttpTestClient(http.baseUrl, 'http://localhost:8081');
    const admin = await createAdminClient();
    await login(
      author,
      fixture.sellers.approved.email,
      fixture.sellers.approved.password,
    );

    const year = await author.post('/products', {
      title: 'Year check',
      categoryId: fixture.categoryId,
      year: 10000,
    });
    expect(year.status).toBe(400);
    expect(
      ((await year.json()) as { details: { fieldErrors: { year?: string[] } } })
        .details.fieldErrors.year,
    ).toEqual(['Введите год числом от 0 до 9999']);

    const draft = await author.post('/products', {
      title: 'Partial draft',
      categoryId: fixture.categoryId,
    });
    expect(draft.status).toBe(201);

    const achievement = await author.post('/author/application/achievements', {
      body: 'Synthetic achievement',
      occurredDate: { year: 2024, month: 2, day: 31 },
    });
    expect(achievement.status).toBe(400);
    expect(
      (
        (await achievement.json()) as {
          details: { fieldErrors: { occurredDate?: string[] } };
        }
      ).details.fieldErrors.occurredDate,
    ).toEqual(['Укажите существующую дату']);

    const password = 'short';
    const registered = await new HttpTestClient(
      http.baseUrl,
      'http://localhost:8081',
    ).post('/auth/register', {
      email: `short-password-${Date.now()}@wave3.test`,
      password,
      slug: 'synthetic',
      turnstileToken: turnstileToken('register'),
    });
    expect(registered.status).toBe(400);
    const registeredBody = await registered.json();
    expect(registeredBody).toMatchObject({
      details: {
        fieldErrors: { password: ['Используйте пароль от 8 символов'] },
      },
    });
    expect(JSON.stringify(registeredBody)).not.toContain(password);

    const reason = await admin.patch(
      `/admin/seller-profiles/${fixture.sellers.pending.profileId}/status`,
      await sellerModerationRequest(
        prisma,
        fixture.sellers.pending.profileId,
        'REJECTED',
      ),
    );
    expect(reason.status).toBe(400);
    expect(
      (
        (await reason.json()) as {
          details: { fieldErrors: { reason?: string[] } };
        }
      ).details.fieldErrors.reason,
    ).toEqual(['Укажите причину']);
    const unchanged = await prisma.sellerProfile.findUniqueOrThrow({
      where: { id: fixture.sellers.pending.profileId },
      select: { status: true },
    });
    expect(unchanged.status).toBe('PENDING_REVIEW');
  });
});
