import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

import { expect, test } from '@playwright/test';

import { authenticatedPage } from './support/auth-session';
import { e2eEvidenceDir } from './support/evidence-dir';
import { createBuyerFixture } from './support/e2e-fixtures';

const infrastructureCopy = 'Проверьте соединение и попробуйте ещё раз.';
const brandEvidenceDir = resolve(e2eEvidenceDir, 'brand-pointer-selection');

test('public API failure renders one coherent retry state', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route('**/api/auth/me', async (route) => {
    await route.abort('connectionrefused');
  });
  await page.route('**/api/portfolio/home', async (route) => {
    await route.abort('connectionrefused');
  });

  await page.goto('/');

  await expect(page.getByText(infrastructureCopy)).toBeVisible();
  await expect(page.getByText('Не удалось загрузить главную')).toHaveCount(0);
  await expect(page.getByText('Не удалось проверить сессию')).toHaveCount(0);
  const retry = page.getByRole('button', { name: 'Повторить', exact: true });
  await expect(retry).toHaveCount(1);
  const retryBounds = await retry.boundingBox();
  expect(retryBounds).not.toBeNull();
  expect(retryBounds!.x + retryBounds!.width / 2).toBeCloseTo(195, 0);
  await expect(page.getByRole('alert')).toHaveCount(1);
});

test('protected session failure reuses the shared retry state', async ({
  page,
}) => {
  await page.route('**/api/auth/me', async (route) => {
    await route.abort('connectionrefused');
  });

  await page.goto('/profile');

  await expect(page.getByText(infrastructureCopy)).toBeVisible();
  await expect(page.getByText('Не удалось проверить доступ')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Повторить', exact: true })).toHaveCount(1);
  await expect(page.getByRole('alert')).toHaveCount(1);
});

test('session check failure on Home keeps public content without infrastructure UI', async ({
  browser,
}) => {
  const { buyer } = await createBuyerFixture();
  const { context, page } = await authenticatedPage(browser, buyer);

  try {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.route('**/api/auth/me', async (route) => {
      await route.abort('connectionrefused');
    });
    await page.goto('/');

    await expect(page.getByTestId('home-scroll')).toBeVisible();
    await expect(page.getByText(infrastructureCopy)).toHaveCount(0);
    await expect(
      page.getByRole('button', { name: 'Повторить', exact: true }),
    ).toHaveCount(0);
    await expect(page.getByText('Не удалось загрузить главную')).toHaveCount(0);
    await expect(page.getByText('Не удалось проверить сессию')).toHaveCount(0);

    await page.getByTestId('figma-floating-dock').getByLabel('Профиль').click();
    await expect(page).toHaveURL(/\/login/);
    await page.goto('/profile');
    await expect(page.getByText(infrastructureCopy)).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Повторить', exact: true }),
    ).toHaveCount(1);

    await page.unroute('**/api/auth/me');
    await page.getByRole('button', { name: 'Повторить', exact: true }).click();
    await expect(page.getByText(infrastructureCopy)).toHaveCount(0);
    await expect(page).toHaveURL(/\/profile/);
  } finally {
    await context.close();
  }
});

