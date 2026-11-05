import { expect, test, type Page, type Route } from '@playwright/test';

import { installAccountPresentation } from './support/account-presentation-fixture';

const PUBLIC_ID = 'lotPanelW01';
const TITLE = 'Длинное название работы для проверки строки лота';
const checksum = 'a'.repeat(64);
const categoryId = '10000000-0000-4000-8000-000000000099';
const CLOCK = '2026-11-01T10:00:00.000Z';
let lotOrigin = Date.now();

function image(id: string) {
  return {
    id,
    position: 0,
    url: `/api/images/${id}`,
    mimeType: 'image/svg+xml',
    byteLength: 120,
    checksum,
    width: 390,
    height: 520,
  };
}

function workFixture() {
  const author = {
    id: '10000000-0000-4000-8000-000000000014',
    slug: 'motion-author',
    fullName: 'Анна Морозова',
    country: 'BY',
    city: 'Минск',
    discipline: 'Живопись',
    practice: null,
    profilePhotoUrl: '/api/sellers/motion-author/photo',
    telegramUrl: null,
    instagramUrl: null,
    websiteUrl: null,
    shortDescription: 'Короткая биография.',
    biography: null,
    achievements: [],
    sharePath: '/authors/motion-author',
  };
  return {
    work: {
      id: '20000000-0000-4000-8000-000000000021',
      publicId: PUBLIC_ID,
      title: TITLE,
      story: 'История этой работы остаётся на странице вместе с продажей.',
      categoryId,
      technique: 'Масло',
      materials: 'Холст',
      dimensions: '40x50',
      year: 1922,
      uniqueness: 'Единственный экземпляр',
      images: [image('30000000-0000-4000-8000-0000000000a1')],
      publishedAt: '2026-09-16T00:00:00.000Z',
      sharePath: `/works/${PUBLIC_ID}`,
      creationStory: {
        storyToken: 0,
        blocks: [
          {
            id: '40000000-0000-4000-8000-0000000000b1',
            type: 'PARAGRAPH',
            text: 'История этой работы остаётся на странице вместе с продажей.',
            position: 0,
          },
        ],
      },
    },
    author,
    relatedWorks: [],
  };
}

function liveLot(endsAt: string, priceMinor = 125000) {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    type: 'AUCTION',
    effectiveStatus: 'LIVE',
    currency: 'BYN',
    priceMinor,
    minimumBidMinor: priceMinor + 1000,
    bidCount: 2,
    startsAt: '2026-11-01T09:00:00.000Z',
    endsAt,
    contactWindowHours: 24,
    mark: 'AUCTION',
    serverNow: new Date(Date.parse(CLOCK) + Date.now() - lotOrigin).toISOString(),
    viewer: { role: 'buyer', isLeading: false, blockedReason: null },
  };
}

async function install(
  page: Page,
  lot: (route: Route) => Promise<unknown>,
) {
  const counts = { lot: 0, work: 0, commerceWrites: 0 };
  lotOrigin = Date.now();
  page.on('request', (request) => {
    if (request.method() === 'GET') return;
    const url = request.url();
    if (/\/api\/(works\/[^/]+\/lot|listings|bids|orders)/.test(url)) {
      counts.commerceWrites += 1;
    }
  });
  await page.route('**/api/**', (route) =>
    route.fulfill({ status: 404, json: { message: 'unmocked' } }),
  );
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({ status: 401, json: { message: 'Unauthorized' } }),
  );
  await page.route('**/api/categories', (route) =>
    route.fulfill({ json: { categories: [] } }),
  );
  await page.route('**/api/portfolio/facets', (route) =>
    route.fulfill({
      json: { materials: [], cities: ['Минск'], tags: ['Живопись'] },
    }),
  );
  await page.route('**/api/portfolio/home', (route) =>
    route.fulfill({
      json: { curatorSelection: null, newWorks: [], newAuthors: [] },
    }),
  );
  await page.route('**/api/analytics/events', (route) =>
    route.fulfill({ status: 204, body: '' }),
  );
  await page.route(`**/api/works/${PUBLIC_ID}`, (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith('/lot')) return route.fallback();
    counts.work += 1;
    return route.fulfill({ json: workFixture() });
  });
  await page.route('**/api/images/**', (route) =>
    route.fulfill({
      contentType: 'image/svg+xml',
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="390" height="520"/>',
    }),
  );
  await page.route(`**/api/works/${PUBLIC_ID}/lot`, async (route) => {
    counts.lot += 1;
    await lot(route);
  });
  return counts;
}

