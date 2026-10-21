import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import {
  installAccountPresentation,
  openPresentationAccount,
} from './support/account-presentation-fixture';

const evidence =
  process.env.ACCOUNT_EVIDENCE_DIR || '/tmp/bidplace-account-final';
test('account reference and responsive presentation', async ({
  page,
}, info) => {
  const requests = await installAccountPresentation(page);
  await mkdir(evidence, { recursive: true });
  const measurements = [];
  for (const width of [390, 320, 414, 440]) {
    await page.setViewportSize({ width, height: 750 });
    await openPresentationAccount(page);
    const root = page.getByTestId('form-page');
    const cta = root.getByRole('link', { name: 'Стать автором' });
    const row = await cta.evaluate((node) => {
      const cta = node.getBoundingClientRect();
      const name = [
        ...document.querySelectorAll('[data-testid="form-page"] *'),
      ].find(
        (el) => el.textContent === 'Илья Васильев' && !el.firstElementChild,
      );
      const handle = [
        ...document.querySelectorAll('[data-testid="form-page"] *'),
      ].find((el) => el.textContent === '@vex' && !el.firstElementChild);
      return {
        cta: cta.toJSON(),
        name: name?.getBoundingClientRect().toJSON(),
        handle: handle?.getBoundingClientRect().toJSON(),
        overflow:
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      };
    });
    measurements.push({ width, ...row });
    expect(row.overflow).toBeLessThanOrEqual(1);
    expect(row.cta.width).toBeLessThan(width - row.cta.x - 12);
    if (width === 390) {
      expect(row.cta.x).toBeCloseTo(120, 0);
      expect(row.cta.height).toBe(43);
      expect(row.name?.x).toBeCloseTo(124, 0);
      const avatar = await page.getByTestId('account-avatar').boundingBox();
      expect(avatar?.width).toBe(100);
      expect(avatar?.height).toBe(100);
    }
    await page.screenshot({
      path: resolve(evidence, `${info.project.name}-account-${width}.png`),
    });
  }
  await writeFile(
    resolve(evidence, `${info.project.name}-measurements.json`),
    JSON.stringify(measurements, null, 2),
  );
  await page.setViewportSize({ width: 390, height: 750 });
  await page.getByRole('button', { name: 'Настройки', exact: true }).click();
  await expect(page).toHaveURL(/account\/settings$/);
  const title = await page
    .getByText('Настройки', { exact: true })
    .boundingBox();
  expect(title).not.toBeNull();
  expect(title!.x + title!.width / 2).toBeCloseTo(195, 0);
  await page.screenshot({
    path: resolve(evidence, `${info.project.name}-settings.png`),
  });
  await page.getByRole('button', { name: 'Закрыть настройки' }).click();
  await expect(page).toHaveURL(/\/account$/);
  await page.getByRole('button', { name: 'Назад', exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  expect(requests['/api/seller/profile']).toBe(4);
});

test('published identity and scroll remain usable with many works', async ({
  page,
}, info) => {
  await installAccountPresentation(page, { author: true, works: 8 });
  await page.setViewportSize({ width: 390, height: 568 });
  await openPresentationAccount(page);
  const root = page.getByTestId('form-page');
  await expect(
    root.getByText('Неопубликованная редакция', { exact: true }),
  ).toHaveCount(0);
  await mkdir(evidence, { recursive: true });
  await page.screenshot({
    path: resolve(evidence, `${info.project.name}-account-filled.png`),
  });
  const caption = root.getByText('Илья Васильев', { exact: true }).nth(1);
  await expect(caption).toHaveCSS('letter-spacing', '-0.14px');
  const last = root
    .getByRole('link', { name: 'Редактировать', exact: true })
    .last();
  await last.scrollIntoViewIfNeeded();
  const box = await last.boundingBox();
  expect(box).not.toBeNull();
  const dock = await page.getByTestId('figma-floating-dock').boundingBox();
  expect(dock).not.toBeNull();
  expect(box!.y + box!.height).toBeLessThanOrEqual(dock!.y);
  await mkdir(evidence, { recursive: true });
  await page.screenshot({
    path: resolve(evidence, `${info.project.name}-account-scroll.png`),
  });
});

test('long account identity wraps and unverified users can open settings', async ({
  page,
}, info) => {
  await installAccountPresentation(page, { longName: true, unverified: true });
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('/account');
  const identity = page.getByTestId('account-identity');
  await expect(identity.getByText(/автор длинного названия/)).toBeVisible();
  const action = identity.getByRole('link', { name: 'Стать автором' });
  await expect(action).toBeVisible();
  const box = await action.boundingBox();
  expect(box!.x + box!.width).toBeLessThanOrEqual(308);
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
  await page.screenshot({
    path: resolve(evidence, `${info.project.name}-account-long.png`),
  });
  await page.getByRole('button', { name: 'Настройки', exact: true }).click();
  await expect(page).toHaveURL(/account\/settings$/);
  await expect(
    page.getByRole('button', { name: 'Публичный профиль', exact: true }),
  ).toBeVisible();
});
