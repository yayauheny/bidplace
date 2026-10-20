import { expect, type Page, type Locator } from '@playwright/test';

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
    if (!(input instanceof HTMLInputElement))
      throw new Error('Expected a password input');
    input.setSelectionRange(2, 4);
  });
  await field.press('Shift+ArrowRight');
  await expect
    .poll(() =>
      field.evaluate((input) => {
        if (!(input instanceof HTMLInputElement))
          throw new Error('Expected a password input');
        return { start: input.selectionStart, end: input.selectionEnd };
      }),
    )
    .toEqual({ start: 2, end: 5 });
  for (const visible of [true, false, true, false]) {
    await field
      .locator('..')
      .getByRole('button', {
        name: visible ? 'Показать пароль' : 'Скрыть пароль',
        exact: true,
      })
      .click();
    await expect(field).toHaveJSProperty('type', visible ? 'text' : 'password');
    await expect(field).toHaveValue(value);
    await expect(field).toBeFocused();
    await expect
      .poll(() =>
        field.evaluate((input) => {
          if (!(input instanceof HTMLInputElement))
            throw new Error('Expected a password input');
          return { start: input.selectionStart, end: input.selectionEnd };
        }),
      )
      .toEqual({ start: 2, end: 5 });
  }
  await field.press('ArrowRight');
  await field.press('x');
  await expect(field).toHaveValue(`${value.slice(0, 5)}x${value.slice(5)}`);
  await field.fill(value);
}

export async function selectCalendarMonth(
  page: Page,
  label: string,
  year: number,
  month: number,
) {
  await page.getByRole('button', { name: label, exact: true }).click();
  const dialog = page.getByRole('dialog', { name: label, exact: true });
  const yearField = dialog.getByLabel('Год календаря', { exact: true });
  await yearField.fill(String(year));
  await yearField.press('Tab');
  await dialog
    .getByLabel('Месяц календаря', { exact: true })
    .selectOption(String(month));
  await dialog
    .getByRole('button', { name: 'Только месяц, без точного дня', exact: true })
    .click();
  await expect(
    dialog.getByText(
      `Выбрано: ${String(month).padStart(2, '0')}.${String(year).padStart(4, '0')}`,
      { exact: true },
    ),
  ).toBeVisible();
  await dialog.getByRole('button', { name: 'Выбрать', exact: true }).click();
}
