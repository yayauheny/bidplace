import { expect, test, type Page } from '@playwright/test';
import { designTokens } from '@bidplace/design-tokens';

const PUBLIC_ID = 'daliEstate1';
const AUTHOR_SLUG = 'tab-reveal-author';
const ACTION_HEIGHT = designTokens.stickyDock.actionHeight;
const SECTION_GAP = designTokens.space.sectionGap;
const TOLERANCE = 3;
const checksum = 'a'.repeat(64);
const categoryId = '10000000-0000-4000-8000-000000000099';

const LONG_STORY = Array.from(
  { length: 36 },
  (_, index) =>
    `Параграф ${index + 1} длинной истории работы, чтобы вкладка История уходила далеко ниже дока и проверяла начало следующей вкладки.`,
).join('\n\n');

const LONG_BIO =
  'Длинная биография автора для проверки начала вкладки Об авторе после компактной шапки. '.repeat(
    40,
  );

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

function workFixture(related: number) {
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
    story: LONG_STORY,
    categoryId,
    technique: 'Масло',
    materials: 'Холст',
    dimensions: '40x50',
    year: 1922,
    uniqueness: 'Единственный экземпляр',
    images: [
      image('30000000-0000-4000-8000-0000000000a1', 0),
      image('30000000-0000-4000-8000-0000000000a2', 1),
    ],
    publishedAt: '2026-09-16T00:00:00.000Z',
    sharePath: `/works/${PUBLIC_ID}`,
  };
  return {
    work,
    author,
    relatedWorks: Array.from({ length: related }, (_, index) => ({
      work: {
        ...work,
        id: `20000000-0000-4000-8000-00000000002${index + 2}`,
        publicId: `motionWork${index + 1}`,
        title: `Другая работа ${index + 1}`,
        story: null,
        sharePath: `/works/motionWork${index + 1}`,
        images: [image(`30000000-0000-4000-8000-0000000000a${index + 3}`, 0)],
      },
      author,
    })),
  };
}

