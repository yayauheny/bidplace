import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { e2eEvidenceDir } from './support/evidence-dir';
import { test, expect } from '@playwright/test';
declare global {
  interface Window {
    __images: HTMLImageElement[];
    __sheetFrames: number[];
    __sheetFramesDone: Promise<void>;
  }
}

const workImageId = '10000000-0000-4000-8000-000000000001';
test('login preserves the loaded page images and scroll', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route('**/api/auth/me', async (route) => {
    await route.fulfill({ status: 401, json: { message: 'Unauthorized' } });
  });
  await page.route('**/api/portfolio/home', async (route) => {
    await route.fulfill({
      status: 200,
      json: {
        curatorSelection: null,
        newWorks: [
          {
            work: {
              id: '10000000-0000-4000-8000-000000000002',
              publicId: 'ABCDEFGHIJK',
              title: 'Работа с живым фоном',
              story: null,
              categoryId: '10000000-0000-4000-8000-000000000003',
              technique: null,
              materials: null,
              dimensions: null,
              year: 2026,
              uniqueness: null,
              images: [
                {
                  id: workImageId,
                  position: 0,
                  url: `/api/images/${workImageId}`,
                  mimeType: 'image/svg+xml',
                  byteLength: 1,
                  checksum: 'a'.repeat(64),
                  width: 264,
                  height: 352,
                },
              ],
              publishedAt: '2026-09-10T00:00:00.000Z',
              sharePath: '/works/ABCDEFGHIJK',
            },
            author: {
              id: '10000000-0000-4000-8000-000000000004',
              slug: 'test-author',
              fullName: 'Тестовый автор',
              country: 'Беларусь',
              city: 'Минск',
              discipline: 'Живопись',
              practice: null,
              biography: null,
              profilePhotoUrl: '/api/sellers/test-author/photo',
              telegramUrl: null,
              instagramUrl: null,
              websiteUrl: null,
              shortDescription: 'Описание автора',
              achievements: [],
              sharePath: '/authors/test-author',
            },
          },
        ],
        newAuthors: [
          {
            id: '10000000-0000-4000-8000-000000000006',
            slug: 'frost-author',
            fullName: 'Автор с ореолом',
            country: 'Беларусь',
            city: 'Минск',
            discipline: 'Керамика',
            practice: null,
            biography: null,
            profilePhotoUrl: '/api/sellers/frost-author/photo',
            telegramUrl: null,
            instagramUrl: null,
            websiteUrl: null,
            shortDescription: 'Описание автора',
            achievements: [],
            sharePath: '/authors/frost-author',
          },
        ],
      },
    });
  });
  await page.route(`**/api/images/${workImageId}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'image/svg+xml',
      body: `<svg xmlns="http://www.w3.org/2000/svg" width="264" height="352"><rect width="264" height="352" fill="#cf2b00"/><path d="M0 0h132v352H0z" fill="#148bd1"/><path d="M0 230h264v30H0z" fill="#fff"/></svg>`,
    });
  });
  await page.route('**/api/sellers/frost-author/photo', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'image/svg+xml',
      body: `<svg xmlns="http://www.w3.org/2000/svg" width="264" height="352"><rect width="264" height="352" fill="#2a6f4e"/><path d="M0 0h264v40H0z" fill="#fff"/><path d="M0 312h264v40H0z" fill="#fff"/></svg>`,
    });
  });

  await page.goto('/');
  await expect(page.getByText('Работа с живым фоном')).toBeVisible();
  await expect
    .poll(() =>
      page
        .locator(`img[src*="${workImageId}"]`)
        .evaluateAll(
          (images) =>
            images.length === 1 &&
            images.every(
              (image) =>
                (image as HTMLImageElement).complete &&
                (image as HTMLImageElement).naturalWidth > 0,
            ),
        ),
    )
    .toBe(true);
  const homeScroll = page.getByTestId('home-scroll');
  await homeScroll.evaluate((node) => {
    node.scrollTop = 100;
  });
  const scrollTop = await homeScroll.evaluate((node) => node.scrollTop);
  const count = await page.locator('img').count();
  await page.evaluate(() => {
    window.__images = [...document.images];
  });
  await page
    .getByTestId('figma-floating-dock')
    .getByLabel('Профиль', { exact: true })
    .click();
  await expect(page).toHaveURL(/login/);
  await expect(page.locator('#auth-sheet')).toBeVisible();
  expect(
    await homeScroll.evaluate((node) => {
      for (
        let parent: Element | null = node;
        parent;
        parent = parent.parentElement
      ) {
        const style = getComputedStyle(parent);
        if (style.opacity === '0' || style.display === 'none') return false;
      }
      return true;
    }),
  ).toBe(true);
  await expect(page.locator('img')).toHaveCount(count);
  expect(
    await page.evaluate(() =>
      window.__images.every((i: HTMLImageElement) => i.isConnected),
    ),
  ).toBe(true);
  const close = page.getByRole('button', { name: 'Закрыть', exact: true }).first();
  await close.focus();
  await close.press('Enter');
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('img')).toHaveCount(count);
  expect(await homeScroll.first().evaluate((node) => node.scrollTop)).toBe(
    scrollTop,
  );
  expect(
    await page.evaluate(() =>
      window.__images.every((i: HTMLImageElement) => i.isConnected),
    ),
  ).toBe(true);
});

test('sheet closes by its header, not by dragging its form', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 874 });
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({ status: 401, json: { message: 'Unauthorized' } }),
  );
  await page.route('**/api/portfolio/home', (route) =>
    route.fulfill({
      json: { curatorSelection: null, newWorks: [], newAuthors: [] },
    }),
  );
  await page.goto('/login');
  const sheet = page.locator('#auth-sheet');
  await expect(sheet).toBeVisible();
  await expect(page.getByLabel('Электронная почта')).toBeFocused();
  const box = await sheet.boundingBox();
  if (!box) throw new Error('Missing sheet');
  // A short drag must return without dismissing.
  await page.mouse.move(box.x + 120, box.y + 18);
  await page.mouse.down();
  await page.mouse.move(box.x + 120, box.y + 30, { steps: 8 });
  await page.mouse.up();
  await expect(sheet).toBeVisible();
  // Form content is not a drag handle.
  const field = await page.getByLabel('Электронная почта').boundingBox();
  if (!field) throw new Error('Missing field');
  await page.mouse.move(field.x + 50, field.y + 20);
  await page.mouse.down();
  await page.mouse.move(field.x + 50, field.y + 150, { steps: 12 });
  await page.mouse.up();
  await expect(sheet).toBeVisible();
  const handle = page.locator('[data-sheet-drag-handle]').first();
  await handle.click({ trial: true });
  const hb = await handle.boundingBox();
  if (!hb) throw new Error('Missing handle');
  await page.mouse.move(hb.x + 120, hb.y + 10);
  await page.mouse.down();
  await page.mouse.move(hb.x + 120, hb.y + 145, { steps: 12 });
  await page.mouse.up();
  await expect(page).toHaveURL(/\/$/);
  await expect(sheet).toHaveCount(0);
});

test('busy login keeps the same dismissal guard for a header swipe', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 874 });
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({ status: 401, json: { message: 'Unauthorized' } }),
  );
  await page.route('**/api/portfolio/home', (route) =>
    route.fulfill({
      json: { curatorSelection: null, newWorks: [], newAuthors: [] },
    }),
  );
  let started = false;
  let release!: () => void;
  const response = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/api/auth/login', async (route) => {
    started = true;
    await response;
    await route.fulfill({
      status: 401,
      json: { message: 'Invalid credentials' },
    });
  });
  await page.goto('/login');
  await expect(page.getByLabel('Электронная почта')).toBeFocused();
  await page.getByLabel('Электронная почта').fill('gesture-test@bidplace.test');
  await page
    .getByLabel('Пароль', { exact: true })
    .fill('gesture-test-password');
  await page.getByRole('button', { name: 'Войти', exact: true }).click();
  await expect.poll(() => started).toBe(true);
  const handle = page.locator('[data-sheet-drag-handle]').first();
  await handle.click({ trial: true });
  const box = await handle.boundingBox();
  if (!box) throw new Error('Missing header');
  await page.mouse.move(box.x + 120, box.y + 10);
  await page.mouse.down();
  await page.mouse.move(box.x + 120, box.y + 145, { steps: 12 });
  await page.mouse.up();
  await expect(page).toHaveURL(/login/);
  await expect(page.locator('#auth-sheet')).toBeVisible();
  release();
  await expect(
    page.getByRole('button', { name: 'Войти', exact: true }),
  ).toBeEnabled();
});

test('empty home bounds its action column without shrinking the page container', async ({
  page,
}) => {
  await page.route('**/api/portfolio/home', (route) =>
    route.fulfill({
      status: 200,
      json: { curatorSelection: null, newWorks: [], newAuthors: [] },
    }),
  );
  await page.goto('/');
  const column = page.getByTestId('empty-home-actions');
  const directory = resolve(e2eEvidenceDir, '2026-10-21-desktop-actions');
  await mkdir(directory, { recursive: true });
  for (const width of [390, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(column).toBeVisible();
    await expect
      .poll(async () => Math.round((await column.boundingBox())?.width ?? 0))
      .toBe(Math.min(width - 24, 420));
    const bounds = await column.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.x + bounds!.width / 2).toBeCloseTo(width / 2, 0);
    for (const name of ['Все работы', 'Все авторы']) {
      await expect(
        column.getByRole('button', { name, exact: true }),
      ).toBeVisible();
    }
    expect((await page.getByTestId('home-scroll').boundingBox())!.width).toBe(width);
    const contentWidth = await page.getByTestId('home-scroll').getByTestId('page-content-column').evaluate(node => {
      const style = getComputedStyle(node);
      return node.getBoundingClientRect().width - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    });
    expect(contentWidth).toBeLessThanOrEqual(1280);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: resolve(directory, `${test.info().project.name}-${width}.png`),
      fullPage: true,
    });
  }
});

test('sheet drag cancels to rest and continues downward after slow and fast release', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 874 });
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({ status: 401, json: { message: 'Unauthorized' } }),
  );
  await page.route('**/api/portfolio/home', (route) =>
    route.fulfill({
      json: { curatorSelection: null, newWorks: [], newAuthors: [] },
    }),
  );
  for (const speed of ['slow', 'fast'] as const) {
    await page.goto('/login');
    await expect(page.getByLabel('Электронная почта')).toBeFocused();
    const sheet = page.locator('#auth-sheet');
    const handle = page.locator('#auth-sheet [data-sheet-drag-handle]').first();
    const box = await handle.boundingBox();
    if (!box) throw new Error('Missing handle');
    const rest = (await sheet.boundingBox())!.y;
    await page.mouse.move(box.x + 120, box.y + 10);
    await page.mouse.down();
    await page.mouse.move(box.x + 120, box.y + 65, { steps: 8 });
    await handle.dispatchEvent('pointercancel', {
      pointerId: 1,
      isPrimary: true,
      bubbles: true,
    });
    await page.mouse.up();
    await expect
      .poll(async () => Math.round((await sheet.boundingBox())?.y ?? -1))
      .toBe(Math.round(rest));
    await expect(page).toHaveURL(/login$/);
    await page.mouse.move(box.x + 120, box.y + 10);
    await page.mouse.down();
    const steps = speed === 'slow' ? 12 : 2;
    for (let step = 1; step <= steps; step++) {
      await page.mouse.move(box.x + 120, box.y + 10 + (140 * step) / steps);
      if (speed === 'slow')
        await page.evaluate(
          () =>
            new Promise<void>((resolveFrame) =>
              requestAnimationFrame(() => resolveFrame()),
            ),
        );
    }
    await expect
      .poll(async () => (await sheet.boundingBox())!.y - rest)
      .toBeGreaterThan(100);
    const releasedTop = (await sheet.boundingBox())!.y;
    await page.evaluate(() => {
      const element = document.getElementById('auth-sheet')!;
      window.__sheetFrames = [];
      window.__sheetFramesDone = (async () => {
        for (let frame = 0; frame < 30; frame++) {
          await new Promise<void>((resolveFrame) =>
            requestAnimationFrame(() => resolveFrame()),
          );
          if (!element.isConnected) break;
          window.__sheetFrames.push(element.getBoundingClientRect().top);
        }
      })();
    });
    await page.mouse.up();
    await expect(page).toHaveURL(/\/$/);
    await page.evaluate(() => window.__sheetFramesDone);
    const frames = await page.evaluate(() => window.__sheetFrames);
    expect(frames.length).toBeGreaterThan(1);
    expect(Math.min(...frames)).toBeGreaterThanOrEqual(releasedTop - 1);
    for (let index = 1; index < frames.length; index++)
      expect(frames[index]).toBeGreaterThanOrEqual(frames[index - 1] - 1);
    await test
      .info()
      .attach(`sheet-${speed}-frames`, {
        body: JSON.stringify({ releasedTop, frames }),
        contentType: 'application/json',
      });
  }
});
