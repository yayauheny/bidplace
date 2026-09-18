import { expect, test } from '@playwright/test';

import {
  inactiveScreenIsolation,
  recordBackFrames,
  tabHitsTestId,
} from './support/back-frames';

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 860 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

test('Home → Work → Back does not flash loading or keep Work after Home', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByText('Новые работы', { exact: true })).toBeVisible();
  await page.locator('#home-new-works a[href^="/product/"]').first().click();
  await expect(page).toHaveURL(/\/product\//);
  await expect(page.getByTestId('product-scroll-view')).toBeVisible();

  const frames = await recordBackFrames(page, () =>
    page.getByRole('button', { name: 'Назад' }).click(),
  );

  expect(frames.some((frame) => frame.loading === 'visible')).toBe(false);
  expect(frames.at(-1)?.home).toBe('visible');
  expect(frames.at(-1)?.work).not.toBe('visible');
  const homeIndex = frames.findIndex((frame) => frame.home === 'visible');
  expect(homeIndex).toBeGreaterThanOrEqual(0);
  expect(
    frames.slice(homeIndex).some((frame) => frame.work === 'visible'),
  ).toBe(false);
});

test('inactive Home stays laid out and is not pointer or keyboard reachable', async ({
  page,
}) => {
  await page.goto('/');
  await page.locator('#home-new-works a[href^="/product/"]').first().click();
  await expect(page).toHaveURL(/\/product\//);
  await expect(page.getByTestId('product-scroll-view')).toBeVisible();

  const isolation = await inactiveScreenIsolation(page, 'home-scroll');
  expect(isolation.missing).toBe(false);
  expect(isolation.laidOut).toBe(true);
  expect(isolation.inert).toBe(true);
  expect(isolation.pointerNone).toBe(true);
  expect(await tabHitsTestId(page, 'home-scroll')).toBe(false);
});

test('Work → Author → Back does not flash Author or a collapsed Work gallery', async ({
  page,
}) => {
  await page.goto('/');
  await page.locator('#home-new-works a[href^="/product/"]').first().click();
  await expect(page.getByTestId('product-scroll-view')).toBeVisible();
  await page
    .getByTestId('product-scroll-view')
    .locator('a[href^="/seller/"]')
    .first()
    .click();
  await expect(page).toHaveURL(/\/seller\//);
  await expect(page.getByTestId('creator-scroll')).toBeVisible();

  const frames = await recordBackFrames(page, async () => {
    await page.goBack();
  });

  expect(frames.some((frame) => frame.loading === 'visible')).toBe(false);
  expect(frames.at(-1)?.work).toBe('visible');
  expect(frames.at(-1)?.author).not.toBe('visible');
  const workIndex = frames.findIndex((frame) => frame.work === 'visible');
  expect(workIndex).toBeGreaterThanOrEqual(0);
  expect(
    frames.slice(workIndex).some((frame) => frame.author === 'visible'),
  ).toBe(false);
  expect(frames[workIndex]?.gallery).toBe('visible');
});
