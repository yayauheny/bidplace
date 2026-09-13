import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

import { expect, test, type Page } from '@playwright/test';

import { e2eEvidenceDir } from './support/evidence-dir';

const artifactDir = resolve(e2eEvidenceDir, 'stabilization');
const removedIntro = 'Искусство встречает своего следующего владельца.';

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
  await expect(page.getByLabel('Email')).toBeVisible();
  await expect(page.getByLabel('Телефон')).toBeVisible();
  await expect(page.getByLabel('Пароль')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Создать аккаунт' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Войти' })).toBeVisible();

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
