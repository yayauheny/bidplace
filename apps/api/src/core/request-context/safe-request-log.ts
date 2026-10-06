const SERVER_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ROUTE_TEMPLATE = /^\/[A-Za-z0-9/_:.-]{0,180}$/;
const HTTP_METHOD = /^(GET|HEAD|POST|PUT|PATCH|DELETE|OPTIONS)$/;
const FAILURE_FRAME =
  /\/(apps\/api\/src\/[A-Za-z0-9._/-]+\.ts):(\d+):\d+/;

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

export function safeFailureLocation(exception: unknown): string | null {
  if (!(exception instanceof Error) || typeof exception.stack !== 'string') {
    return null;
  }

  for (const line of exception.stack.split('\n')) {
    if (!/^\s+at\s/.test(line) || line.length > 300) {
      continue;
    }

    const match = line.match(FAILURE_FRAME);
    const file = match?.[1];
    const lineNumber = match?.[2];
    if (!file || !lineNumber || file.includes('..')) {
      continue;
    }

    return `${file}:${lineNumber}`;
  }

  return null;
}