test('keeps the portfolio when the lot is empty and drops a stale sale tab', async ({
  page,
}) => {
  const counts = await install(page, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: 'null',
    }),
  );
  await page.goto(`/product/${PUBLIC_ID}?tab=delivery`);
  await expect(page.getByRole('heading', { level: 1, name: TITLE })).toBeVisible();
  await expect(page).not.toHaveURL(/tab=delivery/);
  await expect(page.getByRole('tab', { name: 'Как проходит сделка' })).toHaveCount(0);
  await expect(page.getByText('История этой работы остаётся на странице вместе с продажей.')).toBeVisible();
  expect(counts.work).toBe(1);
  expect(counts.commerceWrites).toBe(0);
});

test('shows a lot error and retries without replacing the work', async ({ page }) => {
  let failed = true;
  await install(page, (route) => {
    if (failed) {
      return route.fulfill({ status: 500, json: { message: 'failed' } });
    }
    return route.fulfill({ json: liveLot('2026-11-01T18:00:00.000Z') });
  });
  await page.goto(`/product/${PUBLIC_ID}`);
  await expect(page.getByRole('heading', { level: 1, name: TITLE })).toBeVisible();
  const retry = page.getByRole('button', { name: 'Повторить' });
  await expect(retry).toBeVisible();
  await retry.focus();
  await expect(retry).toBeFocused();
  failed = false;
  await page.keyboard.press('Enter');
  await expect(page.getByText('Текущая цена')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Сделать ставку' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'История ставок' })).toBeVisible();
});

test('polls a quiet live auction at most seven times in a minute', async ({ page }) => {
  const counts = await install(page, (route) =>
    route.fulfill({ json: liveLot('2026-11-01T18:00:00.000Z') }),
  );
  await page.goto(`/product/${PUBLIC_ID}`);
  await expect(page.getByText('Текущая цена')).toBeVisible();
  await page.waitForTimeout(60_000);
  expect(counts.lot).toBeGreaterThanOrEqual(5);
  expect(counts.lot).toBeLessThanOrEqual(7);
  expect(counts.work).toBe(1);
  expect(counts.commerceWrites).toBe(0);
});

test('polls the last two minutes faster and stops while hidden', async ({ page }) => {
  await page.addInitScript(() => {
    const starts: number[] = [];
    const original = window.fetch.bind(window);
    window.fetch = (input, init) => {
      const raw =
        typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      if (new URL(raw, window.location.origin).pathname.endsWith('/lot')) {
        starts.push(performance.now());
      }
      return original(input, init);
    };
    Object.assign(window, { __lotStarts: starts });
  });
  const counts = await install(page, (route) =>
    route.fulfill({ json: liveLot('2026-11-01T10:01:30.000Z') }),
  );
  await page.goto(`/product/${PUBLIC_ID}`);
  await expect(page.getByText('Текущая цена')).toBeVisible();
  const opened = counts.lot;
  await page.waitForTimeout(12_000);
  expect(counts.lot - opened).toBeGreaterThanOrEqual(3);
  expect(counts.lot - opened).toBeLessThanOrEqual(5);
  const seenBeforeHide = await page.evaluate(() => {
    const marks = window as Window & { __lotStarts?: number[] };
    return marks.__lotStarts?.length ?? 0;
  });
  expect(seenBeforeHide).toBe(counts.lot);
  await page.evaluate(() => {
    Object.assign(window, { __lotHiddenAt: performance.now() });
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'hidden',
    });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.waitForTimeout(12_000);
  const startedAfterHide = await page.evaluate(() => {
    const marks = window as Window & { __lotStarts?: number[]; __lotHiddenAt?: number };
    const hiddenAt = marks.__lotHiddenAt ?? 0;
    return (marks.__lotStarts ?? []).filter((start) => start >= hiddenAt);
  });
  expect(startedAfterHide).toEqual([]);
  expect(counts.work).toBe(1);
});

test('slows the poll outside the final window and speeds up inside it', async ({
  page,
}) => {
  const counts = await install(page, (route) =>
    route.fulfill({ json: liveLot('2026-11-01T10:02:20.000Z') }),
  );
  await page.goto(`/product/${PUBLIC_ID}`);
  await expect(page.getByText('Текущая цена')).toBeVisible();
  await page.waitForTimeout(12_000);
  const quiet = counts.lot;
  expect(quiet).toBeLessThanOrEqual(3);
  await page.waitForTimeout(21_000);
  expect(counts.lot - quiet).toBeGreaterThanOrEqual(4);
});

test('does not rapid-poll a scheduled lot that starts in 30 days', async ({ page }) => {
  const startsAt = new Date(Date.parse(CLOCK) + 30 * 24 * 60 * 60 * 1000).toISOString();
  const counts = await install(page, (route) =>
    route.fulfill({
      json: {
        ...liveLot(startsAt),
        type: 'AUCTION',
        effectiveStatus: 'SCHEDULED',
        mark: 'SCHEDULED',
        priceMinor: null,
        minimumBidMinor: 1000,
        bidCount: 0,
        startsAt,
        endsAt: null,
      },
    }),
  );
  await page.goto(`/product/${PUBLIC_ID}`);
  await expect(page.getByText(/Аукцион начнётся/)).toBeVisible();
  const opened = counts.lot;
  expect(opened).toBeGreaterThanOrEqual(1);
  expect(opened).toBeLessThanOrEqual(2);
  await page.waitForTimeout(8_000);
  expect(counts.lot).toBe(opened);
  expect(counts.work).toBe(1);
  expect(counts.commerceWrites).toBe(0);
});

for (const effectiveStatus of ['CANCELLED', 'ENDED'] as const) {
  test(`restores retry when a ${effectiveStatus} lot fails in the background`, async ({
    page,
  }) => {
    let fail = false;
    await install(page, (route) => {
      if (fail) return route.fulfill({ status: 500, json: { message: 'failed' } });
      return route.fulfill({
        json: {
          ...liveLot('2026-11-01T09:00:00.000Z', 99900),
          effectiveStatus,
          mark: null,
        },
      });
    });
    await page.goto(`/product/${PUBLIC_ID}`);
    await expect(page.getByRole('heading', { level: 1, name: TITLE })).toBeVisible();
    await expect(page.getByText('Данные продажи устарели.')).toHaveCount(0);
    await expect(page.getByText('999 BYN')).toHaveCount(0);
    await expect(page.getByRole('tab', { name: 'Как проходит сделка' })).toHaveCount(0);
    fail = true;
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get: () => 'hidden',
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get: () => 'visible',
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    const retry = page.getByRole('button', { name: 'Повторить' });
    await expect(page.getByText('Данные продажи устарели.')).toBeVisible();
    await expect(retry).toBeVisible();
    await expect(page.getByText('999 BYN')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Купить' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Сделать ставку' })).toHaveCount(0);
    await retry.click();
    await expect(page.getByText('Данные продажи устарели.')).toBeVisible();
    fail = false;
    await retry.click();
    await expect(page.getByText('Данные продажи устарели.')).toHaveCount(0);
    await expect(page.getByText('999 BYN')).toHaveCount(0);
    await expect(page.getByRole('tab', { name: 'Как проходит сделка' })).toHaveCount(0);
  });
}

