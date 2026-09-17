import { expect, test } from '@playwright/test';

import { authenticatedPage } from './support/auth-session';
import { createBuyerFixture } from './support/e2e-fixtures';

const infrastructureCopy = 'Проверьте соединение и попробуйте ещё раз.';

test('public API failure renders one coherent retry state', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route('**/api/auth/me', async (route) => {
    await route.abort('connectionrefused');
  });
  await page.route('**/api/portfolio/home', async (route) => {
    await route.abort('connectionrefused');
  });

  await page.goto('/');

  await expect(page.getByText(infrastructureCopy)).toBeVisible();
  await expect(page.getByText('Не удалось загрузить главную')).toHaveCount(0);
  await expect(page.getByText('Не удалось проверить сессию')).toHaveCount(0);
  const retry = page.getByRole('button', { name: 'Повторить', exact: true });
  await expect(retry).toHaveCount(1);
  const retryBounds = await retry.boundingBox();
  expect(retryBounds).not.toBeNull();
  expect(retryBounds!.x + retryBounds!.width / 2).toBeCloseTo(195, 0);
  await expect(page.getByRole('alert')).toHaveCount(1);
});

test('protected session failure reuses the shared retry state', async ({
  page,
}) => {
  await page.route('**/api/auth/me', async (route) => {
    await route.abort('connectionrefused');
  });

  await page.goto('/profile');

  await expect(page.getByText(infrastructureCopy)).toBeVisible();
  await expect(page.getByText('Не удалось проверить доступ')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Повторить', exact: true })).toHaveCount(1);
  await expect(page.getByRole('alert')).toHaveCount(1);
});

test('session check failure on Home keeps public content without infrastructure UI', async ({
  browser,
}) => {
  const { buyer } = await createBuyerFixture();
  const { context, page } = await authenticatedPage(browser, buyer);

  try {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.route('**/api/auth/me', async (route) => {
      await route.abort('connectionrefused');
    });
    await page.goto('/');

    await expect(page.getByTestId('home-scroll')).toBeVisible();
    await expect(page.getByText(infrastructureCopy)).toHaveCount(0);
    await expect(
      page.getByRole('button', { name: 'Повторить', exact: true }),
    ).toHaveCount(0);
    await expect(page.getByText('Не удалось загрузить главную')).toHaveCount(0);
    await expect(page.getByText('Не удалось проверить сессию')).toHaveCount(0);

    await page.getByTestId('figma-floating-dock').getByLabel('Профиль').click();
    await expect(page).toHaveURL(/\/profile/);
    await expect(page.getByText(infrastructureCopy)).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Повторить', exact: true }),
    ).toHaveCount(1);

    await page.unroute('**/api/auth/me');
    await page.getByRole('button', { name: 'Повторить', exact: true }).click();
    await expect(page.getByText(infrastructureCopy)).toHaveCount(0);
    await expect(page).toHaveURL(/\/profile/);
  } finally {
    await context.close();
  }
});

test('search dual query failure renders one canonical error state', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route('**/api/works?**', async (route) => {
    await route.abort('connectionrefused');
  });
  await page.route('**/api/authors?**', async (route) => {
    await route.abort('connectionrefused');
  });

  await page.goto('/search?q=dali');

  await expect(page.getByText(infrastructureCopy)).toBeVisible();
  await expect(page.getByText(infrastructureCopy)).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Повторить', exact: true })).toHaveCount(1);
  await expect(page.getByRole('alert')).toHaveCount(1);
  await expect(page.getByText('Не удалось загрузить работы')).toHaveCount(0);
  await expect(page.getByText('Не удалось загрузить авторов')).toHaveCount(0);
});
