import { createHmac, timingSafeEqual } from 'node:crypto';
import { Logger } from '@nestjs/common';
import { uuidSchema } from '@bidplace/contracts';
import type { ServerEnv } from '../core/config';
import type { PrismaService } from '../core/database';
import { readCookie } from '../auth/auth.helpers';

export const ANALYTICS_BROWSER_COOKIE = 'bp_web_analytics';
const logger = new Logger('BrowserAttribution');
export function signAnalyticsBrowser(id: string, env: ServerEnv): string {
  const signature = createHmac('sha256', env.SESSION_SECRET)
    .update(`web-analytics:v2:${env.APP_ENV}:${id}`)
    .digest('base64url');
  return `${id}.${signature}`;
}
export function analyticsBrowserId(
  cookie: string | undefined,
  env: ServerEnv,
): string | null {
  if (!env.ANALYTICS_WEB_ENABLED) return null;
  let value: string | null;
  try {
    value = readCookie(cookie, ANALYTICS_BROWSER_COOKIE);
  } catch {
    return null;
  }
  if (!value || !/^[a-f0-9-]{36}\.[A-Za-z0-9_-]{43}$/i.test(value)) return null;
  const [id] = value.split('.');
  if (!uuidSchema.safeParse(id).success || !id) return null;
  const expected = signAnalyticsBrowser(id, env);
  const expectedBytes = Buffer.from(expected),
    suppliedBytes = Buffer.from(value);
  return expectedBytes.length === suppliedBytes.length &&
    timingSafeEqual(expectedBytes, suppliedBytes)
    ? id
    : null;
}
export async function recordAnalyticsRegistration(
  prisma: Pick<PrismaService, 'user' | 'acquisitionAttribution'>,
  env: ServerEnv,
  cookie: string | undefined,
  userId: string,
): Promise<void> {
  try {
    const id = analyticsBrowserId(cookie, env);
    if (!id) return;
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { createdAt: true },
    });
    await prisma.acquisitionAttribution.updateMany({
      where: {
        anonymousId: id,
        collectionVersion: 2,
        environment: env.APP_ENV,
        registeredUserId: null,
        capturedAt: { lte: user.createdAt },
      },
      data: { registeredUserId: userId },
    });
  } catch {
    logger.warn('Registration saved; acquisition link unavailable');
  }
}