test('shows an extension hint briefly and again after another extension', async ({
  page,
}) => {
  let endsAt = '2026-11-01T18:00:00.000Z';
  const counts = await install(page, (route) =>
    route.fulfill({ json: liveLot(endsAt) }),
  );
  await page.goto(`/product/${PUBLIC_ID}`);
  await expect(page.getByText('Текущая цена')).toBeVisible();
  const hint = page.getByText('Продлено на минуту: ставка в последние секунды');
  await expect(hint).toHaveCount(0);
  endsAt = new Date(Date.parse(endsAt) + 60_000).toISOString();
  await expect(hint).toBeVisible({ timeout: 15_000 });
  const shown = counts.lot;
  await expect(hint).toHaveCount(0, { timeout: 8_000 });
  expect(counts.lot).toBe(shown);
  endsAt = new Date(Date.parse(endsAt) + 60_000).toISOString();
  await expect(hint).toBeVisible({ timeout: 15_000 });
  expect(counts.commerceWrites).toBe(0);
});

test('does not restore an extension hint after a hidden return', async ({ page }) => {
  let endsAt = '2026-11-01T18:00:00.000Z';
  const counts = await install(page, (route) =>
    route.fulfill({ json: liveLot(endsAt) }),
  );
  await page.goto(`/product/${PUBLIC_ID}`);
  await expect(page.getByText('Текущая цена')).toBeVisible();
  endsAt = new Date(Date.parse(endsAt) + 60_000).toISOString();
  const hint = page.getByText('Продлено на минуту: ставка в последние секунды');
  await expect(hint).toBeVisible({ timeout: 15_000 });
  const shown = counts.lot;
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'hidden',
    });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.waitForTimeout(6_000);
  expect(counts.lot).toBe(shown);
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'visible',
    });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(hint).toHaveCount(0);
  await expect(page.getByText(/\d+ ч \d+ мин/)).toBeVisible();
  await expect.poll(() => counts.lot).toBeGreaterThan(shown);
  await expect(hint).toHaveCount(0);
  expect(counts.work).toBe(1);
  expect(counts.commerceWrites).toBe(0);
});

