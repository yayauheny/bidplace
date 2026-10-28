import { expect, test } from '@playwright/test';

import { assignAuthClientIp } from './support/auth-client-ip';

test.beforeEach(async ({ context }) => {
  await assignAuthClientIp(context);
});

test('login registration link changes route and keeps redirectTo', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 874 });
  await page.goto('/login?redirectTo=%2Fcabinet');
  await page.getByRole('link', { name: 'Регистрация', exact: true }).click();
  await expect(page).toHaveURL(/\/register/);
  await expect(page).toHaveURL(/redirectTo=%2Fcabinet|redirectTo=\/cabinet/);
});

test('forgot password back link navigates to login from keyboard', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 874 });
  await page.goto('/forgot-password');
  const back = page.getByRole('link', {
    name: 'Вернуться ко входу',
    exact: true,
  });
  await back.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/login/);
});
