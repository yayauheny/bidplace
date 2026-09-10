import { expect, test } from '@playwright/test';

import { PAYMENT_DELIVERY_STUB } from '../src/features/products/payment-delivery-stub';
import { createAuctionFixture } from './support/e2e-fixtures';

test('product composition stays portfolio-only without auction chrome', async ({
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
  await expect(page.getByText(PAYMENT_DELIVERY_STUB)).toBeVisible();
  await expect(page.getByText('Ставка', { exact: true })).toHaveCount(0);
  await expect(page.getByText(/BYN/)).toHaveCount(0);
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
  await expect(
    page.getByText('Ссылка скопирована', { exact: true }),
  ).toBeVisible();

  await expect
    .poll(() =>
      page.evaluate(() => document.body.scrollWidth <= window.innerWidth),
    )
    .toBe(true);
});
