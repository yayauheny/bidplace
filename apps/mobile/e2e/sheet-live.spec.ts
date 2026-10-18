import { expect, test, type Locator, type Page } from '@playwright/test';

async function pull(page: Page, handle: Locator, distance: number) {
  await handle.click({ trial: true });
  const box = await handle.boundingBox();
  if (!box) throw new Error('Missing sheet header');
  await page.mouse.move(box.x + box.width / 2, box.y + 10);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2, box.y + 10 + distance, {
    steps: 12,
  });
  await page.mouse.up();
}

test('live Home keeps loaded images through login, and author share closes by header', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 874 });
  await page.goto('/');
  const home = page.getByTestId('home-scroll');
  await expect(
    page.getByText('Открытие недели', { exact: true }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page
        .locator('img')
        .evaluateAll((images) =>
          images.some(
            (image) =>
              (image as HTMLImageElement).complete &&
              (image as HTMLImageElement).naturalWidth > 0,
          ),
        ),
    )
    .toBe(true);
  await home.evaluate((node) => {
    node.scrollTop = 120;
  });
  const before = await home.evaluate((node) => node.scrollTop);
  await page.evaluate(() => {
    window.__images = [...document.images];
  });
  await page
    .getByTestId('figma-floating-dock')
    .getByLabel('Профиль', { exact: true })
    .click();
  await expect(page.locator('#auth-sheet')).toBeVisible();
  await page
    .locator('#auth-sheet [data-sheet-drag-handle]')
    .click({ trial: true });
  await page.screenshot({
    path: test.info().outputPath('login-preserved-background.png'),
  });
  expect(
    await page.evaluate(() =>
      window.__images.every((image) => image.isConnected),
    ),
  ).toBe(true);
  await pull(page, page.locator('[data-sheet-drag-handle]').first(), 130);
  await expect(page).toHaveURL(/\/$/);
  expect(await home.first().evaluate((node) => node.scrollTop)).toBe(before);
  expect(
    await page.evaluate(() =>
      window.__images.every((image) => image.isConnected),
    ),
  ).toBe(true);
  await page
    .getByRole('button', { name: 'Смотреть профиль', exact: true })
    .first()
    .click();
  await expect(page).toHaveURL(/\/seller\//);
  const profileUrl = page.url();
  await page.evaluate(() => {
    window.__images = [...document.images];
  });
  await page
    .getByTestId('figma-floating-dock')
    .getByLabel('Профиль', { exact: true })
    .click();
  await expect(page.locator('#auth-sheet')).toBeVisible();
  expect(
    await page.evaluate(() =>
      window.__images.every((image) => image.isConnected),
    ),
  ).toBe(true);
  await pull(
    page,
    page.locator('#auth-sheet [data-sheet-drag-handle]').first(),
    130,
  );
  await expect(page).toHaveURL(profileUrl);
  expect(
    await page.evaluate(() =>
      window.__images.every((image) => image.isConnected),
    ),
  ).toBe(true);
  await page
    .getByRole('button', { name: 'Поделиться профилем', exact: true })
    .click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog
    .locator('[data-sheet-drag-handle]')
    .first()
    .click({ trial: true });
  await page.screenshot({
    path: test.info().outputPath('profile-share-sheet.png'),
  });
  await pull(page, dialog.locator('[data-sheet-drag-handle]').first(), 10);
  await expect(dialog).toBeVisible();
  await pull(page, dialog.locator('[data-sheet-drag-handle]').first(), 125);
  await expect(dialog).not.toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Поделиться профилем', exact: true }),
  ).toBeFocused();
});

test('live catalog, Back and author navigation stay usable', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 874 });
  await page.goto('/');
  await page
    .getByRole('button', { name: 'Смотреть все', exact: true })
    .first()
    .click();
  await expect(page).toHaveURL(/\/works/);
  await expect(
    page.getByText('Каталог работ на Bidplace', { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: /Фильтры/ }).click();
  const filters = page.getByRole('dialog', { name: 'Фильтры', exact: true });
  await expect(filters).toBeVisible();
  await pull(page, filters.locator('[data-sheet-drag-handle]').first(), 130);
  await expect(filters).not.toBeVisible();
  await expect(page).toHaveURL(/\/works/);
  await page.goBack();
  await expect(
    page.getByText('Открытие недели', { exact: true }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Смотреть все', exact: true })
    .nth(1)
    .click();
  await expect(page).toHaveURL(/\/authors/);
});
