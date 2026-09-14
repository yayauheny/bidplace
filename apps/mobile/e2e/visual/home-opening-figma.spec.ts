import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { expect, test, type Page } from '@playwright/test';

import { portfolioHomeResponseSchema } from '@bidplace/contracts';
import { designTokens } from '@bidplace/design-tokens';

const visualDir = resolve(process.cwd(), 'e2e/visual');
const fixturePath = resolve(visualDir, 'fixtures/home-opening.json');
const avatarPath = resolve(
  process.cwd(),
  '../../packages/database/prisma/fixtures/seller-profile/vex.png',
);
const coverPath = resolve(
  process.cwd(),
  '../../packages/database/prisma/fixtures/product-images/dali-estate.png',
);
const goldenPath = resolve(
  visualDir,
  'references/home-opening-figma-390.png',
);
const actualDir = resolve(visualDir, '../../test-results/home-opening');

const openingViewport = {
  width: designTokens.layout.phoneWidth,
  height: designTokens.layout.phoneFoldHeight,
} as const;

const authorColumnCrop = {
  x: 12,
  y: 181,
  width: designTokens.layout.openingAuthorWidth,
  height: 324,
} as const;

test.beforeEach(async ({ page }) => {
  await page.setViewportSize(openingViewport);
});

test('Home Opening author column matches first-fold 390×860 capture', async ({
  page,
}) => {
  test.setTimeout(120_000);
  await mkdir(actualDir, { recursive: true });
  const body = portfolioHomeResponseSchema.parse(
    JSON.parse(await readFile(fixturePath, 'utf8')),
  );
  const avatar = await readFile(avatarPath);
  const cover = await readFile(coverPath);
  const golden = await readFile(goldenPath);

  expect(pngSize(golden)).toEqual(openingViewport);
  await installOpeningMock(page, { body, avatar, cover });

  await page.goto('/');
  await expect(page.getByText('Открытие недели', { exact: true })).toBeVisible();
  const author = page.locator('#home-opening-author');
  await expect(author.getByText('@vex', { exact: true })).toBeVisible();
  await expect(page.getByText('Выбор куратора')).toHaveCount(1);
  await expect(page.getByText('Активные торги')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Смотреть профиль' })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  const authorBox = await author.boundingBox();
  expect(authorBox).not.toBeNull();
  expect(authorBox?.width).toBeCloseTo(designTokens.layout.openingAuthorWidth, 1);

  await assertOpeningType(page);
  await assertQuietPill(page);

  const clip = {
    x: Math.round(authorBox!.x),
    y: Math.round(authorBox!.y),
    width: Math.round(authorBox!.width),
    height: Math.round(authorBox!.height),
  };
  const actualAuthor = await page.screenshot({
    clip,
    path: resolve(actualDir, 'author-actual.png'),
  });
  await writeFile(resolve(actualDir, 'fold-actual.png'), await page.screenshot());

  const diff = await compareAuthorColumn(page, {
    actualPng: actualAuthor,
    goldenPng: golden,
    crop: authorColumnCrop,
  });
  await writeFile(
    resolve(actualDir, 'author-golden-crop.png'),
    Buffer.from(diff.goldenCropPng, 'base64'),
  );
  expect(diff.mismatchRatio).toBeLessThan(0.12);
});

async function installOpeningMock(
  page: Page,
  assets: {
    body: ReturnType<typeof portfolioHomeResponseSchema.parse>;
    avatar: Buffer;
    cover: Buffer;
  },
) {
  const cors = (route: {
    request: () => { headers: () => Record<string, string> };
  }) => {
    const origin =
      route.request().headers().origin ?? 'http://localhost:8091';
    return {
      'access-control-allow-origin': origin,
      'access-control-allow-credentials': 'true',
      'access-control-allow-headers': 'content-type,authorization',
      'access-control-allow-methods': 'GET,OPTIONS',
    };
  };

  await page.route('**/api/**', async (route) => {
    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: cors(route) });
      return;
    }
    await route.fallback();
  });
  await page.route('**/api/auth/me', async (route) => {
    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: cors(route) });
      return;
    }
    await route.fulfill({
      status: 401,
      headers: cors(route),
      json: { message: 'Unauthorized' },
    });
  });
  await page.route('**/api/portfolio/home', async (route) => {
    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: cors(route) });
      return;
    }
    await route.fulfill({
      status: 200,
      headers: { ...cors(route), 'content-type': 'application/json' },
      json: assets.body,
    });
  });
  await page.route('**/api/images/**', async (route) => {
    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: cors(route) });
      return;
    }
    await route.fulfill({
      status: 200,
      headers: { ...cors(route), 'content-type': 'image/png' },
      body: assets.cover,
    });
  });
  await page.route('**/api/sellers/vex/photo', async (route) => {
    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: cors(route) });
      return;
    }
    await route.fulfill({
      status: 200,
      headers: { ...cors(route), 'content-type': 'image/png' },
      body: assets.avatar,
    });
  });
}

