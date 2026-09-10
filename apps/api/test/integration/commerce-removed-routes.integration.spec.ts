import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { ApiErrorCode } from '@bidplace/contracts';
import { ModulesContainer } from '@nestjs/core';
import type { PrismaClient } from '@bidplace/database';

import {
  createHttpTestApp,
  HttpTestClient,
  type HttpTestApp,
} from './http-test-app';
import {
  createPermissionFixture,
  resetPermissionFixture,
} from './permission-fixtures';
import {
  createIntegrationDatabaseContext,
  type IntegrationDatabaseContext,
} from './test-database';

const COMMERCE_JSON_KEY =
  /"(listing|listings|bid|bids|order|orders|startPrice|currentPrice|priceMin|priceMax)"/;

const REMOVED_COMMERCE_ROUTES: Array<{
  method: 'GET' | 'POST';
  path: string;
}> = [
  { method: 'GET', path: '/listings/2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1' },
  {
    method: 'POST',
    path: '/products/2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1/listings',
  },
  { method: 'GET', path: '/listings/2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1/bids' },
  { method: 'POST', path: '/listings/2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1/bids' },
  { method: 'GET', path: '/orders' },
  { method: 'GET', path: '/discovery/home' },
  { method: 'GET', path: '/products' },
  { method: 'GET', path: '/products/product0011' },
  { method: 'GET', path: '/sellers' },
  { method: 'GET', path: '/me/activity' },
];

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

async function expectUnmatchedRoute(
  client: HttpTestClient,
  method: 'GET' | 'POST',
  path: string,
) {
  const response =
    method === 'GET' ? await client.get(path) : await client.post(path, {});
  expect(response.status).toBe(404);
  expect(response.status).not.toBe(403);
  expect(response.status).not.toBe(401);

  const body = (await response.json()) as {
    status?: number;
    code?: string;
  };
  expect(body.status ?? response.status).toBe(404);
  if (body.code) {
    expect(body.code).toBe(ApiErrorCode.NOT_FOUND);
  }
}

describe('removed commerce HTTP and boot', () => {
  it.each(REMOVED_COMMERCE_ROUTES)(
    'returns unmatched 404 for $method $path',
    async ({ method, path }) => {
      const guest = new HttpTestClient(http.baseUrl, 'http://localhost:8081');
      await expectUnmatchedRoute(guest, method, path);
    },
  );

  it('does not expose a Socket.IO engine', async () => {
    const response = await fetch(
      new URL('/socket.io/?EIO=4&transport=polling', http.baseUrl),
    );
    expect(response.status).toBe(404);
  });

  it('does not register commerce, schedule, or realtime Nest modules', () => {
    const modules = http.app.get(ModulesContainer);
    const names = [...modules.values()].map((moduleRef) => moduleRef.metatype?.name);

    expect(names).toContain('AppModule');
    expect(names).toContain('PortfolioModule');
    expect(names).not.toEqual(
      expect.arrayContaining([
        'ListingsModule',
        'BidsModule',
        'OrdersModule',
        'ActivityModule',
        'RealtimeModule',
        'DiscoveryModule',
        'LifecycleModule',
        'ScheduleModule',
      ]),
    );
  });

  it('keeps public portfolio JSON free of listing, price, bid, and order keys', async () => {
    await createPermissionFixture(prisma);
    const guest = new HttpTestClient(http.baseUrl, 'http://localhost:8081');

    const [home, works, authors] = await Promise.all([
      guest.get('/portfolio/home'),
      guest.get('/works?limit=20'),
      guest.get('/authors?limit=20'),
    ]);

    expect(home.status).toBe(200);
    expect(works.status).toBe(200);
    expect(authors.status).toBe(200);

    const homeBody = (await home.json()) as {
      newWorks: unknown[];
      newAuthors: unknown[];
    };
    const worksBody = (await works.json()) as { works: unknown[] };
    const authorsBody = (await authors.json()) as { authors: unknown[] };

    expect(homeBody.newWorks.length).toBeGreaterThan(0);
    expect(homeBody.newAuthors.length).toBeGreaterThan(0);
    expect(worksBody.works.length).toBeGreaterThan(0);
    expect(authorsBody.authors.length).toBeGreaterThan(0);

    for (const body of [homeBody, worksBody, authorsBody]) {
      expect(JSON.stringify(body)).not.toMatch(COMMERCE_JSON_KEY);
    }
  });
});
