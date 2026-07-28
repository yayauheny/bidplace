import { expect, test } from '@playwright/test';
import { createAuctionFixture, removeRulesAcceptance } from './support/e2e-fixtures';
import { authenticatedPage } from './support/auth-session';

test('two buyers place bids and observe canonical leading and outbid state', async ({ browser }) => {
  test.setTimeout(120_000);
  const fixture = await createAuctionFixture();
  await removeRulesAcceptance(fixture.buyerA.id);
  const buyerA = await authenticatedPage(browser, fixture.buyerA);
  const buyerB = await authenticatedPage(browser, fixture.buyerB);
  try {
    await buyerA.page.goto(`/product/${fixture.product.publicId}`);
    await expect(buyerA.page.getByText('Текущая цена: 10 BYN')).toBeVisible();
    await expect(buyerA.page.getByText(/Мин\. ставка: 10/)).toBeVisible();
    await expect(buyerA.page.getByRole('button', { name: 'Принять правила' })).toBeVisible();
    await buyerA.page.getByRole('button', { name: 'Принять правила' }).click();
    await buyerA.page.getByLabel('Ваша ставка, BYN').fill('11');
    await buyerA.page.getByRole('button', { name: 'Сделать ставку' }).click();
    await expect(buyerA.page.getByText('Текущая цена: 11 BYN')).toBeVisible();
    await expect(buyerA.page.getByText('LEADING')).toBeVisible();

    await buyerB.page.goto(`/product/${fixture.product.publicId}`);
    await buyerB.page.getByLabel('Ваша ставка, BYN').fill('15');
    await buyerB.page.getByRole('button', { name: 'Сделать ставку' }).click();
    await expect(buyerB.page.getByText('Текущая цена: 15 BYN')).toBeVisible();
    await expect(buyerB.page.getByText('LEADING')).toBeVisible();

    await buyerA.page.reload();
    await expect(buyerA.page.getByText('Текущая цена: 15 BYN')).toBeVisible();
    await expect(buyerA.page.getByText('OUTBID')).toBeVisible();
    await buyerA.page.getByLabel('Ваша ставка, BYN').fill('15');
    await buyerA.page.getByRole('button', { name: 'Сделать ставку' }).click();
    await expect(buyerA.page.getByText('Ставка не принята. Проверьте статус торгов и минимальную сумму.')).toBeVisible();
    await expect(buyerA.page.getByText('Текущая цена: 15 BYN')).toBeVisible();
    await buyerA.page.getByLabel('Ваша ставка, BYN').fill('16');
    await buyerA.page.getByRole('button', { name: 'Сделать ставку' }).click();
    await expect(buyerA.page.getByText('Текущая цена: 16 BYN')).toBeVisible();
    await expect(buyerA.page.getByText('LEADING')).toBeVisible();
  } finally {
    await buyerA.context.close();
    await buyerB.context.close();
  }
});
