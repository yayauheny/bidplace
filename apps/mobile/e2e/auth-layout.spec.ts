import { expect, test } from '@playwright/test';

const introduction = 'Искусство встречает своего следующего владельца.';

test('auth composition is split on desktop and stacked on mobile', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/register');

  const desktopIntroduction = await page
    .getByText(introduction, { exact: true })
    .boundingBox();
  const desktopFormTitle = await page
    .getByText('Регистрация', { exact: true })
    .boundingBox();

  expect(desktopIntroduction).not.toBeNull();
  expect(desktopFormTitle).not.toBeNull();
  expect(desktopIntroduction!.x).toBeLessThan(desktopFormTitle!.x);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/register');

  const mobileIntroduction = await page
    .getByText(introduction, { exact: true })
    .boundingBox();
  const mobileFormTitle = await page
    .getByText('Регистрация', { exact: true })
    .boundingBox();

  expect(mobileIntroduction).not.toBeNull();
  expect(mobileFormTitle).not.toBeNull();
  expect(mobileIntroduction!.y).toBeLessThan(mobileFormTitle!.y);
  expect(
    await page.evaluate(() => document.body.scrollWidth <= window.innerWidth),
  ).toBe(true);
});
