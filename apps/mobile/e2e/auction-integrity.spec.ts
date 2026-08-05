import { expect, test, type Page } from '@playwright/test';

import { authenticatedPage } from './support/auth-session';
import { createAuctionFixture } from './support/e2e-fixtures';

async function expectCurrentPrice(page: Page, amount: string) {
  await expect(page.locator('body')).toContainText(
    new RegExp(`Текущая цена\\s*${amount.replace('.', ',')}\\s+BYN`),
  );
}

test('rejects a stale bid, refetches the canonical minimum and accepts the retry', async ({
  browser,
}) => {
  test.setTimeout(120_000);
  const fixture = await createAuctionFixture();
  const buyerA = await authenticatedPage(browser, fixture.buyerA);
  const buyerB = await authenticatedPage(browser, fixture.buyerB);

  try {
    await buyerB.context.routeWebSocket('**/socket.io/**', (webSocket) => {
      webSocket.close();
    });
    await buyerB.page.goto(`/product/${fixture.product.publicId}`);
    await expectCurrentPrice(buyerB.page, '10.00');
    await expect(buyerB.page.locator('body')).toContainText(
      /Мин\. ставка:\s*10,00\s+BYN/,
    );

    const buyerAResponse = await buyerA.context.request.post(
      `http://localhost:3001/api/listings/${fixture.listing.id}/bids`,
      {
        headers: { 'Idempotency-Key': 'browser-buyer-a' },
        data: { amount: 11 },
      },
    );
    expect(buyerAResponse.ok()).toBeTruthy();

    await buyerB.page.getByLabel('Ваша ставка, BYN').fill('11');
    await buyerB.page.getByRole('button', { name: 'Сделать ставку' }).click();
    const staleConfirmation = buyerB.page.getByRole('button', {
      name: 'Подтвердить ставку',
    });
    if (await staleConfirmation.isVisible()) {
      await staleConfirmation.click();
    }
    await expect(
      buyerB.page.getByText(
        'Ставка не принята. Сервер обновил цену и минимальную сумму — проверьте актуальные данные.',
      ),
    ).toBeVisible();
    await expectCurrentPrice(buyerB.page, '11.00');
    await expect(buyerB.page.locator('body')).toContainText(
      /Мин\. ставка:\s*11,50\s+BYN/,
    );

    await buyerB.page.getByLabel('Ваша ставка, BYN').fill('11.5');
    await buyerB.page.getByRole('button', { name: 'Сделать ставку' }).click();
    const confirmation = buyerB.page.getByRole('button', {
      name: 'Подтвердить ставку',
    });
    if (await confirmation.isVisible()) {
      await confirmation.click();
    }
    await expectCurrentPrice(buyerB.page, '11.50');
    await expect(buyerB.page.getByText('Побеждаете')).toBeVisible();

    const canonical = await buyerB.context.request.get(
      `http://localhost:3001/api/products/${fixture.product.publicId}`,
    );
    expect(canonical.ok()).toBeTruthy();
    expect((await canonical.json()).listing).toMatchObject({
      currentPrice: 11.5,
      bidCount: 2,
    });
    const history = await buyerB.context.request.get(
      `http://localhost:3001/api/listings/${fixture.listing.id}/bids`,
    );
    expect(history.ok()).toBeTruthy();
    expect((await history.json()).bids).toHaveLength(2);
  } finally {
    await buyerA.context.close();
    await buyerB.context.close();
  }
});
