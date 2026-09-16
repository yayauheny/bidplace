import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { expect, test, type Page } from '@playwright/test';

import { e2eEvidenceDir } from './support/evidence-dir';

const motionDir = resolve(e2eEvidenceDir, 'work-motion');
const COLLAPSE_SCROLL = 558;
const EXPAND_SCROLL = 538;
const TRANSITION_MS = 200;
const WEB_COMPACT_STACK = 12 + 48 + 20;
const WEB_COMPACT_TABS_Y = WEB_COMPACT_STACK;
const PUBLIC_ID = 'daliEstate1';
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
      'Первый абзац истории работы для проверки вкладок.\n\nВторой абзац, чтобы страница точно скроллилась ниже галереи и шапки.\n\nТретий абзац длинной истории: материалы, место и связь автора с этой работой, чтобы compact header проверялся на длинном контенте.',
    categoryId,
    technique: 'Масло',
    materials: 'Холст',
    dimensions: '40x50',
    year: 1922,
    uniqueness: 'Единственный экземпляр',
    images: [image(IMAGE_A, 0), image(IMAGE_B, 1)],
    publishedAt: '2026-01-01T00:00:00.000Z',
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
  await page.route(`**/api/images/${IMAGE_A}`, (route) =>
    route.fulfill({
      contentType: 'image/svg+xml',
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="390" height="520"><rect width="390" height="520" fill="#177bc4"/></svg>',
    }),
  );
  await page.route(`**/api/images/${IMAGE_B}`, (route) =>
    route.fulfill({
      contentType: 'image/svg+xml',
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="390" height="520"><rect width="390" height="520" fill="#cd3518"/></svg>',
    }),
  );
}

async function waitForHeader(page: Page) {
  await expect(page.getByTestId('work-sticky-header')).toBeVisible();
  await expect(page.getByTestId('work-gallery')).toBeVisible();
}

async function workMetrics(page: Page) {
  return page.evaluate(() => {
    const header = document.querySelector('[data-testid="work-sticky-header"]');
    const labeled = document.querySelector('[data-testid="product-scroll-view"]');
    const hero = document.querySelector('[data-testid="work-hero"]');
    const identity = document.querySelector('[data-testid="work-identity"]');
    const identityShell = document.querySelector(
      '[data-testid="work-identity-shell"]',
    );
    const gallery = document.querySelector('[data-testid="work-gallery"]');
    const chrome = document.querySelector('[data-testid="work-gallery-chrome"]');
    const thumb = document.querySelector('[data-testid="work-compact-thumb"]');
    const backWrap = chrome?.firstElementChild;
    const shareWrap = chrome?.lastElementChild;
    const tabs = header?.querySelector('[role="tablist"]');
    const back = document.querySelector('[aria-label="Назад"]');
    const share = document.querySelector('[aria-label="Поделиться работой"]');
    const viewport = window.innerWidth;
    return {
      progress: header instanceof HTMLElement
        ? Number(
            getComputedStyle(header).getPropertyValue('--work-progress') || '0',
          )
        : 0,
      state: header?.getAttribute('data-state'),
      bucket: header?.getAttribute('data-progress'),
      scrollTop: labeled instanceof HTMLElement ? labeled.scrollTop : 0,
      stickyTop:
        header instanceof HTMLElement ? getComputedStyle(header).top : null,
      heroHeight: hero instanceof HTMLElement ? hero.offsetHeight : 0,
      identityOpacity:
        identity instanceof HTMLElement ? getComputedStyle(identity).opacity : null,
      galleryOpacity:
        gallery instanceof HTMLElement ? getComputedStyle(gallery).opacity : null,
      identityInert: identityShell?.hasAttribute('inert') ?? false,
      identityAriaHidden: identityShell?.getAttribute('aria-hidden'),
      chrome: chrome?.getBoundingClientRect().toJSON(),
      tabs: tabs?.getBoundingClientRect().toJSON(),
      back: backWrap?.getBoundingClientRect().toJSON(),
      share: shareWrap?.getBoundingClientRect().toJSON(),
      backControl: back?.getBoundingClientRect().toJSON(),
      shareControl: share?.getBoundingClientRect().toJSON(),
      backCount: document.querySelectorAll('[aria-label="Назад"]').length,
      shareCount: document.querySelectorAll('[aria-label="Поделиться работой"]').length,
      thumbCount: thumb ? 1 : 0,
      documentScrollWidth: document.documentElement.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
      productScrollWidth:
        labeled instanceof HTMLElement ? labeled.scrollWidth : 0,
      productClientWidth:
        labeled instanceof HTMLElement ? labeled.clientWidth : 0,
      viewport,
    };
  });
}

