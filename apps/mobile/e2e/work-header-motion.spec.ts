import { expect, test, type Page } from '@playwright/test';

const PUBLIC_ID = 'daliEstate1';
const ACTION_HEIGHT = 80;
const CONTROL_TOP = 12;
const CONTROL_SIZE = 48;
const CONTROL_INSET = 20;
const TABS_HEIGHT = 26;
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
      surfaceCount: count('sticky-dock-surface'),
      surfaceActive:
        document
          .querySelector('[data-testid="sticky-dock-surface"]')
          ?.getAttribute('data-active') === 'true',
      persistentBack: count('work-back') &&
        document.querySelector('[data-testid="work-back"]')?.getAttribute(
          'data-persistent',
        ) === 'work-back'
        ? 1
        : 0,
      persistentShare:
        document.querySelector('[data-testid="work-share"]')?.getAttribute(
          'data-persistent',
        ) === 'work-share'
          ? 1
          : 0,
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

async function stampActions(page: Page) {
  await page.evaluate(() => {
    const back = document.querySelector('[data-testid="work-back"]');
    const share = document.querySelector('[data-testid="work-share"]');
    if (back instanceof HTMLElement) {
      back.dataset.persistent = 'work-back';
    }
    if (share instanceof HTMLElement) {
      share.dataset.persistent = 'work-share';
    }
  });
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
  expect(metrics.compactNavCount).toBe(0);
  expect(metrics.galleryChromeCount).toBe(0);
  expect(metrics.surfaceCount).toBe(1);
}

