import { expect, test, type Page } from '@playwright/test';

import { authenticatedPage } from './support/auth-session';
import { moderateSeller } from './support/admin-moderation';
import { e2eApiBaseURL } from './support/e2e-env';
import { selectCalendarMonth } from './support/fill-control';
import {
  createAdminModerationFixture,
  createBuyerFixture,
} from './support/e2e-fixtures';

async function selectCountry(page: Page, countryName: string) {
  await page.getByRole('button', { name: 'Страна' }).click();
  await page.getByRole('radio', { name: countryName }).click();
}

/** The nickname is the account slug assigned at registration: the author application shows it read-only. */
async function readAccountNickname(page: Page): Promise<string> {
  const nickname = page.getByRole('textbox', { name: 'Никнейм', exact: true });
  await expect(nickname).not.toHaveValue('');
  return nickname.inputValue();
}

async function completeBasics(page: Page, city: string): Promise<string> {
  const chooserPromise = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Загрузить фото' }).click();
  await (await chooserPromise).setFiles('e2e/fixtures/profile-photo.png');
  await page
    .getByRole('textbox', { name: 'Имя или название', exact: true })
    .fill('Автор с городом');
  const slug = await readAccountNickname(page);
  await selectCountry(page, 'Беларусь');
  await page.getByRole('textbox', { name: 'Город', exact: true }).fill(city);
  await page.getByRole('button', { name: 'Продолжить' }).click();
  await expect(page).toHaveURL(/\/profile\?step=2/);
  await expect(
    page.getByRole('progressbar', { name: 'Шаг 2 из 4' }),
  ).toBeVisible();
  return slug;
}

test('author application without city continues and stores the city as null', async ({
  browser,
}) => {
  const { buyer } = await createBuyerFixture();
  const { context, page } = await authenticatedPage(browser, buyer);

  try {
    await page.goto('/profile');
    const chooserPromise = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Загрузить фото' }).click();
    await (await chooserPromise).setFiles('e2e/fixtures/profile-photo.png');
    await page
      .getByRole('textbox', { name: 'Имя или название', exact: true })
      .fill('Без города');
    await readAccountNickname(page);
    await selectCountry(page, 'Беларусь');
    await page.getByRole('button', { name: 'Продолжить' }).click();
    await expect(page).toHaveURL(/\/profile\?step=2/);

    const mine = await context.request.get(
      `${e2eApiBaseURL}/api/seller/profile`,
    );
    expect(mine.ok()).toBeTruthy();
    const body = (await mine.json()) as {
      sellerProfile: { city: string | null };
    };
    expect(body.sellerProfile.city).toBeNull();
  } finally {
    await context.close();
  }
});