test('shows the sale at phone and desktop widths without a buy button', async ({
  page,
}) => {
  await install(page, (route) =>
    route.fulfill({
      json: liveLot('2026-11-01T18:00:00.000Z', 123_456_789),
    }),
  );
  await page.goto(`/product/${PUBLIC_ID}`);
  for (const width of [390, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const price = page.getByText(/1[\s\u00a0\u202f]*234[\s\u00a0\u202f]*567,89 BYN/);
    await expect(price).toBeVisible();
    const priceBox = await price.boundingBox();
    const tabsBox = await page.getByTestId('work-sticky-tabs').boundingBox();
    expect(priceBox && tabsBox && priceBox.y + priceBox.height <= tabsBox.y + 1).toBe(true);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth + 1,
      ),
    ).toBe(true);
  }
  await expect(page.getByRole('button', { name: 'Купить' })).toHaveCount(0);
  await page.getByRole('tab', { name: 'Как проходит сделка' }).click();
  await expect(page.getByText('Автор свяжется в течение 24 часа')).toBeVisible();
});

test('sends one bid when the sheet is submitted twice', async ({ page }) => {
  let bids = 0;
  let release: () => void = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await install(page, (route) =>
    route.fulfill({ json: liveLot('2026-11-01T18:00:00.000Z') }),
  );
  await page.route('**/api/listings/*/bids', async (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    bids += 1;
    const body = route.request().postDataJSON() as { amountMinor: number };
    await gate;
    const next = liveLot('2026-11-01T18:00:00.000Z', body.amountMinor);
    await route.fulfill({
      json: {
        bid: {
          id: '22222222-2222-4222-8222-222222222222',
          amountMinor: body.amountMinor,
          createdAt: CLOCK,
          participantLabel: 'Участник 3',
        },
        lot: {
          ...next,
          bidCount: 3,
          minimumBidMinor: body.amountMinor + 2500,
          viewer: { role: 'buyer', isLeading: true, blockedReason: 'BID_ALREADY_LEADING' },
        },
      },
    });
  });
  await page.goto(`/product/${PUBLIC_ID}`);
  await page.getByRole('button', { name: 'Сделать ставку' }).click();
  const submit = page.getByRole('dialog').getByRole('button', { name: 'Сделать ставку' });
  await submit.click();
  await expect.poll(() => bids).toBe(1);
  await submit.click({ force: true });
  expect(bids).toBe(1);
  release();
  await expect(page.getByText('Ваша ставка лидирует')).toBeVisible();
});

