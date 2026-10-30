import {
  meResponseSchema,
  apiErrorResponseSchema,
  legalDocumentsResponseSchema,
  emailLoginRequestResponseSchema,
  CURRENT_RULES_VERSION,
} from '@bidplace/contracts';
import { ServiceUnavailableException } from '@nestjs/common';
import { readPublishedLegalDocuments } from '../../src/auth/legal-documents';
import { createHash, randomUUID } from 'node:crypto';
import { EmailProofService } from '../../src/auth/email-proof.service';
import { SessionService, type SessionRequest } from '../../src/auth/session.service';
import { AntifraudService, MAIL_BUDGET_PURPOSES, MAIL_SPEND_STATUSES } from '../../src/antifraud';
import { SERVER_ENV } from '../../src/core/config';
import { PrismaService } from '../../src/core/database';

import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import type { PrismaClient } from '@bidplace/database';


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
import { MailTransport } from '../../src/core/mail';

const LEGAL_VERSION = 'synthetic-publication-1';
const syntheticPublishedLegalPack = {
  version: LEGAL_VERSION,
  documents: [
    {
      id: 'agreement',
      version: LEGAL_VERSION,
      title: 'Agreement',
      markdown: '# Agreement',
    },
    {
      id: 'privacy',
      version: LEGAL_VERSION,
      title: 'Privacy',
      markdown: '# Privacy',
    },
    {
      id: 'data-consent',
      version: LEGAL_VERSION,
      title: 'Consent',
      markdown: '# Consent',
    },
    {
      id: 'author-rules',
      version: LEGAL_VERSION,
      title: 'Rules',
      markdown: '# Rules',
    },
    {
      id: 'prohibited',
      version: LEGAL_VERSION,
      title: 'Prohibited',
      markdown: '# Prohibited',
    },
  ],
};
const legal = {
  agreement: { version: LEGAL_VERSION, confirmed: true },
  privacy: { version: LEGAL_VERSION, confirmed: true },
  dataConsent: { version: LEGAL_VERSION, confirmed: true },
  age18Confirmed: true,
};

// This transport suite simulates an approved, published legal pack.
// The actual docs/legal/site files retain founder blockers and fail closed in runtime.
vi.mock('../../src/auth/legal-documents', () => ({
  readRegistrationLegalVersion: () => LEGAL_VERSION,
  readPublishedLegalDocuments: vi.fn(() => syntheticPublishedLegalPack),
}));

let database: IntegrationDatabaseContext;
let http: HttpTestApp;
let prisma: PrismaClient;

