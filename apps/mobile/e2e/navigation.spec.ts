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

  const homeLink = page.getByRole('link', { name: 'bidplace — на главную' });
  await expect(homeLink).toBeVisible();
  await expect(homeLink).toHaveAttribute('href', '/');
  await expect(homeLink).not.toHaveAttribute('aria-selected');
  await expect(homeLink).toHaveCSS('min-height', '44px');
  await page.getByRole('button', { name: 'Работы' }).click();
  const discoveryMenu = page.locator('#discovery-menu-dropdown');
  await expect(
    discoveryMenu.getByRole('link', { name: 'Работы' }),
  ).toBeVisible();
  await expect(
    discoveryMenu.getByRole('link', { name: 'Авторы' }),
  ).toBeVisible();
  expect(
    consoleErrors.filter((message) => message.includes('accessible')),
  ).toEqual([]);
});

test('guest navigation exposes public discovery without seller actions', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1025, height: 900 });
  await page.goto('/');

  await expect(
    page.getByRole('link', { name: 'bidplace — на главную' }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Работы' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Покупки' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Добавить работу' })).toHaveCount(
    0,
  );
});

test('mobile guest header keeps canonical actions in one row', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  const brand = page.getByRole('link', { name: 'bidplace — на главную' });
  const search = page.getByRole('button', { name: 'Поиск' });
  const create = page.getByRole('button', { name: 'Создать' });
  const menuTrigger = page.getByRole('button', { name: 'Меню' });
  const [brandBox, searchBox, createBox, menuBox] = await Promise.all([
    brand.boundingBox(),
    search.boundingBox(),
    create.boundingBox(),
    menuTrigger.boundingBox(),
  ]);

  expect(brandBox).not.toBeNull();
  expect(searchBox).not.toBeNull();
  expect(createBox).not.toBeNull();
  expect(menuBox).not.toBeNull();
  expect(Math.abs((brandBox?.y ?? 0) - (menuBox?.y ?? 0))).toBeLessThan(20);
  expect(Math.abs((searchBox?.y ?? 0) - (createBox?.y ?? 0))).toBeLessThan(4);
  expect(searchBox?.height).toBe(44);
  expect(createBox?.height).toBe(44);
  expect(menuBox?.height).toBe(44);
});

test('mobile guest menu and search use canonical open states', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto('/');

  await page.getByRole('button', { name: 'Меню' }).click();
  const menu = page.locator('#mobile-menu-panel');
  await expect(menu).toBeVisible();
  const menuBox = await menu.boundingBox();
  expect(menuBox).not.toBeNull();
  expect(menuBox!.width).toBe(288);
  expect(menuBox!.x).toBeGreaterThanOrEqual(16);
  expect(menuBox!.x + menuBox!.width).toBeLessThanOrEqual(304);
  await expect(menu.getByRole('link', { name: 'Работы' })).toBeVisible();
  await expect(menu.getByRole('link', { name: 'Авторы' })).toBeVisible();
  await expect(menu.getByRole('link', { name: 'Войти' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(menu).toHaveCount(0);

  await page.getByRole('button', { name: 'Поиск' }).click();
  const searchInput = page.getByRole('textbox', {
    name: 'Найти предмет или автора',
  });
  await expect(searchInput).toBeFocused();
  await searchInput.fill('стекло');
  await searchInput.press('Enter');
  await expect(page).toHaveURL(
    /\/search\?q=%D1%81%D1%82%D0%B5%D0%BA%D0%BB%D0%BE$/,
  );
});

test('pending seller navigation does not expose approved seller actions', async ({
  browser,
}) => {
  const { seller } = await createSellerFixture({ status: 'PENDING_REVIEW' });
  const { context, page } = await authenticatedPage(browser, seller);

  try {
    await page.setViewportSize({ width: 1025, height: 900 });
    await page.goto('/');
    await page.getByRole('button', { name: /Открыть меню аккаунта/ }).click();
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
    await page.getByRole('button', { name: 'Работы' }).click();
    await expect(page.getByRole('link', { name: 'Работы' })).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Добавить работу' }),
    ).toBeVisible();

    const discoveryMenu = page.locator('#discovery-menu-dropdown');
    for (const label of ['Работы', 'Авторы']) {
      const link = discoveryMenu.getByRole('link', { name: label });
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
    await expect(page.getByRole('button', { name: 'Выйти' })).toHaveCount(0);
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

    await expect(page.getByRole('button', { name: 'Поиск' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Создать' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Меню' })).toBeVisible();

    const metrics = await page.evaluate(() => ({
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
    }));
    expect(metrics.documentWidth).toBeLessThanOrEqual(metrics.viewportWidth);

    const navigationItems = [
      page.getByRole('button', { name: 'Поиск' }),
      page.getByRole('button', { name: 'Создать' }),
      page.getByRole('button', { name: 'Меню' }),
    ];
    const boxes = await Promise.all(
      navigationItems.map((item) => item.boundingBox()),
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

test('mobile menu uses the shared overlay layer and viewport inset', async ({
  browser,
}) => {
  const fixture = await createAuctionFixture();
  const { context, page } = await authenticatedPage(browser, fixture.buyerA);

  try {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    await page.getByRole('button', { name: 'Меню' }).click();

    const menu = page
      .locator('#app-overlay-host')
      .locator('#mobile-menu-panel');
    await expect(menu).toBeVisible();
    await expect(page.locator('#app-overlay-host')).toHaveCSS('z-index', '20');
    const menuBox = await menu.boundingBox();
    expect(menuBox).not.toBeNull();
    expect(menuBox!.x).toBeGreaterThanOrEqual(8);
    expect(menuBox!.x + menuBox!.width).toBeLessThanOrEqual(382);

    await menu.getByRole('link', { name: 'Работы' }).click();
    await expect(page).toHaveURL(/\/works$/);
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
      `${e2eApiBaseURL}/api/works/${fixture.product.publicId}`,
    );
    const detail = await detailResponse.json();
    const seller = detail.author as { slug: string; fullName: string };
    await page.goto(`/product/${fixture.product.publicId}`);
    await page
      .getByRole('link', {
        name: new RegExp(`Открыть профиль автора ${seller.fullName}`),
      })
      .click();
    await expect(page).toHaveURL(new RegExp(`/seller/${seller.slug}$`));
    await expect(
      page.getByText(seller.fullName, { exact: true }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: new RegExp(fixture.product.title) }),
    ).toBeVisible();
  } finally {
    await context.close();
  }
});
