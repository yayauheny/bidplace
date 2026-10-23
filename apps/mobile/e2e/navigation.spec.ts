import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

import { expect, test, type Page } from '@playwright/test';

import { authenticatedPage } from './support/auth-session';
import {
  createAdminModerationFixture,
  createSellerFixture,
} from './support/e2e-fixtures';

const w2EvidenceDir = '/tmp/w2-shots';
mkdirSync(w2EvidenceDir, { recursive: true });
const apiBaseURL = `http://localhost:${process.env.E2E_API_PORT ?? '3001'}`;

const dockLabels = ['Главная', 'Поиск', 'Добавить', 'Профиль'] as const;

test('guest 390 dock is one four-item capsule without auction chrome', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  const dock = page.getByTestId('figma-floating-dock');
  await expect(dock).toBeVisible();
  await expect(page.getByTestId('figma-floating-dock')).toHaveCount(1);
  const box = await dock.boundingBox();
  expect(box?.width).toBe(232);
  expect(box?.height).toBe(64);

  for (const label of dockLabels) {
    await expect(dock.getByLabel(label)).toBeVisible();
  }

  await expect(page.getByRole('link', { name: 'Аукционы' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Покупки' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Меню' })).toHaveCount(0);
  await expect(page.getByLabel('Корзина')).toHaveCount(0);
});

test('guest dock search, home, profile and plus stay inside the capsule', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  const dock = page.getByTestId('figma-floating-dock');
  await dock.getByLabel('Поиск').click();
  await expect(page).toHaveURL(/overlay=search/);
  await expect(page.getByTestId('search-overlay')).toBeVisible();
  await page.getByRole('button', { name: 'Закрыть поиск' }).click();
  await expect(page.getByTestId('search-overlay')).toHaveCount(0);
  await expect(page).not.toHaveURL(/overlay=search/);

  await dock.getByLabel('Главная').click();
  await expect(page).toHaveURL(/\/$/);

  await dock.getByLabel('Профиль').click();
  await expect(page).toHaveURL(/\/login/);

  await page.goto('/');
  await page.getByTestId('figma-floating-dock').getByLabel('Добавить').click();
  await expect(page).toHaveURL(/\/login/);
});

test('pending seller plus opens the application profile, not create-work', async ({
  browser,
}) => {
  const { seller } = await createSellerFixture({ status: 'PENDING_REVIEW' });
  const { context, page } = await authenticatedPage(browser, seller);

  try {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page
      .getByTestId('figma-floating-dock')
      .getByLabel('Добавить')
      .click();
    await expect(page).toHaveURL(/\/profile/);
    await expect(page).not.toHaveURL(/\/products\/new/);
  } finally {
    await context.close();
  }
});

test('approved seller plus opens the existing create-work flow', async ({
  browser,
}) => {
  const { seller } = await createSellerFixture({ status: 'APPROVED' });
  const { context, page } = await authenticatedPage(browser, seller);

  try {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page
      .getByTestId('figma-floating-dock')
      .getByLabel('Добавить')
      .click();
    await expect(page).toHaveURL(/\/products\/new/);
  } finally {
    await context.close();
  }
});

test('admin dock hides plus and opens admin from profile', async ({
  browser,
}) => {
  const { admin } = await createAdminModerationFixture();
  const { context, page } = await authenticatedPage(browser, admin);

  try {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    const dock = page.getByTestId('figma-floating-dock');
    await expect(dock.getByLabel('Главная')).toBeVisible();
    await expect(dock.getByLabel('Поиск')).toBeVisible();
    await expect(dock.getByLabel('Профиль')).toBeVisible();
    await expect(dock.getByLabel('Добавить')).toHaveCount(0);
    await dock.getByLabel('Профиль').click();
    await expect(page).toHaveURL(/\/admin/);
  } finally {
    await context.close();
  }
});

test('public shell stays fluid without horizontal overflow across accepted W2 viewports', async ({
  page,
  request,
}) => {
  test.setTimeout(180_000);
  const [worksResponse, authorsResponse] = await Promise.all([
    request.get(`${apiBaseURL}/api/works?limit=1`),
    request.get(`${apiBaseURL}/api/authors?limit=1`),
  ]);
  const works = (await worksResponse.json()) as {
    works: Array<{ work: { publicId: string } }>;
  };
  const authors = (await authorsResponse.json()) as {
    authors: Array<{ author: { slug: string } }>;
  };
  const work = works.works[0]?.work;
  const author = authors.authors[0]?.author;
  expect(work).toBeDefined();
  expect(author).toBeDefined();

  const routes = [
    {
      name: 'home',
      path: '/',
      ready: (page: Page) => page.getByTestId('home-scroll'),
    },
    {
      name: 'authors',
      path: '/authors',
      ready: (page: Page) =>
        page.getByText('Креативные и проверенные авторы на Bidplace'),
    },
    {
      name: 'works',
      path: '/works',
      ready: (page: Page) => page.getByTestId('catalog-scroll-view'),
    },
    {
      name: 'work',
      path: `/product/${work!.publicId}`,
      ready: (page: Page) => page.getByTestId('work-gallery'),
    },
    {
      name: 'author',
      path: `/seller/${author!.slug}`,
      ready: (page: Page) => page.getByTestId('creator-static-header'),
    },
  ] as const;
  const viewports = [390, 440, 768, 1024, 1440] as const;
  const screenshotWidths = new Set([390, 1024, 1440]);

  for (const width of viewports) {
    await page.setViewportSize({ width, height: 844 });
    const expectedContentWidth = Math.min(width - 24, 1280);
    for (const route of routes) {
      await page.goto(route.path);
      await expect(route.ready(page)).toBeVisible();
      await expectFluidShell(page, expectedContentWidth);
      if (route.name === 'work' && width === 390) {
        await expect(page.getByTestId('work-gallery')).toHaveJSProperty(
          'clientWidth',
          390,
        );
      }
      if (screenshotWidths.has(width)) {
        await page.screenshot({
          path: resolve(w2EvidenceDir, `${route.name}-${width}.png`),
          fullPage: true,
        });
      }
    }

    await page.goto('/');
    await page.getByTestId('figma-floating-dock').getByLabel('Поиск').click();
    await expectSearchOverlay(page, width);
    if (screenshotWidths.has(width)) {
      await page.screenshot({
        path: resolve(w2EvidenceDir, `search-${width}.png`),
        fullPage: true,
      });
    }
  }
});

