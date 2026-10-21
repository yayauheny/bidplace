import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

import { expect, test, type Page } from '@playwright/test';

const checksum = 'a'.repeat(64);
const categoryId = '10000000-0000-4000-8000-000000000099';
const secondCategoryId = '10000000-0000-4000-8000-000000000098';
const w1EvidenceDir = '/tmp/w1-fix-shots';
mkdirSync(w1EvidenceDir, { recursive: true });

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

async function mockAuthor(
  page: Page,
  slug: string,
  socials: 0 | 2 | 3,
  works: number,
) {
  const payload = authorFixture(slug, socials, works);
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({ status: 401, json: { message: 'Unauthorized' } }),
  );
  await page.route('**/api/categories', (route) =>
    route.fulfill({
      json: {
        categories: [
          {
            id: categoryId,
            slug: 'sculpture',
            name: 'Скульптура',
            description: null,
          },
          {
            id: secondCategoryId,
            slug: 'painting',
            name: 'Живопись',
            description: null,
          },
        ],
      },
    }),
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

async function scrollCreator(page: Page, top: number) {
  return page.evaluate((nextTop) => {
    const labeled = document.querySelector('[data-testid="creator-scroll"]');
    if (!(labeled instanceof HTMLElement)) {
      throw new Error('missing creator-scroll');
    }
    const port =
      [labeled, ...labeled.querySelectorAll<HTMLElement>('*')].find(
        (node) => node.scrollHeight > node.clientHeight + 1,
      ) ?? labeled;
    port.scrollTop = nextTop;
    return port.scrollTop;
  }, top);
}

function sheetBackdrop(page: Page) {
  return page.locator('[data-state="open"] > div[tabindex="0"]').first();
}

async function expectSheetInViewport(page: Page) {
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect
    .poll(() =>
      dialog.evaluate((node) => {
        const box = node.getBoundingClientRect();
        return (
          box.height > 0 && box.top < innerHeight && box.bottom <= innerHeight
        );
      }),
    )
    .toBe(true);
}

test.describe('static public creator header', () => {
  test('compact FilterSheet closes and restores its opener at phone and desktop widths', async ({
    page,
  }) => {
    for (const [width, close] of [
      [390, 'escape'],
      [1440, 'backdrop'],
    ] as const) {
      await page.setViewportSize({ width, height: 860 });
      await mockAuthor(page, `compact-sheet-${width}`, 2, 3);
      await page.goto(`/seller/compact-sheet-${width}`);

      const opener = page.getByRole('button', { name: 'Действия с профилем' });
      await opener.click();
      await expectSheetInViewport(page);
      await page.screenshot({
        path: resolve(w1EvidenceDir, `compact-filter-${width}.png`),
      });

      if (close === 'escape') {
        await page.keyboard.press('Escape');
      } else {
        await sheetBackdrop(page).click({ position: { x: 4, y: 4 } });
      }

      await expect(page.getByRole('dialog')).toHaveCount(0);
      await expect(opener).toBeFocused();
    }
  });

  test('preserves identity, actions, social links and both tabs', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 860 });
    await mockAuthor(page, 'static-author', 3, 3);
    await page.goto('/seller/static-author');

    const header = page.getByTestId('creator-static-header');
    await expect(header).toBeVisible();
    await expect(page.getByTestId('creator-sticky-header')).toHaveCount(0);
    await expect(page.getByTestId('creator-avatar')).toHaveCount(1);
    await expect(page.getByTestId('creator-handle')).toHaveText(
      '@static-author',
    );
    await expect(page.getByTestId('creator-avatar')).toHaveCSS(
      'width',
      '100px',
    );
    await expect(page.getByTestId('creator-meta')).toContainText(
      'Анна Морозова',
    );
    await expect(page.getByTestId('creator-social-telegram')).toBeVisible();
    await expect(page.getByTestId('creator-social-instagram')).toBeVisible();
    await expect(page.getByTestId('creator-social-website')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Назад' })).toBeVisible();
    await expect(page.getByRole('tab', { name: /^Работы/ })).toBeVisible();
    await expect(
      page.getByRole('tab', { name: 'Об авторе', exact: true }),
    ).toBeVisible();

    expect(
      await header.evaluate((node) => getComputedStyle(node).position),
    ).not.toBe('sticky');

    await page.getByRole('button', { name: 'Поделиться профилем' }).click();
    await expect(
      page.getByRole('button', { name: 'Ссылка на профиль' }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Пожаловаться на автора' }),
    ).toBeVisible();
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Действия с профилем' }).click();
    await page.getByRole('button', { name: 'QR-код профиля' }).click();
    await expect(
      page.getByRole('button', { name: 'Скачать QR' }),
    ).toBeVisible();
  });

  test('selects, applies and clears multiple author categories', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 860 });
    await mockAuthor(page, 'static-filter', 2, 3);
    await page.goto('/seller/static-filter');

    await page.getByRole('button', { name: 'Категория' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    const backdrop = page
      .locator('#app-dialog-host:not([aria-hidden])')
      .locator('xpath=preceding-sibling::*[1]');
    expect(
      await backdrop.evaluate(
        (node) => new DOMMatrixReadOnly(getComputedStyle(node).transform).m42,
      ),
    ).toBe(0);
    const option = page.getByRole('checkbox', { name: 'Скульптура' });
    const label = option.getByText('Скульптура', { exact: true });
    expect((await label.boundingBox())!.width).toBeGreaterThan(0);
    expect((await option.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await expect(label).toHaveCSS('font-size', '15px');
    await option.focus();
    await option.press('Space');
    await expect(option).toBeChecked();
    const tick = await option.locator('svg').boundingBox();
    const optionBox = await option.boundingBox();
    expect(tick!.x + tick!.width / 2).toBeGreaterThan(optionBox!.x + optionBox!.width - 24);
    const scrollbars = await page.getByRole('dialog').evaluate((dialog) =>
      [...dialog.querySelectorAll('*')]
        .filter((node) => getComputedStyle(node).overflowY === 'auto')
        .map((node) => getComputedStyle(node).scrollbarWidth),
    );
    expect(scrollbars.length).toBeGreaterThan(0);
    expect(scrollbars.every((width) => width === 'none')).toBe(true);
    await page.getByRole('dialog').getByText('Категория', { exact: true }).click();
    const panel = await page.getByRole('dialog').boundingBox();
    const action = await page.getByRole('button', { name: 'Показать работы' }).boundingBox();
    expect(panel!.y + panel!.height - action!.y - action!.height).toBeCloseTo(20, 0);
    await page.screenshot({ path: resolve(w1EvidenceDir, `category-picker-${test.info().project.name}.png`) });

    await page.getByRole('checkbox', { name: 'Живопись' }).click();
    await page.getByRole('button', { name: 'Показать работы' }).click();
    await expect
      .poll(() => new URL(page.url()).searchParams.get('categories'))
      .toBe(`${categoryId},${secondCategoryId}`);
    expect(
      await page
        .getByTestId('creator-filter-strip')
        .evaluate((node) => node.scrollWidth > node.clientWidth),
    ).toBe(true);
    await expect(
      page.getByRole('button', { name: 'Удалить Скульптура' }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Удалить Живопись' }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Удалить Скульптура' }).click();
    await expect
      .poll(() => new URL(page.url()).searchParams.get('categories'))
      .toBe(secondCategoryId);
    await page.getByRole('button', { name: 'Удалить Живопись' }).click();
    await expect
      .poll(() => new URL(page.url()).searchParams.get('categories'))
      .toBeNull();
  });

  test('shows honest placeholders for following and liking', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 860 });
    await mockAuthor(page, 'static-placeholder', 2, 2);
    await page.goto('/seller/static-placeholder');

    await page
      .getByRole('button', { name: 'Подписаться', exact: true })
      .click();
    await expect(page.getByText('Скоро появится')).toBeVisible();
    await page.getByRole('button', { name: 'Понятно' }).click();

    await page
      .getByRole('button', { name: /Нравится работа/ })
      .first()
      .click();
    await expect(
      page.getByText('Избранные работы пока недоступны.'),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: /Редактировать работу/ }),
    ).toHaveCount(0);
  });

  test('pins the same action bar after the identity scrolls away and leaves room above the dock', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 860 });
    await mockAuthor(page, 'static-scroll', 3, 8);
    await page.goto('/seller/static-scroll');
    const header = page.getByTestId('creator-static-header');
    await expect(header).toBeVisible();

    const first = await header.boundingBox();
    const avatarBefore = await page.getByTestId('creator-avatar').boundingBox();
    expect(first).toBeTruthy();
    expect(avatarBefore).toBeTruthy();

    expect(await scrollCreator(page, 450)).toBeGreaterThan(100);
    await expect
      .poll(async () => (await header.boundingBox())?.y ?? 999)
      .toBeLessThan((first?.y ?? 0) - 100);
    const avatarAfter = await page.getByTestId('creator-avatar').boundingBox();
    expect(avatarAfter?.width).toBeCloseTo(avatarBefore?.width ?? 0, 0);
    expect(avatarAfter?.height).toBeCloseTo(avatarBefore?.height ?? 0, 0);

    const actions = page.getByTestId('creator-action-bar');
    await expect.poll(async () => (await actions.boundingBox())?.y ?? -100).toBeGreaterThanOrEqual(-1);
    await expect(page.getByRole('button', { name: 'Поделиться профилем' })).toBeVisible();
    await page.screenshot({ path: `${w1EvidenceDir}/author-pinned-${test.info().project.name}-390.png` });
    await page.getByRole('button', { name: 'Поделиться профилем' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await scrollCreator(page, 0);
    await expect.poll(async () => Math.round((await actions.boundingBox())?.y ?? -100)).toBe(18);
    await scrollCreator(page, 100_000);
    const clear = await page.evaluate(() => {
      const panel = document.querySelector('[data-testid="author-content"]');
      const dock = document.querySelector(
        '[data-testid="figma-floating-dock"]',
      );
      return panel && dock
        ? panel.getBoundingClientRect().bottom <=
            dock.getBoundingClientRect().top
        : false;
    });
    expect(clear).toBe(true);
  });

  test('switches both panels and supports Back navigation', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 860 });
    await mockAuthor(page, 'static-tabs', 2, 3);
    await page.goto('/seller/static-tabs');

    await page.getByRole('tab', { name: 'Об авторе', exact: true }).click();
    await expect(page.getByText('Биография', { exact: true })).toBeVisible();
    await expect(
      page.getByRole('tab', { name: 'Об авторе', exact: true }),
    ).toHaveAttribute('aria-selected', 'true');
    await page.getByRole('tab', { name: /^Работы/ }).click();
    await expect(page.getByRole('tab', { name: /^Работы/ })).toHaveAttribute(
      'aria-selected',
      'true',
    );

    await page.getByRole('button', { name: 'Назад' }).click();
    await expect(page).toHaveURL(/\/authors(?:\?|$)/);
    await page.getByText('@static-tabs', { exact: true }).click();
    await expect(page).toHaveURL(/\/seller\/static-tabs/);
    await page.getByRole('button', { name: 'Назад', exact: true }).click();
    await expect(page).toHaveURL(/\/authors(?:\?|$)/);
  });
});

