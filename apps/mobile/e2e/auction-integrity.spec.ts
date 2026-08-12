import { expect, test, type Page } from '@playwright/test';

import { authenticatedPage } from './support/auth-session';
import { createAuctionFixture } from './support/e2e-fixtures';
import { e2eApiBaseURL } from './support/e2e-env';

async function expectCurrentPrice(page: Page, amount: string) {
  await expect(page.locator('body')).toContainText(
    new RegExp(`Ставка\\s*${amount.replace('.', ',')}\\s+BYN`),
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
    await expect(buyerB.page.locator('body')).toContainText(/Ваша ставка, BYN/);

    const buyerAResponse = await buyerA.context.request.post(
      `${e2eApiBaseURL}/api/listings/${fixture.listing.id}/bids`,
      {
        headers: { 'Idempotency-Key': 'browser-buyer-a' },
        data: { amount: 11 },
      },
    );
    expect(buyerAResponse.ok()).toBeTruthy();

    await buyerB.page.getByLabel('Ваша ставка, BYN').fill('11');
    await buyerB.page.getByRole('button', { name: 'Поставить' }).click();
    await expect(
      buyerB.page.getByText('Минимальная ставка — 11.5 BYN.'),
    ).toBeVisible();
    await expectCurrentPrice(buyerB.page, '11.00');
    await expect(buyerB.page.locator('body')).toContainText(/Ваша ставка, BYN/);

    await buyerB.page.getByLabel('Ваша ставка, BYN').fill('11.5');
    await buyerB.page.getByRole('button', { name: 'Поставить' }).click();
    const slider = buyerB.page.getByTestId('slide-to-bid');
    await expect(slider).toBeVisible();
    const box = await slider.boundingBox();
    expect(box).not.toBeNull();
    await buyerB.page.mouse.move(box!.x + 12, box!.y + box!.height / 2);
    await buyerB.page.mouse.down();
    await buyerB.page.mouse.move(
      box!.x + box!.width - 8,
      box!.y + box!.height / 2,
    );
    await buyerB.page.mouse.up();
    await expectCurrentPrice(buyerB.page, '11.50');
    await expect(buyerB.page.getByLabel(/Побеждаете/)).toBeVisible();

    const canonical = await buyerB.context.request.get(
      `${e2eApiBaseURL}/api/products/${fixture.product.publicId}`,
    );
    expect(canonical.ok()).toBeTruthy();
    expect((await canonical.json()).listing).toMatchObject({
      currentPrice: 11.5,
      bidCount: 2,
    });
    const history = await buyerB.context.request.get(
      `${e2eApiBaseURL}/api/listings/${fixture.listing.id}/bids`,
    );
    expect(history.ok()).toBeTruthy();
    expect((await history.json()).bids).toHaveLength(2);
  } finally {
    await buyerA.context.close();
    await buyerB.context.close();
  }
});
