import { expect, test } from '@playwright/test';

import {
  createAuctionFixture,
  createSellerFixture,
} from './support/e2e-fixtures';
import { authenticatedPage } from './support/auth-session';
import { e2eApiBaseURL } from './support/e2e-env';

test('desktop header keeps the active home link and discovery menu visible', async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');

  const homeLink = page.getByRole('link', { name: 'Главная' });
  await expect(homeLink).toBeVisible();
  await expect(homeLink).toHaveAttribute('href', '/');
  await expect(homeLink).toHaveAttribute('aria-current', 'page');
  await expect(homeLink).not.toHaveAttribute('aria-selected');
  await expect(homeLink).toHaveCSS('min-height', '44px');
  await page.getByRole('button', { name: 'Обзор' }).click();
  await expect(page.getByRole('link', { name: 'Работы' })).toBeVisible();
  expect(
    consoleErrors.filter((message) => message.includes('accessible')),
  ).toEqual([]);
});

test('guest navigation exposes public discovery without seller actions', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1025, height: 900 });
  await page.goto('/');

  await expect(page.getByRole('link', { name: 'Главная' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Обзор' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Покупки' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Добавить работу' })).toHaveCount(
    0,
  );
});

test('mobile guest account control stays in the header row', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  const brand = page.getByRole('link', { name: 'bidplace — на главную' });
  const account = page.getByRole('link', { name: 'Войти' });
  const overview = page.getByRole('button', { name: 'Обзор' });
  const [brandBox, accountBox, overviewBox] = await Promise.all([
    brand.boundingBox(),
    account.boundingBox(),
    overview.boundingBox(),
  ]);

  expect(brandBox).not.toBeNull();
  expect(accountBox).not.toBeNull();
  expect(overviewBox).not.toBeNull();
  expect(Math.abs((brandBox?.y ?? 0) - (accountBox?.y ?? 0))).toBeLessThan(20);
  expect(overviewBox?.y ?? 0).toBeGreaterThan((accountBox?.y ?? 0) + 32);
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
      page.getByRole('link', { name: 'Добавить работу' }),
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
    await page.getByRole('button', { name: 'Обзор' }).click();
    await expect(page.getByRole('link', { name: 'Работы' })).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Добавить работу' }),
    ).toBeVisible();

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
    await expect(page.getByRole('link', { name: 'Кабинет' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(account).toBeFocused();
    await expect(page.getByRole('button', { name: 'Выйти' })).toHaveCount(0);
    await account.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('link', { name: 'Кабинет' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Выйти' })).toBeFocused();
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
    await expect(
      page.getByRole('link', { name: 'Добавить работу' }),
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
    expect(visibleNavBoxes.length).toBe(2);
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

    await page.getByRole('button', { name: 'Обзор' }).click();
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
      `${e2eApiBaseURL}/api/products/${fixture.product.publicId}`,
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