function authorFixture(slug: string, works: number) {
  const author = {
    id: '10000000-0000-4000-8000-000000000004',
    slug,
    fullName: 'Анна Морозова',
    country: 'BY',
    city: 'Минск',
    discipline: 'Живопись,Картины,Масло',
    practice: 'Практика автора занимает несколько абзацев, чтобы About имел высоту.',
    profilePhotoUrl: `/api/sellers/${slug}/photo`,
    telegramUrl: 'https://t.me/anna',
    instagramUrl: 'https://instagram.com/anna',
    websiteUrl: 'https://anna.example',
    shortDescription: 'Короткая биография для проверки шапки.',
    biography: LONG_BIO,
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

async function mockWork(page: Page, related = 2) {
  const payload = workFixture(related);
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

async function mockAuthor(page: Page, slug: string, works: number) {
  const payload = authorFixture(slug, works);
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

async function scrollLabeled(page: Page, testId: string, top: number) {
  await page.evaluate(
    ({ id, nextTop }) => {
      const labeled = document.querySelector(`[data-testid="${id}"]`);
      if (!(labeled instanceof HTMLElement)) {
        throw new Error(`missing ${id}`);
      }
      const port =
        [labeled, ...labeled.querySelectorAll<HTMLElement>('*')].find(
          (node) => node.scrollHeight > node.clientHeight + 1,
        ) ?? labeled;
      port.scrollTop = nextTop;
      port.dispatchEvent(new Event('scroll', { bubbles: false }));
    },
    { id: testId, nextTop: top },
  );
}

async function scrollToMax(page: Page, testId: string) {
  await page.evaluate((id) => {
    const labeled = document.querySelector(`[data-testid="${id}"]`);
    if (!(labeled instanceof HTMLElement)) {
      throw new Error(`missing ${id}`);
    }
    const port =
      [labeled, ...labeled.querySelectorAll<HTMLElement>('*')].find(
        (node) => node.scrollHeight > node.clientHeight + 1,
      ) ?? labeled;
    port.scrollTop = port.scrollHeight - port.clientHeight;
    port.dispatchEvent(new Event('scroll', { bubbles: false }));
  }, testId);
}

async function workGeometry(page: Page) {
  return page.evaluate(() => {
    const header = document.querySelector('[data-testid="work-sticky-header"]');
    const tabs = document.querySelector('[data-testid="work-sticky-tabs"]');
    const panel = document.querySelector('[role="tabpanel"]');
    const media = document.querySelector('[data-testid="work-gallery-media"]');
    const selected = document.querySelector('[role="tab"][aria-selected="true"]');
    return {
      state: header?.getAttribute('data-state'),
      tabs: tabs?.getBoundingClientRect().toJSON(),
      panel: panel?.getBoundingClientRect().toJSON(),
      media: media?.getBoundingClientRect().toJSON(),
      focusedRole: document.activeElement?.getAttribute('role'),
      selectedTab: selected?.textContent?.trim() ?? '',
    };
  });
}

async function creatorGeometry(page: Page) {
  return page.evaluate(() => {
    const header = document.querySelector('[data-testid="creator-sticky-header"]');
    const tabs = document.querySelector(
      '[data-testid="creator-sticky-header"] [role="tablist"]',
    );
    const panel = document.querySelector('[data-testid="author-content"]');
    const avatar = document.querySelector('[data-testid="creator-avatar"]');
    return {
      state: header?.getAttribute('data-state'),
      tabs: tabs?.getBoundingClientRect().toJSON(),
      panel: panel?.getBoundingClientRect().toJSON(),
      avatar: avatar?.getBoundingClientRect().toJSON(),
      focusedRole: document.activeElement?.getAttribute('role'),
    };
  });
}

function expectPanelStart(panelTop: number | undefined, desiredTop: number) {
  expect(panelTop).toBeGreaterThanOrEqual(desiredTop - TOLERANCE);
  expect(panelTop).toBeLessThanOrEqual(desiredTop + TOLERANCE);
}

async function waitForWorkPanelStart(page: Page) {
  await expect
    .poll(
      async () => {
        const geom = await workGeometry(page);
        const desired = (geom.tabs?.bottom ?? 0) + SECTION_GAP;
        return Math.abs((geom.panel?.top ?? -999) - desired);
      },
      { timeout: 4000 },
    )
    .toBeLessThanOrEqual(TOLERANCE);
  const geom = await workGeometry(page);
  expectPanelStart(geom.panel?.top, (geom.tabs?.bottom ?? 0) + SECTION_GAP);
  expect(geom.focusedRole).not.toBe('tabpanel');
  return geom;
}

async function waitForCreatorPanelStart(page: Page) {
  await expect
    .poll(
      async () => {
        const geom = await creatorGeometry(page);
        return Math.abs((geom.panel?.top ?? -999) - (geom.tabs?.bottom ?? 0));
      },
      { timeout: 4000 },
    )
    .toBeLessThanOrEqual(TOLERANCE);
  const geom = await creatorGeometry(page);
  expectPanelStart(geom.panel?.top, geom.tabs?.bottom ?? 0);
  expect(geom.focusedRole).not.toBe('tabpanel');
  return geom;
}

test('Work rest switch does not dock; deep switch reveals the new start', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 860 });
  await mockWork(page, 2);
  await page.goto(`/product/${PUBLIC_ID}`);
  await expect(page.getByTestId('work-history')).toBeVisible();

  await page.getByRole('tab', { name: 'Детали', exact: true }).click();
  await expect(page.getByText('Техника', { exact: true })).toBeVisible();
  const rest = await waitForWorkPanelStart(page);
  expect(rest.state).toBe('overlay');
  expect(rest.media?.y).toBeLessThan(8);

  await page.getByRole('tab', { name: 'История', exact: true }).click();
  await expect(page.getByTestId('work-history')).toBeVisible();
  await scrollToMax(page, 'product-scroll-view');
  await expect
    .poll(async () => (await workGeometry(page)).state, { timeout: 2000 })
    .toBe('docked');
  await page.getByRole('tab', { name: 'Детали', exact: true }).click();
  await expect(page.getByText('Техника', { exact: true })).toBeVisible();
  const details = await waitForWorkPanelStart(page);
  expect(details.state).toBe('docked');

  await page.getByRole('tab', { name: 'История', exact: true }).click();
  await expect(page.getByTestId('work-history')).toBeVisible();
  const story = await waitForWorkPanelStart(page);
  expect(story.state).toBe('docked');
});

test('keeps a direct Work ?tab= load at the page start', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 860 });
  await mockWork(page, 2);
  await page.goto(`/product/${PUBLIC_ID}?tab=details`);
  await expect(page.getByText('Техника', { exact: true })).toBeVisible();
  const geom = await workGeometry(page);
  expect(geom.state).toBe('overlay');
  expect(geom.media?.y).toBeLessThan(8);
  expect(geom.selectedTab).toContain('Детали');
});

