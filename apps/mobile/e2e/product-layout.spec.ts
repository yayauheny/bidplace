import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

import { expect, test } from '@playwright/test';

import { createAuctionFixture } from './support/e2e-fixtures';

const screenshotDir = resolve(
  '/private/tmp',
  'bidplace-product-tab-screenshots',
);

test('product composition exposes tabs and remains responsive', async ({
  page,
}) => {
  const relatedTitle = 'Related E2E artwork';
  const fixture = await createAuctionFixture({
    bids: true,
    additionalTitles: [relatedTitle],
  });
  await mkdir(screenshotDir, { recursive: true });

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`/product/${fixture.product.publicId}`);

  await expect(page.getByText(fixture.product.title)).toBeVisible();
  await expect(page.getByText('Ставка', { exact: true })).toBeVisible();
  await expect(page.getByText('15,00 BYN', { exact: true })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'О работе' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Создание' })).toBeVisible();
  await expect(page.getByRole('tab', { name: /Торги/ })).toBeVisible();
  await expect(page.getByText(relatedTitle)).toBeVisible();
  await page.getByRole('button', { name: 'Поделиться предметом' }).click();
  await expect(page.getByText('Ссылка скопирована', { exact: true })).toBeVisible();
  await expect(page.getByTestId('product-sticky-auction-player')).toHaveCount(
    0,
  );
  await page.evaluate(() => {
    const scrollContainer = [
      ...document.querySelectorAll<HTMLElement>('*'),
    ].find((element) => element.scrollHeight > element.clientHeight + 20);
    if (!scrollContainer) throw new Error('Product scroll container not found');
    scrollContainer.scrollTop = 900;
    scrollContainer.dispatchEvent(new Event('scroll', { bubbles: true }));
  });
  await expect(page.getByTestId('product-sticky-auction-player')).toBeVisible();
  const stickyPlayerBox = await page
    .getByTestId('product-sticky-auction-player')
    .boundingBox();
  expect(stickyPlayerBox).not.toBeNull();
  expect(stickyPlayerBox!.y + stickyPlayerBox!.height).toBeLessThanOrEqual(900);
  await page.evaluate(() => {
    const scrollContainer = [
      ...document.querySelectorAll<HTMLElement>('*'),
    ].find((element) => element.scrollHeight > element.clientHeight + 20);
    if (!scrollContainer) throw new Error('Product scroll container not found');
    scrollContainer.scrollTop = 0;
    scrollContainer.dispatchEvent(new Event('scroll', { bubbles: true }));
  });
  await expect(page.getByTestId('product-sticky-auction-player')).toHaveCount(
    0,
  );

  await page.getByRole('tab', { name: 'Создание' }).click();
  await expect(page).toHaveURL(
    new RegExp(`/product/${fixture.product.publicId}\\?tab=creation$`),
  );
  await expect(
    page.getByText('История создания', { exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: resolve(screenshotDir, 'creation-1440.png'),
    fullPage: true,
  });

  await page.getByRole('tab', { name: /Торги/ }).click();
  await expect(page).toHaveURL(
    new RegExp(`/product/${fixture.product.publicId}\\?tab=bids$`),
  );
  await expect(page.getByText('Участник')).toBeVisible();
  await expect(page.getByText('Время')).toBeVisible();
  await page.screenshot({
    path: resolve(screenshotDir, 'bids-1440.png'),
    fullPage: true,
  });

  await page.goBack();
  await expect(page.getByRole('tab', { name: 'Создание' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await expect(
    page.getByText('История создания', { exact: true }),
  ).toBeVisible();

  await page.goto(`/product/${fixture.product.publicId}?tab=bids`);
  await expect(page.getByRole('tab', { name: /Торги/ })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await expect(page.getByText('Участник')).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('tab', { name: 'О работе' })).toBeVisible();
  await expect(page.getByText('Участник')).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() => document.body.scrollWidth <= window.innerWidth),
    )
    .toBe(true);
});
