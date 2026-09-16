import { expect, test, type Page } from '@playwright/test';

const ACTION_HEIGHT = 80;
const WEB_COMPACT_AVATAR_Y = 12;
const checksum = 'a'.repeat(64);
const categoryId = '10000000-0000-4000-8000-000000000099';

function authorFixture(slug: string, socials: 0 | 2 | 3, works: number) {
  const author = {
    id: '10000000-0000-4000-8000-000000000004',
    slug,
    fullName: 'Анна Морозова',
    country: 'BY',
    city: 'Минск',
    discipline: 'Живопись,Картины,Масло',
    practice: 'Практика автора',
    profilePhotoUrl: `/api/sellers/${slug}/photo`,
    telegramUrl: socials >= 1 ? 'https://t.me/anna' : null,
    instagramUrl: socials >= 2 ? 'https://instagram.com/anna' : null,
    websiteUrl: socials >= 3 ? 'https://anna.example' : null,
    shortDescription: 'Короткая биография для проверки шапки.',
    biography: null,
    achievements: [],
    sharePath: `/authors/${slug}`,
  };
  return {
    author,
    works: Array.from({ length: works }, (_, index) => ({
      work: {
        id: `20000000-0000-4000-8000-00000000000${index + 1}`,
        publicId: `motionWork${index}`,
        title: `Работа ${index + 1}`,
        story: null,
        categoryId,
        technique: 'Масло',
        materials: 'Холст',
        dimensions: '40x50',
        year: 2024,
        uniqueness: null,
        images: [
          {
            id: `30000000-0000-4000-8000-00000000000${index + 1}`,
            position: 0,
            url: `/api/images/30000000-0000-4000-8000-00000000000${index + 1}`,
            mimeType: 'image/svg+xml',
            byteLength: 120,
            checksum,
            width: 366,
            height: 488,
          },
        ],
        publishedAt: '2026-01-01T00:00:00.000Z',
        sharePath: `/works/motionWork${index}`,
      },
      author,
    })),
    pagination: { page: 1, limit: 20, total: works },
  };
}

async function mockAuthor(page: Page, slug: string, socials: 0 | 2 | 3, works: number) {
  const payload = authorFixture(slug, socials, works);
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
  await page.route(`**/api/authors/${slug}?**`, (route) =>
    route.fulfill({ json: payload }),
  );
  await page.route(`**/api/authors/${slug}`, (route) =>
    route.fulfill({ json: payload }),
  );
  await page.route('**/api/authors?**', (route) =>
    route.fulfill({
      json: {
        authors: [{ author: payload.author, workCount: works }],
        pagination: { page: 1, limit: 20, total: 1 },
      },
    }),
  );
  await page.route(`**/api/sellers/${slug}/photo`, (route) =>
    route.fulfill({
      contentType: 'image/svg+xml',
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="112" height="112"><rect width="112" height="112" fill="#cd3518"/></svg>',
    }),
  );
  await page.route('**/api/images/**', (route) =>
    route.fulfill({
      contentType: 'image/svg+xml',
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="366" height="488"><rect width="366" height="488" fill="#177bc4"/></svg>',
    }),
  );
}

async function creatorMetrics(page: Page) {
  return page.evaluate(() => {
    const header = document.querySelector('[data-testid="creator-sticky-header"]');
    const labeled = document.querySelector('[data-testid="creator-scroll"]');
    const tabs = document.querySelector('[role="tablist"]');
    const port = labeled
      ? [labeled, ...labeled.querySelectorAll<HTMLElement>('*')].find(
          (node) => node.scrollHeight > node.clientHeight + 1,
        ) ?? labeled
      : null;
    const box = (testId: string) =>
      document.querySelector(`[data-testid="${testId}"]`)?.getBoundingClientRect().toJSON();
    const count = (testId: string) =>
      document.querySelectorAll(`[data-testid="${testId}"]`).length;
    return {
      state: header?.getAttribute('data-state'),
      scrollTop: port instanceof HTMLElement ? port.scrollTop : 0,
      avatarCount: count('creator-avatar'),
      handleCount: count('creator-handle'),
      actionsCount: count('creator-actions'),
      surfaceCount: count('sticky-dock-surface'),
      surfaceActive:
        document
          .querySelector('[data-testid="sticky-dock-surface"]')
          ?.getAttribute('data-active') === 'true',
      avatar: box('creator-avatar'),
      handle: box('creator-handle'),
      actions: box('creator-actions'),
      tabs: tabs?.getBoundingClientRect().toJSON(),
      handleText:
        document.querySelector('[data-testid="creator-handle"]')?.textContent?.trim() ??
        '',
    };
  });
}

