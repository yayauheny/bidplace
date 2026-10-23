import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  captureFirstTouch,
  createAnalytics,
  getFirstTouch,
  getOrCreateAnonymousId,
  identifyUser,
  parseAttributionFromUrl,
  resetAnonymousIdForTests,
  resetFirstTouchForTests,
  resetUser,
  setStorageForTests,
  type AnalyticsStorage,
} from './index';

function createMemoryStorage(): AnalyticsStorage {
  const map = new Map<string, string>();
  return {
    async getItem(key) {
      return map.has(key) ? map.get(key)! : null;
    },
    async setItem(key, value) {
      map.set(key, value);
    },
    async removeItem(key) {
      map.delete(key);
    },
  };
}

beforeEach(() => {
  setStorageForTests(createMemoryStorage());
});

afterEach(async () => {
  await resetAnonymousIdForTests();
  await resetFirstTouchForTests();
  setStorageForTests(null);
});

describe('anonymous id', () => {
  it('persists a generated anonymous id across reads', async () => {
    const first = await getOrCreateAnonymousId();
    const second = await getOrCreateAnonymousId();

    expect(first).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(second).toBe(first);
  });
});

describe('identity helpers', () => {
  it('identify and reset keep anonymousId stable', () => {
    const base = {
      anonymousId: '11111111-1111-4111-8111-111111111111',
      userId: null as string | null,
    };

    const identified = identifyUser(base, '22222222-2222-4222-8222-222222222222');
    expect(identified).toEqual({
      anonymousId: base.anonymousId,
      userId: '22222222-2222-4222-8222-222222222222',
    });

    const reset = resetUser(identified);
    expect(reset).toEqual({
      anonymousId: base.anonymousId,
      userId: null,
    });
  });
});

describe('first-touch attribution', () => {
  it('parses utm fields and landing path from a url', () => {
    expect(
      parseAttributionFromUrl(
        'https://bidplace.test/product/abc?utm_source=ig&utm_medium=social&utm_campaign=launch&utm_content=story',
      ),
    ).toEqual({
      source: 'ig',
      medium: 'social',
      campaign: 'launch',
      content: 'story',
      landingPath: '/product/abc',
    });
  });

  it('never overwrites an existing first touch', async () => {
    const first = await captureFirstTouch({ source: 'ig', medium: 'social' });
    expect(first?.source).toBe('ig');

    const second = await captureFirstTouch({
      source: 'google',
      medium: 'cpc',
    });
    expect(second?.source).toBe('ig');
    expect(await getFirstTouch()).toEqual(first);
  });
});

describe('AnalyticsClient track', () => {
  it('sends bid_rejected with listingId, errorCode and productPublicId', async () => {
    const ingest = vi.fn().mockResolvedValue({ accepted: 1 });

    const analytics = createAnalytics({
      ingest,
      getEnvironment: () => 'test',
      getPlatform: () => 'web',
      getAppVersion: () => '1.0.0',
      isEnabled: () => true,
    });

    await analytics.init();
    analytics.track('bid_rejected', {
      listingId: '33333333-3333-4333-8333-333333333333',
      errorCode: 'BID_TOO_LOW',
      productPublicId: 'abcdefghijk',
    });

    await vi.waitFor(() => {
      expect(ingest).toHaveBeenCalled();
    });

    const payload = ingest.mock.calls[0]?.[0];
    expect(payload.events).toHaveLength(1);
    expect(payload.events[0]).toMatchObject({
      name: 'bid_rejected',
      properties: {
        listingId: '33333333-3333-4333-8333-333333333333',
        errorCode: 'BID_TOO_LOW',
        productPublicId: 'abcdefghijk',
      },
    });
    expect(payload.events[0].clientCapturedAt).toEqual(expect.any(String));
    expect(payload.environment).toBe('test');
    expect(payload.platform).toBe('web');
    expect(payload.appVersion).toBe('1.0.0');
  });

  it('dedupes listing_viewed by productPublicId within a session', async () => {
    const ingest = vi.fn().mockResolvedValue({ accepted: 1 });

    const analytics = createAnalytics({
      ingest,
      getEnvironment: () => 'test',
      getPlatform: () => 'ios',
      isEnabled: () => true,
    });

    await analytics.init();
    analytics.track('listing_viewed', { productPublicId: 'abcdefghijk' });
    analytics.track('listing_viewed', { productPublicId: 'abcdefghijk' });

    await vi.waitFor(() => {
      expect(ingest).toHaveBeenCalled();
    });

    const events = ingest.mock.calls.flatMap(
      (call) => call[0].events as unknown[],
    );
    expect(events).toHaveLength(1);
  });

  it('batches same-turn views and does not resend stored attribution', async () => {
    const ingest = vi.fn().mockResolvedValue({ accepted: 1 });
    const analytics = createAnalytics({
      ingest,
      getEnvironment: () => 'test',
      getPlatform: () => 'web',
      isEnabled: () => true,
    });

    await analytics.init();
    await analytics.captureAttributionFromLaunch(
      'https://bidplace.test/product/abc?utm_source=ig&utm_medium=social',
    );
    await analytics.flush();
    expect(ingest).toHaveBeenCalledTimes(1);
    expect(ingest.mock.calls[0]?.[0].events).toEqual([]);
    expect(ingest.mock.calls[0]?.[0].attribution).toEqual(
      expect.objectContaining({ source: 'ig', medium: 'social' }),
    );

    ingest.mockClear();
    analytics.track('listing_viewed', { productPublicId: 'abcdefghijk' });
    analytics.track('seller_viewed', {
      sellerProfileId: '11111111-1111-4111-8111-111111111111',
    });
    analytics.track('registration_started', {});
    await analytics.flush();

    expect(ingest).toHaveBeenCalledTimes(1);
    expect(ingest.mock.calls[0]?.[0].attribution).toBeUndefined();
    expect(ingest.mock.calls[0]?.[0].events.map((event: { name: string }) => event.name)).toEqual([
      'listing_viewed',
      'seller_viewed',
      'registration_started',
    ]);
  });
});

