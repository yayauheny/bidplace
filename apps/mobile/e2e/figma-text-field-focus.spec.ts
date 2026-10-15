import { expect, test, type Locator, type Page } from '@playwright/test';

const focusBorder = 'rgb(0, 77, 255)';
const errorBorder = 'rgb(255, 0, 0)';
const disabledBorder = 'rgb(138, 138, 138)';
const now = '2026-10-06T12:00:00.000Z';
const userId = '11111111-1111-4111-8111-111111111111';
const profileId = '22222222-2222-4222-8222-222222222222';

const anonymous = { status: 401, body: { message: 'Unauthorized' } };

function user(emailVerifiedAt: string | null) {
  return {
    id: userId,
    email: 'field-focus@bidplace.test',
    phone: null,
    emailVerifiedAt,
    phoneVerifiedAt: null,
    acceptedRulesVersion: null,
    displayName: 'Field Focus',
    slug: null,
    role: 'user',
    status: 'active',
    createdAt: now,
    updatedAt: now,
  };
}

const pendingProfile = {
  sellerProfile: {
    id: profileId,
    userId,
    slug: 'field-focus',
    sellerType: 'creator',
    discipline: 'живопись',
    fullName: 'Field Focus',
    country: 'BY',
    city: 'Minsk',
    practice: null,
    biography: null,
    profilePhotoUrl: '/api/sellers/field-focus/photo',
    socialLink: null,
    telegramUrl: null,
    instagramUrl: null,
    websiteUrl: null,
    publicEmail: null,
    shortDescription: 'Короткое описание для проверки поля.',
    handoffContactType: null,
    handoffContactValue: null,
    handoffInitiator: null,
    status: 'PENDING_REVIEW',
    applicationStage: 'ACHIEVEMENTS',
    createdAt: now,
    updatedAt: now,
  },
  editingRevision: null,
};

const pendingApplication = {
  application: {
    slug: 'field-focus',
    fullName: 'Field Focus',
    country: 'BY',
    city: 'Minsk',
    discipline: 'живопись',
    practice: null,
    shortDescription: 'Короткое описание для проверки поля.',
    status: 'PENDING_REVIEW',
    applicationStage: 'ACHIEVEMENTS',
  },
  editingRevision: null,
  achievements: [],
};

async function mockApi(
  page: Page,
  routes: Record<string, { status: number; body: unknown }>,
) {
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if (url.port !== '3001') {
      await route.continue();
      return;
    }
    const match = routes[`${route.request().method()} ${url.pathname}`];
    if (!match) {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'not stubbed' }),
      });
      return;
    }
    await route.fulfill({
      status: match.status,
      contentType: 'application/json',
      body: JSON.stringify(match.body),
    });
  });
}

function lockedField(node: HTMLElement) {
  if (
    !(node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement)
  )
    return false;
  return (
    node.disabled ||
    node.readOnly ||
    node.getAttribute('aria-disabled') === 'true'
  );
}

