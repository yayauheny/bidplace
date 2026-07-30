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

  it('keeps the existing safe development origin for invalid configuration', () => {
    process.env.EXPO_PUBLIC_API_URL = 'not a URL';

    expect(getApiUrl()).toBe('http://localhost:3001');
    expect(getApiAssetUrl('/api/images/image-1')).toBe(
      'http://localhost:3001/api/images/image-1',
    );
  });
});