test('keyboard Work tab switch reveals the new panel and keeps tab focus', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 860 });
  await mockWork(page, 2);
  await page.goto(`/product/${PUBLIC_ID}`);
  await expect(page.getByTestId('work-history')).toBeVisible();
  await scrollToMax(page, 'product-scroll-view');
  await expect
    .poll(async () => (await workGeometry(page)).state, { timeout: 2000 })
    .toBe('docked');
  await page.getByRole('tab', { name: 'История', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Детали', exact: true })).toBeFocused();
  await expect(page.getByText('Техника', { exact: true })).toBeVisible();
  const geom = await waitForWorkPanelStart(page);
  expect(geom.state).toBe('docked');
  expect(geom.focusedRole).toBe('tab');
});

test('short Payment can undock and still starts at Payment', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 860 });
  await mockWork(page, 0);
  await page.goto(`/product/${PUBLIC_ID}`);
  await expect(page.getByTestId('work-history')).toBeVisible();
  await scrollToMax(page, 'product-scroll-view');
  await expect
    .poll(async () => (await workGeometry(page)).state, { timeout: 2000 })
    .toBe('docked');
  await page.getByRole('tab', { name: 'Оплата и доставка', exact: true }).click();
  await expect(
    page.getByText('Оплата и доставка на bidplace пока недоступны.'),
  ).toBeVisible();
  const payment = await waitForWorkPanelStart(page);
  expect(payment.panel?.top ?? -1).toBeGreaterThanOrEqual(0);
});

test('Creator rest switch does not compact; deep switch reveals the new start', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 860 });
  await mockAuthor(page, AUTHOR_SLUG, 8);
  await page.goto(`/seller/${AUTHOR_SLUG}`);
  await expect(page.getByTestId('creator-sticky-header')).toBeVisible();

  await page.getByRole('tab', { name: 'Об авторе', exact: true }).click();
  await expect(page.getByText('Биография', { exact: true })).toBeVisible();
  const rest = await waitForCreatorPanelStart(page);
  expect(rest.state).toBe('expanded');
  expect(rest.avatar?.width ?? 0).toBeGreaterThan(80);

  await page.getByRole('tab', { name: /^Работы/ }).click();
  await expect(page.getByRole('tab', { name: /^Работы/ })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await page.evaluate(() => {
    const labeled = document.querySelector('[data-testid="creator-scroll"]');
    if (!(labeled instanceof HTMLElement)) {
      throw new Error('missing creator-scroll');
    }
    const spacer = document.createElement('div');
    spacer.style.height = '2400px';
    (labeled.lastElementChild ?? labeled).append(spacer);
  });
  const handoff = await page.evaluate((stack) => {
    const hero = document.querySelector('[data-testid="author-header"]');
    if (!(hero instanceof HTMLElement)) {
      throw new Error('missing author-header');
    }
    return Math.max(0, hero.offsetHeight - stack);
  }, ACTION_HEIGHT);
  await scrollLabeled(page, 'creator-scroll', handoff + 240);
  await expect
    .poll(async () => (await creatorGeometry(page)).state, { timeout: 4000 })
    .toBe('compact');
  await page.getByRole('tab', { name: 'Об авторе', exact: true }).click();
  await expect(page.getByText('Биография', { exact: true })).toBeVisible();
  const compact = await waitForCreatorPanelStart(page);
  expect(compact.state).toBe('compact');
  expect(compact.tabs?.y).toBeCloseTo(ACTION_HEIGHT, 0);

  await page.getByRole('tab', { name: /^Работы/ }).click();
  const works = await waitForCreatorPanelStart(page);
  expect(works.state).toBe('compact');
});
