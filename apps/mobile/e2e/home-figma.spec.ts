import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { expect, test, type Page } from '@playwright/test';

import {
  homeArtworkSvg,
  homeAuthor,
  homeCuratorSelection,
  homePayload,
  homePortraitSvg,
  homeSelectedPublicId,
} from './support/home-fixtures';
import { e2eEvidenceDir } from './support/evidence-dir';

const artifactDir = resolve(e2eEvidenceDir, 'home');

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
});

test('selected opening, null opening, and catalog empty states', async ({
  page,
}) => {
  test.setTimeout(120_000);
  await mkdir(artifactDir, { recursive: true });
  const home = await installHomeMock(page);

  home.body = homePayload();
  await page.goto('/');
  await expect(page.getByText('Открытие недели', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: /Сальвадор Дали/ })).toHaveAttribute(
    'href',
    `/product/${homeSelectedPublicId}`,
  );
  await expect(page.getByRole('button', { name: 'Смотреть профиль' })).toBeVisible();
  await expect(page.getByText('Новые работы', { exact: true })).toBeVisible();
  await expect(page.getByText('Новые авторы', { exact: true })).toBeVisible();
  await expect(page.getByText('Выбор куратора')).toHaveCount(0);
  await expect(page.getByText('Активные торги')).toHaveCount(0);
  await expectNoHorizontalOverflow(page);

  const selectedMetrics = await measureHome(page);
  expect(selectedMetrics.opening).not.toBeNull();
  expect(selectedMetrics.openingHeading?.x ?? 99).toBeLessThan(24);
  expect(selectedMetrics.openingWork?.width).toBeCloseTo(264, 1);
  expect(selectedMetrics.openingWork?.height).toBeCloseTo(352, 1);
  expect(selectedMetrics.newWorksCard?.width).toBeCloseTo(264, 1);
  expect(selectedMetrics.newWorksCard?.height).toBeCloseTo(352, 1);
  expect(selectedMetrics.shell?.width).toBeCloseTo(390, 1);
  await writeFile(
    resolve(artifactDir, 'measurements.json'),
    `${JSON.stringify(selectedMetrics, null, 2)}\n`,
  );
  await screenshotHomeFold(
    page,
    resolve(artifactDir, 'home-selected-390-first-fold.png'),
  );
  await screenshotHomeFull(
    page,
    resolve(artifactDir, 'home-selected-390-full.png'),
    { minHeight: 1400 },
  );
  await assertDockDoesNotCoverContent(page);

  await page.getByRole('button', { name: 'Смотреть профиль' }).click();
  await expect(page).toHaveURL(/\/seller\/vex/);
  await page.goto('/');
  await page.getByRole('link', { name: /Сальвадор Дали/ }).click();
  await expect(page).toHaveURL(`/product/${homeSelectedPublicId}`);
  await page.goto('/');
  await page.getByRole('button', { name: 'Смотреть все', exact: true }).click();
  await expect(page).toHaveURL(/\/works/);
  await page.goto('/');
  await page.getByRole('button', { name: 'Смотреть всех' }).click();
  await expect(page).toHaveURL(/\/authors/);

  home.body = homePayload({ curatorSelection: null });
  await page.goto('/');
  await expect(page.getByText('Открытие недели', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Новые работы', { exact: true })).toBeVisible();
  await expect(page.getByText('Сальвадор Дали')).toHaveCount(0);
  await screenshotHomeFold(
    page,
    resolve(artifactDir, 'home-null-390-first-fold.png'),
  );
  await screenshotHomeFull(
    page,
    resolve(artifactDir, 'home-null-390-full.png'),
    { minHeight: 900 },
  );

  home.body = homePayload({
    curatorSelection: homeCuratorSelection(),
    newWorks: [],
  });
  await page.goto('/');
  await expect(page.getByText('Открытие недели', { exact: true })).toBeVisible();
  await expect(page.getByText('Новые работы', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Новые авторы', { exact: true })).toBeVisible();
  await screenshotHomeFull(
    page,
    resolve(artifactDir, 'home-works-empty-390.png'),
    { minHeight: 900 },
  );

  home.body = homePayload({
    curatorSelection: null,
    newAuthors: [],
  });
  await page.goto('/');
  await expect(page.getByText('Новые работы', { exact: true })).toBeVisible();
  await expect(page.getByText('Новые авторы', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Все авторы' })).toBeVisible();
  await page.getByRole('button', { name: 'Все авторы' }).click();
  await expect(page).toHaveURL(/\/authors/);
  await page.goto('/');
  await screenshotHomeFull(
    page,
    resolve(artifactDir, 'home-authors-empty-390.png'),
    { minHeight: 800 },
  );
});

test('renders curator heading only when the selection has a note', async ({
  page,
}) => {
  const home = await installHomeMock(page);
  home.body = homePayload({
    curatorSelection: homeCuratorSelection({
      note: 'Главная визуальная находка этой недели.',
    }),
  });
  await page.goto('/');
  await expect(page.getByText('Открытие недели', { exact: true })).toBeVisible();
  await expect(page.getByText('Выбор куратора')).toHaveCount(1);
  await expect(
    page.getByText('Главная визуальная находка этой недели.'),
  ).toBeVisible();
  await expect(page.getByText('Активные торги')).toHaveCount(0);
});

test('loading, error retry, broken media, long copy, zoom and motion', async ({
  page,
}) => {
  test.setTimeout(120_000);
  await mkdir(artifactDir, { recursive: true });
  const home = await installHomeMock(page, { breakSelectedWork: true });

  home.hold = new Promise<void>((resolveHold) => {
    home.release = resolveHold;
  });
  const pending = page.goto('/');
  await expect(page.getByRole('progressbar')).toBeVisible();
  await page.screenshot({
    path: resolve(artifactDir, 'home-loading-390.png'),
  });
  home.release?.();
  await pending;
  await expect(page.getByText('Открытие недели', { exact: true })).toBeVisible();

  home.failRemaining = 2;
  await page.goto('/');
  await expect(page.getByText('Не удалось загрузить главную')).toBeVisible();
  await expect(page.getByText('Открытие недели', { exact: true })).toHaveCount(
    0,
  );
  await page.screenshot({
    path: resolve(artifactDir, 'home-error-390.png'),
  });
  await page.getByRole('button', { name: 'Повторить' }).click();
  await expect(page.getByText('Открытие недели', { exact: true })).toBeVisible();

  home.body = homePayload();
  await page.goto('/');
  await expect(
    page.getByRole('img', { name: 'Изображение недоступно: Salvador Dalí Estate & Fundació Gala Сальвадор Дали' }),
  ).toBeVisible({ timeout: 15_000 });
  await screenshotHomeFull(
    page,
    resolve(artifactDir, 'home-broken-media-390.png'),
    { minHeight: 1400 },
  );

  home.breakSelectedWork = false;
  home.body = homePayload({
    curatorSelection: homeCuratorSelection({
      title:
        'Очень длинное название выбранной работы для проверки переноса и обрезки',
      curator: homeAuthor({
        slug: 'vex-with-an-unusually-long-public-handle',
        shortDescription:
          'Длинное описание практики, которое не должно выталкивать карточку.',
      }),
    }),
  });
  await page.goto('/');
  await expect(page.getByText(/Очень длинное название/)).toBeVisible();
  await expect(page.locator('#home-opening-author')).toContainText(
    '@vex-with-an-unusually-long-public-handle',
  );
  await expectNoHorizontalOverflow(page);
  await screenshotHomeFull(
    page,
    resolve(artifactDir, 'home-long-copy-390.png'),
    { minHeight: 1400 },
  );
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.getByText('Открытие недели', { exact: true })).toBeVisible();
  await page.screenshot({
    path: resolve(artifactDir, 'home-reduced-motion-390.png'),
  });

  await page.evaluate(() => {
    document.body.style.zoom = '2';
  });
  await expect(page.getByText('Открытие недели', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Смотреть всех' }).scrollIntoViewIfNeeded();
  await expectNoHorizontalOverflow(page);
  await screenshotHomeFull(
    page,
    resolve(artifactDir, 'home-zoom-200-390.png'),
    { minHeight: 844 },
  );
});

test('keyboard and centered phone column at 390, 1024 and 1440', async ({
  page,
}) => {
  test.setTimeout(120_000);
  await mkdir(artifactDir, { recursive: true });
  await installHomeMock(page);

  for (const viewport of [
    { width: 390, height: 860, file: 'home-selected-390-860.png' },
    { width: 390, height: 844, file: 'home-selected-390-844-column.png' },
    { width: 1024, height: 768, file: 'home-selected-1024.png' },
    { width: 1440, height: 900, file: 'home-selected-1440.png' },
  ]) {
    await page.setViewportSize({
      width: viewport.width,
      height: viewport.height,
    });
    await page.goto('/');
    await expect(page.getByText('Открытие недели', { exact: true })).toBeVisible();
    const metrics = await measureHome(page);
    expect(metrics.shell?.width).toBeCloseTo(390, 1);
    expect((metrics.shell?.x ?? 0) + (metrics.shell?.width ?? 0) / 2).toBeCloseTo(
      viewport.width / 2,
      1,
    );
    await page.screenshot({
      path: resolve(artifactDir, viewport.file),
      fullPage: true,
    });
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('link', { name: /Сальвадор Дали/ }).focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(`/product/${homeSelectedPublicId}`);
});

type HomeMock = {
  body: ReturnType<typeof homePayload>;
  failRemaining: number;
  breakSelectedWork: boolean;
  hold: Promise<void> | null;
  release?: () => void;
};

async function installHomeMock(
  page: Page,
  options?: { breakSelectedWork?: boolean },
): Promise<HomeMock> {
  const home: HomeMock = {
    body: homePayload(),
    failRemaining: 0,
    breakSelectedWork: options?.breakSelectedWork ?? false,
    hold: null,
  };

  const cors = (route: { request: () => { headers: () => Record<string, string> } }) => {
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
    if (home.hold) await home.hold;
    if (home.failRemaining > 0) {
      home.failRemaining -= 1;
      await route.abort('connectionrefused');
      return;
    }
    await route.fulfill({
      status: 200,
      headers: { ...cors(route), 'content-type': 'application/json' },
      json: home.body,
    });
  });
  await page.route('**/api/images/**', async (route) => {
    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: cors(route) });
      return;
    }
    if (
      home.breakSelectedWork &&
      route.request().url().includes('000000000011')
    ) {
      await route.fulfill({
        status: 404,
        headers: cors(route),
        body: 'missing',
      });
      return;
    }
    await route.fulfill({
      status: 200,
      headers: { ...cors(route), 'content-type': 'image/svg+xml' },
      body: homeArtworkSvg,
    });
  });
  await page.route('**/api/sellers/**/photo', async (route) => {
    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: cors(route) });
      return;
    }
    await route.fulfill({
      status: 200,
      headers: { ...cors(route), 'content-type': 'image/svg+xml' },
      body: homePortraitSvg,
    });
  });

  return home;
}

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => {
    const root = document.scrollingElement;
    return root ? root.scrollWidth - root.clientWidth : 0;
  });
  expect(overflow).toBeLessThanOrEqual(1);
}