test.describe('shared public desktop navigation', () => {
  test('switches one navigation surface at 1024px and keeps author content mounted', async ({ page }) => {
    await mockAuthor(page, 'desktop-chrome', 2, 3);
    await page.setViewportSize({ width: 1023, height: 900 });
    await page.goto('/seller/desktop-chrome');
    const avatar = page.getByTestId('creator-avatar');
    await expect(avatar).toBeVisible();
    await avatar.evaluate((node) => { node.setAttribute('data-continuity', 'retained'); });
    await expect(page.getByTestId('figma-floating-dock')).toBeVisible();
    await expect(page.getByTestId('desktop-navigation')).toHaveCount(0);
    for (const width of [1024, 1440, 1800]) {
      await page.setViewportSize({ width, height: 900 });
      const nav = page.getByTestId('desktop-navigation');
      await expect(nav).toBeVisible();
      await expect(page.getByTestId('figma-floating-dock')).toHaveCount(0);
      await expect(avatar).toHaveAttribute('data-continuity', 'retained');
      expect((await nav.boundingBox())?.height).toBe(68);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({ path: `${w1EvidenceDir}/desktop-navigation-${test.info().project.name}-${width}.png` });
    }
    await page.getByTestId('desktop-navigation').getByRole('link', { name: 'Авторы', exact: true }).click();
    await expect(page).toHaveURL(/\/authors$/);
    await expect(page.getByTestId('desktop-navigation')).toBeVisible();
    await page.getByTestId('desktop-navigation').getByRole('link', { name: 'Работы', exact: true }).click();
    await expect(page).toHaveURL(/\/works$/);
    await expect(page.getByTestId('desktop-navigation')).toBeVisible();
    await page.getByTestId('desktop-navigation').getByRole('link', { name: 'bidplace — на главную' }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByTestId('desktop-navigation')).toBeVisible();
  });

  test('reuses search and guest auth with focus return to desktop openers', async ({ page }) => {
    await mockAuthor(page, 'desktop-focus', 2, 3);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/seller/desktop-focus');
    const nav = page.getByTestId('desktop-navigation');
    const search = nav.getByRole('button', { name: 'Поиск', exact: true });
    await search.click();
    await expect(page.getByRole('tablist', { name: 'Разделы поиска' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(search).toBeFocused();
    const profile = nav.getByRole('button', { name: 'Профиль', exact: true });
    await profile.click();
    await expect(page).toHaveURL(/\/login\?redirectTo=%2Fseller%2Fdesktop-focus/);
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page).toHaveURL(/\/seller\/desktop-focus$/);
    await expect(profile).toBeFocused();
    await nav.getByRole('button', { name: 'Создать', exact: true }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(nav.getByRole('button', { name: 'Создать', exact: true })).toBeFocused();
  });
});


test('measures author composition and preserves identity across responsive layouts', async ({ page }) => {
  await mockAuthor(page, 'author-parity', 2, 8);
  await page.setViewportSize({ width: 390, height: 874 });
  await page.goto('/seller/author-parity');
  await expect(page.getByTestId('creator-avatar')).toBeVisible();
  await page.getByTestId('creator-avatar').evaluate((node) => node.setAttribute('data-continuity', 'same'));
  for (const width of [320, 390, 440, 1024, 1440, 1800]) {
    await page.setViewportSize({ width, height: 874 });
    await page.evaluate(() => document.fonts.ready);
    const avatar = page.getByTestId('creator-avatar');
    await expect(avatar).toHaveCSS('width', width < 1024 ? '100px' : '140px');
    await expect(avatar).toHaveAttribute('data-continuity', 'same');
    await expect(page.getByTestId('creator-meta').getByText('Анна Морозова')).toHaveCSS('font-size', width < 1024 ? '20px' : '24px');
    const scrollport = await page.getByTestId('creator-scroll').boundingBox();
    expect(scrollport?.width).toBe(width);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const positions = await page.locator('[data-testid^="author-work-actions-"]').evaluateAll((nodes) => nodes.slice(0, 4).map((node) => node.getBoundingClientRect().y));
    if (width >= 1440) expect(new Set(positions).size).toBe(1);
    await page.screenshot({ path: `${w1EvidenceDir}/author-works-${test.info().project.name}-${width}.png` });
    await page.getByRole('tab', { name: 'Об авторе', exact: true }).click();
    await expect.poll(async () => {
      const bio = await page.getByText('Биография', { exact: true }).boundingBox();
      const practice = await page.getByText('Практика и подход', { exact: true }).boundingBox();
      return width >= 1024 ? bio?.y === practice?.y : (practice?.y ?? 0) > (bio?.y ?? 0);
    }).toBe(true);
    await page.screenshot({ path: `${w1EvidenceDir}/author-about-${test.info().project.name}-${width}.png` });
    await page.getByRole('tab', { name: /^Работы/ }).click();
  }
});


test('pins author controls with reduced motion and restores the original row on return', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 390, height: 874 });
  await mockAuthor(page, 'author-reduced', 2, 8);
  await page.goto('/seller/author-reduced');
  const actions = page.getByTestId('creator-action-bar');
  await expect(actions).toBeVisible();
  await actions.evaluate((node) => node.setAttribute('data-continuity', 'same'));
  for (const top of [450, 900, 450, 0]) {
    await scrollCreator(page, top);
    await expect.poll(async () => Math.round((await actions.boundingBox())?.y ?? -100)).toBe(top === 0 ? 18 : 0);
    await expect(actions).toHaveAttribute('data-continuity', 'same');
    await expect(page.getByTestId('creator-avatar')).toHaveCount(1);
  }
});