for (const city of ['Минск', '']) {
  test(`application ${city ? 'with' : 'without'} city is approved and appears in the public authors catalog`, async ({
    browser,
  }) => {
    const { buyer } = await createBuyerFixture();
    const { admin } = await createAdminModerationFixture();
    const { context, page } = await authenticatedPage(browser, buyer);

    try {
      await page.goto('/profile');
      const slug = await completeBasics(page, city);
      await page.getByRole('button', { name: 'Закрыть' }).click();
      await page.goto('/profile');
      await expect(
        page.getByRole('progressbar', { name: 'Шаг 2 из 4' }),
      ).toBeVisible();
      await page
        .getByRole('textbox', { name: 'Telegram', exact: true })
        .fill('@city_author');
      await page.getByRole('button', { name: 'Закрыть' }).click();
      await page.getByRole('button', { name: 'Прервать' }).click();
      await expect(page).toHaveURL(/\/$/);
      await page.goto('/profile');
      await expect(
        page.getByRole('progressbar', { name: 'Шаг 2 из 4' }),
      ).toBeVisible();
      await expect(
        page.getByRole('textbox', { name: 'Telegram', exact: true }),
      ).toHaveValue('https://t.me/city_author');
      await page.getByRole('button', { name: 'Продолжить' }).click();
      await expect(page).toHaveURL(/\/profile\?step=3/);
      await page
        .getByRole('textbox', { name: 'Коротко о себе', exact: true })
        .last()
        .fill('Авторская практика.');
      await page
        .getByRole('textbox', { name: 'Практика', exact: true })
        .last()
        .fill('Авторская керамика');
      await page
        .getByRole('button', { name: 'Выберите основные направления' })
        .click();
      await page.getByRole('checkbox', { name: 'Керамика' }).click();
      await page.getByRole('button', { name: 'Применить' }).click();
      await page.getByRole('button', { name: 'Закрыть' }).click();
      await page.getByRole('button', { name: 'Прервать' }).click();
      await expect(page).toHaveURL(/\/$/);
      await page.goto('/profile');
      await expect(
        page.getByRole('progressbar', { name: 'Шаг 3 из 4' }),
      ).toBeVisible();
      await expect(page.getByText('Керамика')).toBeVisible();
      await page.getByRole('button', { name: 'Продолжить' }).click();
      await expect(page).toHaveURL(/\/profile\?step=4/);
      await expect(
        page.getByRole('button', { name: 'Сохранить и завершить' }),
      ).toBeVisible();
      await page.reload();
      await expect(page).toHaveURL(/\/profile\?step=4/);
      await page.getByRole('button', { name: 'Сохранить и завершить' }).click();
      await expect(page.getByText('На модерации')).toBeVisible();

      const mine = await context.request.get(
        `${e2eApiBaseURL}/api/seller/profile`,
      );
      expect(mine.ok()).toBeTruthy();
      const body = (await mine.json()) as { sellerProfile: { id: string } };

      const { context: adminContext } = await authenticatedPage(browser, admin);
      const approved = await moderateSeller(
        adminContext.request,
        body.sellerProfile.id,
      );
      expect(approved.ok()).toBeTruthy();
      await adminContext.close();

      await page.goto('/authors');
      const publishedAuthor = page.getByRole('link', {
        name: `Открыть профиль автора Автор с городом, @${slug}`,
        exact: true,
      });
      await expect(publishedAuthor).toBeVisible();
      await publishedAuthor.click();
      await expect(page).toHaveURL(
        new RegExp(`/authors/${slug}|/seller/${slug}`),
      );
      await expect(
        page.getByTestId('creator-meta').getByText('Автор с городом'),
      ).toBeVisible();
    } finally {
      await context.close();
    }
  });
}

