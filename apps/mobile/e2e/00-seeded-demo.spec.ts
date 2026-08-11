import { expect, test, type APIRequestContext } from '@playwright/test';

import { authenticatedPage } from './support/auth-session';
import { e2eApiBaseURL } from './support/e2e-env';

const apiBaseURL = e2eApiBaseURL;
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

test('demo seed exposes three public products and real media', async ({
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

  const response = await request.get(
    `${apiBaseURL}/api/products?page=1&limit=20`,
  );
  expect(response.ok()).toBeTruthy();
  const payload = await response.json();
  const seededProducts = payload.products.filter(
    (item: { product: { publicId: string } }) =>
      ['seedSched01', 'seedLive002', 'seedEnded03'].includes(
        item.product.publicId,
      ),
  );
  expect(seededProducts).toHaveLength(3);

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
    await page.goto('/');
    await expect(page.getByText(item.product.title)).toBeVisible();
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
});

test('seeded buyer sees bid history, empty state, retry and ended result', async ({
  browser,
}) => {
  const { context, page } = await authenticatedPage(browser, seededBuyer);

  try {
    const liveAlias = await getPublicBidAlias(context.request, 'seedLive002');
    const endedAlias = await getPublicBidAlias(context.request, 'seedEnded03');

    await page.goto('/product/seedLive002');
    await page.getByRole('tab', { name: /Торги/ }).click();
    await expect(page.getByText(liveAlias)).toBeVisible();
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
