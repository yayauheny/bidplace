import { expect, test, type Page } from '@playwright/test';

// Computed-focus chain: ThemeProvider mirrors the active `focus` role onto
// :root as --bidplace-focus (global.css), and the global focus ring rule
// consumes it. jsdom cannot resolve var() in getComputedStyle, so this spec
// is the browser evidence for the real computed outline color per theme.

const lightFocus = 'rgb(18, 18, 18)';
const blackFocus = 'rgb(255, 255, 255)';

async function mockAnonymous(page: Page) {
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if (url.port !== '3001') {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Unauthorized' }),
    });
  });
}

test('computed focus ring follows the mirrored theme variable', async ({
  page,
}) => {
  await mockAnonymous(page);
  await page.goto('/login');
  await expect(
    page.getByRole('textbox', { name: 'Электронная почта', exact: true }),
  ).toBeVisible();
  // Same probe pattern as figma-text-field-focus.spec: the login sheet traps
  // focus in a Radix scope, so the probe lives inside the sheet.
  await page.evaluate(() => {
    const probe = document.createElement('input');
    probe.type = 'text';
    probe.setAttribute('aria-label', 'Контур темы');
    document.querySelector('[role="dialog"]')?.prepend(probe);
  });
  const probe = page.getByRole('textbox', { name: 'Контур темы' });
  for (let step = 0; step < 6; step += 1) {
    if (await probe.evaluate((node) => node === document.activeElement)) break;
    await page.keyboard.press('Tab');
  }
  await expect(probe).toBeFocused();

  const outlineColor = () =>
    probe.evaluate(
      (node) => getComputedStyle(node).outlineColor || 'outline: none',
    );

  // Light is the initial :root value and the mirrored default.
  await expect
    .poll(async () => (await outlineColor()).replaceAll(' ', ''))
    .toBe(lightFocus.replaceAll(' ', ''));

  // Mirror the black theme the same way ThemeProvider does (attribute plus
  // the inline variable, which wins over the attribute rule by cascade) and
  // read the resolved var() again — no per-element inline style involved.
  await page.evaluate(() => {
    document.documentElement.dataset.bidplaceTheme = 'black';
    document.documentElement.style.setProperty('--bidplace-focus', '#ffffff');
  });
  await expect
    .poll(async () => (await outlineColor()).replaceAll(' ', ''))
    .toBe(blackFocus.replaceAll(' ', ''));

  await page.evaluate(() => {
    delete document.documentElement.dataset.bidplaceTheme;
    document.documentElement.style.setProperty('--bidplace-focus', '#121212');
  });
  await expect
    .poll(async () => (await outlineColor()).replaceAll(' ', ''))
    .toBe(lightFocus.replaceAll(' ', ''));

  await page.evaluate(() => {
    const probe = document.createElement('div');
    probe.setAttribute('role', 'switch');
    probe.tabIndex = 0;
    probe.setAttribute('aria-label', 'Контур переключателя');
    document.activeElement?.after(probe);
  });
  const switchProbe = page.getByRole('switch', {
    name: 'Контур переключателя',
  });
  await page.keyboard.press('Tab');
  await expect(switchProbe).toBeFocused();
  const switchOutline = () =>
    switchProbe.evaluate((node) => {
      const style = getComputedStyle(node);
      return {
        color: style.outlineColor.replaceAll(' ', ''),
        width: style.outlineWidth,
        offset: style.outlineOffset,
        line: style.outlineStyle,
      };
    });
  await expect.poll(switchOutline).toEqual({
    color: lightFocus.replaceAll(' ', ''),
    width: '2px',
    offset: '2px',
    line: 'solid',
  });
  await page.evaluate(() => {
    document.documentElement.dataset.bidplaceTheme = 'black';
    document.documentElement.style.setProperty('--bidplace-focus', '#ffffff');
  });
  await expect.poll(switchOutline).toEqual({
    color: blackFocus.replaceAll(' ', ''),
    width: '2px',
    offset: '2px',
    line: 'solid',
  });
});