test('page infrastructure state replaces Home chrome', async ({ page }) => {
  const brandRuntimeProblems: string[] = [];
  page.on('pageerror', (error) => brandRuntimeProblems.push(error.message));
  page.on('console', (message) => {
    if (/does not recognize|Unknown event handler property/.test(message.text())) {
      brandRuntimeProblems.push(message.text());
    }
  });

  await page.setViewportSize({ width: 390, height: 874 });
  await page.route('**/api/portfolio/home', async (route) => {
    await route.abort('connectionrefused');
  });
  await page.route('**/api/auth/me', async (route) => {
    await route.fulfill({
      status: 401,
      json: { message: 'Unauthorized' },
    });
  });

  await page.goto('/');

  const pageState = page.getByTestId('infrastructure-error-state-page');
  const mark = pageState.getByTestId('bidplace-brand-mark');
  const copy = page.getByText(infrastructureCopy, { exact: true });
  const retry = page.getByRole('button', { name: 'Повторить', exact: true });

  await expect(pageState).toBeVisible();
  await expect(mark).toHaveCount(1);
  await expect(mark).toHaveAttribute('aria-hidden', 'true');
  await expect(
    page.getByRole('link', { name: 'bidplace — на главную' }),
  ).toHaveCount(0);
  await expect(page.getByTestId('home-scroll')).toHaveCount(0);
  await expect(page.getByText('Загружаем bidplace…')).toHaveCount(0);
  await expect(copy).toBeVisible();
  await expect(retry).toHaveCount(1);

  await mkdir(brandEvidenceDir, { recursive: true });
  for (const viewport of [
    { width: 390, height: 874 },
    { width: 1280, height: 720 },
    { width: 390, height: 400 },
  ]) {
    await page.setViewportSize(viewport);
    await expect(pageState).toBeVisible();

    const box = await mark.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeCloseTo(104, 0);
    expect(box!.height).toBeCloseTo(104, 0);
    expect(
      await mark.evaluate((svg) => {
        const style = getComputedStyle(svg);
        return {
          tagName: svg.tagName,
          tabIndex: svg.getAttribute('tabindex'),
          userSelect: style.userSelect || style.webkitUserSelect,
          webkitUserSelect: style.webkitUserSelect,
        };
      }),
    ).toEqual({
      tagName: 'svg',
      tabIndex: null,
      userSelect: 'none',
      webkitUserSelect: 'none',
    });

    await page.evaluate(() => window.getSelection()?.removeAllRanges());
    await mark.click();
    expect(
      await mark.evaluate((svg) => ({
        focused: document.activeElement === svg,
        selectionText: window.getSelection()?.toString() ?? '',
      })),
    ).toEqual({ focused: false, selectionText: '' });

    await mark.click({ clickCount: 2 });
    expect(
      await mark.evaluate((svg) => ({
        focused: document.activeElement === svg,
        selectionText: window.getSelection()?.toString() ?? '',
      })),
    ).toEqual({ focused: false, selectionText: '' });

    await page.mouse.move(box!.x + 2, box!.y + 2);
    await page.mouse.down();
    await page.mouse.move(box!.x + box!.width - 2, box!.y + box!.height - 2);
    await page.mouse.up();
    expect(
      await mark.evaluate((svg) => ({
        focused: document.activeElement === svg,
        selectionText: window.getSelection()?.toString() ?? '',
      })),
    ).toEqual({ focused: false, selectionText: '' });

    const copyBox = await copy.boundingBox();
    expect(copyBox).not.toBeNull();
    await page.mouse.click(
      copyBox!.x + copyBox!.width / 2,
      copyBox!.y + copyBox!.height / 2,
      { clickCount: 3 },
    );
    expect(
      await page.evaluate(() => window.getSelection()?.toString()),
    ).toContain(infrastructureCopy);

    await page.evaluate(() => {
      window.getSelection()?.removeAllRanges();
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    });
    await page.keyboard.press('Tab');
    await expect(retry).toBeFocused();
    await expect(mark).not.toBeFocused();

    if (viewport.width === 390 && viewport.height === 874) {
      await page.screenshot({
        path: resolve(
          brandEvidenceDir,
          `${test.info().project.name}-infrastructure-brand-390x874.png`,
        ),
      });
    }
  }

  expect(brandRuntimeProblems).toEqual([]);
});

test('home pending uses the branded mark without loading copy', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  let releaseHome: (() => void) | undefined;
  const holdHome = new Promise<void>((resolve) => {
    releaseHome = resolve;
  });
  await page.route('**/api/portfolio/home', async (route) => {
    await holdHome;
    await route.abort('connectionrefused');
  });
  await page.route('**/api/auth/me', async (route) => {
    await route.fulfill({
      status: 401,
      json: { message: 'Unauthorized' },
    });
  });

  await page.goto('/');

  await expect(page.getByTestId('infrastructure-page-status-loading')).toBeVisible();
  await expect(
    page.getByTestId('infrastructure-page-status-loading').getByTestId('bidplace-brand-mark'),
  ).toHaveCount(1);
  await expect(page.getByText('Загружаем bidplace…')).toHaveCount(0);
  await expect(page.getByText(infrastructureCopy)).toBeHidden();
  await expect(
    page.getByRole('button', { name: 'Повторить', exact: true }),
  ).toBeHidden();

  releaseHome?.();

  await expect(page.getByTestId('infrastructure-error-state-page')).toBeVisible();
  await expect(
    page.getByTestId('infrastructure-error-state-page').getByTestId('bidplace-brand-mark'),
  ).toHaveCount(1);
  await expect(page.getByText(infrastructureCopy)).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Повторить', exact: true }),
  ).toHaveCount(1);
});

test('search active-tab failure keeps chrome and one inline state', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route('**/api/authors?**', async (route) => {
    await route.abort('connectionrefused');
  });

  await page.goto('/');
  await page.getByTestId('figma-floating-dock').getByLabel('Поиск').click();
  const overlay = page.getByTestId('search-overlay');
  await expect(overlay).toBeVisible();
  await overlay.getByRole('tab', { name: 'Авторы' }).click();

  await expect(page.getByTestId('infrastructure-error-state-inline')).toBeVisible();
  await expect(page.getByTestId('infrastructure-error-state-page')).toHaveCount(0);
  await expect(overlay.getByTestId('bidplace-brand-mark')).toHaveCount(0);
  await expect(overlay.getByTestId('search-overlay-query')).toBeVisible();
  await expect(overlay.getByRole('tab', { name: 'Категории' })).toBeVisible();
  await expect(
    page.getByText('Ищите опубликованные работы и проверенных авторов.'),
  ).toHaveCount(0);
  await expect(page.getByText(infrastructureCopy)).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Повторить', exact: true })).toHaveCount(1);
  await expect(page.getByRole('alert')).toHaveCount(1);
  await expect(page.getByText('Не удалось загрузить работы')).toHaveCount(0);
  await expect(page.getByText('Не удалось загрузить авторов')).toHaveCount(0);
});
