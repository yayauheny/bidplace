import { expect, test } from '@playwright/test';

import { authenticatedPage } from './support/auth-session';
import {
  createAdminModerationFixture,
  createBuyerFixture,
  createSellerFixture,
} from './support/e2e-fixtures';

test('guest does not see logout', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Выйти' })).toHaveCount(0);
});

test('approved author logout leaves the cabinet and a later visit requires auth', async ({
  browser,
}) => {
  const { seller } = await createSellerFixture({ status: 'APPROVED' });
  const { context, page } = await authenticatedPage(browser, seller);

  try {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.goto('/cabinet');
    await expect(page.getByRole('button', { name: 'Выйти' })).toBeVisible();
    await page.getByRole('button', { name: 'Выйти' }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByText('Кабинет автора')).toHaveCount(0);
    await page.goBack();
    await expect(page.getByText('Кабинет автора')).toHaveCount(0);
    await page.goto('/cabinet');
    await expect(page).toHaveURL(/\/login/);
  } finally {
    await context.close();
  }
});

test('author without a profile can logout from the intro', async ({ browser }) => {
  const { buyer } = await createBuyerFixture();
  const { context, page } = await authenticatedPage(browser, buyer);

  try {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/profile?intro=1');
    await page.getByRole('button', { name: 'Выйти' }).click();
    await expect(page).toHaveURL(/\/$/);
    await page.goto('/profile');
    await expect(page).toHaveURL(/\/login/);
  } finally {
    await context.close();
  }
});

test('admin can logout from moderation', async ({ browser }) => {
  const { admin } = await createAdminModerationFixture();
  const { context, page } = await authenticatedPage(browser, admin);

  try {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/admin');
    await page.getByRole('button', { name: 'Выйти' }).click();
    await expect(page).toHaveURL(/\/$/);
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/login/);
  } finally {
    await context.close();
  }
});