async function assertDockDoesNotCoverContent(page: Page) {
  const last = page.getByRole('button', { name: 'Смотреть всех' });
  await last.scrollIntoViewIfNeeded();
  const lastBox = await last.boundingBox();
  const dock = page.getByTestId('figma-floating-dock');
  const dockBox = await dock.boundingBox();
  expect(lastBox).not.toBeNull();
  expect(dockBox).not.toBeNull();
  expect((lastBox?.y ?? 0) + (lastBox?.height ?? 0)).toBeLessThanOrEqual(
    (dockBox?.y ?? 0) + 1,
  );
}

async function resetHomeScroll(page: Page) {
  await page.evaluate(() => {
    const named = document.querySelector('[data-testid="home-scroll"]');
    const root =
      named ?? document.querySelector('[data-testid="app-shell-content"]');
    const nodes = [
      root,
      ...Array.from(root?.querySelectorAll('*') ?? []),
    ].filter((node): node is Element => node instanceof Element);
    const scroller =
      nodes.find((node) => {
        const style = getComputedStyle(node);
        return (
          (style.overflowY === 'auto' || style.overflowY === 'scroll') &&
          node.scrollHeight > node.clientHeight + 1
        );
      }) ?? null;
    if (scroller) scroller.scrollTop = 0;
    window.scrollTo(0, 0);
  });
}

