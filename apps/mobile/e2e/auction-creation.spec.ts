import { expect, test } from '@playwright/test';
import { approveProduct, createSellerFixture } from './support/e2e-fixtures';
import { authenticatedPage } from './support/auth-session';
import { e2eApiBaseURL } from './support/e2e-env';

const apiBaseURL = e2eApiBaseURL;

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
    await page.getByLabel('Упаковка').fill('Protective packaging');

    const createResponsePromise = page.waitForResponse(
      (response) =>
        response.url().endsWith('/api/products') &&
        response.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Сохранить и продолжить' }).click();
    const productResponse = await createResponsePromise;
    expect(productResponse.ok()).toBeTruthy();
    const { product } = await productResponse.json();
    await page.waitForURL(
      new RegExp(`/products/${product.id}\\?flow=creation&step=2$`),
    );

    const chooserPromise = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Добавить изображения' }).click();
    await (await chooserPromise).setFiles('e2e/fixtures/profile-photo.png');
    await expect(page.getByText('1/10 изображений')).toBeVisible();
    await page
      .getByRole('button', { name: 'Продолжить к истории создания' })
      .click();
    await expect(page).toHaveURL(/flow=creation&step=3$/);
    await page.getByLabel('Введение').fill('The story survived a reload.');
    await page.getByRole('button', { name: 'Добавить первый этап' }).click();
    await page.getByLabel('Название этапа').fill('First sketch');
    await page
      .getByLabel('Описание этапа')
      .fill('The process image and text are server-backed.');
    await page.getByRole('button', { name: 'Сохранить историю' }).click();
    await expect(page.getByText('История сохранена.')).toBeVisible();
    const processChooserPromise = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Добавить фотографию' }).click();
    await (
      await processChooserPromise
    ).setFiles('e2e/fixtures/profile-photo.png');
    await expect(
      page.getByRole('button', { name: 'Заменить фотографию' }),
    ).toBeVisible();

    await page.reload();
    await expect(page.getByLabel('Введение')).toHaveValue(
      'The story survived a reload.',
    );
    await expect(page.getByLabel('Название этапа')).toHaveValue('First sketch');
    await expect(
      page.getByRole('button', { name: 'Заменить фотографию' }),
    ).toBeVisible();
    await page
      .getByLabel('Введение')
      .fill('The story was edited after reload.');
    await page.getByRole('button', { name: 'Сохранить историю' }).click();
    await page.getByRole('button', { name: 'Продолжить к проверке' }).click();
    await expect(page.getByText('Этапы истории: 1')).toBeVisible();

    const submitResponsePromise = page.waitForResponse(
      (response) =>
        response.url().endsWith(`/api/products/${product.id}/submit`) &&
        response.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Отправить на модерацию' }).click();
    expect((await submitResponsePromise).ok()).toBeTruthy();
    await expect(
      page.getByText('Предмет отправлен на модерацию.'),
    ).toBeVisible();

    await approveProduct(product.id);
    await page.goto(`/products/${product.id}`);
    await page.getByRole('button', { name: 'Создать аукцион' }).click();
    const startsAt = new Date(Date.now() + 15_000).toISOString();
    const endsAt = new Date(Date.now() + 315_000).toISOString();
    await page
      .getByRole('button', { name: new RegExp(`${title} · Одобрен`) })
      .click();
    const invalidDatesResponse = await context.request.post(
      `${apiBaseURL}/api/products/${product.id}/listings`,
      {
        data: { startsAt: endsAt, endsAt: startsAt, startPrice: 10 },
      },
    );
    expect(invalidDatesResponse.status()).toBe(400);
    const invalidPriceResponse = await context.request.post(
      `${apiBaseURL}/api/products/${product.id}/listings`,
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
      `${apiBaseURL}/api/listings/${listing.id}`,
      {
        data: { action: 'SCHEDULE' },
      },
    );
    expect(duplicateScheduleResponse.ok()).toBeFalsy();

    const publicResponse = await request.get(
      `${apiBaseURL}/api/products/${product.publicId}`,
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
    await expect(
      page.getByLabel(/Торги\. Торги запланированы\./).first(),
    ).toBeVisible();
    await expect(
      page.getByRole('link', {
        name: `Открыть профиль автора ${publicPayload.sellerProfile.fullName}`,
      }),
    ).toBeVisible();
    await expect(page.getByText('Обновления подключены')).toHaveCount(0);
    await expect(page.getByLabel('Ваша ставка, BYN')).toHaveCount(0);
  } finally {
    await context.close();
  }
});
