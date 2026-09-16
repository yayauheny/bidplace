import { expect, test, type Page } from '@playwright/test';

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
      'Первый абзац истории работы для проверки вкладок.\n\nВторой абзац, чтобы страница точно скроллилась ниже галереи и шапки.\n\nТретий абзац длинной истории: материалы, место и связь автора с этой работой, чтобы sticky tabs проверялись на длинном контенте.',
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
}

async function workMetrics(page: Page) {
  return page.evaluate(() => {
    const labeled = document.querySelector('[data-testid="product-scroll-view"]');
    const chrome = document.querySelector('[data-testid="work-gallery-chrome"]');
    const tabs = document.querySelector('[data-testid="work-sticky-tabs"]');
    const identity = document.querySelector('[data-testid="work-identity"]');
    return {
      scrollTop: labeled instanceof HTMLElement ? labeled.scrollTop : 0,
      chrome: chrome?.getBoundingClientRect().toJSON(),
      tabs: tabs?.getBoundingClientRect().toJSON(),
      identity: identity?.getBoundingClientRect().toJSON(),
      backCount: document.querySelectorAll('[aria-label="Назад"]').length,
      shareCount: document.querySelectorAll('[aria-label="Поделиться работой"]').length,
    };
  });
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

test.describe('work header sticky tabs', () => {
  test('keeps Back/Share on the gallery and sticks only the tabs', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 860 });
    await mockWork(page);
    await page.goto(`/works/${PUBLIC_ID}`);
    await expect(page.getByTestId('work-gallery')).toBeVisible();
    await expect(page.getByTestId('work-sticky-tabs')).toBeVisible();
    const rest = await workMetrics(page);
    expect(rest.backCount).toBe(1);
    expect(rest.shareCount).toBe(1);
    expect(rest.chrome?.y ?? 0).toBeGreaterThan(0);
    expect(rest.tabs?.y ?? 0).toBeGreaterThan(80);

    await scrollWork(page, 720);
    const scrolled = await workMetrics(page);
    expect(scrolled.backCount).toBe(1);
    expect(scrolled.shareCount).toBe(1);
    expect(scrolled.chrome?.y ?? 0).toBeLessThan(rest.chrome?.y ?? 0);
    expect(Math.abs(scrolled.tabs?.y ?? 99)).toBeLessThanOrEqual(2);
    expect(scrolled.tabs?.height ?? 0).toBeGreaterThan(20);
    await expect(page.getByRole('tab', { name: 'История', exact: true })).toBeVisible();
  });
});
