import { expect, test, type Page } from '@playwright/test';
import {
  createAuctionFixture,
  removeRulesAcceptance,
} from './support/e2e-fixtures';
import { authenticatedPage } from './support/auth-session';

async function expectCurrentPrice(page: Page, amount: string) {
  await expect(page.locator('body')).toContainText(
    new RegExp(`Текущая цена\\s*${amount.replace('.', ',')}\\s+BYN`),
  );
}

async function placeBid(page: Page, amount: string) {
  await page.getByLabel('Ваша ставка, BYN').fill(amount);
  await page.getByRole('button', { name: 'Сделать ставку' }).click();
  const confirmation = page.getByRole('button', { name: 'Подтвердить ставку' });
  if (await confirmation.isVisible()) await confirmation.click();
}

test('two buyers place bids and observe canonical leading and outbid state', async ({
  browser,
}) => {
  test.setTimeout(120_000);
  const fixture = await createAuctionFixture();
  await removeRulesAcceptance(fixture.buyerA.id);
  const buyerA = await authenticatedPage(browser, fixture.buyerA);
  const buyerB = await authenticatedPage(browser, fixture.buyerB);
  try {
    await buyerA.page.goto(`/product/${fixture.product.publicId}`);
    await expectCurrentPrice(buyerA.page, '10.00');
    await expect(buyerA.page.locator('body')).toContainText(
      /Мин\. ставка:\s*10,00\s+BYN/,
    );
    await expect(
      buyerA.page.getByRole('button', { name: 'Принять правила' }),
    ).toBeVisible();
    await expect(
      buyerA.page.getByText('Перед первой ставкой нужно принять правила сервиса.'),
    ).toBeVisible();
    await buyerA.page.getByRole('button', { name: 'Принять правила' }).click();
    await placeBid(buyerA.page, '11');
    await expectCurrentPrice(buyerA.page, '11.00');
    await expect(buyerA.page.getByText('Побеждаете')).toBeVisible();

    await buyerB.page.goto(`/product/${fixture.product.publicId}`);
    await placeBid(buyerB.page, '15');
    await expectCurrentPrice(buyerB.page, '15.00');
    await expect(buyerB.page.getByText('Побеждаете')).toBeVisible();

    await buyerA.page.reload();
    await expectCurrentPrice(buyerA.page, '15.00');
    await expect(buyerA.page.getByText('Ставка перебита')).toBeVisible();
    await buyerA.page.getByLabel('Ваша ставка, BYN').fill('15');
    await buyerA.page.getByRole('button', { name: 'Сделать ставку' }).click();
    await expect(
      buyerA.page.getByText('Минимальная ставка — 15.5 BYN.'),
    ).toBeVisible();
    await placeBid(buyerA.page, '15.5');
    await expectCurrentPrice(buyerA.page, '15.50');
    await expect(buyerA.page.getByText('Побеждаете')).toBeVisible();
  } finally {
    await buyerA.context.close();
    await buyerB.context.close();
  }
});
