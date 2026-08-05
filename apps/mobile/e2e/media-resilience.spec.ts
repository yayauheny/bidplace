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

test('guest author photo logs a failed request, retries, and can be manually recovered', async ({
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
    if (attempts <= 4) {
      await route.abort('failed');
      return;
    }

    await route.continue();
  });
  await page.clock.install();
  await page.goto('/seller/anna-morozova');

  await expect(
    page.getByLabel('Фото автора недоступно: Анна Морозова'),
  ).toBeVisible();

  await page.clock.fastForward(1_000);
  await expect.poll(() => attempts).toBe(2);
  await page.clock.fastForward(3_000);
  await expect.poll(() => attempts).toBe(3);
  await page.clock.fastForward(8_000);
  await expect.poll(() => attempts).toBe(4);

  const retryButton = page.getByRole('button', { name: 'Повторить' });
  await expect(retryButton).toBeVisible();
  await expect.poll(() => mediaLogs.length).toBe(4);

  const loggedAttempts = mediaLogs.map((entry) =>
    Number((JSON.parse(entry) as { attempt: number }).attempt),
  );
  expect(loggedAttempts).toEqual([1, 2, 3, 4]);
  expect(mediaLogs.every((entry) => entry.includes('AuthorPhoto'))).toBe(true);
  expect(mediaLogs.every((entry) => !entry.includes('token'))).toBe(true);

  await retryButton.click();
  await expect.poll(() => attempts).toBe(5);
  await expect
    .poll(() =>
      page
        .getByAltText('Фото автора Анна Морозова')
        .evaluate((element) => (element as HTMLImageElement).naturalWidth),
    )
    .toBeGreaterThan(0);
  await expect(retryButton).toHaveCount(0);
});
