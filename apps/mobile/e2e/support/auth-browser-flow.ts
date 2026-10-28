import { expect, type Page, type Response } from '@playwright/test';

import { e2eApiBaseURL } from './e2e-env';
import { expectTurnstileReady } from './turnstile-fixture';
import { createUnverifiedBuyerFixture } from './e2e-fixtures';
import { localTestMailValue } from './task-mail';

export function countAuthRequests(page: Page) {
  const counts = { state: 0, send: 0, register: 0 };
  page.on('request', (request) => {
    const url = request.url();
    if (request.method() === 'GET' && url === `${e2eApiBaseURL}/api/auth/email/state`) counts.state += 1;
    if (request.method() === 'POST' && url === `${e2eApiBaseURL}/api/auth/email/request`) counts.send += 1;
    if (request.method() === 'POST' && url === `${e2eApiBaseURL}/api/auth/register`) counts.register += 1;
  });
  return counts;
}

export async function openUnverifiedAccount(
  page: Page,
  input: { email: string; slug: string },
): Promise<void> {
  const { buyer } = await createUnverifiedBuyerFixture(input);
  await page.goto('/login?redirectTo=/profile');
  await page.getByRole('textbox', { name: 'Электронная почта', exact: true }).fill(buyer.email);
  await page.getByLabel('Пароль', { exact: true }).fill(buyer.password);
  await page.getByRole('button', { name: 'Войти', exact: true }).click();
  await expect(page).toHaveURL(/\/verify-email\?/);
  await expect(page.getByText('Код ещё не отправлен.', { exact: true })).toBeVisible();
}

export async function finishRegistrationEmailProof(page: Page, email: string): Promise<Response> {
  await expectTurnstileReady(page, 'register');
  const request = page.waitForResponse(
    (item) => item.url() === `${e2eApiBaseURL}/api/auth/register/email/request` && item.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Дальше', exact: true }).click();
  expect((await request).status()).toBe(201);
  await expect(page.getByText('Подтвердите почту', { exact: true })).toBeVisible();
  await page.getByLabel('Код из письма').fill(await localTestMailValue(email, 'code'));
  const registration = page.waitForResponse(
    (item) => item.url() === `${e2eApiBaseURL}/api/auth/register` && item.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Подтвердить и зарегистрироваться', exact: true }).click();
  return registration;
}

export async function expectNoSendAcrossReload(page: Page, counts: { state: number; send: number }): Promise<void> {
  await expect(page.getByText('Код ещё не отправлен.', { exact: true })).toBeVisible();
  expect(counts.send).toBe(0);
  expect(counts.state).toBeGreaterThan(0);
  const afterLoad = counts.state;
  await page.reload();
  await expect(page.getByText('Код ещё не отправлен.', { exact: true })).toBeVisible();
  expect(counts.send).toBe(0);
  const afterReload = counts.state;
  expect(afterReload).toBeGreaterThan(afterLoad);
  await page.waitForTimeout(1200);
  expect(counts.state).toBe(afterReload);
  expect(counts.send).toBe(0);
}

export async function sendVerification(page: Page): Promise<Response> {
  await expectTurnstileReady(page, 'email_verification');
  const response = page.waitForResponse(
    (item) => item.url() === `${e2eApiBaseURL}/api/auth/email/request` && item.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Отправить код', exact: true }).click();
  return response;
}
