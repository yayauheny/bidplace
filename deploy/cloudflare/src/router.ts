import { containerStopped, isApiPath, releaseHoldClosed, secretMatches } from './release-gate';

export interface RouterBindings {
  API: { getByName(name: string): { fetch(request: Request): Promise<Response> } };
  ASSETS: { fetch(request: Request): Promise<Response> };
  INTERNAL_TICK_SECRET: string;
  RELEASE_HOLD?: string;
  RELEASE_CONTROL?: string;
  RELEASE_ID?: string;
  RELEASE_IMAGE?: string;
}

const privateResponse = { 'Cache-Control': 'no-store' };

function internalApiPath(pathname: string): boolean {
  let path = pathname;
  try {
    while (/%[0-9a-f]{2}/i.test(path)) path = decodeURIComponent(path);
  } catch {
    return true;
  }
  path = path.toLowerCase().replace(/\/+/g, '/').replace(/;[^/]*/g, '');
  path = new URL(path, 'https://worker.invalid').pathname;
  return path === '/api/internal' || path.startsWith('/api/internal/');
}

export async function runScheduledTick(env: RouterBindings): Promise<Response> {
  if (releaseHoldClosed(env.RELEASE_HOLD)) {
    return new Response(null, { status: 503, headers: privateResponse });
  }
  if (!env.INTERNAL_TICK_SECRET?.trim()) throw new Error('Missing INTERNAL_TICK_SECRET');
  try {
    const response = await env.API.getByName('portfolio-api').fetch(new Request('http://container/api/internal/tick', {
      method: 'POST', headers: { 'X-Internal-Tick': env.INTERNAL_TICK_SECRET },
    }));
    if (!response.ok) throw new Error('Scheduled tick failed');
    const result: unknown = await response.clone().json();
    if (!result || typeof result !== 'object' || !('jobs' in result) ||
        !Array.isArray(result.jobs) || result.jobs.some((job: unknown) =>
          !job || typeof job !== 'object' || !('failed' in job) || job.failed !== false))
      throw new Error('Scheduled tick failed');
    return response;
  } catch {
    throw new Error('Scheduled tick failed');
  }
}

function publicCacheTtl(request: Request): number | undefined {
  if (request.method !== 'GET' || request.headers.has('Authorization') ||
      request.headers.has('Cookie') || request.headers.has('Range')) return;
  const path = new URL(request.url).pathname;
  const origin = request.headers.get('Origin');
  if (origin && origin !== new URL(request.url).origin) return;
  if (path === '/api/categories') return 1800;
  if (path === '/api/portfolio/home' || path === '/api/portfolio/facets') return 30;
  if (/^\/api\/(works|authors)(\/[^/]+)?$/.test(path)) return 30;
}

function forwardedRequest(request: Request): Request {
  const forwarded = new Request(request);
  const headers = forwarded.headers;
  headers.delete('X-Internal-Tick');
  const clientIp = request.headers.get('CF-Connecting-IP');
  // Trust only Cloudflare's ingress IP, never client-supplied proxy headers.
  for (const name of ['Forwarded', 'X-Forwarded-For', 'X-Real-IP',
    'X-Forwarded-Host', 'X-Forwarded-Proto']) headers.delete(name);
  if (clientIp) headers.set('X-Forwarded-For', clientIp);
  headers.set('X-Forwarded-Proto', 'https');
  headers.set('X-Forwarded-Host', new URL(request.url).host);
  return forwarded;
}

function releaseCommand(request: Request): '/__release/stop' | '/__release/state' | null {
  const url = new URL(request.url);
  if (url.pathname === '/_release/stop' && request.method === 'POST') return '/__release/stop';
  if (url.pathname === '/_release/state' && request.method === 'GET') return '/__release/state';
  return null;
}

function bearer(request: Request): string {
  const header = request.headers.get('Authorization') ?? '';
  return header.startsWith('Bearer ') ? header.slice('Bearer '.length) : '';
}

async function controlRelease(request: Request, env: RouterBindings): Promise<Response> {
  const command = releaseCommand(request);
  const expected = env.RELEASE_CONTROL ?? '';
  if (!command || !(await secretMatches(expected, bearer(request)))) {
    return new Response(null, { status: 404, headers: privateResponse });
  }
  const origin = new URL(request.url);
  const response = await env.API.getByName('portfolio-api').fetch(new Request(
    new URL(command, origin.origin),
    { method: 'POST' },
  ));
  let payload: { status?: string; lastChange?: number; exitCode?: number } | null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }
  if (!payload || typeof payload !== 'object') {
    return new Response(null, { status: 502, headers: privateResponse });
  }
  const status = containerStopped(payload) ? 200 : response.status === 200 ? 409 : response.status;
  return Response.json({
    status: payload.status,
    lastChange: payload.lastChange,
    exitCode: payload.exitCode,
    releaseId: env.RELEASE_ID ?? null,
    releaseImage: env.RELEASE_IMAGE ?? null,
  }, { status, headers: privateResponse });
}

export async function routeRequest(
  request: Request,
  env: RouterBindings,
  ctx: Pick<ExecutionContext, 'waitUntil'>,
  cache: Cache,
): Promise<Response> {
  const url = new URL(request.url);
  if (internalApiPath(url.pathname)) {
    return new Response(null, { status: 404, headers: privateResponse });
  }
  if (url.pathname === '/_release/stop' || url.pathname === '/_release/state') {
    return controlRelease(request, env);
  }
  if (releaseHoldClosed(env.RELEASE_HOLD) && isApiPath(url.pathname)) {
    return new Response(null, { status: 503, headers: privateResponse });
  }
  if (!isApiPath(url.pathname)) {
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
