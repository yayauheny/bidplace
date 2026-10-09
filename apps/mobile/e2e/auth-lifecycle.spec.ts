import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { expect, test, type Page } from '@playwright/test';

test.use({ trace: 'off', screenshot: 'off' });

import { e2eApiBaseURL } from './support/e2e-env';
import { createBuyerFixture } from './support/e2e-fixtures';
import { expectPasswordVisibility } from './support/fill-control';

async function localTestMailValue(email: string, field: 'code' | 'token') {
  let value: string | undefined;
  await expect
    .poll(
      async () => {
        let contents: string;
        try {
          contents = await readFile(resolve(__dirname, '.email.jsonl'), 'utf8');
        } catch (error) {
          if (
            error instanceof Error &&
            'code' in error &&
            error.code === 'ENOENT'
          ) {
            return false;
          }
          throw error;
        }
        for (const line of contents.trim().split('\n').filter(Boolean)) {
          const message: unknown = JSON.parse(line);
          if (
            typeof message === 'object' &&
            message !== null &&
            'email' in message &&
            message.email === email
          ) {
            const candidate =
              field === 'code'
                ? 'code' in message
                  ? message.code
                  : undefined
                : 'token' in message
                  ? message.token
                  : undefined;
            if (typeof candidate === 'string') value = candidate;
          }
        }
        return Boolean(value);
      },
      { message: 'Local test transport delivered the expected email' },
    )
    .toBe(true);
  if (!value) throw new Error('Expected local test email value is missing');
  return value;
}

async function loginForm(
  page: Page,
  email: string,
  password: string,
  status: number,
) {
  await page.getByRole('textbox', { name: 'Электронная почта', exact: true }).fill(email);
  await page.getByLabel('Пароль', { exact: true }).fill(password);
  const response = page.waitForResponse(
    (item) =>
      item.url() === `${e2eApiBaseURL}/api/auth/login` &&
      item.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Войти', exact: true }).click();
  expect((await response).status()).toBe(status);
  if (status === 401) {
    await expect(page.getByText('Неверная почта или пароль', { exact: true })).toBeVisible();
  }
}

test('registration form creates a session and email verification unlocks the author profile', async ({
  page,
  context,
}) => {
  const id = randomUUID().slice(0, 8);
  const email = `registration-${id}@bidplace.test`;
  let registrations = 0;
  let accepts = 0;
  await page.route('**/api/auth/register', async (route) => {
    registrations += 1;
    await route.continue();
  });
  await page.route('**/api/auth/rules/accept', async (route) => {
    accepts += 1;
    if (accepts === 1) {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'failed' }),
      });
      return;
    }
    await route.continue();
  });
  await page.goto('/register?redirectTo=/profile');
  const emailField = page.getByRole('textbox', { name: 'Электронная почта', exact: true });
  await emailField.fill(email);
  await emailField.focus();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  const consent = page.getByRole('checkbox', { name: /соглашаюсь/ });
  await expect(consent).toBeFocused();
  const rules = page.waitForResponse(
    (item) =>
      item.url() === `${e2eApiBaseURL}/api/auth/rules` &&
      item.request().method() === 'GET',
  );
  await page.keyboard.press('Space');
  expect((await rules).status()).toBe(200);
  await expect(consent).toBeChecked();
  const focusedOutline = await consent.evaluate((node) => {
    const style = window.getComputedStyle(node);
    return style.outlineStyle !== 'none' && style.outlineWidth !== '0px';
  });
  expect(focusedOutline).toBe(true);
  await page.getByRole('button', { name: 'Дальше', exact: true }).click();
  const nickname = page.getByLabel('Никнейм', { exact: true });
  for (const slug of ['ab', 'a'.repeat(21)]) {
    await nickname.fill(slug);
    await page.getByRole('button', { name: 'Дальше', exact: true }).click();
    await expect(page.getByText('Никнейм должен содержать от 3 до 20 символов', { exact: true })).toBeVisible();
    await expect(nickname).toBeVisible();
    expect(registrations).toBe(0);
  }
  await nickname.fill(`author-${id}`);
  await page.getByRole('button', { name: 'Дальше', exact: true }).click();
  await page
    .getByLabel('Введите пароль', { exact: true })
    .fill('registration-password-123');
  await page
    .getByLabel('Подтвердите пароль', { exact: true })
    .fill('registration-password-123');
  await expectPasswordVisibility(page.getByLabel('Введите пароль', { exact: true }));
  await expectPasswordVisibility(page.getByLabel('Подтвердите пароль', { exact: true }));
  await page.getByRole('button', { name: 'Дальше', exact: true }).click();
  await expect(page.getByText('Не удалось сохранить согласие. Повторите принятие правил.')).toBeVisible();
  await expect(page).toHaveURL(/\/register/);
  expect(registrations).toBe(1);
  expect(accepts).toBe(1);
  await page.getByRole('button', { name: 'Дальше', exact: true }).click();
  await expect(page).toHaveURL(/\/verify-email\?/);
  expect(registrations).toBe(1);
  expect(accepts).toBe(2);
  await expect(page.getByText(/Код отправлен на /)).toBeVisible();

  const unverified = await context.request.get(`${e2eApiBaseURL}/api/auth/me`);
  expect(unverified.status()).toBe(200);
  expect((await unverified.json()).user.emailVerifiedAt).toBeNull();
  await page.getByLabel('Код из письма').fill('123');
  await page.getByRole('button', { name: 'Завершить', exact: true }).click();
  await expect(page.getByText('Введите шестизначный код.')).toBeVisible();

  await page
    .getByLabel('Код из письма')
    .fill(await localTestMailValue(email, 'code'));
  await page.getByRole('button', { name: 'Завершить', exact: true }).click();
  await expect(page).toHaveURL(/\/profile(?:\?|$)/);
  const verified = await context.request.get(`${e2eApiBaseURL}/api/auth/me`);
  expect(verified.status()).toBe(200);
  expect((await verified.json()).user.emailVerifiedAt).not.toBeNull();
  await page.reload();
  await expect(
    page.getByRole('button', { name: 'Выйти', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Выйти', exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  expect(
    (await context.request.get(`${e2eApiBaseURL}/api/auth/me`)).status(),
  ).toBe(401);
});

