import { expect, test, type Page } from '@playwright/test';

const PUBLIC_ID = 'daliEstate1';
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
    story: 'История работы для шаринга.',
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
    creationStory: { storyToken: 0, blocks: [] },
  };
  return {
    work,
    author,
    relatedWorks: [],
  };
}

function authorFixture(slug: string) {
  const author = {
    id: '10000000-0000-4000-8000-000000000004',
    slug,
    fullName: 'Анна Морозова',
    country: 'BY',
    city: 'Минск',
    discipline: 'Живопись,Картины,Масло',
    practice: 'Практика автора',
    profilePhotoUrl: `/api/sellers/${slug}/photo`,
    telegramUrl: 'https://t.me/anna',
    instagramUrl: 'https://instagram.com/anna',
    websiteUrl: 'https://anna.example',
    shortDescription: 'Короткая биография для проверки шапки.',
    biography: null,
    achievements: [],
    sharePath: `/authors/${slug}`,
  };
  return {
    author,
    works: [],
    pagination: { page: 1, limit: 20, total: 0 },
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

async function mockAuthor(page: Page, slug: string) {
  const payload = authorFixture(slug);
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
  await page.route(`**/api/sellers/${slug}/photo`, (route) =>
    route.fulfill({
      contentType: 'image/svg+xml',
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="112" height="112"><rect width="112" height="112" fill="#cccccc"/></svg>',
    }),
  );
  await page.route('**/api/images/**', (route) =>
    route.fulfill({
      contentType: 'image/svg+xml',
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="112" height="112"><rect width="112" height="112" fill="#cccccc"/></svg>',
    }),
  );
}

function dialog(page: Page) {
  return page.getByRole('dialog', { name: 'Поделиться' });
}

async function expectOneSheet(page: Page) {
  await expect(dialog(page)).toHaveCount(1);
  await expect(dialog(page)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Закрыть окно' })).toHaveCount(
    1,
  );
}

async function closeWithX(page: Page) {
  await page.getByRole('button', { name: 'Закрыть окно' }).click();
  await expect(dialog(page)).toHaveCount(0, { timeout: 2000 });
}

async function expectClosed(page: Page) {
  await expect(dialog(page)).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Закрыть окно' })).toHaveCount(
    0,
  );
}

test.describe('share sheet motion', () => {
  test('opens one Work sheet and closes it with X', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 860 });
    await mockWork(page);
    await page.goto(`/product/${PUBLIC_ID}`);
    await expect(
      page.getByRole('button', { name: 'Поделиться работой' }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Поделиться работой' }).click();
    await expectOneSheet(page);
    await closeWithX(page);
    await expectClosed(page);
  });

  test('does not duplicate the Work sheet on rapid open and close', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 860 });
    await mockWork(page);
    await page.goto(`/product/${PUBLIC_ID}`);
    const share = page.getByRole('button', { name: 'Поделиться работой' });
    await expect(share).toBeVisible();
    await share.evaluate((button) => {
      if (!(button instanceof HTMLElement)) {
        throw new Error('missing share control');
      }
      button.click();
      button.click();
    });
    await expectOneSheet(page);
    await closeWithX(page);
    await share.click();
    await expectOneSheet(page);
    await page.getByRole('button', { name: 'Закрыть окно' }).click();
    await share.click();
    await expectOneSheet(page);
    await closeWithX(page);
    await expectClosed(page);
  });

  test('opens one Creator sheet and closes it with X', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 860 });
    await mockAuthor(page, 'motion-share');
    await page.goto('/seller/motion-share');
    const openQr = async () => {
      await page.getByRole('button', { name: 'Действия с профилем' }).click();
      await page.getByRole('button', { name: 'QR-код профиля' }).click();
    };
    await openQr();
    await expectOneSheet(page);
    await closeWithX(page);
    await openQr();
    await expectOneSheet(page);
    await closeWithX(page);
    await expectClosed(page);
  });
});

