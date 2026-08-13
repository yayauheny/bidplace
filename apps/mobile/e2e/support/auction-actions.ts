import { expect, type Page } from '@playwright/test';

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function expectCurrentPrice(page: Page, amount: string) {
  const formattedAmount = Number(amount).toLocaleString('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  await expect(page.locator('body')).toContainText(
    new RegExp(`Ставка\\s*${escapeRegExp(formattedAmount)}\\s*BYN`),
  );
}

export async function openBidDialog(page: Page) {
  const amountField = page.getByLabel('Ваша ставка, BYN');
  const openDialog = page.getByRole('dialog');
  if (await openDialog.isVisible()) {
    await expect(amountField).toBeVisible();
    return amountField;
  }
  if (!(await amountField.isVisible())) {
    const desktopAction = page.getByRole('button', { name: 'Поставить' });
    const mobileAction = page.getByRole('button', {
      name: 'Сделать ставку',
    });
    const trigger = (await desktopAction.isVisible())
      ? desktopAction
      : mobileAction;
    await trigger.click();
  }
  await expect(openDialog).toBeVisible();
  await expect(amountField).toBeVisible();
  return amountField;
}

export async function confirmBidWithSlider(page: Page) {
  const slider = page.getByTestId('slide-to-bid');
  await expect(slider).toBeVisible();
  const box = await slider.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.move(box!.x + 12, box!.y + box!.height / 2);
  await page.mouse.down();
  await page.mouse.move(box!.x + box!.width - 8, box!.y + box!.height / 2);
  await page.mouse.up();
}

export async function placeBid(page: Page, amount: string) {
  const amountField = await openBidDialog(page);
  await amountField.fill(amount);
  await confirmBidWithSlider(page);
}
