import { mkdir } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';

import { expect, test, type Page } from '@playwright/test';

import {
  AUTH_TURNSTILE_FAILED_COPY,
  AUTH_TURNSTILE_REQUIRED_COPY,
  AUTH_TURNSTILE_UNAVAILABLE_COPY,
} from '../src/errors/copy';

import { registerUntilVerify, sendVerification } from './support/auth-browser-flow';
import { assignAuthClientIp } from './support/auth-client-ip';
import {
  armAuthWriteHold,
  cleanupAuthCookieProxyHold,
  releaseHeldAuthWrite,
  waitForHeldAuthWrite,
} from './support/auth-cookie-proxy';
import { AUTH_BROWSER_VIEWPORTS, AUTH_PHONE_VIEWPORT, AUTH_SHORT_PHONE_VIEWPORT } from './support/auth-viewports';
import { e2eApiBaseURL } from './support/e2e-env';
import { e2eEvidenceDir } from './support/evidence-dir';
import { createBuyerFixture } from './support/e2e-fixtures';
import { assertScriptedProof, expectTurnstileReady, expectTurnstileSizeForHost, installTurnstileFixture } from './support/turnstile-fixture';

test.use({ trace: 'off', screenshot: 'off', video: 'off' });

test.beforeEach(async ({ context }) => {
  await assignAuthClientIp(context);
});

test('the shared Turnstile frame follows its width rule without a reload', async ({ page }) => {
  await installTurnstileFixture(page);
  await page.goto('/forgot-password');
  const url = page.url();
  for (const viewport of AUTH_BROWSER_VIEWPORTS) {
    await page.setViewportSize(viewport);
    expect(page.url()).toBe(url);
    await expectTurnstileReady(page, 'password_reset');
    await expectTurnstileSizeForHost(page);
    await page.getByRole('textbox', { name: 'Электронная почта', exact: true }).focus();
    await expect(page.getByRole('textbox', { name: 'Электронная почта', exact: true })).toBeFocused();
    await expect(page.getByRole('button', { name: 'Отправить ссылку', exact: true })).toBeInViewport();
  }
});

test('recovery unavailable keeps send reachable after zoom without a forgot-password POST', async ({
  page,
}) => {
  let forgotPasswordRequests = 0;
  page.on('request', (request) => {
    if (request.method() === 'POST' && request.url().includes('/api/auth/forgot-password')) {
      forgotPasswordRequests += 1;
    }
  });
  await page.setViewportSize(AUTH_PHONE_VIEWPORT);
  await installTurnstileFixture(page, 'unavailable');
  await page.goto('/forgot-password');
  const unavailable = page.getByText(AUTH_TURNSTILE_UNAVAILABLE_COPY, { exact: true });
  await expect(unavailable).toBeVisible();
  const email = page.getByRole('textbox', { name: 'Электронная почта', exact: true });
  const send = page.getByRole('button', { name: 'Отправить ссылку', exact: true });
  await expect(email).toHaveValue('');
  await mkdir(e2eEvidenceDir, { recursive: true });
  await page.screenshot({
    path: resolve(e2eEvidenceDir, `${engine(page)}-turnstile-unavailable-blank.png`),
    fullPage: true,
  });
  await page.setViewportSize(AUTH_SHORT_PHONE_VIEWPORT);
  await page.evaluate(() => { document.documentElement.style.zoom = '1.5'; });
  await send.scrollIntoViewIfNeeded();
  await expect(send).toBeInViewport();
  await expect(email).toHaveValue('');
  await expect.poll(() => forgotPasswordRequests).toBe(0);
  await page.evaluate(() => { document.documentElement.style.zoom = ''; });
});

