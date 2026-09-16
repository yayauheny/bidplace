import { copyFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { expect, test, type Page } from '@playwright/test';

import { creatorWebCompactChrome } from '../src/features/sellers/creator-header-motion';
import {
  classifyDockVisibility,
  parseClipInsets,
  visibleLayerFromClip,
} from './support/creator-motion-evidence';
import { e2eEvidenceDir } from './support/evidence-dir';

const motionDir = resolve(e2eEvidenceDir, 'author-motion');
const HANDOFF_HYSTERESIS = 20;
const WEB_COMPACT_STACK = 12 + 48 + 20;
const WEB_COMPACT_TABS_Y = WEB_COMPACT_STACK;
const WEB_COMPACT_CHROME = creatorWebCompactChrome();
const WEB_COMPACT_TABS_HEIGHT = WEB_COMPACT_CHROME - WEB_COMPACT_STACK;
const WEB_COMPACT_AVATAR_Y = 12;
const WEB_COMPACT_HANDLE_Y = 26.5;
const EXPANDED_AVATAR = 112;

const checksum = 'a'.repeat(64);
const categoryId = '10000000-0000-4000-8000-000000000099';

function authorFixture(
  slug: string,
  socials: 0 | 2 | 3,
  works: number,
) {
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

async function waitForHeader(page: Page) {
  await expect(page.getByTestId('creator-sticky-header')).toBeVisible();
  await expect(page.getByTestId('creator-avatar')).toBeVisible();
}

async function creatorMetrics(page: Page) {
  return page.evaluate(() => {
    const header = document.querySelector('[data-testid="creator-sticky-header"]');
    const labeled = document.querySelector('[data-testid="creator-scroll"]');
    const avatar = document.querySelector('[data-testid="creator-avatar"]');
    const handle = document.querySelector('[data-testid="creator-handle"]');
    const compactHandle = document.querySelector(
      '[data-testid="creator-handle-compact"]',
    );
    const expandedHandle = document.querySelector(
      '[data-testid="creator-handle-expanded"]',
    );
    const actions = document.querySelector('[data-testid="creator-actions"]');
    const tabs = document.querySelector('[role="tablist"]');
    const identity = document.querySelector('[data-testid="creator-identity"]');
    const overflow = [
      ...document.querySelectorAll('[data-testid="creator-social-overflow"]'),
    ];
    const share = document.querySelectorAll('[aria-label="Поделиться профилем"]');
    const socials = document.querySelectorAll(
      '[data-testid^="creator-social-"]:not([data-testid="creator-social-overflow"])',
    );
    const authorHeader = document.querySelector('[data-testid="author-header"]');
    const headerHandleTexts = authorHeader
      ? [...authorHeader.querySelectorAll('*')].filter((node) => {
          const text = node.textContent?.trim() ?? '';
          return node.childElementCount === 0 && text.startsWith('@');
        })
      : [];
    const parseInsets = (clipPath: string) => {
      const values = [...clipPath.matchAll(/(-?[\d.]+)px/g)].map((match) =>
        Number(match[1]),
      );
      if (values.length === 0) {
        return { top: 0, bottom: 0 };
      }
      if (values.length === 1) {
        return { top: values[0], bottom: values[0] };
      }
      return { top: values[0], bottom: values[2] ?? 0 };
    };
    const clippedVisibleHeight = (el: Element | null) => {
      if (!el) {
        return 0;
      }
      const rect = el.getBoundingClientRect();
      let top = rect.top;
      let bottom = rect.bottom;
      let node: HTMLElement | null =
        el instanceof HTMLElement ? el : el.parentElement;
      while (node) {
        const clip = getComputedStyle(node).clipPath;
        if (clip && clip !== 'none') {
          const insets = parseInsets(clip);
          const box = node.getBoundingClientRect();
          top = Math.max(top, box.top + insets.top);
          bottom = Math.min(bottom, box.bottom - insets.bottom);
        }
        node = node.parentElement;
      }
      return Math.max(0, bottom - top);
    };
    const identityClipPath =
      identity instanceof HTMLElement
        ? getComputedStyle(identity).clipPath
        : null;
    const stickyClipPath =
      header instanceof HTMLElement ? getComputedStyle(header).clipPath : null;
    const boxes = [avatar, handle, actions, tabs]
      .filter((node): node is Element => Boolean(node))
      .map((node) => node.getBoundingClientRect());
    const overlap = boxes.some((a, index) =>
      boxes.slice(index + 1).some(
        (b) =>
          !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom),
      ),
    );
    const port = labeled
      ? [labeled, ...labeled.querySelectorAll<HTMLElement>('*')].find(
          (node) => node.scrollHeight > node.clientHeight + 1,
        ) ?? labeled
      : null;
    return {
      progress: header instanceof HTMLElement
        ? Number(
            getComputedStyle(header).getPropertyValue('--creator-progress') ||
              '0',
          )
        : 0,
      geometry: header instanceof HTMLElement
        ? Number(
            getComputedStyle(header).getPropertyValue('--creator-geometry') ||
              '0',
          )
        : 0,
      clipPath: identityClipPath,
      stickyClipPath,
      identityClipPath,
      clipTop:
        identity instanceof HTMLElement
          ? getComputedStyle(identity)
              .getPropertyValue('--creator-identity-clip-top')
              .trim()
          : null,
      clipBottom:
        identity instanceof HTMLElement
          ? getComputedStyle(identity)
              .getPropertyValue('--creator-identity-clip-bottom')
              .trim()
          : null,
      binding: header?.getAttribute('data-scroll-binding'),
      state: header?.getAttribute('data-state'),
      releasing: header?.getAttribute('data-releasing') ?? '0',
      bucket: header?.getAttribute('data-progress'),
      sticky: header?.getBoundingClientRect().toJSON() ?? null,
      identity: identity?.getBoundingClientRect().toJSON() ?? null,
      hero: authorHeader?.getBoundingClientRect().toJSON() ?? null,
      scrollTop: port instanceof HTMLElement ? port.scrollTop : 0,
      avatar: avatar?.getBoundingClientRect().toJSON(),
      handle: handle?.getBoundingClientRect().toJSON(),
      handleCount: headerHandleTexts.length,
      compactHandleCount: compactHandle ? 1 : 0,
      expandedHandleCount: expandedHandle ? 1 : 0,
      actions: actions?.getBoundingClientRect().toJSON(),
      tabs: tabs?.getBoundingClientRect().toJSON(),
      tabsVisibleHeight: clippedVisibleHeight(tabs),
      handleFont: (() => {
        if (!handle) {
          return null;
        }
        const style = getComputedStyle(handle);
        const text = [...handle.querySelectorAll('*')].find(
          (node) => (node.textContent?.trim() ?? '').startsWith('@'),
        );
        const textStyle = text ? getComputedStyle(text) : null;
        return {
          fontFamily: style.fontFamily,
          fontSize: style.fontSize,
          fontWeight: style.fontWeight,
          letterSpacing: style.letterSpacing,
          transform: style.transform,
          maxWidth: style.maxWidth,
          overflow: style.overflow,
          textOverflow: textStyle?.textOverflow ?? style.textOverflow,
          whiteSpace: style.whiteSpace,
          text: handle.textContent?.trim() ?? '',
          clientWidth: handle instanceof HTMLElement ? handle.clientWidth : 0,
          scrollWidth: handle instanceof HTMLElement ? handle.scrollWidth : 0,
        };
      })(),
      overflowCount: overflow.length,
      overflowHidden: overflow.filter(
        (node) => getComputedStyle(node).visibility === 'hidden',
      ).length,
      shareCount: share.length,
      compactSocialCount: socials.length,
      overflow: document.documentElement.scrollWidth > innerWidth,
      overlap,
      content: document
        .querySelector('[data-testid="author-content"]')
        ?.getBoundingClientRect()
        .toJSON(),
      heroOverflow:
        authorHeader instanceof HTMLElement
          ? getComputedStyle(authorHeader).overflowY
          : null,
      stickyTop:
        header instanceof HTMLElement ? getComputedStyle(header).top : null,
    };
  });
}

function identityClip(metrics: Awaited<ReturnType<typeof creatorMetrics>>) {
  const insets = parseClipInsets(metrics.identityClipPath ?? metrics.clipPath);
  const clipTop =
    insets.top ?? Number.parseFloat(metrics.clipTop ?? '') ?? 0;
  const clipBottom =
    insets.bottom ?? Number.parseFloat(metrics.clipBottom ?? '') ?? 0;
  const layer = metrics.identity ?? metrics.hero;
  return visibleLayerFromClip({
    layerTop: layer?.y ?? 0,
    layerHeight: layer?.height ?? 0,
    clipTop,
    clipBottom,
  });
}

function expectAnchoredIdentity(
  metrics: Awaited<ReturnType<typeof creatorMetrics>>,
) {
  const layer = identityClip(metrics);
  expect(Math.abs(layer.top)).toBeLessThanOrEqual(1);
  expect(Math.abs(layer.height - WEB_COMPACT_STACK)).toBeLessThanOrEqual(1);
  expect(
    metrics.stickyClipPath === 'none' || !metrics.stickyClipPath,
  ).toBeTruthy();
}

function expectedTabY(heroHeight: number, handoffOffset: number, scrollTop: number) {
  return heroHeight - Math.min(scrollTop, handoffOffset);
}

function expectFullTabs(
  metrics: Awaited<ReturnType<typeof creatorMetrics>>,
  expectedY?: number,
) {
  expect(Math.abs((metrics.tabs?.height ?? 0) - WEB_COMPACT_TABS_HEIGHT)).toBeLessThanOrEqual(
    2,
  );
  expect(
    Math.abs((metrics.tabsVisibleHeight ?? 0) - (metrics.tabs?.height ?? 0)),
  ).toBeLessThanOrEqual(2);
  expect(metrics.tabsVisibleHeight ?? 0).toBeGreaterThanOrEqual(24);
  if (typeof expectedY === 'number') {
    expect(Math.abs((metrics.tabs?.y ?? 0) - expectedY)).toBeLessThanOrEqual(2);
  }
}

function dockView(rect: { y?: number; height?: number } | null | undefined) {
  if (typeof rect?.y !== 'number' || typeof rect.height !== 'number') {
    return 'outside' as const;
  }
  return classifyDockVisibility({ y: rect.y, height: rect.height });
}

function motionNodeReport(
  label: string,
  source: { x?: number; y?: number; width?: number; height?: number } | null | undefined,
  dest: { x?: number; y?: number; width?: number; height?: number } | null | undefined,
  firstVisible:
    | { x?: number; y?: number; width?: number; height?: number }
    | null
    | undefined,
  visibleTravel: number | null,
) {
  return {
    label,
    source: source ?? null,
    dest: dest ?? null,
    firstVisible: firstVisible ?? null,
    firstVisibleScale:
      label === 'avatar' && firstVisible?.width
        ? firstVisible.width / EXPANDED_AVATAR
        : null,
    maxVisibleTravel: visibleTravel,
    sourceClip: dockView(source ?? null),
    destClip: dockView(dest ?? null),
    firstVisibleClip: dockView(firstVisible ?? null),
  };
}

async function waitForHeaderVisual(page: Page, state: 'expanded' | 'compact') {
  const target = state === 'compact' ? 1 : 0;
  const bucket = String(target);
  await expect
    .poll(
      async () => {
        const metrics = await creatorMetrics(page);
        const docked =
          state === 'expanded' ||
          (typeof metrics.avatar?.y === 'number' &&
            Math.abs(metrics.avatar.y - WEB_COMPACT_AVATAR_Y) < 0.5);
        const released = state === 'compact' || metrics.releasing === '0';
        const clipReady =
          state === 'compact'
            ? /inset/i.test(metrics.identityClipPath ?? metrics.clipPath ?? '') &&
              (metrics.stickyClipPath === 'none' || !metrics.stickyClipPath)
            : !metrics.identityClipPath ||
              metrics.identityClipPath === 'none';
        return metrics.state === state &&
          metrics.bucket === bucket &&
          Math.abs(metrics.progress - target) < 0.02 &&
          Math.abs(metrics.geometry - target) < 0.02 &&
          docked &&
          released &&
          clipReady
          ? 'ready'
          : `${metrics.state}:${metrics.bucket}:${metrics.progress.toFixed(3)}:${metrics.geometry.toFixed(3)}:${metrics.releasing}:${metrics.clipPath}`;
      },
      { timeout: 4000 },
    )
    .toBe('ready');
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
    const header = document.querySelector('[data-testid="creator-sticky-header"]');
    const tabs = document.querySelector('[role="tablist"]');
    const heroHeight = hero.offsetHeight;
    const tabsHeight = tabs instanceof HTMLElement ? tabs.offsetHeight : 0;
    const stickyRootHeight =
      header instanceof HTMLElement ? header.offsetHeight : heroHeight + tabsHeight;
    const handoffOffset = Math.max(0, heroHeight - stack);
    return {
      heroHeight,
      tabsHeight,
      stickyRootHeight,
      compactStack: stack,
      handoffOffset,
      expandAt: Math.max(0, handoffOffset - 20),
    };
  }, WEB_COMPACT_STACK);
}