async function assertOpeningType(page: Page) {
  const author = page.locator('#home-opening-author');
  const handle = author.getByText('@vex', { exact: true });
  const title = page.locator('#home-opening-note-title');
  const handleStyle = await computed(handle);
  expect(handleStyle.fontSize).toBe('22px');
  expect(handleStyle.fontWeight).toBe('500');
  expect(handleStyle.lineHeight).toBe('25px');
  expect(handleStyle.color).toBe('rgb(42, 42, 42)');
  expect(emOrPx(handleStyle.letterSpacing, 22)).toBeCloseTo(-0.22, 2);

  const bio = author.getByText(/Ищу логику/);
  const bioStyle = await computed(bio);
  expect(bioStyle.fontSize).toBe('14px');
  expect(bioStyle.fontWeight).toBe('400');
  expect(bioStyle.color).toBe('rgb(111, 111, 111)');

  const titleStyle = await computed(title);
  expect(titleStyle.fontSize).toBe('20px');
  expect(titleStyle.fontWeight).toBe('500');
  expect(titleStyle.color).toBe('rgb(42, 42, 42)');
  expect(emOrPx(titleStyle.letterSpacing, 20)).toBeCloseTo(-0.4, 2);

  const noteStyle = await computed(
    page.getByText(/безупречная техника встречается/),
  );
  expect(noteStyle.fontSize).toBe('16px');
  expect(noteStyle.lineHeight).toBe('22px');
  expect(noteStyle.fontWeight).toBe('400');
  expect(noteStyle.color).toBe('rgb(86, 86, 86)');
}

async function assertQuietPill(page: Page) {
  const button = page.getByRole('button', { name: 'Смотреть профиль' });
  const chrome = await computed(button);
  expect(chrome.paddingTop).toBe('8px');
  expect(chrome.paddingBottom).toBe('8px');
  expect(chrome.paddingLeft).toBe('14px');
  expect(chrome.paddingRight).toBe('14px');
  expect(chrome.borderTopLeftRadius).toBe('28px');
  const label = await computed(button.getByText('Смотреть профиль', { exact: true }));
  expect(label.fontSize).toBe('13px');
  expect(label.lineHeight).toBe('18px');
  expect(label.fontWeight).toBe('500');
  const box = await button.boundingBox();
  expect(box?.width).toBeGreaterThan(40);
  expect(box?.width).toBeLessThan(200);
  expect(box?.height).toBeGreaterThan(24);
  expect(box?.height).toBeLessThan(44);
}

async function computed(locator: ReturnType<Page['locator']> | ReturnType<Page['getByText']>) {
  return locator.evaluate((node) => {
    const style = getComputedStyle(node);
    return {
      fontSize: style.fontSize,
      fontWeight: style.fontWeight,
      lineHeight: style.lineHeight,
      letterSpacing: style.letterSpacing,
      color: style.color,
      paddingTop: style.paddingTop,
      paddingBottom: style.paddingBottom,
      paddingLeft: style.paddingLeft,
      paddingRight: style.paddingRight,
      borderTopLeftRadius: style.borderTopLeftRadius,
    };
  });
}

function emOrPx(letterSpacing: string, fontSizePx: number) {
  if (letterSpacing.endsWith('em')) {
    return Number.parseFloat(letterSpacing) * fontSizePx;
  }
  if (letterSpacing === 'normal') return 0;
  return Number.parseFloat(letterSpacing);
}

async function compareAuthorColumn(
  page: Page,
  input: {
    actualPng: Buffer;
    goldenPng: Buffer;
    crop: { x: number; y: number; width: number; height: number };
  },
) {
  return page.evaluate(
    async ({ actualB64, goldenB64, crop }) => {
      const load = (b64: string) =>
        new Promise<HTMLImageElement>((resolveImage, reject) => {
          const image = new Image();
          image.onload = () => resolveImage(image);
          image.onerror = () => reject(new Error('image decode failed'));
          image.src = `data:image/png;base64,${b64}`;
        });
      const actual = await load(actualB64);
      const golden = await load(goldenB64);
      const width = Math.min(actual.width, crop.width);
      const height = Math.min(actual.height, crop.height);
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('canvas');
      ctx.drawImage(
        golden,
        crop.x,
        crop.y,
        width,
        height,
        0,
        0,
        width,
        height,
      );
      const goldenCropPng = canvas.toDataURL('image/png').split(',')[1] ?? '';
      const goldenData = ctx.getImageData(0, 0, width, height).data;
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(actual, 0, 0, width, height);
      const actualData = ctx.getImageData(0, 0, width, height).data;
      let mismatched = 0;
      for (let i = 0; i < goldenData.length; i += 4) {
        const dr = Math.abs(goldenData[i] - actualData[i]);
        const dg = Math.abs(goldenData[i + 1] - actualData[i + 1]);
        const db = Math.abs(goldenData[i + 2] - actualData[i + 2]);
        if (dr + dg + db > 48) mismatched += 1;
      }
      return {
        goldenCropPng,
        mismatchRatio: mismatched / (width * height),
        width,
        height,
      };
    },
    {
      actualB64: input.actualPng.toString('base64'),
      goldenB64: input.goldenPng.toString('base64'),
      crop: input.crop,
    },
  );
}

function pngSize(buffer: Buffer) {
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}