async function avatarPaintHit(page: Page) {
  return page.evaluate(() => {
    const avatar = document.querySelector('[data-testid="creator-avatar"]');
    const surface = document.querySelector('[data-testid="sticky-dock-surface"]');
    if (!(avatar instanceof HTMLElement) || !(surface instanceof HTMLElement)) {
      return { hit: null as string | null, ids: [] as string[] };
    }
    const previous = surface.style.pointerEvents;
    surface.style.pointerEvents = 'auto';
    const box = avatar.getBoundingClientRect();
    const ids = document
      .elementsFromPoint(box.x + box.width / 2, box.y + box.height / 2)
      .map((node) => node.getAttribute('data-testid'))
      .filter((id): id is string => Boolean(id));
    surface.style.pointerEvents = previous;
    const hit =
      ids.find((id) => id === 'creator-avatar' || id === 'sticky-dock-surface') ??
      null;
    return { hit, ids };
  });
}

async function waitForHeader(page: Page) {
  await expect(page.getByTestId('creator-sticky-header')).toBeVisible();
  await expect(page.getByTestId('creator-avatar')).toBeVisible();
}

async function waitForState(page: Page, state: 'expanded' | 'compact') {
  await expect
    .poll(async () => (await creatorMetrics(page)).state, { timeout: 4000 })
    .toBe(state);
}

