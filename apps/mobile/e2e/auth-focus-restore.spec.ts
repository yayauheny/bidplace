import { expect, test, type Page } from '@playwright/test';

// AR-01 acceptance: focus restoration after closing the auth sheet.
// The dock unmounts while the sheet is open, so the opener node is replaced;
// focus must land on the remounted trigger (or the page navigation fallback).

const DOCK_PROFILE =
  '[data-testid="figma-floating-dock"] [aria-label="Профиль"]';

async function openSheetFromDock(page: Page) {
  await page.goto('/');
  await page
    .getByText('Открытие недели', { exact: true })
    .waitFor({ state: 'visible' });
  const profile = page.locator(DOCK_PROFILE);
  await profile.focus();
  await expect(profile).toBeFocused();
  await page.keyboard.press('Enter');
  await page.locator('#auth-sheet').waitFor({ state: 'visible' });
}

async function pullSheetDown(page: Page) {
  const handle = page.locator('#auth-sheet [data-sheet-drag-handle]').first();
  await handle.click({ trial: true });
  const box = await handle.boundingBox();
  if (!box) throw new Error('Missing sheet drag handle');
  await page.mouse.move(box.x + box.width / 2, box.y + 10);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2, box.y + 10 + 130, { steps: 12 });
  await page.mouse.up();
}

async function expectFocusBackOnDockProfile(page: Page) {
  await page.locator('#auth-sheet').waitFor({ state: 'hidden' });
  await expect(page.locator(DOCK_PROFILE)).toBeFocused();
}

for (const close of ['Escape', 'cross', 'swipe'] as const) {
  test(`keyboard open from dock restores focus to the remounted trigger after ${close}`, async ({
    page,
  }) => {
    await openSheetFromDock(page);
    if (close === 'Escape') {
      await page.keyboard.press('Escape');
    } else if (close === 'cross') {
      await page.getByRole('button', { name: 'Закрыть', exact: true }).click();
    } else {
      await pullSheetDown(page);
    }
    await expectFocusBackOnDockProfile(page);
  });
}

test('opening from another dock item restores focus to that item', async ({
  page,
}) => {
  // The plus item routes guests to the same auth sheet via a different trigger.
  await page.goto('/');
  await page
    .getByText('Открытие недели', { exact: true })
    .waitFor({ state: 'visible' });
  const plus = page
    .getByTestId('figma-floating-dock')
    .getByLabel('Добавить', { exact: true });
  await plus.focus();
  await expect(plus).toBeFocused();
  await page.keyboard.press('Enter');
  await page.locator('#auth-sheet').waitFor({ state: 'visible' });
  await page.keyboard.press('Escape');
  await page.locator('#auth-sheet').waitFor({ state: 'hidden' });
  await expect(plus).toBeFocused();
});

test('login forgot transitions keep focus inside the active sheet', async ({
  page,
}) => {
  await openSheetFromDock(page);
  const focusInsideSheet = () =>
    page.evaluate(
      () => document.activeElement?.closest?.('#auth-sheet') !== null,
    );
  await page.getByLabel('Электронная почта').focus();
  await page.getByRole('link', { name: 'Забыли пароль?', exact: true }).click();
  await page
    .getByText('Восстановление пароля', { exact: true })
    .waitFor({ state: 'visible' });
  await expect.poll(focusInsideSheet).toBe(true);
  await page
    .getByRole('link', { name: 'Вернуться ко входу', exact: true })
    .click();
  await page
    .locator('#auth-sheet')
    .getByText('Вход на Bidplace', { exact: true })
    .waitFor({ state: 'visible' });
  await expect.poll(focusInsideSheet).toBe(true);
});

test('dirty exit-confirm cancel returns focus into the form', async ({
  page,
}) => {
  await page.goto('/register');
  await page
    .getByText('Введите вашу почту', { exact: true })
    .waitFor({ state: 'visible' });
  const email = page.getByLabel('Электронная почта', { exact: true });
  await email.fill('dirty@example.com');
  await page.keyboard.press('Escape');
  await page
    .getByText('Прервать регистрацию', { exact: true })
    .waitFor({ state: 'visible' });
  await page.getByRole('button', { name: 'Продолжить', exact: true }).click();
  await expect(email).toBeFocused();
  await expect(
    page.getByText('Прервать регистрацию', { exact: true }),
  ).toHaveCount(0);
});

test('registration close returns to its public origin and preserves the dirty guard', async ({
  page,
}) => {
  await page.goto('/register?redirectTo=%2Fseller%2Fvex');
  await expect(
    page.getByLabel('Электронная почта', { exact: true }),
  ).toBeFocused();
  await page.getByRole('button', { name: 'Закрыть', exact: true }).click();
  await expect(page).toHaveURL(/\/seller\/vex$/);
  await page.goto('/register?redirectTo=%2Fseller%2Fvex');
  const email = page.getByLabel('Электронная почта', { exact: true });
  await email.fill('dirty@example.com');
  await page.getByRole('button', { name: 'Закрыть', exact: true }).click();
  await expect(
    page.getByText('Прервать регистрацию', { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Продолжить', exact: true }).click();
  await expect(email).toHaveValue('dirty@example.com');
  await expect(
    page.getByRole('button', { name: 'Закрыть', exact: true }),
  ).toBeFocused();
});
