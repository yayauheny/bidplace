import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

import { expect, test, type Page } from '@playwright/test';
import {
  portfolioAuthorApplicationResponseSchema,
  sellerProfileResponseSchema,
  type SellerStatus,
} from '@bidplace/contracts';

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
  await expect(page).toHaveURL(/search=1/);
  await expect(page.getByTestId('explore-header')).toBeVisible();
  await page.getByRole('button', { name: 'Закрыть поиск' }).click();
  await expect(
    page.getByRole('button', { name: 'Открыть поиск' }),
  ).toBeVisible();
  await expect(page).not.toHaveURL(/search=1/);

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

test('admin dock separates moderation analytics and account without exposing create', async ({
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
    await dock.getByLabel('Модерация').click();
    await expect(page).toHaveURL(/\/admin/);
    await page
      .getByTestId('figma-floating-dock')
      .getByLabel('Аналитика')
      .click();
    await expect(page).toHaveURL(/\/analytics/);
    await page.getByTestId('figma-floating-dock').getByLabel('Профиль').click();
    await expect(page).toHaveURL(/\/account/);
    await page.getByRole('button', { name: 'Настройки', exact: true }).click();
    await expect(page).toHaveURL(/\/account\/settings/);
    await expect(
      page.getByRole('button', { name: 'Выйти', exact: true }),
    ).toBeVisible();
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
      ready: (page: Page) => page.getByTestId('explore-header'),
    },
    {
      name: 'works',
      path: '/works',
      ready: (page: Page) => page.getByTestId('explore-header'),
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
      // Branded Home already owns 24px desktop gutters; ordinary columns use 12px.
      const innerWidth =
        route.name === 'home' && width >= 1024
          ? expectedContentWidth - 24
          : expectedContentWidth;
      await expectFluidShell(page, innerWidth);
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
    const navigation = page.getByTestId(
      width >= 1024 ? 'desktop-navigation' : 'figma-floating-dock',
    );
    await navigation
      .getByRole('button', { name: 'Поиск', exact: true })
      .click();
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
  const column = page.locator(
    '[data-testid="page-content-column"]:not([inert] *)',
  );
  await expect
    .poll(() =>
      column.evaluate((node) => {
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
  await expect(page.getByTestId('explore-header')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    expectedViewportWidth,
  );
  await expect(page.getByTestId('explore-query')).toBeEditable();
}

for (const locksAvailable of [true, false]) {
  test(`public web analytics respects opt-in and navigation with Web Locks available=${locksAvailable}`, async ({
    browser,
    request,
  }) => {
    const context = await browser.newContext();
    if (!locksAvailable)
      await context.addInitScript(() => {
        Object.defineProperty(navigator, 'locks', { value: undefined });
      });
    const requests: Array<{
      events: Array<{ eventId: string; page: { page: string } }>;
      attribution?: {
        source?: string;
        medium?: string;
        campaign?: string;
        content?: string;
      };
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
      if (locksAvailable) {
        await Promise.all([first.goto('/'), second.goto('/')]);
      } else {
        await first.goto('/');
        await expect.poll(() => responses.length).toBe(1);
        await second.goto('/');
      }
      await expect.poll(() => responses.length).toBe(2);
      if (process.env.ANALYTICS_WEB_ENABLED !== 'true') {
        expect(
          responses.every(
            (response) =>
              response.accepted === 0 && response.sessionId === null,
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
        await first.evaluate(() =>
          document.cookie.includes('bp_web_analytics'),
        ),
      ).toBe(false);
      await first.reload();
      await expect.poll(() => responses.length).toBe(3);
      await first
        .getByRole('link', { name: 'Работы', exact: true })
        .first()
        .click();
      await expect(first).toHaveURL(/\/explore\?section=works/);
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
      const authorsResponse = await request.get(
        `${apiBaseURL}/api/authors?limit=1`,
      );
      const authors = (await authorsResponse.json()) as {
        authors: Array<{ author: { slug: string } }>;
      };
      const slug = authors.authors[0]!.author.slug;
      await first.goto(`/seller/${slug}`);
      await expect.poll(() => responses.length).toBe(5);
      await first.goto(
        `/authors/${slug}?utm_source=review&utm_medium=share&utm_campaign=launch&utm_content=card&q=private`,
        { waitUntil: 'networkidle' },
      );
      await expect
        .poll(() => new URL(first.url()).pathname)
        .toBe(`/seller/${slug}`);
      await expect.poll(() => responses.length).toBe(6);
      expect(requests).toHaveLength(6);
      expect(requests.at(-1)?.attribution).toMatchObject({
        source: 'review',
        medium: 'share',
        campaign: 'launch',
        content: 'card',
      });
      for (const preview of ['1', '']) {
        await first.goto(`/authors/${slug}?preview=${preview}`, {
          waitUntil: 'networkidle',
        });
        await expect
          .poll(() => new URL(first.url()).pathname)
          .toBe(`/seller/${slug}`);
        expect(new URL(first.url()).searchParams.has('preview')).toBe(true);
        expect(requests).toHaveLength(6);
      }
      expect(
        requests.slice(-2).map(({ events }) => events.map(({ page }) => page)),
      ).toEqual([[{ page: 'author', slug }], [{ page: 'author', slug }]]);
      expect(
        new Set(
          requests.flatMap((request) =>
            request.events.map((event) => event.eventId),
          ),
        ).size,
      ).toBe(6);
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
}

const onboardingUser = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'navigation@bidplace.test',
  phone: null,
  emailVerifiedAt: '2026-10-01T00:00:00.000Z',
  phoneVerifiedAt: null,
  acceptedRulesVersion: null,
  displayName: 'Navigation',
  slug: null,
  role: 'user',
  status: 'active',
  createdAt: '2026-10-01T00:00:00.000Z',
  updatedAt: '2026-10-01T00:00:00.000Z',
};

async function mockOnboarding(
  page: Page,
  state: SellerStatus | 'absent' | 'loading' | 'error',
  guest = false,
) {
  let authenticated = !guest;
  const gate = Promise.withResolvers<void>();
  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/auth/me') {
      await route.fulfill(
        authenticated
          ? { json: { user: onboardingUser } }
          : { status: 401, json: { message: 'Unauthorized' } },
      );
    } else if (path === '/api/auth/login') {
      authenticated = true;
      await route.fulfill({ status: 201, json: { user: onboardingUser } });
    } else if (path === '/api/seller/profile') {
      if (state === 'loading') await gate.promise;
      if (state === 'error')
        await route.fulfill({ status: 503, json: { message: 'Unavailable' } });
      else if (state === 'absent' || state === 'loading')
        await route.fulfill({ status: 404, json: { message: 'Missing' } });
      else
        await route.fulfill({
          json: sellerProfileResponseSchema.parse({
            sellerProfile: {
              id: '22222222-2222-4222-8222-222222222222',
              userId: onboardingUser.id,
              slug: 'navigation',
              sellerType: 'creator',
              discipline: 'Живопись',
              fullName: 'Navigation',
              country: 'BY',
              city: null,
              practice: null,
              biography: null,
              profilePhotoUrl: '/api/sellers/navigation/photo',
              socialLink: null,
              telegramUrl: null,
              instagramUrl: null,
              websiteUrl: null,
              publicEmail: null,
              shortDescription: null,
              status: state,
              applicationStage: 'CONTACTS',
              createdAt: onboardingUser.createdAt,
              updatedAt: onboardingUser.updatedAt,
            },
            editingRevision: [
              'DRAFT',
              'REJECTED',
              'CHANGES_REQUESTED',
            ].includes(state)
              ? {
                  id: '33333333-3333-4333-8333-333333333333',
                  version: 1,
                  status: 'DRAFT',
                  updatedAt: onboardingUser.updatedAt,
                }
              : null,
          }),
        });
    } else if (
      path === '/api/author/application' &&
      !['absent', 'loading', 'error'].includes(state)
    ) {
      await route.fulfill({
        json: portfolioAuthorApplicationResponseSchema.parse({
          application: {
            slug: 'navigation',
            fullName: 'Navigation',
            country: 'BY',
            city: null,
            discipline: 'Живопись',
            practice: null,
            shortDescription: null,
            status: state,
            applicationStage: 'CONTACTS',
          },
          editingRevision: ['DRAFT', 'REJECTED', 'CHANGES_REQUESTED'].includes(
            state,
          )
            ? {
                id: '33333333-3333-4333-8333-333333333333',
                version: 1,
                status: 'DRAFT',
                updatedAt: onboardingUser.updatedAt,
              }
            : null,
          achievements: [],
        }),
      });
    } else if (path === '/api/portfolio/home') {
      await route.fulfill({
        json: { curatorSelection: null, newWorks: [], newAuthors: [] },
      });
    } else if (path === '/api/categories') {
      await route.fulfill({ json: { categories: [] } });
    } else await route.fulfill({ status: 404, json: { message: 'Missing' } });
  });
  return gate.resolve;
}

test.describe('author onboarding navigation', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  for (const entry of ['plus', 'footer', 'account'] as const) {
    test(`${entry} opens the same intro for a confirmed new author and does not reopen after Start`, async ({
      page,
    }) => {
      await mockOnboarding(page, 'absent');
      await page.goto(entry === 'account' ? '/account' : '/');
      if (entry === 'plus') {
        await expect(
          page.getByRole('link', { name: 'Стать автором', exact: true }),
        ).toHaveAttribute('href', '/profile?intro=1');
        await page
          .getByTestId('figma-floating-dock')
          .getByLabel('Добавить')
          .click();
      } else
        await page
          .getByTestId(entry === 'account' ? 'account-identity' : 'site-footer')
          .getByRole('link', { name: 'Стать автором', exact: true })
          .click();
      await expect(page).toHaveURL(
        (url) =>
          url.pathname === '/profile' && url.searchParams.get('intro') === '1',
      );
      const intro = page.getByRole('dialog', {
        name: 'Стать автором',
        exact: true,
      });
      await expect(intro).toBeVisible();
      await intro.getByRole('button', { name: 'Начать', exact: true }).click();
      await expect(intro).toHaveCount(0);
      await page.reload();
      await expect(
        page.getByText('Фото профиля', { exact: true }),
      ).toBeVisible();
      await expect(intro).toHaveCount(0);
    });
  }

  for (const [status, destination] of [
    ['DRAFT', '/profile'],
    ['PENDING_REVIEW', '/profile'],
    ['CHANGES_REQUESTED', '/profile'],
    ['REJECTED', '/profile'],
    ['APPROVED', '/products/new'],
    ['SUSPENDED', '/cabinet'],
  ] as const) {
    test(`plus respects ${status} without repeating intro`, async ({
      page,
    }) => {
      await mockOnboarding(page, status);
      await page.goto('/');
      await expect(
        page.getByRole('link', { name: 'Стать автором', exact: true }),
      ).toHaveAttribute(
        'href',
        status === 'APPROVED' || status === 'SUSPENDED'
          ? '/cabinet'
          : '/profile',
      );
      await page
        .getByTestId('figma-floating-dock')
        .getByLabel('Добавить')
        .click();
      await expect(page).toHaveURL(new RegExp(`${destination}$`));
      if (['DRAFT', 'CHANGES_REQUESTED', 'REJECTED'].includes(status)) {
        await expect(
          page.getByRole('textbox', {
            name: status === 'DRAFT' ? 'Instagram' : 'Описание достижения',
            exact: true,
          }),
        ).toBeEditable();
      }
      await expect(
        page.getByRole('dialog', { name: 'Стать автором', exact: true }),
      ).toHaveCount(0);
      await page.goBack();
      await expect(page).toHaveURL(/\/$/);
    });
  }

  for (const state of ['loading', 'error'] as const) {
    test(`plus does not treat ${state} as a missing profile`, async ({
      page,
    }) => {
      const release = await mockOnboarding(page, state);
      try {
        await page.goto('/');
        await page
          .getByTestId('figma-floating-dock')
          .getByLabel('Добавить')
          .click();
        await expect(page).toHaveURL(/\/profile$/);
        await expect(
          page.getByRole('dialog', { name: 'Стать автором', exact: true }),
        ).toHaveCount(0);
        release();
        if (state === 'loading')
          await expect(
            page.getByText('Фото профиля', { exact: true }),
          ).toBeVisible();
        await expect(
          page.getByRole('dialog', { name: 'Стать автором', exact: true }),
        ).toHaveCount(0);
      } finally {
        release();
      }
    });
  }

  for (const state of ['loading', 'error'] as const) {
    test(`direct create waits for ${state} instead of mounting the editor`, async ({
      page,
    }) => {
      const release = await mockOnboarding(page, state);
      try {
        await page.goto('/products/new?entry=create');
        await expect(
          page
            .getByTestId(
              state === 'error'
                ? 'infrastructure-error-state-page'
                : 'infrastructure-page-status-loading',
            )
            .first(),
        ).toBeVisible();
        await expect(
          page.getByRole('dialog', { name: 'Стать автором', exact: true }),
        ).toHaveCount(0);
        if (state === 'loading') {
          release();
          await expect(
            page.getByRole('dialog', { name: 'Стать автором', exact: true }),
          ).toBeVisible();
        } else {
          await page
            .getByRole('button', { name: 'Повторить', exact: true })
            .click();
          await expect(
            page.getByTestId('infrastructure-error-state-page'),
          ).toBeVisible();
        }
      } finally {
        release();
      }
    });
  }

  test('keeps the approved editor mounted when a later profile refetch fails', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.clock.install();
    await mockOnboarding(page, 'APPROVED');
    await page.goto('/');
    await expect(
      page
        .getByTestId('site-footer')
        .getByRole('link', { name: 'Стать автором', exact: true }),
    ).toHaveAttribute('href', '/cabinet');
    await page
      .getByTestId('figma-floating-dock')
      .getByLabel('Добавить')
      .click();
    await expect(page).toHaveURL(/\/products\/new$/);
    const title = page.getByRole('textbox', {
      name: 'Название *',
      exact: true,
    });
    await title.fill('Несохранённая работа');
    const editor = await title.elementHandle();
    if (!editor) throw new Error('Expected mounted photo editor');
    await page.route('**/api/seller/profile', (route) =>
      route.fulfill({ status: 503, json: { message: 'Unavailable' } }),
    );
    const response = page.waitForResponse(
      (result) =>
        new URL(result.url()).pathname === '/api/seller/profile' &&
        result.status() === 503,
    );
    await page.evaluate(() => window.dispatchEvent(new Event('offline')));
    await page.clock.fastForward(61_000);
    await page.evaluate(() => window.dispatchEvent(new Event('online')));
    await response;
    await expect(title).toHaveValue('Несохранённая работа');
    expect(await editor.evaluate((node) => node.isConnected)).toBe(true);
    await page.unroute('**/api/seller/profile');
    const restored = page.waitForResponse(
      (result) =>
        new URL(result.url()).pathname === '/api/seller/profile' &&
        result.status() === 200,
    );
    await page.evaluate(() => window.dispatchEvent(new Event('offline')));
    await page.evaluate(() => window.dispatchEvent(new Event('online')));
    await restored;
    expect(await editor.evaluate((node) => node.isConnected)).toBe(true);
  });

  for (const status of ['absent', 'APPROVED'] as const) {
    test(`guest plus resumes the intended flow for ${status} after login`, async ({
      page,
    }) => {
      await mockOnboarding(page, status, true);
      await page.goto('/');
      await page
        .getByTestId('figma-floating-dock')
        .getByLabel('Добавить')
        .click();
      await expect(page).toHaveURL(
        /\/login\?redirectTo=%2Fproducts%2Fnew%3Fentry%3Dcreate/,
      );
      await page
        .getByRole('textbox', { name: 'Электронная почта', exact: true })
        .fill(onboardingUser.email);
      await page
        .getByLabel('Пароль', { exact: true })
        .fill('synthetic-navigation-value');
      await page.getByRole('button', { name: 'Войти', exact: true }).click();
      if (status === 'absent') {
        await expect(
          page.getByRole('dialog', { name: 'Стать автором', exact: true }),
        ).toBeVisible();
        await expect(page).toHaveURL(
          (url) =>
            url.pathname === '/profile' &&
            url.searchParams.get('intro') === '1',
        );
      } else {
        await expect(page).toHaveURL(/\/products\/new$/);
        await expect(
          page.getByRole('dialog', { name: 'Стать автором', exact: true }),
        ).toHaveCount(0);
      }
    });
  }
});
