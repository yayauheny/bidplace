import { test as base, expect, type Browser, type BrowserContext, type APIRequestContext } from '@playwright/test';

import { installTurnstileFixture } from './turnstile-fixture';

import { createCommerceTestDatabase, startCommerceTestApi } from '../../../api/test/commerce-test-runtime';
import { createPermissionFixture, type PermissionFixture } from '../../../api/test/integration/permission-fixtures';

const origin = 'http://127.0.0.1:3011';
type User = PermissionFixture['buyer'];
type Database = Awaited<ReturnType<typeof createCommerceTestDatabase>>;
type Api = Awaited<ReturnType<typeof startCommerceTestApi>>;

export const test = base.extend<{ commerce: Commerce }>({
  commerce: async ({ browser }, use) => {
    const database = await createCommerceTestDatabase();
    let api: Api | undefined;
    const contexts: BrowserContext[] = [];
    try {
      api = await startCommerceTestApi(database.databaseUrl, 13001, origin);
      const fixture = await createPermissionFixture(database.prisma);
      await database.prisma.listing.delete({ where: { id: fixture.approvedListingId } });
      const commerce = new Commerce(database, api, fixture, browser, contexts);
      await use(commerce);
    } finally {
      try { await Promise.all(contexts.map((context) => context.close())); }
      finally { try { await api?.close(); } finally { await database.cleanup(); } }
    }
  },
});
export { expect };

class Commerce {
  constructor(
    readonly database: Database,
    readonly api: Api,
    readonly fixture: PermissionFixture,
    private readonly browser: Browser,
    private readonly contexts: BrowserContext[],
  ) {}

  async actor(user: User) {
    const context = await this.browser.newContext({
      baseURL: origin,
      extraHTTPHeaders: { Origin: origin, 'X-Bidplace-Request': '1', 'x-forwarded-for': user.id },
    });
    this.contexts.push(context);
    await this.call(context.request, '/auth/login', { email: user.email, password: user.password }, 201);
    await this.call(context.request, '/me/contacts', { phone: '+375291110099' }, 200, 'PUT');
    const page = await context.newPage();
    await installTurnstileFixture(page);
    return { context, page, request: context.request };
  }

  async call(client: APIRequestContext, path: string, data?: unknown, status = 200, method = data === undefined ? 'GET' : 'POST') {
    const response = await client.fetch(`${this.api.baseUrl}/api${path}`, { method, data });
    expect(response.status(), `${method} ${path}`).toBe(status);
    return response;
  }

  async listing(client: APIRequestContext, type: 'FIXED' | 'AUCTION') {
    const response = await this.call(client, `/works/${this.fixture.approvedProductId}/listings`, {
      type, startMode: 'now', currency: 'BYN',
      ...(type === 'FIXED' ? { priceMinor: 1500 } : { durationDays: 1, startPriceMinor: 1000 }),
    }, 201);
    return await response.json() as { id: string; startsAt: string; endsAt: string | null };
  }

  async tick(client: APIRequestContext) {
    const response = await client.post(`${this.api.baseUrl}/api/internal/tick`, { headers: { 'x-internal-tick': this.api.tickSecret } });
    expect(response.status()).toBe(200);
  }
}
