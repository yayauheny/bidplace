import type { Browser, BrowserContext, Page } from '@playwright/test';
import type { E2EUser } from './e2e-fixtures';

const apiBaseURL = 'http://127.0.0.1:3001';

export async function authenticatedPage(
  browser: Browser,
  user: E2EUser,
): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext({ baseURL: 'http://127.0.0.1:8081' });
  const login = await context.request.post(`${apiBaseURL}/api/auth/login`, {
    data: { email: user.email, password: user.password },
  });
  if (!login.ok()) throw new Error(`E2E session bootstrap failed: ${login.status()}`);
  return { context, page: await context.newPage() };
}
