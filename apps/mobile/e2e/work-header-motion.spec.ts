import { expect, test, type Page } from '@playwright/test';

const PUBLIC_ID = 'daliEstate1';
const WEB_COMPACT_STACK = 12 + 48 + 20;
const IMAGE_A = '30000000-0000-4000-8000-0000000000a1';
const IMAGE_B = '30000000-0000-4000-8000-0000000000a2';
const checksum = 'a'.repeat(64);
const categoryId = '10000000-0000-4000-8000-000000000099';

function image(id: string, position: number) {
  return {
    id,
    position,
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
  const work = {
    id: '20000000-0000-4000-8000-000000000021',
    publicId: PUBLIC_ID,
    title: 'The First Days of Spring in Cadaqués, 1922',
    story:
      'Первый абзац истории работы для проверки вкладок.\n\nВторой абзац, чтобы страница точно скроллилась ниже галереи и шапки.\n\nТретий абзац длинной истории: материалы, место и связь автора с этой работой, чтобы sticky tabs проверялись на длинном контенте.',
    categoryId,
    technique: 'Масло',
    materials: 'Холст',
    dimensions: '40x50',
    year: 1922,
    uniqueness: 'Единственный экземпляр',
    images: [image(IMAGE_A, 0), image(IMAGE_B, 1)],
    publishedAt: '2026-09-16T00:00:00.000Z',
    sharePath: `/works/${PUBLIC_ID}`,
  };
  return {
    work,
    author,
    relatedWorks: [
      {
        work: {
          ...work,
          id: '20000000-0000-4000-8000-000000000022',
          publicId: 'motionWork1',
          title: 'Другая работа',
          sharePath: '/works/motionWork1',
          images: [image('30000000-0000-4000-8000-0000000000a3', 0)],
        },
        author,
      },
    ],
  };
}

async function mockWork(page: Page) {
  const payload = workFixture();
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
  await page.route(`**/api/works/${PUBLIC_ID}`, (route) =>
    route.fulfill({ json: payload }),
  );
  await page.route('**/api/images/**', (route) =>
    route.fulfill({
      contentType: 'image/svg+xml',
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="366" height="488"><rect width="366" height="488" fill="#888888"/></svg>',
    }),
  );
}

async function workMetrics(page: Page) {
  return page.evaluate(() => {
    const header = document.querySelector('[data-testid="work-sticky-header"]');
    const labeled = document.querySelector('[data-testid="product-scroll-view"]');
    const tabs = document.querySelector('[data-testid="work-sticky-tabs"]');
    const gallery = document.querySelector('[data-testid="work-gallery"]');
    const media = document.querySelector('[data-testid="work-gallery-media"]');
    const identity = document.querySelector('[data-testid="work-identity"]');
    const dots = document.querySelector('[data-testid="work-gallery-dots"]');
    const box = (testId: string) =>
      document
        .querySelector(`[data-testid="${testId}"]`)
        ?.getBoundingClientRect()
        .toJSON();
    const count = (testId: string) =>
      document.querySelectorAll(`[data-testid="${testId}"]`).length;
    const port = labeled
      ? [labeled, ...labeled.querySelectorAll<HTMLElement>('*')].find(
          (node) => node.scrollHeight > node.clientHeight + 1,
        ) ?? labeled
      : null;
    const firstTab = document.querySelector('[role="tab"]');
    const tablist = document.querySelector('[role="tablist"]');
    return {
      state: header?.getAttribute('data-state'),
      scrollTop: port instanceof HTMLElement ? port.scrollTop : 0,
      backCount: count('work-back'),
      shareCount: count('work-share'),
      compactNavCount: count('work-compact-nav'),
      galleryChromeCount: count('work-gallery-chrome'),
      back: box('work-back'),
      share: box('work-share'),
      gallery: gallery?.getBoundingClientRect().toJSON(),
      media: media?.getBoundingClientRect().toJSON(),
      identity: identity?.getBoundingClientRect().toJSON(),
      dots: dots?.getBoundingClientRect().toJSON(),
      tabs: tabs?.getBoundingClientRect().toJSON(),
      firstTab: firstTab?.getBoundingClientRect().toJSON(),
      tablist: tablist?.getBoundingClientRect().toJSON(),
      overflow: document.body.scrollWidth > window.innerWidth,
      galleryCaption:
        document
          .querySelector('[data-testid="work-gallery-dots"]')
          ?.getAttribute('aria-label') ?? '',
    };
  });
}

async function waitForHeader(page: Page) {
  await expect(page.getByTestId('work-sticky-header')).toBeVisible();
  await expect(page.getByTestId('work-back')).toBeVisible();
  await expect(page.getByTestId('work-share')).toBeVisible();
}

async function waitForState(page: Page, state: 'expanded' | 'compact') {
  await expect
    .poll(async () => (await workMetrics(page)).state, { timeout: 4000 })
    .toBe(state);
}

async function scrollWork(page: Page, top: number) {
  await page.evaluate((nextTop) => {
    const labeled = document.querySelector('[data-testid="product-scroll-view"]');
    if (!(labeled instanceof HTMLElement)) {
      throw new Error('missing product-scroll-view');
    }
    const port =
      [labeled, ...labeled.querySelectorAll<HTMLElement>('*')].find(
        (node) => node.scrollHeight > node.clientHeight + 1,
      ) ?? labeled;
    port.scrollTop = nextTop;
    port.dispatchEvent(new Event('scroll', { bubbles: false }));
  }, top);
}

async function measureHandoff(page: Page) {
  return page.evaluate(() => {
    const hero = document.querySelector('[data-testid="work-hero"]');
    if (!(hero instanceof HTMLElement)) {
      throw new Error('missing work-hero');
    }
    const heroHeight = hero.offsetHeight;
    return {
      heroHeight,
      handoffOffset: heroHeight,
    };
  });
}

async function addWorkSpacer(page: Page) {
  await page.evaluate(() => {
    const labeled = document.querySelector('[data-testid="product-scroll-view"]');
    if (!(labeled instanceof HTMLElement)) {
      throw new Error('missing product-scroll-view');
    }
    const spacer = document.createElement('div');
    spacer.dataset.testid = 'delayed-spacer';
    spacer.style.height = '2400px';
    (labeled.lastElementChild ?? labeled).append(spacer);
  });
}

function expectOneActions(metrics: Awaited<ReturnType<typeof workMetrics>>) {
  expect(metrics.backCount).toBe(1);
  expect(metrics.shareCount).toBe(1);
}

async function swipeGallery(page: Page) {
  await page.evaluate(() => {
    const gallery = document.querySelector('[data-testid="work-gallery"]');
    if (!(gallery instanceof HTMLElement)) {
      throw new Error('missing work-gallery');
    }
    const scroller = [gallery, ...gallery.querySelectorAll<HTMLElement>('*')].find(
      (node) => node.scrollWidth > node.clientWidth + 1,
    );
    if (!scroller) {
      throw new Error('missing gallery scroller');
    }
    scroller.scrollLeft = scroller.clientWidth;
    scroller.dispatchEvent(new Event('scroll', { bubbles: true }));
  });
}

test.describe('work header motion', () => {
  test('shows one Back and Share at expanded rest geometry', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 860 });
    await mockWork(page);
    await page.goto(`/product/${PUBLIC_ID}`);
    await waitForHeader(page);
    const rest = await workMetrics(page);
    expect(rest.state).toBe('expanded');
    expectOneActions(rest);
    expect(rest.back?.width).toBeCloseTo(48, 0);
    expect(rest.back?.height).toBeCloseTo(48, 0);
    expect(rest.back?.x).toBeCloseTo(20, 0);
    expect(rest.back?.y).toBeCloseTo(12, 0);
    expect(rest.share?.width).toBeCloseTo(48, 0);
    expect(rest.share?.height).toBeCloseTo(48, 0);
    expect((rest.share?.x ?? 0) + (rest.share?.width ?? 0)).toBeCloseTo(370, 0);
    expect(rest.share?.y).toBeCloseTo(12, 0);
    expect(rest.media?.y).toBeCloseTo(0, 0);
    expect(rest.media?.height).toBeCloseTo(520, 0);
    expect(rest.dots?.y).toBeCloseTo(532, 0);
    expect(rest.dots?.height).toBeCloseTo(6, 0);
    expect(rest.identity?.y).toBeCloseTo((rest.dots?.bottom ?? 0) + 20, 0);
    expect(rest.tabs?.y).toBeCloseTo((rest.identity?.bottom ?? 0) + 40, 0);
    expect(rest.firstTab?.x).toBeCloseTo(12, 0);
    expect(rest.tablist?.x).toBeCloseTo(0, 0);
    expect(rest.tablist?.width).toBeCloseTo(390, 0);
    expect(rest.compactNavCount).toBe(0);
    expect(rest.galleryChromeCount).toBe(1);
    expect(rest.overflow).toBe(false);
    await expect(page.getByRole('tab', { name: 'История', exact: true })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Детали', exact: true })).toBeVisible();
    await expect(
      page.getByRole('tab', { name: 'Оплата и доставка', exact: true }),
    ).toBeVisible();
    await expect(page.getByRole('tab', { name: /Торги/ })).toHaveCount(0);
  });

  test('parks compact navigation only after metadata has left', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 860 });
    await mockWork(page);
    await page.goto(`/product/${PUBLIC_ID}`);
    await waitForHeader(page);
    await addWorkSpacer(page);
    const { heroHeight, handoffOffset } = await measureHandoff(page);
    expect(handoffOffset).toBe(heroHeight);
    expect(handoffOffset).toBeGreaterThan(100);

    await scrollWork(page, Math.max(0, handoffOffset - 1));
    const before = await workMetrics(page);
    expect(before.state).toBe('expanded');
    expect(before.compactNavCount).toBe(0);
    expect(before.identity?.bottom ?? 0).toBeLessThanOrEqual(0);
    expect(before.tabs?.y ?? 99).toBeLessThan(8);
    expect(before.firstTab?.x).toBeCloseTo(12, 0);
    expect(before.tablist?.x).toBeCloseTo(0, 0);
    await expect(page.getByRole('tab', { name: 'История', exact: true })).toBeVisible();

    await scrollWork(page, handoffOffset);
    await waitForState(page, 'compact');
    await expect
      .poll(async () => Math.round((await workMetrics(page)).scrollTop), {
        timeout: 1500,
      })
      .toBe(handoffOffset);
    await expect
      .poll(async () => Math.round((await workMetrics(page)).back?.y ?? -1), {
        timeout: 1500,
      })
      .toBe(12);
    await expect
      .poll(async () => Math.round((await workMetrics(page)).tabs?.y ?? -1), {
        timeout: 1500,
      })
      .toBe(WEB_COMPACT_STACK);
    const compact = await workMetrics(page);
    expectOneActions(compact);
    expect(compact.compactNavCount).toBe(1);
    expect(compact.galleryChromeCount).toBe(0);
    expect(compact.identity?.bottom ?? 0).toBeLessThanOrEqual(0);
    expect(compact.back?.width).toBeCloseTo(48, 0);
    expect(compact.back?.x).toBeCloseTo(20, 0);
    expect(compact.share?.y).toBeCloseTo(12, 0);
    expect((compact.share?.x ?? 0) + (compact.share?.width ?? 0)).toBeCloseTo(
      370,
      0,
    );
    expect(compact.tabs?.y).toBeCloseTo(WEB_COMPACT_STACK, 0);
    expect(compact.firstTab?.x).toBeCloseTo(12, 0);
    expect(compact.tablist?.x).toBeCloseTo(0, 0);
    expect(compact.tablist?.width).toBeCloseTo(390, 0);
    await expect(page.getByRole('tab', { name: 'История', exact: true })).toBeVisible();
  });

  test('restores expanded Back and Share on reverse without losing tabs', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 860 });
    await mockWork(page);
    await page.goto(`/product/${PUBLIC_ID}`);
    await waitForHeader(page);
    await addWorkSpacer(page);
    const { handoffOffset } = await measureHandoff(page);
    await scrollWork(page, handoffOffset + 30);
    await waitForState(page, 'compact');
    const samples: number[] = [];
    for (let top = handoffOffset; top >= 0; top -= 20) {
      await scrollWork(page, top);
      const live = await workMetrics(page);
      samples.push(live.tabs?.height ?? 0);
      expect(live.tabs?.height ?? 0).toBeGreaterThan(20);
    }
    await scrollWork(page, 0);
    await waitForState(page, 'expanded');
    await expect
      .poll(async () => (await workMetrics(page)).compactNavCount, {
        timeout: 1500,
      })
      .toBe(0);
    await expect
      .poll(async () => Math.round((await workMetrics(page)).back?.y ?? -1), {
        timeout: 1500,
      })
      .toBe(12);
    const expanded = await workMetrics(page);
    expectOneActions(expanded);
    expect(expanded.compactNavCount).toBe(0);
    expect(expanded.galleryChromeCount).toBe(1);
    expect(expanded.back?.x).toBeCloseTo(20, 0);
    expect(expanded.firstTab?.x).toBeCloseTo(12, 0);
    expect(Math.min(...samples)).toBeGreaterThan(20);
    await expect(page.getByRole('tab', { name: 'Детали', exact: true })).toBeVisible();
  });

  test('keeps gallery swipe after the header mounts', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 860 });
    await mockWork(page);
    await page.goto(`/product/${PUBLIC_ID}`);
    await waitForHeader(page);
    await expect
      .poll(async () => (await workMetrics(page)).galleryCaption)
      .toBe('Фото 1 из 2');
    await swipeGallery(page);
    await expect
      .poll(async () => (await workMetrics(page)).galleryCaption)
      .toBe('Фото 2 из 2');
    expectOneActions(await workMetrics(page));
  });

  test('does not overflow at 390 or compact 384', async ({ page }) => {
    await mockWork(page);
    await page.setViewportSize({ width: 390, height: 860 });
    await page.goto(`/product/${PUBLIC_ID}`);
    await waitForHeader(page);
    expect((await workMetrics(page)).overflow).toBe(false);

    await page.setViewportSize({ width: 384, height: 860 });
    await addWorkSpacer(page);
    const { handoffOffset } = await measureHandoff(page);
    await scrollWork(page, handoffOffset);
    await waitForState(page, 'compact');
    await expect
      .poll(async () => Math.round((await workMetrics(page)).back?.y ?? -1), {
        timeout: 1500,
      })
      .toBe(12);
    const compact = await workMetrics(page);
    expectOneActions(compact);
    expect(compact.back?.x).toBeCloseTo(20, 0);
    expect((compact.share?.x ?? 0) + (compact.share?.width ?? 0)).toBeCloseTo(
      364,
      0,
    );
    expect(compact.tabs?.y).toBeCloseTo(WEB_COMPACT_STACK, 0);
    expect(compact.overflow).toBe(false);
  });
});
