import { expect, test } from '@playwright/test';

import {
  createAuctionFixture,
  createSellerFixture,
} from './support/e2e-fixtures';
import { authenticatedPage } from './support/auth-session';

test('desktop rail keeps the active catalog link visible', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');

  const catalogLink = page.getByRole('link', { name: 'Каталог' });
  await expect(catalogLink).toBeVisible();
  await expect(catalogLink).toHaveAttribute('href', '/');
  await expect(catalogLink).toHaveCSS('min-height', '44px');
  expect(
    consoleErrors.filter((message) => message.includes('accessible')),
  ).toEqual([]);
});

test('guest navigation exposes only the public catalog', async ({ page }) => {
  await page.setViewportSize({ width: 1025, height: 900 });
  await page.goto('/');

  await expect(page.getByRole('link', { name: 'Каталог' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Покупки' })).toHaveCount(0);
  await expect(
    page.getByRole('link', { name: 'Добавить предмет' }),
  ).toHaveCount(0);
});

test('mobile guest account control stays in the header row', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  const brand = page.getByRole('link', { name: 'bidplace — на главную' });
  const account = page.getByRole('link', { name: 'Войти' });
  const catalog = page.getByRole('link', { name: 'Каталог' });
  const [brandBox, accountBox, catalogBox] = await Promise.all([
    brand.boundingBox(),
    account.boundingBox(),
    catalog.boundingBox(),
  ]);

  expect(brandBox).not.toBeNull();
  expect(accountBox).not.toBeNull();
  expect(catalogBox).not.toBeNull();
  expect(Math.abs((brandBox?.y ?? 0) - (accountBox?.y ?? 0))).toBeLessThan(20);
  expect(catalogBox?.y ?? 0).toBeGreaterThan((accountBox?.y ?? 0) + 32);
});

test('pending seller navigation does not expose approved seller actions', async ({
  browser,
}) => {
  const { seller } = await createSellerFixture({ status: 'PENDING_REVIEW' });
  const { context, page } = await authenticatedPage(browser, seller);

  try {
    await page.setViewportSize({ width: 1025, height: 900 });
    await page.goto('/');
    await expect(
      page.getByRole('link', { name: 'Заявка продавца' }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Кабинет продавца' }),
    ).toHaveCount(0);
    await expect(
      page.getByRole('link', { name: 'Добавить предмет' }),
    ).toHaveCount(0);
  } finally {
    await context.close();
  }
});

test('approved seller navigation exposes the seller cabinet and add product', async ({
  browser,
}) => {
  const fixture = await createAuctionFixture();
  const { context, page } = await authenticatedPage(browser, fixture.seller);

  try {
    await page.setViewportSize({ width: 1025, height: 900 });
    await page.goto(`/product/${fixture.product.publicId}`);
    await expect(
      page.getByRole('link', { name: 'Кабинет продавца' }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Добавить предмет' }),
    ).toBeVisible();

    for (const label of ['Каталог', 'Покупки']) {
      await page.getByRole('link', { name: label }).hover();
      await expect(
        page.locator('#app-overlay-host').locator('#navigation-tooltip'),
      ).toHaveCount(1);
      await expect(page.locator('#navigation-tooltip')).toHaveText(label);
      await expect(page.locator('#navigation-tooltip')).toBeVisible();
    }

    const account = page.getByRole('button', { name: /Открыть меню аккаунта/ });
    await account.hover();
    await expect(
      page.locator('#app-overlay-host').locator('#account-menu-dropdown'),
    ).toHaveCount(1);
    await expect(page.getByRole('button', { name: 'Выйти' })).toBeVisible();
    const accountMenu = page.locator('#account-menu-dropdown');
    await expect(accountMenu).toBeVisible();
    await expect(accountMenu).toHaveCSS('z-index', '20');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: 'Выйти' })).toHaveCount(0);
    await account.focus();
    await expect(page.getByRole('button', { name: 'Выйти' })).toBeVisible();
    await page.keyboard.press('Escape');
    await account.click();
    await expect(page.getByRole('button', { name: 'Выйти' })).toBeVisible();
    await page.getByRole('button', { name: 'Выйти' }).click();
    await expect(page.getByRole('link', { name: 'Войти' })).toBeVisible();
  } finally {
    await context.close();
  }
});

test('product author link opens the public seller profile', async ({ browser }) => {
  const fixture = await createAuctionFixture();
  const { context, page } = await authenticatedPage(browser, fixture.buyerA);

  try {
    const detailResponse = await context.request.get(
      `http://localhost:3001/api/products/${fixture.product.publicId}`,
    );
    const detail = await detailResponse.json();
    const seller = detail.sellerProfile as { slug: string; fullName: string };
    await page.goto(`/product/${fixture.product.publicId}`);
    await page.getByRole('link', { name: new RegExp(`Открыть профиль автора ${seller.fullName}`) }).click();
    await expect(page).toHaveURL(new RegExp(`/seller/${seller.slug}$`));
    await expect(page.getByRole('heading', { name: seller.fullName })).toBeVisible();
    await expect(page.getByText(fixture.product.title)).toBeVisible();
  } finally {
    await context.close();
  }
});