async function scrollCreator(page: Page, top: number) {
  await page.evaluate((nextTop) => {
    const labeled = document.querySelector('[data-testid="creator-scroll"]');
    if (!(labeled instanceof HTMLElement)) {
      throw new Error('missing creator-scroll');
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
  return page.evaluate((stack) => {
    const hero = document.querySelector('[data-testid="author-header"]');
    if (!(hero instanceof HTMLElement)) {
      throw new Error('missing author-header');
    }
    const heroHeight = hero.offsetHeight;
    return {
      heroHeight,
      compactStack: stack,
      handoffOffset: Math.max(0, heroHeight - stack),
    };
  }, ACTION_HEIGHT);
}

async function addCreatorSpacer(page: Page) {
  await page.evaluate(() => {
    const labeled = document.querySelector('[data-testid="creator-scroll"]');
    if (!(labeled instanceof HTMLElement)) {
      throw new Error('missing creator-scroll');
    }
    const spacer = document.createElement('div');
    spacer.dataset.testid = 'delayed-spacer';
    spacer.style.height = '2400px';
    (labeled.lastElementChild ?? labeled).append(spacer);
  });
}

function expectOneIdentity(metrics: Awaited<ReturnType<typeof creatorMetrics>>) {
  expect(metrics.avatarCount).toBe(1);
  expect(metrics.handleCount).toBe(1);
  expect(metrics.actionsCount).toBe(1);
  expect(metrics.surfaceCount).toBe(1);
}

test.describe('author header motion', () => {
  test('shows the expanded creator identity at rest', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 860 });
    await mockAuthor(page, 'motion-rest', 3, 3);
    await page.goto('/seller/motion-rest');
    await waitForHeader(page);
    const metrics = await creatorMetrics(page);
    expect(metrics.state).toBe('expanded');
    expect(metrics.surfaceActive).toBe(false);
    expectOneIdentity(metrics);
    expect(metrics.handleText).toBe('@motion-rest');
    expect(metrics.avatar?.width).toBeCloseTo(112, 0);
    expect(metrics.avatar?.height).toBeCloseTo(112, 0);
    expect(metrics.avatar?.x).toBeCloseTo(139, 0);
    expect(metrics.handle?.y ?? 0).toBeGreaterThan(metrics.avatar?.y ?? 0);
    expect(metrics.actions?.y ?? 0).toBeGreaterThan(metrics.handle?.y ?? 0);
    expect(metrics.tabs?.y ?? 0).toBeGreaterThan(metrics.actions?.y ?? 0);
    expect(metrics.tabs?.height).toBeGreaterThan(20);
    await expect(page.getByTestId('creator-social-telegram')).toBeVisible();
    await expect(page.getByLabel('Поделиться профилем')).toHaveCount(1);
    await expect(page.getByRole('tab', { name: /^Работы/ })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Об авторе', exact: true })).toBeVisible();
  });

  test('parks one compact identity after the natural handoff', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 860 });
    await mockAuthor(page, 'motion-handoff', 3, 3);
    await page.goto('/seller/motion-handoff');
    await waitForHeader(page);
    await addCreatorSpacer(page);
    const { handoffOffset } = await measureHandoff(page);
    expect(handoffOffset).toBeGreaterThan(100);
    await scrollCreator(page, handoffOffset);
    await waitForState(page, 'compact');
    await expect
      .poll(async () => Math.round((await creatorMetrics(page)).avatar?.y ?? -1), {
        timeout: 1500,
      })
      .toBe(WEB_COMPACT_AVATAR_Y);
    const compact = await creatorMetrics(page);
    expect(compact.surfaceActive).toBe(true);
    expectOneIdentity(compact);
    expect(compact.avatar?.width).toBeCloseTo(48, 0);
    expect(compact.avatar?.x).toBeCloseTo(20, 0);
    expect(compact.handle?.x).toBeCloseTo(76, 0);
    expect(compact.actions?.y).toBeCloseTo(WEB_COMPACT_AVATAR_Y, 0);
    expect(compact.tabs?.y).toBeCloseTo(ACTION_HEIGHT, 0);
    expect(compact.tabs?.height).toBeCloseTo(26, 0);
    expect((await avatarPaintHit(page)).hit).toBe('creator-avatar');
    await expect(page.getByRole('tab', { name: /^Работы/ })).toBeVisible();
    await expect(page.getByLabel('Поделиться профилем')).toHaveCount(1);
  });

  test('restores expanded identity on reverse without losing tabs', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 860 });
    await mockAuthor(page, 'motion-reverse', 3, 3);
    await page.goto('/seller/motion-reverse');
    await waitForHeader(page);
    await addCreatorSpacer(page);
    const { handoffOffset } = await measureHandoff(page);
    await scrollCreator(page, handoffOffset + 30);
    await waitForState(page, 'compact');
    const samples: number[] = [];
    for (let top = handoffOffset; top >= 0; top -= 20) {
      await scrollCreator(page, top);
      const live = await creatorMetrics(page);
      expectOneIdentity(live);
      samples.push(live.tabs?.height ?? 0);
      expect(live.tabs?.height ?? 0).toBeGreaterThan(20);
    }
    await waitForState(page, 'expanded');
    await expect
      .poll(async () => Math.round((await creatorMetrics(page)).avatar?.width ?? 0), {
        timeout: 1500,
      })
      .toBe(112);
    const expanded = await creatorMetrics(page);
    expect(expanded.surfaceActive).toBe(false);
    expectOneIdentity(expanded);
    expect(expanded.handleText).toBe('@motion-reverse');
    expect(expanded.avatar?.width).toBeCloseTo(112, 0);
    expect(Math.min(...samples)).toBeGreaterThan(20);
    await expect(page.getByRole('tab', { name: 'Об авторе', exact: true })).toBeVisible();
  });
});
