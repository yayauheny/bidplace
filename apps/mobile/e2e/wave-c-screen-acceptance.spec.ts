import { execFileSync } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

import { expect, test, type Page } from '@playwright/test';

import { getCatalogColumnCount } from '../src/features/products/catalog-layout';
import { getAuthorWorkColumnCount } from '../src/features/sellers/author-layout';
import {
  createAdminModerationFixture,
  createAuctionFixture,
  createSellerFixture,
} from './support/e2e-fixtures';
import { authenticatedPage } from './support/auth-session';

const evidenceCommit = execFileSync('git', ['rev-parse', '--short', 'HEAD'], {
  cwd: resolve(__dirname, '../../..'),
  encoding: 'utf8',
}).trim();
const screenshotDir = resolve(
  '/private/tmp',
  'bidplace-wave-c-screenshots',
  evidenceCommit,
);
const seededBuyer = {
  id: '',
  email: 'buyer@bidplace.test',
  password: 'password123',
};
const seededAdmin = {
  id: '',
  email: 'admin@bidplace.test',
  password: 'password123',
};
const viewports = [
  { width: 1440, height: 900 },
  { width: 1024, height: 900 },
  { width: 390, height: 844 },
] as const;

async function capture(
  page: Page,
  route: string,
  role: string,
  state: string,
  viewport: (typeof viewports)[number],
) {
  await mkdir(screenshotDir, { recursive: true });
  await page.screenshot({
    path: resolve(
      screenshotDir,
      `${route}-${role}-${state}-${viewport.width}x${viewport.height}-${evidenceCommit}.png`,
    ),
    fullPage: true,
  });
}

async function assertNoHorizontalOverflow(page: Page) {
  const metrics = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
  }));
  expect(metrics.documentWidth).toBeLessThanOrEqual(metrics.viewportWidth);
}

async function assertInFirstViewport(
  page: Page,
  locator: ReturnType<Page['locator']>,
  viewport: (typeof viewports)[number],
) {
  await expect(locator).toBeVisible();
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height);
}

async function assertLoadedImage(page: Page, alt: string) {
  const image = page.locator(`img[alt="${alt}"]`).first();
  await expect(image).toBeVisible();
  await expect
    .poll(() =>
      image.evaluate((element) => ({
        naturalWidth: (element as HTMLImageElement).naturalWidth,
        opacity: Number.parseFloat(getComputedStyle(element).opacity),
      })),
    )
    .toMatchObject({ naturalWidth: expect.any(Number), opacity: 1 });
  await expect
    .poll(() =>
      image.evaluate((element) => (element as HTMLImageElement).naturalWidth),
    )
    .toBeGreaterThan(0);
}