for (const width of [320, 390, 1024, 1440]) {
  test(`Work share matches compact geometry and keeps actions reachable at ${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 874 });
    await mockWork(page);
    await page.goto(`/product/${PUBLIC_ID}`);
    await page.getByRole('button', { name: 'Поделиться работой' }).click();
    const sheet = dialog(page);
    const qr = page.getByRole('img', { name: 'QR-код публичной страницы' });
    await expect(qr).toBeVisible();
    await expect(sheet.locator('#app-dialog-content')).toHaveCSS(
      'border-top-left-radius',
      '32px',
    );
    const bounds = await sheet.boundingBox();
    expect(bounds?.width).toBe(Math.min(width, 390));
    expect(bounds?.height).toBe(428);
    if (width <= 390) {
      const close = page.getByRole('button', { name: 'Закрыть окно' });
      expect(
        await close.evaluate((button) => {
          const box = button.getBoundingClientRect();
          return [2, box.height - 2].every((y) =>
            [2, box.width - 2].every((x) =>
              button.contains(document.elementFromPoint(box.x + x, box.y + y)),
            ),
          );
        }),
      ).toBe(true);
    }
    const image = await qr.boundingBox();
    expect(image?.width).toBe(164);
    expect(image?.height).toBe(164);
    const title = sheet.getByText('Поделиться', { exact: true });
    await expect(title).toHaveCSS('font-size', '18px');
    await expect(title).toHaveCSS('letter-spacing', '-0.36px');
    await expect(title).toHaveCSS('text-align', 'center');
    for (const label of ['Скачать QR', 'Копировать ссылку']) {
      const action = sheet.getByRole('button', { name: label, exact: true });
      await expect(action).toBeVisible();
      const box = await action.boundingBox();
      expect(box?.width).toBe((bounds?.width ?? 0) - 40);
      expect(box?.height).toBe(55);
    }
    await page.keyboard.press('Escape');
    await expectClosed(page);
    await expect(
      page.getByRole('button', { name: 'Поделиться работой' }),
    ).toBeFocused();
  });
}

test('downloaded Work QR is a PNG and copying uses the same canonical public URL', async ({
  page,
}) => {
  await mockWork(page);
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: async (text: string) => {
          document.documentElement.dataset.copiedUrl = text;
        },
      },
      configurable: true,
    });
  });
  await page.goto(`/product/${PUBLIC_ID}`);
  await page.getByRole('button', { name: 'Поделиться работой' }).click();
  const qr = page.getByRole('img', { name: 'QR-код публичной страницы' });
  await expect(qr).toBeVisible();
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Скачать QR', exact: true }).click();
  const download = await downloading;
  expect(download.suggestedFilename()).toBe(`bidplace-${PUBLIC_ID}.png`);
  const stream = await download.createReadStream();
  if (!stream) throw new Error('Missing PNG stream');
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  const png = Buffer.concat(chunks);
  expect(png.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
  expect(png.readUInt32BE(16)).toBe(656);
  expect(png.readUInt32BE(20)).toBe(656);
  await page
    .getByRole('button', { name: 'Копировать ссылку', exact: true })
    .click();
  await expect
    .poll(() => page.locator('html').getAttribute('data-copied-url'))
    .toBe(`http://localhost:8081/works/${PUBLIC_ID}`);
});

for (const method of ['backdrop', 'swipe'] as const) {
  test(`Work share closes through ${method}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 874 });
    await mockWork(page);
    await page.goto(`/product/${PUBLIC_ID}`);
    await page.getByRole('button', { name: 'Поделиться работой' }).click();
    await expect(dialog(page)).toBeVisible();
    if (method === 'backdrop') await page.mouse.click(10, 10);
    else {
      const handle = dialog(page).locator('[data-sheet-drag-handle]');
      const box = await handle.boundingBox();
      if (!box) throw new Error('Missing share drag handle');
      await page.mouse.move(box.x + 15, box.y + 10);
      await page.mouse.down();
      await page.mouse.move(box.x + 15, box.y + 150, { steps: 12 });
      await page.mouse.up();
    }
    await expectClosed(page);
  });
}
