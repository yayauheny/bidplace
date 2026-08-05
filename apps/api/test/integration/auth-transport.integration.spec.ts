import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import type { PrismaClient } from '@bidplace/database';

import {
  createIntegrationDatabaseContext,
  type IntegrationDatabaseContext,
} from './test-database';
import {
  createPermissionFixture,
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
});