async function offsetOf(page: Page) {
  return (await measureHandoff(page)).handoffOffset;
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

test.use({
  video: { mode: 'on', size: { width: 390, height: 860 } },
});

test.describe('author header motion', () => {
  test('keeps capture binding after delayed scrollable content and tab changes', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 860 });
    await mockAuthor(page, 'motion-three', 3, 0);
    await page.goto('/seller/motion-three');
    await waitForHeader(page);

    const header = page.getByTestId('creator-sticky-header');
    await expect(header).toHaveAttribute('data-scroll-binding', 'capture-boundary');
    await expect(page.getByTestId('creator-social-overflow')).toHaveCount(1);
    await expect(page.getByLabel('Telegram автора')).toBeVisible();
    await expect(page.getByLabel('Instagram автора')).toBeVisible();
    await expect(page.getByLabel('Сайт автора')).toBeVisible();
    await expect(page.getByLabel('Поделиться профилем')).toHaveCount(1);

    const beforeDelay = await creatorMetrics(page);
    expect(beforeDelay.progress).toBe(0);
    expect(beforeDelay.overflow).toBe(false);
    expect(beforeDelay.handleCount).toBe(1);
    expect(beforeDelay.compactHandleCount).toBe(0);
    expect(beforeDelay.handleFont?.text).toBe('@motion-three');
    expect(beforeDelay.handleFont?.textOverflow).toBe('clip');
    expect(beforeDelay.handleFont?.maxWidth).not.toBe('62px');
    expect(beforeDelay.handle?.x).toBeGreaterThan(40);
    expect(beforeDelay.handle?.height).toBeCloseTo(29, 1);
    expect(beforeDelay.handle?.width).toBeGreaterThan(50);
    await page.setViewportSize({ width: 384, height: 832 });
    const narrow = await creatorMetrics(page);
    expect(narrow.state).toBe('expanded');
    expect(narrow.handleFont?.text).toBe('@motion-three');
    expect(narrow.handleFont?.textOverflow).toBe('clip');
    expect(narrow.handle?.width).toBeGreaterThan(50);
    await page.setViewportSize({ width: 390, height: 860 });

    await addCreatorSpacer(page);

    const handoff = await measureHandoff(page);
    expect(handoff.compactStack).toBe(WEB_COMPACT_STACK);
    expect(handoff.handoffOffset).toBeGreaterThan(100);
    await scrollCreator(page, handoff.handoffOffset);
    await waitForHeaderVisual(page, 'compact');

    const offset = handoff.handoffOffset;
    expect(offset).toBeGreaterThan(100);
    const frames: number[] = [];
    const measurements: Record<string, Awaited<ReturnType<typeof creatorMetrics>>> =
      {};
    const viewport = page.viewportSize();
    const engine = test.info().project.name || 'chromium';
    const prefix = `${engine}-${viewport?.width ?? 390}x${viewport?.height ?? 860}`;
    for (const percent of [0, 0.25, 0.5, 0.75, 1]) {
      const top = Math.round(offset * percent);
      await scrollCreator(page, top);
      const expectedState =
        top >= offset ? 'compact' : 'expanded';
      await waitForHeaderVisual(page, expectedState);
      const metrics = await creatorMetrics(page);
      frames.push(metrics.progress);
      measurements[String(Math.round(percent * 100))] = metrics;
      expect(metrics.state).toBe(expectedState);
      expect(metrics.progress).toBeCloseTo(
        expectedState === 'compact' ? 1 : 0,
        2,
      );
      expect(metrics.overflow).toBe(false);
      expect(metrics.shareCount).toBe(1);
      expect(metrics.handleCount).toBe(1);
      expect(metrics.compactHandleCount).toBe(0);
      expect(metrics.expandedHandleCount).toBe(0);
      await page.screenshot({
        path: resolve(motionDir, `${prefix}-${Math.round(percent * 100)}.png`),
      });
    }
    await scrollCreator(page, 0);
    await waitForHeaderVisual(page, 'expanded');
    measurements.reverse = await creatorMetrics(page);
    await page.screenshot({
      path: resolve(motionDir, `${prefix}-reverse.png`),
    });
    await mkdir(motionDir, { recursive: true });
    await writeFile(
      resolve(motionDir, `measurements-${prefix}.json`),
      `${JSON.stringify({ offset, measurements }, null, 2)}\n`,
    );
    await page.setViewportSize({ width: 390, height: 844 });
    for (const percent of [0, 0.25, 0.5, 0.75, 1]) {
      const top = Math.round(offset * percent);
      await scrollCreator(page, top);
      await waitForHeaderVisual(
        page,
        top >= offset ? 'compact' : 'expanded',
      );
      measurements[`${Math.round(percent * 100)}@844`] = await creatorMetrics(
        page,
      );
      await page.screenshot({
        path: resolve(
          motionDir,
          `${engine}-390x844-${Math.round(percent * 100)}.png`,
        ),
      });
    }
    await writeFile(
      resolve(motionDir, 'measurements.json'),
      `${JSON.stringify({ offset, measurements }, null, 2)}\n`,
    );
    await scrollCreator(page, offset);
    await waitForHeaderVisual(page, 'compact');
    expect(frames[0]).toBeCloseTo(0, 2);
    expect(frames[1]).toBeCloseTo(
      Math.round(offset * 0.25) >= offset ? 1 : 0,
      2,
    );
    expect(frames[2]).toBeCloseTo(
      Math.round(offset * 0.5) >= offset ? 1 : 0,
      2,
    );
    expect(frames[3]).toBeCloseTo(
      Math.round(offset * 0.75) >= offset ? 1 : 0,
      2,
    );
    expect(frames[4]).toBeCloseTo(1, 2);

    const compact = await creatorMetrics(page);
    expect(compact.handleCount).toBe(1);
    expect(compact.compactHandleCount).toBe(0);
    expect(compact.expandedHandleCount).toBe(0);
    expect(compact.avatar?.width).toBeCloseTo(48, 1);
    expect(compact.avatar?.x).toBeCloseTo(20, 1);
    expect(compact.avatar?.y).toBeCloseTo(WEB_COMPACT_AVATAR_Y, 2);
    expect(compact.actions?.y).toBeCloseTo(WEB_COMPACT_AVATAR_Y, 2);
    expect(compact.tabs?.y).toBeCloseTo(WEB_COMPACT_TABS_Y, 2);
    expect(
      (compact.tabs?.y ?? 0) -
        ((compact.avatar?.y ?? 0) + (compact.avatar?.height ?? 0)),
    ).toBeCloseTo(20, 2);
    expect((compact.tabs?.y ?? 0) + (compact.tabs?.height ?? 0)).toBeCloseTo(
      WEB_COMPACT_CHROME,
      2,
    );
    expect(compact.handle?.x).toBeCloseTo(76, 1);
    expect(compact.handle?.y).toBeCloseTo(WEB_COMPACT_HANDLE_Y, 1);
    expect(compact.handle?.height).toBeCloseTo(19, 0);
    expect(compact.handleFont?.fontWeight).toBe('500');
    expect(compact.handleFont?.fontFamily ?? '').toMatch(/Inter_500/);
    expect(compact.handleFont?.fontFamily ?? '').not.toMatch(/Inter_600/);
    expect(compact.overflowHidden).toBe(1);
    expect(compact.heroOverflow).toBe('hidden');
    expect(compact.overlap).toBe(false);
    expect(compact.handle!.right).toBeLessThanOrEqual(compact.actions!.left + 1);
    expect(compact.content?.y ?? 0).toBeGreaterThanOrEqual(WEB_COMPACT_CHROME - 1);
    expect(offset).toBeCloseTo(380, 0);

    await page.getByRole('tab', { name: 'Об авторе', exact: true }).click();
    await expect(page.getByText('Короткая биография для проверки шапки.')).toBeVisible();
    const about = await creatorMetrics(page);
    expect(about.state).toBe('compact');
    expect(about.progress).toBeCloseTo(1, 2);
    expect(about.avatar?.y).toBeCloseTo(WEB_COMPACT_AVATAR_Y, 2);
    expect(about.tabs?.y).toBeCloseTo(WEB_COMPACT_TABS_Y, 2);
    expect((about.tabs?.y ?? 0) + (about.tabs?.height ?? 0)).toBeCloseTo(
      WEB_COMPACT_CHROME,
      2,
    );
    await page.getByRole('tab', { name: /^Работы/ }).click();

    await page.setViewportSize({ width: 384, height: 832 });
    const offsetNarrow = await offsetOf(page);
    await scrollCreator(page, offsetNarrow);
    await waitForHeaderVisual(page, 'compact');
    const compactNarrow = await creatorMetrics(page);
    expect(compactNarrow.avatar?.y).toBeCloseTo(WEB_COMPACT_AVATAR_Y, 2);
    expect(compactNarrow.handle?.x).toBeCloseTo(76, 1);
    expect(compactNarrow.handle?.y).toBeCloseTo(WEB_COMPACT_HANDLE_Y, 1);
    expect(compactNarrow.tabs?.y).toBeCloseTo(WEB_COMPACT_TABS_Y, 2);
    await page.setViewportSize({ width: 390, height: 860 });

    await scrollCreator(page, 0);
    await waitForHeaderVisual(page, 'expanded');
    const reversed = await creatorMetrics(page);
    expect(reversed.progress).toBeCloseTo(0, 2);
    expect(reversed.handleCount).toBe(1);
    expect(reversed.compactHandleCount).toBe(0);
    expect(Math.abs((reversed.handle?.x ?? 0) - (beforeDelay.handle?.x ?? 0))).toBeLessThan(
      5,
    );
    expect(Math.abs((reversed.handle?.y ?? 0) - (beforeDelay.handle?.y ?? 0))).toBeLessThan(
      5,
    );
    expect(reversed.overflowHidden).toBe(0);
    expect(reversed.heroOverflow).not.toBe('hidden');
    await expect(page.getByLabel('Сайт автора')).toBeVisible();
  });

  test('keeps compact handle width stable for 0, 2 and 3 socials', async ({
    page,
  }) => {
    const widths: number[] = [];
    for (const socials of [0, 2, 3] as const) {
      await page.setViewportSize({ width: 390, height: 844 });
      await mockAuthor(page, `motion-socials-${socials}`, socials, 3);
      await page.goto(`/seller/motion-socials-${socials}`);
      await waitForHeader(page);
      const offset = await offsetOf(page);
      await scrollCreator(page, offset);
      await waitForHeaderVisual(page, 'compact');
      const metrics = await creatorMetrics(page);
      expect(metrics.progress).toBeCloseTo(1, 2);
      expect(metrics.shareCount).toBe(1);
      expect(metrics.overflow).toBe(false);
      expect(metrics.overlap).toBe(false);
      expect(metrics.handleCount).toBe(1);
      expect(metrics.compactHandleCount).toBe(0);
      expect(metrics.handle!.x).toBeCloseTo(76, 1);
      expect(metrics.handle!.right).toBeLessThanOrEqual(metrics.actions!.left + 1);
      widths.push(metrics.handle!.width);
      if (socials === 0) {
        await expect(page.getByTestId('author-social-group')).toHaveCount(0);
      }
      if (socials === 3) {
        expect(metrics.overflowHidden).toBe(1);
      }
    }
    expect(Math.abs(widths[1]! - widths[2]!)).toBeLessThan(8);
  });

  test('opens from /authors and snaps under reduced motion', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 860 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await mockAuthor(page, 'motion-catalog', 2, 3);
    await page.goto('/authors');
    await page.getByRole('link', { name: /Открыть профиль автора Анна Морозова/ }).click();
    await expect(page).toHaveURL(/\/seller\/motion-catalog/);
    await waitForHeader(page);
    await addCreatorSpacer(page);
    const { handoffOffset, expandAt } = await measureHandoff(page);
    await scrollCreator(page, Math.max(0, expandAt));
    const below = await creatorMetrics(page);
    expect(below.state).toBe('expanded');
    expect(below.progress).toBe(0);
    await scrollCreator(page, handoffOffset);
    const collapsed = await creatorMetrics(page);
    expect(collapsed.state).toBe('compact');
    expect(collapsed.progress).toBe(1);
    await scrollCreator(page, handoffOffset - 19);
    const held = await creatorMetrics(page);
    expect(held.state).toBe('compact');
    expect(held.progress).toBe(1);
    await scrollCreator(page, handoffOffset);
    await waitForHeaderVisual(page, 'compact');
    const end = await creatorMetrics(page);
    expect(end.progress).toBe(1);
    expect(end.handleCount).toBe(1);
    expect(end.compactHandleCount).toBe(0);
    expect(end.handle?.x).toBeCloseTo(76, 1);
    expect(end.handle?.y).toBeCloseTo(WEB_COMPACT_HANDLE_Y, 1);
    expect(end.avatar?.width).toBeCloseTo(48, 1);
    expect(end.tabs?.y).toBeCloseTo(WEB_COMPACT_TABS_Y, 2);
    await scrollCreator(page, expandAt);
    await waitForHeaderVisual(page, 'expanded');
    const start = await creatorMetrics(page);
    expect(start.state).toBe('expanded');
    expect(start.progress).toBe(0);
    expect(start.handleCount).toBe(1);
    expect(start.handle?.x).toBeGreaterThan(40);
  });

  test('keeps one handle for a long slug and truncates before actions', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 860 });
    await mockAuthor(
      page,
      'verylonghandlethatshouldtruncateinthecompactrow',
      3,
      3,
    );
    await page.goto(
      '/seller/verylonghandlethatshouldtruncateinthecompactrow',
    );
    await waitForHeader(page);
    const start = await creatorMetrics(page);
    expect(start.handleCount).toBe(1);
    expect(start.compactHandleCount).toBe(0);
    expect(start.handleFont?.textOverflow).toBe('clip');
    expect(start.handle?.x).toBeGreaterThanOrEqual(12);
    expect(start.handle!.width).toBeGreaterThan(200);
    const offset = await offsetOf(page);
    await scrollCreator(page, offset);
    await waitForHeaderVisual(page, 'compact');
    const end = await creatorMetrics(page);
    expect(end.handleCount).toBe(1);
    expect(end.handleFont?.textOverflow).toBe('ellipsis');
    expect(end.handle?.x).toBeCloseTo(76, 1);
    expect(end.handle?.y).toBeCloseTo(WEB_COMPACT_HANDLE_Y, 1);
    expect(end.handle!.right).toBeLessThanOrEqual(end.actions!.left + 1);
    expect(end.overlap).toBe(false);
  });

  test('collapses and expands with hysteresis instead of scroll-linked progress', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 860 });
    await mockAuthor(page, 'motion-hysteresis', 3, 3);
    await page.goto('/seller/motion-hysteresis');
    await waitForHeader(page);
    await addCreatorSpacer(page);

    await mkdir(motionDir, { recursive: true });
    const engine = test.info().project.name || 'chromium';
    const prefix = `${engine}-390x860-hysteresis`;
    const { heroHeight, compactStack, handoffOffset, expandAt } =
      await measureHandoff(page);
    expect(compactStack).toBe(WEB_COMPACT_STACK);
    expect(handoffOffset).toBeGreaterThan(100);
    const rows: Array<Record<string, unknown>> = [];

    const record = async (scroll: number) => {
      const metrics = await creatorMetrics(page);
      rows.push({
        scroll,
        state: metrics.state,
        progress: metrics.progress,
        geometry: metrics.geometry,
        clipPath: metrics.clipPath,
        bucket: metrics.bucket,
        handleCount: metrics.handleCount,
        avatarY: metrics.avatar?.y,
        handleY: metrics.handle?.y,
        actionsY: metrics.actions?.y,
        tabsY: metrics.tabs?.y,
        heroHeight,
        handoffOffset,
      });
      return metrics;
    };

    await scrollCreator(page, 0);
    const rest = await record(0);
    expect(rest.state).toBe('expanded');
    expect(rest.progress).toBeCloseTo(0, 2);
    expect(rest.handleCount).toBe(1);
    await page.screenshot({
      path: resolve(motionDir, `${prefix}-rest.png`),
    });

    for (const top of [handoffOffset - 40, expandAt]) {
      await scrollCreator(page, top);
      const metrics = await record(top);
      expect(metrics.state).toBe('expanded');
      expect(metrics.progress).toBeCloseTo(0, 2);
      expect(metrics.handleCount).toBe(1);
      expect(metrics.avatar?.y ?? 0).not.toBeCloseTo(WEB_COMPACT_AVATAR_Y, 0);
    }
    await page.screenshot({
      path: resolve(motionDir, `${prefix}-handoff-minus-20.png`),
    });

    await scrollCreator(page, handoffOffset);
    await expect
      .poll(async () => (await creatorMetrics(page)).state)
      .toBe('compact');
    const entering = await record(handoffOffset);
    expect(entering.progress).toBeCloseTo(1, 2);
    expect(entering.handleCount).toBe(1);
    expect(entering.clipPath ?? '').toMatch(/inset/i);
    expect(entering.tabs?.y).toBeCloseTo(WEB_COMPACT_TABS_Y, 1);
    expect(dockView(entering.tabs)).toBe('inside');
    await page.screenshot({
      path: resolve(motionDir, `${prefix}-handoff-clip.png`),
    });
    await waitForHeaderVisual(page, 'compact');
    const parked = await record(handoffOffset);
    expect(parked.state).toBe('compact');
    expect(parked.progress).toBeCloseTo(1, 2);
    expect(parked.handleCount).toBe(1);
    expect(parked.compactHandleCount).toBe(0);
    expect(parked.avatar?.y).toBeCloseTo(WEB_COMPACT_AVATAR_Y, 1);
    expect(parked.actions?.y).toBeCloseTo(WEB_COMPACT_AVATAR_Y, 1);
    expect(parked.handle?.y).toBeCloseTo(WEB_COMPACT_HANDLE_Y, 1);
    expect(parked.tabs?.y).toBeCloseTo(WEB_COMPACT_TABS_Y, 1);
    expect(
      (parked.tabs?.y ?? 0) -
        ((parked.avatar?.y ?? 0) + (parked.avatar?.height ?? 0)),
    ).toBeCloseTo(20, 1);
    expect((parked.tabs?.y ?? 0) + (parked.tabs?.height ?? 0)).toBeCloseTo(
      WEB_COMPACT_CHROME,
      1,
    );
    expect(parked.content?.y ?? 0).toBeGreaterThanOrEqual(WEB_COMPACT_CHROME - 1);
    await page.screenshot({
      path: resolve(motionDir, `${prefix}-handoff.png`),
    });

    await scrollCreator(page, handoffOffset + 20);
    await waitForHeaderVisual(page, 'compact');
    const afterHandoff = await record(handoffOffset + 20);
    expect(afterHandoff.state).toBe('compact');
    expect(afterHandoff.avatar?.y).toBeCloseTo(WEB_COMPACT_AVATAR_Y, 2);
    expect(afterHandoff.tabs?.y).toBeCloseTo(WEB_COMPACT_TABS_Y, 2);
    await page.screenshot({
      path: resolve(motionDir, `${prefix}-handoff-plus-20.png`),
    });

    const deepTop = handoffOffset + 80;
    await scrollCreator(page, deepTop);
    await waitForHeaderVisual(page, 'compact');
    const deep = await record(deepTop);
    expect(deep.state).toBe('compact');
    expect(deep.avatar?.y).toBeCloseTo(WEB_COMPACT_AVATAR_Y, 2);
    expect(deep.tabs?.y).toBeCloseTo(WEB_COMPACT_TABS_Y, 2);
    await page.screenshot({
      path: resolve(motionDir, `${prefix}-deep-compact.png`),
    });

    await scrollCreator(page, handoffOffset - 19);
    const reverseBand = await record(handoffOffset - 19);
    expect(reverseBand.state).toBe('compact');
    expect(reverseBand.progress).toBeCloseTo(1, 2);
    expect(
      Math.abs((reverseBand.avatar?.y ?? 0) - (parked.avatar?.y ?? 0)),
    ).toBeLessThanOrEqual(HANDOFF_HYSTERESIS);
    expect(
      Math.abs((reverseBand.tabs?.y ?? 0) - (parked.tabs?.y ?? 0)),
    ).toBeLessThanOrEqual(HANDOFF_HYSTERESIS);
    await page.screenshot({
      path: resolve(motionDir, `${prefix}-reverse-before-expand.png`),
    });

    await scrollCreator(page, expandAt);
    await waitForHeaderVisual(page, 'expanded');
    const expanded = await record(expandAt);
    expect(expanded.state).toBe('expanded');
    expect(expanded.progress).toBeCloseTo(0, 2);
    await page.screenshot({
      path: resolve(motionDir, `${prefix}-expanded-after-release.png`),
    });

    await scrollCreator(page, 0);
    await waitForHeaderVisual(page, 'expanded');
    await record(0);

    await page.getByRole('tab', { name: 'Об авторе', exact: true }).click();
    await expect(
      page.getByText('Короткая биография для проверки шапки.'),
    ).toBeVisible();
    await scrollCreator(page, handoffOffset);
    await waitForHeaderVisual(page, 'compact');
    const aboutCompact = await creatorMetrics(page);
    expect(aboutCompact.handleCount).toBe(1);
    expect(aboutCompact.avatar?.y).toBeCloseTo(WEB_COMPACT_AVATAR_Y, 2);
    expect(aboutCompact.tabs?.y).toBeCloseTo(WEB_COMPACT_TABS_Y, 2);
    await page.getByRole('tab', { name: /^Работы/ }).click();
    await scrollCreator(page, 0);
    await waitForHeaderVisual(page, 'expanded');

    await mkdir(motionDir, { recursive: true });
    await writeFile(
      resolve(motionDir, 'hysteresis-390x860.json'),
      `${JSON.stringify(rows, null, 2)}\n`,
    );
  });

  test.describe('clipped geometry evidence', () => {
    test.afterEach(async ({ page }, testInfo) => {
      const attached = testInfo.attachments.find((item) => item.name === 'video');
      const videoPath = attached?.path ?? (await page.video()?.path());
      if (!videoPath) {
        return;
      }
      const engine = testInfo.project.name || 'chromium';
      const slug = testInfo.title.includes('410 to 330')
        ? '410-330'
        : testInfo.title.includes('330 to 410')
          ? '330-410'
          : null;
      if (!slug) {
        return;
      }
      await mkdir(motionDir, { recursive: true });
      await copyFile(
        videoPath,
        resolve(motionDir, `${engine}-390x860-${slug}.webm`),
      );
    });

    test('keeps tabs fully visible while reverse clip moves from 410 to 350', async ({
      page,
    }) => {
      await page.setViewportSize({ width: 390, height: 860 });
      await mockAuthor(page, 'motion-tabs-unclipped', 3, 3);
      await page.goto('/seller/motion-tabs-unclipped');
      await waitForHeader(page);
      await addCreatorSpacer(page);

      const { heroHeight, handoffOffset } = await measureHandoff(page);
      expect(handoffOffset).toBeCloseTo(380, 0);
      expect(heroHeight - WEB_COMPACT_STACK).toBeCloseTo(handoffOffset, 0);

      await scrollCreator(page, 410);
      await waitForHeaderVisual(page, 'compact');

      const engine = test.info().project.name || 'chromium';
      const rows: Array<Record<string, unknown>> = [];
      for (const top of [380, 375, 370, 365, 361, 360]) {
        await scrollCreator(page, top);
        const metrics = await creatorMetrics(page);
        const layer = identityClip(metrics);
        const tabY = expectedTabY(heroHeight, handoffOffset, top);
        rows.push({
          scroll: top,
          stickyClipPath: metrics.stickyClipPath,
          identityClipPath: metrics.identityClipPath,
          clipTop: metrics.clipTop,
          clipBottom: metrics.clipBottom,
          identityTop: metrics.identity?.y,
          identityClipViewportTop: layer.top,
          tabsY: metrics.tabs?.y,
          tabsHeight: metrics.tabs?.height,
          tabsVisibleHeight: metrics.tabsVisibleHeight,
          expectedTabY: tabY,
        });
        expect(metrics.state).toBe('compact');
        expect(
          metrics.stickyClipPath === 'none' || !metrics.stickyClipPath,
        ).toBeTruthy();
        expect(metrics.identityClipPath ?? '').toMatch(/inset/i);
        expectAnchoredIdentity(metrics);
        expectFullTabs(metrics, tabY);
        expect(metrics.tabsVisibleHeight ?? 0).toBeGreaterThan(20);
        if (top === 380 || top === 370 || top === 360) {
          await page.screenshot({
            path: resolve(
              motionDir,
              `${engine}-390x860-tabs-unclipped-${top}.png`,
            ),
          });
        }
      }

      await scrollCreator(page, 350);
      const after = await creatorMetrics(page);
      expectFullTabs(after);
      expect(after.tabsVisibleHeight ?? 0).toBeGreaterThan(20);
      expect(
        after.stickyClipPath === 'none' || !after.stickyClipPath,
      ).toBeTruthy();

      await mkdir(motionDir, { recursive: true });
      await writeFile(
        resolve(motionDir, 'tabs-unclipped-reverse-390x860.json'),
        `${JSON.stringify({ heroHeight, handoffOffset, rows }, null, 2)}\n`,
      );
    });

    test('records clipped source-to-dest play from 330 to 410', async ({
      page,
    }, testInfo) => {
      await page.setViewportSize({ width: 390, height: 860 });
      await mockAuthor(page, 'motion-clip-geometry', 3, 3);
      await page.goto('/seller/motion-clip-geometry');
      await waitForHeader(page);
      await addCreatorSpacer(page);

      const engine = test.info().project.name || 'chromium';
      const prefix = `${engine}-390x860-clip-geometry`;
      const { handoffOffset } = await measureHandoff(page);
      expect(handoffOffset).toBeCloseTo(380, 0);

      const frames: Record<string, Awaited<ReturnType<typeof creatorMetrics>>> =
        {};
      const capture = async (key: string) => {
        const metrics = await creatorMetrics(page);
        frames[key] = metrics;
        await page.screenshot({
          path: resolve(motionDir, `${prefix}-${key}.png`),
        });
        return metrics;
      };

      for (const top of [350, 370, 379]) {
        await scrollCreator(page, top);
        const metrics = await capture(`scroll-${top}`);
        expect(metrics.state).toBe('expanded');
        expect(metrics.progress).toBeCloseTo(0, 2);
        expect(metrics.geometry).toBeCloseTo(0, 2);
        expect(metrics.avatar?.y ?? 0).not.toBeCloseTo(WEB_COMPACT_AVATAR_Y, 0);
        expect(metrics.clipPath === 'none' || !metrics.clipPath).toBeTruthy();
      }
      expect(
        Math.abs((frames['scroll-379']?.tabs?.y ?? 0) - WEB_COMPACT_TABS_Y),
      ).toBeLessThanOrEqual(2);

      const source = frames['scroll-379'];
      expect(source).toBeTruthy();
      expect(dockView(source?.avatar)).toBe('outside');
      expect(dockView(source?.handle)).toBe('outside');

      await scrollCreator(page, handoffOffset);
      await expect
        .poll(async () => (await creatorMetrics(page)).state)
        .toBe('compact');
      const immediate = await capture('scroll-380-immediate');
      expect(immediate.state).toBe('compact');
      expect(immediate.progress).toBeCloseTo(1, 2);
      expect(immediate.clipPath ?? '').toMatch(/inset/i);
      expect(immediate.tabs?.y).toBeCloseTo(WEB_COMPACT_TABS_Y, 1);
      expect(dockView(immediate.tabs)).toBe('inside');

      const samples: Array<
        Awaited<ReturnType<typeof creatorMetrics>> & { elapsed: number }
      > = [];
      const started = Date.now();
      while (Date.now() - started <= 240) {
        const metrics = await creatorMetrics(page);
        samples.push({ ...metrics, elapsed: Date.now() - started });
        await page.waitForTimeout(8);
      }
      await page.waitForTimeout(
        Math.max(0, 200 - (Date.now() - started)),
      );
      const at50 = samples.find((row) => row.elapsed >= 45) ?? samples[0];
      const at100 = samples.find((row) => row.elapsed >= 95) ?? samples[0];
      frames['scroll-380-50ms'] = at50;
      frames['scroll-380-100ms'] = at100;
      await waitForHeaderVisual(page, 'compact');
      const parked = await capture('scroll-380-200ms');
      expect(parked.geometry).toBeCloseTo(1, 2);
      expect(parked.avatar?.x).toBeCloseTo(20, 1);
      expect(parked.avatar?.y).toBeCloseTo(WEB_COMPACT_AVATAR_Y, 1);
      expect(parked.avatar?.width).toBeCloseTo(48, 1);
      expect(parked.handle?.x).toBeCloseTo(76, 1);
      expect(parked.handle?.y).toBeCloseTo(WEB_COMPACT_HANDLE_Y, 1);
      expect(parked.actions?.y).toBeCloseTo(WEB_COMPACT_AVATAR_Y, 1);
      expect(parked.tabs?.y).toBeCloseTo(WEB_COMPACT_TABS_Y, 1);

      await scrollCreator(page, 400);
      await waitForHeaderVisual(page, 'compact');
      await capture('scroll-400');

      const firstAvatar = samples.find(
        (row) => dockView(row.avatar) !== 'outside',
      );
      const firstHandle = samples.find(
        (row) => dockView(row.handle) !== 'outside',
      );
      const firstActions = samples.find(
        (row) => dockView(row.actions) !== 'outside',
      );
      const visibleTravel = (
        key: 'avatar' | 'handle' | 'actions',
        first:
          | Awaited<ReturnType<typeof creatorMetrics>>
          | undefined,
      ) => {
        if (!first?.[key] || !parked[key]) {
          return null;
        }
        return Math.abs((parked[key]?.y ?? 0) - (first[key]?.y ?? 0));
      };

      const report = [
        motionNodeReport(
          'avatar',
          source?.avatar,
          parked.avatar,
          firstAvatar?.avatar,
          visibleTravel('avatar', firstAvatar),
        ),
        motionNodeReport(
          'handle',
          source?.handle,
          parked.handle,
          firstHandle?.handle,
          visibleTravel('handle', firstHandle),
        ),
        motionNodeReport(
          'actions',
          source?.actions,
          parked.actions,
          firstActions?.actions,
          visibleTravel('actions', firstActions),
        ),
        motionNodeReport(
          'tabs',
          source?.tabs,
          parked.tabs,
          source?.tabs,
          0,
        ),
      ];

      expect(Math.abs((source?.tabs?.y ?? 0) - (parked.tabs?.y ?? 0))).toBeLessThan(
        2,
      );
      const actionsSourceDest = Math.abs(
        (parked.actions?.y ?? 0) - (source?.actions?.y ?? 0),
      );
      expect(actionsSourceDest).toBeGreaterThan(12);
      expect(actionsSourceDest).toBeLessThan(28);

      const firstAvatarWidth = firstAvatar?.avatar?.width ?? 0;
      expect(
        firstAvatarWidth,
        `STOP: first-visible avatar width ${firstAvatarWidth.toFixed(1)} is absurd; do not clamp`,
      ).toBeLessThanOrEqual(90);

      await scrollCreator(page, 330);
      await waitForHeaderVisual(page, 'expanded');
      for (let top = 330; top <= 410; top += 2) {
        await scrollCreator(page, top);
        await page.waitForTimeout(28);
      }
      await waitForHeaderVisual(page, 'compact');

      await mkdir(motionDir, { recursive: true });
      await writeFile(
        resolve(motionDir, 'clip-geometry-390x860.json'),
        `${JSON.stringify(
          {
            handoffOffset,
            report,
            samples: samples.map((row) => ({
              elapsed: row.elapsed,
              state: row.state,
              progress: row.progress,
              geometry: row.geometry,
              clipPath: row.clipPath,
              avatar: row.avatar,
              handle: row.handle,
              actions: row.actions,
              tabs: row.tabs,
              avatarClip: dockView(row.avatar),
              handleClip: dockView(row.handle),
              actionsClip: dockView(row.actions),
              tabsClip: dockView(row.tabs),
            })),
            frames: Object.fromEntries(
              Object.entries(frames).map(([key, metrics]) => [
                key,
                {
                  state: metrics.state,
                  progress: metrics.progress,
                  geometry: metrics.geometry,
                  clipPath: metrics.clipPath,
                  avatar: metrics.avatar,
                  handle: metrics.handle,
                  actions: metrics.actions,
                  tabs: metrics.tabs,
                },
              ]),
            ),
          },
          null,
          2,
        )}\n`,
      );

      const video = page.video();
      if (video) {
        const videoPath = await video.path();
        if (videoPath) {
          await writeFile(
            resolve(motionDir, `${prefix}-video-path.txt`),
            `${videoPath}\n${testInfo.outputDir}\n`,
          );
        }
      }
    });

    test('records reverse clipped geometry from 410 to 330', async ({
      page,
    }, testInfo) => {
      await page.setViewportSize({ width: 390, height: 860 });
      await mockAuthor(page, 'motion-clip-reverse', 3, 3);
      await page.goto('/seller/motion-clip-reverse');
      await waitForHeader(page);
      await addCreatorSpacer(page);

      const engine = test.info().project.name || 'chromium';
      const prefix = `${engine}-390x860-clip-reverse`;
      const {
        heroHeight,
        tabsHeight,
        stickyRootHeight,
        handoffOffset,
        expandAt,
      } = await measureHandoff(page);
      expect(handoffOffset).toBeCloseTo(380, 0);
      expect(expandAt).toBeCloseTo(360, 0);
      expect(stickyRootHeight - handoffOffset).toBeCloseTo(WEB_COMPACT_CHROME, 0);
      expect(heroHeight + tabsHeight).toBeCloseTo(stickyRootHeight, 0);

      const frames: Record<string, Awaited<ReturnType<typeof creatorMetrics>>> =
        {};
      const capture = async (key: string) => {
        const metrics = await creatorMetrics(page);
        frames[key] = metrics;
        await page.screenshot({
          path: resolve(motionDir, `${prefix}-${key}.png`),
        });
        return metrics;
      };

      await scrollCreator(page, 410);
      await waitForHeaderVisual(page, 'compact');
      const compact = await capture('compact-settled');
      expect(compact.clipPath ?? '').toMatch(/inset/i);
      expect(compact.stickyClipPath === 'none' || !compact.stickyClipPath).toBeTruthy();
      expect(compact.releasing).toBe('0');
      expectAnchoredIdentity(compact);
      expectFullTabs(compact, WEB_COMPACT_TABS_Y);

      const hysteresisRows: Array<Record<string, unknown>> = [];
      for (const top of [380, 375, 370, 365, 361, 360]) {
        await scrollCreator(page, top);
        const metrics = await creatorMetrics(page);
        const layer = identityClip(metrics);
        const tabY = expectedTabY(heroHeight, handoffOffset, top);
        hysteresisRows.push({
          scroll: top,
          state: metrics.state,
          releasing: metrics.releasing,
          stickyClipPath: metrics.stickyClipPath,
          identityClipPath: metrics.identityClipPath,
          clipTop: metrics.clipTop,
          clipBottom: metrics.clipBottom,
          identityTop: metrics.identity?.y,
          identityClipViewportTop: layer.top,
          identityVisibleHeight: layer.height,
          tabsY: metrics.tabs?.y,
          tabsHeight: metrics.tabs?.height,
          tabsVisibleHeight: metrics.tabsVisibleHeight,
          expectedTabY: tabY,
        });
        expect(metrics.state).toBe('compact');
        expect(metrics.identityClipPath ?? '').toMatch(/inset/i);
        expect(
          metrics.stickyClipPath === 'none' || !metrics.stickyClipPath,
        ).toBeTruthy();
        expectAnchoredIdentity(metrics);
        expectFullTabs(metrics, tabY);
        if (top > expandAt) {
          expect(metrics.releasing).toBe('0');
        }
      }

      await scrollCreator(page, 410);
      await waitForHeaderVisual(page, 'compact');

      await scrollCreator(page, expandAt);
      await expect
        .poll(async () => (await creatorMetrics(page)).releasing)
        .toBe('1');
      const trigger = await capture('reverse-trigger');
      expect(trigger.state).toBe('compact');
      expect(trigger.releasing).toBe('1');
      expect(trigger.clipPath ?? '').toMatch(/inset/i);
      expectAnchoredIdentity(trigger);
      expectFullTabs(trigger, expectedTabY(heroHeight, handoffOffset, expandAt));
      expect(trigger.progress).toBeCloseTo(1, 2);
      expect(trigger.handleCount).toBe(1);

      const samples: Array<
        Awaited<ReturnType<typeof creatorMetrics>> & { elapsed: number }
      > = [];
      const started = Date.now();
      while (Date.now() - started <= 240) {
        const metrics = await creatorMetrics(page);
        samples.push({ ...metrics, elapsed: Date.now() - started });
        if (metrics.clipPath && metrics.clipPath !== 'none') {
          expect(metrics.state).toBe('compact');
          expectAnchoredIdentity(metrics);
          expectFullTabs(metrics);
        }
        if (!metrics.clipPath || metrics.clipPath === 'none') {
          expect(metrics.releasing).toBe('0');
          expect(metrics.state).toBe('expanded');
        }
        await page.waitForTimeout(8);
      }
      const at50 = samples.find((row) => row.elapsed >= 45) ?? samples[0];
      const at100 = samples.find((row) => row.elapsed >= 95) ?? samples[0];
      frames['reverse-50ms'] = at50;
      frames['reverse-100ms'] = at100;
      await waitForHeaderVisual(page, 'expanded');
      const expanded = await capture('reverse-200ms-expanded');
      expect(expanded.state).toBe('expanded');
      expect(expanded.releasing).toBe('0');
      expect(expanded.clipPath === 'none' || !expanded.clipPath).toBeTruthy();
      expect(expanded.handleCount).toBe(1);
      expect(expanded.compactHandleCount).toBe(0);
      expect(expanded.tabs?.y ?? 0).toBeGreaterThan(70);

      await scrollCreator(page, 410);
      await waitForHeaderVisual(page, 'compact');
      await scrollCreator(page, 20);
      const midReverse = await creatorMetrics(page);
      expect(midReverse.clipPath ?? '').toMatch(/inset/i);
      expectAnchoredIdentity(midReverse);
      await scrollCreator(page, handoffOffset);
      await waitForHeaderVisual(page, 'compact');
      const retargeted = await creatorMetrics(page);
      expect(retargeted.state).toBe('compact');
      expect(retargeted.releasing).toBe('0');
      expect(retargeted.clipPath ?? '').toMatch(/inset/i);
      expect(retargeted.avatar?.y).toBeCloseTo(WEB_COMPACT_AVATAR_Y, 1);

      await scrollCreator(page, 410);
      await waitForHeaderVisual(page, 'compact');
      for (let top = 410; top >= 330; top -= 2) {
        await scrollCreator(page, top);
        const live = await creatorMetrics(page);
        if (live.clipPath && live.clipPath !== 'none') {
          expect(live.state).toBe('compact');
          expectAnchoredIdentity(live);
          expectFullTabs(live);
        }
        await page.waitForTimeout(16);
      }
      await waitForHeaderVisual(page, 'expanded');
      await capture('first-fully-expanded');

      await scrollCreator(page, 330);
      await waitForHeaderVisual(page, 'expanded');
      for (let top = 330; top <= 410; top += 2) {
        await scrollCreator(page, top);
        const live = await creatorMetrics(page);
        if (live.clipPath && live.clipPath !== 'none') {
          expectAnchoredIdentity(live);
          expectFullTabs(live);
        }
        await page.waitForTimeout(8);
      }
      await waitForHeaderVisual(page, 'compact');
      for (let top = 410; top >= 330; top -= 2) {
        await scrollCreator(page, top);
        const live = await creatorMetrics(page);
        if (live.clipPath && live.clipPath !== 'none') {
          expectAnchoredIdentity(live);
          expectFullTabs(live);
        }
        await page.waitForTimeout(8);
      }
      await waitForHeaderVisual(page, 'expanded');

      await mkdir(motionDir, { recursive: true });
      await writeFile(
        resolve(motionDir, 'clip-reverse-390x860.json'),
        `${JSON.stringify(
          {
            diagnosis:
              'white gap was clip-top stuck at handoff while sticky root unstuck; bottom inset was missing',
            heroHeight,
            tabsHeight,
            stickyRootHeight,
            handoffOffset,
            expandAt,
            hysteresisRows,
            samples: samples.map((row) => ({
              elapsed: row.elapsed,
              state: row.state,
              releasing: row.releasing,
              progress: row.progress,
              geometry: row.geometry,
              clipPath: row.clipPath,
              avatar: row.avatar,
              handle: row.handle,
              actions: row.actions,
              tabs: row.tabs,
              sticky: row.sticky,
              hero: row.hero,
            })),
            frames: Object.fromEntries(
              Object.entries(frames).map(([key, metrics]) => [
                key,
                {
                  state: metrics.state,
                  releasing: metrics.releasing,
                  progress: metrics.progress,
                  geometry: metrics.geometry,
                  clipPath: metrics.clipPath,
                  avatar: metrics.avatar,
                  handle: metrics.handle,
                  actions: metrics.actions,
                  tabs: metrics.tabs,
                  sticky: metrics.sticky,
                  hero: metrics.hero,
                },
              ]),
            ),
          },
          null,
          2,
        )}\n`,
      );

      const video = page.video();
      if (video) {
        const videoPath = await video.path();
        if (videoPath) {
          await writeFile(
            resolve(motionDir, `${prefix}-video-path.txt`),
            `${videoPath}\n${testInfo.outputDir}\n`,
          );
        }
      }
    });
  });

  test('reverses an in-flight collapse toward expanded', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 860 });
    await mockAuthor(page, 'motion-reverse', 3, 3);
    await page.goto('/seller/motion-reverse');
    await waitForHeader(page);
    await addCreatorSpacer(page);

    const { handoffOffset } = await measureHandoff(page);
    await scrollCreator(page, handoffOffset);
    await waitForHeaderVisual(page, 'compact');
    await scrollCreator(page, 20);
    const reversing = await creatorMetrics(page);
    expect(reversing.state).toBe('compact');
    expect(reversing.releasing).toBe('1');
    expect(reversing.clipPath ?? '').toMatch(/inset/i);
    await waitForHeaderVisual(page, 'expanded');
    const settled = await creatorMetrics(page);
    expect(settled.progress).toBeCloseTo(0, 1);
    expect(settled.handleCount).toBe(1);
    expect(settled.compactHandleCount).toBe(0);
    await page.screenshot({
      path: resolve(
        motionDir,
        `${test.info().project.name || 'chromium'}-390x860-rapid-reverse.png`,
      ),
    });
  });
});
