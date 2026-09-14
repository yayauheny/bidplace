import { expect, type Locator } from '@playwright/test';

export async function fillControl(field: Locator, value: string) {
  await expect(async () => {
    await field.fill(value);
    await expect(field).toHaveValue(value);
  }).toPass({ timeout: 10_000 });
}
