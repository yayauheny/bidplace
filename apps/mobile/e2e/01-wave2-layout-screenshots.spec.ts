import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

import { expect, test } from '@playwright/test';

import { authenticatedPage } from './support/auth-session';
import { createAdminModerationFixture } from './support/e2e-fixtures';
import { getCatalogColumnCount } from '../src/features/products/catalog-layout';

const screenshotDir = resolve('/private/tmp', 'bidplace-wave2-screenshots');
const seededProducts = [
  { publicId: 'seedSched01', title: 'Кашпо «Тёплый ритм»' },
  { publicId: 'seedLive002', title: 'Стакан для кистей «Голубая комета»' },
  { publicId: 'seedEnded03', title: 'Чашка «Ты мне»' },
] as const;

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
      if (width === 390) {
        const mobileNavigation = page.getByRole('tablist');
        const firstCard = page.locator('a[href^="/product/"]').first();
        const navigationBox = await mobileNavigation.boundingBox();
        const firstCardBox = await firstCard.boundingBox();
        expect(navigationBox).not.toBeNull();
        expect(firstCardBox).not.toBeNull();
        expect(
          firstCardBox!.y - (navigationBox!.y + navigationBox!.height),
        ).toBeLessThan(56);
      }
      const catalogCards = page.locator('a[href^="/product/"]');
      await expect(catalogCards).toHaveCount(seededProducts.length);
      const expectedColumns = getCatalogColumnCount(width);
      const cardBoxes = await Promise.all(
        seededProducts.map((product) =>
          page.locator(`a[href="/product/${product.publicId}"]`).boundingBox(),
        ),
      );
      const orderedCardBoxes = cardBoxes
        .filter((box): box is NonNullable<typeof box> => box !== null)
        .sort((left, right) => left.y - right.y || left.x - right.x);
      const firstRowBoxes = orderedCardBoxes.slice(0, expectedColumns);
      expect(firstRowBoxes).toHaveLength(
        Math.min(expectedColumns, seededProducts.length),
      );
      expect(
        firstRowBoxes.every(
          (box) => Math.abs((box?.y ?? 0) - (firstRowBoxes[0]?.y ?? 0)) < 1,
        ),
      ).toBe(true);
      if (expectedColumns < seededProducts.length) {
        expect(orderedCardBoxes[expectedColumns]?.y).toBeGreaterThan(
          orderedCardBoxes[0]?.y ?? 0,
        );
      }
      for (const product of seededProducts) {
        const card = page.locator(`a[href="/product/${product.publicId}"]`);
        await expect(card).toHaveCount(1);
        await expect(
          card.getByText(product.title, { exact: true }),
        ).toBeVisible();
        const image = card.locator(
          `img[alt="Изображение предмета: ${product.title}"]`,
        );
        await expect(image).toBeVisible();
        await expect
          .poll(() =>
            image.evaluate(
              (element) => (element as HTMLImageElement).naturalWidth,
            ),
          )
          .toBeGreaterThan(0);
      }
      await page.screenshot({
        path: resolve(screenshotDir, `catalog-${width}.png`),
        fullPage: true,
      });

      await page.goto('/');
      const account = page.getByRole('button', {
        name: /Открыть меню аккаунта/,
      });
      if (width >= 1025) {
        await account.hover();
      } else {
        await account.click();
      }
      await expect(page.locator('#account-menu-dropdown')).toBeVisible();
      await page.screenshot({
        path: resolve(screenshotDir, `account-menu-${width}.png`),
        fullPage: true,
      });
      await page.keyboard.press('Escape');

      await page.route(
        '**/api/products*',
        async (route) => {
          const response = await route.fetch();
          await new Promise((resolveDelay) => setTimeout(resolveDelay, 500));
          await route.fulfill({ response });
        },
        { times: 1 },
      );
      await page.goto('/');
      await expect(page.getByRole('progressbar').first()).toBeVisible();
      await page.screenshot({
        path: resolve(screenshotDir, `catalog-loading-${width}.png`),
        fullPage: true,
      });
      await expect(catalogCards).toHaveCount(seededProducts.length);
      await page.unroute('**/api/products*');

      const failedPage = await context.newPage();
      await failedPage.setViewportSize({
        width,
        height: width === 390 ? 844 : 900,
      });
      await failedPage.route('**/*', async (route) => {
        if (route.request().resourceType() === 'image') {
          await route.abort();
          return;
        }
        await route.continue();
      });
      await failedPage.goto('/');
      await expect(
        failedPage.getByLabel(/Изображение недоступно|Нет изображения/).first(),
      ).toBeVisible();
      await failedPage.screenshot({
        path: resolve(screenshotDir, `catalog-failed-image-${width}.png`),
        fullPage: true,
      });
      await failedPage.close();

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
      await expect(page.locator('#app-dialog-content')).toHaveCSS(
        'z-index',
        '30',
      );
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