async function fieldChrome(field: Locator) {
  return field.evaluate((node) => {
    const normalize = (value: string) => {
      const match = value
        .replaceAll(' ', '')
        .match(/^rgba?\((\d+),(\d+),(\d+)/);
      return match ? `rgb(${match[1]}, ${match[2]}, ${match[3]})` : value;
    };
    const input = getComputedStyle(node);
    let borderColor = '';
    let current = node.parentElement;
    for (let depth = 0; depth < 6 && current; depth += 1) {
      const shell = getComputedStyle(current);
      if (shell.borderTopStyle !== 'none' && shell.borderTopWidth !== '0px') {
        borderColor = normalize(shell.borderTopColor);
        break;
      }
      current = current.parentElement;
    }
    return {
      outlineStyle: input.outlineStyle,
      outlineWidth: input.outlineWidth,
      borderColor,
    };
  });
}

test('global input focus ring stays available outside FigmaTextField', async ({
  page,
}) => {
  await mockApi(page, { 'GET /api/auth/me': anonymous });
  await page.goto('/login');
  await expect(
    page.getByRole('textbox', { name: 'Электронная почта', exact: true }),
  ).toBeVisible();
  // The login form lives in a trapped Radix focus scope since 99d22056, so page focus
  // cannot leave the auth sheet; park a plain probe input inside the sheet instead.
  await page.evaluate(() => {
    const probe = document.createElement('input');
    probe.type = 'text';
    probe.setAttribute('aria-label', 'Глобальный контур');
    document.querySelector('[role="dialog"]')?.prepend(probe);
  });
  const probe = page.getByRole('textbox', { name: 'Глобальный контур' });
  // The sheet mount may park focus on the scope container; walk forward until the
  // probe takes focus, then verify the native ring arrived from the keyboard.
  for (let step = 0; step < 6; step += 1) {
    if (await probe.evaluate((node) => node === document.activeElement)) break;
    await page.keyboard.press('Tab');
  }
  await expect(probe).toBeFocused();
  let chrome = await fieldChrome(probe);
  expect(chrome.outlineStyle).not.toBe('none');
  expect(chrome.outlineWidth).toBe('2px');
  // Same contract on the way back: keyboard-only, no scripted focus.
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Закрыть' })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(probe).toBeFocused();
  chrome = await fieldChrome(probe);
  expect(chrome.outlineStyle).not.toBe('none');
  expect(chrome.outlineWidth).toBe('2px');
});

test('field focus stays on the shell for click and tab', async ({ page }) => {
  await mockApi(page, { 'GET /api/auth/me': anonymous });
  await page.goto('/login');
  const email = page.getByRole('textbox', {
    name: 'Электронная почта',
    exact: true,
  });
  await email.click();
  await expect(email).toBeFocused();
  await expect
    .poll(async () => (await fieldChrome(email)).outlineStyle)
    .toBe('none');
  await expect
    .poll(async () => (await fieldChrome(email)).outlineWidth)
    .toBe('0px');
  await expect
    .poll(async () => (await fieldChrome(email)).borderColor)
    .toBe(focusBorder);

  await page.keyboard.press('Tab');
  const password = page.getByRole('textbox', { name: 'Пароль', exact: true });
  await expect(password).toBeFocused();
  await expect
    .poll(async () => (await fieldChrome(password)).outlineStyle)
    .toBe('none');
  await expect
    .poll(async () => (await fieldChrome(password)).borderColor)
    .toBe(focusBorder);

  await page.keyboard.press('Shift+Tab');
  await expect(email).toBeFocused();
  await expect
    .poll(async () => (await fieldChrome(email)).borderColor)
    .toBe(focusBorder);
  await expect
    .poll(async () => (await fieldChrome(email)).outlineStyle)
    .toBe('none');
});

test('verification field keeps the error shell without a native ring', async ({
  page,
}) => {
  await mockApi(page, {
    'GET /api/auth/me': { status: 200, body: { user: user(null) } },
    'GET /api/auth/email/state': {
      status: 200,
      body: {
        serverNow: now,
        email: 'field-focus@bidplace.test',
        verified: false,
        sendStatus: 'accepted',
        codeExpiresAt: null,
        resendAvailableAt: null,
        pausedUntil: null,
        quotaResetsAt: null,
      },
    },
    'POST /api/auth/email/request': {
      status: 200,
      body: { ok: true, delivery: 'accepted' },
    },
    'POST /api/auth/email/verify': {
      status: 403,
      body: { status: 403, code: 'OTP_INVALID', message: 'OTP is invalid' },
    },
  });
  // Sheet controls animate in; freeze motion so the submit button can settle (repo e2e pattern).
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/verify-email');
  const code = page.getByRole('textbox', { name: 'Код из письма' });
  await expect(code).toBeVisible();
  await code.click();
  // The submit stays disabled until six digits (current contract); a rejected code
  // paints the cells red without a native ring.
  await code.fill('000000');
  await page.getByRole('button', { name: 'Завершить', exact: true }).click();
  await expect(
    page.getByText('Код не подошёл. Измените его, затем повторите проверку.'),
  ).toBeVisible();
  await code.click();
  await expect(code).toBeFocused();
  await expect
    .poll(async () => (await fieldChrome(code)).outlineStyle)
    .toBe('none');
  const cellBorder = await page
    .locator('[data-auth-code-cell]')
    .first()
    .evaluate((node) => {
      const match = getComputedStyle(node)
        .borderTopColor.replaceAll(' ', '')
        .match(/^rgba?\((\d+),(\d+),(\d+)/);
      return match
        ? `rgb(${match[1]}, ${match[2]}, ${match[3]})`
        : getComputedStyle(node).borderTopColor;
    });
  expect(cellBorder).toBe(errorBorder);
});

test('login validation error keeps a single shell border', async ({ page }) => {
  await mockApi(page, { 'GET /api/auth/me': anonymous });
  await page.goto('/login');
  const email = page.getByRole('textbox', {
    name: 'Электронная почта',
    exact: true,
  });
  await email.fill('not-an-email');
  await page.getByRole('button', { name: 'Войти', exact: true }).click();
  await expect(page.getByText('Введите корректный email')).toBeVisible();
  await email.click();
  await expect(email).toBeFocused();
  await expect
    .poll(async () => (await fieldChrome(email)).outlineStyle)
    .toBe('none');
  await expect
    .poll(async () => (await fieldChrome(email)).borderColor)
    .toBe(errorBorder);
});

test('disabled fields do not take a native ring', async ({ page }) => {
  await mockApi(page, {
    'GET /api/auth/me': { status: 200, body: { user: user(now) } },
    'GET /api/seller/profile': { status: 200, body: pendingProfile },
    'GET /api/author/application': { status: 200, body: pendingApplication },
  });
  await page.goto('/profile');
  // The profile form is single-line since the onboarding rework (3d9b4a87);
  // multiline field style is covered by figma-text-field-style.spec.
  const nickname = page
    .getByRole('textbox', { name: 'Никнейм', exact: true })
    .filter({ visible: true });
  const about = page
    .getByRole('textbox', { name: 'Коротко о себе', exact: true })
    .filter({ visible: true });
  await expect(nickname).toBeVisible();
  await expect(about).toBeVisible();
  await expect.poll(async () => nickname.evaluate(lockedField)).toBe(true);
  await expect.poll(async () => about.evaluate(lockedField)).toBe(true);
  await nickname.click({ force: true });
  await expect
    .poll(async () => (await fieldChrome(nickname)).outlineStyle)
    .toBe('none');
  await expect
    .poll(async () => (await fieldChrome(nickname)).borderColor)
    .toBe(disabledBorder);
  await about.click({ force: true });
  await expect
    .poll(async () => (await fieldChrome(about)).outlineStyle)
    .toBe('none');
  await expect
    .poll(async () => (await fieldChrome(about)).borderColor)
    .toBe(disabledBorder);
});
