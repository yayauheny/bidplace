import { describe, expect, it, vi } from 'vitest';
import { routeRequest, runScheduledTick } from './router';

function harness(
  response = () => Response.json({ public: true }),
  release: { hold?: string; control?: string; image?: string } = {},
) {
  const entries = new Map<string, Response>();
  const pending: Promise<unknown>[] = [];
  const cache = {
    match: vi.fn(async (request: Request) => entries.get(request.url)?.clone()),
    put: vi.fn(async (request: Request, response: Response) => { entries.set(request.url, response); }),
  };
  const fetchApi = vi.fn<(request: Request) => Promise<Response>>(async () => response());
  const getByName = vi.fn(() => ({ fetch: fetchApi }));
  const assets = vi.fn(async () => new Response('SPA'));
  const env = {
    API: { getByName }, ASSETS: { fetch: assets }, INTERNAL_TICK_SECRET: 'synthetic-internal-tick',
    RELEASE_HOLD: release.hold, RELEASE_CONTROL: release.control,
    RELEASE_ID: 'a'.repeat(40), RELEASE_IMAGE: release.image ?? 'current',
  };
  const ctx = { waitUntil: (promise: Promise<unknown>) => { pending.push(promise); } };
  return { env, cache, fetchApi, getByName, assets, pending,
    request: (path: string, init?: RequestInit) => routeRequest(new Request('https://bid.place' + path, init), env, ctx, cache as unknown as Cache) };
}

