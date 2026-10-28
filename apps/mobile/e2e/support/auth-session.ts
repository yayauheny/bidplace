import type {
  Browser,
  BrowserContext,
  BrowserContextOptions,
  Page,
} from '@playwright/test';
import type { E2EUser } from './e2e-fixtures';
import { e2eApiBaseURL, e2eWebBaseURL } from './e2e-env';

const apiBaseURL = e2eApiBaseURL;
export const e2eRequestHeaders = {
  Origin: e2eWebBaseURL,
  'X-Bidplace-Request': '1',
};

export async function authenticatedPage(
  browser: Browser,
  user: E2EUser,
  recordVideo?: BrowserContextOptions['recordVideo'],
  options?: { hasTouch?: boolean },
): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext({
    baseURL: e2eWebBaseURL,
    recordVideo,
    hasTouch: options?.hasTouch,
    extraHTTPHeaders: e2eRequestHeaders,
  });
  const login = await context.request.post(`${apiBaseURL}/api/auth/login`, {
    headers: { 'x-forwarded-for': user.id || user.email },
    data: { email: user.email, password: user.password },
  });
  if (!login.ok())
    throw new Error(`E2E session bootstrap failed: ${login.status()}`);
  return { context, page: await context.newPage() };
}
