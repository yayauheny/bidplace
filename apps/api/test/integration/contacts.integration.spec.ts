import { randomInt, randomUUID } from 'node:crypto';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { SESSION_TTL_MS } from '../../src/auth/auth.constants';
import {
  createHttpTestApp,
  HttpTestClient,
  type HttpTestApp,
} from './http-test-app';
import { fixturePasswordHash, permissionImage } from './permission-fixtures';
import {
  createIntegrationDatabaseContext,
  type IntegrationDatabaseContext,
} from './test-database';

let database: IntegrationDatabaseContext;
let http: HttpTestApp;

beforeAll(async () => {
  database = await createIntegrationDatabaseContext();
  http = await createHttpTestApp(database.databaseUrl);
}, 120_000);

afterAll(async () => {
  await http?.close();
  await database?.cleanup();
});

function phone(): string {
  return `+37529${String(randomInt(0, 10_000_000)).padStart(7, '0')}`;
}

async function createUser(verified: boolean) {
  return database.prisma.user.create({
    data: {
      email: `contacts.${randomUUID()}@wave-contacts.test`,
      passwordHash: fixturePasswordHash,
      displayName: 'Contacts user',
      role: 'user',
      emailVerifiedAt: verified ? new Date('2026-10-01T00:00:00.000Z') : null,
    },
  });
}

async function login(client: HttpTestClient, email: string) {
  const response = await client.post('/auth/login', {
    email,
    password: 'password123',
  });
  expect(response.status).toBe(201);
}

function sessionId(actor: HttpTestClient): string {
  const raw = actor.cookie('bidplace_session');
  if (!raw) throw new Error('missing session cookie');
  const decoded = decodeURIComponent(raw);
  if (!decoded.startsWith('s:')) throw new Error('unexpected session cookie');
  const signed = decoded.slice(2);
  const dot = signed.lastIndexOf('.');
  return signed.slice(0, dot);
}

async function ageAuthentication(actor: HttpTestClient) {
  const sid = sessionId(actor);
  const row = await database.prisma.authSession.findUniqueOrThrow({
    where: { sid },
  });
  const sess = row.sess as {
    principal?: { authenticatedAt: number; expiresAt: number };
  };
  if (!sess.principal) throw new Error('session has no principal');
  // Keep the session inside its TTL. Moving only authenticatedAt makes
  // expiresAt - authenticatedAt larger than SESSION_TTL_MS and the guard
  // rejects the cookie before the contacts freshness check.
  const authenticatedAt = Date.now() - 6 * 60_000;
  sess.principal.authenticatedAt = authenticatedAt;
  sess.principal.expiresAt = authenticatedAt + SESSION_TTL_MS;
  await database.prisma.authSession.update({
    where: { sid },
    data: { sess },
  });
}

