import { randomUUID } from 'node:crypto';

import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import type { PrismaClient } from '@bidplace/database';
import { CURRENT_RULES_VERSION } from '@bidplace/contracts';

import {
  createIntegrationDatabaseContext,
  type IntegrationDatabaseContext,
} from './test-database';
import {
  createPermissionFixture,
  permissionState,
  resetPermissionFixture,
} from './permission-fixtures';
import {
  createHttpTestApp,
  HttpTestClient,
  type HttpTestApp,
} from './http-test-app';
import { idempotencyKey, turnstileToken } from './abuse-request';

const LEGAL_VERSION = 'synthetic-publication-1';
const legal = {
  agreement: { version: LEGAL_VERSION, confirmed: true },
  privacy: { version: LEGAL_VERSION, confirmed: true },
  dataConsent: { version: LEGAL_VERSION, confirmed: true },
  age18Confirmed: true,
};

// This transport suite simulates an approved, published legal pack.
// The actual docs/legal/site files retain founder blockers and fail closed in runtime.
vi.mock('../../src/auth/legal-documents', () => ({
  readPublishedLegalDocuments: () => ({
    version: 'synthetic-publication-1',
    documents: [
      { id: 'agreement', version: 'synthetic-publication-1', title: 'Agreement', markdown: '# Agreement' },
      { id: 'privacy', version: 'synthetic-publication-1', title: 'Privacy', markdown: '# Privacy' },
      { id: 'data-consent', version: 'synthetic-publication-1', title: 'Consent', markdown: '# Consent' },
      { id: 'author-rules', version: 'synthetic-publication-1', title: 'Rules', markdown: '# Rules' },
      { id: 'prohibited', version: 'synthetic-publication-1', title: 'Prohibited', markdown: '# Prohibited' },
    ],
  }),
}));


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

async function login(
  client: HttpTestClient,
  user: { email: string; password: string },
) {
  const response = await client.post('/auth/login', {
    email: user.email,
    password: user.password,
  });
  expect(response.status).toBe(201);
  return response;
}

function cookiePair(setCookie: string): string {
  return setCookie.split(';', 1)[0]!;
}

