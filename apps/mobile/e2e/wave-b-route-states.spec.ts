import { expect, test } from '@playwright/test';

import { authenticatedPage } from './support/auth-session';
import { createSellerFixture } from './support/e2e-fixtures';

test('seller product draft loading uses the shared PageState contract', async ({
  browser,
}) => {
  test.setTimeout(120_000);
  const { seller } = await createSellerFixture();
  const { context, page } = await authenticatedPage(browser, seller);

  try {
    await page.route(
      '**/api/categories',
      async (route) => {
        await new Promise((resolveDelay) => setTimeout(resolveDelay, 2_000));
        await route.continue();
      },
      { times: 1 },
    );

    await page.goto('/products/new', { waitUntil: 'domcontentloaded' });
    const progressbar = page.getByRole('progressbar');
    await expect(progressbar).toHaveCount(1);
    await expect(progressbar).toHaveAttribute('aria-live', 'polite');
    await expect(progressbar).toBeVisible();
  } finally {
    await context.close();
  }
});
