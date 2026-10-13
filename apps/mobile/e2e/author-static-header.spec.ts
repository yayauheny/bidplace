import { expect, test, type Page } from '@playwright/test';

const checksum = 'a'.repeat(64);
const categoryId = '10000000-0000-4000-8000-000000000099';
const secondCategoryId = '10000000-0000-4000-8000-000000000098';

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
    route.fulfill({ json: { categories: [
      { id: categoryId, slug: 'sculpture', name: 'Скульптура', description: null },
      { id: secondCategoryId, slug: 'painting', name: 'Живопись', description: null },
    ] } }),
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

test.describe('static public creator header', () => {
  test('preserves identity, actions, social links and both tabs', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 860 });
    await mockAuthor(page, 'static-author', 3, 3);
    await page.goto('/seller/static-author');

    const header = page.getByTestId('creator-static-header');
    await expect(header).toBeVisible();
    await expect(page.getByTestId('creator-sticky-header')).toHaveCount(0);
    await expect(page.getByTestId('creator-avatar')).toHaveCount(1);
    await expect(page.getByTestId('creator-handle')).toHaveText('@static-author');
    await expect(page.getByTestId('creator-avatar')).toHaveCSS('width', '100px');
    await expect(page.getByTestId('creator-meta')).toContainText('Анна Морозова');
    await expect(page.getByTestId('creator-social-telegram')).toBeVisible();
    await expect(page.getByTestId('creator-social-instagram')).toBeVisible();
    await expect(page.getByTestId('creator-social-website')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Назад' })).toBeVisible();
    await expect(page.getByRole('tab', { name: /^Работы/ })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Об авторе', exact: true })).toBeVisible();

    expect(
      await header.evaluate((node) => getComputedStyle(node).position),
    ).not.toBe('sticky');

    await page.getByRole('button', { name: 'Поделиться профилем' }).click();
    await expect(page.getByRole('button', { name: 'Ссылка на профиль' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Пожаловаться на автора' })).toBeVisible();
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Действия с профилем' }).click();
    await page.getByRole('button', { name: 'QR-код профиля' }).click();
    await expect(page.getByRole('button', { name: 'Скачать QR' })).toBeVisible();
  });

  test('selects, applies and clears multiple author categories', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 860 });
    await mockAuthor(page, 'static-filter', 2, 3);
    await page.goto('/seller/static-filter');

    await page.getByRole('button', { name: 'Категория' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('checkbox', { name: 'Скульптура' }).click();
    await page.getByRole('checkbox', { name: 'Живопись' }).click();
    await page.getByRole('button', { name: 'Показать работы' }).click();
    await expect.poll(() => new URL(page.url()).searchParams.get('categories'))
      .toBe(`${categoryId},${secondCategoryId}`);
    expect(
      await page.getByTestId('creator-filter-strip').evaluate(
        (node) => node.scrollWidth > node.clientWidth,
      ),
    ).toBe(true);
    await expect(page.getByRole('button', { name: 'Удалить Скульптура' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Удалить Живопись' })).toBeVisible();
    await page.getByRole('button', { name: 'Удалить Скульптура' }).click();
    await expect.poll(() => new URL(page.url()).searchParams.get('categories'))
      .toBe(secondCategoryId);
    await page.getByRole('button', { name: 'Удалить Живопись' }).click();
    await expect.poll(() => new URL(page.url()).searchParams.get('categories'))
      .toBeNull();
  });

  test('shows honest placeholders for following and liking', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 860 });
    await mockAuthor(page, 'static-placeholder', 2, 2);
    await page.goto('/seller/static-placeholder');

    await page.getByRole('button', { name: 'Подписаться на автора' }).click();
    await expect(page.getByText('Скоро появится')).toBeVisible();
    await page.getByRole('button', { name: 'Понятно' }).click();

    await page.getByRole('button', { name: /Нравится работа/ }).first().click();
    await expect(page.getByText('Избранные работы пока недоступны.')).toBeVisible();
    await expect(page.getByRole('link', { name: /Редактировать работу/ })).toHaveCount(0);
  });

  test('scrolls away naturally without resizing and leaves room above the dock', async ({ page }) => {
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
    await expect.poll(async () => (await header.boundingBox())?.y ?? 999)
      .toBeLessThan((first?.y ?? 0) - 100);
    const avatarAfter = await page.getByTestId('creator-avatar').boundingBox();
    expect(avatarAfter?.width).toBeCloseTo(avatarBefore?.width ?? 0, 0);
    expect(avatarAfter?.height).toBeCloseTo(avatarBefore?.height ?? 0, 0);

    await scrollCreator(page, 100_000);
    const clear = await page.evaluate(() => {
      const panel = document.querySelector('[data-testid="author-content"]');
      const dock = document.querySelector('[data-testid="figma-floating-dock"]');
      return panel && dock
        ? panel.getBoundingClientRect().bottom <= dock.getBoundingClientRect().top
        : false;
    });
    expect(clear).toBe(true);
  });

  test('switches both panels and supports Back navigation', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 860 });
    await mockAuthor(page, 'static-tabs', 2, 3);
    await page.goto('/seller/static-tabs');

    await page.getByRole('tab', { name: 'Об авторе', exact: true }).click();
    await expect(page.getByText('Биография', { exact: true })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Об авторе', exact: true }))
      .toHaveAttribute('aria-selected', 'true');
    await page.getByRole('tab', { name: /^Работы/ }).click();
    await expect(page.getByRole('tab', { name: /^Работы/ }))
      .toHaveAttribute('aria-selected', 'true');

    await page.getByRole('button', { name: 'Назад' }).click();
    await expect(page).toHaveURL(/\/authors(?:\?|$)/);
  });
});
