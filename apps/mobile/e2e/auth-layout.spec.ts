import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

import { expect, test, type Page } from '@playwright/test';

import { e2eEvidenceDir } from './support/evidence-dir';

const artifactDir = resolve(e2eEvidenceDir, 'stabilization');
const removedIntro = 'Искусство встречает своего следующего владельца.';

test('dirty login asks before closing and providers stay unavailable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 874 });
  await page.goto('/login');
  const email = page.getByLabel('Электронная почта');
  await email.fill('a');
  await page.getByRole('button', { name: 'Закрыть', exact: true }).click();
  await expect(page.getByText('Прервать вход', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Продолжить', exact: true }).click();
  await expect(email).toHaveValue('a');
  await page.getByRole('button', { name: 'Войти с Google', exact: true }).click();
  await expect(page.getByText('Вход через Google пока недоступен')).toBeVisible();
  await page.getByRole('button', { name: 'Войти с Telegram', exact: true }).click();
  await expect(page.getByText('Вход через Telegram пока недоступен')).toBeVisible();
  const panel = page.locator('#auth-exit-confirm');
  await page.getByRole('button', { name: 'Закрыть', exact: true }).click();
  await expect(panel).toBeVisible();
  const panelBox = await panel.boundingBox();
  expect(panelBox).not.toBeNull();
  expect(panelBox!.width).toBeCloseTo(366, 0);
});

test('browser back keeps a filled login until the user decides', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 874 });
  await page.goto('/');
  await page.goto('/login');
  const email = page.getByLabel('Электронная почта');
  await email.fill('a');
  await page.goBack();
  await expect(page.getByText('Прервать вход', { exact: true })).toBeVisible();
  await expect(email).toHaveValue('a');
  await page.getByRole('button', { name: 'Продолжить', exact: true }).click();
  await expect(email).toHaveValue('a');
  await expect(email).toBeFocused();
  await page.goBack();
  await page.getByRole('button', { name: 'Прервать', exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('#auth-sheet')).toHaveCount(0);

  await page.goto('/login');
  await page.getByRole('button', { name: 'Регистрация', exact: true }).click();
  await expect(page).toHaveURL(/\/register/);
  await expect(page.locator('#auth-sheet')).toHaveCount(1);
});

test('auth composition is stacked in the S4 phone column', async ({ page }) => {
  await mkdir(artifactDir, { recursive: true });

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/register');
  await expectS4Register(page);
  await expectCenteredPhoneColumn(page);
  await page.screenshot({
    path: resolve(artifactDir, `${engine(page)}-register-1440.png`),
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/register');
  await expectS4Register(page);
  await expectCenteredPhoneColumn(page);
  expect(
    await page.evaluate(() => document.body.scrollWidth <= window.innerWidth),
  ).toBe(true);
  await page.screenshot({
    path: resolve(artifactDir, `${engine(page)}-register-390.png`),
  });
});

async function expectS4Register(page: Page) {
  await expect(page.getByText(removedIntro, { exact: true })).toHaveCount(0);
  const title = page.getByText('Регистрация', { exact: true }).first();
  await expect(title).toBeVisible();
  await expect(page.getByLabel('Имя')).toBeVisible();
  await expect(page.getByLabel('Электронная почта')).toBeVisible();
  await expect(page.getByLabel('Введите пароль')).toBeVisible();
  await expect(page.getByLabel('Подтвердите пароль')).toBeVisible();
  const submit = page.getByRole('button', { name: 'Продолжить' });
  await submit.scrollIntoViewIfNeeded();
  await expect(submit).toBeVisible();
  await expect(page.getByRole('button', { name: 'Войти' })).toBeVisible();
  await expect(page.getByText('Я соглашаюсь с политикой конфиденциальности и правилами сервиса')).toBeVisible();

  const titleBox = await title.boundingBox();
  const nameBox = await page.getByLabel('Имя').boundingBox();
  expect(titleBox).not.toBeNull();
  expect(nameBox).not.toBeNull();
  expect(titleBox!.y).toBeLessThan(nameBox!.y);
}

async function expectCenteredPhoneColumn(page: Page) {
  const shell = await page.getByTestId('app-shell-content').boundingBox();
  expect(shell).not.toBeNull();
  expect(shell!.width).toBeCloseTo(390, 1);
}

function engine(page: Page) {
  return page.context().browser()?.browserType().name() ?? 'browser';
}
