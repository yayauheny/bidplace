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

test('page infrastructure state replaces Home chrome', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route('**/api/portfolio/home', async (route) => {
    await route.abort('connectionrefused');
  });
  await page.route('**/api/auth/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ user: null }),
    });
  });

  await page.goto('/');

  await expect(page.getByTestId('infrastructure-error-state-page')).toBeVisible();
  await expect(page.getByRole('img', { name: 'Bidplace' })).toHaveCount(1);
  await expect(
    page.getByRole('link', { name: 'bidplace — на главную' }),
  ).toHaveCount(0);
  await expect(page.getByTestId('home-scroll')).toHaveCount(0);
  await expect(page.getByText('Загружаем bidplace…')).toHaveCount(0);
  await expect(page.getByText(infrastructureCopy)).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Повторить', exact: true }),
  ).toHaveCount(1);
});

test('home pending uses the branded mark without loading copy', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  let releaseHome: (() => void) | undefined;
  const holdHome = new Promise<void>((resolve) => {
    releaseHome = resolve;
  });
  await page.route('**/api/portfolio/home', async (route) => {
    await holdHome;
    await route.abort('connectionrefused');
  });
  await page.route('**/api/auth/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ user: null }),
    });
  });

  await page.goto('/');

  await expect(page.getByTestId('infrastructure-page-status-loading')).toBeVisible();
  await expect(page.getByRole('img', { name: 'Bidplace' })).toHaveCount(1);
  await expect(page.getByText('Загружаем bidplace…')).toHaveCount(0);
  await expect(page.getByText(infrastructureCopy)).toBeHidden();
  await expect(
    page.getByRole('button', { name: 'Повторить', exact: true }),
  ).toBeHidden();

  releaseHome?.();

  await expect(page.getByTestId('infrastructure-error-state-page')).toBeVisible();
  await expect(page.getByRole('img', { name: 'Bidplace' })).toHaveCount(1);
  await expect(page.getByText(infrastructureCopy)).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Повторить', exact: true }),
  ).toHaveCount(1);
});

test('search dual query failure keeps the field and one inline state', async ({
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

  await expect(page.getByTestId('infrastructure-error-state-inline')).toBeVisible();
  await expect(page.getByTestId('infrastructure-error-state-page')).toHaveCount(0);
  await expect(page.getByRole('img', { name: 'Bidplace' })).toHaveCount(0);
  await expect(page.getByText('Поиск', { exact: true })).toBeVisible();
  await expect(
    page.getByText('Ищите опубликованные работы и проверенных авторов.'),
  ).toBeVisible();
  await expect(page.getByText(infrastructureCopy)).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Повторить', exact: true })).toHaveCount(1);
  await expect(page.getByRole('alert')).toHaveCount(1);
  await expect(page.getByText('Не удалось загрузить работы')).toHaveCount(0);
  await expect(page.getByText('Не удалось загрузить авторов')).toHaveCount(0);
});
