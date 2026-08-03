import { expect, test } from '@playwright/test';

import { authenticatedPage } from './support/auth-session';
import { createSellerFixture } from './support/e2e-fixtures';

test('seller and order route loading states use the shared PageState contract', async ({
  browser,
}) => {
  test.setTimeout(120_000);
  const { seller } = await createSellerFixture();
  const { context, page } = await authenticatedPage(browser, seller);

  try {
    const assertLoadingState = async (path: string, requestPattern: string) => {
      await page.route(
        requestPattern,
        async (route) => {
          await new Promise((resolveDelay) => setTimeout(resolveDelay, 2_000));
          await route.continue();
        },
        { times: 1 },
      );

      await page.goto(path, { waitUntil: 'domcontentloaded' });
      const progressbar = page.getByRole('progressbar');
      await expect(progressbar).toHaveCount(1);
      await expect(progressbar).toHaveAttribute('aria-live', 'polite');
      await expect(progressbar).toBeVisible();
    };

    await assertLoadingState('/products/new', '**/api/categories');
    await assertLoadingState('/listings/new', '**/api/seller/products');
    await assertLoadingState(
      '/order/wave-b-route-state-order',
      '**/api/orders/wave-b-route-state-order',
    );
  } finally {
    await context.close();
  }
});
