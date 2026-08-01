import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

import { expect, test } from '@playwright/test';

import { authenticatedPage } from './support/auth-session';
import { createAdminModerationFixture } from './support/e2e-fixtures';

const screenshotDir = resolve('/private/tmp', 'bidplace-wave2-screenshots');

test('captures Wave 2 layouts at target widths', async ({ browser }) => {
  test.setTimeout(120_000);
  await mkdir(screenshotDir, { recursive: true });
  const fixture = await createAdminModerationFixture();
  const { context, page } = await authenticatedPage(browser, fixture.admin);

  try {
    for (const width of [1440, 1024, 390]) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });

      await page.goto('/');
      await expect(page.getByRole('heading', { name: 'Каталог' })).toHaveCount(
        0,
      );
      await page.screenshot({
        path: resolve(screenshotDir, `catalog-${width}.png`),
        fullPage: true,
      });

      await page.goto('/product/seedLive002');
      await expect(page.getByText('Торги идут').first()).toBeVisible();
      await page.screenshot({
        path: resolve(screenshotDir, `product-${width}.png`),
        fullPage: true,
      });

      await page.goto('/admin');
      await expect(page.getByText('Модерация').first()).toBeVisible();
      await page
        .getByText(fixture.sellerName, { exact: true })
        .first()
        .locator('..')
        .getByRole('button', { name: 'Приостановить' })
        .click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await page.screenshot({
        path: resolve(screenshotDir, `dialog-${width}.png`),
        fullPage: true,
      });
      await page.getByRole('button', { name: 'Отмена' }).last().click();
    }
  } finally {
    await context.close();
  }
});
