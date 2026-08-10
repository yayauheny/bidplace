import { expect, test } from '@playwright/test';

import {
  createAuctionFixture,
  createSellerFixture,
} from './support/e2e-fixtures';
import { authenticatedPage } from './support/auth-session';

test('desktop header keeps the active works link visible', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');

  const worksLink = page.getByRole('link', { name: 'Работы' });
  await expect(worksLink).toBeVisible();
  await expect(worksLink).toHaveAttribute('href', '/');
  await expect(worksLink).toHaveAttribute('aria-current', 'page');
  await expect(worksLink).not.toHaveAttribute('aria-selected');
  await expect(worksLink).toHaveCSS('min-height', '44px');
  expect(
    consoleErrors.filter((message) => message.includes('accessible')),
  ).toEqual([]);
});

test('guest navigation exposes only public works', async ({ page }) => {
  await page.setViewportSize({ width: 1025, height: 900 });
  await page.goto('/');

  await expect(page.getByRole('link', { name: 'Работы' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Покупки' })).toHaveCount(0);
  await expect(
    page.getByRole('link', { name: 'Выставить работу' }),
  ).toHaveCount(0);
});

test('mobile guest account control stays in the header row', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  const brand = page.getByRole('link', { name: 'bidplace — на главную' });
  const account = page.getByRole('link', { name: 'Войти' });
  const works = page.getByRole('link', { name: 'Работы' });
  const [brandBox, accountBox, worksBox] = await Promise.all([
    brand.boundingBox(),
    account.boundingBox(),
    works.boundingBox(),
  ]);

  expect(brandBox).not.toBeNull();
  expect(accountBox).not.toBeNull();
  expect(worksBox).not.toBeNull();
  expect(Math.abs((brandBox?.y ?? 0) - (accountBox?.y ?? 0))).toBeLessThan(20);
  expect(worksBox?.y ?? 0).toBeGreaterThan((accountBox?.y ?? 0) + 32);
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
    await expect(page.getByRole('link', { name: 'Кабинет' })).toHaveCount(0);
    await expect(
      page.getByRole('link', { name: 'Выставить работу' }),
    ).toHaveCount(0);
  } finally {
    await context.close();
  }
});

test('approved seller navigation exposes the cabinet and create action', async ({
  browser,
}) => {
  const fixture = await createAuctionFixture();
  const { context, page } = await authenticatedPage(browser, fixture.seller);

  try {
    await page.setViewportSize({ width: 1025, height: 900 });
    await page.goto(`/product/${fixture.product.publicId}`);
    await expect(page.getByRole('link', { name: 'Работы' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(page.getByRole('link', { name: 'Кабинет' })).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Выставить работу' }),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: 'Работы' })).toHaveAttribute(
      'aria-current',
      'page',
    );

    for (const label of ['Работы', 'Покупки']) {
      const link = page.getByRole('link', { name: label });
      await link.focus();
      await expect(link).toBeFocused();
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
    await expect(account).toBeFocused();
    await expect(page.getByRole('button', { name: 'Выйти' })).toHaveCount(0);
    await account.click();
    await expect(page.getByRole('button', { name: 'Выйти' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(account).toBeFocused();
    await account.click();
    await expect(page.getByRole('button', { name: 'Выйти' })).toBeVisible();
    await page.getByRole('button', { name: 'Выйти' }).click();
    await expect(page.getByRole('link', { name: 'Войти' })).toBeVisible();
  } finally {
    await context.close();
  }
});

test('approved seller mobile navigation uses equal cells without horizontal overflow', async ({
  browser,
}) => {
  const fixture = await createAuctionFixture();
  const { context, page } = await authenticatedPage(browser, fixture.seller);

  try {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    const navigation = page.getByLabel('Основная навигация');
    await expect(navigation).toBeVisible();
    await expect(page.getByRole('link', { name: 'Кабинет' })).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Выставить работу' }),
    ).toBeVisible();

    const metrics = await page.evaluate(() => ({
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
    }));
    expect(metrics.documentWidth).toBeLessThanOrEqual(metrics.viewportWidth);

    const links = navigation.getByRole('link');
    const boxes = await Promise.all(
      (await links.all()).map((link) => link.boundingBox()),
    );
    const visibleNavBoxes = boxes.filter(
      (box): box is NonNullable<typeof box> => box !== null,
    );
    expect(visibleNavBoxes.length).toBe(3);
    expect(
      visibleNavBoxes.every((box) => box.x >= 0 && box.x + box.width <= 390),
    ).toBe(true);
  } finally {
    await context.close();
  }
});

test('mobile account menu uses the shared overlay layer and viewport inset', async ({
  browser,
}) => {
  const fixture = await createAuctionFixture();
  const { context, page } = await authenticatedPage(browser, fixture.buyerA);

  try {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    const account = page.getByRole('button', { name: /Открыть меню аккаунта/ });
    await account.click();

    const menu = page
      .locator('#app-overlay-host')
      .locator('#account-menu-dropdown');
    await expect(menu).toBeVisible();
    await expect(menu).toHaveCSS('z-index', '20');
    const menuBox = await menu.boundingBox();
    expect(menuBox).not.toBeNull();
    expect(menuBox!.x).toBeGreaterThanOrEqual(8);
    expect(menuBox!.x + menuBox!.width).toBeLessThanOrEqual(382);

    await page.getByRole('link', { name: 'Работы' }).click();
    await expect(page.getByRole('link', { name: 'Работы' })).toBeFocused();
    await expect(menu).toHaveCount(0);
  } finally {
    await context.close();
  }
});

test('product author link opens the public seller profile', async ({
  browser,
}) => {
  const fixture = await createAuctionFixture();
  const { context, page } = await authenticatedPage(browser, fixture.buyerA);

  try {
    const detailResponse = await context.request.get(
      `http://localhost:3001/api/products/${fixture.product.publicId}`,
    );
    const detail = await detailResponse.json();
    const seller = detail.sellerProfile as { slug: string; fullName: string };
    await page.goto(`/product/${fixture.product.publicId}`);
    await page
      .getByRole('link', {
        name: new RegExp(`Открыть профиль автора ${seller.fullName}`),
      })
      .click();
    await expect(page).toHaveURL(new RegExp(`/seller/${seller.slug}$`));
    await expect(
      page.getByRole('heading', { name: seller.fullName }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: new RegExp(fixture.product.title) }),
    ).toBeVisible();
  } finally {
    await context.close();
  }
});
