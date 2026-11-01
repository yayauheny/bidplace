import { expect, test } from '@playwright/test';

import { createAuctionFixture } from './support/e2e-fixtures';

test('product composition keeps the gallery and shows the sale on a live auction', async ({
  page,
}) => {
  const relatedTitle = 'Related E2E artwork';
  const fixture = await createAuctionFixture({
    additionalTitles: [relatedTitle],
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/product/${fixture.product.publicId}`);

  await expect(page.getByText(fixture.product.title).first()).toBeVisible();
  await expect(page.getByText(relatedTitle)).toBeVisible();
  await expect(
    page.getByRole('heading', { level: 1, name: fixture.product.title }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { level: 2, name: 'Другие работы автора' }),
  ).toBeVisible();
  await expect(page.getByText('Начальная цена')).toBeVisible();
  await expect(page.getByText('10 BYN')).toBeVisible();
  await page.getByRole('tab', { name: 'Как проходит сделка' }).click();
  await expect(page).toHaveURL(/\?tab=delivery$/);
  await expect(page.getByText('Работа бронируется.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Сделать ставку' })).toHaveCount(0);
  await expect(page.getByRole('tab', { name: 'Оплата и доставка' })).toHaveCount(0);
  await expect(page.getByRole('tab', { name: /Торги/ })).toHaveCount(0);
  await expect(page.getByTestId('product-sticky-auction-player')).toHaveCount(
    0,
  );

  const productScrollView = page.getByTestId('product-scroll-view');
  await productScrollView.evaluate((element) => {
    element.scrollTop = 900;
    element.dispatchEvent(new Event('scroll', { bubbles: true }));
  });
  await expect(page.getByTestId('product-sticky-auction-player')).toHaveCount(
    0,
  );

  await page.getByRole('button', { name: 'Поделиться работой' }).click();
  await page.getByRole('button', { name: 'Копировать ссылку' }).click();
  await expect(
    page.getByText('Ссылка скопирована.', { exact: true }),
  ).toBeVisible();

  await expect
    .poll(() =>
      page.evaluate(() => document.body.scrollWidth <= window.innerWidth),
    )
    .toBe(true);
});