async function waitForHeaderVisual(page: Page, state: 'expanded' | 'compact') {
  const target = state === 'compact' ? 1 : 0;
  const bucket = String(target);
  await expect
    .poll(
      async () => {
        const metrics = await workMetrics(page);
        return metrics.state === state &&
          metrics.bucket === bucket &&
          Math.abs(metrics.progress - target) < 0.02
          ? 'ready'
          : `${metrics.state}:${metrics.bucket}:${metrics.progress.toFixed(3)}`;
      },
      { timeout: 4000 },
    )
    .toBe('ready');
}

async function scrollWork(page: Page, top: number) {
  await page.evaluate((nextTop) => {
    const labeled = document.querySelector('[data-testid="product-scroll-view"]');
    if (!(labeled instanceof HTMLElement)) {
      throw new Error('missing product-scroll-view');
    }
    labeled.scrollTop = nextTop;
    labeled.dispatchEvent(new Event('scroll', { bubbles: false }));
  }, top);
}

function expectNoPageOverflow(metrics: Awaited<ReturnType<typeof workMetrics>>) {
  expect(metrics.thumbCount).toBe(0);
  expect(metrics.documentScrollWidth).toBeLessThanOrEqual(metrics.viewport);
  expect(metrics.bodyScrollWidth).toBeLessThanOrEqual(metrics.viewport);
  expect(metrics.productScrollWidth).toBeLessThanOrEqual(metrics.productClientWidth);
}

async function dispatchNestedScroll(page: Page, from: 'gallery' | 'tabs' | 'leftover') {
  await page.evaluate((kind) => {
    const labeled = document.querySelector('[data-testid="product-scroll-view"]');
    if (!(labeled instanceof HTMLElement)) {
      throw new Error('missing product-scroll-view');
    }
    if (kind === 'gallery') {
      const gallery = document.querySelector('[data-testid="work-gallery"]');
      if (!(gallery instanceof HTMLElement)) {
        throw new Error('missing gallery');
      }
      const hscroll = [
        gallery,
        ...gallery.querySelectorAll<HTMLElement>('*'),
      ].find((node) => node.scrollWidth > node.clientWidth + 1);
      if (!hscroll) {
        throw new Error('missing gallery scroller');
      }
      hscroll.scrollLeft = gallery.clientWidth;
      hscroll.dispatchEvent(new Event('scroll', { bubbles: false }));
      return;
    }
    if (kind === 'tabs') {
      const tabs = document.querySelector('[role="tablist"]');
      if (!(tabs instanceof HTMLElement)) {
        throw new Error('missing tabs');
      }
      tabs.scrollLeft = Math.min(24, Math.max(0, tabs.scrollWidth - tabs.clientWidth));
      tabs.dispatchEvent(new Event('scroll', { bubbles: false }));
      return;
    }
    const leftover = document.createElement('div');
    leftover.setAttribute('data-testid', 'work-nested-overflow');
    leftover.style.cssText =
      'position:absolute;width:40px;height:40px;overflow:auto;';
    leftover.innerHTML = '<div style="height:42px;width:40px"></div>';
    labeled.append(leftover);
    leftover.scrollTop = 0;
    leftover.dispatchEvent(new Event('scroll', { bubbles: false }));
  }, from);
}

