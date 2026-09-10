import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

import { expect, test } from '@playwright/test';

import { PAYMENT_DELIVERY_STUB } from '../src/features/products/payment-delivery-stub';
import { authenticatedPage } from './support/auth-session';
import {
  createAdminModerationFixture,
  createAuctionFixture,
} from './support/e2e-fixtures';

const screenshotDir = resolve('/private/tmp', 'bidplace-wave-a-screenshots');

async function assertNoHorizontalOverflow(page: {
  evaluate: (fn: () => { documentWidth: number; viewportWidth: number }) => Promise<{
    documentWidth: number;
    viewportWidth: number;
  }>;
}) {
  const viewportMetrics = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
  }));
  expect(viewportMetrics.documentWidth).toBeLessThanOrEqual(
    viewportMetrics.viewportWidth,
  );
}

test('product detail stays portfolio-only across product action widths', async ({
  browser,
}) => {
  const fixture = await createAuctionFixture();
  const { context, page } = await authenticatedPage(browser, fixture.buyerA);

  try {
    for (const width of [1440, 1024, 390]) {
      const height = width === 390 ? 844 : 900;
      await page.setViewportSize({ width, height });
      await page.goto(`/product/${fixture.product.publicId}`);

      const image = page.locator(`img[alt="${fixture.product.title}"]`);
      await expect(image).toBeVisible();
      await expect(
        page.getByText(fixture.product.title, { exact: true }).first(),
      ).toBeVisible();
      await expect(page.getByText(PAYMENT_DELIVERY_STUB)).toBeVisible();
      await expect(page.getByText('Ставка', { exact: true })).toHaveCount(0);
      await expect(page.getByText(/BYN/)).toHaveCount(0);
      await expect(
        page.getByRole('button', { name: 'Сделать ставку' }),
      ).toHaveCount(0);
      await expect(page.getByTestId('product-sticky-auction-player')).toHaveCount(
        0,
      );
      await expect(page.getByTestId('mobile-bottom-action-bar')).toHaveCount(0);
      await assertNoHorizontalOverflow(page);

      await mkdir(screenshotDir, { recursive: true });
      await page.screenshot({
        path: resolve(screenshotDir, `product-buyer-${width}.png`),
      });
    }
  } finally {
    await context.close();
  }
});

test('admin product detail has no bidding chrome', async ({ browser }) => {
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

      await expect(
        page.getByText(auction.product.title, { exact: true }).first(),
      ).toBeVisible();
      await expect(page.getByLabel('Ваша ставка, BYN')).toHaveCount(0);
      await expect(
        page.getByRole('button', { name: 'Сделать ставку' }),
      ).toHaveCount(0);
      await expect(page.getByTestId('mobile-bottom-action-bar')).toHaveCount(0);
      await assertNoHorizontalOverflow(page);
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
  await assertNoHorizontalOverflow(page);
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
