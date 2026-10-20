import { expect, test } from '@playwright/test';

import { authenticatedPage } from './support/auth-session';
import {
  createAuctionFixture,
  createApprovedAuthorFixture,
  createBuyerFixture,
  createSellerFixture,
} from './support/e2e-fixtures';
import { e2eWebBaseURL } from './support/e2e-env';

// Ограниченный gate волн 3A–3C: маршруты аккаунта, published identity,
// настройки (прямой URL/refresh/закрытие), neutral not-found публичной
// ссылки до публикации, отсутствие горизонтального переполнения на 320,
// прокрутка контента аккаунта на коротком viewport.

test('approved author: dock opens /account with published identity, settings roundtrip works', async ({
  browser,
}) => {
  const { author, slug, fullName } = await createApprovedAuthorFixture();
  const { context, page } = await authenticatedPage(browser, author);

  try {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    // Дождаться гидратации сессии: гостевой dock-профиль клик не навигирует.
    const profile = page
      .getByTestId('figma-floating-dock')
      .getByLabel('Профиль');
    await expect(profile).toHaveAttribute('href', '/account');
    await profile.click();
    await expect(page).toHaveURL(/\/account$/);

    // Свежее открытие маршрута: без нижележащего Home в стеке identity
    // однозначна. Identity — опубликованная (public author), не editing overlay.
    await page.goto('/account');
    const accountPage = page.getByTestId('form-page');
    await expect(accountPage.getByText(fullName)).toBeVisible();
    await expect(accountPage.getByText(`@${slug}`)).toBeVisible();
    await expect(
      accountPage.getByRole('button', { name: 'Поделиться профилем' }),
    ).toBeVisible();
    await expect(
      accountPage.getByRole('button', { name: 'Настройки' }),
    ).toBeVisible();

    await page.getByRole('button', { name: 'Настройки' }).click();
    await expect(page).toHaveURL(/\/account\/settings$/);
    await expect(page.getByText('Публичный профиль')).toBeVisible();

    // Natural back-stack: Back возвращает в аккаунт.
    await page.getByRole('button', { name: 'Назад' }).click();
    await expect(page).toHaveURL(/\/account$/);

    // Direct/fresh вход: Back без app history уходит в fallback /account.
    await page.goto('/account/settings');
    await page.getByRole('button', { name: 'Назад' }).click();
    await expect(page).toHaveURL(/\/account$/);

    // Reload: крест имеет явное назначение /account (reload-close не теряется).
    await page.goto('/account/settings');
    await page.reload();
    await expect(page).toHaveURL(/\/account\/settings$/);
    await expect(page.getByText('Публичный профиль')).toBeVisible();
    await page.getByRole('button', { name: 'Закрыть настройки' }).click();
    await expect(page).toHaveURL(/\/account$/);

    // Прямой /account без app history: Back уходит в fallback '/'.
    await page.getByRole('button', { name: 'Назад' }).click();
    await expect(page).toHaveURL(/\/$/);
  } finally {
    await context.close();
  }
});

test('guest sees a neutral not-found for an author link before approval', async ({
  browser,
}) => {
  const { slug } = await createSellerFixture({ status: 'PENDING_REVIEW' });
  const context = await browser.newContext({ baseURL: e2eWebBaseURL });
  const page = await context.newPage();

  try {
    await page.goto(`/authors/${slug}`);
    await expect(page.getByText('Автор не найден')).toBeVisible();
  } finally {
    await context.close();
  }
});

test('plain account at 320 has no horizontal overflow and no works section', async ({
  browser,
}) => {
  const { buyer } = await createBuyerFixture();
  const { context, page } = await authenticatedPage(browser, buyer);

  try {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto('/account');
    await expect(
      page.getByRole('link', { name: 'Стать автором' }),
    ).toBeVisible();
    await expect(
      page.getByTestId('form-page').getByText('Работы'),
    ).toHaveCount(0);

    const accountOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(Math.max(0, accountOverflow)).toBeLessThanOrEqual(1);

    await page.goto('/account/settings');
    const settingsOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(Math.max(0, settingsOverflow)).toBeLessThanOrEqual(1);
  } finally {
    await context.close();
  }
});

test('settings stay usable on a short viewport', async ({ browser }) => {
  const { author } = await createApprovedAuthorFixture();
  const { context, page } = await authenticatedPage(browser, author);

  try {
    await page.setViewportSize({ width: 390, height: 320 });
    await page.goto('/account/settings');
    await expect(page.getByText('Публичный профиль')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Выйти' })).toBeVisible();
  } finally {
    await context.close();
  }
});

test('account content scrolls inside the shell on a small viewport', async ({
  browser,
}) => {
  const fixture = await createAuctionFixture({ live: false });
  const { context, page } = await authenticatedPage(browser, fixture.seller);

  try {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto('/account');
    await expect(
      page.getByTestId('form-page').getByText(fixture.product.title),
    ).toBeVisible();

    const scroller = await page.evaluate(() => {
      const root = document.querySelector('[data-testid="form-page"]');
      const mark = root
        ? [...root.querySelectorAll('div')].find(
            (el) => el.textContent === 'Работы',
          )
        : undefined;
      let el: HTMLElement | null = mark ?? null;
      while (
        el &&
        !(
          el.scrollHeight > el.clientHeight + 1 &&
          /(auto|scroll)/.test(getComputedStyle(el).overflowY)
        )
      ) {
        el = el.parentElement;
      }
      if (!el) return null;
      el.scrollTop = el.scrollHeight;
      return {
        scrollTop: el.scrollTop,
        scrollHeight: el.scrollHeight,
        clientHeight: el.clientHeight,
      };
    });
    expect(scroller, 'scrollable shell around the works section').toBeTruthy();
    expect(scroller!.scrollTop).toBeGreaterThan(0);
  } finally {
    await context.close();
  }
});