test('reserves a fixed lot once and opens the order', async ({ page }) => {
  let purchases = 0;
  let release: () => void = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const fixed = {
    id: '11111111-1111-4111-8111-111111111111',
    type: 'FIXED',
    effectiveStatus: 'LIVE',
    currency: 'BYN',
    priceMinor: 335_300,
    minimumBidMinor: null,
    bidCount: 0,
    startsAt: CLOCK,
    endsAt: null,
    contactWindowHours: 24,
    mark: 'BUY',
    serverNow: CLOCK,
    viewer: { role: 'buyer', isLeading: false, blockedReason: null },
  };
  let current = fixed;
  await install(page, (route) => route.fulfill({ json: current }));
  await page.route('**/api/listings/*/purchase', async (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    purchases += 1;
    await gate;
    current = { ...fixed, mark: 'RESERVED', effectiveStatus: 'ENDED' };
    await route.fulfill({
      json: {
        order: {
          publicId: 'orderPanel1',
          dealCode: '123456',
          status: 'ACTIVE',
          source: 'FIXED_PURCHASE',
          amountMinor: 335_300,
          currency: 'BYN',
          activatedAt: CLOCK,
          contactDeadlineAt: '2026-11-02T10:00:00.000Z',
          buyerComment: 'Можно вечером',
        },
        lot: { ...fixed, mark: 'RESERVED', effectiveStatus: 'ENDED' },
      },
    });
  });
  await page.goto(`/product/${PUBLIC_ID}`);
  await page.getByRole('button', { name: 'Купить' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('3 353 BYN')).toBeVisible();
  await expect(dialog.getByText('Автор свяжется с вами в течение 24 часа.')).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Предложить цену' })).toHaveCount(0);
  await dialog.getByLabel('Комментарий автору').fill('Можно вечером');
  const submit = dialog.getByRole('button', { name: 'Купить' });
  await submit.click();
  await expect.poll(() => purchases).toBe(1);
  await submit.click({ force: true });
  expect(purchases).toBe(1);
  release();
  await expect(page).toHaveURL(/orderPanel1/);
  await expect(page.getByText('Код сделки 123456')).toHaveCount(0);
});

test('opens contacts instead of buying when the buyer has none', async ({ page }) => {
  const counts = await install(page, (route) =>
    route.fulfill({
      json: {
        ...liveLot('2026-11-01T18:00:00.000Z'),
        type: 'FIXED',
        mark: 'BUY',
        minimumBidMinor: null,
        bidCount: 0,
        endsAt: null,
        viewer: {
          role: 'buyer',
          isLeading: false,
          blockedReason: 'BUYER_CONTACTS_REQUIRED',
        },
      },
    }),
  );
  await page.goto(`/product/${PUBLIC_ID}`);
  for (const width of [390, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const contacts = page.getByRole('button', { name: 'Указать контакты' });
    await expect(contacts).toBeVisible();
    await expect(page.getByRole('button', { name: 'Купить' })).toHaveCount(0);
    await contacts.focus();
    await expect(contacts).toBeFocused();
  }
  await page.getByRole('button', { name: 'Указать контакты' }).click();
  await expect(page).toHaveURL(/\/login/);
  await expect(page).toHaveURL(/contacts/);
  await expect(page).toHaveURL(new RegExp(PUBLIC_ID));
  expect(counts.commerceWrites).toBe(0);
});

test('opens sale creation for the matching author profile, whose id differs from the user', async ({ page }) => {
  await installAccountPresentation(page, { author: true });
  const fixture = workFixture();
  fixture.author.id = '22222222-2222-4222-8222-222222222222';
  await page.route(`**/api/works/${PUBLIC_ID}`, (route) => route.fulfill({ json: fixture }));
  await page.route(`**/api/works/${PUBLIC_ID}/lot`, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: 'null' }));
  await page.route('**/api/images/**', (route) => route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="390" height="520"/>' }));
  await page.goto(`/product/${PUBLIC_ID}?sell=1`);
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('textbox', { name: 'Цена', exact: true })).toBeEditable();
});

