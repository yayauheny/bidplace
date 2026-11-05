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

test('exports published cards and a retained receipt through the real API', async ({ commerce }) => {
  const { readFile } = await import('node:fs/promises');
  const { createHash } = await import('node:crypto');
  const { resolve } = await import('node:path');
  const cover = await readFile(resolve('e2e/fixtures/portfolio-photo-1.png'));
  await commerce.database.prisma.productImage.update({
    where: { id: commerce.fixture.approvedImageIds[0] },
    data: { data: cover, mimeType: 'image/png', byteLength: cover.length, checksum: createHash('sha256').update(cover).digest('hex'), width: 767, height: 1023 },
  });
  const seller = await commerce.actor(commerce.fixture.sellers.approved);
  const buyer = await commerce.actor(commerce.fixture.buyer);
  await buyer.page.addInitScript(() => {
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => false });
    Object.defineProperty(navigator, 'share', { configurable: true, value: async (data: ShareData) => {
      const file = data.files?.[0];
      if (!file) throw new Error('Missing file');
      Object.assign(window, { __liveSharedType: file.type });
    } });
  });
  const product = await commerce.database.prisma.product.findUniqueOrThrow({ where: { id: commerce.fixture.approvedProductId } });
  const fixed = await commerce.listing(seller.request, 'FIXED');
  await buyer.page.goto(`/product/${product.publicId}`);
  await buyer.page.getByRole('button', { name: 'Поделиться работой' }).click();
  const dialog = buyer.page.getByRole('dialog', { name: 'Поделиться' });
  let failCover = true;
  await buyer.page.route('**/api/images/**', async (route) => {
    if (failCover) { failCover = false; await route.abort('failed'); }
    else await route.continue();
  });
  await dialog.getByRole('button', { name: 'Подготовить изображение' }).click();
  await expect(dialog.getByText(/Не удалось подготовить обложку/)).toBeVisible();
  for (const [index, format] of ['История', 'Публикация', 'Квадрат', 'Оригинал'].entries()) {
    await dialog.getByRole('button', { name: format, exact: true }).click();
    await dialog.getByRole('button', { name: 'Подготовить изображение' }).click();
    await expect(dialog.getByRole('img', { name: 'Превью карточки' })).toBeVisible();
    await dialog.getByRole('button', { name: 'Подготовить файл' }).click();
    const share = dialog.getByRole('button', { name: 'Поделиться изображением' });
    if (index === 0) {
      const download = buyer.page.waitForEvent('download');
      await share.click();
      expect((await download).suggestedFilename()).toContain('.jpg');
      await buyer.page.evaluate(() => Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => true }));
    } else {
      await buyer.page.evaluate(() => Reflect.deleteProperty(window, '__liveSharedType'));
      await share.click();
      await expect.poll(() => buyer.page.evaluate(() => Reflect.get(window, '__liveSharedType'))).toBe('image/jpeg');
    }
  }
  await dialog.getByRole('button', { name: 'Закрыть окно' }).click();
  const purchased = await commerce.call(buyer.request, `/listings/${fixed.id}/purchase`, { idempotencyKey: 'live-export-purchase', turnstileToken: 'XXXX.DUMMY.TOKEN.XXXX' });
  const order = await purchased.json() as { order: { publicId: string } };
  await commerce.call(seller.request, `/orders/${order.order.publicId}/complete`, {});
  await commerce.call(seller.request, `/products/${product.id}`, undefined, 204, 'DELETE');
  const saved = await commerce.call(buyer.request, `/orders/${order.order.publicId}/receipt-data`);
  const snapshot = await saved.json() as { coverImageUrl: string | null };
  expect(snapshot.coverImageUrl).toBeTruthy();
  expect((await buyer.request.get(`${commerce.api.baseUrl}${snapshot.coverImageUrl}?source=true`)).status()).toBe(404);
  await buyer.page.goto(`/account/orders/${order.order.publicId}`);
  await buyer.page.evaluate(() => Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => true }));
  await buyer.page.getByRole('button', { name: 'Подготовить подтверждение' }).click();
  await buyer.page.getByRole('button', { name: 'Поделиться подтверждением' }).click();
  await expect.poll(() => buyer.page.evaluate(() => Reflect.get(window, '__liveSharedType'))).toBe('image/png');
});

test('an active auction card uses live pricing from the real API', async ({ commerce }) => {
  const seller = await commerce.actor(commerce.fixture.sellers.approved);
  const buyer = await commerce.actor(commerce.fixture.buyer);
  await commerce.listing(seller.request, 'AUCTION');
  const product = await commerce.database.prisma.product.findUniqueOrThrow({ where: { id: commerce.fixture.approvedProductId } });
  await buyer.page.addInitScript(() => {
    const original = CanvasRenderingContext2D.prototype.fillText;
    const texts: string[] = [];
    Object.assign(window, { __auctionTexts: texts });
    CanvasRenderingContext2D.prototype.fillText = function(text, x, y, maxWidth) {
      texts.push(text);
      if (maxWidth === undefined) return original.call(this, text, x, y);
      return original.call(this, text, x, y, maxWidth);
    };
  });
  await buyer.page.goto(`/product/${product.publicId}`);
  await buyer.page.getByRole('button', { name: 'Поделиться работой' }).click();
  const dialog = buyer.page.getByRole('dialog', { name: 'Поделиться' });
  await dialog.getByRole('button', { name: 'Подготовить изображение' }).click();
  await expect(dialog.getByRole('img', { name: 'Превью карточки' })).toBeVisible();
  expect(await buyer.page.evaluate(() => (Reflect.get(window, '__auctionTexts') as string[]).some((value) => value.startsWith('Ставка ')))).toBe(true);
});