test('login renders a Turnstile challenge from the server response and submits a scripted proof', async ({
  page,
}) => {
  await installTurnstileFixture(page);
  await page.goto('/login');
  await page.getByLabel('Электронная почта').fill('challenge@bidplace.test');
  await page.getByLabel('Пароль', { exact: true }).fill('wrong-password-123');
  await page.route('**/api/auth/login', async (route) => {
    const body = route.request().postDataJSON() as { turnstileToken?: unknown };
    if (body.turnstileToken === undefined) {
      await route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 403,
          code: 'TURNSTILE_REQUIRED',
          message: 'Turnstile verification is required',
        }),
      });
      return;
    }
    assertScriptedProof(body.turnstileToken, 'login');
    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ status: 401, code: 'unauthorized', message: 'Invalid credentials' }),
    });
  });
  await page.getByRole('button', { name: 'Войти', exact: true }).click();
  const required = page.getByText(AUTH_TURNSTILE_REQUIRED_COPY, { exact: true });
  await expect(required).toBeVisible();
  await mkdir(e2eEvidenceDir, { recursive: true });
  await required.screenshot({
    path: resolve(e2eEvidenceDir, `${engine(page)}-turnstile-required.png`),
  });
  await expectTurnstileReady(page, 'login');
  await page.getByRole('button', { name: 'Войти', exact: true }).click();
  await expect(page.getByText('Неверная почта или пароль', { exact: true })).toBeVisible();
  await page.unroute('**/api/auth/login');
  await fulfillNext(page, '**/api/auth/login', {
    status: 429,
    code: 'LOGIN_PAUSED',
    message: 'Login is paused',
  });
  await page.getByRole('button', { name: 'Войти', exact: true }).click();
  await expect(page.getByText('Вход временно ограничен. Попробуйте позже.', { exact: true })).toBeVisible();
});

test('verification errors keep the fake code and show the server pause, quota, and budget', async ({
  page,
}) => {
  await installTurnstileFixture(page);
  const id = randomUUID().slice(0, 8);
  await registerUntilVerify(page, {
    email: `errors-${id}@bidplace.test`,
    slug: `err${id}`,
  });
  await page.getByLabel('Код из письма').fill('000000');
  await fulfillNext(page, '**/api/auth/email/verify', {
    status: 403,
    code: 'OTP_INVALID',
    message: 'OTP is invalid',
  });
  await page.getByRole('button', { name: 'Завершить', exact: true }).click();
  const wrong = page.getByText('Код не подошёл. Измените его, затем повторите проверку.', { exact: true });
  await expect(wrong).toBeVisible();
  await expect(page.getByLabel('Код из письма')).toHaveValue('000000');
  await mkdir(e2eEvidenceDir, { recursive: true });
  await wrong.screenshot({
    path: resolve(e2eEvidenceDir, `${engine(page)}-otp-wrong-000000.png`),
  });

  await fulfillNext(page, '**/api/auth/email/request', {
    status: 429,
    code: 'MAIL_BUDGET',
    message: 'Email budget is exhausted',
  });
  await expectTurnstileReady(page, 'email_verification');
  await page.getByRole('button', { name: 'Отправить код', exact: true }).click();
  await expect(page.getByText('Лимит писем исчерпан. Отправка сейчас недоступна.', { exact: true })).toBeVisible();

  await fulfillNext(page, '**/api/auth/email/request', {
    status: 403,
    code: 'TURNSTILE_FAILED',
    message: 'Turnstile verification failed',
  });
  await expectTurnstileReady(page, 'email_verification');
  await page.getByRole('button', { name: 'Отправить код', exact: true }).click();
  await expect(page.getByText(AUTH_TURNSTILE_FAILED_COPY, { exact: true })).toBeVisible();

  const retryAt = new Date(Date.now() + 4_000).toISOString();
  await fulfillNext(page, '**/api/auth/email/request', {
    status: 429,
    code: 'MAIL_QUOTA',
    message: 'Email quota is exhausted',
    details: { retryAt },
  });
  await expectTurnstileReady(page, 'email_verification');
  await page.getByRole('button', { name: 'Отправить код', exact: true }).click();
  await expect(page.getByText(/Лимит отправок исчерпан\. Повторите через \d+ с\./)).toBeVisible();

  await page.getByLabel('Код из письма').fill('000001');
  await fulfillNext(page, '**/api/auth/email/verify', {
    status: 429,
    code: 'OTP_PAUSED',
    message: 'OTP retry pause is active',
    details: { pausedUntil: retryAt },
  });
  await page.getByRole('button', { name: 'Завершить', exact: true }).click();
  await expect(page.getByText(/Проверка кода приостановлена\. Повторите через \d+ с\./)).toBeVisible();
});

test('one accepted verification send shows the server cooldown without waiting it out', async ({
  page,
}) => {
  await installTurnstileFixture(page);
  const id = randomUUID().slice(0, 8);
  await registerUntilVerify(page, {
    email: `cooldown-${id}@bidplace.test`,
    slug: `cool${id}`,
  });
  const sent = await sendVerification(page);
  expect(sent.status()).toBe(201);
  await expect(page.getByRole('button', { name: /Новый код через \d+ сек/ })).toBeDisabled();
});

