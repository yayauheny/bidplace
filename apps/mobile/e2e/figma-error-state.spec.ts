import { expect, test } from '@playwright/test';

test('public API failure renders one coherent retry state', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route('**/api/auth/me', async (route) => {
    await route.abort('connectionrefused');
  });
  await page.route('**/api/portfolio/home', async (route) => {
    await route.abort('connectionrefused');
  });

  await page.goto('/');

  await expect(page.getByText('Не удалось загрузить главную')).toBeVisible();
  const retry = page.getByRole('button', { name: 'Повторить' });
  await expect(retry).toHaveCount(1);
  const retryBounds = await retry.boundingBox();
  expect(retryBounds).not.toBeNull();
  expect(retryBounds!.x + retryBounds!.width / 2).toBeCloseTo(195, 0);
  await expect(
    page.getByText(
      'Не удалось связаться с сервером. Проверьте соединение и попробуйте снова.',
    ),
  ).toHaveCount(0);
  await expect(page.getByRole('alert')).toHaveCount(1);
});

test('protected session failure reuses the shared retry state', async ({
  page,
}) => {
  await page.route('**/api/auth/me', async (route) => {
    await route.abort('connectionrefused');
  });

  await page.goto('/profile');

  await expect(page.getByText('Не удалось проверить доступ')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Повторить' })).toHaveCount(1);
  await expect(page.getByRole('alert')).toHaveCount(1);
});
