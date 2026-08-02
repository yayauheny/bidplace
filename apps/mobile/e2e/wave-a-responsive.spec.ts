import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

import { expect, test } from '@playwright/test';

import { authenticatedPage } from './support/auth-session';
import {
  createAdminModerationFixture,
  createAuctionFixture,
} from './support/e2e-fixtures';

const screenshotDir = resolve('/private/tmp', 'bidplace-wave-a-screenshots');

test('product detail changes structure at the 900px breakpoint', async ({
  browser,
}) => {
  const fixture = await createAuctionFixture();
  const { context, page } = await authenticatedPage(browser, fixture.buyerA);

  try {
    for (const width of [899, 900, 1024, 1025]) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto(`/product/${fixture.product.publicId}`);

      const image = page.locator(
        `img[alt="Изображение предмета: ${fixture.product.title}"]`,
      );
      await expect(image).toBeVisible();
      const imageBox = await image.first().boundingBox();
      expect(imageBox).not.toBeNull();
      expect(imageBox!.width).toBe(width >= 900 ? 440 : 300);
      expect(imageBox!.height).toBe(width >= 900 ? 550 : 375);

      await expect(page.getByText('Торги идут').first()).toBeVisible();
      await expect(page.getByLabel('Ваша ставка, BYN')).toBeVisible();

      const dock = page.getByTestId('mobile-bottom-action-bar');
      if (width < 900) {
        await expect(dock).toBeVisible();
        await expect(
          dock.getByRole('button', { name: 'Сделать ставку' }),
        ).toBeVisible();
      } else {
        await expect(dock).toHaveCount(0);
        const amount = await page.getByLabel('Ваша ставка, BYN').boundingBox();
        expect(amount).not.toBeNull();
        expect(amount!.x).toBeGreaterThan(imageBox!.x + imageBox!.width - 10);
      }

      if (width === 1024) {
        await mkdir(screenshotDir, { recursive: true });
        await page.screenshot({
          path: resolve(screenshotDir, 'product-buyer-1024.png'),
          fullPage: true,
        });
      }
    }
  } finally {
    await context.close();
  }
});

test('admin product detail preserves the no-bidding state at product-wide widths', async ({
  browser,
}) => {
  const auction = await createAuctionFixture();
  const adminFixture = await createAdminModerationFixture();
  const { context, page } = await authenticatedPage(
    browser,
    adminFixture.admin,
  );

  try {
    await page.setViewportSize({ width: 1024, height: 844 });
    await page.goto(`/product/${auction.product.publicId}`);

    await expect(
      page.getByText('Администратор не участвует в торгах.'),
    ).toBeVisible();
    await expect(page.getByLabel('Ваша ставка, BYN')).toHaveCount(0);
    await expect(page.getByTestId('mobile-bottom-action-bar')).toHaveCount(0);
    await mkdir(screenshotDir, { recursive: true });
    await page.screenshot({
      path: resolve(screenshotDir, 'product-admin-1024.png'),
      fullPage: true,
    });
  } finally {
    await context.close();
  }
});

test('auth forms stay scrollable at narrow viewport and enlarged scale', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/register');

  await expect(page.getByText('Регистрация', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Пароль')).toBeVisible();
  const initialMetrics = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
  }));
  expect(initialMetrics.documentWidth).toBeLessThanOrEqual(
    initialMetrics.viewportWidth,
  );
  await page.getByLabel('Пароль').focus();
  await page.evaluate(() => {
    document.body.style.zoom = '2';
  });
  await page.setViewportSize({ width: 390, height: 360 });
  await page.getByLabel('Пароль').scrollIntoViewIfNeeded();
  await expect(
    page.getByRole('button', { name: 'Создать аккаунт' }),
  ).toBeVisible();
});
