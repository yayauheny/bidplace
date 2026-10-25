import { expect, test, type Page } from '@playwright/test';

// AR-01 acceptance: focus restoration after closing the auth sheet.
// The dock unmounts while the sheet is open, so the opener node is replaced;
// focus must land on the remounted trigger (or the page navigation fallback).

const DOCK_PROFILE =
  '[data-testid="figma-floating-dock"] [aria-label="Профиль"]';

async function openSheetFromDock(page: Page) {
  await page.setViewportSize({ width: 390, height: 874 });
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
      const closeButton = page.getByRole('button', {
        name: 'Закрыть',
        exact: true,
      });
      await closeButton.focus();
      await closeButton.press('Enter');
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
  await page.setViewportSize({ width: 390, height: 874 });
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
  await expect(email).toBeFocused();
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
  await page.setViewportSize({ width: 390, height: 874 });
  await page.goto('/seller/local-author-1');
  await page
    .getByTestId('figma-floating-dock')
    .getByLabel('Профиль', { exact: true })
    .click();
  await page.getByRole('link', { name: 'Регистрация', exact: true }).click();
  await expect(
    page.getByRole('textbox', { name: 'Электронная почта', exact: true }),
  ).toBeFocused();
  await page.getByRole('button', { name: 'Закрыть', exact: true }).click();
  await expect(page).toHaveURL('http://localhost:8081/seller/local-author-1');
  await page.goto('/seller/local-author-1');
  await page
    .getByTestId('figma-floating-dock')
    .getByLabel('Профиль', { exact: true })
    .click();
  await page.getByRole('link', { name: 'Регистрация', exact: true }).click();
  const email = page.getByRole('textbox', {
    name: 'Электронная почта',
    exact: true,
  });
  await expect(email).toBeFocused();
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

const EXPLORE_ORIGIN =
  '/explore?section=works&material=Glass&sort=oldest';

async function openExploreAuth(
  page: Page,
  trigger: 'Профиль' | 'Добавить' = 'Профиль',
) {
  await page.setViewportSize({ width: 390, height: 874 });
  await page.goto(EXPLORE_ORIGIN);
  await page
    .getByTestId('figma-floating-dock')
    .getByLabel(trigger, { exact: true })
    .click();
  await expect(page.locator('#auth-sheet')).toBeVisible();
}

for (const close of ['Escape', 'cross', 'backdrop'] as const) {
  test(`Explore profile preserves the original route and query after ${close}`, async ({
    page,
  }) => {
    await openExploreAuth(page);
    if (close === 'Escape') await page.keyboard.press('Escape');
    else if (close === 'cross') {
      const button = page.getByRole('button', { name: 'Закрыть', exact: true });
      await button.focus();
      await button.press('Enter');
    } else await page.mouse.click(10, 10);
    await expect(page).toHaveURL(`http://localhost:8081${EXPLORE_ORIGIN}`);
    await expect(page.locator('#auth-sheet')).toHaveCount(0);
  });
}

for (const step of [
  'Забыли пароль?',
  'Войти по коду из письма',
  'Регистрация',
] as const) {
  test(`Explore create preserves its origin when closing ${step}`, async ({
    page,
  }) => {
    await openExploreAuth(page, 'Добавить');
    await page.getByRole('link', { name: step, exact: true }).click();
    await expect(page).not.toHaveURL(/\/login\?/);
    await page.keyboard.press('Escape');
    await expect(page).toHaveURL(`http://localhost:8081${EXPLORE_ORIGIN}`);
  });
}

test('browser Back still visits the previous auth step before the public origin', async ({
  page,
}) => {
  await openExploreAuth(page);
  await page.getByRole('link', { name: 'Забыли пароль?', exact: true }).click();
  await expect(page).toHaveURL(/\/forgot-password\?/);
  await page.goBack();
  await expect(page).toHaveURL(/\/login\?/);
  await page.goBack();
  await expect(page).toHaveURL(`http://localhost:8081${EXPLORE_ORIGIN}`);
});

for (const redirectTo of [
  '/profile',
  'https://evil.example/path',
  '/explore?section=works',
]) {
  test(`direct auth has a safe dismissal fallback for ${redirectTo}`, async ({
    page,
  }) => {
    await page.goto(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
    await expect(page.locator('#auth-sheet')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page).toHaveURL('http://localhost:8081/');
  });
}

test('become author keeps the success target separate from the cancellation origin', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/seller/local-author-1');
  const becomeAuthor = page.getByRole('link', {
    name: 'Стать автором',
    exact: true,
  });
  await becomeAuthor.scrollIntoViewIfNeeded();
  await becomeAuthor.click();
  await expect(page).toHaveURL(/\/login\?redirectTo=%2Fprofile$/);
  await page.keyboard.press('Escape');
  await expect(page).toHaveURL('http://localhost:8081/seller/local-author-1');
});

for (const origin of ['/product/aliceGlass1']) {
  test(`auth dismissal uses the saved public route for ${origin}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(origin);
    await page
      .getByTestId('desktop-navigation')
      .getByLabel('Профиль', { exact: true })
      .click();
    await expect(page.locator('#auth-sheet')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page).toHaveURL(`http://localhost:8081${origin}`);
  });
}

