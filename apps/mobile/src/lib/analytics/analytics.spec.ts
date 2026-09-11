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
  it('sends work_viewed with productPublicId', async () => {
    const ingest = vi.fn().mockResolvedValue({ accepted: 1 });

    const analytics = createAnalytics({
      ingest,
      getEnvironment: () => 'test',
      getPlatform: () => 'web',
      getAppVersion: () => '1.0.0',
      isEnabled: () => true,
    });

    await analytics.init();
    analytics.track('work_viewed', {
      productPublicId: 'abcdefghijk',
    });

    await vi.waitFor(() => {
      expect(ingest).toHaveBeenCalled();
    });

    const payload = ingest.mock.calls[0]?.[0];
    expect(payload.events).toHaveLength(1);
    expect(payload.events[0]).toMatchObject({
      name: 'work_viewed',
      properties: {
        productPublicId: 'abcdefghijk',
      },
    });
    expect(payload.events[0].clientCapturedAt).toEqual(expect.any(String));
    expect(payload.environment).toBe('test');
    expect(payload.platform).toBe('web');
    expect(payload.appVersion).toBe('1.0.0');
  });

  it('dedupes work_viewed by productPublicId within a session', async () => {
    const ingest = vi.fn().mockResolvedValue({ accepted: 1 });

    const analytics = createAnalytics({
      ingest,
      getEnvironment: () => 'test',
      getPlatform: () => 'ios',
      isEnabled: () => true,
    });

    await analytics.init();
    analytics.track('work_viewed', { productPublicId: 'abcdefghijk' });
    analytics.track('work_viewed', { productPublicId: 'abcdefghijk' });

    await vi.waitFor(() => {
      expect(ingest).toHaveBeenCalled();
    });

    const events = ingest.mock.calls.flatMap(
      (call) => call[0].events as unknown[],
    );
    expect(events).toHaveLength(1);
  });
});
