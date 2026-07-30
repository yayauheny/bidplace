import { expect, test } from '@playwright/test';

import { authenticatedPage } from './support/auth-session';

const apiBaseURL = 'http://localhost:3001';
const seededBuyer = {
  id: '',
  email: 'buyer@bidplace.test',
  password: 'password123',
};

test('demo seed exposes three public products and real media', async ({
  page,
  request,
}) => {
  const response = await request.get(`${apiBaseURL}/api/products?page=1&limit=20`);
  expect(response.ok()).toBeTruthy();
  const payload = await response.json();
  expect(payload.products).toHaveLength(3);
  expect(new Set(payload.products.map((item: { product: { publicId: string } }) => item.product.publicId))).toEqual(
    new Set(['seedSched01', 'seedLive002', 'seedEnded03']),
  );

  for (const item of payload.products) {
    expect(item.product.images).toHaveLength(1);
    const imageResponse = await request.get(
      new URL(item.product.images[0].url, apiBaseURL).toString(),
    );
    expect(imageResponse.status()).toBe(200);
    expect(imageResponse.headers()['content-type']).toMatch(/^image\/png/);
    expect((await imageResponse.body()).byteLength).toBeGreaterThan(0);
  }

  await page.goto('/');
  for (const item of payload.products) {
    await expect(page.getByText(item.product.title)).toBeVisible();
    const image = page
      .locator(`img[alt="Изображение предмета: ${item.product.title}"]`)
      .first();
    await expect(image).toBeVisible();
    await expect
      .poll(() => image.evaluate((element) => (element as HTMLImageElement).naturalWidth))
      .toBeGreaterThan(0);
  }
});

test('seeded buyer sees bid history, empty state, retry and ended result', async ({
  browser,
}) => {
  const { context, page } = await authenticatedPage(browser, seededBuyer);

  try {
    const me = await context.request.get(`${apiBaseURL}/api/auth/me`);
    const user = await me.json();
    seededBuyer.id = user.user.id;

    await page.goto('/product/seedLive002');
    await page.getByRole('tab', { name: 'Ставки' }).click();
    await expect(page.getByText(`Bidder ${seededBuyer.id.slice(0, 6)}`)).toBeVisible();
    await expect(page.getByText(/75,00\s*BYN/)).toBeVisible();

    await page.goto('/product/seedSched01');
    await page.getByRole('tab', { name: 'Ставки' }).click();
    await expect(page.getByText('Ставок ещё нет.')).toBeVisible();

    await page.route('**/api/listings/*/bids*', async (route) => {
      await route.fulfill({ status: 500, contentType: 'application/json', body: '{}' });
    });
    await page.goto('/product/seedLive002');
    await page.getByRole('tab', { name: 'Ставки' }).click();
    await expect(page.getByText('Не удалось загрузить историю ставок.')).toBeVisible();
    await page.unroute('**/api/listings/*/bids*');
    await page.getByRole('button', { name: 'Повторить' }).click();
    await expect(page.getByText(`Bidder ${seededBuyer.id.slice(0, 6)}`)).toBeVisible();

    await page.goto('/product/seedEnded03');
    await page.getByRole('tab', { name: 'Ставки' }).click();
    await expect(page.getByText(`Bidder ${seededBuyer.id.slice(0, 6)}`)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Открыть результат заказа' })).toBeVisible();
  } finally {
    await context.close();
  }
});
