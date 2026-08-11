import { expect, test } from '@playwright/test';

test('cold-start guest author profile renders its photo', async ({ page }) => {
  await page.goto('/seller/anna-morozova');

  await expect(page.getByRole('link', { name: 'Войти' })).toBeVisible();
  const photo = page.getByAltText('Фото автора Анна Морозова');
  await expect(photo).toBeVisible();
  await expect
    .poll(() =>
      photo.evaluate((element) => (element as HTMLImageElement).naturalWidth),
    )
    .toBeGreaterThan(0);
});

test('guest author photo logs a failed request and keeps a safe fallback', async ({
  page,
}) => {
  test.setTimeout(30_000);

  let attempts = 0;
  const mediaLogs: string[] = [];
  page.on('console', (message) => {
    if (
      message.type() === 'warning' &&
      message.text().includes('media_load_failed')
    ) {
      mediaLogs.push(message.text());
    }
  });

  await page.route('**/api/sellers/anna-morozova/photo*', async (route) => {
    attempts += 1;
    if (attempts <= 16) {
      await route.abort('failed');
      return;
    }

    await route.continue();
  });
  await page.clock.install();
  await page.goto('/seller/anna-morozova');

  await expect(
    page.getByLabel('Фото автора недоступно: Анна Морозова').first(),
  ).toBeVisible();

  await expect.poll(() => attempts).toBeGreaterThan(0);
  await expect.poll(() => mediaLogs.length).toBeGreaterThan(0);
  expect(mediaLogs.some((entry) => entry.includes('AuthorPhoto'))).toBe(true);
  expect(mediaLogs.every((entry) => !entry.includes('token'))).toBe(true);
});
