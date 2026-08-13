import { expect, test } from '@playwright/test';
import {
  createAuctionFixture,
  removeRulesAcceptance,
} from './support/e2e-fixtures';
import { authenticatedPage } from './support/auth-session';
import {
  expectCurrentPrice,
  openBidDialog,
  placeBid,
} from './support/auction-actions';

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
    await buyerA.page.getByRole('button', { name: 'Поставить' }).click();
    await expect(
      buyerA.page.getByRole('button', { name: 'Принять правила' }),
    ).toBeVisible();
    await expect(
      buyerA.page.getByText(
        'Перед первой ставкой нужно принять правила сервиса.',
      ),
    ).toBeVisible();
    await buyerA.page.getByRole('button', { name: 'Принять правила' }).click();
    await expect(buyerA.page.getByLabel('Ваша ставка, BYN')).toBeVisible();
    await placeBid(buyerA.page, '11');
    await expectCurrentPrice(buyerA.page, '11.00');
    await expect(buyerA.page.getByLabel(/Побеждаете/)).toBeVisible();

    await buyerB.page.goto(`/product/${fixture.product.publicId}`);
    await placeBid(buyerB.page, '15');
    await expectCurrentPrice(buyerB.page, '15.00');
    await expect(buyerB.page.getByLabel(/Побеждаете/)).toBeVisible();

    await buyerA.page.reload();
    await expectCurrentPrice(buyerA.page, '15.00');
    await expect(buyerA.page.getByLabel(/Ставка перебита/)).toBeVisible();
    const staleAmountField = await openBidDialog(buyerA.page);
    await staleAmountField.fill('15');
    await expect(
      buyerA.page.getByText('Минимальная ставка — 15,5 BYN.'),
    ).toBeVisible();
    await placeBid(buyerA.page, '15.5');
    await expectCurrentPrice(buyerA.page, '15.50');
    await expect(buyerA.page.getByLabel(/Побеждаете/)).toBeVisible();
  } finally {
    await buyerA.context.close();
    await buyerB.context.close();
  }
});
