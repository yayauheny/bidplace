const SERVER_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ROUTE_TEMPLATE = /^\/[A-Za-z0-9/_:.-]{0,180}$/;
const HTTP_METHOD = /^(GET|HEAD|POST|PUT|PATCH|DELETE|OPTIONS)$/;
const FRAME_SITE = /([^()\s]+):(\d+):\d+\)?$/;
const APP_DIST = /^\/app\/(dist\/[A-Za-z0-9._/-]+\.js)$/;
const PACKAGE_DIST = /\/apps\/api\/(dist\/[A-Za-z0-9._/-]+\.js)$/;
const PACKAGE_SOURCE = /\/(apps\/api\/src\/[A-Za-z0-9._/-]+\.ts)$/;

export const UNMATCHED_ROUTE = 'unmatched';

export function safeRequestId(value: string | undefined): string {
  return value !== undefined && SERVER_ID.test(value) ? value : 'unknown';
}

export function safeUserId(value: string | undefined): string | null {
  return value !== undefined && SERVER_ID.test(value) ? value : null;
}

export function safeMethod(value: string | undefined): string {
  if (!value) {
    return 'UNKNOWN';
  }

  const method = value.toUpperCase();
  return HTTP_METHOD.test(method) ? method : 'UNKNOWN';
}

export function safeStatus(status: number): string {
  return Number.isInteger(status) && status >= 100 && status <= 599
    ? String(status)
    : 'unknown';
}

export function safeRouteTemplate(routePath: unknown): string {
  if (typeof routePath !== 'string' || !ROUTE_TEMPLATE.test(routePath)) {
    return UNMATCHED_ROUTE;
  }

  if (routePath.includes('..')) {
    return UNMATCHED_ROUTE;
  }

  return routePath;
}

export function safeDurationMs(startedAt: number): string {
  const duration = Date.now() - startedAt;
  return Number.isFinite(duration) && duration >= 0
    ? String(Math.floor(duration))
    : '0';
}

function errorHeader(exception: Error): string | null {
  if (typeof exception.name !== 'string' || typeof exception.message !== 'string') {
    return null;
  }

  try {
    const header: unknown = exception.toString();
    return typeof header === 'string' && header.length > 0 ? header : null;
  } catch {
    return null;
  }
}

function framesAfterHeader(exception: Error): string[] | null {
  const { stack } = exception;
  const header = errorHeader(exception);
  if (typeof stack !== 'string' || header === null || !stack.startsWith(header)) {
    return null;
  }

  const frames = stack.slice(header.length);
  if (frames.length > 0 && !frames.startsWith('\n')) {
    return null;
  }

  return frames.split('\n');
}

function shortFrame(line: string): string | null {
  if (!/^\s+at\s/.test(line) || line.length > 300) {
    return null;
  }

  const site = line.match(FRAME_SITE);
  const rawFile = site?.[1];
  const lineNumber = site?.[2];
  if (!rawFile || !lineNumber || rawFile.includes('..')) {
    return null;
  }

  const file = rawFile.startsWith('file://')
    ? rawFile.slice('file://'.length)
    : rawFile;
  if (file.includes('..')) {
    return null;
  }

  const relative =
    file.match(APP_DIST)?.[1] ??
    file.match(PACKAGE_DIST)?.[1] ??
    file.match(PACKAGE_SOURCE)?.[1];
  return relative ? `${relative}:${lineNumber}` : null;
}

export function safeFailureLocation(exception: unknown): string | null {
  if (!(exception instanceof Error)) {
    return null;
  }

  const frames = framesAfterHeader(exception);
  if (frames === null) {
    return null;
  }

  for (const line of frames) {
    const location = shortFrame(line);
    if (location) {
      return location;
    }
  }

  return null;
}
