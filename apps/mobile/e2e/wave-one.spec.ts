import { expect, test } from '@playwright/test';

import {
  createAdminModerationFixture,
  createBuyerFixture,
} from './support/e2e-fixtures';
import { authenticatedPage } from './support/auth-session';

const apiBaseURL = 'http://localhost:3001';

test('authenticated buyer receives private responses and truthful empty activity', async ({
  browser,
}) => {
  const { buyer } = await createBuyerFixture();
  const { context, page } = await authenticatedPage(browser, buyer);

  try {
    const activity = await context.request.get(`${apiBaseURL}/api/me/activity`);
    expect(activity.status()).toBe(200);
    expect((await activity.json()).activity).toEqual([]);

    await page.goto('/me/activity');
    await expect(page.getByText('Пока нет торгов')).toBeVisible();

    await page.goto('/');
    await page.getByRole('button', { name: /Открыть меню аккаунта/ }).click();
    await expect(page.getByRole('button', { name: 'Выйти' })).toBeVisible();
    await page.getByRole('button', { name: 'Выйти' }).click();
    await expect(page.getByRole('link', { name: 'Войти' })).toBeVisible();
  } finally {
    await context.close();
  }
});

test('new authenticated user sees seller application form and cannot access admin API', async ({
  browser,
}) => {
  const { buyer } = await createBuyerFixture();
  const { context, page } = await authenticatedPage(browser, buyer);

  try {
    const adminResponse = await context.request.get(
      `${apiBaseURL}/api/admin/products`,
    );
    expect(adminResponse.status()).toBe(403);

    await page.goto('/profile');
    await expect(
      page.getByText('Заполните профиль, чтобы подать заявку на модерацию.'),
    ).toBeVisible();
  } finally {
    await context.close();
  }
});

test('route groups do not emit legacy Expo Router warnings', async ({ page }) => {
  const warnings: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'warning' || message.type() === 'error') {
      warnings.push(message.text());
    }
  });

  await page.goto('/');
  expect(
    warnings.filter(
      (message) =>
        message.includes('No route named "(public)"') ||
        message.includes('No route named "(auth)"'),
    ),
  ).toEqual([]);
});

test('admin reviews and approves pending seller and product', async ({
  browser,
}) => {
  const fixture = await createAdminModerationFixture();
  const { context, page } = await authenticatedPage(browser, fixture.admin);

  try {
    await page.goto('/admin');
    await expect(page.getByText(fixture.sellerName)).toBeVisible();
    await expect(page.getByText(fixture.productTitle)).toBeVisible();

    await page
      .getByText(fixture.sellerName)
      .locator('..')
      .getByRole('button', { name: 'Одобрить' })
      .click();
    await expect
      .poll(async () => {
        const response = await context.request.get(
          `${apiBaseURL}/api/admin/seller-profiles`,
        );
        const payload = await response.json();
        return payload.sellerProfiles.find(
          (seller: { id: string }) => seller.id === fixture.sellerProfileId,
        )?.status;
      })
      .toBe('APPROVED');

    await page
      .getByText(fixture.productTitle)
      .locator('..')
      .getByRole('button', { name: 'Одобрить' })
      .click();
    await expect
      .poll(async () => {
        const response = await context.request.get(
          `${apiBaseURL}/api/admin/products`,
        );
        const payload = await response.json();
        return payload.products.find(
          (product: { id: string }) => product.id === fixture.productId,
        )?.status;
      })
      .toBe('APPROVED');
  } finally {
    await context.close();
  }
});