describe('own deal contacts', () => {
  it('reads only the signed-in verified user and ignores the account phone', async () => {
    const guest = new HttpTestClient(http.baseUrl);
    expect((await guest.get('/me/contacts')).status).toBe(401);

    const unverified = await createUser(false);
    const unverifiedClient = new HttpTestClient(http.baseUrl);
    await login(unverifiedClient, unverified.email);
    expect((await unverifiedClient.get('/me/contacts')).status).toBe(403);

    const owner = await createUser(true);
    const accountPhone = phone();
    const dealPhone = phone();
    await database.prisma.user.update({
      where: { id: owner.id },
      data: {
        phone: accountPhone,
        contactPhone: dealPhone,
        contactTelegram: '@deal_owner',
      },
    });
    await database.prisma.sellerProfile.create({
      data: {
        userId: owner.id,
        slug: `contacts-${owner.id.slice(0, 8)}`,
        sellerType: 'creator',
        fullName: 'Contacts owner',
        country: 'BY',
        profilePhotoMimeType: 'image/png',
        profilePhotoByteLength: permissionImage.byteLength,
        profilePhotoChecksum: '0'.repeat(64),
        profilePhotoData: permissionImage,
        telegramUrl: 'https://t.me/public_only',
        showContactsToBuyer: true,
        status: 'APPROVED',
      },
    });

    const client = new HttpTestClient(http.baseUrl);
    await login(client, owner.email);
    const response = await client.get(`/me/contacts?userId=${unverified.id}`);
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toContain('private');
    expect(response.headers.get('cache-control')).toContain('no-store');
    expect(await response.json()).toEqual({
      phone: dealPhone,
      telegram: '@deal_owner',
      instagram: null,
      vk: null,
      showToBuyer: true,
    });

    const me = await client.get('/auth/me');
    expect(me.status).toBe(200);
    const meText = JSON.stringify(await me.json());
    expect(meText).toContain(accountPhone);
    expect(meText).not.toContain(dealPhone);
    expect(meText).not.toContain('@deal_owner');
    expect(meText).not.toContain('public_only');

    const other = await createUser(true);
    const otherClient = new HttpTestClient(http.baseUrl);
    await login(otherClient, other.email);
    expect(await (await otherClient.get('/me/contacts')).json()).toEqual({
      phone: null,
      telegram: null,
      instagram: null,
      vk: null,
      showToBuyer: null,
    });
    const lettersBefore = await database.prisma.notificationOutbox.count({
      where: { userId: owner.id, kind: 'CONTACTS_CHANGED' },
    });
    expect((await client.get('/me/contacts')).status).toBe(200);
    expect(
      await database.prisma.notificationOutbox.count({
        where: { userId: owner.id, kind: 'CONTACTS_CHANGED' },
      }),
    ).toBe(lettersBefore);
  });

  it('keeps omitted fields, clears nulls, and allows a stale session to read', async () => {
    const owner = await createUser(true);
    const client = new HttpTestClient(http.baseUrl);
    await login(client, owner.email);
    const saved = await client.put('/me/contacts', {
      phone: '+375291112233',
      telegram: '@bidplace_buyer',
      instagram: '@deal.buyer',
      vk: '@deal_buyer',
    });
    expect(saved.status).toBe(200);
    expect(await saved.json()).toMatchObject({
      phone: '+375291112233',
      telegram: '@bidplace_buyer',
      instagram: '@deal.buyer',
      vk: '@deal_buyer',
      showToBuyer: null,
    });

    await ageAuthentication(client);
    const staleRead = await client.get('/me/contacts');
    expect(staleRead.status).toBe(200);
    expect(await staleRead.json()).toMatchObject({ phone: '+375291112233' });
    expect((await client.put('/me/contacts', { phone: '+375291119900' })).status).toBe(
      401,
    );
    expect((await (await client.get('/me/contacts')).json()) as { phone: string }).toMatchObject({
      phone: '+375291112233',
      telegram: '@bidplace_buyer',
    });

    await login(client, owner.email);
    const cleared = await client.put('/me/contacts', { phone: null });
    expect(cleared.status).toBe(200);
    expect(await cleared.json()).toMatchObject({
      phone: null,
      telegram: '@bidplace_buyer',
      instagram: '@deal.buyer',
      vk: '@deal_buyer',
    });
    const again = await client.get('/me/contacts');
    expect(await again.json()).toMatchObject({
      phone: null,
      telegram: '@bidplace_buyer',
    });
  });

  it('refuses showToBuyer without a seller profile and stores it for an author', async () => {
    const buyer = await createUser(true);
    const buyerClient = new HttpTestClient(http.baseUrl);
    await login(buyerClient, buyer.email);
    expect(
      (await buyerClient.put('/me/contacts', { showToBuyer: false })).status,
    ).toBe(400);
    expect(await (await buyerClient.get('/me/contacts')).json()).toMatchObject({
      showToBuyer: null,
    });

    const author = await createUser(true);
    await database.prisma.sellerProfile.create({
      data: {
        userId: author.id,
        slug: `author-${author.id.slice(0, 8)}`,
        sellerType: 'creator',
        fullName: 'Contacts author',
        country: 'BY',
        profilePhotoMimeType: 'image/png',
        profilePhotoByteLength: permissionImage.byteLength,
        profilePhotoChecksum: '0'.repeat(64),
        profilePhotoData: permissionImage,
        status: 'APPROVED',
      },
    });
    const authorClient = new HttpTestClient(http.baseUrl);
    await login(authorClient, author.email);
    expect(await (await authorClient.get('/me/contacts')).json()).toMatchObject({
      showToBuyer: true,
    });
    const hidden = await authorClient.put('/me/contacts', { showToBuyer: false });
    expect(hidden.status).toBe(200);
    expect(await (await authorClient.get('/me/contacts')).json()).toMatchObject({
      showToBuyer: false,
    });
  });
});