test('Wave C catalog matrix covers columns, media and fallback states', async ({
  browser,
}) => {
  test.setTimeout(120_000);
  const { context, page } = await authenticatedPage(browser, seededBuyer);

  try {
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto('/');
      const cards = page.locator('a[href^="/product/"]');
      await expect.poll(() => cards.count()).toBeGreaterThanOrEqual(3);
      const seededCards = page.locator(
        'a[href="/product/seedSched01"], a[href="/product/seedLive002"], a[href="/product/seedEnded03"]',
      );
      await expect(seededCards).toHaveCount(3);
      const expectedColumns = getCatalogColumnCount(viewport.width);
      const boxes = await cards.evaluateAll((elements) =>
        elements.map((element) => {
          const box = element.getBoundingClientRect();
          return { x: box.x, y: box.y, width: box.width, height: box.height };
        }),
      );
      const firstRow = boxes.filter((box) => Math.abs(box.y - boxes[0].y) < 1);
      expect(firstRow).toHaveLength(Math.min(expectedColumns, boxes.length));
      await assertLoadedImage(
        page,
        'Изображение предмета: Стакан для кистей «Голубая комета»',
      );
      await assertNoHorizontalOverflow(page);
      await capture(page, 'catalog', 'buyer', 'loaded', viewport);
    }

    for (const viewport of viewports) {
      const loadingPage = await context.newPage();
      await loadingPage.setViewportSize(viewport);
      await loadingPage.route(
        '**/api/products*',
        async (route) => {
          await new Promise((resolveDelay) => setTimeout(resolveDelay, 600));
          await route.continue();
        },
        { times: 1 },
      );
      const loadingNavigation = loadingPage.goto('/', {
        waitUntil: 'domcontentloaded',
      });
      await expect(loadingPage.getByRole('progressbar')).toHaveCount(1);
      await loadingNavigation;
      await capture(loadingPage, 'catalog', 'buyer', 'loading', viewport);
      await loadingPage.close();

      const failedPage = await context.newPage();
      await failedPage.setViewportSize(viewport);
      await failedPage.route('**/*', async (route) => {
        if (route.request().resourceType() === 'image') {
          await route.abort();
          return;
        }
        await route.continue();
      });
      await failedPage.goto('/');
      await expect(
        failedPage.getByLabel(/Изображение недоступно/).first(),
      ).toBeVisible();
      await capture(failedPage, 'catalog', 'buyer', 'failed-media', viewport);
      await failedPage.close();
    }

    const pendingSeller = await createSellerFixture({
      status: 'PENDING_REVIEW',
    });
    const approvedSeller = await createSellerFixture({ status: 'APPROVED' });
    const guestContext = await browser.newContext({
      baseURL: 'http://localhost:8081',
    });
    const guestPage = await guestContext.newPage();
    const adminSession = await authenticatedPage(browser, seededAdmin);
    const pendingSession = await authenticatedPage(
      browser,
      pendingSeller.seller,
    );
    const approvedSession = await authenticatedPage(
      browser,
      approvedSeller.seller,
    );
    const roleSessions = [
      { role: 'guest', context: guestContext, page: guestPage },
      adminSession && { role: 'admin', ...adminSession },
      pendingSession && { role: 'pending-seller', ...pendingSession },
      approvedSession && { role: 'approved-seller', ...approvedSession },
    ].filter(Boolean) as Array<{
      role: string;
      context: typeof guestContext;
      page: typeof guestPage;
    }>;
    try {
      for (const session of roleSessions) {
        await session.page.setViewportSize(viewports[2]);
        await session.page.goto('/');
        await expect(
          session.page.locator('a[href="/product/seedLive002"]'),
        ).toBeVisible();
        if (session.role === 'approved-seller') {
          await expect(
            session.page.getByRole('link', { name: 'Добавить предмет' }),
          ).toBeVisible();
        } else {
          await expect(
            session.page.getByRole('link', { name: 'Добавить предмет' }),
          ).toHaveCount(0);
        }
        await capture(
          session.page,
          'catalog',
          session.role,
          'loaded-role-model',
          viewports[2],
        );
      }
    } finally {
      for (const session of roleSessions) {
        await session.context.close();
      }
    }
  } finally {
    await context.close();
  }
});

test('Wave C product keeps buyer and admin auction boundaries', async ({
  browser,
}) => {
  test.setTimeout(120_000);
  const buyer = await authenticatedPage(browser, seededBuyer);
  const admin = await authenticatedPage(browser, seededAdmin);

  try {
    for (const viewport of viewports) {
      await buyer.page.setViewportSize(viewport);
      await buyer.page.goto('/product/seedLive002');
      await expect(
        buyer.page.getByText('Стакан для кистей «Голубая комета»').first(),
      ).toBeVisible();
      await expect(buyer.page.getByText('Торги идут').first()).toBeVisible();
      await expect(buyer.page.getByText(/75,00\s*BYN/).first()).toBeVisible();
      await assertLoadedImage(
        buyer.page,
        'Изображение предмета: Стакан для кистей «Голубая комета»',
      );
      if (viewport.width === 390) {
        await assertInFirstViewport(
          buyer.page,
          buyer.page.getByText('Стакан для кистей «Голубая комета»').first(),
          viewport,
        );
        await assertInFirstViewport(
          buyer.page,
          buyer.page.getByText('Торги идут').first(),
          viewport,
        );
        await expect(
          buyer.page.getByTestId('mobile-bottom-action-bar'),
        ).toBeVisible();
        await assertInFirstViewport(
          buyer.page,
          buyer.page.getByTestId('mobile-bottom-action-bar'),
          viewport,
        );
        await capture(
          buyer.page,
          'product-seedLive002',
          'buyer',
          'loaded-mobile',
          viewport,
        );
        await buyer.page.getByLabel('Ваша ставка, BYN').focus();
        await expect(buyer.page.getByLabel('Ваша ставка, BYN')).toBeFocused();
        await capture(
          buyer.page,
          'product-seedLive002',
          'buyer',
          'keyboard-focus',
          viewport,
        );
      } else {
        for (const auctionFact of [
          buyer.page.getByText('Текущая цена').first(),
          buyer.page.getByText(/Мин\. ставка:/).first(),
          buyer.page.getByText(/До завершения:/).first(),
          buyer.page.getByText(/Окончание:/).first(),
          buyer.page.getByRole('button', { name: 'Сделать ставку' }).first(),
        ]) {
          await assertInFirstViewport(buyer.page, auctionFact, viewport);
        }
        await capture(
          buyer.page,
          'product-seedLive002',
          'buyer',
          'loaded',
          viewport,
        );
      }
      await assertNoHorizontalOverflow(buyer.page);

      await admin.page.setViewportSize(viewport);
      await admin.page.goto('/product/seedLive002');
      await expect(
        admin.page.getByText('Администратор не участвует в торгах.'),
      ).toBeVisible();
      await expect(admin.page.getByLabel('Ваша ставка, BYN')).toHaveCount(0);
      await expect(
        admin.page.getByTestId('mobile-bottom-action-bar'),
      ).toHaveCount(0);
      await assertNoHorizontalOverflow(admin.page);
      await capture(
        admin.page,
        'product-seedLive002',
        'admin',
        'restricted',
        viewport,
      );
    }
  } finally {
    await buyer.context.close();
    await admin.context.close();
  }
});

