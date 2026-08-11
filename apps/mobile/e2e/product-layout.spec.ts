import { expect, test } from '@playwright/test';

import { createAuctionFixture } from './support/e2e-fixtures';

test('product composition exposes tabs and remains responsive', async ({
  page,
}) => {
  const relatedTitle = 'Related E2E artwork';
  const fixture = await createAuctionFixture({
    bids: true,
    additionalTitles: [relatedTitle],
  });

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`/product/${fixture.product.publicId}`);

  await expect(page.getByText(fixture.product.title)).toBeVisible();
  await expect(page.getByText('Ставка', { exact: true })).toBeVisible();
  await expect(page.getByText('15,00 BYN', { exact: true })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'О работе' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Создание' })).toBeVisible();
  await expect(page.getByRole('tab', { name: /Торги 2/ })).toBeVisible();
  await expect(page.getByText(relatedTitle)).toBeVisible();

  await page.getByRole('tab', { name: 'Создание' }).click();
  await expect(page).toHaveURL(
    new RegExp(`/product/${fixture.product.publicId}\\?tab=creation$`),
  );
  await expect(
    page.getByText('История создания', { exact: true }),
  ).toBeVisible();

  await page.getByRole('tab', { name: /Торги 2/ }).click();
  await expect(page).toHaveURL(
    new RegExp(`/product/${fixture.product.publicId}\\?tab=bids$`),
  );
  await expect(page.getByText('Участник')).toBeVisible();
  await expect(page.getByText('Время')).toBeVisible();

  await page.goBack();
  await expect(page.getByRole('tab', { name: 'Создание' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await expect(
    page.getByText('История создания', { exact: true }),
  ).toBeVisible();

  await page.goto(`/product/${fixture.product.publicId}?tab=bids`);
  await expect(page.getByRole('tab', { name: /Торги 2/ })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await expect(page.getByText('Участник')).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByText(fixture.product.title)).toBeVisible();
  expect(
    await page.evaluate(() => document.body.scrollWidth <= window.innerWidth),
  ).toBe(true);
});
