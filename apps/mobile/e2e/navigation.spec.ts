import { expect, test } from '@playwright/test';

test('desktop rail keeps the active catalog link visible', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');

  const catalogLink = page.getByRole('link', { name: 'Каталог' });
  await expect(catalogLink).toBeVisible();
  await expect(catalogLink).toHaveAttribute('href', '/');
  await expect(catalogLink).toHaveCSS('min-height', '44px');
  expect(consoleErrors.filter((message) => message.includes('accessible'))).toEqual([]);
});