test('preserves navigation and page states for empty and unavailable authors', async ({ page }) => {
  await mockAuthor(page, 'author-empty', 0, 0);
  await page.route('**/api/authors/author-missing**', (route) => route.fulfill({ status: 404, json: { message: 'Not found' } }));
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 874 });
    await page.goto('/seller/author-empty');
    await expect(page.getByText('У автора пока нет опубликованных работ')).toBeVisible();
    await page.goto('/seller/author-missing');
    await expect(page.getByText('Автор не найден', { exact: true })).toBeVisible();
    await expect(page.getByTestId(width >= 1024 ? 'desktop-navigation' : 'figma-floating-dock')).toBeVisible();
  }
});

test.describe('shared footer and responsive brand', () => {
  test('renders full-width footer with usable real links from mobile through desktop', async ({ page }) => {
    await mockAuthor(page, 'footer-author', 2, 3);
    await page.goto('/seller/footer-author');
    for (const width of [320, 390, 440, 1024, 1440, 1800]) {
      await page.setViewportSize({ width, height: 900 });
      const footer = page.getByTestId('site-footer');
      await expect(page.getByTestId('creator-avatar')).toBeVisible();
      await footer.scrollIntoViewIfNeeded();
      await page.getByTestId('creator-scroll').evaluate(node => { node.scrollTop = node.scrollHeight; });
      await expect(footer).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      expect(Math.round((await footer.boundingBox())?.width ?? 0)).toBe(width);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await expect(footer.getByRole('link', { name: 'Политика и cookies' })).toHaveAttribute('href', '/legal/privacy');
      await expect(footer.getByRole('link', { name: 'Согласие ПДн' })).toHaveAttribute('href', '/legal/data-consent');
      await expect(footer.getByRole('link', { name: 'Правила сервиса' })).toHaveAttribute('href', '/legal/agreement');
      await expect(footer.getByRole('link', { name: /торгов|Оплата/ })).toHaveCount(0);
      for (const link of await footer.getByRole('link').all()) {
        expect((await link.boundingBox())?.height).toBeGreaterThanOrEqual(44);
      }
      await expect(footer.getByTestId('bidplace-logo').locator('img')).toHaveCSS('object-fit', 'contain');
      const dock = page.getByTestId('figma-floating-dock');
      if (width < 1024) {
        const legal = await footer.getByRole('link', { name: 'Политика и cookies' }).boundingBox();
        expect((legal?.y ?? 1000) + (legal?.height ?? 0)).toBeLessThanOrEqual((await dock.boundingBox())?.y ?? 0);
      }
      await footer.screenshot({ path: `${w1EvidenceDir}/footer-${test.info().project.name}-${width}.png` });
    }
    const footer = page.getByTestId('site-footer');
    await footer.getByRole('button', { name: 'Создать работу' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(footer.getByRole('button', { name: 'Создать работу' })).toBeFocused();
    await footer.getByRole('link', { name: 'Правила сервиса' }).click();
    await expect(page).toHaveURL(/\/legal\/agreement/);
    await expect(page.getByTestId('site-footer')).toHaveCount(1);
  });

  test('uses shared navigation buttons and honest header placeholders', async ({ page }) => {
    await mockAuthor(page, 'footer-header', 0, 0);
    await page.setViewportSize({ width: 1024, height: 900 });
    await page.goto('/seller/footer-header');
    const header = page.getByTestId('desktop-navigation');
    await expect(header).toBeVisible();
    const controls = [header.getByRole('link', { name: 'Работы', exact: true }), header.getByRole('link', { name: 'Авторы', exact: true }), header.getByRole('button', { name: 'Поиск', exact: true }), header.getByRole('button', { name: 'Корзина', exact: true }), header.getByRole('button', { name: 'Уведомления', exact: true }), header.getByRole('button', { name: 'Профиль', exact: true }), header.getByRole('button', { name: 'Создать', exact: true })];
    let previousRight = 0;
    for (const control of controls) {
      const box = await control.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(previousRight);
      previousRight = box!.x + box!.width;
    }
    expect(previousRight).toBeLessThanOrEqual(1024);
    for (const name of ['Корзина', 'Уведомления']) {
      const opener = header.getByRole('button', { name, exact: true });
      await opener.click();
      await expect(page.getByRole('dialog', { name, exact: true })).toBeVisible();
      await expect(page.getByText('Этот раздел появится после MVP.')).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(opener).toBeFocused();
    }
    await header.getByRole('link', { name: 'Авторы', exact: true }).click();
    await expect(page).toHaveURL(/authors$/);
    await expect(page.getByTestId('desktop-navigation').getByRole('link', { name: 'Авторы', exact: true })).toHaveAttribute('aria-current', 'page');
  });

  test('measures the desktop Home first section against frame 3139:2222', async ({ page }) => {
    await mockAuthor(page, 'footer-composition', 0, 1);
    const fixture = authorFixture('footer-composition', 0, 1);
    await page.route('**/api/portfolio/home', route => route.fulfill({ json: {
      curatorSelection: { curator: fixture.author, work: { ...fixture.works[0].work, author: fixture.author }, note: 'Выбор куратора' },
      newWorks: fixture.works, newAuthors: [],
    } }));
    await page.setViewportSize({ width: 1800, height: 1000 });
    await page.goto('/');
    const opening = page.locator('#home-opening');
    await expect(opening).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    const box = await opening.boundingBox();
    expect(box?.x).toBe(272);
    expect(box?.y).toBe(140);
    expect(box?.width).toBe(1256);
    const header = page.getByTestId('desktop-navigation');
    await header.getByRole('link', { name: 'Работы', exact: true }).hover();
    await page.screenshot({ path: `${w1EvidenceDir}/home-desktop-${test.info().project.name}-1800.png` });
    await header.screenshot({ path: `${w1EvidenceDir}/header-buttons-${test.info().project.name}.png` });
  });

  test('has one responsive Home brand and keeps forms free of the page footer', async ({ page }) => {
    await mockAuthor(page, 'footer-home', 0, 0);
    await page.route('**/api/portfolio/home', route => route.fulfill({ json: { curatorSelection: null, newWorks: [], newAuthors: [] } }));
    await page.goto('/');
    await expect(page.getByText('Пока здесь тихо')).toBeVisible();
    for (const width of [390, 1023, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await expect(page.getByTestId('home-scroll').getByTestId('bidplace-brand-mark')).toHaveCount(width < 1024 ? 1 : 0);
      await expect(page.getByTestId('desktop-navigation')).toHaveCount(width < 1024 ? 0 : 1);
    }
    const navLogo = page.getByTestId('desktop-navigation').getByTestId('bidplace-logo');
    await expect(navLogo.locator('img')).toHaveCSS('object-fit', 'contain');
    await navLogo.screenshot({ path: `${w1EvidenceDir}/header-logo-${test.info().project.name}.png` });
    await page.goto('/register');
    await expect(page.getByRole('dialog', { name: 'Регистрация' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Электронная почта' })).toBeVisible();
    await expect(page.getByTestId('site-footer')).toHaveCount(0);
  });
});
