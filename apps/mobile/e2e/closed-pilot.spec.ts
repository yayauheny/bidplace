import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { promisify } from 'node:util';
import { expect, test } from '@playwright/test';
import { publicProductDetailResponseSchema } from '@bidplace/contracts';

const execFileAsync = promisify(execFile);
const e2e = resolve(__dirname);
let state: {
  buyer: { email: string };
  outsider: { email: string };
  admin: { email: string };
  product: { publicId: string };
  listing: { id: string };
  order?: { publicId: string };
};

async function readOtp(): Promise<string | null> {
  try {
    const lines = (await readFile(resolve(e2e, '.email.jsonl'), 'utf8'))
      .trim()
      .split('\n');
    return JSON.parse(lines.at(-1) ?? '{}').code ?? null;
  } catch {
    return null;
  }
}

test.beforeAll(async () => {
  state = JSON.parse(await readFile(resolve(e2e, '.state.json'), 'utf8'));
});

test('buyer completes Product, OTP, Bid, Activity, and Order flow', async ({
  page,
  request,
}) => {
  const product = await request.get(
    `http://127.0.0.1:3001/api/products/${state.product.publicId}`,
  );
  expect(product.ok()).toBeTruthy();
  expect(
    publicProductDetailResponseSchema.safeParse(await product.json()).success,
  ).toBeTruthy();

  await page.goto(`/product/${state.product.publicId}`);
  await expect(page.getByText('E2E Product')).toBeVisible();
  await expect(page.getByText('Текущая цена: 10 BYN')).toBeVisible();
  await expect(page.getByText(/reserve|buy now|USD/i)).toHaveCount(0);

  await page.goto('/login');
  await page.getByLabel('Email').fill(state.buyer.email);
  await page.getByLabel('Пароль').fill('password123');
  await page.getByRole('button', { name: 'Войти' }).click();
  await expect
    .poll(() => page.context().cookies('http://127.0.0.1:3001'))
    .toHaveLength(1);
  await page.goto(`/product/${state.product.publicId}`);

  await page.getByPlaceholder('Ваша ставка в BYN').fill('11');
  await page.getByRole('button', { name: 'Сделать ставку' }).click();
  await expect(page.getByText('Ставка не принята.')).toBeVisible();
  const otpResponse = page.waitForResponse(
    'http://127.0.0.1:3001/api/auth/email/request',
  );
  await page.getByRole('button', { name: 'Отправить код' }).click();
  expect((await otpResponse).status()).toBe(201);
  await expect.poll(readOtp).not.toBeNull();
  await page.getByPlaceholder('000000').fill((await readOtp())!);
  await page.getByRole('button', { name: 'Подтвердить email' }).click();
  await page.getByRole('button', { name: 'Сделать ставку' }).click();
  await expect(page.getByText('Текущая цена: 11 BYN')).toBeVisible();

  await execFileAsync(process.execPath, [resolve(e2e, 'close-listing.mjs')]);
  state = JSON.parse(await readFile(resolve(e2e, '.state.json'), 'utf8'));
  await page.goto('/me/activity');
  await expect(page.getByText('E2E Product')).toBeVisible();
  await page.getByText(`Заказ: ${state.order!.publicId}`).click();
  await expect(page.getByText(`Заказ ${state.order!.publicId}`)).toBeVisible();

  await page.goto(`/order/${state.order!.publicId}`);
  await expect(page.getByText(state.buyer.email)).toBeVisible();
  await page.getByRole('button', { name: 'Отметить контакт' }).click();
  await expect(page.getByText('CONTACTED')).toBeVisible();
  await page.getByRole('button', { name: 'Передача завершена' }).click();
  await expect(page.getByText('COMPLETED')).toBeVisible();
});

test('outsider cannot open another buyer order and ordinary user cannot moderate', async ({
  browser,
  request,
}) => {
  const login = await request.post('http://127.0.0.1:3001/api/auth/login', {
    data: { email: state.outsider.email, password: 'password123' },
  });
  expect(login.ok()).toBeTruthy();
  const admin = await request.get('http://127.0.0.1:3001/api/admin/products', {
    headers: { cookie: login.headers()['set-cookie'] },
  });
  expect(admin.status()).toBe(403);

  const adminLogin = await request.post(
    'http://127.0.0.1:3001/api/auth/login',
    { data: { email: state.admin.email, password: 'password123' } },
  );
  expect(adminLogin.ok()).toBeTruthy();
  const permittedOrder = await request.get(
    `http://127.0.0.1:3001/api/orders/${state.order!.publicId}`,
    { headers: { cookie: adminLogin.headers()['set-cookie'] } },
  );
  expect(permittedOrder.ok()).toBeTruthy();

  const context = await browser.newContext({ baseURL: 'http://127.0.0.1:8081' });
  const page = await context.newPage();
  await page.goto('/login');
  await page.getByLabel('Email').fill(state.outsider.email);
  await page.getByLabel('Пароль').fill('password123');
  await page.getByRole('button', { name: 'Войти' }).click();
  await page.goto(`/order/${state.order!.publicId}`);
  await expect(page.getByText('Заказ недоступен')).toBeVisible();
  await context.close();
});

test('legacy auction route is absent', async ({ page }) => {
  await page.goto('/auctions/legacy');
  await expect(page.getByText('Unmatched Route')).toBeVisible();
});
