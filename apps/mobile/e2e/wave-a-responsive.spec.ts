import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

import { expect, test } from '@playwright/test';

import { designTokens } from '@bidplace/design-tokens';

import { authenticatedPage } from './support/auth-session';
import {
  createAdminModerationFixture,
  createAuctionFixture,
} from './support/e2e-fixtures';

const screenshotDir = resolve('/private/tmp', 'bidplace-wave-a-screenshots');

test('product detail changes structure at the product action breakpoints', async ({
  browser,
}) => {
  const fixture = await createAuctionFixture();
  const { context, page } = await authenticatedPage(browser, fixture.buyerA);

  try {
    for (const width of [899, 900, 1024, 1025, 1440, 390]) {
      const height = width === 390 ? 844 : 900;
      await page.setViewportSize({ width, height });
      await page.goto(`/product/${fixture.product.publicId}`);

      const image = page.locator(
        `img[alt="Изображение предмета: ${fixture.product.title}"]`,
      );
      await expect(image).toBeVisible();
      const imageBox = await image.first().boundingBox();
      expect(imageBox).not.toBeNull();
      const expectedImageWidth =
        width >= designTokens.breakpoint.productHeroThreeColumn
          ? 520
          : width >= designTokens.breakpoint.productDetailWide
            ? 440
            : 300;
      expect(imageBox!.width).toBe(expectedImageWidth);
      expect(imageBox!.height).toBe(expectedImageWidth * 1.25);

      const title = page
        .getByText(fixture.product.title, { exact: true })
        .first();
      const status = page.getByLabel(/Торги\. Торги идут\./).first();
      const currentPriceLabel = page
        .getByText('Ставка', { exact: true })
        .first();
      const currentPrice = page.getByText('10,00 BYN', { exact: true }).first();
      await expect(title).toBeVisible();
      await expect(status).toBeVisible();
      await expect(currentPriceLabel).toBeVisible();
      await expect(currentPrice).toBeVisible();

      const assertInViewport = async (locator: typeof title) => {
        const box = await locator.boundingBox();
        expect(box).not.toBeNull();
        expect(box!.y).toBeGreaterThanOrEqual(0);
        expect(box!.y + box!.height).toBeLessThanOrEqual(height);
      };

      if (width === 390) {
        await assertInViewport(title);
        const viewportMetrics = await page.evaluate(() => ({
          documentWidth: document.documentElement.scrollWidth,
          viewportWidth: window.innerWidth,
        }));
        expect(viewportMetrics.documentWidth).toBeLessThanOrEqual(
          viewportMetrics.viewportWidth,
        );
      }

      const dock = page.getByTestId('mobile-bottom-action-bar');
      if (width < 900) {
        await expect(dock).toBeVisible();
        await expect(
          dock.getByRole('button', { name: 'Сделать ставку' }),
        ).toBeVisible();
        const dockBox = await dock.boundingBox();
        expect(dockBox).not.toBeNull();
        expect(dockBox!.height).toBeGreaterThanOrEqual(44);
        expect(dockBox!.height).toBeLessThanOrEqual(64);
      } else {
        await expect(dock).toHaveCount(0);
        await expect(page.getByLabel('Ваша ставка, BYN')).toBeVisible();
        const amount = await page.getByLabel('Ваша ставка, BYN').boundingBox();
        expect(amount).not.toBeNull();
        expect(amount!.x).toBeLessThan(imageBox!.x + imageBox!.width);
        expect(amount!.x + amount!.width).toBeGreaterThan(imageBox!.x);

        for (const locator of [
          title,
          status,
          currentPriceLabel,
          currentPrice,
          page.getByPlaceholder(/от 10/).first(),
          page.getByText('До завершения', { exact: true }).first(),
          page.getByRole('button', { name: 'Поставить' }),
        ]) {
          if (width >= designTokens.breakpoint.productHeroThreeColumn) {
            await expect(locator).toBeVisible();
          } else {
            await expect(locator).toBeVisible();
          }
        }
      }

      if ([1440, 1024, 390].includes(width)) {
        await mkdir(screenshotDir, { recursive: true });
        await page.screenshot({
          path: resolve(screenshotDir, `product-buyer-${width}.png`),
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
    for (const width of [1440, 1024, 390]) {
      const height = width === 390 ? 844 : 900;
      await page.setViewportSize({ width, height });
      await page.goto(`/product/${auction.product.publicId}`);

      const title = page
        .getByText(auction.product.title, { exact: true })
        .first();
      const status = page.getByLabel(/Торги\. Торги идут\./).first();
      const currentPriceLabel = page
        .getByText('Ставка', { exact: true })
        .first();
      const currentPrice = page.getByText('10,00 BYN', { exact: true }).first();
      await expect(title).toBeVisible();
      await expect(status).toBeVisible();
      await expect(currentPriceLabel).toBeVisible();
      await expect(currentPrice).toBeVisible();
      await expect(page.getByLabel('Ваша ставка, BYN')).toHaveCount(0);
      await expect(
        page.getByRole('button', { name: 'Сделать ставку' }),
      ).toHaveCount(0);
      await expect(page.getByTestId('mobile-bottom-action-bar')).toHaveCount(0);
      const viewportMetrics = await page.evaluate(() => ({
        documentWidth: document.documentElement.scrollWidth,
        viewportWidth: window.innerWidth,
      }));
      expect(viewportMetrics.documentWidth).toBeLessThanOrEqual(
        viewportMetrics.viewportWidth,
      );
      await mkdir(screenshotDir, { recursive: true });
      await page.screenshot({
        path: resolve(screenshotDir, `product-admin-${width}.png`),
      });
    }
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
  await page.getByRole('button', { name: 'Создать аккаунт' }).click();
  await expect(page.getByText('Введите имя', { exact: true })).toBeVisible();
  await expect(
    page.getByText('Введите корректный email', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText('Пароль должен содержать не менее 8 символов', {
      exact: true,
    }),
  ).toBeVisible();
  await page.getByLabel('Пароль').focus();
  await page.evaluate(() => {
    document.body.style.zoom = '2';
  });
  await page.setViewportSize({ width: 390, height: 360 });
  await page.getByLabel('Пароль').scrollIntoViewIfNeeded();
  await expect(
    page.getByRole('button', { name: 'Создать аккаунт' }),
  ).toBeVisible();
  await expect(
    page.getByText('Пароль должен содержать не менее 8 символов', {
      exact: true,
    }),
  ).toBeVisible();
  await mkdir(screenshotDir, { recursive: true });
  await page.screenshot({
    path: resolve(screenshotDir, 'auth-register-390-200.png'),
    fullPage: true,
  });
});