test('a late login response cannot replace the account installed while it was held', async ({
  page,
  context,
}) => {
  await cleanupAuthCookieProxyHold();
  let released = false;
  try {
    const first = await createBuyerFixture();
    const second = await createBuyerFixture();
    await installTurnstileFixture(page);
    await page.goto('/login?redirectTo=/profile');
    const nonce = await pinDocument(page);
    await armAuthWriteHold('/api/auth/login');
    await submitLogin(page, first.buyer.email, first.buyer.password);
    await waitForHeldAuthWrite();
    await page.getByRole('link', { name: 'Забыли пароль?', exact: true }).click();
    await page.getByRole('link', { name: 'Вернуться ко входу', exact: true }).click();
    await expectSameDocument(page, nonce);
    await submitLogin(page, second.buyer.email, second.buyer.password);
    await expectProfilePath(page);
    await expectSameDocument(page, nonce);
    await expectAccount(context, second.buyer);
    await releaseHeldAuthWrite();
    released = true;
    await expectSession(page, context, second.buyer);
  } finally {
    if (!released) await cleanupAuthCookieProxyHold();
  }
});

test('a late registration response cannot replace the account installed while it was held', async ({
  page,
  context,
}) => {
  await cleanupAuthCookieProxyHold();
  let released = false;
  try {
    const buyer = await createBuyerFixture();
    await installTurnstileFixture(page);
    await page.goto('/login?redirectTo=/profile');
    const nonce = await pinDocument(page);
    await page.getByRole('link', { name: 'Регистрация', exact: true }).click();
    const id = randomUUID().slice(0, 8);
    await page.getByRole('textbox', { name: 'Электронная почта', exact: true }).fill(`late-a-${id}@bidplace.test`);
    await page.getByRole('checkbox', { name: /Мне есть 18 лет/ }).click();
    await page.getByRole('button', { name: 'Дальше', exact: true }).click();
    await page.getByLabel('Никнейм', { exact: true }).fill(`latea${id}`);
    await page.getByRole('button', { name: 'Дальше', exact: true }).click();
    await page.getByLabel('Введите пароль', { exact: true }).fill('registration-password-123');
    await page.getByLabel('Подтвердите пароль', { exact: true }).fill('registration-password-123');
    await expectTurnstileReady(page, 'register');
    await armAuthWriteHold('/api/auth/register');
    await page.getByRole('button', { name: 'Дальше', exact: true }).click();
    await waitForHeldAuthWrite();
    await expectSameDocument(page, nonce);
    await page.goBack();
    await expectSameDocument(page, nonce);
    await submitLogin(page, buyer.buyer.email, buyer.buyer.password);
    await expectProfilePath(page);
    await expectSameDocument(page, nonce);
    await expectAccount(context, buyer.buyer);
    await releaseHeldAuthWrite();
    released = true;
    await expectSession(page, context, buyer.buyer);
  } finally {
    if (!released) await cleanupAuthCookieProxyHold();
  }
});

test('reloading aborts a held logout and the next login remains after release', async ({
  page,
  context,
}) => {
  await cleanupAuthCookieProxyHold();
  let released = false;
  try {
    const first = await createBuyerFixture();
    const second = await createBuyerFixture();
    await installTurnstileFixture(page);
    await login(page, first.buyer.email, first.buyer.password);
    await expectProfilePath(page);
    await armAuthWriteHold('/api/auth/logout');
    await page.getByRole('button', { name: 'Выйти', exact: true }).click();
    await waitForHeldAuthWrite();
    await page.reload();
    expect((await context.request.get(`${e2eApiBaseURL}/api/auth/me`)).status()).toBe(401);
    await login(page, second.buyer.email, second.buyer.password);
    await expectProfilePath(page);
    await releaseHeldAuthWrite();
    released = true;
    await expectSession(page, context, second.buyer);
  } finally {
    if (!released) await cleanupAuthCookieProxyHold();
  }
});

async function login(page: Page, email: string, password: string) {
  await page.goto('/login?redirectTo=/profile');
  await submitLogin(page, email, password);
}

async function expectProfilePath(page: Page) {
  await expect.poll(() => new URL(page.url()).pathname).toBe('/profile');
}

async function submitLogin(page: Page, email: string, password: string) {
  const login = page.getByRole('dialog', { name: 'Вход на Bidplace', exact: true }).locator('visible=true');
  await login.getByRole('textbox', { name: 'Электронная почта', exact: true }).fill(email);
  await login.getByRole('textbox', { name: 'Пароль', exact: true }).fill(password);
  await login.getByRole('button', { name: 'Войти', exact: true }).click();
}

