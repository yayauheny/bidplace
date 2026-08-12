import { resolve } from 'node:path';

import { expect, test, type APIRequestContext } from '@playwright/test';

import { authenticatedPage } from './support/auth-session';
import { e2eApiBaseURL } from './support/e2e-env';

const apiBaseURL = e2eApiBaseURL;
const productTabScreenshotDir = resolve(
  '/private/tmp',
  'bidplace-product-tab-screenshots',
);
const seededBuyer = {
  id: '',
  email: 'buyer@bidplace.test',
  password: 'password123',
};

async function getPublicBidAlias(
  request: APIRequestContext,
  productPublicId: string,
): Promise<string> {
  const productResponse = await request.get(
    `${apiBaseURL}/api/products/${productPublicId}`,
  );
  expect(productResponse.ok()).toBeTruthy();
  const detail = (await productResponse.json()) as {
    listing: { id: string };
  };
  const bidsResponse = await request.get(
    `${apiBaseURL}/api/listings/${detail.listing.id}/bids`,
  );
  expect(bidsResponse.ok()).toBeTruthy();
  const history = (await bidsResponse.json()) as {
    bids: Array<{ bidderAlias: string }>;
  };

  return history.bids[0]!.bidderAlias;
}

test('demo seed exposes four public products and real media', async ({
  page,
  request,
}) => {
  const authorDetailResponse = await request.get(
    `${apiBaseURL}/api/sellers/anna-morozova/detail`,
  );
  expect(authorDetailResponse.ok()).toBeTruthy();
  const authorDetail = await authorDetailResponse.json();
  const authorPhotoResponse = await request.get(
    new URL(authorDetail.sellerProfile.profilePhotoUrl, apiBaseURL).toString(),
  );
  expect(authorPhotoResponse.status()).toBe(200);
  expect(authorPhotoResponse.headers()['content-type']).toMatch(/^image\/png/);
  expect((await authorPhotoResponse.body()).byteLength).toBeGreaterThan(
    100_000,
  );

  const authorsResponse = await request.get(
    `${apiBaseURL}/api/sellers?limit=20&sort=name`,
  );
  expect(authorsResponse.ok()).toBeTruthy();
  const authorsPayload = await authorsResponse.json();
  expect(authorsPayload.sellers).toHaveLength(8);
  expect(
    new Set(
      authorsPayload.sellers.map(
        (item: { sellerProfile: { slug: string } }) => item.sellerProfile.slug,
      ),
    ).size,
  ).toBe(8);

  for (const item of authorsPayload.sellers) {
    const profilePhotoResponse = await request.get(
      new URL(item.sellerProfile.profilePhotoUrl, apiBaseURL).toString(),
    );
    expect(profilePhotoResponse.status()).toBe(200);
    expect(profilePhotoResponse.headers()['content-type']).toMatch(
      /^image\/png/,
    );
    expect((await profilePhotoResponse.body()).byteLength).toBeGreaterThan(0);
  }

  const response = await request.get(
    `${apiBaseURL}/api/products?page=1&limit=20`,
  );
  expect(response.ok()).toBeTruthy();
  const payload = await response.json();
  const seededProducts = payload.products.filter(
    (item: { product: { publicId: string } }) =>
      ['seedSched01', 'seedLive002', 'seedEnded03', 'seedVase004'].includes(
        item.product.publicId,
      ),
  );
  expect(seededProducts).toHaveLength(4);

  for (const item of seededProducts) {
    expect(item.product.images).toHaveLength(1);
    const imageResponse = await request.get(
      new URL(item.product.images[0].url, apiBaseURL).toString(),
    );
    expect(imageResponse.status()).toBe(200);
    expect(imageResponse.headers()['content-type']).toMatch(/^image\/png/);
    expect((await imageResponse.body()).byteLength).toBeGreaterThan(0);
  }

  for (const item of seededProducts) {
    await page.goto('/works');
    await expect(page.getByText(item.product.title).first()).toBeVisible();
    const image = page
      .locator(`img[alt="Изображение предмета: ${item.product.title}"]`)
      .first();
    await expect(image).toBeVisible();
    await expect
      .poll(() =>
        image.evaluate((element) => (element as HTMLImageElement).naturalWidth),
      )
      .toBeGreaterThan(0);

    await page.goto(`/product/${item.product.publicId}`);
    const galleryImage = page
      .locator(`img[alt="Изображение предмета: ${item.product.title}"]`)
      .first();
    await expect(galleryImage).toBeVisible();
    await expect
      .poll(() =>
        galleryImage.evaluate(
          (element) => (element as HTMLImageElement).naturalWidth,
        ),
      )
      .toBeGreaterThan(0);
    await expect(
      page.getByText(`Изображение недоступно: ${item.product.title}`),
    ).toHaveCount(0);
  }

  await page.goto('/seller/anna-morozova');
  const authorPhoto = page.locator('img[alt="Фото автора Анна Морозова"]');
  await expect(authorPhoto).toBeVisible();
  await expect
    .poll(() =>
      authorPhoto.evaluate((element) => ({
        width: (element as HTMLImageElement).naturalWidth,
        height: (element as HTMLImageElement).naturalHeight,
      })),
    )
    .toEqual({ width: 740, height: 493 });

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/product/seedLive002?tab=creation');
  await expect(
    page.getByText('История создания', { exact: true }),
  ).toBeVisible();
  await expect(page.locator('img[alt^="Изображение этапа:"]')).toHaveCount(4);
  await page.screenshot({
    path: resolve(productTabScreenshotDir, 'seeded-creation-1440.png'),
    fullPage: true,
  });
});

test('seeded buyer sees bid history, empty state, retry and ended result', async ({
  browser,
}) => {
  const { context, page } = await authenticatedPage(browser, seededBuyer);

  try {
    const liveAlias = await getPublicBidAlias(context.request, 'seedLive002');
    const endedAlias = await getPublicBidAlias(context.request, 'seedEnded03');

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/product/seedLive002');
    await page.getByRole('tab', { name: /Торги/ }).click();
    await expect(page.getByText(liveAlias)).toBeVisible();
    await expect(page.getByLabel('Лидер торгов')).toBeVisible();
    await page.screenshot({
      path: resolve(productTabScreenshotDir, 'seeded-bids-1440.png'),
      fullPage: true,
    });
    await expect(page.getByText(/75,00\s*BYN/).last()).toBeVisible();

    await page.goto('/product/seedSched01');
    await page.getByRole('tab', { name: /Торги/ }).click();
    await expect(page.getByText('Ставок ещё нет.')).toBeVisible();

    await page.route('**/api/listings/*/bids*', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: '{}',
      });
    });
    await page.goto('/product/seedLive002');
    await page.getByRole('tab', { name: /Торги/ }).click();
    await expect(
      page.getByText('Не удалось загрузить историю ставок.'),
    ).toBeVisible();
    await page.unroute('**/api/listings/*/bids*');
    await page.getByRole('button', { name: 'Повторить' }).click();
    await expect(page.getByText(liveAlias)).toBeVisible();

    await page.goto('/product/seedEnded03');
    await page.getByRole('tab', { name: /Торги/ }).click();
    await expect(page.getByText(endedAlias)).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Открыть результат заказа' }),
    ).toBeVisible();
  } finally {
    await context.close();
  }
});
