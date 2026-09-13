import { expect, test } from '@playwright/test';

import { authenticatedPage } from './support/auth-session';
import {
  createAdminModerationFixture,
  createSellerFixture,
} from './support/e2e-fixtures';

const dockLabels = ['Главная', 'Поиск', 'Добавить', 'Профиль'] as const;

test('guest 390 dock is one four-item capsule without auction chrome', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  const dock = page.getByTestId('figma-floating-dock');
  await expect(dock).toBeVisible();
  const box = await dock.boundingBox();
  expect(box?.width).toBe(232);
  expect(box?.height).toBe(64);

  for (const label of dockLabels) {
    await expect(page.getByLabel(label)).toBeVisible();
  }

  await expect(page.getByRole('link', { name: 'Аукционы' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Покупки' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Меню' })).toHaveCount(0);
  await expect(page.getByLabel('Корзина')).toHaveCount(0);
});

test('guest dock search, home, profile and plus stay inside the capsule', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  await page.getByLabel('Поиск').click();
  await expect(page).toHaveURL(/\/search\/?$/);
  await expect(page.getByLabel('Поиск')).toHaveAttribute(
    'aria-selected',
    'true',
  );

  await page.getByLabel('Главная').click();
  await expect(page).toHaveURL(/\/$/);

  await page.getByLabel('Профиль').click();
  await expect(page).toHaveURL(/\/login/);

  await page.goto('/');
  await page.getByLabel('Добавить').click();
  await expect(page).toHaveURL(/\/login/);
});

test('pending seller plus opens the application profile, not create-work', async ({
  browser,
}) => {
  const { seller } = await createSellerFixture({ status: 'PENDING_REVIEW' });
  const { context, page } = await authenticatedPage(browser, seller);

  try {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.getByLabel('Добавить').click();
    await expect(page).toHaveURL(/\/profile/);
    await expect(page).not.toHaveURL(/\/products\/new/);
  } finally {
    await context.close();
  }
});

test('approved seller plus opens the existing create-work flow', async ({
  browser,
}) => {
  const { seller } = await createSellerFixture({ status: 'APPROVED' });
  const { context, page } = await authenticatedPage(browser, seller);

  try {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.getByLabel('Добавить').click();
    await expect(page).toHaveURL(/\/products\/new/);
  } finally {
    await context.close();
  }
});

test('admin dock hides plus and opens admin from profile', async ({
  browser,
}) => {
  const { admin } = await createAdminModerationFixture();
  const { context, page } = await authenticatedPage(browser, admin);

  try {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await expect(page.getByLabel('Главная')).toBeVisible();
    await expect(page.getByLabel('Поиск')).toBeVisible();
    await expect(page.getByLabel('Профиль')).toBeVisible();
    await expect(page.getByLabel('Добавить')).toHaveCount(0);
    await page.getByLabel('Профиль').click();
    await expect(page).toHaveURL(/\/admin/);
  } finally {
    await context.close();
  }
});