describe('Cloudflare application boundary', () => {
  it.each(['GET', 'POST'])(
    'rejects external internal routes before the container (%s)',
    async (method) => {
      const h = harness();
      for (const path of [
        '/api/internal', '/api/internal/tick', '/api/internal/x',
        '/api/internal/tick?source=cron', '/api/%69nternal/tick',
        '/api/internal%2ftick', '/api//internal/tick',
        '/API/INTERNAL/tick', '/api/internal;x/tick',
        '/api/internal%252ftick', '/%61pi/internal/tick',
        '/api/other%2f..%2finternal/tick', '/api/internal%3ftick',
      ]) {
        const response = await h.request(path, { method, headers: { 'X-Internal-Tick': 'synthetic-internal-tick' } });
        expect(response.status).toBe(404);
        expect(response.headers.get('Cache-Control')).toBe('no-store');
      }
      expect(h.getByName).not.toHaveBeenCalled();
      expect(h.assets).not.toHaveBeenCalled();
      expect(h.cache.match).not.toHaveBeenCalled();
    },
  );

  it('sends one authenticated tick through the private container binding', async () => {
    const h = harness(() => Response.json({ skipped: false, jobs: [{ name: 'media', processed: 1, failed: false }] }));
    const response = await runScheduledTick(h.env);
    expect(response.status).toBe(200);
    expect(h.getByName).toHaveBeenCalledExactlyOnceWith('portfolio-api');
    expect(h.fetchApi).toHaveBeenCalledTimes(1);
    const request = h.fetchApi.mock.calls[0][0];
    expect(request.url).toBe('http://container/api/internal/tick');
    expect(request.method).toBe('POST');
    expect(request.headers.get('X-Internal-Tick')).toBe('synthetic-internal-tick');
  });

  it.each([
    () => new Response('sensitive upstream body', { status: 500 }),
    () => Response.json({ jobs: [{ name: 'sensitive job name', failed: true }] }),
    () => new Response('invalid tick body'),
  ])('rejects failed scheduled ticks without exposing their response body', async (response) => {
    const h = harness(response);
    await expect(runScheduledTick(h.env)).rejects.toThrow(/^Scheduled tick failed$/);
  });

  it('sanitizes scheduled transport rejection', async () => {
    const h = harness();
    h.fetchApi.mockRejectedValue(new Error('sensitive transport details'));
    await expect(runScheduledTick(h.env)).rejects.toThrow(/^Scheduled tick failed$/);
  });

  it('does not wake the container during a release hold', async () => {
    const h = harness(undefined, { hold: 'closed' });
    expect((await runScheduledTick(h.env)).status).toBe(503);
    expect(h.getByName).not.toHaveBeenCalled();
  });

  it('rejects a missing tick secret before waking the container', async () => {
    const h = harness();
    h.env.INTERNAL_TICK_SECRET = '';
    await expect(runScheduledTick(h.env)).rejects.toThrow('INTERNAL_TICK_SECRET');
    expect(h.getByName).not.toHaveBeenCalled();
  });

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

  it('does not cache a public lot nested under a cached work', async () => {
    const h = harness(() => Response.json({ public: true }, { headers: { Vary: 'Origin' } }));
    await h.request('/api/works/x/lot');
    await h.request('/api/works/x/lot');
    expect(h.fetchApi).toHaveBeenCalledTimes(2);
    expect(h.cache.match).not.toHaveBeenCalled();
    expect(h.cache.put).not.toHaveBeenCalled();
  });

  it('reuses anonymous public JSON without mixing query filters', async () => {
    const h = harness(() => Response.json({ public: true }, { headers: { Vary: 'Origin' } }));
    expect((await h.request('/api/works?page=1')).headers.get('X-Bidplace-Cache')).toBe('MISS');
    await Promise.all(h.pending);
    expect((await h.request('/api/works?page=1')).headers.get('X-Bidplace-Cache')).toBe('HIT');
    await h.request('/api/works?page=2');
    expect(h.fetchApi).toHaveBeenCalledTimes(2);
  });

  it.each(['/api/portfolio/home', '/api/portfolio/facets'])(
    'limits %s public cache to 30 seconds', async (path) => {
      const h = harness();
      const response = await h.request(path);
      expect(response.headers.get('Cache-Control')).toBe('public, max-age=0, s-maxage=30');
    },
  );

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
      'X-Internal-Tick': 'synthetic-external-tick', Cookie: 'session=opaque', 'CF-Connecting-IP': '192.0.2.1', 'X-Forwarded-For': 'spoof',
      'X-Forwarded-Proto': 'http', 'X-Real-IP': 'spoof', Forwarded: 'for=spoof',
    } });
    const forwarded = h.fetchApi.mock.calls[0][0];
    expect(forwarded.headers.has('X-Internal-Tick')).toBe(false);
    expect(forwarded.headers.get('Cookie')).toBe('session=opaque');
    expect(forwarded.headers.get('X-Forwarded-For')).toBe('192.0.2.1');
    expect(forwarded.headers.get('X-Forwarded-Proto')).toBe('https');
    expect(forwarded.headers.has('Forwarded')).toBe(false);
    expect(forwarded.headers.has('X-Real-IP')).toBe(false);
    expect(await forwarded.text()).toBe('payload');
  });

  it('maintenance rejects every API path before cache or the container', async () => {
    const h = harness(() => Response.json({ public: true }), { hold: 'closed', control: 'local-release-control-value' });
    for (const path of ['/api', '/api/', '/api/auth/register', '/api/sellers/me']) {
      const response = await h.request(path, { method: 'POST', body: 'write' });
      expect(response.status).toBe(503);
      expect(response.headers.get('Cache-Control')).toBe('no-store');
    }
    expect(h.cache.match).not.toHaveBeenCalled();
    expect(h.cache.put).not.toHaveBeenCalled();
    expect(h.getByName).not.toHaveBeenCalled();
    expect(await (await h.request('/works/example')).text()).toBe('SPA');
    const again = await h.request('/api/works');
    expect(again.status).toBe(503);
    expect(h.getByName).not.toHaveBeenCalled();
  });

  it('does not stop the container from an unauthenticated request', async () => {
    const h = harness(() => Response.json({ status: 'stopped' }), { hold: 'closed', control: 'local-release-control-value' });
    expect((await h.request('/_release/stop', { method: 'POST' })).status).toBe(404);
    expect((await h.request('/_release/stop', {
      method: 'POST', headers: { Authorization: 'Bearer wrong-release-control-value' },
    })).status).toBe(404);
    expect((await h.request('/_release/state')).status).toBe(404);
    expect(h.getByName).not.toHaveBeenCalled();
    expect(h.cache.match).not.toHaveBeenCalled();
  });

  it('confirms stop by container state and keeps maintenance closed', async () => {
    const h = harness(() => Response.json({ status: 'stopping', lastChange: 1 }), {
      hold: 'closed', control: 'local-release-control-value', image: 'previous',
    });
    const stopping = await h.request('/_release/stop', {
      method: 'POST', headers: { Authorization: 'Bearer local-release-control-value' },
    });
    expect(stopping.status).toBe(409);
    expect(await stopping.json()).toMatchObject({ status: 'stopping', releaseImage: 'previous' });
    expect(h.cache.match).not.toHaveBeenCalled();
    const forwarded = h.fetchApi.mock.calls[0][0];
    expect(forwarded.headers.get('Authorization')).toBeNull();
    expect(new URL(forwarded.url).pathname).toBe('/__release/stop');
    expect((await h.request('/api/auth/slug', { method: 'POST' })).status).toBe(503);
    h.fetchApi.mockResolvedValueOnce(Response.json({ status: 'stopped', lastChange: 2 }));
    const stopped = await h.request('/_release/state', {
      headers: { Authorization: 'Bearer local-release-control-value' },
    });
    expect(stopped.status).toBe(200);
    expect(await stopped.json()).toMatchObject({ status: 'stopped', releaseId: 'a'.repeat(40) });
  });
});
