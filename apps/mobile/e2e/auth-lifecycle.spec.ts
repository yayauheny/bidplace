import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { expect, test, type Page } from '@playwright/test';

import { e2eApiBaseURL } from './support/e2e-env';
import { createBuyerFixture } from './support/e2e-fixtures';

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
  await page.getByRole('textbox', { name: 'Email', exact: true }).fill(email);
  await page.getByLabel('Пароль', { exact: true }).fill(password);
  const response = page.waitForResponse(
    (item) =>
      item.url() === `${e2eApiBaseURL}/api/auth/login` &&
      item.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Войти', exact: true }).click();
  expect((await response).status()).toBe(status);
}

test('registration form creates a session and email verification unlocks the author profile', async ({
  page,
  context,
}) => {
  const email = `registration-${randomUUID()}@bidplace.test`;
  await page.goto('/register?redirectTo=/profile');
  await page.getByLabel('Имя', { exact: true }).fill('Новый автор');
  await page.getByRole('textbox', { name: 'Email', exact: true }).fill(email);
  await page
    .getByLabel('Пароль', { exact: true })
    .fill('registration-password-123');
  const registration = page.waitForResponse(
    (item) =>
      item.url() === `${e2eApiBaseURL}/api/auth/register` &&
      item.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Создать аккаунт' }).click();
  expect((await registration).status()).toBe(201);
  await expect(page).toHaveURL(/\/verify-email\?/);
  await expect(page.getByText('Код отправлен на вашу почту.')).toBeVisible();

  const unverified = await context.request.get(`${e2eApiBaseURL}/api/auth/me`);
  expect(unverified.status()).toBe(200);
  expect((await unverified.json()).user.emailVerifiedAt).toBeNull();
  await page.getByLabel('Код из письма').fill('123');
  await page.getByRole('button', { name: 'Подтвердить', exact: true }).click();
  await expect(page.getByText('Введите шестизначный код.')).toBeVisible();

  await page
    .getByLabel('Код из письма')
    .fill(await localTestMailValue(email, 'code'));
  await page.getByRole('button', { name: 'Подтвердить', exact: true }).click();
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

test('login survives reload and password recovery rejects the old password and a reused reset link', async ({
  page,
  context,
}) => {
  const { buyer } = await createBuyerFixture();
  await page.goto('/login?redirectTo=/profile');
  await loginForm(page, buyer.email, 'wrong-password-123', 401);
  await expect(page).toHaveURL(/\/login\?/);
  await loginForm(page, buyer.email, buyer.password, 201);
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
    .getByRole('textbox', { name: 'Email', exact: true })
    .fill(buyer.email);
  await page.getByRole('button', { name: 'Отправить ссылку' }).click();
  await expect(
    page.getByText('Проверьте почту', { exact: true }),
  ).toBeVisible();
  const token = await localTestMailValue(buyer.email, 'token');
  const resetPath = `/reset-password?token=${encodeURIComponent(token)}`;
  const password = 'recovered-password-123';
  await page.goto(resetPath);
  await page.getByLabel('Новый пароль', { exact: true }).fill(password);
  await page.getByLabel('Подтверждение пароля', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Сохранить пароль' }).click();
  await expect(
    page.getByText('Пароль обновлён', { exact: true }),
  ).toBeVisible();

  await page.goto(resetPath);
  await page.getByLabel('Новый пароль', { exact: true }).fill(password);
  await page.getByLabel('Подтверждение пароля', { exact: true }).fill(password);
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
