import { expect, test } from '@playwright/test';

test('floating dock keeps the Figma glass surface and live backdrop blur', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/login');

  const dock = page.getByTestId('figma-floating-dock');
  await expect(dock).toBeVisible();

  const glass = await dock.evaluate((element) => {
    const style = getComputedStyle(element);
    const strokeStyle = getComputedStyle(element, '::before');
    const bounds = element.getBoundingClientRect();

    return {
      backdropFilter:
        style.backdropFilter ||
        (style as CSSStyleDeclaration & { webkitBackdropFilter?: string })
          .webkitBackdropFilter,
      backgroundColor: style.backgroundColor,
      strokeBackgroundImage: strokeStyle.backgroundImage,
      boxShadow: style.boxShadow,
      height: bounds.height,
      width: bounds.width,
      parentClass: element.parentElement?.className,
      portaledToBody: element.parentElement?.parentElement === document.body,
    };
  });

  expect(glass.backdropFilter).toBe('blur(6px)');
  expect(glass.backgroundColor).toBe('rgba(255, 255, 255, 0.6)');
  expect(glass.strokeBackgroundImage).toContain('rgb(222, 222, 222)');
  expect(glass.strokeBackgroundImage).toContain('rgb(243, 243, 243)');
  expect(glass.boxShadow).toBe('none');
  expect(glass.height).toBe(64);
  expect(glass.width).toBe(232);
  expect(glass.parentClass).toBe('figma-dock-layer');
  expect(glass.portaledToBody).toBe(true);

  await dock.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    const probe = document.createElement('div');
    probe.dataset.testid = 'dock-blur-probe';
    Object.assign(probe.style, {
      position: 'fixed',
      left: `${bounds.left}px`,
      top: `${bounds.top}px`,
      width: `${bounds.width}px`,
      height: `${bounds.height}px`,
      zIndex: '19',
      background: 'repeating-linear-gradient(90deg, #111 0 2px, #fff 2px 4px)',
    });
    document.body.insertBefore(probe, element.parentElement);
  });

  const withBlur = await dock.screenshot();
  await dock.evaluate((element) => {
    element.style.backdropFilter = 'none';
    (
      element.style as CSSStyleDeclaration & {
        webkitBackdropFilter?: string;
      }
    ).webkitBackdropFilter = 'none';
  });
  const withoutBlur = await dock.screenshot();

  expect(withBlur.equals(withoutBlur)).toBe(false);
});
