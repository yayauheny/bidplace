import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { expect, test, type Page } from '@playwright/test';

import { e2eEvidenceDir } from './support/evidence-dir';

const motionDir = resolve(e2eEvidenceDir, 'author-motion');

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
        ? Number(header.style.getPropertyValue('--creator-progress') || '0')
        : 0,
      binding: header?.getAttribute('data-scroll-binding'),
      bucket: header?.getAttribute('data-progress'),
      scrollTop: port instanceof HTMLElement ? port.scrollTop : 0,
      avatar: avatar?.getBoundingClientRect().toJSON(),
      handle: handle?.getBoundingClientRect().toJSON(),
      handleCount: headerHandleTexts.length,
      compactHandleCount: compactHandle ? 1 : 0,
      expandedHandleCount: expandedHandle ? 1 : 0,
      actions: actions?.getBoundingClientRect().toJSON(),
      tabs: tabs?.getBoundingClientRect().toJSON(),
      handleFont: (() => {
        if (!handle) {
          return null;
        }
        const style = getComputedStyle(handle);
        const transform = style.transform;
        return {
          fontFamily: style.fontFamily,
          fontSize: style.fontSize,
          fontWeight: style.fontWeight,
          letterSpacing: style.letterSpacing,
          transform,
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
    };
  });
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

async function offsetOf(page: Page) {
  return page.evaluate(() => {
    const header = document.querySelector('[data-testid="creator-sticky-header"]');
    const hero = document.querySelector('[data-testid="author-header"]');
    if (!(header instanceof HTMLElement) || !(hero instanceof HTMLElement)) {
      return 0;
    }
    return Math.max(0, hero.offsetHeight - 186);
  });
}

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
    expect(beforeDelay.handle?.x).toBeGreaterThan(40);
    expect(beforeDelay.handle?.height).toBeCloseTo(29, 1);

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

    await scrollCreator(page, 200);
    await expect
      .poll(async () => (await creatorMetrics(page)).progress)
      .toBeGreaterThan(0);

    const offset = await offsetOf(page);
    expect(offset).toBeGreaterThan(100);
    const frames: number[] = [];
    const measurements: Record<string, Awaited<ReturnType<typeof creatorMetrics>>> =
      {};
    const viewport = page.viewportSize();
    const engine = test.info().project.name || 'chromium';
    const prefix = `${engine}-${viewport?.width ?? 390}x${viewport?.height ?? 860}`;
    for (const percent of [0, 0.25, 0.5, 0.75, 1]) {
      await scrollCreator(page, Math.round(offset * percent));
      const metrics = await creatorMetrics(page);
      frames.push(metrics.progress);
      measurements[String(Math.round(percent * 100))] = metrics;
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
      await scrollCreator(page, Math.round(offset * percent));
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
    expect(frames[0]).toBeCloseTo(0, 2);
    expect(frames[1]).toBeGreaterThan(0.15);
    expect(frames[1]).toBeLessThan(0.4);
    expect(frames[2]).toBeGreaterThan(0.4);
    expect(frames[2]).toBeLessThan(0.65);
    expect(frames[3]).toBeGreaterThan(0.65);
    expect(frames[3]).toBeLessThan(1);
    expect(frames[4]).toBeCloseTo(1, 2);

    const compact = await creatorMetrics(page);
    expect(compact.handleCount).toBe(1);
    expect(compact.compactHandleCount).toBe(0);
    expect(compact.expandedHandleCount).toBe(0);
    expect(compact.avatar?.width).toBeCloseTo(48, 1);
    expect(compact.avatar?.x).toBeCloseTo(20, 1);
    expect(compact.avatar?.y).toBeCloseTo(44, 2);
    expect(compact.tabs?.y).toBeCloseTo(186, 2);
    expect(compact.handle?.x).toBeCloseTo(76, 1);
    expect(compact.handle?.y).toBeCloseTo(58.5, 1);
    expect(compact.handle?.height).toBeCloseTo(19, 0);
    expect(compact.handleFont?.fontWeight).toBe('500');
    expect(compact.handleFont?.fontFamily ?? '').toMatch(/Inter_500/);
    expect(compact.handleFont?.fontFamily ?? '').not.toMatch(/Inter_600/);
    expect(compact.overflowHidden).toBe(1);
    expect(compact.overlap).toBe(false);
    expect(compact.handle!.right).toBeLessThanOrEqual(compact.actions!.left + 1);

    await page.getByRole('tab', { name: 'Об авторе', exact: true }).click();
    await expect(page.getByText('Короткая биография для проверки шапки.')).toBeVisible();
    const about = await creatorMetrics(page);
    expect(about.progress).toBeCloseTo(1, 2);
    await page.getByRole('tab', { name: /^Работы/ }).click();

    await scrollCreator(page, 0);
    const reversed = await creatorMetrics(page);
    expect(reversed.progress).toBeCloseTo(0, 2);
    expect(reversed.handleCount).toBe(1);
    expect(reversed.compactHandleCount).toBe(0);
    expect(reversed.handle?.x).toBeCloseTo(beforeDelay.handle?.x ?? 0, 1);
    expect(reversed.handle?.y).toBeCloseTo(beforeDelay.handle?.y ?? 0, 1);
    expect(reversed.overflowHidden).toBe(0);
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
    const offset = await offsetOf(page);
    await scrollCreator(page, Math.round(offset * 0.5));
    const mid = await creatorMetrics(page);
    expect(mid.progress).toBe(0);
    await scrollCreator(page, offset);
    const end = await creatorMetrics(page);
    expect(end.progress).toBe(1);
    expect(end.handleCount).toBe(1);
    expect(end.compactHandleCount).toBe(0);
    expect(end.handle?.x).toBeCloseTo(76, 1);
    expect(end.handle?.y).toBeCloseTo(58.5, 1);
    expect(end.avatar?.width).toBeCloseTo(48, 1);
    expect(end.tabs?.y).toBeCloseTo(186, 2);
    await scrollCreator(page, 0);
    const start = await creatorMetrics(page);
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
    expect(start.handle?.x).toBeGreaterThanOrEqual(12);
    const offset = await offsetOf(page);
    await scrollCreator(page, offset);
    const end = await creatorMetrics(page);
    expect(end.handleCount).toBe(1);
    expect(end.handle?.x).toBeCloseTo(76, 1);
    expect(end.handle?.y).toBeCloseTo(58.5, 1);
    expect(end.handle!.right).toBeLessThanOrEqual(end.actions!.left + 1);
    expect(end.overlap).toBe(false);
  });
});
