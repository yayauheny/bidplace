import { randomUUID } from 'node:crypto';

import type { BrowserContext } from '@playwright/test';

export async function assignAuthClientIp(context: BrowserContext): Promise<void> {
  const hex = randomUUID().replace(/-/g, '');
  const documentationIp = `2001:db8:${hex.slice(0, 4)}:${hex.slice(4, 8)}:${hex.slice(8, 12)}:${hex.slice(12, 16)}:${hex.slice(16, 20)}:${hex.slice(20, 24)}`;
  await context.setExtraHTTPHeaders({ 'X-Forwarded-For': documentationIp });
}