async function pinDocument(page: Page): Promise<string> {
  return page.evaluate(() => {
    const nonce = crypto.randomUUID();
    document.documentElement.dataset.authDocument = nonce;
    return nonce;
  });
}

async function expectSameDocument(page: Page, nonce: string) {
  await expect.poll(() => page.evaluate(() => document.documentElement.dataset.authDocument ?? '')).toBe(nonce);
}

type AccountIdentity = { id: string; email: string };

type MeResponse = { status: () => number; json: () => Promise<unknown> };

async function expectAccount(
  context: { request: { get: (url: string) => Promise<MeResponse> } },
  account: AccountIdentity,
) {
  const current = await context.request.get(`${e2eApiBaseURL}/api/auth/me`);
  expect(current.status()).toBe(200);
  const body: unknown = await current.json();
  if (!isAccountBody(body)) throw new Error('Auth session did not identify an account');
  expect(body.user.id).toBe(account.id);
  expect(body.user.email).toBe(account.email);
}

function isAccountBody(body: unknown): body is { user: AccountIdentity } {
  if (typeof body !== 'object' || body === null || !('user' in body)) return false;
  const user = body.user;
  if (typeof user !== 'object' || user === null || !('id' in user) || !('email' in user)) return false;
  return typeof user.id === 'string' && typeof user.email === 'string';
}

async function expectSession(
  page: Page,
  context: { request: { get: (url: string) => Promise<MeResponse> } },
  account: AccountIdentity,
) {
  await expectAccount(context, account);
  await page.reload();
  await expectAccount(context, account);
}

async function fulfillNext(
  page: Page,
  url: string,
  body: { status: number; code: string; message: string; details?: unknown },
) {
  await page.unroute(url);
  await page.route(url, async (route) => {
    await page.unroute(url);
    await route.fulfill({
      status: body.status,
      contentType: 'application/json',
      body: JSON.stringify({
        status: body.status,
        code: body.code,
        message: body.message,
        ...(body.details ? { details: body.details } : {}),
      }),
    });
  });
}

function engine(page: Page) {
  return page.context().browser()?.browserType().name() ?? 'browser';
}

test('web auth completion: Google, email code and Telegram link keep one account', async ({ page }) => {
  await installTurnstileFixture(page);
  await page.goto('/login?redirectTo=/account');
  await page.getByRole('button', { name: 'Войти с Google', exact: true }).click();
  await expect(page).toHaveURL(/\/auth\/complete$/);
  await page.getByRole('textbox', { name: 'Никнейм', exact: true }).fill(`web-${randomUUID().slice(0, 8)}`);
  await page.getByRole('checkbox', { name: /Мне есть 18 лет/ }).click();
  const originalViewport = page.viewportSize();
  expect(originalViewport).not.toBeNull();
  await mkdir(e2eEvidenceDir, { recursive: true });
  for (const width of [390, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.locator('[data-turnstile-action="register"]')).toHaveCount(0);
    const finish = page.getByRole('button', { name: 'Завершить регистрацию', exact: true });
    await finish.scrollIntoViewIfNeeded();
    await expect(finish).toBeInViewport();
    await page.screenshot({ path: resolve(e2eEvidenceDir, `${engine(page)}-social-onboarding-${width}.png`), fullPage: true });
  }
  await page.setViewportSize(originalViewport!);
  await page.getByRole('button', { name: 'Завершить регистрацию', exact: true }).click();
  await expect.poll(() => new URL(page.url()).pathname).toBe('/account');
  const original = (await (await page.request.get('/api/auth/me')).json()).user;
  await page.goto('/account/settings');
  await page.getByRole('button', { name: 'Подключить Telegram', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Telegram подключён', exact: true })).toBeVisible();
  const logout = () => page.request.post('/api/auth/logout', { headers: { Origin: 'http://127.0.0.1:55442', 'X-Bidplace-Request': '1' } });
  expect((await logout()).status()).toBe(201);
  await page.goto('/email-login?redirectTo=/account');
  await page.getByRole('textbox', { name: 'Электронная почта', exact: true }).fill(original.email);
  await expectTurnstileReady(page, 'email_login');
  await page.getByRole('button', { name: 'Получить код', exact: true }).click();
  await expect(page.getByText(/Новый аккаунт не создаётся/)).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: /Повторить запрос через/ })).toBeDisabled();
  const proof = await (await page.request.get('/__test/mail')).json();
  await page.getByRole('textbox', { name: 'Код из письма', exact: true }).fill(proof.code);
  const signingIn = page.waitForResponse(response => response.url().endsWith('/api/auth/email-login/verify') && response.request().method() === 'POST');
  await page.getByRole('button', { name: 'Войти', exact: true }).click();
  expect((await signingIn).status()).toBe(201);
  await expect.poll(() => new URL(page.url()).pathname).toBe('/account');
  const signedIn = await page.request.get('/api/auth/me');
  expect(signedIn.status()).toBe(200);
  expect((await signedIn.json()).user.id).toBe(original.id);
  expect((await logout()).status()).toBe(201);
  await page.goto('/login?redirectTo=/account');
  await page.getByRole('button', { name: 'Войти с Telegram', exact: true }).click();
  await expect.poll(() => new URL(page.url()).pathname).toBe('/account');
  const returning = await page.request.get('/api/auth/me');
  expect(returning.status()).toBe(200);
  expect((await returning.json()).user.id).toBe(original.id);
});

