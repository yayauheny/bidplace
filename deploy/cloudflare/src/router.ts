export interface RouterBindings {
  API: { getByName(name: string): { fetch(request: Request): Promise<Response> } };
  ASSETS: { fetch(request: Request): Promise<Response> };
}

function publicCacheTtl(request: Request): number | undefined {
  if (request.method !== 'GET' || request.headers.has('Authorization') ||
      request.headers.has('Cookie') || request.headers.has('Range')) return;
  const path = new URL(request.url).pathname;
  const origin = request.headers.get('Origin');
  if (origin && origin !== new URL(request.url).origin) return;
  if (path === '/api/categories') return 1800;
  if (path === '/api/portfolio/home' || path === '/api/portfolio/facets') return 60;
  if (/^\/api\/(works|authors)(\/[^/]+)?$/.test(path)) return 30;
}

function forwardedRequest(request: Request): Request {
  const forwarded = new Request(request);
  const headers = forwarded.headers;
  const clientIp = request.headers.get('CF-Connecting-IP');
  // Trust only Cloudflare's ingress IP, never client-supplied proxy headers.
  for (const name of ['Forwarded', 'X-Forwarded-For', 'X-Real-IP',
    'X-Forwarded-Host', 'X-Forwarded-Proto']) headers.delete(name);
  if (clientIp) headers.set('X-Forwarded-For', clientIp);
  headers.set('X-Forwarded-Proto', 'https');
  headers.set('X-Forwarded-Host', new URL(request.url).host);
  return forwarded;
}

export async function routeRequest(
  request: Request,
  env: RouterBindings,
  ctx: Pick<ExecutionContext, 'waitUntil'>,
  cache: Cache,
): Promise<Response> {
  const url = new URL(request.url);
  if (url.pathname !== '/api' && !url.pathname.startsWith('/api/')) {
    return env.ASSETS.fetch(request);
  }
  const ttl = publicCacheTtl(request);
  // Query filters remain part of the key; cookies never create user cache variants.
  const key = new Request(url.toString(), { method: 'GET' });
  if (ttl !== undefined) {
    const hit = await cache.match(key);
    if (hit) {
      const response = new Response(hit.body, hit);
      response.headers.set('X-Bidplace-Cache', 'HIT');
      return response;
    }
  }
  const origin = await env.API.getByName('portfolio-api').fetch(forwardedRequest(request));
  if (ttl === undefined || origin.status !== 200 ||
      !origin.headers.get('Content-Type')?.includes('application/json') ||
      origin.headers.has('Set-Cookie') ||
      (origin.headers.has('Vary') && origin.headers.get('Vary')?.toLowerCase() !== 'origin') ||
      /no-store|private|no-cache/i.test(origin.headers.get('Cache-Control') ?? '')) {
    return origin;
  }
  const response = new Response(origin.body, origin);
  response.headers.set('Cache-Control', `public, max-age=0, s-maxage=${ttl}`);
  response.headers.set('X-Bidplace-Cache', 'MISS');
  response.headers.delete('X-Request-Id');
  ctx.waitUntil(cache.put(key, response.clone()));
  return response;
}
