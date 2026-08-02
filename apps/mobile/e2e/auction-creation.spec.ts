import { expect, test } from '@playwright/test';
import { approveProduct, createSellerFixture } from './support/e2e-fixtures';
import { authenticatedPage } from './support/auth-session';

const apiBaseURL = 'http://localhost:3001';

test('seller creates, submits, schedules, and publicly previews an auction', async ({
  browser,
  request,
}) => {
  test.setTimeout(120_000);
  const { seller } = await createSellerFixture();
  const { context, page } = await authenticatedPage(browser, seller);
  const title = `Draft auction ${Date.now()}`;

  try {
    await page.goto('/products/new');
    await page.getByRole('button', { name: 'E2E art' }).click();
    await page.getByLabel('Название').fill(title);
    await page
      .getByLabel('История предмета')
      .fill('Created through the seller UI.');
    await page.getByLabel('Уникальность или тираж').fill('One');
    await page.getByLabel('Происхождение').fill('E2E fixture');
    await page.getByLabel('Техника').fill('Mixed media');
    await page.getByLabel('Материал').fill('Paper, ink');
    await page.getByLabel('Размеры').fill('30x40');
    await page.getByLabel('Год создания').fill('2026');
    await page.getByLabel('Город').fill('Minsk');
    await page.getByLabel('Передача или доставка').fill('Pickup');

    const createResponsePromise = page.waitForResponse(
      (response) =>
        response.url().endsWith('/api/products') &&
        response.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Сохранить черновик' }).click();
    const productResponse = await createResponsePromise;
    expect(productResponse.ok()).toBeTruthy();
    const { product } = await productResponse.json();
    await page.waitForURL(new RegExp(`/products/${product.id}$`));

    const chooserPromise = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Добавить изображения' }).click();
    await (await chooserPromise).setFiles('e2e/fixtures/profile-photo.png');
    await expect(page.getByText('1/10 изображений')).toBeVisible();

    const submitResponsePromise = page.waitForResponse(
      (response) =>
        response.url().endsWith(`/api/products/${product.id}/submit`) &&
        response.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Отправить на модерацию' }).click();
    expect((await submitResponsePromise).ok()).toBeTruthy();
    await expect(page.getByText('На модерации')).toBeVisible();

    await approveProduct(product.id);
    await page.reload();
    await page.getByRole('button', { name: 'Создать аукцион' }).click();
    const startsAt = new Date(Date.now() + 15_000).toISOString();
    const endsAt = new Date(Date.now() + 315_000).toISOString();
    await page
      .getByRole('button', { name: new RegExp(`${title} · Одобрен`) })
      .click();
    const invalidDatesResponse = await context.request.post(
      `http://localhost:3001/api/products/${product.id}/listings`,
      {
        data: { startsAt: endsAt, endsAt: startsAt, startPrice: 10 },
      },
    );
    expect(invalidDatesResponse.status()).toBe(400);
    const invalidPriceResponse = await context.request.post(
      `http://localhost:3001/api/products/${product.id}/listings`,
      {
        data: { startsAt, endsAt, startPrice: -1 },
      },
    );
    expect(invalidPriceResponse.status()).toBe(400);
    await page.getByLabel('Начало').fill(startsAt);
    await page.getByLabel('Окончание').fill(endsAt);
    await page.getByLabel('Стартовая цена, BYN').fill('10');
    const listingResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes(`/api/products/${product.id}/listings`) &&
        response.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Создать размещение' }).click();
    const listingResponse = await listingResponsePromise;
    expect(listingResponse.ok()).toBeTruthy();
    const { listing } = await listingResponse.json();
    const scheduleResponsePromise = page.waitForResponse(
      (response) =>
        response.url().endsWith(`/api/listings/${listing.id}`) &&
        response.request().method() === 'PATCH',
    );
    await page
      .getByRole('button', { name: 'Запланировать размещение' })
      .click();
    expect((await scheduleResponsePromise).ok()).toBeTruthy();
    await expect(
      page.getByRole('button', { name: 'Открыть страницу аукциона' }),
    ).toBeVisible();
    const duplicateScheduleResponse = await context.request.patch(
      `http://localhost:3001/api/listings/${listing.id}`,
      {
        data: { action: 'SCHEDULE' },
      },
    );
    expect(duplicateScheduleResponse.ok()).toBeFalsy();

    const publicResponse = await request.get(
      `http://localhost:3001/api/products/${product.publicId}`,
    );
    expect(publicResponse.ok()).toBeTruthy();
    const publicPayload = await publicResponse.json();
    expect(publicPayload.listing.status).toBe('SCHEDULED');
    const imageResponse = await request.get(
      new URL(publicPayload.product.images[0].url, apiBaseURL).toString(),
    );
    expect(imageResponse.ok()).toBeTruthy();
    expect(imageResponse.headers()['content-type']).toMatch(/^image\/png/);
    expect((await imageResponse.body()).byteLength).toBeGreaterThan(0);
    await page.goto(`/product/${product.publicId}`);
    await expect(page.getByText(title)).toBeVisible();
    const image = page
      .locator(`img[alt="Изображение предмета: ${title}"]`)
      .first();
    await expect(image).toBeVisible();
    await expect
      .poll(() =>
        image.evaluate((element) => (element as HTMLImageElement).naturalWidth),
      )
      .toBeGreaterThan(0);
    await expect(page.getByText('Торги запланированы').first()).toBeVisible();
    await expect(page.getByText(/Автор:/).first()).toBeVisible();
    await expect(page.getByText('Обновления подключены')).toHaveCount(0);
    await expect(page.getByLabel('Ваша ставка, BYN')).toHaveCount(0);
  } finally {
    await context.close();
  }
});