test('author onboarding matches source geometry and preserves entered data through keyboard and failed saves', async ({
  browser,
}, testInfo) => {
  const { buyer } = await createBuyerFixture();
  const { context, page } = await authenticatedPage(browser, buyer);
  const evidence = process.env.E2E_EVIDENCE_DIR;
  async function captureIdle(label: string) {
    if (!evidence) return;
    await page.evaluate(() => {
      const active = document.activeElement;
      if (active instanceof HTMLElement) active.blur();
    });
    await page.screenshot({
      path: `${evidence}/${testInfo.project.name}-${label}.png`,
    });
  }
  async function fieldHeight(label: string, role: 'textbox' | 'button' = 'textbox') {
    const box = await page
      .getByRole(role, { name: label, exact: true })
      .evaluate((control, type) => (type === 'button' ? control : control.parentElement)?.getBoundingClientRect().height, role);
    expect(box).toBeCloseTo(51, 1);
  }
  async function expectAuthorFieldIconPhysicalStroke(label: string, role: 'textbox' | 'button' = 'textbox') {
    const physical = await page
      .getByRole(role, { name: label, exact: true })
      .evaluate((control, type) => {
        const shell = type === 'button' ? control : control.parentElement;
        const svg = shell?.querySelector('svg');
        if (!(svg instanceof SVGSVGElement)) return null;
        const path = svg.querySelector('path, line, circle, rect, polyline');
        if (!(path instanceof SVGGeometryElement)) return null;
        const strokeWidth = path.getAttribute('stroke-width');
        const strokeUser = strokeWidth
          ? parseFloat(strokeWidth)
          : parseFloat(getComputedStyle(path).strokeWidth);
        const viewWidth = svg.viewBox.baseVal.width || 24;
        const renderedWidth = svg.getBoundingClientRect().width;
        return strokeUser * (renderedWidth / viewWidth);
      }, role);
    expect(physical).toBeCloseTo(1.3, 1);
  }
  async function responsive(label: string) {
    for (const width of [390, 1024, 1440]) {
      await page.setViewportSize({ width, height: 874 });
      const close = await page
        .getByRole('button', { name: 'Закрыть', exact: true })
        .boundingBox();
      expect(close?.width).toBeCloseTo(28, 1);
      expect(close?.x).toBeCloseTo((width - 390) / 2 + 350, 1);
      await captureIdle(`${label}-${width}`);
    }
    await page.setViewportSize({ width: 390, height: 874 });
  }
  try {
    await page.setViewportSize({ width: 390, height: 874 });
    await page.goto('/profile?intro=1');
    const intro = page.getByRole('dialog');
    await expect(
      intro.getByRole('button', { name: 'Начать', exact: true }),
    ).toBeVisible();
    await expect(
      intro.getByRole('button', { name: 'Позже', exact: true }),
    ).toHaveCount(0);
    const start = intro.getByRole('button', { name: 'Начать', exact: true });
    await expect(start).toBeInViewport();
    await page.waitForFunction((name) => {
      const dialog = document.querySelector('[role="dialog"]');
      if (!dialog) return false;
      const buttons = Array.from(
        dialog.querySelectorAll<HTMLElement>('button, [role="button"]'),
      );
      const startButton = buttons.find(
        (node) => node.textContent?.trim() === name,
      );
      if (!startButton) return false;
      const rect = startButton.getBoundingClientRect();
      const viewport = window.innerHeight;
      return (
        rect.height > 0 &&
        rect.top >= 0 &&
        rect.bottom <= viewport &&
        rect.bottom > rect.top
      );
    }, 'Начать');
    await captureIdle('intro-390');
    await intro.getByRole('button', { name: 'Начать', exact: true }).click();
    await expect(intro).toHaveCount(0);
    await expect(
      page.getByRole('progressbar', { name: 'Шаг 1 из 4' }),
    ).toBeVisible();
    const country = page.getByRole('button', { name: 'Страна', exact: true });
    await expect(country.locator('input')).toHaveCount(0);
    await country.focus();
    await page.keyboard.press('Enter');
    await expect(
      page.getByRole('dialog', { name: 'Страна', exact: true }),
    ).toBeVisible();
    await page.getByRole('radio', { name: 'Беларусь', exact: true }).click();
    await expect(country).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(
      page.getByRole('textbox', { name: 'Город', exact: true }),
    ).toBeFocused();
    await fieldHeight('Имя или название');
    const icon = page.locator('svg[width="65.23"]');
    await expect(icon).toHaveCount(1);
    expect(
      await icon
        .locator('path')
        .evaluateAll((paths) =>
          paths.every(
            (path) =>
              getComputedStyle(path).strokeLinecap === 'round' &&
              getComputedStyle(path).strokeLinejoin === 'round',
          ),
        ),
    ).toBe(true);
    await responsive('basics');
    await completeBasics(page, '');
    await expectAuthorFieldIconPhysicalStroke('Instagram');
    await fieldHeight('Instagram');
    await fieldHeight('Telegram');
    await expect(
      page.getByRole('textbox', { name: 'Почта', exact: true }),
    ).toHaveValue('');
    await responsive('contacts');
    await page
      .getByRole('textbox', { name: 'Telegram', exact: true })
      .fill('@visual_author');
    await page.getByRole('button', { name: 'Назад', exact: true }).click();
    await expect(page).toHaveURL(/step=1/);
    await page.getByRole('button', { name: 'Продолжить', exact: true }).click();
    await expect(page).toHaveURL(/step=2/);
    await expect(
      page.getByRole('progressbar', { name: 'Шаг 2 из 4' }),
    ).toBeVisible();
    await expect(
      page.getByRole('textbox', { name: 'Telegram', exact: true }),
    ).toHaveValue('https://t.me/visual_author');
    await expect(
      page.getByRole('button', { name: 'Продолжить', exact: true }),
    ).toBeEnabled();
    await page.getByRole('button', { name: 'Продолжить', exact: true }).click();
    await expect(page).toHaveURL(/step=3/);
    await fieldHeight('Коротко о себе');
    const select = page.getByRole('button', {
      name: 'Выберите основные направления',
      exact: true,
    });
    expect((await select.boundingBox())?.height).toBeCloseTo(47, 1);
    await responsive('about');
    await select.click();
    const directions = page.getByRole('dialog', {
      name: 'Направление работ',
      exact: true,
    });
    await expect(directions).toBeVisible();
    const backSvg = directions.locator('svg').first();
    await expect(backSvg).toHaveAttribute('width', '26');
    const search = page.getByRole('textbox', { name: 'Поиск', exact: true });
    await expectAuthorFieldIconPhysicalStroke('Поиск');
    await fieldHeight('Поиск');
    const firstRow = page.getByRole('checkbox').first();
    const firstRowBox = await firstRow.boundingBox();
    expect(firstRowBox?.height).toBeCloseTo(38, 1);
    expect(firstRowBox?.y).toBeCloseTo(140, 1);
    await search.fill('керам');
    await expect(
      page.getByRole('checkbox', { name: 'Керамика', exact: true }),
    ).toBeVisible();
    const ceramic = page.getByRole('checkbox', {
      name: 'Керамика',
      exact: true,
    });
    await ceramic.focus();
    await page.keyboard.press('Space');
    await expect(ceramic).toBeChecked();
    expect(
      await ceramic
        .locator('svg path')
        .evaluateAll((paths) =>
          paths.every(
            (path) =>
              getComputedStyle(path).strokeLinecap === 'round' &&
              getComputedStyle(path).strokeLinejoin === 'round',
          ),
        ),
    ).toBe(true);
    const apply = page.getByRole('button', { name: 'Применить', exact: true });
    expect((await apply.boundingBox())?.height).toBeCloseTo(51, 1);
    await captureIdle('directions-390');
    await apply.click();
    const selected = page.getByRole('button', {
      name: 'Удалить Керамика',
      exact: true,
    });
    expect((await selected.boundingBox())?.height).toBeCloseTo(39, 1);
    await selected.click();
    await expect(selected).toHaveCount(0);
    await select.click();
    await page.getByRole('checkbox', { name: 'Керамика', exact: true }).click();
    await page.getByRole('button', { name: 'Применить', exact: true }).click();
    await page
      .getByRole('textbox', { name: 'Коротко о себе', exact: true })
      .fill('Авторская керамика');
    await page.getByRole('button', { name: 'Продолжить', exact: true }).click();
    await expect(page).toHaveURL(/step=4/);
    await expectAuthorFieldIconPhysicalStroke('Дата достижения', 'button');
    await fieldHeight('Дата достижения', 'button');
    expect(
      (
        await page
          .getByRole('button', { name: 'Добавить событие', exact: true })
          .boundingBox()
      )?.height,
    ).toBeCloseTo(47, 1);
    await expect(
      page.getByRole('button', { name: /Добавить фото/ }),
    ).toHaveCount(0);
    await responsive('achievements');
    await selectCalendarMonth(page, 'Дата достижения', 2025, 3);
    await page
      .getByRole('textbox', { name: 'Описание достижения', exact: true })
      .fill('Выставка');
    await expect(
      page.getByRole('button', { name: 'Сохранить и завершить', exact: true }),
    ).toBeDisabled();
    await page.getByRole('button', { name: 'Закрыть', exact: true }).click();
    const confirm = page.getByRole('dialog');
    await expect(confirm).toContainText('Недобавленное событие будет потеряно');
    for (const width of [390, 1024, 1440]) {
      await page.setViewportSize({ width, height: 874 });
      const exitDialogBox = await confirm.boundingBox();
      expect(exitDialogBox?.width).toBeCloseTo(366, 1);
      expect(exitDialogBox?.x).toBeCloseTo((width - 366) / 2, 1);
      for (const actionLabel of ['Прервать', 'Продолжить'] as const) {
        expect(
          (
            await confirm
              .getByRole('button', { name: actionLabel, exact: true })
              .boundingBox()
          )?.height,
        ).toBeCloseTo(55, 1);
      }
      await captureIdle(`exit-${width}`);
    }
    await page.setViewportSize({ width: 390, height: 874 });
    await page.setViewportSize({ width: 390, height: 400 });
    await page.evaluate(() => {
      document.documentElement.style.zoom = '2';
    });
    const dialogBox = await confirm.boundingBox();
    expect(dialogBox?.x).toBeGreaterThanOrEqual(0);
    expect((dialogBox?.x ?? 0) + (dialogBox?.width ?? 0)).toBeLessThanOrEqual(
      390,
    );
    for (const actionLabel of ['Прервать', 'Продолжить'] as const) {
      const action = confirm.getByRole('button', {
        name: actionLabel,
        exact: true,
      });
      await action.scrollIntoViewIfNeeded();
      const actionBox = await action.boundingBox();
      expect(actionBox?.x).toBeGreaterThanOrEqual(0);
      expect((actionBox?.x ?? 0) + (actionBox?.width ?? 0)).toBeLessThanOrEqual(
        390,
      );
      await expect(action).toHaveAccessibleName(actionLabel);
    }
    const continueBox = await confirm
      .getByRole('button', { name: 'Продолжить', exact: true })
      .boundingBox();
    expect(continueBox?.y).toBeGreaterThanOrEqual(0);
    expect(
      (continueBox?.y ?? 0) + (continueBox?.height ?? 0),
    ).toBeLessThanOrEqual(400);
    await captureIdle('exit-short-zoom');
    await page.keyboard.press('Escape');
    await expect(confirm).toHaveCount(0);
    await expect(
      page.getByRole('textbox', { name: 'Описание достижения', exact: true }),
    ).toHaveValue('Выставка');
    await page.evaluate(() => {
      document.documentElement.style.zoom = '';
    });
    await page.setViewportSize({ width: 390, height: 874 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.route(
      '**/api/author/application/achievements',
      async (route) => {
        if (route.request().method() === 'POST')
          await route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({
              status: 500,
              code: 'internal_error',
              message: 'Internal server error',
            }),
          });
        else await route.continue();
      },
    );
    await page
      .getByRole('button', { name: 'Добавить событие', exact: true })
      .click();
    await expect(
      page.getByRole('textbox', { name: 'Описание достижения', exact: true }),
    ).toHaveValue('Выставка');
    await expect(
      page.getByText('Проверьте соединение и попробуйте ещё раз.', {
        exact: true,
      }),
    ).toBeVisible();
    await page.unroute('**/api/author/application/achievements');
    const saved = page.waitForResponse(
      (response) =>
        response.url().endsWith('/api/author/application/achievements') &&
        response.request().method() === 'POST',
    );
    await page
      .getByRole('button', { name: 'Добавить событие', exact: true })
      .click();
    expect((await saved).ok()).toBeTruthy();
    expect((await saved).request().postDataJSON()).toMatchObject({
      occurredDate: { year: 2025, month: 3, day: null },
      body: 'Выставка',
    });
    await expect(
      page.getByRole('textbox', { name: 'Описание достижения', exact: true }),
    ).toHaveValue('');
    await expect(
      page.getByRole('button', { name: 'Сохранить и завершить', exact: true }),
    ).toBeEnabled();
    await page.getByRole('button', { name: 'Удалить', exact: true }).click();
    await expect(page.getByText('Выставка', { exact: true })).toHaveCount(0);
  } finally {
    if (!page.isClosed()) await context.close();
  }
});
