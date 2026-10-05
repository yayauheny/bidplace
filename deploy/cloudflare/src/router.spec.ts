import { describe, expect, it, vi } from 'vitest';
import { routeRequest } from './router';

function harness(response = () => Response.json({ public: true })) {
  const entries = new Map<string, Response>();
  const pending: Promise<unknown>[] = [];
  const cache = {
    match: vi.fn(async (request: Request) => entries.get(request.url)?.clone()),
    put: vi.fn(async (request: Request, response: Response) => { entries.set(request.url, response); }),
  };
  const fetchApi = vi.fn<(request: Request) => Promise<Response>>(async () => response());
  const getByName = vi.fn(() => ({ fetch: fetchApi }));
  const assets = vi.fn(async () => new Response('SPA'));
  const env = { API: { getByName }, ASSETS: { fetch: assets } };
  const ctx = { waitUntil: (promise: Promise<unknown>) => { pending.push(promise); } };
  return { cache, fetchApi, getByName, assets, pending,
    request: (path: string, init?: RequestInit) => routeRequest(new Request('https://bid.place' + path, init), env, ctx, cache as unknown as Cache) };
}

describe('Cloudflare application boundary', () => {
  it('serves deep links through assets without starting the API', async () => {
    const h = harness();
    expect(await (await h.request('/works/example')).text()).toBe('SPA');
    expect(h.getByName).not.toHaveBeenCalled();
  });

  it('routes unknown API paths to Nest rather than the SPA', async () => {
    const h = harness(() => new Response('missing', { status: 404 }));
    expect((await h.request('/api/unknown')).status).toBe(404);
    expect(h.assets).not.toHaveBeenCalled();
    expect(h.getByName).toHaveBeenCalledWith('portfolio-api');
  });

  it('reuses anonymous public JSON without mixing query filters', async () => {
    const h = harness(() => Response.json({ public: true }, { headers: { Vary: 'Origin' } }));
    expect((await h.request('/api/works?page=1')).headers.get('X-Bidplace-Cache')).toBe('MISS');
    await Promise.all(h.pending);
    expect((await h.request('/api/works?page=1')).headers.get('X-Bidplace-Cache')).toBe('HIT');
    await h.request('/api/works?page=2');
    expect(h.fetchApi).toHaveBeenCalledTimes(2);
  });

  it.each([
    ['/api/auth/me', {}], ['/api/admin/works', {}], ['/api/images/private', {}],
    ['/api/works', { method: 'POST' }], ['/api/works', { headers: { Cookie: 'session=opaque' } }],
    ['/api/works', { headers: { Authorization: 'Bearer opaque' } }],
    ['/api/works', { headers: { Range: 'bytes=0-9' } }],
    ['/api/works', { headers: { Origin: 'https://other.invalid' } }],
  ])('never caches private or credentialed requests: %s %j', async (path, init) => {
    const h = harness();
    await h.request(path, init);
    await h.request(path, init);
    expect(h.fetchApi).toHaveBeenCalledTimes(2);
    expect(h.cache.match).not.toHaveBeenCalled();
    expect(h.cache.put).not.toHaveBeenCalled();
  });

  it.each([
    () => Response.json({}, { status: 500 }),
    () => Response.json({}, { headers: { 'Set-Cookie': 'session=opaque' } }),
    () => Response.json({}, { headers: { 'Cache-Control': 'private' } }),
    () => Response.json({}, { headers: { 'Cache-Control': 'no-store' } }),
    () => Response.json({}, { headers: { Vary: 'Authorization' } }),
    () => new Response('<html>error</html>', { headers: { 'Content-Type': 'text/html' } }),
  ])('does not store unsafe or failed public responses', async (response) => {
    const h = harness(response);
    await h.request('/api/works');
    expect(h.cache.put).not.toHaveBeenCalled();
  });

  it('preserves sessions and bodies while replacing spoofed proxy headers', async () => {
    const h = harness();
    await h.request('/api/auth/login', { method: 'POST', body: 'payload', headers: {
      Cookie: 'session=opaque', 'CF-Connecting-IP': '192.0.2.1', 'X-Forwarded-For': 'spoof',
      'X-Forwarded-Proto': 'http', 'X-Real-IP': 'spoof', Forwarded: 'for=spoof',
    } });
    const forwarded = h.fetchApi.mock.calls[0][0];
    expect(forwarded.headers.get('Cookie')).toBe('session=opaque');
    expect(forwarded.headers.get('X-Forwarded-For')).toBe('192.0.2.1');
    expect(forwarded.headers.get('X-Forwarded-Proto')).toBe('https');
    expect(forwarded.headers.has('Forwarded')).toBe(false);
    expect(forwarded.headers.has('X-Real-IP')).toBe(false);
    expect(await forwarded.text()).toBe('payload');
  });
});
