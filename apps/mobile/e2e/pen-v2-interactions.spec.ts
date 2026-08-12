import { expect, test } from '@playwright/test';

import { authenticatedPage } from './support/auth-session';
import { createAdminModerationFixture } from './support/e2e-fixtures';

test('Pen v2 discovery menus expose escape and semantic creator tabs', async ({
  browser,
}) => {
  const fixture = await createAdminModerationFixture();
  const { context, page } = await authenticatedPage(browser, fixture.admin);

  try {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/works');
    await page.getByRole('button', { name: 'Статус' }).click();
    await expect(page.getByRole('menuitem', { name: 'Идут торги' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('menuitem', { name: 'Идут торги' })).toHaveCount(0);

    await page.goto('/authors');
    const firstAuthor = page.locator('a[href^="/seller/"]').first();
    await expect(firstAuthor).toBeVisible();
    await firstAuthor.click();
    await expect(
      page.getByRole('tablist', { name: 'Статусы работ автора' }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Сортировка работ автора' }).click();
    await expect(page.getByRole('menuitem', { name: 'Сначала новые' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('menuitem', { name: 'Сначала новые' })).toHaveCount(0);
  } finally {
    await context.close();
  }
});