test('exports work cards in all four formats with a public link', async ({ page }, testInfo) => {
  const { readFile, writeFile } = await import('node:fs/promises');
  const { resolve } = await import('node:path');
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => true });
    Object.defineProperty(navigator, 'share', { configurable: true, value: async (data: ShareData) => {
      const file = data.files?.[0];
      if (!file) throw new Error('Missing shared file');
      const bytes = Array.from(new Uint8Array(await file.arrayBuffer()));
      const bitmap = await createImageBitmap(file);
      Object.assign(window, { __sharedCard: { bytes, url: data.url, type: file.type, width: bitmap.width, height: bitmap.height } });
      bitmap.close();
    } });
  });
  await install(page, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: 'null' }));
  const imageBytes = await readFile(resolve('assets/author-intro-collage.png'));
  await page.route('**/api/images/**', (route) => route.fulfill({ contentType: 'image/png', body: imageBytes, headers: { 'access-control-allow-origin': '*' } }));
  await page.goto(`/product/${PUBLIC_ID}`);
  await page.getByRole('button', { name: 'Поделиться работой' }).click();
  const dialog = page.getByRole('dialog', { name: 'Поделиться' });
  for (const format of ['История', 'Публикация', 'Квадрат', 'Оригинал']) {
    await dialog.getByRole('button', { name: format, exact: true }).click();
    await dialog.getByRole('button', { name: 'Подготовить изображение' }).click();
    await expect(dialog.getByRole('img', { name: 'Превью карточки' })).toBeVisible();
    await dialog.getByRole('button', { name: 'Подготовить файл' }).click();
    await page.evaluate(() => Reflect.deleteProperty(window, '__sharedCard'));
    await dialog.getByRole('button', { name: 'Поделиться изображением' }).click();
    await expect.poll(() => page.evaluate(() => Boolean(Reflect.get(window, '__sharedCard')))).toBe(true);
    const shared = await page.evaluate(() => Reflect.get(window, '__sharedCard') as { bytes: number[]; url: string; type: string; width: number; height: number });
    expect(shared.url).toContain(`/works/${PUBLIC_ID}`);
    expect(shared.type).toBe('image/jpeg');
    const expected = { 'История': [1080, 1920], 'Публикация': [1080, 1350], 'Квадрат': [1080, 1080] }[format];
    if (expected) expect([shared.width, shared.height]).toEqual(expected);
    else expect(Math.max(shared.width, shared.height)).toBeLessThanOrEqual(2048);
    expect(shared.bytes.length).toBeGreaterThan(1000);
    await writeFile(testInfo.outputPath(`${format}.jpg`), Buffer.from(shared.bytes));
  }
});