test('direct auth transitions still dismiss safely without a public history entry', async ({
  page,
}) => {
  await page.goto('/login?redirectTo=%2Fprofile');
  await page.getByRole('link', { name: 'Забыли пароль?', exact: true }).click();
  await expect(page).toHaveURL(/forgot-password/);
  await page.keyboard.press('Escape');
  await expect(page).toHaveURL('http://localhost:8081/');
});

for (const entry of ['profile', 'become-author'] as const) {
  test(`successful ${entry} login retains its own target`, async ({ page }) => {
    const timestamp = '2026-10-25T12:00:00.000Z';
    const user = {
      id: 'f1991d27-5991-40a2-8913-f5d9940c61ee',
      email: 'navigation@bidplace.test',
      phone: null,
      emailVerifiedAt: timestamp,
      phoneVerifiedAt: null,
      acceptedRulesVersion: '2026-10-01',
      displayName: 'Navigation test',
      slug: 'navigation-test',
      role: 'user',
      status: 'active',
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    let authenticated = false;
    await page.route('**/api/auth/me', (route) =>
      route.fulfill(
        authenticated
          ? { json: { user } }
          : {
              status: 401,
              json: {
                status: 401,
                code: 'unauthorized',
                message: 'Authentication required',
              },
            },
      ),
    );
    await page.route('**/api/auth/login', (route) => {
      authenticated = true;
      return route.fulfill({ status: 201, json: { user } });
    });
    if (entry === 'profile') await openExploreAuth(page);
    else {
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.goto('/seller/local-author-1');
      await page
        .getByRole('link', { name: 'Стать автором', exact: true })
        .click();
    }
    const email = page.getByRole('textbox', {
      name: 'Электронная почта',
      exact: true,
    });
    await expect(email).toBeFocused();
    await email.pressSequentially(user.email);
    await page
      .getByLabel('Пароль', { exact: true })
      .pressSequentially('navigation-test-password');
    await page.getByRole('button', { name: 'Войти', exact: true }).click();
    await expect(page).toHaveURL(
      `http://localhost:8081${entry === 'profile' ? EXPLORE_ORIGIN : '/profile'}`,
    );
    await expect(page.locator('#auth-sheet')).toHaveCount(0);
  });
}

test('confirmed dirty registration exit restores the original Explore state', async ({
  page,
}) => {
  await openExploreAuth(page);
  await page.getByRole('link', { name: 'Регистрация', exact: true }).click();
  await page
    .getByRole('textbox', { name: 'Электронная почта', exact: true })
    .fill('cancel@bidplace.test');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Прервать', exact: true }).click();
  await expect(page).toHaveURL(`http://localhost:8081${EXPLORE_ORIGIN}`);
});
