import { expect, test } from '@playwright/test';

import { authenticatedPage } from './support/auth-session';
import { createAdminModerationFixture } from './support/e2e-fixtures';

test('catalog sort menu exposes escape and author tabs stay semantic', async ({
  browser,
}) => {
  const fixture = await createAdminModerationFixture();
  const { context, page } = await authenticatedPage(browser, fixture.admin);

  try {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/works');
    await page.getByRole('button', { name: 'Сортировка' }).click();
    await expect(
      page.getByRole('menuitem', { name: 'Сначала новые' }),
    ).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(
      page.getByRole('menuitem', { name: 'Сначала новые' }),
    ).toHaveCount(0);

    await page.goto('/authors');
    const firstAuthor = page.locator('a[href^="/seller/"]').first();
    await expect(firstAuthor).toBeVisible();
    await firstAuthor.click();
    await expect(page.getByRole('tab', { name: /Работы/ })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Об авторе' })).toBeVisible();
  } finally {
    await context.close();
  }
});