describe('public web analytics foundation', () => {
  it('captures only public route identifiers and strips query/hash and private contexts', async () => {
    const { publicAnalyticsPage, webAttribution } =
      await import('./web-analytics');
    expect(publicAnalyticsPage('/', '?utm_source=artist')).toEqual({
      page: 'home',
    });
    expect(
      publicAnalyticsPage('/product/abcdefghijk', '?category=secret'),
    ).toEqual({ page: 'work', publicId: 'abcdefghijk' });
    expect(publicAnalyticsPage('/seller/artist-name', '')).toEqual({
      page: 'author',
      slug: 'artist-name',
    });
    for (const path of [
      '/admin',
      '/account',
      '/author/application',
      '/product/abcdefghijk/edit',
      '/login',
      '/authors/artist-name',
    ])
      expect(publicAnalyticsPage(path, '')).toBeNull();
    expect(
      publicAnalyticsPage('/product/abcdefghijk', '?preview=true'),
    ).toBeNull();
    expect(
      webAttribution(
        'https://bidplace.test/?utm_source=artist&utm_campaign=first&q=private#form',
        'https://example.test/private?q=secret',
      ),
    ).toEqual({
      source: 'artist',
      campaign: 'first',
      referrerHost: 'example.test',
    });
    expect(
      webAttribution('https://bidplace.test/', 'https://bidplace.test/secret'),
    ).toEqual({});
    expect(
      webAttribution(
        'https://bidplace.test/?utm_source=user@example.com',
        'malformed',
      ),
    ).toEqual({});
  });
  it.each([true, false])(
    'retains event ids and first touch on retry with Web Locks available=%s',
    async (locksAvailable) => {
      const { WebAnalyticsCollector } = await import('./web-analytics');
      const payloads: unknown[] = [];
      let fail = true;
      vi.stubGlobal('navigator', {
        locks: locksAvailable
          ? {
              request: async (_name: string, callback: () => Promise<void>) =>
                callback(),
            }
          : undefined,
      });
      try {
        const collector = new WebAnalyticsCollector(async (body) => {
          payloads.push(structuredClone(body));
          if (fail) throw new Error('fixture offline');
        });
        await expect(
          collector.view({ page: 'home' }, { source: 'first' }),
        ).rejects.toThrow('fixture offline');
        fail = false;
        await collector.view({ page: 'works' }, { source: 'later' });
        const [first, second] = payloads as Array<{
          events: Array<{ eventId: string }>;
          attribution: { source: string };
        }>;
        expect(second!.events[0]!.eventId).toBe(first!.events[0]!.eventId);
        expect(second!.events).toHaveLength(2);
        expect(second!.attribution.source).toBe('first');
      } finally {
        vi.unstubAllGlobals();
      }
    },
  );
  it('serializes concurrent views within a tab without Web Locks', async () => {
    const { WebAnalyticsCollector } = await import('./web-analytics');
    vi.stubGlobal('navigator', {});
    let finishFirst: () => void = () => {
      throw new Error('delivery not started');
    };
    const firstDelivery = new Promise<void>((resolve) => {
      finishFirst = resolve;
    });
    const ingest = vi
      .fn()
      .mockImplementationOnce(() => firstDelivery)
      .mockResolvedValue(undefined);
    try {
      const collector = new WebAnalyticsCollector(ingest);
      const first = collector.view({ page: 'home' }, {});
      await vi.waitFor(() => expect(ingest).toHaveBeenCalledTimes(1));
      const second = collector.view(
        { page: 'author', slug: 'artist-name' },
        {},
      );
      expect(ingest).toHaveBeenCalledTimes(1);
      finishFirst();
      await Promise.all([first, second]);
      expect(ingest).toHaveBeenCalledTimes(2);
      expect(
        ingest.mock.calls.map(([body]) =>
          body.events.map((event: { page: unknown }) => event.page),
        ),
      ).toEqual([
        [{ page: 'home' }],
        [{ page: 'author', slug: 'artist-name' }],
      ]);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