describe('auth HTTP transport', () => {
  it.each([
    { name: 'malformed bearer header', headers: { authorization: 'Bearer invalid extra' } },
    { name: 'malformed session cookie', headers: { cookie: 'bidplace_session=%E0%A4%A' } },
    { name: 'empty session cookie', headers: { cookie: 'bidplace_session=' } },
  ])('returns 401 for $name on media while preserving anonymous public access', async ({ headers }) => {
    const fixture = await createPermissionFixture(prisma);
    const profile = await prisma.sellerProfile.findUniqueOrThrow({
      where: { id: fixture.sellers.approved.profileId },
      select: { slug: true },
    });
    const url = new URL(`/api/sellers/${profile.slug}/photo`, http.baseUrl);
    expect((await fetch(url)).status).toBe(200);

    const response = await fetch(url, { headers });

    expect(response.status).toBe(401);
    expect((await response.json()).code).toBe('unauthorized');
    expect((await fetch(new URL('/api/works', http.baseUrl), { headers })).status).toBe(200);
  });

  it('clears a malformed session cookie through logout without changing any account', async () => {
    await createPermissionFixture(prisma);
    const before = await permissionState(prisma);

    const response = await fetch(new URL('/api/auth/logout', http.baseUrl), {
      method: 'POST',
      headers: { cookie: 'bidplace_session=%E0%A4%A' },
    });

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ ok: true });
    expect(response.headers.getSetCookie()[0]).toContain('bidplace_session=;');
    expect(response.headers.getSetCookie()[0]).toContain('Expires=Thu, 01 Jan 1970');
    expect(await permissionState(prisma)).toEqual(before);
  });

  it('rejects extra JWT segments over HTTP while keeping the original session valid', async () => {
    const fixture = await createPermissionFixture(prisma);
    const client = new HttpTestClient(http.baseUrl, 'http://localhost:8081', '10.0.2.8');
    const response = await login(client, fixture.buyer);
    const cookie = cookiePair(response.headers.getSetCookie()[0]!);

    const malformed = await fetch(new URL('/api/auth/me', http.baseUrl), {
      headers: { cookie: `${cookie}.extra` },
    });

    expect(malformed.status).toBe(401);
    expect((await client.get('/auth/me')).status).toBe(200);
  });

  it('returns the accepted rules version in the authenticated user response', async () => {
    const fixture = await createPermissionFixture(prisma);
    const client = new HttpTestClient(
      http.baseUrl,
      'http://localhost:8081',
      '10.0.2.1',
    );
    await login(client, fixture.buyer);

    const acceptance = await client.post('/auth/rules/accept', {
      rulesVersion: CURRENT_RULES_VERSION,
    });

    expect(acceptance.status).toBe(201);
    expect((await acceptance.json()).user.acceptedRulesVersion).toBe(
      CURRENT_RULES_VERSION,
    );
  });

  it('serves the legal document pack anonymously with a no-store response', async () => {
    const visitor = new HttpTestClient(http.baseUrl, 'http://localhost:8081', '203.0.113.42');
    const response = await visitor.get('/auth/legal');
    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toContain('no-store');
    expect(await response.json()).toMatchObject({
      version: LEGAL_VERSION,
      documents: [
        { id: 'agreement', title: 'Agreement', version: LEGAL_VERSION },
      ],
    });
  });

  it('registers over HTTP with normalized identity fields, establishes a session and rejects duplicates without a write', async () => {
    await createPermissionFixture(prisma);
    const client = new HttpTestClient(
      http.baseUrl,
      'http://localhost:8081',
      '10.0.2.5',
    );

    const registration = await client.post('/auth/register', {
      email: 'New.User@Wave3.Test',
      phone: '  +375291234567  ',
      slug: 'new-wave-3-user',
      password: 'password123',
      turnstileToken: turnstileToken('register'),
      legal,
    });
    expect(registration.status).toBe(201);
    expect(registration.headers.getSetCookie()[0]).toContain('HttpOnly');

    const registered = await prisma.user.findUniqueOrThrow({
      where: { email: 'new.user@wave3.test' },
      select: { id: true, email: true, phone: true, displayName: true, slug: true },
    });
    expect(registered).toEqual({
      id: expect.any(String),
      email: 'new.user@wave3.test',
      phone: '+375291234567',
      displayName: null,
      slug: 'new-wave-3-user',
    });

    const evidence = await prisma.registrationLegalEvidence.findUniqueOrThrow({
      where: { userId: registered.id },
    });
    expect(evidence).toMatchObject({
      agreementVersion: LEGAL_VERSION,
      privacyVersion: LEGAL_VERSION,
      dataConsentVersion: LEGAL_VERSION,
      agreementAcceptedAt: expect.any(Date),
      privacyAcknowledgedAt: expect.any(Date),
      dataConsentedAt: expect.any(Date),
      age18ConfirmedAt: expect.any(Date),
    });
    // Account deletion must not silently cascade into the legal-evidence ledger.
    await expect(prisma.user.delete({ where: { id: registered.id } })).rejects.toThrow();
    expect(await prisma.registrationLegalEvidence.count({ where: { userId: registered.id } })).toBe(1);

    const me = await client.get('/auth/me');
    expect(me.status).toBe(200);
    expect(((await me.json()) as { user: { id: string } }).user.id).toBe(
      registered.id,
    );

    const duplicateBefore = await permissionState(prisma);
    const duplicateClient = new HttpTestClient(
      http.baseUrl,
      'http://localhost:8081',
      '10.0.2.6',
    );
    const duplicate = await duplicateClient.post('/auth/register', {
      email: 'NEW.USER@WAVE3.TEST',
      phone: '+375291234567',
      slug: 'another-user',
      password: 'password123',
      turnstileToken: turnstileToken('register'),
      legal,
    });
    expect(duplicate.status).toBe(409);
    expect(await permissionState(prisma)).toEqual(duplicateBefore);
  });

  it('rejects missing consent, false age acknowledgment, and stale versions before writing a user', async () => {
    const client = new HttpTestClient(http.baseUrl, 'http://localhost:8081', '10.0.2.7');
    const email = 'consent-incomplete@wave3.test';
    const request = {
      email,
      password: 'password123',
      slug: 'incomplete-consent',
      turnstileToken: turnstileToken('register'),
    };
    const omitted = await client.post('/auth/register', { ...request });
    expect(omitted.status).toBe(400);
    const falseAge = await client.post('/auth/register', {
      ...request,
      legal: { ...legal, age18Confirmed: false },
    });
    expect(falseAge.status).toBe(400);
    const stale = await client.post('/auth/register', {
      ...request,
      legal: { ...legal, privacy: { version: 'stale', confirmed: true } },
    });
    expect(stale.status).toBe(409);
    expect(await prisma.user.findUnique({ where: { email } })).toBeNull();
  });

  it('round-trips the session cookie through /me and logout, then rejects the stale session', async () => {
    const fixture = await createPermissionFixture(prisma);
    const client = new HttpTestClient(
      http.baseUrl,
      'http://localhost:8081',
      '10.0.2.2',
    );
    const loginResponse = await login(client, fixture.buyer);
    const setCookie = loginResponse.headers.getSetCookie()[0];

    expect(loginResponse.headers.get('access-control-allow-origin')).toBe(
      'http://localhost:8081',
    );
    expect(loginResponse.headers.get('access-control-allow-credentials')).toBe(
      'true',
    );
    expect(setCookie).toBeDefined();
    expect(setCookie).toContain('HttpOnly');
    expect(setCookie).toContain('SameSite=Lax');
    expect(setCookie).toContain('Path=/');
    expect(setCookie).toContain('Max-Age=43200');
    expect(setCookie).not.toContain('Secure');
    expect(setCookie).not.toContain('Domain=');

    const me = await client.get('/auth/me');
    expect(me.status).toBe(200);
    expect(((await me.json()) as { user: { id: string } }).user.id).toBe(
      fixture.buyer.id,
    );
    expect(me.headers.get('access-control-allow-origin')).toBe(
      'http://localhost:8081',
    );
    expect(me.headers.get('access-control-allow-credentials')).toBe('true');

    const beforeLogout = await prisma.user.findUniqueOrThrow({
      where: { id: fixture.buyer.id },
      select: { sessionVersion: true },
    });
    const logout = await client.post('/auth/logout');
    expect(logout.status).toBe(201);
    const clearCookie = logout.headers.getSetCookie()[0];
    expect(clearCookie).toMatch(
      /Max-Age=0|Expires=Thu, 01 Jan 1970 00:00:00 GMT/,
    );
    expect(clearCookie).toContain('HttpOnly');
    expect(clearCookie).toContain('SameSite=Lax');
    expect(clearCookie).toContain('Path=/');

    expect(
      (
        await prisma.user.findUniqueOrThrow({
          where: { id: fixture.buyer.id },
          select: { sessionVersion: true },
        })
      ).sessionVersion,
    ).toBe(beforeLogout.sessionVersion + 1);
    expect((await client.get('/auth/me')).status).toBe(401);

    const staleSession = cookiePair(setCookie!);
    const staleResponse = await fetch(new URL('/api/auth/me', http.baseUrl), {
      headers: {
        cookie: staleSession,
        origin: 'http://localhost:8081',
      },
    });
    expect(staleResponse.status).toBe(401);
  });

  it('rejects invalid sessions safely and does not grant CORS access to a forbidden Origin', async () => {
    await createPermissionFixture(prisma);
    const invalidClient = new HttpTestClient(
      http.baseUrl,
      'http://localhost:8081',
      '10.0.2.3',
    );
    const invalid = await invalidClient.get('/auth/me', {
      headers: { cookie: 'bidplace_session=invalid-token' },
    });
    expect(invalid.status).toBe(401);

    const forbiddenOrigin = await fetch(new URL('/api/auth/me', http.baseUrl), {
      headers: {
        origin: 'https://forbidden.example',
        cookie: 'bidplace_session=invalid-token',
      },
    });
    expect(forbiddenOrigin.status).toBe(401);
    expect(forbiddenOrigin.headers.get('access-control-allow-origin')).not.toBe(
      'https://forbidden.example',
    );
  });

  it('returns the allowed CORS contract for a preflight request without exposing credentials to another Origin', async () => {
    await createPermissionFixture(prisma);
    const allowed = await fetch(new URL('/api/auth/me', http.baseUrl), {
      method: 'OPTIONS',
      headers: {
        origin: 'http://localhost:8081',
        'access-control-request-method': 'GET',
        'access-control-request-headers': 'cookie',
      },
    });
    expect(allowed.status).toBe(204);
    expect(allowed.headers.get('access-control-allow-origin')).toBe(
      'http://localhost:8081',
    );
    expect(allowed.headers.get('access-control-allow-credentials')).toBe(
      'true',
    );

    const forbidden = await fetch(new URL('/api/auth/me', http.baseUrl), {
      method: 'OPTIONS',
      headers: {
        origin: 'https://forbidden.example',
        'access-control-request-method': 'GET',
        'access-control-request-headers': 'cookie',
      },
    });
    expect(forbidden.headers.get('access-control-allow-origin')).not.toBe(
      'https://forbidden.example',
    );
  });

  it('uses the trusted forwarded address for the OTP IP gate', async () => {
    const email = `fwd-${randomUUID().slice(0, 8)}@example.com`;
    const password = 'password123';
    const clientA = new HttpTestClient(http.baseUrl, 'http://localhost:8081', '203.0.113.10');
    const registration = await clientA.post('/auth/register', {
      email,
      password,
      slug: `fwd${randomUUID().slice(0, 6)}`,
      turnstileToken: turnstileToken('register'),
      legal,
    });
    expect(registration.status).toBe(201);

    const requestCode = () =>
      clientA.post('/auth/email/request', {
        idempotencyKey: idempotencyKey(),
        turnstileToken: turnstileToken('email_verification'),
      });
    for (let attempt = 0; attempt < 10; attempt += 1) {
      await requestCode();
    }
    const limited = await requestCode();
    expect(limited.status).toBe(429);
    expect(await limited.json()).toMatchObject({
      code: 'rate_limited',
      message: 'Too many requests',
    });

    const clientB = new HttpTestClient(http.baseUrl, 'http://localhost:8081', '203.0.113.11');
    const loginResponse = await clientB.post('/auth/login', {
      email,
      password,
      turnstileToken: turnstileToken('login'),
    });
    expect(loginResponse.status).toBe(201);
    const otherAddress = await clientB.post('/auth/email/request', {
      idempotencyKey: idempotencyKey(),
      turnstileToken: turnstileToken('email_verification'),
    });
    expect(otherAddress.status).toBe(429);
    expect((await otherAddress.json()).code).toBe('MAIL_COOLDOWN');
  });

  it('rejects register and OTP bodies that omit the proof or idempotency key', async () => {
    const fixture = await createPermissionFixture(prisma);
    const client = new HttpTestClient(
      http.baseUrl,
      'http://localhost:8081',
      '203.0.113.40',
    );
    const email = `missing-proof-${randomUUID().slice(0, 8)}@wave3.test`;
    const register = await client.post('/auth/register', {
      email,
      password: 'password123',
      slug: `mp${randomUUID().slice(0, 6)}`,
    });
    expect(register.status).toBe(400);
    expect(await register.json()).toMatchObject({
      code: 'validation_error',
      details: { fieldErrors: { turnstileToken: expect.any(Array) } },
    });
    expect(await prisma.user.findUnique({ where: { email } })).toBeNull();

    await login(client, fixture.buyer);
    const missingKey = await client.post('/auth/email/request', {
      turnstileToken: turnstileToken('email_verification'),
    });
    const missingProof = await client.post('/auth/email/request', {
      idempotencyKey: idempotencyKey(),
    });
    const missingVerifyKey = await client.post('/auth/email/verify', {
      code: '123456',
    });
    expect(missingKey.status).toBe(400);
    expect(await missingKey.json()).toMatchObject({
      code: 'validation_error',
      details: { fieldErrors: { idempotencyKey: expect.any(Array) } },
    });
    expect(missingProof.status).toBe(400);
    expect(await missingProof.json()).toMatchObject({
      code: 'validation_error',
      details: { fieldErrors: { turnstileToken: expect.any(Array) } },
    });
    expect(missingVerifyKey.status).toBe(400);
    expect(await missingVerifyKey.json()).toMatchObject({
      code: 'validation_error',
      details: { fieldErrors: { idempotencyKey: expect.any(Array) } },
    });
  });
});