test('Wave C route matrix covers author, purchases, seller forms, admin, order and auth', async ({
  browser,
  page,
}) => {
  test.setTimeout(120_000);
  const auction = await createAuctionFixture({
    title:
      'Очень длинное название авторского предмета для проверки переноса текста и ширины действий',
    additionalTitles: [
      'Авторский предмет 2',
      'Авторский предмет 3',
      'Авторский предмет 4',
    ],
  });
  const seller = await createSellerFixture();
  const emptySeller = await createSellerFixture();
  const adminFixture = await createAdminModerationFixture();
  const sellerSession = await authenticatedPage(browser, seller.seller);
  const adminSession = await authenticatedPage(browser, adminFixture.admin);
  const productResponse = await sellerSession.context.request.get(
    `http://localhost:3001/api/products/${auction.product.publicId}`,
  );
  const product = await productResponse.json();
  const authorSlug = product.sellerProfile.slug as string;

  try {
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto(`/seller/${authorSlug}`);
      await expect(page.getByText('Создатель').first()).toBeVisible();
      await expect(page.getByText(auction.product.title).first()).toBeVisible();
      const authorCards = page.locator('a[href^="/product/"]');
      await expect(authorCards).toHaveCount(4);
      const authorCardBoxes = await authorCards.evaluateAll((elements) =>
        elements.map((element) => {
          const box = element.getBoundingClientRect();
          return { y: box.y };
        }),
      );
      const firstAuthorRow = authorCardBoxes.filter(
        (box) => Math.abs(box.y - authorCardBoxes[0].y) < 1,
      );
      expect(firstAuthorRow).toHaveLength(
        getAuthorWorkColumnCount(viewport.width),
      );
      await assertNoHorizontalOverflow(page);
      await capture(page, 'author', 'guest', 'loaded-four-works', viewport);

      await page.goto(`/seller/${emptySeller.slug}`);
      await expect(
        page.getByText('У автора пока нет опубликованных предметов'),
      ).toBeVisible();
      await capture(page, 'author', 'guest', 'empty', viewport);

      await page.goto('/seller/wave-c-missing-author');
      await expect(page.getByText('Автор не найден')).toBeVisible();
      await capture(page, 'author', 'guest', 'error-not-found', viewport);

      await sellerSession.page.setViewportSize(viewport);
      await sellerSession.page.goto('/profile');
      await expect(
        sellerSession.page.getByText('Профиль продавца'),
      ).toBeVisible();
      await assertNoHorizontalOverflow(sellerSession.page);
      await capture(
        sellerSession.page,
        'seller-profile',
        'seller',
        'loaded',
        viewport,
      );
      await sellerSession.page.goto('/products/new');
      await expect(sellerSession.page.getByText('Новый предмет')).toBeVisible();
      await capture(
        sellerSession.page,
        'product-draft',
        'seller',
        'loaded',
        viewport,
      );
      await sellerSession.page.goto('/listings/new');
      await expect(
        sellerSession.page.getByText('Новое размещение'),
      ).toBeVisible();
      await capture(
        sellerSession.page,
        'listing-draft',
        'seller',
        'loaded',
        viewport,
      );

      await adminSession.page.setViewportSize(viewport);
      await adminSession.page.goto('/admin');
      await expect(adminSession.page.getByText('Продавцы')).toBeVisible();
      await expect(
        adminSession.page.getByText('Предметы', { exact: true }),
      ).toBeVisible();
      await assertNoHorizontalOverflow(adminSession.page);
      await capture(adminSession.page, 'admin', 'admin', 'loaded', viewport);
    }

    const seeded = await authenticatedPage(browser, seededBuyer);
    try {
      for (const viewport of viewports) {
        await seeded.page.setViewportSize(viewport);
        await seeded.page.goto('/me/activity');
        await expect(seeded.page.getByText('Мои покупки')).toBeVisible();
        await capture(seeded.page, 'purchases', 'buyer', 'loaded', viewport);
        await seeded.page.goto('/order/seedOrder01');
        await expect(seeded.page.getByText('Заказ seedOrder01')).toBeVisible();
        await capture(
          seeded.page,
          'order-seedOrder01',
          'buyer',
          'loaded',
          viewport,
        );
      }
    } finally {
      await seeded.context.close();
    }

    const longActivity = await authenticatedPage(browser, seededBuyer);
    const longActivityTitle =
      'Очень длинное название предмета для проверки переноса текста в строке покупок и отсутствия горизонтального переполнения';
    await longActivity.page.route('**/api/me/activity', async (route) => {
      const response = await route.fetch();
      const payload = (await response.json()) as {
        activity: Array<{
          product: { title: string | null };
          [key: string]: unknown;
        }>;
      };
      expect(payload.activity.length).toBeGreaterThan(0);
      await route.fulfill({
        response,
        body: JSON.stringify({
          ...payload,
          activity: payload.activity.map((item, index) =>
            index === 0
              ? {
                  ...item,
                  product: { ...item.product, title: longActivityTitle },
                }
              : item,
          ),
        }),
      });
    });
    try {
      for (const viewport of viewports) {
        await longActivity.page.setViewportSize(viewport);
        await longActivity.page.goto('/me/activity');
        await expect(
          longActivity.page.getByText(longActivityTitle),
        ).toBeVisible();
        await assertNoHorizontalOverflow(longActivity.page);
        await capture(
          longActivity.page,
          'purchases',
          'buyer',
          'loaded-long-row',
          viewport,
        );
      }
    } finally {
      await longActivity.context.close();
    }

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto('/register');
      await expect(page.getByText('Регистрация')).toBeVisible();
      await page.getByRole('button', { name: 'Создать аккаунт' }).click();
      await expect(page.getByText('Введите имя')).toBeVisible();
      await capture(page, 'register', 'guest', 'validation', viewport);
      await page.goto('/login');
      await expect(page.getByText('Вход')).toBeVisible();
      await capture(page, 'login', 'guest', 'loaded', viewport);
    }

    for (const viewport of viewports) {
      await adminSession.page.setViewportSize(viewport);
      await adminSession.page.goto('/');
      const accountTrigger = adminSession.page.getByRole('button', {
        name: /Открыть меню аккаунта/,
      });
      if (viewport.width >= 1025) {
        await accountTrigger.hover();
      } else {
        await accountTrigger.click();
      }
      await expect(
        adminSession.page.locator('#account-menu-dropdown'),
      ).toBeVisible();
      await capture(
        adminSession.page,
        'account-menu',
        'admin',
        'open',
        viewport,
      );
      await adminSession.page.goto('/admin');
      const moderationLink = adminSession.page.getByRole('link', {
        name: 'Модерация',
      });
      if (viewport.width >= 1025) {
        await moderationLink.hover();
        await expect(
          adminSession.page.locator('#navigation-tooltip'),
        ).toHaveText('Модерация');
        await capture(
          adminSession.page,
          'admin',
          'admin',
          'focused-rail-tooltip',
          viewport,
        );
      } else {
        await moderationLink.focus();
        await expect(moderationLink).toBeFocused();
        await capture(
          adminSession.page,
          'admin',
          'admin',
          'focused-mobile-navigation',
          viewport,
        );
      }
      await adminSession.page
        .getByText(adminFixture.sellerName, { exact: true })
        .first()
        .locator('..')
        .getByRole('button', { name: 'Приостановить' })
        .click();
      await expect(adminSession.page.getByRole('dialog')).toBeVisible();
      await capture(
        adminSession.page,
        'moderation-dialog',
        'admin',
        'destructive-open',
        viewport,
      );
    }
  } finally {
    await sellerSession.context.close();
    await adminSession.context.close();
  }
});

test('Wave C bid confirmation stays transactional and accessible', async ({
  browser,
}) => {
  test.setTimeout(120_000);
  const fixture = await createAuctionFixture();
  const { context, page } = await authenticatedPage(browser, fixture.buyerA);

  try {
    await page.setViewportSize(viewports[0]);
    await page.goto(`/product/${fixture.product.publicId}`);
    await page.getByLabel('Ваша ставка, BYN').fill('11');
    await page.getByRole('button', { name: 'Сделать ставку' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('Ставка необратима.')).toBeVisible();
    await capture(
      page,
      'bid-dialog',
      'buyer',
      'confirmation-open',
      viewports[0],
    );
  } finally {
    await context.close();
  }
});
