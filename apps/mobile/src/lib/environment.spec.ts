import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { afterEach, describe, expect, it } from 'vitest';

import { getApiAssetUrl, getApiUrl } from './environment';

const originalApiUrl = process.env.EXPO_PUBLIC_API_URL;

afterEach(() => {
  if (originalApiUrl === undefined) delete process.env.EXPO_PUBLIC_API_URL;
  else process.env.EXPO_PUBLIC_API_URL = originalApiUrl;
});

describe('API asset URLs', () => {
  it('resolves a relative asset path against the configured API origin', () => {
    process.env.EXPO_PUBLIC_API_URL = 'https://api.example.test/';

    expect(getApiAssetUrl('/api/images/image-1')).toBe(
      'https://api.example.test/api/images/image-1',
    );
  });

  it('preserves an already absolute HTTP asset URL', () => {
    process.env.EXPO_PUBLIC_API_URL = 'https://api.example.test';

    expect(getApiAssetUrl('https://cdn.example.test/image.jpg')).toBe(
      'https://cdn.example.test/image.jpg',
    );
  });

  it('normalizes a relative path without a leading slash', () => {
    process.env.EXPO_PUBLIC_API_URL = 'https://api.example.test';

    expect(getApiAssetUrl('api/images/image-1')).toBe(
      'https://api.example.test/api/images/image-1',
    );
  });

  it('rejects an invalid configured API origin', () => {
    process.env.EXPO_PUBLIC_API_URL = 'not a URL';

    expect(() => getApiUrl()).toThrow('Invalid URL');
  });
});

describe('public build cache identity', () => {
  const source = readFileSync(
    new URL('../../metro.config.js', import.meta.url),
    'utf8',
  );
  const nodeRequire = createRequire(import.meta.url);
  function cacheVersion(env: Record<string, string | undefined>) {
    const module = { exports: {} as { cacheVersion?: string } };
    runInNewContext(source, {
      module,
      __dirname: '/mobile',
      process: { env },
      require: (name: string) =>
        name === 'expo/metro-config'
          ? { getDefaultConfig: () => ({ cacheVersion: 'base', resolver: {} }) }
          : nodeRequire(name),
    });
    return module.exports.cacheVersion;
  }
  it('keeps identical public builds cached and separates API targets and release flags', () => {
    const env = { EXPO_PUBLIC_API_URL: 'http://localhost:3001' };
    expect(cacheVersion(env)).toBe(cacheVersion({ ...env }));
    for (const change of [
      { EXPO_PUBLIC_API_URL: 'http://localhost:3011' },
      { EXPO_PUBLIC_APP_ENV: 'production' },
      { EXPO_PUBLIC_ANALYTICS_ENABLED: 'true' },
      { EXPO_PUBLIC_TURNSTILE_SITE_KEY: 'public-test-site-key' },
    ])
      expect(cacheVersion({ ...env, ...change })).not.toBe(cacheVersion(env));
  });
});
