import { expect, test } from '@playwright/test';

test('cold-start guest author profile renders its photo', async ({ page }) => {
  await page.goto('/seller/vex');

  const photo = page
    .getByTestId('creator-avatar')
    .getByLabel('Фото автора Илья Васильев');
  await expect(photo).toBeVisible({ timeout: 15_000 });
  await expect
    .poll(() =>
      photo.evaluate((element) => {
        const image = element.querySelector('img') ?? element;
        return image instanceof HTMLImageElement ? image.naturalWidth : 0;
      }),
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

  await page.route('**/api/sellers/vex/photo*', async (route) => {
    attempts += 1;
    if (attempts <= 16) {
      await route.abort('failed');
      return;
    }

    await route.continue();
  });
  await page.clock.install();
  await page.goto('/seller/vex');

  await expect(
    page.getByLabel('Фото автора недоступно: Илья Васильев').first(),
  ).toBeVisible();

  await expect.poll(() => attempts).toBeGreaterThan(0);
  await expect.poll(() => mediaLogs.length).toBeGreaterThan(0);
  expect(mediaLogs.some((entry) => entry.includes('AuthorPhoto'))).toBe(true);
  expect(mediaLogs.every((entry) => !entry.includes('token'))).toBe(true);
});

test('opening avatar stays a gray circle while loading and after failure', async ({ page }) => {
  let release: () => void = () => undefined;
  const pending = new Promise<void>((resolve) => { release = resolve; });
  let attempts = 0;
  await page.route('**/api/sellers/*/photo*', async (route) => {
    attempts += 1;
    await pending;
    await route.abort('failed');
  });
  await page.setViewportSize({ width: 390, height: 874 });
  await page.goto('/');
  const author = page.locator('#home-opening-author');
  const avatar = author.getByLabel(/^Фото автора /).first();
  await expect(avatar).toBeVisible();
  await expect.poll(() => attempts).toBeGreaterThan(0);
  const geometry = await avatar.evaluate((node) => {
    const style = getComputedStyle(node);
    return {
      width: node.getBoundingClientRect().width,
      height: node.getBoundingClientRect().height,
      background: style.backgroundColor,
      radius: parseFloat(style.borderRadius),
    };
  });
  expect(geometry.width).toBe(geometry.height);
  expect(geometry.radius).toBeGreaterThanOrEqual(geometry.width / 2);
  expect(geometry.background).not.toBe('rgba(0, 0, 0, 0)');
  await page.screenshot({ path: test.info().outputPath('opening-avatar-loading-390.png') });
  release();
  const fallback = author.getByLabel(/^Фото автора недоступно:/).first();
  await expect(fallback).toBeVisible();
  await expect(fallback.locator('button, [role="button"], svg')).toHaveCount(0);
  await expect(fallback).toHaveText('');
  expect(await fallback.evaluate((node) => getComputedStyle(node).backgroundColor))
    .toBe(geometry.background);
  await page.screenshot({ path: test.info().outputPath('opening-avatar-failed-390.png') });
});