async function screenshotHomeFold(page: Page, path: string) {
  await resetHomeScroll(page);
  await page.screenshot({ path });
  const size = pngSize(await readFile(path));
  expect(size.height).toBe(page.viewportSize()?.height ?? 844);
}

async function screenshotHomeFull(
  page: Page,
  path: string,
  options: { minHeight: number },
) {
  const viewport = page.viewportSize();
  expect(viewport).not.toBeNull();
  await resetHomeScroll(page);
  const contentHeight = await page.evaluate(() => {
    const named = document.querySelector('[data-testid="home-scroll"]');
    const root =
      named ?? document.querySelector('[data-testid="app-shell-content"]');
    const nodes = [
      root,
      ...Array.from(root?.querySelectorAll('*') ?? []),
    ].filter((node): node is Element => node instanceof Element);
    const scroller =
      nodes.find((node) => {
        const style = getComputedStyle(node);
        return (
          (style.overflowY === 'auto' || style.overflowY === 'scroll') &&
          node.scrollHeight > node.clientHeight + 1
        );
      }) ?? null;
    return scroller?.scrollHeight ?? document.documentElement.scrollHeight;
  });
  expect(contentHeight).toBeGreaterThanOrEqual(options.minHeight);
  await page.setViewportSize({
    width: viewport!.width,
    height: Math.ceil(contentHeight),
  });
  await page.screenshot({ path });
  await page.setViewportSize(viewport!);
  const size = pngSize(await readFile(path));
  expect(size.height).toBeGreaterThanOrEqual(options.minHeight);
}