async function proveRegistrationEmail(client: HttpTestClient, email: string) {
  let code = '';
  const mail = http.app.get(MailTransport);
  const spy = vi.spyOn(mail, 'send').mockImplementationOnce(async (message) => {
    code = /\b(\d{6})\b/.exec(message.text)?.[1] ?? '';
  });
  try {
    const requested = await client.post('/auth/register/email/request', {
      email,
      idempotencyKey: idempotencyKey(),
      turnstileToken: turnstileToken('register'),
    });
    expect(requested.status).toBe(201);
    expect(code).toMatch(/^\d{6}$/);
    const verified = await client.post('/auth/register/email/verify', {
      code,
      idempotencyKey: idempotencyKey(),
    });
    expect(verified.status).toBe(201);
  } finally {
    spy.mockRestore();
  }
}

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
    { origin: 'https://untrusted.example', header: '1' },
    { origin: 'http://localhost:8081', header: '' },
  ])(
    'rejects cross-site or unmarked mutations: %j',
    async ({ origin, header }) => {
      const response = await fetch(new URL('/api/auth/logout', http.baseUrl), {
        method: 'POST',
        headers: { origin, 'X-Bidplace-Request': header },
      });
      expect(response.status).toBe(403);
    },
  );

  it('persists the session across API restart and rejects a late save after logout', async () => {
    const fixture = await createPermissionFixture(prisma);
    const client = new HttpTestClient(http.baseUrl);
    const loginResponse = await login(client, fixture.buyer);
    const cookie = cookiePair(loginResponse.headers.getSetCookie()[0]!);
    const stored = await prisma.authSession.findFirstOrThrow({
      where: {
        sess: { path: ['principal', 'userId'], equals: fixture.buyer.id },
      },
    });
    const restarted = await createHttpTestApp(database.databaseUrl);
    try {
      const me = await fetch(new URL('/api/auth/me', restarted.baseUrl), {
        headers: { cookie },
      });
      expect(me.status).toBe(200);
      expect((meResponseSchema.parse(await me.json())).user.id).toBe(fixture.buyer.id);
      await client.post('/auth/logout');
      // Simulate a request that loaded this session before logout and saved afterwards.
      await prisma.authSession.upsert({
        where: { sid: stored.sid },
        create: { ...stored, sess: stored.sess! },
        update: { sess: stored.sess! },
      });
      const stale = await fetch(new URL('/api/auth/me', restarted.baseUrl), {
        headers: { cookie },
      });
      expect(stale.status).toBe(401);
    } finally {
      await restarted.close();
    }
  });

  it.each([
    {
      name: 'malformed bearer header',
      headers: { authorization: 'Bearer invalid extra' },
    },
    {
      name: 'malformed session cookie',
      headers: { cookie: 'bidplace_session=%E0%A4%A' },
    },
    { name: 'empty session cookie', headers: { cookie: 'bidplace_session=' } },
  ])(
    'returns 401 for $name on media while preserving anonymous public access',
    async ({ headers }) => {
      const fixture = await createPermissionFixture(prisma);
      const profile = await prisma.sellerProfile.findUniqueOrThrow({
        where: { id: fixture.sellers.approved.profileId },
        select: { slug: true },
      });
      const url = new URL(`/api/sellers/${profile.slug}/photo`, http.baseUrl);
      expect((await fetch(url)).status).toBe(200);

      const response = await fetch(url, { headers });

      expect(response.status).toBe(401);
      expect((apiErrorResponseSchema.parse(await response.json())).code).toBe('unauthorized');
      expect(
        (await fetch(new URL('/api/works', http.baseUrl), { headers })).status,
      ).toBe(200);
    },
  );

  it('clears a malformed session cookie through logout without changing any account', async () => {
    await createPermissionFixture(prisma);
    const before = await permissionState(prisma);

    const response = await fetch(new URL('/api/auth/logout', http.baseUrl), {
      method: 'POST',
      headers: {
        cookie: 'bidplace_session=%E0%A4%A',
        origin: 'http://localhost:8081',
        'X-Bidplace-Request': '1',
      },
    });

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ ok: true });
    expect(response.headers.getSetCookie()[0]).toContain('bidplace_session=;');
    expect(response.headers.getSetCookie()[0]).toContain(
      'Expires=Thu, 01 Jan 1970',
    );
    expect(await permissionState(prisma)).toEqual(before);
  });

  it('rejects extra JWT segments over HTTP while keeping the original session valid', async () => {
    const fixture = await createPermissionFixture(prisma);
    const client = new HttpTestClient(
      http.baseUrl,
      'http://localhost:8081',
      '10.0.2.8',
    );
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
    expect((meResponseSchema.parse(await acceptance.json())).user.acceptedRulesVersion).toBe(
      CURRENT_RULES_VERSION,
    );
  });

  it('serves the legal document pack anonymously with a no-store response', async () => {
    const visitor = new HttpTestClient(
      http.baseUrl,
      'http://localhost:8081',
      '203.0.113.42',
    );
    const response = await visitor.get('/auth/legal');
    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toContain('no-store');
    const body = legalDocumentsResponseSchema.parse(await response.json());
    expect(body.version).toBe(LEGAL_VERSION);
    expect(body.documents).toHaveLength(
      syntheticPublishedLegalPack.documents.length,
    );
    expect(body.documents.map((doc: { id: string }) => doc.id)).toEqual(
      syntheticPublishedLegalPack.documents.map((doc) => doc.id),
    );
    expect(body).toMatchObject({
      version: LEGAL_VERSION,
      documents: syntheticPublishedLegalPack.documents.map(
        ({ id, title, version }) => ({
          id,
          title,
          version,
        }),
      ),
    });
  });

  it.each([true, false])(
    'registers atomically and rejects duplicates with client version=%s',
    async (versioned) => {
      await createPermissionFixture(prisma);
      const client = new HttpTestClient(
        http.baseUrl,
        'http://localhost:8081',
        '10.0.2.5',
      );

      if (!versioned) {
        vi.mocked(readPublishedLegalDocuments).mockImplementationOnce(() => {
          throw new ServiceUnavailableException();
        });
        expect((await client.get('/auth/legal')).status).toBe(503);
      }
      await proveRegistrationEmail(client, 'New.User@Wave3.Test');
      const registration = await client.post('/auth/register', {
        email: 'New.User@Wave3.Test',
        slug: 'new-wave-3-user',
        password: 'password123',
        legal: versioned
          ? legal
          : {
              agreement: { confirmed: true },
              privacy: { confirmed: true },
              dataConsent: { confirmed: true },
              age18Confirmed: true,
            },
      });
      expect(registration.status).toBe(201);
      expect(registration.headers.getSetCookie()[0]).toContain('HttpOnly');

      const registered = await prisma.user.findUniqueOrThrow({
        where: { email: 'new.user@wave3.test' },
        select: {
          id: true,
          email: true,
          phone: true,
          displayName: true,
          slug: true,
        },
      });
      expect(registered).toEqual({
        id: expect.any(String),
        email: 'new.user@wave3.test',
        phone: null,
        displayName: null,
        slug: 'new-wave-3-user',
      });

      const evidence = await prisma.registrationLegalEvidence.findUniqueOrThrow(
        {
          where: { userId: registered.id },
        },
      );
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
      await expect(
        prisma.user.delete({ where: { id: registered.id } }),
      ).rejects.toThrow();
      expect(
        await prisma.registrationLegalEvidence.count({
          where: { userId: registered.id },
        }),
      ).toBe(1);

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
      await proveRegistrationEmail(duplicateClient, 'NEW.USER@WAVE3.TEST');
      const duplicate = await duplicateClient.post('/auth/register', {
        email: 'NEW.USER@WAVE3.TEST',
        slug: 'another-user',
        password: 'password123',
        legal,
      });
      expect(duplicate.status).toBe(409);
      expect(await permissionState(prisma)).toEqual(duplicateBefore);
    },
  );

  it('rejects missing consent, false age acknowledgment, and stale versions before writing a user', async () => {
    const client = new HttpTestClient(
      http.baseUrl,
      'http://localhost:8081',
      '10.0.2.7',
    );
    const email = 'consent-incomplete@wave3.test';
    const request = {
      email,
      password: 'password123',
      slug: 'incomplete-consent',
    };
    const omitted = await client.post('/auth/register', { ...request });
    expect(omitted.status).toBe(400);
    const falseAge = await client.post('/auth/register', {
      ...request,
      legal: { ...legal, age18Confirmed: false },
    });
    expect(falseAge.status).toBe(400);
    await proveRegistrationEmail(client, email);
    const stale = await client.post('/auth/register', {
      ...request,
      legal: { ...legal, privacy: { version: 'stale', confirmed: true } },
    });
    expect(stale.status).toBe(409);
    expect(await prisma.user.findUnique({ where: { email } })).toBeNull();
  });

  it('reserves registration mail against the same global budget as other auth mail', async () => {
    const email = `proof-budget-${randomUUID()}@example.test`;
    const sid = randomUUID();
    const flow = await prisma.authFlow.create({ data: {
      browserHash: createHash('sha256').update(sid).digest('hex'),
      intent: 'register', stage: 'email', email, returnPath: '/', expiresAt: new Date(Date.now() + 600_000),
    } });
    const spent = await prisma.authAbuseOperation.count({ where: {
      purpose: { in: [...MAIL_BUDGET_PURPOSES] }, status: { in: [...MAIL_SPEND_STATUSES] },
      createdAt: { gt: new Date(Date.now() - 86_400_000) },
    } });
    const mail = http.app.get(MailTransport);
    const spy = vi.spyOn(mail, 'send').mockResolvedValue(undefined);
    const service = new EmailProofService(
      http.app.get(PrismaService), mail, http.app.get(AntifraudService), http.app.get(SessionService),
      { ...http.app.get(SERVER_ENV), AUTH_MAIL_DAILY_BUDGET: spent },
    );
    try {
      await expect(service.request({ sessionID: sid, session: { flowId: flow.id } } as SessionRequest, {
        email, idempotencyKey: idempotencyKey(), turnstileToken: turnstileToken('register'), ip: '198.51.100.65', intent: 'register',
      })).rejects.toThrow('Email budget exhausted');
      expect(spy).not.toHaveBeenCalled();
      expect((await prisma.authFlow.findUniqueOrThrow({ where: { id: flow.id } })).codeSends).toBe(0);
    } finally {
      spy.mockRestore();
    }
  });

  it('limits registration code guesses and replays a send without a second email', async () => {
    const email = `proof-limits-${randomUUID()}@example.test`;
    const client = new HttpTestClient(http.baseUrl, undefined, '198.51.100.64');
    let sentCode = '';
    const spy = vi.spyOn(http.app.get(MailTransport), 'send').mockImplementation(async (message) => {
      sentCode = /\b(\d{6})\b/.exec(message.text)?.[1] ?? '';
    });
    try {
      const input = { email, idempotencyKey: idempotencyKey(), turnstileToken: turnstileToken('register') };
      expect((await client.post('/auth/register/email/request', input)).status).toBe(201);
      expect((await client.post('/auth/register/email/request', input)).status).toBe(201);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(await prisma.user.count({ where: { email } })).toBe(0);
      const wrong = sentCode === '000000' ? '111111' : '000000';
      for (let attempt = 0; attempt < 5; attempt += 1)
        expect((await client.post('/auth/register/email/verify', { code: wrong, idempotencyKey: idempotencyKey() })).status).toBe(403);
      expect((await client.post('/auth/register/email/verify', { code: sentCode, idempotencyKey: idempotencyKey() })).status).toBe(429);
      expect((await client.post('/auth/register', { email, slug: 'limit-' + randomUUID().slice(0, 8), password: 'synthetic-password', legal })).status).toBe(401);
      expect(await prisma.user.count({ where: { email } })).toBe(0);
    } finally {
      spy.mockRestore();
    }
  });

  it.each(['expired', 'cancelled', 'different-email'] as const)('rejects %s registration proof before creating a user', async (state) => {
    const email = `proof-state-${randomUUID()}@example.test`;
    const current = new HttpTestClient(http.baseUrl, undefined, `198.51.100.${state === 'expired' ? 66 : state === 'cancelled' ? 67 : 68}`);
    await proveRegistrationEmail(current, email);
    if (state === 'expired')
      await prisma.authFlow.updateMany({ where: { email }, data: { expiresAt: new Date(0) } });
    if (state === 'cancelled') expect((await current.post('/auth/logout')).status).toBe(201);
    const requestedEmail = state === 'different-email' ? `different-${email}` : email;
    expect((await current.post('/auth/register', { email: requestedEmail, slug: 'state-' + randomUUID().slice(0, 8), password: 'synthetic-password', legal })).status).toBe(401);
    expect(await prisma.user.count({ where: { email: { in: [email, requestedEmail] } } })).toBe(0);
  });

  it('requires browser-bound email proof before registration and reveals collisions only afterward', async () => {
    const existing = await prisma.user.create({
      data: {
        email: `existing-${randomUUID()}@example.test`,
        slug: 'existing-' + randomUUID().slice(0, 8),
        emailVerifiedAt: new Date(),
      },
    });
    const client = new HttpTestClient(http.baseUrl);
    const other = new HttpTestClient(http.baseUrl);
    const email = `new-${randomUUID()}@example.test`;
    let code = '';
    const spy = vi.spyOn(http.app.get(MailTransport), 'send').mockImplementation(async (message) => {
      code = /\b(\d{6})\b/.exec(message.text)?.[1] ?? '';
    });
    try {
      for (const address of [existing.email, email]) {
        const response = await client.post('/auth/register/email/request', {
          email: address,
          idempotencyKey: idempotencyKey(),
          turnstileToken: turnstileToken('register'),
        });
        expect(response.status).toBe(201);
        expect(Object.keys(emailLoginRequestResponseSchema.parse(await response.json())).sort()).toEqual([
          'ok', 'resendAvailableAt', 'serverNow',
        ]);
        expect(code).toMatch(/^\d{6}$/);
        expect((await other.post('/auth/register/email/verify', {
          code,
          idempotencyKey: idempotencyKey(),
        })).status).toBe(403);
        expect((await client.post('/auth/register/email/verify', {
          code,
          idempotencyKey: idempotencyKey(),
        })).status).toBe(201);
        const result = await client.post('/auth/register', {
          email: address,
          slug: 'new-' + randomUUID().slice(0, 8),
          password: 'synthetic-password',
          legal,
        });
        expect(result.status).toBe(address === email ? 201 : 409);
      }
      expect(await prisma.user.count({ where: { email } })).toBe(1);
      expect(await prisma.user.count({ where: { email: existing.email } })).toBe(1);
    } finally {
      spy.mockRestore();
    }
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
    const expires = /Expires=([^;]+)/.exec(setCookie!)?.[1];
    expect(expires).toBeDefined();
    expect(Date.parse(expires!) - Date.now()).toBeGreaterThan(43_190_000);
    expect(Date.parse(expires!) - Date.now()).toBeLessThanOrEqual(43_200_000);
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
    const clientA = new HttpTestClient(
      http.baseUrl,
      'http://localhost:8081',
      '203.0.113.10',
    );
    await proveRegistrationEmail(clientA, email);
    const registration = await clientA.post('/auth/register', {
      email,
      password,
      slug: `fwd${randomUUID().slice(0, 6)}`,
      legal,
    });
    expect(registration.status).toBe(201);
    await prisma.user.update({
      where: { email },
      data: { emailVerifiedAt: null },
    });

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

    const clientB = new HttpTestClient(
      http.baseUrl,
      'http://localhost:8081',
      '203.0.113.11',
    );
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
    expect((apiErrorResponseSchema.parse(await otherAddress.json())).code).toBe('MAIL_COOLDOWN');
  });

  it('rejects register and OTP bodies that omit the proof or idempotency key', async () => {
    const fixture = await createPermissionFixture(prisma);
    const client = new HttpTestClient(
      http.baseUrl,
      'http://localhost:8081',
      '203.0.113.40',
    );
    const email = `missing-proof-${randomUUID().slice(0, 8)}@wave3.test`;
    const register = await client.post('/auth/register/email/request', {
      email,
      idempotencyKey: idempotencyKey(),
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
