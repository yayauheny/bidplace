import { expect, test, type BrowserContext, type Page } from '@playwright/test';

import { createAuctionFixture } from './support/e2e-fixtures';
import { authenticatedPage } from './support/auth-session';
import { ACCOUNT_MENU_HOVER_CLOSE_DELAY_MS } from '../src/components/layout/account-menu-hover';

const hoverCloseWaitMs = ACCOUNT_MENU_HOVER_CLOSE_DELAY_MS + 80;

test.describe('desktop account menu hover', () => {
  test.describe.configure({ mode: 'serial' });

  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    const fixture = await createAuctionFixture();
    const session = await authenticatedPage(browser, fixture.seller);
    context = session.context;
    page = session.page;
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
  });

  test.afterAll(async () => {
    await context?.close();
  });

  test('hover trigger opens the portaled dropdown', async () => {
    const account = page.getByRole('button', {
      name: /Открыть меню аккаунта/,
    });
    const dropdown = page.locator('#account-menu-dropdown');

    await account.hover();
    await expect(dropdown).toBeVisible();
    await expect(page.getByRole('link', { name: 'Кабинет' })).toBeVisible();
  });

  test('keeps the menu open while moving from trigger to dropdown across the gap', async () => {
    const account = page.getByRole('button', {
      name: /Открыть меню аккаунта/,
    });
    const dropdown = page.locator('#account-menu-dropdown');

    await account.hover();
    await expect(dropdown).toBeVisible();

    const triggerBox = await account.boundingBox();
    const dropdownBox = await dropdown.boundingBox();
    expect(triggerBox).not.toBeNull();
    expect(dropdownBox).not.toBeNull();

    await page.mouse.move(
      triggerBox!.x + triggerBox!.width / 2,
      triggerBox!.y + triggerBox!.height / 2,
    );
    await page.mouse.move(
      dropdownBox!.x + dropdownBox!.width / 2,
      dropdownBox!.y + dropdownBox!.height / 2,
      { steps: 8 },
    );

    await expect(dropdown).toBeVisible();
    await expect(page.getByRole('link', { name: 'Кабинет' })).toBeVisible();
  });

  test('keeps the menu open while hovering nested items', async () => {
    const account = page.getByRole('button', {
      name: /Открыть меню аккаунта/,
    });
    const dropdown = page.locator('#account-menu-dropdown');

    await account.hover();
    await expect(dropdown).toBeVisible();

    for (const item of [
      page.getByRole('link', { name: 'Кабинет' }),
      page.getByRole('button', { name: 'Выйти' }),
    ]) {
      await item.hover();
      await page.waitForTimeout(hoverCloseWaitMs);
      await expect(dropdown).toBeVisible();
      await expect(item).toBeVisible();
    }
  });

  test('closes after the cursor leaves trigger and dropdown', async () => {
    const account = page.getByRole('button', {
      name: /Открыть меню аккаунта/,
    });
    const dropdown = page.locator('#account-menu-dropdown');

    await account.hover();
    await expect(dropdown).toBeVisible();

    await page.mouse.move(8, 400);
    await page.waitForTimeout(hoverCloseWaitMs);
    await expect(dropdown).toHaveCount(0);
  });

  test('cancels pending close when the cursor returns during the grace period', async () => {
    const account = page.getByRole('button', {
      name: /Открыть меню аккаунта/,
    });
    const dropdown = page.locator('#account-menu-dropdown');

    await account.hover();
    await expect(dropdown).toBeVisible();

    await page.mouse.move(8, 400);
    await page.waitForTimeout(Math.max(20, ACCOUNT_MENU_HOVER_CLOSE_DELAY_MS - 40));
    await account.hover();
    await page.waitForTimeout(hoverCloseWaitMs);

    await expect(dropdown).toBeVisible();
  });

  test('closes on Escape and click outside', async () => {
    const account = page.getByRole('button', {
      name: /Открыть меню аккаунта/,
    });
    const dropdown = page.locator('#account-menu-dropdown');

    await account.hover();
    await expect(dropdown).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dropdown).toHaveCount(0);

    await page.mouse.move(8, 400);
    await account.hover();
    await expect(dropdown).toBeVisible();
    await page.mouse.click(8, 400);
    await expect(dropdown).toHaveCount(0);
  });
});
