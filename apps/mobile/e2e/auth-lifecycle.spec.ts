import { randomUUID } from 'node:crypto';
import { expect, test, type Page } from '@playwright/test';

import {
  AUTH_RECOVERY_ACCEPTED_COPY,
  INFRASTRUCTURE_ERROR_COPY,
} from '../src/errors/copy';

import {
  countAuthRequests,
  expectNoSendAcrossReload,
  finishRegistrationEmailProof,
  openUnverifiedAccount,
  sendVerification,
} from './support/auth-browser-flow';
import { assignAuthClientIp } from './support/auth-client-ip';
import { e2eApiBaseURL } from './support/e2e-env';
import { createBuyerFixture } from './support/e2e-fixtures';
import { expectPasswordVisibility } from './support/fill-control';
import { localTestMailHas, localTestMailValue } from './support/task-mail';
import {
  expectInvisibleTurnstile,
  installTurnstileFixture,
} from './support/turnstile-fixture';

test.use({ trace: 'off', screenshot: 'off', video: 'off' });

test.beforeEach(async ({ context }) => {
  await assignAuthClientIp(context);
});

async function expectProfilePath(page: Page): Promise<void> {
  await expect.poll(() => new URL(page.url()).pathname).toBe('/profile');
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

test('registration proves email, creates a session and unlocks the author profile', async ({
  page,
  context,
}) => {
  await page.setViewportSize({ width: 390, height: 874 });
  await installTurnstileFixture(page);
  const counts = countAuthRequests(page);
  const id = randomUUID().slice(0, 8);
  const email = `registration-${id}@bidplace.test`;
  let registrations = 0;
  await page.route('**/api/auth/register', async (route) => {
    registrations += 1;
    await route.continue();
  });
  await page.goto('/register?redirectTo=/profile');
  const emailField = page.getByRole('textbox', { name: 'Электронная почта', exact: true });
  await emailField.fill(email);
  const consent = page.getByRole('checkbox', { name: /принимаю/ });
  await consent.focus();
  await expect(consent).toBeFocused();
  await page.keyboard.press('Space');
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
  expect((await finishRegistrationEmailProof(page, email)).status()).toBe(201);
  await expectProfilePath(page);
  expect(registrations).toBe(1);
  expect(counts.send).toBe(0);
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

  await page.goto('/register');
  await page.getByRole('textbox', { name: 'Электронная почта', exact: true }).fill(`taken-${id}@bidplace.test`);
  await page.getByRole('checkbox', { name: /принимаю/ }).click();
  await page.getByRole('button', { name: 'Дальше', exact: true }).click();
  await page.getByLabel('Никнейм', { exact: true }).fill(`author-${id}`);
  await page.getByRole('button', { name: 'Дальше', exact: true }).click();
  await expect.poll(async () =>
    page.getByText(`@author-${id} недоступен`, { exact: true }).isVisible(),
  ).toBe(true);
  expect(registrations).toBe(1);
});

test('registration without redirectTo confirms email and returns home', async ({
  page,
  context,
}) => {
  await installTurnstileFixture(page);
  const counts = countAuthRequests(page);
  const id = randomUUID().slice(0, 8);
  const email = `registration-home-${id}@bidplace.test`;
  await page.goto('/register');
  await page.getByRole('textbox', { name: 'Электронная почта', exact: true }).fill(email);
  await page.getByRole('checkbox', { name: /принимаю/ }).click();
  await page.getByRole('button', { name: 'Дальше', exact: true }).click();
  await page.getByLabel('Никнейм', { exact: true }).fill(`home-${id}`);
  await page.getByRole('button', { name: 'Дальше', exact: true }).click();
  await page
    .getByLabel('Введите пароль', { exact: true })
    .fill('registration-password-123');
  await page
    .getByLabel('Подтвердите пароль', { exact: true })
    .fill('registration-password-123');
  expect((await finishRegistrationEmailProof(page, email)).status()).toBe(201);
  await expect(page).toHaveURL(/\/$/);
  expect(counts.send).toBe(0);
  const verified = await context.request.get(`${e2eApiBaseURL}/api/auth/me`);
  expect(verified.status()).toBe(200);
  expect((await verified.json()).user.emailVerifiedAt).not.toBeNull();
});

test('login survives reload and password recovery rejects the old password and a reused reset link', async ({
  page,
  context,
}) => {
  await installTurnstileFixture(page);
  const { buyer } = await createBuyerFixture();
  await page.goto('/');
  await page.goto('/login?redirectTo=/profile');
  await loginForm(page, `missing-${randomUUID()}@bidplace.test`, 'wrong-password-123', 401);
  await loginForm(page, buyer.email, 'wrong-password-123', 401);
  await expect(page).toHaveURL(/\/login\?/);
  await loginForm(page, buyer.email, buyer.password, 201);
  await expectProfilePath(page);
  await page.goBack();
  await expect(page.getByText('Вход на Bidplace', { exact: true })).toHaveCount(0);
  await expect(page).not.toHaveURL(/\/login/);
  await page.goForward();
  await expectProfilePath(page);
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
  const unknownEmail = `missing-${randomUUID()}@bidplace.test`;
  await page
    .getByRole('textbox', { name: 'Электронная почта', exact: true })
    .fill(unknownEmail);
  await expectInvisibleTurnstile(page);
  await page.getByRole('button', { name: 'Отправить ссылку' }).click();
  await expect(page.getByText(AUTH_RECOVERY_ACCEPTED_COPY, { exact: true })).toBeVisible();
  expect(await localTestMailHas(unknownEmail, 'token')).toBe(false);
  await page.getByRole('button', { name: 'Отправить ещё раз' }).click();
  await page
    .getByRole('textbox', { name: 'Электронная почта', exact: true })
    .fill(buyer.email);
  await expectInvisibleTurnstile(page);
  await page.getByRole('button', { name: 'Отправить ссылку' }).click();
  await expect(page.getByText(AUTH_RECOVERY_ACCEPTED_COPY, { exact: true })).toBeVisible();
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
  await expectProfilePath(page);
  expect(
    (await context.request.get(`${e2eApiBaseURL}/api/auth/me`)).status(),
  ).toBe(200);
});

test('an explicit verification send is one request', async ({ page }) => {
  await installTurnstileFixture(page);
  const id = randomUUID().slice(0, 8);
  const counts = countAuthRequests(page);
  await openUnverifiedAccount(page, {
    email: `send-once-${id}@bidplace.test`,
    slug: `once${id}`,
  });
  await expectNoSendAcrossReload(page, counts);
  let posts = 0;
  await page.route('**/api/auth/email/request', async (route) => {
    posts += 1;
    await route.continue();
  });
  await expectInvisibleTurnstile(page);
  await page.getByRole('button', { name: 'Отправить код', exact: true }).dblclick();
  await expect.poll(() => posts).toBe(1);
  await expect(page.getByText(/Почтовый сервер принял письмо с кодом/)).toBeVisible();
});

test('a dropped verification send keeps the entered code', async ({ page }) => {
  await installTurnstileFixture(page);
  const id = randomUUID().slice(0, 8);
  await openUnverifiedAccount(page, {
    email: `send-drop-${id}@bidplace.test`,
    slug: `drop${id}`,
  });
  await page.route('**/api/auth/email/request', (route) => route.abort('failed'));
  await expectInvisibleTurnstile(page);
  await page.getByLabel('Код из письма').focus();
  await expect(page.getByLabel('Код из письма')).toBeFocused();
  await page.getByLabel('Код из письма').fill('000000');
  await expect(page.getByLabel('Код из письма')).toHaveValue('000000');
  await page.getByRole('button', { name: 'Отправить код', exact: true }).click();
  await expect(page.getByText(INFRASTRUCTURE_ERROR_COPY, { exact: true })).toBeVisible();
  await expect(page.getByLabel('Код из письма')).toHaveValue('000000');
});

test('an unknown verification delivery can be replayed with the same logical key', async ({
  page,
}) => {
  await installTurnstileFixture(page);
  const id = randomUUID().slice(0, 8);
  await openUnverifiedAccount(page, {
    email: `unknown-send-${id}@bidplace.test`,
    slug: `unk${id}`,
  });
  const keys: string[] = [];
  await page.route('**/api/auth/email/request', async (route) => {
    const body = route.request().postDataJSON() as { idempotencyKey?: unknown };
    if (typeof body.idempotencyKey === 'string') keys.push(body.idempotencyKey);
    if (keys.length === 1) {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, delivery: 'unknown' }),
      });
      return;
    }
    await route.continue();
  });
  await expectInvisibleTurnstile(page);
  await page.getByRole('button', { name: 'Отправить код', exact: true }).click();
  await expect(page.getByText(/Исход отправки для .+ неизвестен/)).toBeVisible();
  await expectInvisibleTurnstile(page);
  await page.getByRole('button', { name: 'Повторить тот же запрос', exact: true }).click();
  await expect.poll(() => keys.length).toBe(2);
  if (keys[0] !== keys[1]) throw new Error('Unknown-delivery replay did not keep the logical key');
});

test('changing the verification address invalidates the old code and does not send a replacement', async ({
  page,
}) => {
  await installTurnstileFixture(page);
  const id = randomUUID().slice(0, 8);
  const email = `correct-${id}@bidplace.test`;
  const replacement = `correct-next-${id}@bidplace.test`;
  await openUnverifiedAccount(page, { email, slug: `cor${id}` });
  const sent = await sendVerification(page);
  expect(sent.status()).toBe(201);
  const code = await localTestMailValue(email, 'code');
  await page.getByRole('button', { name: 'Изменить адрес', exact: true }).click();
  await page.getByLabel('Электронная почта', { exact: true }).fill(replacement);
  await page.getByRole('button', { name: 'Сохранить адрес', exact: true }).click();
  await expect(page.getByText('Прежний код больше не действует. Письмо не отправлено.', { exact: true })).toBeVisible();
  expect(await localTestMailHas(replacement, 'code')).toBe(false);
  await page.getByLabel('Код из письма').fill(code);
  await page.getByRole('button', { name: 'Завершить', exact: true }).click();
  await expect(page.getByLabel('Код из письма')).toHaveValue(code);
  await expect(page.getByText('Срок этого кода истёк.', { exact: true })).toBeVisible();
});
