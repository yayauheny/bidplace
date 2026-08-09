import { expect, test } from '@playwright/test';

import { createAuctionFixture } from './support/e2e-fixtures';

test('public creator profile shows only public data and remains responsive', async ({
  page,
}) => {
  const fixture = await createAuctionFixture({
    additionalTitles: ['Вторая работа', 'Третья работа', 'Четвёртая работа'],
  });

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`/seller/${fixture.sellerProfile.slug}`);

  await expect(
    page.getByText(fixture.sellerProfile.fullName, { exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.getByTestId('app-shell-content').getByText('Работы', { exact: true }),
  ).toBeVisible();
  await expect(page.getByText(fixture.product.title)).toBeVisible();
  await expect(
    page.getByRole('link', {
      name: `Открыть публичную страницу автора ${fixture.sellerProfile.fullName}`,
    }),
  ).toBeVisible();

  await expect(page.locator('body')).not.toContainText(
    fixture.sellerProfile.privateContact,
  );
  await expect(page.locator('body')).not.toContainText(fixture.buyerA.email);
  await expect(page.locator('body')).not.toContainText(fixture.buyerB.email);

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    page.getByText(fixture.sellerProfile.fullName, { exact: true }).first(),
  ).toBeVisible();
  expect(
    await page.evaluate(() => document.body.scrollWidth <= window.innerWidth),
  ).toBe(true);
});