test('web auth completion: Telegram requires email proof and preserves pending state on reload', async ({ page }) => {
  await installTurnstileFixture(page);
  await page.goto('/login?redirectTo=/account');
  await page.getByRole('button', { name: 'Войти с Telegram', exact: true }).click();
  await expect(page).toHaveURL(/\/auth\/complete$/);
  await page.getByRole('textbox', { name: 'Электронная почта', exact: true }).fill(`telegram-${randomUUID()}@example.test`);
  await page.getByRole('textbox', { name: 'Никнейм', exact: true }).fill(`tg-${randomUUID().slice(0, 8)}`);
  await page.getByRole('checkbox', { name: /Мне есть 18 лет/ }).click();
  await page.getByRole('button', { name: 'Завершить регистрацию', exact: true }).click();
  await expect(page.getByText(/Подтвердите почту/)).toBeVisible();
  expect((await page.request.get('/api/auth/me')).status()).toBe(401);
  await page.reload();
  await expectTurnstileReady(page, 'email_verification');
  const sending = page.waitForResponse(response => response.url().endsWith('/api/auth/onboarding/email/request') && response.request().method() === 'POST');
  await page.getByRole('button', { name: 'Запросить код', exact: true }).click();
  expect((await sending).status()).toBe(201);
  const proof = await (await page.request.get('/__test/mail')).json();
  await page.getByRole('textbox', { name: 'Код из письма', exact: true }).fill(proof.code);
  await page.getByRole('button', { name: 'Подтвердить и войти', exact: true }).click();
  await expect.poll(() => new URL(page.url()).pathname).toBe('/account');
  expect((await page.request.get('/api/auth/me')).status()).toBe(200);
});

