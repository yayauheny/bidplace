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

  const frames = await recordBackFrames(page, () =>
    page.getByRole('button', { name: 'Назад' }).click(),
  );

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

test('Search → Author → Back restores Search without a naked Home frame', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByTestId('figma-floating-dock').getByLabel('Поиск').click();
  const overlay = page.getByTestId('app-shell-content').filter({ has: page.getByTestId('explore-header') });
  await expect(page.getByTestId('explore-header')).toBeVisible();
  await overlay.getByRole('tab', { name: 'Авторы' }).click();
  await overlay.getByRole('link', { name: /^@/ }).first().click();
  await expect(page).toHaveURL(/\/seller\//);
  await expect(page.getByTestId('creator-scroll')).toBeVisible();

  const frames = await recordBackFrames(page, () =>
    page.getByRole('button', { name: 'Назад' }).click(),
  );

  expect(frames.at(-1)?.overlay).toBe('visible');
  expect(
    frames.some(
      (frame) =>
        frame.author !== 'visible' &&
        frame.overlay !== 'visible' &&
        frame.home === 'visible',
    ),
  ).toBe(false);
});

test('direct Works alias opens Explore with a Home fallback', async ({ page }) => {
  await page.goto('/works');
  await expect(page.getByTestId('explore-scroll')).toBeVisible();
  await page.getByRole('button', { name: 'Назад' }).click();
  await expect(page).toHaveURL(/\/$/);
});

test('Search → Work → Back restores Search without a Work flash after overlay', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByTestId('figma-floating-dock').getByLabel('Поиск').click();
  const overlay = page.getByTestId('app-shell-content').filter({ has: page.getByTestId('explore-header') });
  await expect(page.getByTestId('explore-header')).toBeVisible();
  await overlay.getByRole('tab', { name: 'Работы' }).click();
  await overlay.locator('a[href^="/product/"]').first().click();
  await expect(page).toHaveURL(/\/product\//);
  await expect(page.getByTestId('product-scroll-view')).toBeVisible();

  const frames = await recordBackFrames(page, () =>
    page.getByRole('button', { name: 'Назад' }).click(),
  );

  expect(frames.at(-1)?.overlay).toBe('visible');
  const overlayIndex = frames.findIndex((frame) => frame.overlay === 'visible');
  expect(overlayIndex).toBeGreaterThanOrEqual(0);
  expect(
    frames.slice(overlayIndex).some((frame) => frame.work === 'visible'),
  ).toBe(false);
});

for (const path of ['/explore?section=works', '/product/daliEstate1', '/seller/local-author-1']) {
  test(`Back uses the shared48px full-arrow standard on ${path}`, async ({ page }) => {
    await page.goto(path);
    const back = page.getByRole('button', { name: 'Назад', exact: true });
    await expect(back).toHaveCount(1);
    await expect(back).toBeVisible();
    expect((await back.boundingBox())?.width).toBe(48);
    expect((await back.boundingBox())?.height).toBe(48);
    await expect(back.locator('svg').last()).toHaveAttribute('width', '28');
    await expect(back.locator('svg path').first()).toHaveAttribute('d', 'M5.5 12.002H19');
    await back.focus();
    await expect(back).toBeFocused();
    await expect(back).toHaveCSS('outline-style', 'solid');
    await expect(back).not.toHaveCSS('outline-width', '0px');
    const box = await back.boundingBox();
    await back.hover();
    expect(await back.boundingBox()).toEqual(box);
    await back.press('Enter');
    await expect(page).not.toHaveURL(`http://localhost:8081${path}`);
  });
}

test('Work Back preserves the filtered Explore route and Browser Back remains native', async ({ page }) => {
  const origin = '/explore?section=works&sort=oldest';
  await page.goto(origin);
  const explore = page.getByTestId('explore-scroll');
  await explore.locator('a[href^="/product/"]').first().click();
  await expect(page).toHaveURL(/\/product\//);
  await page.getByRole('button', { name: 'Назад', exact: true }).press('Space');
  await expect(page).toHaveURL(`http://localhost:8081${origin}`);
  await explore.locator('a[href^="/product/"]').first().click();
  await page.goBack();
  await expect(page).toHaveURL(`http://localhost:8081${origin}`);
});