function pngSize(buffer: Buffer) {
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

async function measureHome(page: Page) {
  return page.evaluate(() => {
    const viewportBox = (node: Element | null) => {
      if (!node) return null;
      const rect = node.getBoundingClientRect();
      return {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
      };
    };
    const shell = document.querySelector('[data-testid="app-shell-content"]');
    const origin = shell?.getBoundingClientRect();
    const columnBox = (node: Element | null) => {
      if (!node || !origin) return viewportBox(node);
      const rect = node.getBoundingClientRect();
      return {
        x: rect.x - origin.x,
        y: rect.y - origin.y,
        width: rect.width,
        height: rect.height,
      };
    };
    const heading = Array.from(
      document.querySelectorAll('h1,h2,h3,[role="heading"],[role="header"]'),
    ).find((node) => node.textContent?.trim() === 'Открытие недели');
    const works = document.getElementById('home-new-works');

    return {
      shell: viewportBox(shell),
      dock: viewportBox(
        document.querySelector('[data-testid="figma-floating-dock"]'),
      ),
      opening: columnBox(document.getElementById('home-opening')),
      openingHeading: columnBox(heading ?? null),
      openingAuthor: columnBox(document.getElementById('home-opening-author')),
      openingWork: columnBox(document.getElementById('home-opening-work')),
      newWorks: columnBox(works),
      newWorksCard: columnBox(
        works?.querySelector('a[href^="/product/"]') ?? null,
      ),
    };
  });
}