test('exports completed order confirmation with its retained cover', async ({ page }, testInfo) => {
  const { readFile, writeFile } = await import('node:fs/promises');
  const { resolve } = await import('node:path');
  await page.addInitScript(() => {
    const fill = CanvasRenderingContext2D.prototype.fillText;
    const texts: string[] = [];
    Object.assign(window, { __receiptTexts: texts });
    CanvasRenderingContext2D.prototype.fillText = function(text, x, y, maxWidth) {
      texts.push(text);
      if (maxWidth === undefined) return fill.call(this, text, x, y);
      return fill.call(this, text, x, y, maxWidth);
    };
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => true });
    Object.defineProperty(navigator, 'share', { configurable: true, value: async (data: ShareData) => {
      const file = data.files?.[0];
      if (!file) throw new Error('Missing shared file');
      Object.assign(window, { __receipt: Array.from(new Uint8Array(await file.arrayBuffer())) });
    } });
  });
  await installAccountPresentation(page);
  const orderId = 'order000001';
  const imageId = '30000000-0000-4000-8000-0000000000a1';
  let status: 'ACTIVE' | 'COMPLETED' = 'ACTIVE';
  await page.route(`**/api/orders/${orderId}`, (route) => route.fulfill({ json: {
    publicId: orderId, dealCode: '123456', status, source: 'FIXED_PURCHASE',
    amountMinor: 12500, currency: 'BYN', workTitle: 'Работа', workPublicId: PUBLIC_ID,
    coverImageUrl: `/api/images/${imageId}`, role: 'buyer', createdAt: CLOCK,
    contactDeadlineAt: null, offerExpiresAt: null,
    buyerComment: null, sellerNote: null, failReason: null, faultSide: null,
    completedAt: status === 'COMPLETED' ? CLOCK : null, failedAt: null, buyerContacts: null,
    sellerContacts: { email: 'private@example.invalid', phone: null, telegram: null, instagram: null, vk: null },
    sellerContactHint: null,
  } }));
  let receiptRequests = 0;
  await page.route(`**/api/orders/${orderId}/receipt-data`, (route) => {
    receiptRequests += 1;
    return route.fulfill({ json: { publicId: orderId, dealCode: '123456', workTitle: 'Работа', sellerNameSnapshot: 'Автор из снимка', amountMinor: 12500, currency: 'BYN', source: 'FIXED_PURCHASE', completedAt: CLOCK, coverImageUrl: `/api/images/${imageId}` } });
  });
  const imageBytes = await readFile(resolve('assets/author-intro-collage.png'));
  await page.route('**/api/images/**', (route) => route.fulfill({ contentType: 'image/png', body: imageBytes, headers: { 'access-control-allow-origin': 'http://127.0.0.1:8094', 'access-control-allow-credentials': 'true' } }));
  await page.goto(`/account/orders/${orderId}`);
  await expect(page.getByText('Ждёт связи')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Подготовить подтверждение' })).toHaveCount(0);
  status = 'COMPLETED';
  await page.reload();
  await expect(page.getByRole('button', { name: 'Подготовить подтверждение' })).toBeVisible();
  expect(receiptRequests).toBe(0);
  await page.getByRole('button', { name: 'Подготовить подтверждение' }).click();
  await page.getByRole('button', { name: 'Поделиться подтверждением' }).click();
  await expect.poll(() => page.evaluate(() => Boolean(Reflect.get(window, '__receipt')))).toBe(true);
  const bytes = await page.evaluate(() => Reflect.get(window, '__receipt') as number[]);
  const texts = await page.evaluate(() => Reflect.get(window, '__receiptTexts') as string[]);
  expect(receiptRequests).toBe(1);
  expect(texts.join(' ')).toContain('Автор из снимка');
  expect(texts.join(' ')).toContain('Не является кассовым чеком');
  expect(texts.join(' ')).not.toContain('private@example.invalid');
  expect(bytes.slice(0, 8)).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
  await writeFile(testInfo.outputPath('confirmation.png'), Buffer.from(bytes));
});