async function expectFluidShell(page: Page, expectedContentWidth: number) {
  await expect
    .poll(() =>
      page
        .getByTestId('app-shell-content')
        .first()
        .evaluate((node) => {
          const style = getComputedStyle(node);
          return (
            node.getBoundingClientRect().width -
            Number.parseFloat(style.paddingLeft) -
            Number.parseFloat(style.paddingRight)
          );
        }),
    )
    .toBe(expectedContentWidth);
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    )
    .toBe(true);
}

async function expectSearchOverlay(page: Page, expectedViewportWidth: number) {
  const overlay = page.getByTestId('search-overlay');
  await expect(overlay).toBeVisible();
  await expect
    .poll(() =>
      overlay.evaluate((node) => {
        const box = node.getBoundingClientRect();
        return {
          width: box.width,
          height: box.height,
          scrollWidth: document.documentElement.scrollWidth,
          viewportWidth: innerWidth,
          viewportHeight: innerHeight,
        };
      }),
    )
    .toEqual({
      width: expectedViewportWidth,
      height: 844,
      scrollWidth: expectedViewportWidth,
      viewportWidth: expectedViewportWidth,
      viewportHeight: 844,
    });
}

test('public web analytics respects opt-in and shares sessions across tabs, reloads and navigation', async ({
  browser,
}) => {
  const context = await browser.newContext();
  const requests: Array<{
    events: Array<{ eventId: string; page: { page: string } }>;
  }> = [];
  const responses: Array<{ accepted: number; sessionId: string | null }> = [];
  context.on('request', (request) => {
    if (request.url().endsWith('/api/analytics/web-events'))
      requests.push(request.postDataJSON());
  });
  context.on('response', async (response) => {
    if (response.url().endsWith('/api/analytics/web-events'))
      responses.push(await response.json());
  });
  try {
    const first = await context.newPage();
    if (process.env.EXPO_PUBLIC_ANALYTICS_WEB_ENABLED !== 'true') {
      await first.goto('/', { waitUntil: 'networkidle' });
      expect(requests).toHaveLength(0);
      return;
    }
    const second = await context.newPage();
    await Promise.all([first.goto('/'), second.goto('/')]);
    await expect.poll(() => responses.length).toBe(2);
    if (process.env.ANALYTICS_WEB_ENABLED !== 'true') {
      expect(
        responses.every(
          (response) => response.accepted === 0 && response.sessionId === null,
        ),
      ).toBe(true);
      expect(
        (await context.cookies()).some(
          (cookie) => cookie.name === 'bp_web_analytics',
        ),
      ).toBe(false);
      return;
    }
    expect(responses[0]!.sessionId).toBeTruthy();
    expect(responses[0]!.sessionId).toBe(responses[1]!.sessionId);
    const cookie = (await context.cookies()).filter(
      (item) => item.name === 'bp_web_analytics',
    );
    expect(cookie).toHaveLength(1);
    expect(cookie[0]!.httpOnly).toBe(true);
    expect(
      await first.evaluate(() => document.cookie.includes('bp_web_analytics')),
    ).toBe(false);
    await first.reload();
    await expect.poll(() => responses.length).toBe(3);
    await first
      .getByRole('link', { name: 'Работы', exact: true })
      .first()
      .click();
    await expect(first).toHaveURL(/\/works/);
    await expect.poll(() => responses.length).toBe(4);
    await first.evaluate(() => {
      history.replaceState({}, '', `${location.pathname}?q=private#secret`);
      dispatchEvent(new PopStateEvent('popstate'));
    });
    await first.goto('/login', { waitUntil: 'networkidle' });
    await first.goto('/product/daliEstate1?preview=1', {
      waitUntil: 'networkidle',
    });
    expect(requests).toHaveLength(4);
    expect(
      new Set(
        requests.flatMap((request) =>
          request.events.map((event) => event.eventId),
        ),
      ).size,
    ).toBe(4);
    expect(
      responses.every(
        (response) => response.sessionId === responses[0]!.sessionId,
      ),
    ).toBe(true);
    expect(JSON.stringify(requests)).not.toMatch(
      /private|secret|clientCapturedAt|anonymousId/,
    );
  } finally {
    await context.close();
  }
});