test('web auth completion: delayed state preserves an edited email and resend uses server time', async ({ page }) => {
  await installTurnstileFixture(page);
  await page.addInitScript(() => { const realNow = Date.now.bind(Date); Date.now = () => realNow() + 3_600_000; });
  await page.goto('/email-login');
  await page.getByRole('textbox', { name: 'Электронная почта', exact: true }).fill(`unknown-${randomUUID()}@example.test`);
  await expectTurnstileReady(page, 'email_login');
  await page.getByRole('button', { name: 'Получить код', exact: true }).click();
  await expect(page.getByRole('button', { name: /Повторить запрос через/ })).toBeDisabled();
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  let entered!: () => void;
  const pending = new Promise<void>(resolve => { entered = resolve; });
  await page.route('**/api/auth/email-login/state', async route => {
    const response = await route.fetch();
    entered();
    await gate;
    await route.fulfill({ response });
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await pending;
  const edited = `edited-${randomUUID()}@example.test`;
  await page.getByRole('textbox', { name: 'Электронная почта', exact: true }).fill(edited);
  release();
  await expect(page.getByRole('textbox', { name: 'Электронная почта', exact: true })).toHaveValue(edited);
  await expect(page.getByRole('textbox', { name: 'Код из письма', exact: true })).toHaveCount(0);
});


test('web auth completion: code form preserves focus and edits through responsive resize', async ({ page }) => {
  await installTurnstileFixture(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/email-login?redirectTo=/account');
  const email = page.getByRole('textbox', { name: 'Электронная почта', exact: true });
  await email.fill('resize@example.test');
  const originalUrl = page.url();
  await mkdir(e2eEvidenceDir, { recursive: true });
  for (const width of [320, 390, 440, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await email.focus();
    await expect(email).toBeFocused();
    await expect(email).toHaveValue('resize@example.test');
    await expectTurnstileReady(page, 'email_login');
    await expect(async () => { await expectTurnstileSizeForHost(page); }).toPass({ timeout: 5000 });
    await expect(page.getByRole('button', { name: 'Получить код', exact: true })).toBeInViewport();
    expect(page.url()).toBe(originalUrl);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: resolve(e2eEvidenceDir, `${engine(page)}-email-login-${width}.png`), fullPage: true });
  }
});


test('web auth completion: a rejected proof can be retried immediately and bad codes stay neutral', async ({ page }) => {
  await installTurnstileFixture(page);
  await page.goto('/login?redirectTo=/account');
  await page.getByRole('button', { name: 'Войти с Google', exact: true }).click();
  await page.getByRole('textbox', { name: 'Никнейм', exact: true }).fill(`retry-${randomUUID().slice(0, 8)}`);
  await page.getByRole('checkbox', { name: /Мне есть 18 лет/ }).click();
  await expect(page.locator('[data-turnstile-action="register"]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Завершить регистрацию', exact: true }).click();
  await expect.poll(() => new URL(page.url()).pathname).toBe('/account');
  const user = (await (await page.request.get('/api/auth/me')).json()).user;
  await page.request.post('/api/auth/logout', { headers: { Origin: 'http://127.0.0.1:55442', 'X-Bidplace-Request': '1' } });
  await page.goto('/email-login?redirectTo=/account');
  await page.getByRole('textbox', { name: 'Электронная почта', exact: true }).fill(user.email);
  await expectTurnstileReady(page, 'email_login');
  await page.route('**/api/auth/email-login/request', async route => {
    await page.unroute('**/api/auth/email-login/request');
    await route.continue({ postData: JSON.stringify({ ...route.request().postDataJSON(), turnstileToken: 'synthetic-invalid-proof' }) });
  });
  const failed = page.waitForResponse(response => response.url().endsWith('/api/auth/email-login/request') && response.request().method() === 'POST');
  await page.getByRole('button', { name: 'Получить код', exact: true }).click();
  expect((await failed).status()).toBe(403);
  await expect(page.getByText(AUTH_TURNSTILE_FAILED_COPY, { exact: true })).toBeVisible();
  await expectTurnstileReady(page, 'email_login');
  const sending = page.waitForResponse(response => response.url().endsWith('/api/auth/email-login/request') && response.request().method() === 'POST');
  await page.getByRole('button', { name: 'Получить код', exact: true }).click();
  expect((await sending).status()).toBe(201);
  const proof = await (await page.request.get('/__test/mail')).json();
  const wrong = String((Number(proof.code) + 1) % 1_000_000).padStart(6, '0');
  await page.getByRole('textbox', { name: 'Код из письма', exact: true }).fill(wrong);
  await page.getByRole('button', { name: 'Войти', exact: true }).click();
  await expect(page.getByText(/Не удалось подтвердить вход. Проверьте код/)).toBeVisible();
  await page.getByRole('textbox', { name: 'Код из письма', exact: true }).fill(proof.code);
  await page.getByRole('button', { name: 'Войти', exact: true }).click();
  await expect.poll(() => new URL(page.url()).pathname).toBe('/account');
  expect((await (await page.request.get('/api/auth/me')).json()).user.id).toBe(user.id);
});

test('web auth completion: provider cancellation preserves the destination through retry', async ({ page }) => {
  await installTurnstileFixture(page);
  const destination = '/account/settings?review=1';
  await page.route(/\/authorize\?/, async route => {
    await page.unroute(/\/authorize\?/);
    const authorization = new URL(route.request().url());
    authorization.searchParams.set('test_denied', '1');
    await route.continue({ url: authorization.href });
  });
  await page.goto('/login?redirectTo=' + encodeURIComponent(destination));
  await page.getByRole('button', { name: 'Войти с Google', exact: true }).click();
  await expect.poll(() => new URL(page.url()).searchParams.get('authError')).toBe('cancelled');
  expect(new URL(page.url()).searchParams.get('redirectTo')).toBe(destination);
  await page.getByRole('button', { name: 'Войти с Google', exact: true }).click();
  await page.getByRole('textbox', { name: 'Никнейм', exact: true }).fill(`return-${randomUUID().slice(0, 8)}`);
  await page.getByRole('checkbox', { name: /Мне есть 18 лет/ }).click();
  await page.getByRole('button', { name: 'Завершить регистрацию', exact: true }).click();
  await expect.poll(() => new URL(page.url()).pathname + new URL(page.url()).search).toBe(destination);
});
