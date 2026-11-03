import { test, expect } from './support/commerce-live';

test('fixed sale reaches a completed order through the real API and seller confirmation', async ({ commerce }) => {
  const seller = await commerce.actor(commerce.fixture.sellers.approved);
  const buyer = await commerce.actor(commerce.fixture.buyer);
  const product = await commerce.database.prisma.product.findUniqueOrThrow({ where: { id: commerce.fixture.approvedProductId } });
  await seller.page.goto(`/product/${product.publicId}?sell=1`);
  await seller.page.getByRole('dialog').getByRole('textbox', { name: 'Цена', exact: true }).fill('15');
  await seller.page.getByRole('dialog').getByRole('button', { name: 'Выставить', exact: true }).click();
  await expect(seller.page.getByRole('dialog')).toBeHidden();
  await buyer.page.goto(`/product/${product.publicId}`);
  await buyer.page.getByRole('button', { name: 'Купить', exact: true }).click();
  await buyer.page.getByRole('dialog').getByRole('button', { name: 'Купить', exact: true }).click();
  await expect(buyer.page).toHaveURL(/\/account\/orders\/[A-Za-z0-9_-]{11}$/);
  const order = await commerce.database.prisma.order.findFirstOrThrow({ where: { productId: product.id, status: 'ACTIVE' } });
  await buyer.page.goto(`/account/orders/${order.publicId}`);
  await expect(buyer.page.getByText('+375291110099', { exact: true })).toBeVisible();
  await seller.page.goto(`/account/orders/${order.publicId}`);
  await seller.page.getByRole('button', { name: 'Сделка состоялась', exact: true }).click();
  await seller.page.getByRole('dialog').getByRole('button', { name: 'Подтвердить', exact: true }).click();
  await expect(seller.page.getByText('Состоялась', { exact: true })).toBeVisible();
  const stored = await commerce.database.prisma.order.findUniqueOrThrow({ where: { publicId: order.publicId } });
  expect(stored.status).toBe('COMPLETED');
  expect(stored.completedAt).not.toBeNull();
  await buyer.page.reload();
  await expect(buyer.page.getByText('Состоялась', { exact: true })).toBeVisible();
});

test('auction closes, offers the next bidder after refusal, and reaches completion', async ({ commerce }) => {
  const seller = await commerce.actor(commerce.fixture.sellers.approved);
  const buyer = await commerce.actor(commerce.fixture.buyer);
  const winner = await commerce.actor(commerce.fixture.sellers.otherApproved);
  const listing = await commerce.listing(seller.request, 'AUCTION');
  const product = await commerce.database.prisma.product.findUniqueOrThrow({ where: { id: commerce.fixture.approvedProductId } });
  for (const [actor, amount] of [[buyer, '10'], [winner, '15']] as const) {
    await actor.page.goto(`/product/${product.publicId}`);
    await actor.page.getByRole('button', { name: 'Сделать ставку', exact: true }).click();
    const bid = actor.page.getByRole('dialog');
    await bid.getByRole('textbox', { name: 'Сумма ставки', exact: true }).fill(amount);
    await bid.getByRole('button', { name: 'Сделать ставку', exact: true }).click();
    await expect(bid).toBeHidden();
  }
  await commerce.database.prisma.$executeRaw`UPDATE listings SET ends_at = clock_timestamp() - interval '1 second' WHERE id = ${listing.id}::uuid`;
  await commerce.tick(seller.request);
  const won = await commerce.database.prisma.order.findFirstOrThrow({ where: { listingId: listing.id, status: 'ACTIVE' } });
  expect(won.buyerUserId).toBe(commerce.fixture.sellers.otherApproved.id);
  await commerce.call(winner.request, `/orders/${won.publicId}/fail`, { reason: 'BUYER_REFUSED', confirm: true });
  const offered = await commerce.call(seller.request, `/orders/${won.publicId}/offer-next`, {});
  const next = await offered.json() as { publicId: string; status: string };
  expect(next.status).toBe('OFFERED');
  await buyer.page.goto(`/account/orders/${next.publicId}`);
  await buyer.page.getByRole('button', { name: /^Принять за/ }).click();
  await expect(buyer.page.getByText('Ждёт связи', { exact: true })).toBeVisible();
  await commerce.call(seller.request, `/orders/${next.publicId}/complete`, {});
  await buyer.page.reload();
  await expect(buyer.page.getByText('Состоялась', { exact: true })).toBeVisible();
  const orders = await commerce.database.prisma.order.findMany({ where: { listingId: listing.id }, orderBy: { createdAt: 'asc' } });
  expect(orders.map((order) => order.status)).toEqual(['FAILED', 'COMPLETED']);
});

test('lost successful create and failed read preserve the form and recheck without a second POST', async ({ commerce }, testInfo) => {
  const seller = await commerce.actor(commerce.fixture.sellers.approved);
  const product = await commerce.database.prisma.product.findUniqueOrThrow({ where: { id: commerce.fixture.approvedProductId } });
  const page = seller.page;
  let posts = 0;
  let failedRead = false;
  await page.route(`**/api/works/${product.publicId}/lot`, async (route) => {
    if (failedRead) await route.abort('failed');
    else await route.continue();
  });
  await page.route(`**/api/works/${product.id}/listings`, async (route) => {
    posts += 1;
    const response = await route.fetch({ maxRetries: 0 });
    expect(response.status()).toBe(201);
    failedRead = true;
    await route.abort('timedout');
  });
  await page.goto(`/product/${product.publicId}?sell=1`);
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('textbox', { name: 'Цена', exact: true }).fill('15');
  await dialog.getByRole('button', { name: 'Выставить', exact: true }).click();
  await expect(dialog.getByText(/Результат создания пока неизвестен/)).toBeVisible();
  await expect(dialog.getByRole('textbox', { name: 'Цена', exact: true })).toHaveValue('15');
  await expect(dialog.getByRole('button', { name: 'Выставить', exact: true })).toBeDisabled();
  failedRead = false;
  const check = dialog.getByRole('button', { name: 'Проверить снова', exact: true });
  await check.focus();
  await page.keyboard.press('Enter');
  await expect(dialog.getByText(/Работа уже в продаже/)).toBeVisible();
  expect(posts).toBe(1);
  expect(await commerce.database.prisma.listing.count({ where: { productId: product.id } })).toBe(1);
  await page.screenshot({ path: testInfo.outputPath('recovered-sale.png') });
});
