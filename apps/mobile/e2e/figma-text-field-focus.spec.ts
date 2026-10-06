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
  if (!(node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement)) return false;
  return node.disabled || node.readOnly || node.getAttribute('aria-disabled') === 'true';
}

async function fieldChrome(field: Locator) {
  return field.evaluate((node) => {
    const normalize = (value: string) => {
      const match = value.replaceAll(' ', '').match(/^rgba?\((\d+),(\d+),(\d+)/);
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

test('global input focus ring stays available outside FigmaTextField', async ({ page }) => {
  await mockApi(page, { 'GET /api/auth/me': anonymous });
  await page.goto('/login');
  await expect(page.getByRole('textbox', { name: 'Email', exact: true })).toBeVisible();
  await page.evaluate(() => {
    const probe = document.createElement('input');
    probe.setAttribute('aria-label', 'Глобальный контур');
    document.body.prepend(probe);
  });
  await page.keyboard.press('Tab');
  const probe = page.getByRole('textbox', { name: 'Глобальный контур' });
  await expect(probe).toBeFocused();
  const chrome = await fieldChrome(probe);
  expect(chrome.outlineStyle).not.toBe('none');
  expect(chrome.outlineWidth).toBe('2px');
});

test('field focus stays on the shell for click and tab', async ({ page }) => {
  await mockApi(page, { 'GET /api/auth/me': anonymous });
  await page.goto('/login');
  const email = page.getByRole('textbox', { name: 'Email', exact: true });
  await email.click();
  await expect(email).toBeFocused();
  await expect.poll(async () => (await fieldChrome(email)).outlineStyle).toBe('none');
  await expect.poll(async () => (await fieldChrome(email)).outlineWidth).toBe('0px');
  await expect.poll(async () => (await fieldChrome(email)).borderColor).toBe(focusBorder);

  await page.keyboard.press('Tab');
  const password = page.getByRole('textbox', { name: 'Пароль', exact: true });
  await expect(password).toBeFocused();
  await expect.poll(async () => (await fieldChrome(password)).outlineStyle).toBe('none');
  await expect.poll(async () => (await fieldChrome(password)).borderColor).toBe(focusBorder);

  await page.getByRole('link', { name: 'bidplace — на главную' }).focus();
  await page.keyboard.press('Tab');
  await expect(email).toBeFocused();
  await expect.poll(async () => (await fieldChrome(email)).borderColor).toBe(focusBorder);
  await expect.poll(async () => (await fieldChrome(email)).outlineStyle).toBe('none');
});

test('verification field keeps the error shell without a native ring', async ({ page }) => {
  await mockApi(page, {
    'GET /api/auth/me': { status: 200, body: { user: user(null) } },
  });
  await page.goto('/verify-email');
  const code = page.getByRole('textbox', { name: 'Код из письма' });
  await expect(code).toBeVisible();
  await code.click();
  await code.fill('123');
  await page.getByRole('button', { name: 'Подтвердить', exact: true }).click();
  await expect(page.getByText('Введите шестизначный код.')).toBeVisible();
  await code.click();
  await expect(code).toBeFocused();
  await expect.poll(async () => (await fieldChrome(code)).outlineStyle).toBe('none');
  await expect.poll(async () => (await fieldChrome(code)).borderColor).toBe(errorBorder);
});

test('login validation error keeps a single shell border', async ({ page }) => {
  await mockApi(page, { 'GET /api/auth/me': anonymous });
  await page.goto('/login');
  const email = page.getByRole('textbox', { name: 'Email', exact: true });
  await email.fill('not-an-email');
  await page.getByRole('button', { name: 'Войти', exact: true }).click();
  await expect(page.getByText('Введите корректный email')).toBeVisible();
  await email.click();
  await expect(email).toBeFocused();
  await expect.poll(async () => (await fieldChrome(email)).outlineStyle).toBe('none');
  await expect.poll(async () => (await fieldChrome(email)).borderColor).toBe(errorBorder);
});

test('disabled single-line and multiline fields do not take a native ring', async ({ page }) => {
  await mockApi(page, {
    'GET /api/auth/me': { status: 200, body: { user: user(now) } },
    'GET /api/seller/profile': { status: 200, body: pendingProfile },
    'GET /api/author/application': { status: 200, body: pendingApplication },
  });
  await page.goto('/profile');
  const nickname = page.getByRole('textbox', { name: 'Никнейм *' }).filter({ visible: true });
  const about = page.getByRole('textbox', { name: 'Короткое описание *' }).filter({ visible: true });
  await expect(nickname).toBeVisible();
  await expect(about).toBeVisible();
  await expect.poll(async () => nickname.evaluate(lockedField)).toBe(true);
  await expect.poll(async () => about.evaluate(lockedField)).toBe(true);
  await nickname.click({ force: true });
  await expect.poll(async () => (await fieldChrome(nickname)).outlineStyle).toBe('none');
  await expect.poll(async () => (await fieldChrome(nickname)).borderColor).toBe(disabledBorder);
  await about.click({ force: true });
  await expect.poll(async () => (await fieldChrome(about)).outlineStyle).toBe('none');
  await expect.poll(async () => (await fieldChrome(about)).borderColor).toBe(disabledBorder);
  expect(await about.evaluate((node) => node.tagName)).toBe('TEXTAREA');
});
