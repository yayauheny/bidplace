import { expect, test } from '@playwright/test';

import { createAuctionFixture } from './support/e2e-fixtures';
import { authenticatedPage } from './support/auth-session';

test('approved author opens an owned Work from the cabinet', async ({
  browser,
}) => {
  test.setTimeout(120_000);
  const fixture = await createAuctionFixture({ live: false });
  const { context, page } = await authenticatedPage(browser, fixture.seller);

  try {
    await page.goto('/cabinet');
    await expect(page.getByText('Кабинет автора')).toBeVisible();
    await expect(page.getByText(fixture.product.title)).toBeVisible();
    await page.getByRole('button', { name: 'Редактировать' }).last().click();
    await expect(page).toHaveURL(new RegExp(`/products/${fixture.product.id}`));
  } finally {
    await context.close();
  }
});