async function parkOffset(page: Page) {
  return page.evaluate((stack) => {
    const hero = document.querySelector('[data-testid="work-hero"]');
    if (!(hero instanceof HTMLElement)) {
      return 0;
    }
    return Math.max(0, hero.offsetHeight - stack);
  }, WEB_COMPACT_STACK);
}

test.describe('work header motion', () => {
  test('collapses at the title landmark and parks Back / Share only', async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 860 });
    await mockWork(page);
    await page.goto(`/product/${PUBLIC_ID}`);
    await waitForHeader(page);
    await waitForHeaderVisual(page, 'expanded');

    const rest = await workMetrics(page);
    expect(rest.state).toBe('expanded');
    expect(rest.backCount).toBe(1);
    expect(rest.shareCount).toBe(1);
    expect(rest.thumbCount).toBe(0);
    expectNoPageOverflow(rest);
    expect(rest.identityInert).toBe(false);
    await expect(
      page.getByRole('link', { name: /Открыть профиль автора/ }),
    ).toHaveCount(1);

    await scrollWork(page, COLLAPSE_SCROLL - 1);
    await expect.poll(async () => (await workMetrics(page)).state).toBe('expanded');

    await scrollWork(page, COLLAPSE_SCROLL);
    await waitForHeaderVisual(page, 'compact');

    const offset = await parkOffset(page);
    await scrollWork(page, Math.max(offset, COLLAPSE_SCROLL));
    await page.waitForTimeout(TRANSITION_MS + 40);
    await waitForHeaderVisual(page, 'compact');

    const compact = await workMetrics(page);
    expect(compact.identityOpacity).toBe('1');
    expect(compact.galleryOpacity).toBe('1');
    expect(compact.heroHeight).toBeGreaterThan(WEB_COMPACT_STACK);
    expect(compact.stickyTop).toBe(`-${offset}px`);
    expect(compact.backCount).toBe(1);
    expect(compact.shareCount).toBe(1);
    expect(compact.thumbCount).toBe(0);
    expect(compact.back?.x).toBeGreaterThanOrEqual(19);
    expect(compact.back?.x).toBeLessThanOrEqual(21);
    expect(compact.back?.y).toBeGreaterThanOrEqual(11);
    expect(compact.back?.y).toBeLessThanOrEqual(13);
    expect(compact.share?.x).toBeGreaterThanOrEqual(321);
    expect(compact.share?.x).toBeLessThanOrEqual(323);
    const shareRight = (compact.share?.x ?? 0) + (compact.share?.width ?? 0);
    expect(390 - shareRight).toBeGreaterThanOrEqual(19);
    expect(390 - shareRight).toBeLessThanOrEqual(21);
    expect(compact.tabs?.y).toBeGreaterThanOrEqual(WEB_COMPACT_TABS_Y - 1);
    expect(compact.tabs?.y).toBeLessThanOrEqual(WEB_COMPACT_TABS_Y + 1);
    expect((compact.tabs?.y ?? 0) - ((compact.back?.y ?? 0) + 48)).toBeGreaterThanOrEqual(19);
    expect((compact.tabs?.y ?? 0) - ((compact.back?.y ?? 0) + 48)).toBeLessThanOrEqual(21);
    expectNoPageOverflow(compact);
    expect(compact.identityInert).toBe(true);
    expect(compact.identityAriaHidden).toBe('true');
    await expect(
      page.getByRole('link', { name: /Открыть профиль автора/ }),
    ).toHaveCount(0);
    const compactFocus = await page.evaluate(() => {
      const shell = document.querySelector('[data-testid="work-identity-shell"]');
      const link = shell?.querySelector<HTMLElement>('a, [role="link"]');
      link?.focus();
      return {
        inert: shell?.hasAttribute('inert') ?? false,
        activeInside: Boolean(shell && document.activeElement && shell.contains(document.activeElement)),
      };
    });
    expect(compactFocus.inert).toBe(true);
    expect(compactFocus.activeInside).toBe(false);

    await mkdir(motionDir, { recursive: true });
    await writeFile(
      resolve(motionDir, `${testInfo.project.name}-compact.json`),
      `${JSON.stringify({ rest, compact, offset }, null, 2)}\n`,
    );
    await page.screenshot({
      path: resolve(motionDir, `${testInfo.project.name}-compact.png`),
    });

    await scrollWork(page, EXPAND_SCROLL + 1);
    await expect.poll(async () => (await workMetrics(page)).state).toBe('compact');
    await scrollWork(page, EXPAND_SCROLL);
    await waitForHeaderVisual(page, 'expanded');
    const expanded = await workMetrics(page);
    expect(expanded.identityInert).toBe(false);
    const authorLink = page.getByRole('link', { name: /Открыть профиль автора/ });
    await expect(authorLink).toHaveCount(1);
    await authorLink.focus();
    await expect(authorLink).toBeFocused();
  });

  test('ignores nested gallery and tabs scroll while compact', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 860 });
    await mockWork(page);
    await page.goto(`/product/${PUBLIC_ID}`);
    await waitForHeader(page);
    await waitForHeaderVisual(page, 'expanded');

    const offset = await parkOffset(page);
    await scrollWork(page, Math.max(offset, COLLAPSE_SCROLL));
    await waitForHeaderVisual(page, 'compact');

    await dispatchNestedScroll(page, 'gallery');
    await expect
      .poll(async () => {
        const label = await page.getByTestId('work-gallery-dots').getAttribute('aria-label');
        return label ?? '';
      })
      .toContain('2 из 2');
    await expect.poll(async () => (await workMetrics(page)).state).toBe('compact');

    await dispatchNestedScroll(page, 'tabs');
    await expect.poll(async () => (await workMetrics(page)).state).toBe('compact');

    await dispatchNestedScroll(page, 'leftover');
    await expect.poll(async () => (await workMetrics(page)).state).toBe('compact');
    expectNoPageOverflow(await workMetrics(page));
  });

  test('keeps existing work tabs after compact', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 860 });
    await mockWork(page);
    await page.goto(`/product/${PUBLIC_ID}`);
    await waitForHeader(page);
    await expect(page.getByRole('tab', { name: /Торги|Ставки/ })).toHaveCount(0);

    const offset = await parkOffset(page);
    await scrollWork(page, Math.max(offset, COLLAPSE_SCROLL));
    await waitForHeaderVisual(page, 'compact');

    await page.getByRole('tab', { name: 'Детали', exact: true }).click();
    await expect(page.getByText('Масло', { exact: true }).first()).toBeVisible();
    await page.getByRole('tab', { name: 'Оплата и доставка', exact: true }).click();
    await expect(
      page.getByText('Оплата и доставка на bidplace пока недоступны.'),
    ).toBeVisible();
    await page.getByRole('tab', { name: 'История', exact: true }).click();
    await expect(page.getByTestId('work-history')).toBeVisible();
  });

  test('snaps with reduced motion and keeps page width at 384', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 384, height: 832 });
    await mockWork(page);
    await page.goto(`/product/${PUBLIC_ID}`);
    await waitForHeader(page);
    await waitForHeaderVisual(page, 'expanded');
    expectNoPageOverflow(await workMetrics(page));

    await scrollWork(page, COLLAPSE_SCROLL);
    await waitForHeaderVisual(page, 'compact');
    const offset = await parkOffset(page);
    await scrollWork(page, Math.max(offset, COLLAPSE_SCROLL));
    const compact = await workMetrics(page);
    expect(compact.thumbCount).toBe(0);
    expect(compact.backCount).toBe(1);
    expect(compact.shareCount).toBe(1);
    expect(compact.back?.x).toBeGreaterThanOrEqual(19);
    expect(compact.back?.x).toBeLessThanOrEqual(21);
    const shareRight = (compact.share?.x ?? 0) + (compact.share?.width ?? 0);
    expect(384 - shareRight).toBeGreaterThanOrEqual(19);
    expect(384 - shareRight).toBeLessThanOrEqual(21);
    expectNoPageOverflow(compact);

    await scrollWork(page, 0);
    await waitForHeaderVisual(page, 'expanded');
  });
});
