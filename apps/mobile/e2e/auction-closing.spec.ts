import { expect, test } from '@playwright/test';
import { createAuctionFixture } from './support/e2e-fixtures';
import { authenticatedPage } from './support/auth-session';
import { closeListing } from './support/listing-state';
import { e2eApiBaseURL } from './support/e2e-env';

test('closing an auction creates one winner result and preserves buyer privacy', async ({
  browser,
  request,
}) => {
  test.setTimeout(120_000);
  const fixture = await createAuctionFixture({ bids: true });
  const winner = await authenticatedPage(browser, fixture.buyerB);
  const loser = await authenticatedPage(browser, fixture.buyerA);
  try {
    await winner.page.goto(`/product/${fixture.product.publicId}`);
    await expect(winner.page.getByLabel(/Побеждаете/)).toBeVisible();
    await loser.page.goto(`/product/${fixture.product.publicId}`);
    await expect(loser.page.getByLabel(/Ставка перебита/)).toBeVisible();

    await closeListing(
      fixture.listing.id,
      new Date(fixture.listing.endsAt.getTime() + 1),
    );
    await expect
      .poll(async () => {
        const response = await request.get(
          `${e2eApiBaseURL}/api/products/${fixture.product.publicId}`,
        );
        return (await response.json()).listing?.status ?? null;
      })
      .toBe('ENDED');
    const activity = await winner.context.request.get(
      `${e2eApiBaseURL}/api/me/activity`,
    );
    expect(activity.ok()).toBeTruthy();
    const activityPayload = await activity.json();
    const winnerItem = activityPayload.activity.find(
      (item: { product: { publicId: string } }) =>
        item.product.publicId === fixture.product.publicId,
    );
    expect(winnerItem.status).toBe('AWAITING_SELLER_CONTACT');
    expect(winnerItem.orderPublicId).toBeTruthy();

    await winner.page.goto('/me/activity');
    await expect(
      winner.page.getByText('Ожидаем контакта продавца'),
    ).toBeVisible();
    await winner.page.getByRole('button', { name: 'Открыть заказ' }).click();
    await expect(winner.page.getByText(`@seller_`)).toBeVisible();
    await expect(winner.page.getByText(fixture.buyerB.email)).toHaveCount(0);

    await loser.page.goto('/me/activity');
    await expect(loser.page.getByText('Торги завершены').first()).toBeVisible();
    await expect(
      loser.page.getByRole('button', { name: 'Открыть заказ' }),
    ).toHaveCount(0);
    await loser.page.goto(`/product/${fixture.product.publicId}`);
    await expect(loser.page.getByText('Торги завершены').first()).toBeVisible();
    await expect(loser.page.getByLabel('Ваша ставка, BYN')).toHaveCount(0);
  } finally {
    await winner.context.close();
    await loser.context.close();
  }
});
