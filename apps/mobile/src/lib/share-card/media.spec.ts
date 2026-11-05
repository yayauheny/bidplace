import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadCover } from './media';

vi.mock('../environment', () => ({ getApiUrl: () => 'https://api.example.invalid' }));
const path = '/api/images/11111111-1111-4111-8111-111111111111';
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('share card cover loading', () => {
  it.each([['public', 'omit'], ['participant', 'include']] as const)('loads %s media with %s credentials', async (access, credentials) => {
    const fetch = vi.fn().mockResolvedValue({ ok: true, headers: new Headers({ 'Content-Type': 'image/webp' }), blob: async () => new Blob(['image']) });
    vi.stubGlobal('fetch', fetch);
    await loadCover(path, access);
    expect(fetch).toHaveBeenCalledWith(`https://api.example.invalid${path}`, { credentials, mode: 'cors', redirect: 'error' });
  });
  it.each([`${path}?source=true`, 'https://evil.invalid' + path, '/api/products/x/story-images/y'])('rejects non-snapshot source %s', async (url) => {
    const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
    await expect(loadCover(url, 'participant')).rejects.toThrow();
    expect(fetch).not.toHaveBeenCalled();
  });
  it('reports blocked, failed and non-image loads', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(new TypeError('CORS')).mockResolvedValueOnce({ ok: false }).mockResolvedValueOnce({ ok: true, headers: new Headers({ 'Content-Type': 'text/html' }) }));
    await expect(loadCover(path, 'public')).rejects.toThrow();
    await expect(loadCover(path, 'public')).rejects.toThrow();
    await expect(loadCover(path, 'public')).rejects.toThrow();
  });
});