test('registration without redirectTo still confirms email and returns home', async ({
  page,
  context,
}) => {
  const id = randomUUID().slice(0, 8);
  const email = `registration-home-${id}@bidplace.test`;
  await page.goto('/register');
  await page.getByRole('textbox', { name: 'Электронная почта', exact: true }).fill(email);
  await page.getByRole('checkbox', { name: /соглашаюсь/ }).click();
  await page.getByRole('button', { name: 'Дальше', exact: true }).click();
  await page.getByLabel('Никнейм', { exact: true }).fill(`home-${id}`);
  await page.getByRole('button', { name: 'Дальше', exact: true }).click();
  await page
    .getByLabel('Введите пароль', { exact: true })
    .fill('registration-password-123');
  await page
    .getByLabel('Подтвердите пароль', { exact: true })
    .fill('registration-password-123');
  const registration = page.waitForResponse(
    (item) =>
      item.url() === `${e2eApiBaseURL}/api/auth/register` &&
      item.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Дальше', exact: true }).click();
  expect((await registration).status()).toBe(201);
  await expect(page).toHaveURL(/\/verify-email\?redirectTo=%2F$/);
  await expect(page.getByText(/Код отправлен на /)).toBeVisible();
  await page
    .getByLabel('Код из письма')
    .fill(await localTestMailValue(email, 'code'));
  await page.getByRole('button', { name: 'Завершить', exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  const verified = await context.request.get(`${e2eApiBaseURL}/api/auth/me`);
  expect(verified.status()).toBe(200);
  expect((await verified.json()).user.emailVerifiedAt).not.toBeNull();
});

test('login survives reload and password recovery rejects the old password and a reused reset link', async ({
  page,
  context,
}) => {
  const { buyer } = await createBuyerFixture();
  await page.goto('/');
  await page.goto('/login?redirectTo=/profile');
  await loginForm(page, `missing-${randomUUID()}@bidplace.test`, 'wrong-password-123', 401);
  await loginForm(page, buyer.email, 'wrong-password-123', 401);
  await expect(page).toHaveURL(/\/login\?/);
  await loginForm(page, buyer.email, buyer.password, 201);
  await expect(page).toHaveURL(/\/profile(?:\?|$)/);
  await page.goBack();
  await expect(page.getByText('Вход на Bidplace', { exact: true })).toHaveCount(0);
  await expect(page).not.toHaveURL(/\/login/);
  await page.goForward();
  await expect(page).toHaveURL(/\/profile(?:\?|$)/);
  await page.reload();
  await expect(
    page.getByRole('button', { name: 'Выйти', exact: true }),
  ).toBeVisible();
  const session = await context.request.get(`${e2eApiBaseURL}/api/auth/me`);
  expect(session.status()).toBe(200);
  expect((await session.json()).user.id).toBe(buyer.id);
  await page.getByRole('button', { name: 'Выйти', exact: true }).click();
  await expect(page).toHaveURL(/\/$/);

  await page.goto('/login');
  await page.getByRole('link', { name: 'Забыли пароль?' }).click();
  await page
    .getByRole('textbox', { name: 'Электронная почта', exact: true })
    .fill(buyer.email);
  await page.getByRole('button', { name: 'Отправить ссылку' }).click();
  await expect(
    page.getByText('мы отправили ссылку для создания нового пароля'),
  ).toBeVisible();
  const token = await localTestMailValue(buyer.email, 'token');
  const resetPath = `/reset-password?token=${encodeURIComponent(token)}`;
  const password = 'recovered-password-123';
  await page.goto(resetPath);
  await page.getByRole('textbox', { name: 'Новый пароль', exact: true }).fill(password);
  await page.getByRole('textbox', { name: 'Подтверждение пароля', exact: true }).fill(password);
  await expectPasswordVisibility(page.getByRole('textbox', { name: 'Новый пароль', exact: true }));
  await expectPasswordVisibility(page.getByLabel('Подтверждение пароля', { exact: true }));
  await page.getByRole('button', { name: 'Сохранить пароль' }).click();
  await expect(
    page.getByText('Пароль обновлён', { exact: true }),
  ).toBeVisible();

  await page.goto(resetPath);
  await page.getByRole('textbox', { name: 'Новый пароль', exact: true }).fill(password);
  await page.getByRole('textbox', { name: 'Подтверждение пароля', exact: true }).fill(password);
  await page.getByRole('button', { name: 'Сохранить пароль' }).click();
  await expect(
    page.getByText('Ссылка недействительна или устарела. Запросите новую.'),
  ).toBeVisible();
  await page.goto('/login?redirectTo=/profile');
  await loginForm(page, buyer.email, buyer.password, 401);
  await loginForm(page, buyer.email, password, 201);
  await expect(page).toHaveURL(/\/profile(?:\?|$)/);
  expect(
    (await context.request.get(`${e2eApiBaseURL}/api/auth/me`)).status(),
  ).toBe(200);
});
