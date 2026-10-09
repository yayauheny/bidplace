import { expect, type Locator } from '@playwright/test';

export async function fillControl(field: Locator, value: string) {
  await expect(async () => {
    await field.fill(value);
    await expect(field).toHaveValue(value);
  }).toPass({ timeout: 10_000 });
}

export async function expectPasswordVisibility(field: Locator) {
  const value = await field.inputValue();
  await field.focus();
  await field.evaluate((input) => {
    if (!(input instanceof HTMLInputElement)) throw new Error('Expected a password input');
    input.setSelectionRange(2, 4);
  });
  await field.press('Shift+ArrowRight');
  await expect.poll(() => field.evaluate((input) => {
    if (!(input instanceof HTMLInputElement)) throw new Error('Expected a password input');
    return { start: input.selectionStart, end: input.selectionEnd };
  })).toEqual({ start: 2, end: 5 });
  for (const visible of [true, false, true, false]) {
    await field.locator('..').getByRole('button', {
      name: visible ? 'Показать пароль' : 'Скрыть пароль', exact: true,
    }).click();
    await expect(field).toHaveJSProperty('type', visible ? 'text' : 'password');
    await expect(field).toHaveValue(value);
    await expect(field).toBeFocused();
    await expect.poll(() => field.evaluate((input) => {
      if (!(input instanceof HTMLInputElement)) throw new Error('Expected a password input');
      return { start: input.selectionStart, end: input.selectionEnd };
    })).toEqual({ start: 2, end: 5 });
  }
  await field.press('ArrowRight');
  await field.press('x');
  await expect(field).toHaveValue(`${value.slice(0, 5)}x${value.slice(5)}`);
  await field.fill(value);
}
