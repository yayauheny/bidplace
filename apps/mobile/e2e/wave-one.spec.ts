import { expect, test } from '@playwright/test';

import { authenticatedPage } from './support/auth-session';
import {
  createAdminModerationFixture,
  createBuyerFixture,
} from './support/e2e-fixtures';
import { e2eApiBaseURL } from './support/e2e-env';

const apiBaseURL = e2eApiBaseURL;

test('authenticated user can open account menu and log out', async ({
  browser,
}) => {
  const { buyer } = await createBuyerFixture();
  const { context, page } = await authenticatedPage(browser, buyer);

  try {
    await page.goto('/');
    await page.getByRole('button', { name: /Открыть меню аккаунта/ }).click();
    await expect(page.getByRole('button', { name: 'Выйти' })).toBeVisible();
    await page.getByRole('button', { name: 'Выйти' }).click();
    await expect(page.getByRole('link', { name: 'Войти' })).toBeVisible();
  } finally {
    await context.close();
  }
});

test('new authenticated user sees seller application form and cannot access admin API', async ({
  browser,
}) => {
  const { buyer } = await createBuyerFixture();
  const { context, page } = await authenticatedPage(browser, buyer);

  try {
    const adminResponse = await context.request.get(
      `${apiBaseURL}/api/admin/products`,
    );
    expect(adminResponse.status()).toBe(403);

    await page.goto('/profile');
    await expect(
      page.getByText('Заполните профиль, чтобы подать заявку на модерацию.'),
    ).toBeVisible();
  } finally {
    await context.close();
  }
});

test('core public routes do not emit legacy React Native Web warnings', async ({
  page,
}) => {
  const warnings: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'warning' || message.type() === 'error') {
      warnings.push(message.text());
    }
  });

  for (const route of [
    '/',
    '/works',
    '/authors',
    '/seller/anna-morozova',
    '/product/seedLive002',
  ]) {
    await page.goto(route);
    await expect(page.getByTestId('app-shell-content')).toBeVisible();
  }
  expect(
    warnings.filter(
      (message) =>
        message.includes('No route named "(public)"') ||
        message.includes('No route named "(auth)"') ||
        message.includes('"shadow*" style props are deprecated') ||
        message.includes('props.pointerEvents is deprecated') ||
        /useNativeDriver.*not supported/i.test(message),
    ),
  ).toEqual([]);
});

test('admin reviews and approves pending seller and product', async ({
  browser,
}) => {
  test.setTimeout(120_000);
  const fixture = await createAdminModerationFixture();
  const { context, page } = await authenticatedPage(browser, fixture.admin);

  try {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/admin');
    const accountTrigger = page.getByRole('button', {
      name: /Открыть меню аккаунта/,
    });
    await accountTrigger.hover();
    await expect(page.locator('#account-menu-dropdown')).toBeVisible();
    const moderationLink = page.getByRole('link', { name: 'Модерация' });
    await moderationLink.focus();
    await expect(moderationLink).toBeFocused();
    await expect(
      page.getByText(fixture.sellerName, { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText(fixture.productTitle, { exact: true }),
    ).toHaveCount(0);

    let sellerCard = page
      .getByText(fixture.sellerName, { exact: true })
      .first()
      .locator('..');

    await sellerCard.getByRole('button', { name: 'Одобрить' }).click();
    await expect
      .poll(async () => {
        const response = await context.request.get(
          `${apiBaseURL}/api/admin/seller-profiles`,
        );
        const payload = await response.json();
        return payload.sellerProfiles.find(
          (seller: { id: string }) => seller.id === fixture.sellerProfileId,
        )?.status;
      })
      .toBe('APPROVED');
    await page.getByRole('button', { name: 'Все статусы' }).click();
    await page.getByRole('button', { name: 'Работы' }).click();

    let productCard = page
      .getByText(fixture.productTitle, { exact: true })
      .first()
      .locator('..');

    await expect(
      productCard.getByRole('button', { name: 'Одобрить' }),
    ).toBeEnabled();

    await page.route(
      `**/api/admin/products/${fixture.productId}/status`,
      async (route) =>
        route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({
            statusCode: 409,
            message: 'Product moderation failed',
          }),
        }),
    );
    await productCard.getByRole('button', { name: 'Одобрить' }).click();
    await expect(
      page.getByText(
        'Не удалось одобрить предмет. Проверьте, одобрен ли автор и заполнены ли обязательные поля.',
      ),
    ).toBeVisible();
    await page.unroute(`**/api/admin/products/${fixture.productId}/status`);

    await productCard.getByRole('button', { name: 'Одобрить' }).click();
    await expect
      .poll(async () => {
        const response = await context.request.get(
          `${apiBaseURL}/api/admin/products`,
        );
        const payload = await response.json();
        return payload.products.find(
          (product: { id: string }) => product.id === fixture.productId,
        )?.status;
      })
      .toBe('APPROVED');

    await page.getByRole('button', { name: 'Авторы' }).click();
    sellerCard = page
      .getByText(fixture.sellerName, { exact: true })
      .first()
      .locator('..');
    await sellerCard.getByRole('button', { name: 'Приостановить' }).click();
    await page
      .getByRole('textbox', { name: 'Причина' })
      .fill('Проверка профиля');
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Приостановить' })
      .click();
    await expect
      .poll(async () => {
        const response = await context.request.get(
          `${apiBaseURL}/api/admin/seller-profiles`,
        );
        const payload = await response.json();
        return payload.sellerProfiles.find(
          (seller: { id: string }) => seller.id === fixture.sellerProfileId,
        )?.status;
      })
      .toBe('SUSPENDED');

    await page.getByRole('button', { name: 'Работы' }).click();
    productCard = page
      .getByText(fixture.productTitle, { exact: true })
      .first()
      .locator('..');
    await productCard
      .getByRole('button', { name: 'Запросить изменения' })
      .click();
    await page
      .getByRole('textbox', { name: 'Причина' })
      .fill('Добавьте историю предмета');
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Запросить изменения' })
      .click();
    await expect
      .poll(async () => {
        const response = await context.request.get(
          `${apiBaseURL}/api/admin/products`,
        );
        const payload = await response.json();
        return payload.products.find(
          (product: { id: string }) => product.id === fixture.productId,
        )?.status;
      })
      .toBe('CHANGES_REQUESTED');
  } finally {
    await context.close();
  }
});