function expectPinnedControls(
  metrics: Awaited<ReturnType<typeof workMetrics>>,
  viewportWidth: number,
) {
  expect(metrics.back?.width).toBeCloseTo(CONTROL_SIZE, 0);
  expect(metrics.back?.height).toBeCloseTo(CONTROL_SIZE, 0);
  expect(metrics.back?.x).toBeCloseTo(CONTROL_INSET, 0);
  expect(metrics.back?.y).toBeCloseTo(CONTROL_TOP, 0);
  expect(metrics.share?.width).toBeCloseTo(CONTROL_SIZE, 0);
  expect(metrics.share?.height).toBeCloseTo(CONTROL_SIZE, 0);
  expect(metrics.share?.y).toBeCloseTo(CONTROL_TOP, 0);
  expect((metrics.share?.x ?? 0) + (metrics.share?.width ?? 0)).toBeCloseTo(
    viewportWidth - CONTROL_INSET,
    0,
  );
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
    expect(rest.state).toBe('overlay');
    expect(rest.surfaceActive).toBe(false);
    expectOneActions(rest);
    expectPinnedControls(rest, 390);
    expect(rest.media?.y).toBeCloseTo(0, 0);
    expect(rest.media?.height).toBeCloseTo(520, 0);
    expect(rest.dots?.y).toBeCloseTo(532, 0);
    expect(rest.dots?.height).toBeCloseTo(6, 0);
    expect(rest.identity?.y).toBeCloseTo((rest.dots?.bottom ?? 0) + 20, 0);
    expect(rest.tabs?.y).toBeCloseTo((rest.identity?.bottom ?? 0) + 40, 0);
    expect(rest.tabs?.height).toBeCloseTo(TABS_HEIGHT, 0);
    expect(rest.firstTab?.x).toBeCloseTo(12, 0);
    expect(rest.tablist?.x).toBeCloseTo(0, 0);
    expect(rest.tablist?.width).toBeCloseTo(390, 0);
    expect(rest.overflow).toBe(false);
    await expect(page.getByRole('tab', { name: 'История', exact: true })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Детали', exact: true })).toBeVisible();
    await expect(
      page.getByRole('tab', { name: 'Оплата и доставка', exact: true }),
    ).toBeVisible();
    await expect(page.getByRole('tab', { name: /Торги/ })).toHaveCount(0);
  });

  test('keeps the same Back and Share pinned while tabs are still travelling', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 860 });
    await mockWork(page);
    await page.goto(`/product/${PUBLIC_ID}`);
    await waitForHeader(page);
    await stampActions(page);
    await addWorkSpacer(page);
    const rest = await workMetrics(page);
    const midScroll = Math.min(
      200,
      Math.max(40, Math.round((rest.tabs?.y ?? 200) - ACTION_HEIGHT - 80)),
    );
    await scrollWork(page, midScroll);
    const mid = await workMetrics(page);
    expectOneActions(mid);
    expect(mid.persistentBack).toBe(1);
    expect(mid.persistentShare).toBe(1);
    expectPinnedControls(mid, 390);
    expect(mid.state).toBe('overlay');
    expect(mid.surfaceActive).toBe(false);
    expect(mid.tabs?.y ?? 0).toBeGreaterThan(ACTION_HEIGHT + 8);
    expect(mid.firstTab?.x).toBeCloseTo(12, 0);
    await expect(page.getByRole('tab', { name: 'История', exact: true })).toBeVisible();
  });

  test('joins tabs under Back and Share without remounting actions', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 860 });
    await mockWork(page);
    await page.goto(`/product/${PUBLIC_ID}`);
    await waitForHeader(page);
    await stampActions(page);
    await addWorkSpacer(page);
    const rest = await workMetrics(page);
    const dockScroll = Math.ceil((rest.tabs?.y ?? 0) - ACTION_HEIGHT);
    await scrollWork(page, Math.max(0, dockScroll - 24));
    const approaching = await workMetrics(page);
    expectOneActions(approaching);
    expect(approaching.state).toBe('overlay');
    expect(approaching.surfaceActive).toBe(false);
    expect(approaching.tabs?.y ?? 0).toBeGreaterThan(ACTION_HEIGHT);
    await scrollWork(page, dockScroll);
    await expect
      .poll(async () => Math.round((await workMetrics(page)).tabs?.y ?? -1), {
        timeout: 1500,
      })
      .toBe(ACTION_HEIGHT);
    await expect
      .poll(async () => (await workMetrics(page)).surfaceActive, {
        timeout: 1500,
      })
      .toBe(true);
    const docked = await workMetrics(page);
    expectOneActions(docked);
    expect(docked.persistentBack).toBe(1);
    expect(docked.persistentShare).toBe(1);
    expectPinnedControls(docked, 390);
    expect(docked.state).toBe('docked');
    expect(docked.surfaceActive).toBe(true);
    expect(docked.tabs?.y).toBeCloseTo(ACTION_HEIGHT, 0);
    expect(docked.tabs?.height).toBeCloseTo(TABS_HEIGHT, 0);
    expect(docked.firstTab?.x).toBeCloseTo(12, 0);
    expect(docked.tablist?.x).toBeCloseTo(0, 0);
    expect(docked.tablist?.width).toBeCloseTo(390, 0);
    await expect(page.getByRole('tab', { name: 'История', exact: true })).toBeVisible();
  });

  test('lets tabs leave on reverse while Back and Share stay', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 860 });
    await mockWork(page);
    await page.goto(`/product/${PUBLIC_ID}`);
    await waitForHeader(page);
    await stampActions(page);
    await addWorkSpacer(page);
    const rest = await workMetrics(page);
    const dockScroll = Math.ceil((rest.tabs?.y ?? 0) - ACTION_HEIGHT);
    await scrollWork(page, dockScroll + 40);
    await expect
      .poll(async () => Math.round((await workMetrics(page)).tabs?.y ?? -1), {
        timeout: 1500,
      })
      .toBe(ACTION_HEIGHT);
    await scrollWork(page, 0);
    await expect
      .poll(async () => Math.round((await workMetrics(page)).tabs?.y ?? -1), {
        timeout: 1500,
      })
      .toBe(Math.round(rest.tabs?.y ?? 0));
    await expect
      .poll(async () => (await workMetrics(page)).surfaceActive, {
        timeout: 1500,
      })
      .toBe(false);
    const expanded = await workMetrics(page);
    expectOneActions(expanded);
    expect(expanded.persistentBack).toBe(1);
    expect(expanded.persistentShare).toBe(1);
    expectPinnedControls(expanded, 390);
    expect(expanded.state).toBe('overlay');
    expect(expanded.surfaceActive).toBe(false);
    expect(expanded.media?.y).toBeCloseTo(0, 0);
    expect(expanded.firstTab?.x).toBeCloseTo(12, 0);
    await expect(page.getByRole('tab', { name: 'Детали', exact: true })).toBeVisible();
  });

  test('keeps one action pair across fast reverse jumps', async ({ page }) => {
    await page.setViewportSize({ width: 384, height: 832 });
    await mockWork(page);
    await page.goto(`/product/${PUBLIC_ID}`);
    await waitForHeader(page);
    await stampActions(page);
    await addWorkSpacer(page);
    const rest = await workMetrics(page);
    const dockScroll = Math.ceil((rest.tabs?.y ?? 0) - ACTION_HEIGHT);
    await scrollWork(page, dockScroll + 80);
    const frames = await page.evaluate(async (handoff) => {
      const labeled = document.querySelector('[data-testid="product-scroll-view"]');
      if (!(labeled instanceof HTMLElement)) {
        throw new Error('missing product-scroll-view');
      }
      const port =
        [labeled, ...labeled.querySelectorAll<HTMLElement>('*')].find(
          (node) => node.scrollHeight > node.clientHeight + 1,
        ) ?? labeled;
      const sample = () => ({
        backCount: document.querySelectorAll('[data-testid="work-back"]').length,
        shareCount: document.querySelectorAll('[data-testid="work-share"]').length,
        compactNavCount: document.querySelectorAll(
          '[data-testid="work-compact-nav"]',
        ).length,
        surfaceCount: document.querySelectorAll(
          '[data-testid="sticky-dock-surface"]',
        ).length,
        persistentBack:
          document.querySelector('[data-testid="work-back"]')?.getAttribute(
            'data-persistent',
          ) === 'work-back'
            ? 1
            : 0,
        tabsY: document
          .querySelector('[data-testid="work-sticky-tabs"]')
          ?.getBoundingClientRect().y ?? 0,
        scrollTop: port.scrollTop,
      });
      const frames = [sample()];
      for (const top of [
        Math.max(0, handoff - 73),
        Math.max(0, handoff - 227),
        Math.max(0, handoff - 380),
      ]) {
        port.scrollTop = top;
        port.dispatchEvent(new Event('scroll', { bubbles: false }));
        await new Promise((resolve) => requestAnimationFrame(resolve));
        frames.push(sample());
      }
      for (let extra = 0; extra < 6; extra += 1) {
        await new Promise((resolve) => requestAnimationFrame(resolve));
        frames.push(sample());
      }
      return frames;
    }, dockScroll);
    expect(frames.length).toBeGreaterThan(3);
    for (const frame of frames) {
      expect(frame.backCount).toBe(1);
      expect(frame.shareCount).toBe(1);
      expect(frame.compactNavCount).toBe(0);
      expect(frame.surfaceCount).toBe(1);
      expect(frame.persistentBack).toBe(1);
    }
    await scrollWork(page, 0);
    await expect
      .poll(async () => (await workMetrics(page)).surfaceActive, {
        timeout: 1500,
      })
      .toBe(false);
    const restAgain = await workMetrics(page);
    expectOneActions(restAgain);
    expect(restAgain.state).toBe('overlay');
    expect(restAgain.surfaceActive).toBe(false);
    expectPinnedControls(restAgain, 384);
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
    const rest = await workMetrics(page);
    const dockScroll = Math.ceil((rest.tabs?.y ?? 0) - ACTION_HEIGHT);
    await scrollWork(page, dockScroll);
    await expect
      .poll(async () => Math.round((await workMetrics(page)).tabs?.y ?? -1), {
        timeout: 1500,
      })
      .toBe(ACTION_HEIGHT);
    await expect
      .poll(async () => (await workMetrics(page)).surfaceActive, {
        timeout: 1500,
      })
      .toBe(true);
    const docked = await workMetrics(page);
    expectOneActions(docked);
    expect(docked.surfaceActive).toBe(true);
    expectPinnedControls(docked, 384);
    expect(docked.tabs?.y).toBeCloseTo(ACTION_HEIGHT, 0);
    expect(docked.overflow).toBe(false);
  });

  test('deactivates the dock surface on slow reverse', async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 384, height: 832 });
    await mockWork(page);
    await page.goto(`/product/${PUBLIC_ID}`);
    await waitForHeader(page);
    await stampActions(page);
    await addWorkSpacer(page);
    const rest = await workMetrics(page);
    expect(rest.state).toBe('overlay');
    expect(rest.surfaceActive).toBe(false);
    const result = await page.evaluate(async (actionHeight) => {
      const header = document.querySelector(
        '[data-testid="work-sticky-header"]',
      );
      const labeled = document.querySelector(
        '[data-testid="product-scroll-view"]',
      );
      const tabs = document.querySelector('[data-testid="work-sticky-tabs"]');
      const surface = header?.querySelector(
        '[data-testid="sticky-dock-surface"]',
      );
      if (
        !(header instanceof HTMLElement) ||
        !(labeled instanceof HTMLElement) ||
        !(tabs instanceof HTMLElement) ||
        !(surface instanceof HTMLElement)
      ) {
        throw new Error('missing work dock nodes');
      }
      const port =
        [labeled, ...labeled.querySelectorAll<HTMLElement>('*')].find(
          (node) => node.scrollHeight > node.clientHeight + 1,
        ) ?? labeled;
      const frame = () =>
        new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      const sample = () => ({
        surfaceActive: surface.getAttribute('data-active') === 'true',
        state: header.getAttribute('data-state'),
        tabsY: tabs.getBoundingClientRect().y,
        backCount: document.querySelectorAll('[data-testid="work-back"]').length,
        shareCount: document.querySelectorAll('[data-testid="work-share"]')
          .length,
      });
      const restTabs = tabs.getBoundingClientRect().y;
      port.scrollTop = Math.max(0, Math.ceil(restTabs - actionHeight - 32));
      await frame();
      let guard = 0;
      let docked = sample();
      while (docked.tabsY > actionHeight || !docked.surfaceActive) {
        port.scrollTop += 2;
        await frame();
        docked = sample();
        if (
          ++guard > 2000 ||
          port.scrollTop >= port.scrollHeight - port.clientHeight
        ) {
          break;
        }
      }
      let leftDock = false;
      let stuckAfterLeave = false;
      while (port.scrollTop > 0) {
        port.scrollTop = Math.max(0, port.scrollTop - 2);
        await frame();
        const current = sample();
        if (current.tabsY <= actionHeight + 4) {
          continue;
        }
        if (!leftDock) {
          leftDock = true;
          await frame();
          if (sample().surfaceActive) {
            stuckAfterLeave = true;
          }
          continue;
        }
        if (current.surfaceActive) {
          stuckAfterLeave = true;
        }
      }
      await frame();
      return { docked, leftDock, stuckAfterLeave, rest: sample() };
    }, ACTION_HEIGHT);
    expect(result.docked.surfaceActive).toBe(true);
    expect(result.docked.state).toBe('docked');
    expect(Math.round(result.docked.tabsY)).toBe(ACTION_HEIGHT);
    expect(result.leftDock).toBe(true);
    expect(result.stuckAfterLeave).toBe(false);
    expect(result.rest.surfaceActive).toBe(false);
    expect(result.rest.state).toBe('overlay');
    expect(result.rest.backCount).toBe(1);
    expect(result.rest.shareCount).toBe(1);
    const expanded = await workMetrics(page);
    expectOneActions(expanded);
    expectPinnedControls(expanded, 384);
    expect(expanded.persistentBack).toBe(1);
    expect(expanded.persistentShare).toBe(1);
  });
});
