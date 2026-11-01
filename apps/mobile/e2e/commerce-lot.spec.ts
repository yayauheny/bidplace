import { expect, test, type Page, type Route } from '@playwright/test';

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
  await expect(page.getByRole('button', { name: 'Сделать ставку' })).toHaveCount(0);
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
  const lotAt: number[] = [];
  page.on('request', (request) => {
    const path = new URL(request.url()).pathname;
    if (path.endsWith('/lot')) lotAt.push(Date.now());
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
  const hideStarted = Date.now();
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'hidden',
    });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.waitForTimeout(12_000);
  expect(lotAt.filter((time) => time - hideStarted > 1_000)).toEqual([]);
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
