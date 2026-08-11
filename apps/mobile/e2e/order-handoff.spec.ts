import { expect, test } from '@playwright/test';

import { authenticatedPage } from './support/auth-session';
import { createAuctionFixture } from './support/e2e-fixtures';
import { closeListing } from './support/listing-state';
import { e2eApiBaseURL } from './support/e2e-env';

test('seller marks the existing Order contacted and the API keeps the transition', async ({
  browser,
}) => {
  test.setTimeout(120_000);
  const fixture = await createAuctionFixture({ bids: true });
  const winner = await authenticatedPage(browser, fixture.buyerB);
  const seller = await authenticatedPage(browser, fixture.seller);

  try {
    await closeListing(
      fixture.listing.id,
      new Date(fixture.listing.endsAt.getTime() + 1),
    );
    const activity = await winner.context.request.get(
      `${e2eApiBaseURL}/api/me/activity`,
    );
    expect(activity.ok()).toBeTruthy();
    const activityPayload = await activity.json();
    const winnerItem = activityPayload.activity.find(
      (item: { product: { publicId: string } }) =>
        item.product.publicId === fixture.product.publicId,
    );
    const orderPublicId = winnerItem?.orderPublicId as string | undefined;
    expect(orderPublicId).toBeTruthy();

    await seller.page.goto(`/order/${orderPublicId}`);
    await expect(seller.page.getByText(fixture.buyerB.email)).toBeVisible();
    await seller.page.getByRole('button', { name: 'Отметить контакт' }).click();
    await expect(seller.page.getByText('Контакт установлен')).toBeVisible();

    const persisted = await seller.context.request.get(
      `${e2eApiBaseURL}/api/orders/${orderPublicId}`,
    );
    expect(persisted.ok()).toBeTruthy();
    expect((await persisted.json()).order.status).toBe('CONTACTED');
  } finally {
    await winner.context.close();
    await seller.context.close();
  }
});
